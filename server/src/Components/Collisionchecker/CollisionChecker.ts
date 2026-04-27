import { EventQueue, RigidBody, World } from "@dimforge/rapier2d-compat";
import { BulletGenerator } from "../BulletGenerator/BulletGenerator";
import { Room } from "colyseus";

export class CollisionChecker {
  constructor() {}

  checkCollision(
    eventQueue: EventQueue,
    world: World,
    bulletGenerator: BulletGenerator,
    thingsToDestroy: RigidBody[],
    room: Room,
  ) {
    eventQueue.drainCollisionEvents((h1, h2, started) => {
      const body1 = world.getRigidBody(h1);
      const body2 = world.getRigidBody(h2);
      if (started) {
        const sortedBodies = this.ArrangColliders(body1, body2);
        const b1_userdata = sortedBodies.body1.userData as any;
        const b2_userdata = sortedBodies.body2.userData as any;

        if (b1_userdata.type === "BULLET" && b2_userdata.type === "WALL") {
          const id = bulletGenerator.detroyBullet(
            (sortedBodies.body1.userData as any).id,
            thingsToDestroy,
          );

          room.broadcast("deleteBullet", id);
        }
        if (b1_userdata.type === "PLAYER" && b2_userdata.type === "BULLET") {
          if (b1_userdata.teamid === b2_userdata.teamid) return;
          const id = bulletGenerator.detroyBullet(
            (sortedBodies.body2.userData as any).id,
            thingsToDestroy,
          );

          room.broadcast("deleteBullet", id);
        }
      }
    });
  }

  ArrangColliders(body1: RigidBody, body2: RigidBody) {
    let b1 = body1;
    let b2 = body2;
    let b1_userdata = b1.userData as any;
    let b2_userdata = b2.userData as any;

    let a_b1;
    let a_b2;
    if (b1_userdata.type === "PLAYER") {
      a_b1 = b1;
      a_b2 = b2;
    } else if (b2_userdata.type === "PLAYER") {
      a_b1 = b2;
      a_b2 = b1;
    } else if (b1_userdata.type === "BULLET") {
      a_b1 = b1;
      a_b2 = b2;
    } else if (b2_userdata.type === "BULLET") {
      a_b1 = b2;
      a_b2 = b1;
    } else {
      a_b1 = b1;
      a_b2 = b2;
    }
    return {
      body1: a_b1,
      body2: a_b2,
    };
  }
}
