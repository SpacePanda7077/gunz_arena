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
import {
  AngleBetween,
  AngleDifference,
  Clamp,
  DistanceBetween,
  DotProduct,
  GetRandomInt,
  Normalize,
  RotateToward,
} from "../../Helper/Math/Math";
import { StateManager } from "./StateManager/StateMagager";
import { type GameState } from "../../rooms/schema/GameRoomState";
import { Character } from "../Character/Character";
import { Room } from "colyseus";

export class Bot {
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
  canAttack: boolean;
  canSee: boolean;
  isChasing: boolean;
  isAttacking: boolean;
  isDead: boolean = false;
  animation: string;
  flipped: number;
  stateManager: StateManager;
  angle = 0;
  teamid: string;
  bulletRay: Ray;
  sensors: Ray[];
  dir: { x: number; y: number; length: number }[];
  interest: number[];
  danger: number[];
  rayCount: number = 8;
  lastDistanceCheckTime = 0;
  viewDistance = 800;
  canSeeRay: Ray;
  currentTarget: Character | Bot | null;
  currentTargetId: string;
  lastSeenPosition: { x: number; y: number };
  health: number;
  maxHealth: number;
  sessionId: string;
  grid: number[][];
  allPossiblePositions: { x: number; y: number }[];
  constructor(
    world: World,
    position: { x: number; y: number },
    teamid: string,
    sessionId: string,
    grid: number[][],
    allPossiblePosition: { x: number; y: number }[],
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
    this.flipped = 1;
    this.canAttack = false;
    this.canSee = false;
    this.isChasing = false;
    this.isAttacking = false;
    this.speed = 200;
    this.MaxSpeed = this.speed;
    this.world = world;
    this.animation = "idle";
    this.teamid = teamid;
    this.sessionId = sessionId;
    this.currentTargetId = "";
    this.currentTarget = null;
    this.grid = grid;
    this.allPossiblePositions = allPossiblePosition;
    this.create_body(position, teamid, grid, allPossiblePosition);
  }
  private create_body(
    position: { x: number; y: number },
    teamid: string,
    grid: number[][],
    allPossiblePosition: { x: number; y: number }[],
  ) {
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
    const collider_desc = ColliderDesc.cuboid(20, 8).setTranslation(0, 32);
    this.world.createCollider(hurtBox_collider_desc, this.hurtBox_rigidBody);
    this.collider = this.world.createCollider(collider_desc, this.rigidBody);
    this.character_controller = this.world.createCharacterController(0.02);
    this.stateManager = new StateManager(this, grid, allPossiblePosition);
    this.bulletRay = new Ray({ x: position.x, y: position.y }, { x: 0, y: 0 });
    this.createRaySensor();
  }

  update_body(delta: number, time: number) {
    const dt = delta / 1000;
    this.stateManager.update(this.currentTarget, time);
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
    this.updateSensors();
  }

  calcSpeed() {
    if (this.isSliding) {
      this.speed *= 0.95;
      if (this.speed <= 150) {
        this.isSliding = false;
      }
    } else if (this.isShooting) {
      this.speed = 100;
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

  setInterest(targetDir: { x: number; y: number }) {
    for (let i = 0; i < this.sensors.length; i++) {
      const dir = this.sensors[i].dir;
      const d = DotProduct(dir, targetDir);
      const len = Math.max(0, d);
      this.interest[i] = len;
    }
  }
  setDanger() {
    for (let i = 0; i < this.sensors.length; i++) {
      const hit = this.world.castRay(
        this.sensors[i],
        100,
        true,
        QueryFilterFlags.EXCLUDE_KINEMATIC,
      );

      if (hit) {
        this.danger[i] = 1;
      } else {
        this.danger[i] = 0;
      }
    }
  }
  choose_desired_dir() {
    for (let i = 0; i < this.sensors.length; i++) {
      if (this.danger[i] > 0) {
        this.interest[i] = 0;
      }
      const length = this.interest[i] * 50;
      this.dir[i].length = length;
    }
    const chosen_dir = { x: 0, y: 0 };
    for (let i = 0; i < this.sensors.length; i++) {
      chosen_dir.x += this.sensors[i].dir.x * this.interest[i];
      chosen_dir.y += this.sensors[i].dir.y * this.interest[i];
    }

    const dir = Normalize(chosen_dir.x, chosen_dir.y);

    return dir;
  }

  createRaySensor() {
    this.dir = [];
    this.sensors = [];
    this.interest = [];
    this.danger = [];
    const position = this.rigidBody.translation();
    this.canSeeRay = new Ray(position, { x: 0, y: 0 });
    for (let i = 0; i < this.rayCount; i++) {
      const angle = (i / this.rayCount) * Math.PI * 2;
      const dir = { x: Math.cos(angle), y: Math.sin(angle) };

      const ray = new Ray(position, dir);
      this.dir[i] = { x: dir.x, y: dir.y, length: 0 };
      this.sensors[i] = ray;
    }
  }
  updateSensors() {
    const position = this.rigidBody.translation();
    this.sensors.forEach((s) => {
      s.origin = { x: position.x, y: position.y + 32 };
    });
    this.canSeeRay.origin = position;
  }

  checkdistance(state: GameState, time: number) {
    if (time > this.lastDistanceCheckTime + 300) {
      const position = this.rigidBody.translation();
      const target = state.players.forEach((p) => {
        if (p.teamid !== this.teamid) {
          const dist = DistanceBetween(position.x, position.y, p.x, p.y);
          if (dist < this.viewDistance) {
            this.canAttack = true;

            this.currentTargetId = p.sessionId;
          } else {
            this.canAttack = false;
            this.currentTargetId = "";
          }
        }
      });
      this.lastDistanceCheckTime = time;
    }
  }
  checkIfCanSee(players: { [key: string]: Character | Bot }, delta: number) {
    if (!this.canAttack) return;
    const position = this.rigidBody.translation();
    this.currentTarget = players[this.currentTargetId];
    const targetPosition = this.currentTarget.rigidBody.translation();
    const angle = AngleBetween(
      position.x,
      position.y,
      targetPosition.x,
      targetPosition.y,
    );
    // 2. Define spread (e.g., 0.15 radians is about 8.5 degrees)
    const turnspeed = 1.5;
    const dt = delta / 1000;

    // 4. Apply the variation to the final angle
    this.angle = RotateToward(this.angle, angle, turnspeed * dt);

    const dir = {
      x: Math.cos(angle),
      y: Math.sin(angle),
    };
    this.canSeeRay.dir = dir;
    const hit = this.world.castRay(
      this.canSeeRay,
      this.viewDistance,
      true,
      undefined,
      undefined,
      undefined,
      undefined,
      (col) => {
        if ((col.parent().userData as any).type === "RIGIDBODY") {
          return false;
        }
        if (
          (col.parent().userData as any).type === "PLAYER" &&
          (col.parent().userData as any).teamid === this.teamid
        ) {
          return false;
        }
        return true;
      },
    );

    const dist = DistanceBetween(
      position.x,
      position.y,
      targetPosition.x,
      targetPosition.y,
    );
    const diff = AngleDifference(this.angle, angle);
    if (dist <= 300 && this.canSee && Math.abs(diff) < 0.15) {
      const spread = 0.6;
      const variation = (Math.random() * 2 - 1) * spread;
      this.angle += variation;
      this.isShooting = true;
    } else {
      this.isShooting = false;
    }
    if (
      hit &&
      (hit.collider.parent().userData as any).type === "PLAYER" &&
      !this.currentTarget.isDead
    ) {
      this.lastSeenPosition = {
        x: position.x + Math.cos(angle) * hit.timeOfImpact,
        y: position.y + Math.sin(angle) * hit.timeOfImpact,
      };
      return true;
    }
    return false;
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
        this.stateManager.setState("wandering");
        room.broadcast("respawn", { id: this.sessionId });
      }
    }
  }
}
