import {
  ActiveCollisionTypes,
  ActiveEvents,
  ColliderDesc,
  KinematicCharacterController,
  QueryFilterFlags,
  Ray,
  RigidBody,
  RigidBodyDesc,
  World,
} from "@dimforge/rapier2d-compat";
import { Clamp, Normalize } from "../../Helper/Math/Math";
import { time } from "console";
import { Room } from "colyseus";

export class Character {
  world: World;
  rigidBody: RigidBody;
  collider: any;
  velocity: { x: number; y: number };
  direction: { x: number; y: number };
  character_controller: KinematicCharacterController;
  speed: number;
  hurtBox_rigidBody: RigidBody;
  z: number;
  isSliding: boolean;
  JUMP_HEIGHT: number;
  JUMP_TIME: number;
  GRAVITY: number;
  JUMP_FORCE: number;
  stamina: number;
  lastShootTime = 0;
  lastDeathTime = 0;
  MaxJumpHeight: number;
  MaxSpeed: number;
  isShooting: boolean;
  isJumping: boolean;
  isMoving: boolean;
  isDead: boolean = false;
  animation: string;
  flipped: boolean;
  teamid: string;
  bulletRay: Ray;
  health: number;
  maxHealth: number;
  sessionId: string;
  constructor(
    world: World,
    position: { x: number; y: number },
    teamid: string,
    sessionId: string,
  ) {
    this.health = 300;
    this.maxHealth = this.health;
    this.direction = { x: 0, y: 0 };
    this.velocity = { x: 0, y: 0 };
    this.JUMP_HEIGHT = 32;
    this.JUMP_TIME = 1;
    this.GRAVITY = (2 * this.JUMP_HEIGHT) / (this.JUMP_TIME * 0.5);
    this.JUMP_FORCE = (2 * this.JUMP_HEIGHT) / this.JUMP_TIME;
    this.MaxJumpHeight = this.JUMP_HEIGHT;
    this.stamina = 1;
    this.z = 0;
    this.isSliding = false;
    this.isShooting = false;
    this.isJumping = false;
    this.isMoving = false;
    this.flipped = false;
    this.speed = 200;
    this.MaxSpeed = this.speed;
    this.world = world;
    this.animation = "idle";
    this.teamid = teamid;
    this.sessionId = sessionId;
    this.create_body(position, teamid);
  }
  private create_body(position: { x: number; y: number }, teamid: string) {
    const hurtBox_rigid_body_desc = RigidBodyDesc.kinematicPositionBased()
      .setTranslation(position.x, position.y)
      .setUserData({ type: "PLAYER", teamid, sessionId: this.sessionId });
    const rigid_body_desc = RigidBodyDesc.kinematicPositionBased()
      .setTranslation(position.x, position.y)
      .setUserData({ type: "RIGIDBODY" });

    this.hurtBox_rigidBody = this.world.createRigidBody(
      hurtBox_rigid_body_desc,
    );
    this.rigidBody = this.world.createRigidBody(rigid_body_desc);
    const hurtBox_collider_desc = ColliderDesc.ball(20)
      .setActiveCollisionTypes(ActiveCollisionTypes.ALL)
      .setActiveEvents(ActiveEvents.COLLISION_EVENTS);
    const collider_desc = ColliderDesc.cuboid(32, 8).setTranslation(0, 32);
    this.world.createCollider(hurtBox_collider_desc, this.hurtBox_rigidBody);
    this.collider = this.world.createCollider(collider_desc, this.rigidBody);
    this.character_controller = this.world.createCharacterController(0.02);
    this.bulletRay = new Ray({ x: position.x, y: position.y }, { x: 0, y: 0 });
  }

  update_body(delta: number, time: number) {
    const dt = delta / 1000;
    this.calcSpeed();
    if (!this.isSliding) {
      this.direction = Normalize(this.direction.x, this.direction.y);
    }
    this.velocity.x = this.direction.x * this.speed * dt;
    this.velocity.y = this.direction.y * this.speed * dt;

    this.character_controller.computeColliderMovement(
      this.collider,
      this.velocity,
      QueryFilterFlags.ONLY_FIXED,
    );
    const computedMovement = this.character_controller.computedMovement();

    const position = this.rigidBody.translation();
    const nextPosition = {
      x: position.x + computedMovement.x,
      y: position.y + computedMovement.y,
    };
    const hurtBoxPosition = {
      x: nextPosition.x,
      y: nextPosition.y + this.z,
    };
    const numCollisions = this.character_controller.numComputedCollisions();

    for (let i = 0; i < numCollisions; i++) {
      const collision = this.character_controller.computedCollision(i);
      if (collision && this.isSliding) {
        this.isSliding = false;
      }
    }
    this.rigidBody.setNextKinematicTranslation(nextPosition);
    this.hurtBox_rigidBody.setNextKinematicTranslation(hurtBoxPosition);
  }

  calcSpeed() {
    if (this.isSliding) {
      this.speed *= 0.95;
      if (this.speed <= 200) {
        this.isSliding = false;
      }
    } else if (this.isShooting) {
      this.speed = 120;
    } else {
      this.speed = this.MaxSpeed;
    }
  }

  slide() {
    if (!this.isSliding && !this.isShooting) {
      this.speed = 450;
      this.isSliding = true;
    }
  }

  handleInput(input: { x: number; y: number }) {
    this.direction.x = input.x;
    this.direction.y = input.y;
  }

  handleAnimations() {
    if (this.isMoving) {
      if (this.isSliding) {
        this.animation = "slide";
      } else if (this.isJumping) {
        this.animation = "jump";
      } else {
        this.animation = "run";
      }
    } else {
      if (this.isSliding) {
        this.animation = "slide";
      } else {
        this.animation = "idle";
      }
    }
  }
  flipCharacter(aimPos: { x: number; y: number }) {
    const position = this.hurtBox_rigidBody.translation();
    if (aimPos.x < position.x) {
      this.flipped = true;
    } else {
      this.flipped = false;
    }
  }

  die(time: number, room: Room) {
    if (this.isDead) return;
    this.lastDeathTime = time;
    this.isDead = true;
    room.broadcast("player_died", { id: this.sessionId });
  }
  respawn(
    time: number,
    allPossiblePosition: { x: number; y: number }[],
    room: Room,
  ) {
    if (this.isDead) {
      if (time > this.lastDeathTime + 5000) {
        const pos =
          allPossiblePosition[
            Math.floor(Math.random() * allPossiblePosition.length)
          ];
        this.rigidBody.setTranslation(pos, true);
        this.health = this.maxHealth;
        this.isDead = false;
        room.broadcast("respawn", { id: this.sessionId });
      }
    }
  }
}
