import { World } from "@dimforge/rapier2d-compat";
import { Physics_Body } from "./Physics_Body";
import { Math as PhaserMath } from "phaser";
import { BulletGenerator } from "../BulletGenerator/BulletGenerator";
import { AnimationController } from "../Animation_Controller/Animation_Controller";
import { getWeapons } from "../Weapons/Weapons";
import { HealthBar } from "../ui/healthbar";
const weapons = getWeapons();

export class Character {
    scene: Phaser.Scene;
    world: World;
    body: Phaser.GameObjects.Container;
    physicsBody: Physics_Body;
    camTarget: Phaser.GameObjects.Rectangle;
    weapon: Phaser.GameObjects.Sprite;
    lastShootTime = 0;
    root: Phaser.GameObjects.Container;
    main_body: Phaser.GameObjects.Container;
    hand: Phaser.GameObjects.Container;
    animation_controller: AnimationController;
    shadow: Phaser.GameObjects.Ellipse;
    flipped = 1;
    health: HealthBar;
    teamid: string;
    weaponInfo: {
        type: string;
        name: string;
        rpm: number;
        range: number;
        damage: number;
        magSize: number;
        reloadTime: number;
        bulletPerShot: number;
        isBurst: boolean;
    };
    mag: number;
    gunsound:
        | Phaser.Sound.NoAudioSound
        | Phaser.Sound.HTML5AudioSound
        | Phaser.Sound.WebAudioSound;

    constructor(
        scene: Phaser.Scene,
        world: World,
        position: { x: number; y: number },
        teamid: string,
        weapon: (typeof weapons)[0],
    ) {
        this.scene = scene;
        this.world = world;
        this.weaponInfo = weapon;
        this.mag = this.weaponInfo.magSize;

        this.create_body(position);
        this.teamid = teamid;
    }
    create_body(position: { x: number; y: number }) {
        this.shadow = this.scene.add.ellipse(0, 32, 60, 20, 0x000000, 0.3);
        this.health = new HealthBar(this.scene, position.x, position.y);
        const right_leg = this.scene.add.sprite(-8, 23, "right_leg");
        const left_leg = this.scene.add.sprite(8, 23, "left_leg");
        const body = this.scene.add.sprite(0, 0, "body");
        const head = this.scene.add.sprite(0, 0, "head");
        const right_hand = this.scene.add.sprite(0, 0, "right_hand");
        const left_hand = this.scene.add.sprite(25, 0, "left_hand");

        this.body = this.scene.add.container(position.x, position.y);
        this.root = this.scene.add.container(0, 0);
        this.main_body = this.scene.add.container(0, 0);
        this.hand = this.scene.add.container(-10, 15);
        this.loadWeapon();

        this.hand.add([this.weapon, right_hand, left_hand]);
        this.main_body.add([body, head]);

        this.root.add([
            this.shadow,
            left_leg,
            right_leg,
            this.main_body,
            this.hand,
        ]);

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
            .rectangle(position.x, position.y + 32, 32, 32, 0xff0000)
            .setVisible(false);

        this.physicsBody = new Physics_Body(this.world, position);
    }

    loadWeapon() {
        this.weapon = this.scene.add
            .sprite(0, 0, "__MISSING__")
            .setVisible(false);

        // Only load if the texture doesn't already exist
        if (
            this.scene.textures &&
            !this.scene.textures.exists(this.weaponInfo.name)
        ) {
            if (this.scene.load) {
                // ← Safety check
                this.scene.load.image(
                    this.weaponInfo.name,
                    `weapons/weapons/${this.weaponInfo.name}/${this.weaponInfo.name}.png`,
                );
                this.scene.load.audio(
                    this.weaponInfo.name,
                    `weapons/weapons/${this.weaponInfo.name}/${this.weaponInfo.name}.wav`,
                );

                this.scene.load.once(
                    `filecomplete-image-${this.weaponInfo.name}`,
                    () => {
                        if (this.weapon && !this.weapon.scene) return; // object destroyed
                        this.weapon.setTexture(this.weaponInfo.name);
                        this.weapon.setVisible(true);
                        this.gunsound = this.scene.sound.add(
                            this.weaponInfo.name,
                        );
                    },
                );

                this.scene.load.start();
            } else {
                console.warn(
                    `Loader not available for weapon: ${this.weaponInfo.name}`,
                );
            }
        } else if (this.scene.textures?.exists(this.weaponInfo.name)) {
            this.weapon.setTexture(this.weaponInfo.name);
            this.weapon.setVisible(true);
        }
    }
    updateVisual(alpha: number) {
        const position = this.physicsBody.rigidBody.translation();

        const interpolatedPos = {
            x: PhaserMath.Linear(this.body.x, position.x, alpha),
            y: PhaserMath.Linear(this.body.y, position.y, alpha),
        };
        this.body.setPosition(interpolatedPos.x, interpolatedPos.y);
        this.camTarget.setPosition(position.x, position.y + 32);

        this.health.setPosition(interpolatedPos.x, interpolatedPos.y - 100);
    }
    handleAnimations() {
        if (this.physicsBody.isMoving) {
            if (this.physicsBody.isSliding) {
                this.animation_controller.play("slide");
                this.animation_controller.playAdaptive("hand_slide");
            } else if (this.physicsBody.isJumping) {
                this.animation_controller.play("jump");
            } else {
                if (this.flipped === this.root.scaleX) {
                    this.animation_controller.play("runForward");
                } else {
                    this.animation_controller.play("runBackward");
                }

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
        const position = this.physicsBody.rigidBody.translation();
        const angle = PhaserMath.Angle.Between(
            position.x,
            position.y,
            aimPos.x,
            aimPos.y,
        );
        if (!this.physicsBody.isShooting) {
            this.hand.rotation = 0;
            return;
        }

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
        if (this.mag <= 0) {
            return;
        }
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
            this,
            pos,
            this.physicsBody.bulletRay,
            angle,
        );
        this.gunsound.play();
        this.mag--;
        this.lastShootTime = time;
        this.hand.x =
            this.hand.x + Math.cos(this.hand.rotation) * this.root.scaleX * -10;
        this.hand.y =
            this.hand.y + Math.sin(this.hand.rotation) * this.root.scaleX * -10;
        const vector = new PhaserMath.Vector2(
            Math.cos(this.hand.rotation) * 0.003,
            Math.sin(this.hand.rotation) * 0.003,
        );
        this.scene.cameras.main.shake(50, vector);
    }
    flipCharacter(aimPos: { x: number; y: number }) {
        const position = this.physicsBody.rigidBody.translation();
        if (this.physicsBody.isShooting) {
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

    reload() {
        if (this.mag >= this.weaponInfo.magSize) return;
        const reloadTime = this.weaponInfo.reloadTime * 1000;
        if (this.physicsBody.isReloading) return;
        this.physicsBody.isReloading = true;
        const uiscene: any = this.scene.scene.get("Ui");

        uiscene.reload(this.weaponInfo.reloadTime);
        this.scene.time.addEvent({
            delay: reloadTime,
            callback: () => {
                this.mag = this.weaponInfo.magSize;
                this.physicsBody.isReloading = false;
                uiscene.reloadUi.setVisible(false);
            },
            callbackScope: this.scene,
        });
    }
    autoreload() {
        if (this.mag <= 0) {
            this.reload();
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
        blood_splat.once("animationcomplete", () => {
            const tween = this.scene.tweens.add({
                targets: blood,
                alpha: 0,
                duration: 1000,
                onComplete: () => {
                    blood.destroy();
                    blood_splat.destroy();
                    tween.destroy();
                },
            });
        });
        this.physicsBody.h_collider.setSensor(true);
    }
    respawn() {
        const time = this.scene.time.addEvent({
            delay: 100,
            callback: () => {
                this.physicsBody.isDead = false;
                this.body.setVisible(true);
                this.shadow.setVisible(true);
                this.physicsBody.h_collider.setSensor(false);
                this.mag = this.weaponInfo.magSize;
                time.destroy();
            },
            callbackScope: this.scene,
            loop: false,
        });
    }
}

