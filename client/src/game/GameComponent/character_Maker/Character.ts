import { World } from "@dimforge/rapier2d-compat";
import { Physics_Body } from "./Physics_Body";
import { Math as PhaserMath } from "phaser";
import { BulletGenerator } from "../BulletGenerator/BulletGenerator";
import { AnimationController } from "../Animation_Controller/Animation_Controller";

export class Character {
    scene: Phaser.Scene;
    world: World;
    body: Phaser.GameObjects.Container;
    physicsBody: Physics_Body;
    camTarget: Phaser.GameObjects.Rectangle;
    weapon: Phaser.GameObjects.Rectangle;
    lastShootTime = 0;
    root: Phaser.GameObjects.Container;
    main_body: Phaser.GameObjects.Container;
    hand: Phaser.GameObjects.Container;
    animation_controller: AnimationController;
    shadow: Phaser.GameObjects.Ellipse;
    flipped = 1;
    constructor(
        scene: Phaser.Scene,
        world: World,
        position: { x: number; y: number },
    ) {
        this.scene = scene;
        this.world = world;
        this.create_body(position);
    }
    create_body(position: { x: number; y: number }) {
        this.shadow = this.scene.add.ellipse(0, 0, 60, 20, 0x000000, 0.3);
        const right_leg = this.scene.add.sprite(-8, 23, "right_leg");
        const left_leg = this.scene.add.sprite(8, 23, "left_leg");
        const body = this.scene.add.sprite(0, 0, "body");
        const head = this.scene.add.sprite(0, 0, "head");
        const right_hand = this.scene.add.sprite(0, 0, "right_hand");
        const left_hand = this.scene.add.sprite(25, 0, "left_hand");
        this.weapon = this.scene.add
            .rectangle(0, 0, 48, 15, 0xfff000)
            .setOrigin(0.2, 0.8);

        this.body = this.scene.add.container(position.x, position.y);
        this.root = this.scene.add.container(0, 0);
        this.main_body = this.scene.add.container(0, 0);
        this.hand = this.scene.add.container(-10, 15);

        this.hand.add([this.weapon, right_hand, left_hand]);
        this.main_body.add([body, head]);

        this.root.add([left_leg, right_leg, this.main_body, this.hand]);

        this.body.add(this.root);
        const bodyParts = {
            head,
            body,
            right_hand,
            left_hand,
            right_leg,
            left_leg,
            hand: this.hand,
            main_body: this.main_body,
            root: this.root,
        };
        this.animation_controller = new AnimationController(
            this.scene,
            bodyParts,
        );

        this.camTarget = this.scene.add
            .rectangle(position.x, position.y, 32, 32, 0xff0000)
            .setVisible(false);

        this.physicsBody = new Physics_Body(this.world, position);
    }
    updateVisual(alpha: number) {
        const position = this.physicsBody.hurtBox_rigidBody.translation();
        const shadowposition = this.physicsBody.rigidBody.translation();
        const interpolatedPos = {
            x: PhaserMath.Linear(this.body.x, position.x, alpha),
            y: PhaserMath.Linear(this.body.y, position.y, alpha),
        };
        this.body.setPosition(interpolatedPos.x, interpolatedPos.y);
        this.camTarget.setPosition(shadowposition.x, shadowposition.y);
        this.shadow.setPosition(shadowposition.x, shadowposition.y + 32);
    }
    handleAnimations() {
        if (this.physicsBody.isMoving) {
            if (this.physicsBody.isSliding) {
                this.animation_controller.play("slide");
                this.animation_controller.playAdaptive("hand_slide");
            } else if (this.physicsBody.isJumping) {
                this.animation_controller.play("jump");
            } else {
                this.animation_controller.play("run");
                if (this.physicsBody.isShooting) {
                    this.animation_controller.playAdaptive("hand_shoot");
                } else {
                    this.animation_controller.playAdaptive("hand_run");
                }
            }
        } else {
            if (this.physicsBody.isSliding) {
                this.animation_controller.play("slide");
                this.animation_controller.playAdaptive("hand_slide");
            } else {
                this.animation_controller.play("idle");
                if (this.physicsBody.isShooting) {
                    this.animation_controller.playAdaptive("hand_shoot");
                } else {
                    this.animation_controller.playAdaptive("hand_idle");
                }
            }
        }
    }
    updateWeaponRotation(aimPos: { x: number; y: number }) {
        const position = this.physicsBody.hurtBox_rigidBody.translation();
        const angle = PhaserMath.Angle.Between(
            position.x,
            position.y,
            aimPos.x,
            aimPos.y,
        );
        if (this.root.scaleX < 0) {
            this.hand.rotation = Math.PI - angle;
        } else {
            this.hand.rotation = angle;
        }
    }
    shoot(
        time: number,
        bulletGenerator: BulletGenerator,
        aimPos: { x: number; y: number },
    ) {
        if (time > this.lastShootTime + 200) {
            const position = this.physicsBody.rigidBody.translation();
            const angle = PhaserMath.Angle.Between(
                position.x,
                position.y,
                aimPos.x,
                aimPos.y,
            );
            const pos = {
                x: position.x + Math.cos(angle) * 50,
                y: position.y + Math.sin(angle) * 50,
            };
            bulletGenerator.createBullet(
                pos,
                this.physicsBody.bulletRay,
                angle,
            );
            this.lastShootTime = time;
            this.hand.x =
                this.hand.x +
                Math.cos(this.hand.rotation) * this.root.scaleX * -10;
            this.hand.y =
                this.hand.y +
                Math.sin(this.hand.rotation) * this.root.scaleX * -10;
        }
    }
    flipCharacter(aimPos: { x: number; y: number }) {
        const position = this.physicsBody.hurtBox_rigidBody.translation();
        if (this.physicsBody.isShooting || this.physicsBody.isSliding) {
            if (aimPos.x < position.x) {
                this.root.setScale(-1, 1);
            } else {
                this.root.setScale(1, 1);
            }
        } else {
            if (this.physicsBody.direction.x !== 0) {
                this.root.setScale(this.flipped, 1);
            }
        }
    }

    die() {
        this.physicsBody.isDead = true;
        this.body.setVisible(false);
        this.shadow.setVisible(false);
        const blood_splat = this.scene.add
            .sprite(this.body.x, this.body.y, "blood_splat")
            .setScale(3);
        const blood = this.scene.add
            .sprite(this.body.x, this.body.y + 32, "blood")
            .setScale(0.3)
            .setDepth(-100);
        blood.setTint(0xd95763);

        blood_splat.anims.create({
            key: "splash",
            frames: blood_splat.anims.generateFrameNumbers("blood_splat", {
                start: 0,
                end: 7,
            }),
            frameRate: 13,
            repeat: 0,
        });
        blood_splat.play("splash");
    }
    respawn() {
        this.physicsBody.isDead = false;
        this.body.setVisible(true);
        this.shadow.setVisible(true);
    }
}

