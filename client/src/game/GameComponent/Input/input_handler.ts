import { Room } from "@colyseus/sdk";
import { Character } from "../character_Maker/Character";
import { Scene, Input } from "phaser";
import uniqid from "uniqid";
import { BulletGenerator } from "../BulletGenerator/BulletGenerator";
import { Ui } from "../../scenes/Ui";

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
        shoot: { shoot: boolean; timestamp: number };
        reload: boolean;
        speed: number;
        inputIndex: number;
    }[];
    inputIndex: number;
    slide: Input.Keyboard.Key;
    switchWeapon: Input.Keyboard.Key | undefined;

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
        this.switchWeapon = this.scene.input.keyboard?.addKey(
            Phaser.Input.Keyboard.KeyCodes.ONE,
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
        const uiscene = this.scene.scene.get("Ui") as Ui;
        if (uiscene && uiscene.moveJoyStick) {
            console.log(uiscene.moveJoyStick.rotation);
            const moveJoystick = uiscene.moveJoyStick;
            const angle = moveJoystick.rotation;
            const dir = {
                x: Math.cos(angle),
                y: Math.sin(angle),
            };
            if (moveJoystick.force > 0) {
                input.x = dir.x;
                input.y = dir.y;
            }
        }
        let isShooting = false;
        let isSliding = false;
        let reload = false;
        if (uiscene && uiscene.shootJoyStick) {
            const moveJoystick = uiscene.shootJoyStick;
            const angle = moveJoystick.rotation;
            const dir = {
                x: Math.cos(angle),
                y: Math.sin(angle),
            };
            if (moveJoystick.force > 0) {
                isShooting = true;
                aimPos.x = player.body.x + Math.cos(angle) * 200;
                aimPos.y = player.body.y + Math.sin(angle) * 200;
            }
            isSliding = uiscene.slidePressed;
            reload = uiscene.reloadPressed;
        }

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
            player.flipped = Math.sign(input.x);
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
                this.scene.sys.game.device.os.desktop
                    ? Input.Keyboard.JustDown(this.slide)
                    : isSliding,

            shoot: {
                shoot: this.scene.sys.game.device.os.desktop
                    ? this.scene.input.activePointer.leftButtonDown()
                    : isShooting,
                timestamp: Date.now(),
            },
            reload: this.scene.sys.game.device.os.desktop
                ? this.scene.input.activePointer.rightButtonDown()
                : reload,

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
        if (entry.reload) {
            player.reload();
        }
        if (entry.shoot.shoot) {
            player.physicsBody.isShooting = true;
            this.Shoot(player, time, bulletGenerator, aimPos);
        } else {
            player.physicsBody.isShooting = false;
        }
        if (Phaser.Input.Keyboard.JustDown(this.switchWeapon!)) {
            this.SwitchWeapon();
        }
    }
    Shoot(
        player: Character,
        time: number,
        bulletGenerator: BulletGenerator,
        aimTarget: { x: number; y: number },
    ) {
        const delay = (60 / player.weaponInfo.rpm) * 1000;
        if (player.physicsBody.isShooting) {
            if (time > player.lastShootTime + delay) {
                player.shoot(time, bulletGenerator, aimTarget);
            }
        }
    }
    SwitchWeapon() {
        const uiscene = this.scene.scene.get("Ui") as Ui;
        let i: number = uiscene.currentSlot;
        const nextSlot = (i + 1) % 3;
        uiscene.switchWeapon(nextSlot);
        uiscene.currentSlot = nextSlot;
    }
}

