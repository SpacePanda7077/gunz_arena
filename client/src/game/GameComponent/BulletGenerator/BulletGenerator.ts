import { QueryFilterFlags, Ray, World } from "@dimforge/rapier2d-compat";
import { Math as PhaserMath } from "phaser";
import { Character } from "../character_Maker/Character";

export class BulletGenerator {
    world: World;
    allBullets: {
        body: Phaser.GameObjects.Rectangle;
        angle: number;
        graphic: Phaser.GameObjects.Graphics;
        tween: Phaser.Tweens.Tween;
        pos: { x: number; y: number };
        dist: number;
    }[] = [];
    scene: Phaser.Scene;
    bulletBody: Phaser.GameObjects.Rectangle;

    constructor(scene: Phaser.Scene, world: World) {
        this.scene = scene;
        this.world = world;
    }
    createBullet(
        player: Character,
        pos: { x: number; y: number },
        ray: Ray,
        angle: number,
    ) {
        const bulletBody = this.scene.add.rectangle(
            pos.x,
            pos.y,
            30,
            5,
            0xfff000,
        );
        const flash = this.scene.add
            .sprite(
                pos.x,
                pos.y,
                "assault_flash",
                Math.floor(Math.random() * 3),
            )
            .setOrigin(0, 0.5)
            .setScale(1.8);
        bulletBody.rotation = angle;
        flash.rotation = angle;
        ray.origin = pos;
        ray.dir = {
            x: Math.cos(angle),
            y: Math.sin(angle),
        };
        const toi = player.weaponInfo.range;
        const hit = this.world.castRay(
            ray,
            toi,
            true,
            QueryFilterFlags.EXCLUDE_SENSORS,
            undefined,
            undefined,
            undefined,
            (col) => {
                if ((col.parent()?.userData as any).type === "RIGIDBODY") {
                    return false;
                }
                return true;
            },
        );
        if (hit) {
            const dist = hit.timeOfImpact - 10;
            const hitPos = {
                x: pos.x + Math.cos(angle) * dist,
                y: pos.y + Math.sin(angle) * dist,
            };
            const effect = this.scene.add.sprite(
                hitPos.x,
                hitPos.y,
                "bulletImpact1",
            );

            effect.rotation = Math.PI + angle;
            effect.anims.create({
                key: "hit",
                frames: effect.anims.generateFrameNumbers("bulletImpact1", {
                    start: 0,
                    end: 6,
                }),
                frameRate: 13,
                repeat: 0,
            });
            effect.play("hit");
            effect.once("animationcomplete", () => {
                effect.destroy();
            });
        }

        const graphics = this.scene.add.graphics();
        graphics.lineStyle(3.5, 0xffffff, 0.5);
        graphics.beginPath();
        const moveTo = {
            x: pos.x + Math.cos(angle) * 64,
            y: pos.y + Math.sin(angle) * 64,
        };
        graphics.moveTo(moveTo.x, moveTo.y);
        const dist = hit?.timeOfImpact || toi;

        const tween = this.scene.tweens.add({
            targets: graphics,
            alpha: 0,
            duration: 300,
            onComplete: () => {
                graphics.destroy();
                tween.destroy();
            },
        });
        this.allBullets.push({
            body: bulletBody,
            angle,
            graphic: graphics,
            tween,
            pos,
            dist,
        });
        const flashtween = this.scene.tweens.add({
            targets: flash,
            alpha: 0,
            duration: 80,
            onComplete: () => {
                flash.destroy();
                flashtween.destroy();
            },
        });
    }

    drawBullet(pos: { x: number; y: number }, angle: number, toi: number) {
        const bulletBody = this.scene.add.rectangle(
            pos.x,
            pos.y,
            30,
            5,
            0xfff000,
        );
        const flash = this.scene.add
            .sprite(
                pos.x,
                pos.y,
                "assault_flash",
                Math.floor(Math.random() * 3),
            )
            .setOrigin(0, 0.5)
            .setScale(1.8);
        bulletBody.rotation = angle;
        flash.rotation = angle;

        const dist = toi;

        const graphics = this.scene.add.graphics();
        graphics.lineStyle(3.5, 0xffffff, 0.5);
        graphics.beginPath();
        const moveTo = {
            x: pos.x + Math.cos(angle) * 64,
            y: pos.y + Math.sin(angle) * 64,
        };
        graphics.moveTo(moveTo.x, moveTo.y);

        const tween = this.scene.tweens.add({
            targets: graphics,
            alpha: 0,
            duration: 300,
            onComplete: () => {
                graphics.destroy();
                tween.destroy();
            },
        });
        this.allBullets.push({
            body: bulletBody,
            angle,
            graphic: graphics,
            tween,
            pos,
            dist,
        });
        const flashtween = this.scene.tweens.add({
            targets: flash,
            alpha: 0,
            duration: 80,
            onComplete: () => {
                flash.destroy();
                flashtween.destroy();
            },
        });
    }

    simulateBullets() {
        this.allBullets.forEach((bullet, index) => {
            const dir = {
                x: Math.cos(bullet.angle),
                y: Math.sin(bullet.angle),
            };
            bullet.body.x += dir.x * 100;
            bullet.body.y += dir.y * 100;
            bullet.graphic.lineTo(bullet.body.x, bullet.body.y);
            bullet.graphic.strokePath();
            const dist = PhaserMath.Distance.Between(
                bullet.body.x,
                bullet.body.y,
                bullet.pos.x,
                bullet.pos.y,
            );
            if (dist >= bullet.dist) {
                bullet.body.destroy();
                bullet.graphic.destroy();
                bullet.tween.destroy();
                this.allBullets.splice(index, 1);
            }
        });
    }
    destroyBullet(id: string) {}
}

