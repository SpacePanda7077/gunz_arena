import { Display } from "phaser";

export class HealthBar {
    private scene: Phaser.Scene;
    private x: number;
    private y: number;
    private width: number;
    private height: number;
    private radius: number;

    private maxHealth: number;
    private currentHealth: number;

    private bg!: Phaser.GameObjects.Graphics;
    private bar!: Phaser.GameObjects.Graphics;
    private border!: Phaser.GameObjects.Graphics;

    constructor(
        scene: Phaser.Scene,
        x: number,
        y: number,
        width = 50,
        height = 8,
        maxHealth = 300,
        radius = 4,
    ) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.radius = radius;

        this.maxHealth = maxHealth;
        this.currentHealth = maxHealth;

        this.bg = this.scene.add.graphics();
        this.bar = this.scene.add.graphics();
        this.border = this.scene.add.graphics();

        this.draw();
    }

    setHealth(value: number) {
        this.currentHealth = Phaser.Math.Clamp(value, 0, this.maxHealth);
        this.draw();
    }

    damage(amount: number) {
        this.setHealth(this.currentHealth - amount);
    }

    heal(amount: number) {
        this.setHealth(this.currentHealth + amount);
    }

    private draw() {
        this.bg.clear();
        this.bar.clear();
        this.border.clear();

        // Background (dark)
        this.bg.fillStyle(0x000000, 0.5);
        this.bg.fillRoundedRect(
            this.x,
            this.y,
            this.width,
            this.height,
            this.radius,
        );

        // Health %
        const percent = this.currentHealth / this.maxHealth;

        // Dynamic color
        let color = 0x00ff00;
        if (percent < 0.6) color = 0xffff00;
        if (percent < 0.3) color = 0xff0000;

        // Health bar (foreground)
        this.bar.fillStyle(color, 1);
        this.bar.fillRoundedRect(
            this.x,
            this.y,
            this.width * percent,
            this.height,
            this.radius,
        );

        // Border
        this.border.lineStyle(2, 0xffffff, 1);
        this.border.strokeRoundedRect(
            this.x,
            this.y,
            this.width,
            this.height,
            this.radius,
        );
    }

    setPosition(x: number, y: number) {
        this.x = x;
        this.y = y;
        this.draw();
    }
    setVisible(value: boolean) {
        this.bg.setVisible(value);
        this.bar.setVisible(value);
        this.border.setVisible(value);
    }
    setMask(mask: Display.Masks.GeometryMask) {
        this.bg.setMask(mask);
        (this.bar.setMask(mask), this.border.setMask(mask));
    }

    destroy() {
        this.bg.destroy();
        this.bar.destroy();
        this.border.destroy();
    }
}

