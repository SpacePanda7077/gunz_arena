import { Display } from "phaser";

export class HealthBar {
    private scene: Phaser.Scene;
    private maxHealth: number;
    private currentHealth: number;

    private container!: Phaser.GameObjects.Container;
    private bg!: Phaser.GameObjects.Sprite;
    private bar!: Phaser.GameObjects.Sprite;

    private barWidth: number; // visual width
    private textureWidth: number; // original texture width

    constructor(
        scene: Phaser.Scene,
        x: number,
        y: number,
        width = 50,
        height = 8,
        maxHealth = 300,
    ) {
        this.scene = scene;
        this.maxHealth = maxHealth;
        this.currentHealth = maxHealth;
        this.barWidth = width;

        this.container = this.scene.add.container(x, y);

        // Background
        this.bg = this.scene.add
            .sprite(0, 0, "health-bar-bg")
            .setOrigin(0, 0.5)
            .setDisplaySize(width, height)
            .setAlpha(0.7)
            .setTint(0x222222);

        // Health bar (foreground)
        this.bar = this.scene.add
            .sprite(0, 0, "health-bar")
            .setOrigin(0, 0.5)
            .setDisplaySize(width, height);

        this.container.add([this.bg, this.bar]);

        // Important: Save the original texture width
        this.textureWidth = this.bar.width; // or this.bar.frame.width

        this.updateBar();
    }

    private updateBar() {
        const percent = Phaser.Math.Clamp(
            this.currentHealth / this.maxHealth,
            0,
            1,
        );

        // Correct way to crop
        this.bar.setCrop(0, 0, this.textureWidth * percent, this.bar.height);

        // Color change
        if (percent < 0.3) this.bar.setTint(0xff0000);
        else if (percent < 0.6) this.bar.setTint(0xffff00);
        else this.bar.setTint(0x00ff00);
    }

    setHealth(value: number) {
        this.currentHealth = Phaser.Math.Clamp(value, 0, this.maxHealth);
        this.updateBar();
    }

    damage(amount: number) {
        this.setHealth(this.currentHealth - amount);
    }
    heal(amount: number) {
        this.setHealth(this.currentHealth + amount);
    }

    setPosition(x: number, y: number) {
        this.container.setPosition(x, y);
    }

    setVisible(value: boolean) {
        this.container.setVisible(value);
    }

    setDepth(depth: number) {
        this.container.setDepth(depth);
    }
    setMask(mask: Display.Masks.GeometryMask) {
        this.container.setMask(mask);
    }

    destroy() {
        this.container.destroy();
    }
}

