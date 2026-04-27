import {
  ActiveCollisionTypes,
  ActiveEvents,
  ColliderDesc,
  QueryFilterFlags,
  Ray,
  RigidBody,
  RigidBodyDesc,
  World,
} from "@dimforge/rapier2d-compat";

import uniqid from "uniqid";
import { DistanceBetween } from "../../Helper/Math/Math";
import { Character } from "../Character/Character";
import { Bot } from "../Bots/Bots";
import { Room } from "colyseus";

export class BulletGenerator {
  world: World;
  allBullets: { angle: number; rb: RigidBody }[] = [];
  constructor(world: World) {
    this.world = world;
  }
  createBullet(
    player: Character | Bot,
    players: { [key: string]: Character | Bot },
    angle: number,
    id: string,
    room: Room,
  ) {
    const position = player.rigidBody.translation();
    const spawnpos = {
      x: position.x + Math.cos(angle) * 50,
      y: position.y + Math.sin(angle) * 50,
    };
    const ray = player.bulletRay;
    ray.origin = spawnpos;
    ray.dir = {
      x: Math.cos(angle),
      y: Math.sin(angle),
    };

    const toi = 500;
    const hit = this.world.castRay(
      ray,
      toi,
      true,
      undefined,
      undefined,
      undefined,
      undefined,
      (col) => {
        if ((col.parent().userData as any).type === "RIGIDBODY") {
          return false;
        }
        return true;
      },
    );
    if (hit) {
      if (
        (hit.collider.parent().userData as any).type === "PLAYER" &&
        (hit.collider.parent().userData as any).teamid !== player.teamid
      ) {
        const id = (hit.collider.parent().userData as any).sessionId;
        players[id].health -= 30;
        if (players[id].health <= 0) {
        }
      }
      //console.log("hit data : ", hit.collider.parent().userData);
    }

    room.broadcast("bulletShot", {
      shooterId: id,
      pos: spawnpos,
      angle,
      toi: hit ? hit.timeOfImpact : toi,
    });
  }

  simulateBullets() {
    this.allBullets.forEach((bullet) => {
      if (bullet) {
        const dir = {
          x: Math.cos(bullet.angle),
          y: Math.sin(bullet.angle),
        };
        bullet.rb.setLinvel(
          {
            x: dir.x * 2000,
            y: dir.y * 2000,
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
      const rb = this.allBullets[rbIndex];
      thingsToDestroy.push(rb.rb);
      this.allBullets.splice(rbIndex, 1);
      return id;
    }
    return undefined;
  }
}
