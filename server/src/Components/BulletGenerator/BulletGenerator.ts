import {
  Collider,
  QueryFilterFlags,
  Ray,
  RigidBody,
  World,
} from "@dimforge/rapier2d-compat";

import { Character } from "../Character/Character";
import { Bot } from "../Bots/Bots";
import { Room } from "colyseus";
import { GameState } from "../../rooms/schema/GameRoomState";

interface Snapshot {
  timestamp: number;
  positions: Map<string, { x: number; y: number }>;
}

// ── Tuning constants ────────────────────────────────────────────────────────
const MAX_LAG_MS = 250;
const MAX_EXTRAPOLATION_MS = 80; // ← New: small safe extrapolation
const BULLET_SPAWN_OFFSET = 48;
const HURT_BOX_RADIUS = 30;
const BULLET_DAMAGE = 30;
// ────────────────────────────────────────────────────────────────────────────

export class BulletGenerator {
  world: World;
  allBullets: { angle: number; rb: RigidBody }[] = [];

  constructor(world: World) {
    this.world = world;
  }

  createBullet(
    player: Character | Bot,
    players: { [key: string]: Character | Bot },
    state: GameState,
    clientShootTimestamp: number,
    angle: number,
    shooterId: string,
    room: Room,
    time: number,
  ) {
    const serverTime = Date.now();
    const RAY_MAX_DIST = player.weapon.range;

    // 1. Sanitize client timestamp (prevent cheating + allow small extrapolation)
    let targetTime = Math.max(serverTime - MAX_LAG_MS, clientShootTimestamp);
    targetTime = Math.min(targetTime, serverTime + MAX_EXTRAPOLATION_MS);

    // 2. Prepare snapshots (convert once)
    const snapshots: Snapshot[] = Array.from(state.snapshots).map(
      (snap: any) => ({
        timestamp: snap.timestamp,
        positions:
          snap.positions instanceof Map
            ? snap.positions
            : new Map(Object.entries(snap.positions)),
      }),
    );

    if (snapshots.length === 0) {
      console.warn("[BulletGenerator] Snapshot buffer empty");
      return;
    }

    const { s1, s2, t } = this.getInterpolatedSnapshots(snapshots, targetTime);

    if (!s1 || !s2) {
      console.warn("[BulletGenerator] No valid snapshots for time", targetTime);
      return;
    }

    // 3. Rewind all player positions
    const rewoundPositions = new Map<string, { x: number; y: number }>();

    for (const [id, entity] of Object.entries(players)) {
      const pos1 = s1.positions.get(id);
      const pos2 = s2.positions.get(id);

      if (pos1 && pos2) {
        const x = pos1.x + (pos2.x - pos1.x) * t;
        const y = pos1.y + (pos2.y - pos1.y) * t;
        rewoundPositions.set(id, { x, y });
      } else {
        // Fallback for players without history
        const current = entity.rigidBody.translation();
        rewoundPositions.set(id, { x: current.x, y: current.y });
      }
    }

    // 4. Build ray from rewound shooter position
    const shooterPos = rewoundPositions.get(shooterId);
    if (!shooterPos) {
      console.warn("[BulletGenerator] Shooter not found in rewound positions");
      return;
    }

    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);

    const rayOrigin = {
      x: shooterPos.x + cosA * BULLET_SPAWN_OFFSET,
      y: shooterPos.y + sinA * BULLET_SPAWN_OFFSET,
    };

    const rayDir = { x: cosA, y: sinA };

    // 5. Ray vs Circle hit detection (rewound players)
    let closestHit: {
      id: string;
      toi: number;
      point: { x: number; y: number };
    } | null = null;

    for (const [id] of Object.entries(players)) {
      if (id === shooterId) continue;

      const targetPos = rewoundPositions.get(id);
      if (!targetPos) continue;

      const ox = rayOrigin.x - targetPos.x;
      const oy = rayOrigin.y - targetPos.y;

      const b = 2 * (rayDir.x * ox + rayDir.y * oy);
      const c = ox * ox + oy * oy - HURT_BOX_RADIUS * HURT_BOX_RADIUS;
      const discriminant = b * b - 4 * c;

      if (discriminant < 0) continue;

      const sqrtDisc = Math.sqrt(discriminant);
      let toi0 = (-b - sqrtDisc) / 2;
      let toi1 = (-b + sqrtDisc) / 2;

      if (toi1 < 0) continue; // entirely behind ray

      const toi = toi0 >= 0 ? toi0 : toi1;
      if (toi > RAY_MAX_DIST) continue;

      if (!closestHit || toi < closestHit.toi) {
        closestHit = {
          id,
          toi,
          point: {
            x: rayOrigin.x + rayDir.x * toi,
            y: rayOrigin.y + rayDir.y * toi,
          },
        };
      }
    }

    // 6. Rapier raycast for static walls (no rewind needed)
    const wallRay = new Ray(rayOrigin, rayDir);

    const wallHit = this.world.castRay(
      wallRay,
      RAY_MAX_DIST,
      true,
      QueryFilterFlags.EXCLUDE_SENSORS,
      undefined,
      undefined,
      undefined,
      (collider: Collider) => {
        const userData = collider.parent()?.userData as any;
        if (userData.teamid === player.teamid) return false;
        return userData?.type === "WALL"; // Cleaned up
      },
    );

    const wallDist = wallHit ? wallHit.timeOfImpact : RAY_MAX_DIST;

    // 7. Resolve hit
    if (closestHit && closestHit.toi < wallDist) {
      const hitPlayer = players[closestHit.id];
      if (hitPlayer) {
        if (hitPlayer.teamid !== player.teamid) {
          hitPlayer.health -= player.weapon.damage;
          hitPlayer.justTookDamage = true;
          hitPlayer.lastTakeDamageTime = time;
        }
        room.broadcast("bullet_shot", {
          shooterId,
          rayOrigin, // ← Improved: send rewound origin
          angle,
          toi: closestHit.toi,
          hitType: "player",
          hitId: closestHit.id,
        });
      }
    } else if (wallHit) {
      room.broadcast("bullet_shot", {
        shooterId,
        rayOrigin,
        angle,
        toi: wallDist,
        hitType: "wall",
      });
    } else {
      // Complete miss / long tracer
      room.broadcast("bullet_shot", {
        shooterId,
        rayOrigin,
        angle,
        toi: RAY_MAX_DIST,
        hitType: "miss",
      });
    }
  }

  // ─── Improved Interpolation with Extrapolation ─────────────────────────────
  getInterpolatedSnapshots(snapshots: Snapshot[], targetTime: number) {
    if (snapshots.length === 0) {
      return { s1: null, s2: null, t: 0 };
    }

    const oldest = snapshots[0];
    const newest = snapshots[snapshots.length - 1];

    // Clamp to oldest
    if (targetTime <= oldest.timestamp) {
      return { s1: oldest, s2: oldest, t: 0 };
    }

    // Extrapolate from newest snapshot
    if (targetTime >= newest.timestamp) {
      const dt = targetTime - newest.timestamp;
      if (dt > MAX_EXTRAPOLATION_MS) {
        return { s1: newest, s2: newest, t: 0 };
      }
      // For pure extrapolation we return the same snapshot with t=0
      // (you could improve this later by storing velocity if needed)
      return { s1: newest, s2: newest, t: 0 };
    }

    // Binary search for bracketing snapshots
    let lo = 0;
    let hi = snapshots.length - 2;

    while (lo <= hi) {
      const mid = (lo + hi) >>> 1;
      if (snapshots[mid + 1].timestamp < targetTime) {
        lo = mid + 1;
      } else if (snapshots[mid].timestamp > targetTime) {
        hi = mid - 1;
      } else {
        lo = mid;
        break;
      }
    }

    const s1 = snapshots[lo];
    const s2 = snapshots[lo + 1];
    const t = (targetTime - s1.timestamp) / (s2.timestamp - s1.timestamp);

    return { s1, s2, t: Math.max(0, Math.min(1, t)) }; // clamp t
  }

  // ─── Other methods ───────────────────────────────────────────────────────
  simulateBullets() {
    // ... your existing code
  }

  destroyBullet(id: string, thingsToDestroy: RigidBody[]) {
    const index = this.allBullets.findIndex(
      (b) => (b.rb.userData as any)?.id === id,
    );

    if (index !== -1) {
      thingsToDestroy.push(this.allBullets[index].rb);
      this.allBullets.splice(index, 1);
      return id;
    }
    return undefined;
  }
}
