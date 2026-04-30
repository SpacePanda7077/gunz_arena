import { Collider, Ray, RigidBody, World } from "@dimforge/rapier2d-compat";

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
const BULLET_SPAWN_OFFSET = 48;
const RAY_MAX_DIST = 500;
const HURT_BOX_RADIUS = 30; // match your hurtbox collider radius exactly
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
  ) {
    // ─── 1. SANITIZE CLIENT TIMESTAMP ──────────────────────────────────────
    const serverTime = Date.now();
    const validatedTime = Math.max(
      serverTime - MAX_LAG_MS,
      clientShootTimestamp,
    );

    // ─── 2. FIND SURROUNDING SNAPSHOTS ─────────────────────────────────────
    // Convert Colyseus ArraySchema → plain array so getInterpolatedSnapshots
    // can index it normally. Each snapshot's positions MapSchema is also
    // converted to a native Map so .get() works reliably.
    const snapshots: Snapshot[] = Array.from(state.snapshots).map(
      (snap: any) => ({
        timestamp: snap.timestamp,
        positions:
          snap.positions instanceof Map
            ? snap.positions
            : new Map(Object.entries(snap.positions)), // handles MapSchema → Map
      }),
    );

    if (snapshots.length === 0) {
      console.warn("[createBullet] Snapshot buffer is empty — skipping shot");
      return;
    }

    const { s1, s2, t } = this.getInterpolatedSnapshots(
      snapshots,
      validatedTime,
    );

    if (!s1 || !s2) {
      console.warn(
        "[createBullet] No valid snapshot pair for timestamp",
        validatedTime,
      );
      return;
    }

    // ─── 3. REWIND ALL PLAYER POSITIONS ────────────────────────────────────
    const clampedT = Math.min(1, Math.max(0, t)); // guard against float drift
    const rewoundPositions = new Map<string, { x: number; y: number }>();

    for (const [id, p] of Object.entries(players)) {
      const pos1 = s1.positions.get(id);
      const pos2 = s2.positions.get(id);

      if (pos1 && pos2) {
        rewoundPositions.set(id, {
          x: pos1.x + (pos2.x - pos1.x) * clampedT,
          y: pos1.y + (pos2.y - pos1.y) * clampedT,
        });
      } else {
        // Player joined mid-game and has no snapshot — use current position
        const cur = p.hurtBox_rigidBody.translation();
        rewoundPositions.set(id, { x: cur.x, y: cur.y });
      }
    }

    // ─── 4. BUILD RAY FROM REWOUND SHOOTER POSITION ────────────────────────
    const shooterPos = rewoundPositions.get(shooterId);
    if (!shooterPos) {
      console.warn(
        "[createBullet] Shooter missing from rewound positions",
        shooterId,
      );
      return;
    }

    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);

    const rayOrigin = {
      x: shooterPos.x + cosA * BULLET_SPAWN_OFFSET,
      y: shooterPos.y + sinA * BULLET_SPAWN_OFFSET,
    };
    const rayDir = { x: cosA, y: sinA }; // unit vector — no normalization needed

    // ─── 5. RAY vs CIRCLE HIT DETECTION (no physics engine involved) ────────
    //
    // For a ray  P(s) = origin + s·dir  and circle centered at C with radius r:
    //   let o = origin - C
    //   a·s² + b·s + c = 0   where a=1 (dir is unit), b=2·dot(dir,o), c=|o|²-r²
    //   discriminant = b²-4c
    //   s_entry = (-b - √disc) / 2
    //   s_exit  = (-b + √disc) / 2
    // ────────────────────────────────────────────────────────────────────────
    let closestHit: {
      id: string;
      toi: number;
      point: { x: number; y: number };
    } | null = null;

    for (const [id] of Object.entries(players)) {
      if (id === shooterId) continue; // shooter can't shoot themselves

      const targetPos = rewoundPositions.get(id);
      if (!targetPos) continue;

      const ox = rayOrigin.x - targetPos.x;
      const oy = rayOrigin.y - targetPos.y;

      const b = 2 * (rayDir.x * ox + rayDir.y * oy);
      const c = ox * ox + oy * oy - HURT_BOX_RADIUS * HURT_BOX_RADIUS;
      const discriminant = b * b - 4 * c; // a = 1

      if (discriminant < 0) continue; // ray misses this circle

      const sqrtDisc = Math.sqrt(discriminant);
      const toi0 = (-b - sqrtDisc) / 2; // entry point distance
      const toi1 = (-b + sqrtDisc) / 2; // exit  point distance

      if (toi1 < 0) continue; // circle is entirely behind the ray

      // If entry is behind ray origin, we started inside — use exit instead
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

    // ─── 6. RAPIER RAY FOR STATIC WALLS / TERRAIN ──────────────────────────
    // Static geometry never moves so no rewind is needed.
    // Construct a fresh Ray — origin/dir fields are not safely reassignable
    // on all versions of rapier2d-compat.
    const wallRay = new Ray(rayOrigin, rayDir);

    const wallHit = this.world.castRay(
      wallRay,
      RAY_MAX_DIST,
      true, // solid: stop if ray starts inside a shape
      undefined, // filterFlags
      undefined, // filterGroups
      undefined, // filterExcludeCollider
      undefined, // filterExcludeRigidBody
      (col: Collider) => {
        const userData: any = col.parent()?.userData;
        // ⚠️  Change "STATIC" to whatever tag your wall/terrain bodies use
        if (!userData || userData.type !== "WALL") return false;
        if (userData.type === "RIGIDBODY") return false;
        return true;
      },
    );

    const wallDist = wallHit ? wallHit.timeOfImpact : RAY_MAX_DIST;

    // ─── 7. RESOLVE: PLAYER HIT vs WALL HIT ────────────────────────────────
    if (closestHit && closestHit.toi < wallDist) {
      // Player is closer than the first wall → confirmed hit
      const hitPlayer = players[closestHit.id];
      if (!hitPlayer) return;

      hitPlayer.health -= BULLET_DAMAGE;

      // Broadcast to room — add your own event name / payload shape
      room.broadcast("bullet_shot", {
        shooterId,
        pos: player.rigidBody.translation(),
        angle,
        toi: closestHit.toi,
      });
    } else if (wallHit) {
      const hitPoint = {
        x: rayOrigin.x + rayDir.x * wallDist,
        y: rayOrigin.y + rayDir.y * wallDist,
      };
      // Optionally broadcast wall impact for client-side VFX
      room.broadcast("bullet_shot", {
        shooterId,
        pos: player.rigidBody.translation(),
        angle,
        toi: wallDist,
      });
    } else {
      // Complete miss — optionally broadcast for tracer VFX
      room.broadcast("bullet_shot", {
        shooterId,
        pos: player.rigidBody.translation(),
        angle,
        toi: RAY_MAX_DIST,
      });
    }
  }

  // ─── SNAPSHOT INTERPOLATION ───────────────────────────────────────────────
  getInterpolatedSnapshots(snapshots: Snapshot[], targetTime: number) {
    if (snapshots.length === 0) {
      return { s1: null, s2: null, t: 0 };
    }

    // Clamp to oldest snapshot
    if (targetTime <= snapshots[0].timestamp) {
      return { s1: snapshots[0], s2: snapshots[0], t: 0 };
    }

    // Clamp to newest snapshot
    if (targetTime >= snapshots[snapshots.length - 1].timestamp) {
      const last = snapshots[snapshots.length - 1];
      return { s1: last, s2: last, t: 0 };
    }

    // Binary search for the surrounding pair — O(log n) vs the old O(n) loop
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

    return { s1, s2, t };
  }

  // ─── PHYSICS BULLET SIMULATION (unchanged) ───────────────────────────────
  simulateBullets() {
    this.allBullets.forEach((bullet) => {
      if (bullet) {
        bullet.rb.setLinvel(
          {
            x: Math.cos(bullet.angle) * 2000,
            y: Math.sin(bullet.angle) * 2000,
          },
          true,
        );
      }
    });
  }

  detroyBullet(id: string, thingsToDestroy: RigidBody[]) {
    const rbIndex = this.allBullets.findIndex(
      (b) => (b.rb.userData as any).id === id,
    );

    if (rbIndex !== -1) {
      thingsToDestroy.push(this.allBullets[rbIndex].rb);
      this.allBullets.splice(rbIndex, 1);
      return id;
    }

    return undefined;
  }
}
