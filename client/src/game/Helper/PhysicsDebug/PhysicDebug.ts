import { World } from "@dimforge/rapier2d-compat";
import { Display } from "phaser";

export default class RapierDebugRenderer {
    scene: Phaser.Scene;
    world: World;
    scale: number;
    depth: number;
    lineWidth: number;
    enabled: boolean;
    graphics: Phaser.GameObjects.Graphics;
    constructor(
        scene: Phaser.Scene,
        world: World,
        options: {
            scale?: number;
            depth?: number;
            lineWidth?: number;
            enabled?: boolean;
        },
    ) {
        this.scene = scene;
        this.world = world;

        this.scale = options.scale ?? 1;
        this.depth = options.depth ?? 9999;
        this.lineWidth = options.lineWidth ?? 1;

        this.enabled = options.enabled ?? true;

        this.graphics = scene.add.graphics();
        this.graphics.setDepth(this.depth);
    }

    setEnabled(value: boolean) {
        this.enabled = value;
        if (!value) {
            this.graphics.clear();
        }
    }

    render() {
        if (!this.enabled) return;

        this.graphics.clear();

        const { vertices, colors } = this.world.debugRender();

        for (let i = 0; i < vertices.length; i += 4) {
            const x1 = vertices[i] * this.scale;
            const y1 = vertices[i + 1] * this.scale;
            const x2 = vertices[i + 2] * this.scale;
            const y2 = vertices[i + 3] * this.scale;

            const r = colors[i] * 255;
            const g = colors[i + 1] * 255;
            const b = colors[i + 2] * 255;
            const a = colors[i + 3];

            const color = Display.Color.GetColor(r, g, b);

            this.graphics.lineStyle(this.lineWidth, color, a);
            this.graphics.lineBetween(x1, y1, x2, y2);
        }
    }

    destroy() {
        this.graphics.destroy();
    }
}

export class RayDebugger {
    // Fixed typo "Debuger" -> "Debugger"
    graphics: Phaser.GameObjects.Graphics;
    length: number;
    dir: { x: number; y: number }[];

    constructor(
        scene: Phaser.Scene,
        length: number,
        dir: { x: number; y: number }[],
    ) {
        this.graphics = scene.add.graphics();
        this.length = length;
        this.dir = dir;
    }

    draw(
        position: { x: number; y: number },
        dir: { x: number; y: number; length: number }[],
    ) {
        // 1. Clear the previous frame's drawing
        this.graphics.clear();

        // 2. Set the line style (thickness, color, alpha)
        this.graphics.lineStyle(2, 0x00ff00, 1);

        for (let i = 0; i < dir.length; i++) {
            const direction = dir[i];
            const len = dir[i].length;

            // 3. Calculate the end point correctly
            // If dir is a unit vector, simply: position + (direction * length)
            const targetX = position.x + direction.x * len;
            const targetY = position.y + direction.y * len;

            this.graphics.lineBetween(position.x, position.y, targetX, targetY);
        }
    }

    drawLookDir(
        position: { x: number; y: number },
        dir: { x: number; y: number; length: number },
    ) {
        // 1. Clear the previous frame's drawing
        //this.graphics.clear();

        // 2. Set the line style (thickness, color, alpha)
        this.graphics.lineStyle(2, 0xff0000, 1);

        const direction = dir;
        const len = dir.length;

        // 3. Calculate the end point correctly
        // If dir is a unit vector, simply: position + (direction * length)
        const targetX = position.x + direction.x * len;
        const targetY = position.y + direction.y * len;

        this.graphics.lineBetween(position.x, position.y, targetX, targetY);
    }
}

