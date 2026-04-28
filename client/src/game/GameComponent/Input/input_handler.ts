import { Room } from "@colyseus/sdk";
import { Character } from "../character_Maker/Character";
import { Scene, Input } from "phaser";
import uniqid from "uniqid";
import { BulletGenerator } from "../BulletGenerator/BulletGenerator";

export class Input_Handler {
    scene: Scene;
    left!: Input.Keyboard.Key;
    right!: Input.Keyboard.Key;
    up!: Input.Keyboard.Key;
    down!: Input.Keyboard.Key;

    frontendInput: {
        input: { x: number; y: number };
        aimPos: { x: number; y: number };
        computedMovement: { x: number; y: number };
        slide: boolean;
        shoot: boolean;
        speed: number;
        inputIndex: number;
    }[];
    inputIndex: number;
    slide: Input.Keyboard.Key;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.frontendInput = [];
        this.inputIndex = 0;

        this.map_keys();
    }

    map_keys() {
        this.left = this.scene.input.keyboard!.addKey("a");
        this.right = this.scene.input.keyboard!.addKey("d");
        this.up = this.scene.input.keyboard!.addKey("w");
        this.down = this.scene.input.keyboard!.addKey("s");
        this.slide = this.scene.input.keyboard!.addKey(
            Input.Keyboard.KeyCodes.SPACE,
        );
    }

    // 🚨 CALL THIS FROM fixedUpdate (NOT Phaser update)
    tick(
        player: Character,
        aimPos: { x: number; y: number },
        computedMovement: { x: number; y: number },
        room: Room,
        time: number,
        bulletGenerator: BulletGenerator,
    ) {
        const input = { x: 0, y: 0 };

        // Combine inputs into ONE vector
        if (this.left.isDown) input.x -= 1;
        if (this.right.isDown) input.x += 1;
        if (this.up.isDown) input.y -= 1;
        if (this.down.isDown) input.y += 1;

        if (input.x !== 0 || input.y !== 0) {
            player.physicsBody.isMoving = true;
        } else {
            player.physicsBody.isMoving = false;
        }
        if (input.x !== 0) {
            player.flipped = input.x;
        }

        // Normalize (important for diagonals)
        const length = Math.sqrt(input.x * input.x + input.y * input.y);
        if (length > 0) {
            input.x /= length;
            input.y /= length;
        }

        // ✅ ONE input per tick
        this.inputIndex++;

        const entry = {
            input: { ...input },
            aimPos,
            computedMovement,
            slide:
                player.physicsBody.isMoving &&
                Input.Keyboard.JustDown(this.slide),

            shoot: this.scene.input.activePointer.leftButtonDown(),

            speed: player.physicsBody.speed,
            inputIndex: this.inputIndex,
        };

        this.frontendInput.push(entry);

        // ✅ Apply locally (prediction)
        if (!player.physicsBody.isSliding) {
            player.physicsBody.direction = input;
        }

        // ✅ Send to server
        room.send("move", entry);
        if (entry.slide && player.physicsBody.isMoving) {
            player.physicsBody.slide();
        }
        if (entry.shoot) {
            player.physicsBody.isShooting = true;
            this.Shoot(player, time, bulletGenerator, aimPos);
        } else {
            player.physicsBody.isShooting = false;
        }
    }
    Shoot(
        player: Character,
        time: number,
        bulletGenerator: BulletGenerator,
        aimTarget: { x: number; y: number },
    ) {
        if (player.physicsBody.isShooting) {
            if (time > player.lastShootTime + 200) {
                player.shoot(time, bulletGenerator, aimTarget);
            }
        }
    }
}

