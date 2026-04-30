import {
    Collider,
    ColliderDesc,
    KinematicCharacterController,
    QueryFilterFlags,
    Ray,
    RigidBody,
    RigidBodyDesc,
    World,
} from "@dimforge/rapier2d-compat";
import { Normalize } from "../../Helper/Maths/Maths";

export class Physics_Body {
    world: World;
    rigidBody: RigidBody;
    collider: Collider;
    velocity: { x: number; y: number };
    direction: { x: number; y: number };
    character_controller: KinematicCharacterController;
    speed: number;
    hurtBox_rigidBody: RigidBody;
    z: number;
    isDead = false;
    JUMP_HEIGHT: number;
    JUMP_TIME: number;
    GRAVITY: number;
    JUMP_FORCE: number;
    stamina: number;
    lastRegenTime = 0;
    lastSlideTime = 0;
    MaxJumpHeight: number;
    MaxSpeed: number;
    isSliding: boolean;
    isShooting: boolean;
    isJumping: boolean;
    isMoving: boolean;
    bulletRay: Ray;

    constructor(world: World, position: { x: number; y: number }) {
        this.direction = { x: 0, y: 0 };
        this.velocity = { x: 0, y: 0 };
        this.JUMP_HEIGHT = 32;
        this.JUMP_TIME = 1;
        this.GRAVITY = (2 * this.JUMP_HEIGHT) / (this.JUMP_TIME * 0.5);
        this.JUMP_FORCE = (2 * this.JUMP_HEIGHT) / this.JUMP_TIME;
        this.MaxJumpHeight = this.JUMP_HEIGHT;
        this.z = 0;
        this.stamina = 1;
        this.isSliding = false;
        this.isJumping = false;
        this.isMoving = false;
        this.speed = 300;
        this.MaxSpeed = this.speed;
        this.world = world;
        this.create_body(position);
    }
    private create_body(position: { x: number; y: number }) {
        const hurtBox_rigid_body_desc =
            RigidBodyDesc.kinematicPositionBased().setTranslation(
                position.x,
                position.y,
            );
        const rigid_body_desc = RigidBodyDesc.kinematicPositionBased()
            .setTranslation(position.x, position.y)
            .setUserData({ type: "RIGIDBODY" });

        this.hurtBox_rigidBody = this.world.createRigidBody(
            hurtBox_rigid_body_desc,
        );
        this.rigidBody = this.world.createRigidBody(rigid_body_desc);

        const hurtBox_collider_desc = ColliderDesc.ball(30);
        const collider_desc = ColliderDesc.cuboid(32, 8).setTranslation(0, 32);
        this.collider = this.world.createCollider(
            hurtBox_collider_desc,
            this.hurtBox_rigidBody,
        );
        this.world.createCollider(collider_desc, this.rigidBody);

        this.character_controller = this.world.createCharacterController(0.02);
        this.bulletRay = new Ray(
            { x: position.x, y: position.y },
            { x: 0, y: 0 },
        );
    }

    update_body(delta: number) {
        const dt = delta / 1000;
        this.calcSpeed();

        this.direction = Normalize(this.direction.x, this.direction.y);

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
            y: nextPosition.y,
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
        return computedMovement;
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

    slideRecover(time: number) {
        console.log(this.speed);
    }
}

