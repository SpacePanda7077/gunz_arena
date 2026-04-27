import { Ray, RigidBody, World } from "@dimforge/rapier2d-compat";
import { Math as PhaserMath, Tweens } from "phaser";

export class BulletGenerator {
    world: World;
    allBullets: {
        body: Phaser.GameObjects.Rectangle;
        angle: number;
        pos: { x: number; y: number };
        dist: number;
    }[] = [];
    scene: Phaser.Scene;
    bulletBody: Phaser.GameObjects.Rectangle;

    constructor(scene: Phaser.Scene, world: World) {
        this.scene = scene;
        this.world = world;
    }
    createBullet(pos: { x: number; y: number }, ray: Ray, angle: number) {
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
                if ((col.parent()?.userData as any).type === "RIGIDBODY") {
                    return false;
                }
                return true;
            },
        );

        const graphics = this.scene.add.graphics();
        graphics.lineStyle(3.5, 0xffffff, 0.5);
        graphics.beginPath();
        const moveTo = {
            x: pos.x + Math.cos(angle) * 64,
            y: pos.y + Math.sin(angle) * 64,
        };
        graphics.moveTo(moveTo.x, moveTo.y);
        const dist = hit?.timeOfImpact || toi;

        const lineTo = {
            x: pos.x + Math.cos(angle) * dist,
            y: pos.y + Math.sin(angle) * dist,
        };

        graphics.lineTo(lineTo.x, lineTo.y);
        graphics.strokePath();
        this.allBullets.push({ body: bulletBody, angle, pos, dist });
        const tween = this.scene.tweens.add({
            targets: graphics,
            alpha: 0,
            duration: 300,
            onComplete: () => {
                graphics.destroy();
                tween.destroy();
            },
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

        this.allBullets.push({ body: bulletBody, angle, pos, dist });
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
            const dist = PhaserMath.Distance.Between(
                bullet.body.x,
                bullet.body.y,
                bullet.pos.x,
                bullet.pos.y,
            );
            if (dist >= bullet.dist) {
                bullet.body.destroy();
                this.allBullets.splice(index, 1);
            }
        });
    }
    destroyBullet(id: string) {}
}

