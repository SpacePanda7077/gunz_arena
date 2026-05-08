import { GameObjects, Scene } from "phaser";
import { HealthBar } from "../GameComponent/ui/healthbar";
import { client } from "../../Zustand/Store";
import VirtualJoystick from "phaser4-rex-plugins/plugins/virtualjoystick.js";

export class Ui extends Scene {
    UiLayer: Phaser.GameObjects.Layer;

    width: number;
    height: number;
    reloadUi: Phaser.GameObjects.Sprite;
    weaponInvetory: Phaser.GameObjects.Container;
    healthBar: HealthBar;
    ping: Phaser.GameObjects.Text;
    primaryWeaponIcon: Phaser.GameObjects.Sprite;
    weapons: { primary: string; secondary: string };
    secondaryWeaponIcon: GameObjects.Sprite;
    currentSlot: number;
    ourText: GameObjects.Text;
    theirText: GameObjects.Text;
    moveJoyStick: VirtualJoystick;
    shootJoyStick: VirtualJoystick;
    slideBtn: GameObjects.Arc;
    reloadBtn: GameObjects.Arc;
    slidePressed: boolean;
    reloadPressed: boolean;
    constructor() {
        super("Ui");
    }
    init(data: { primary: string; secondary: string }) {
        console.log(data);
        this.weapons = data;
    }
    preload() {
        this.load.setPath("assets");
        this.load.image("selected", "ui/weaponInventory/selected.png");
        this.load.image("health-bar", "ui/healthbar/health-bar.png");
        this.load.image("health-bar-bg", "ui/healthbar/health-bar-bg.png");
        this.load.image("throwables", "ui/weaponInventory/throwables.png");
        this.load.image("scorepanel", "ui/score/panel.png");
        this.load.image("scoredivider", "ui/score/divider.png");
        this.load.spritesheet("reload", "ui/reload.png", {
            frameWidth: 48,
            frameHeight: 48,
        });
        this.load.image(
            `${this.weapons.primary}-icon`,
            `weapons/weapons/${this.weapons.primary}/${this.weapons.primary}.png`,
        );
    }
    create() {
        this.input.addPointer(2);
        this.currentSlot = 0;
        this.slidePressed = false;
        this.reloadPressed = false;
        this.width = Number(this.game.config.width);
        this.height = Number(this.game.config.height);
        this.ping = this.add
            .text(this.width * 0.95, this.height * 0.3, "0")
            .setOrigin(1, 0.5);
        this.addReloadUi();
        this.addScoreUi();
        this.addweaponInventory();
        this.switchWeapon(this.currentSlot);
        const platform = this.sys.game.device;
        console.log("Platform : ", platform);
        if (platform.os.android || platform.os.iPad || platform.os.iPhone) {
        }
        if (!this.sys.game.device.os.desktop) {
            this.createJoystick();
            this.createButtons();
        }

        this.time.addEvent({
            delay: 3000,
            callback: async () => {
                const latancy = await client.getLatency({ pingCount: 1 });
                this.ping.text = `${latancy.toFixed(0)} ms`;
                if (latancy < 120) this.ping.setColor("#00ff00");
                else if (latancy < 180) this.ping.setColor("#ffff00");
                else this.ping.setColor("#ff0000");
            },
            loop: true,
        });
    }
    update(time: number, delta: number): void {}

    addReloadUi() {
        this.reloadUi = this.add
            .sprite(this.width / 2, this.height * 0.6, "reload")
            .setVisible(false);
        this.reloadUi.anims.create({
            key: "reload",
            frames: this.reloadUi.anims.generateFrameNumbers("reload", {
                start: 0,
                end: 4,
            }),
            frameRate: 2.2,
        });
        this.reloadUi.play("reload");
    }
    addScoreUi() {
        const scorePanel = this.add
            .sprite(10, 10, "scorepanel")
            .setOrigin(0)
            .setScale(1.3);
        const didvier = this.add
            .sprite(
                scorePanel.x + scorePanel.width + 10,
                scorePanel.y + scorePanel.height / 2 - 5,
                "scoredivider",
            )
            .setOrigin(0);
        this.ourText = this.add
            .text(didvier.x + 30, didvier.y - 8, "50", {
                fontSize: 25,
                fontStyle: "bold",
            })
            .setOrigin(0.5);
        this.theirText = this.add
            .text(didvier.x + 30, didvier.y + 30, "0", {
                fontSize: 25,
                fontStyle: "BOLD",
            })
            .setOrigin(0.5);
    }
    reload(reloadTime: number) {
        this.reloadUi.setVisible(true);
        this.reloadUi.anims.get("reload").frameRate = reloadTime;
        this.reloadUi.play("reload");
    }

    addweaponInventory() {
        this.weaponInvetory = this.add.container(
            this.width * 0.5,
            this.height * 0.8,
        );

        const primaryWeaponSlot = this.add.sprite(0, 0, "selected");
        const scale = (this.width / primaryWeaponSlot.width) * 0.14;
        primaryWeaponSlot.setScale(scale);
        this.primaryWeaponIcon = this.add.sprite(
            primaryWeaponSlot.x,
            primaryWeaponSlot.y,
            `${this.weapons.primary}-icon`,
        );
        const throwable1 = this.add.sprite(0, 0, "throwables");
        const tScale = (this.width / throwable1.width) * 0.05;
        throwable1.x =
            primaryWeaponSlot.x +
            (primaryWeaponSlot.width / 2) * scale +
            (throwable1.width / 2) * tScale +
            20;
        throwable1.setScale(tScale);

        const throwable2 = this.add.sprite(0, 0, "throwables");

        throwable2.x =
            throwable1.x +
            (throwable1.width / 2) * tScale +
            (throwable1.width / 2) * tScale +
            20;
        throwable2.setScale(tScale);
        this.healthBar = new HealthBar(
            this,
            this.width * 0.5 - 250,
            this.height * 0.88,
            500,
            30,
        );

        this.weaponInvetory.add([
            primaryWeaponSlot,
            this.primaryWeaponIcon,
            throwable1,
            throwable2,
        ]);
    }
    switchWeapon(slot: number) {
        let c: any = this.weaponInvetory.list;
        switch (slot) {
            case 0:
                this.weaponInvetory.list.forEach((c: any) => {
                    c.setTint(0xffffff);
                });

                c[0].setTint(0xfff000);
                break;
            case 1:
                this.weaponInvetory.list.forEach((c: any) => {
                    c.setTint(0xffffff);
                });

                c[2].setTint(0xfff000);
                break;
            case 2:
                this.weaponInvetory.list.forEach((c: any) => {
                    c.setTint(0xffffff);
                });

                c[3].setTint(0xfff000);
                break;

            default:
                break;
        }
    }

    createJoystick() {
        const thumbGameObject = this.add.circle(0, 0, 20, 0xfff000);
        const baseGameObject = this.add
            .circle(0, 0, 40)
            .setStrokeStyle(3, 0xffffff);

        const shootThumbGameObject = this.add.circle(0, 0, 20, 0xfff000);
        const shootBaseGameObject = this.add
            .circle(0, 0, 40)
            .setStrokeStyle(3, 0xffffff);
        this.moveJoyStick = new VirtualJoystick(this, {
            x: this.width * 0.15,
            y: this.height * 0.7,
            radius: 40,
            base: baseGameObject,
            thumb: thumbGameObject,
            // dir: '8dir',
            // forceMin: 16,
            // fixed: true,
            // enable: true
        });

        this.shootJoyStick = new VirtualJoystick(this, {
            x: this.width * 0.85,
            y: this.height * 0.7,
            radius: 40,
            base: shootBaseGameObject,
            thumb: shootThumbGameObject,
            // dir: '8dir',
            // forceMin: 16,
            // fixed: true,
            // enable: true
        });
    }
    createButtons() {
        this.reloadBtn = this.add
            .circle(
                this.shootJoyStick.x - 100,
                this.shootJoyStick.y - 60,
                30,
                0xff0000,
            )
            .setInteractive()
            .on("pointerdown", () => {
                this.reloadPressed = true;
            })
            .on("pointerup", () => {
                this.reloadPressed = false;
            });

        this.slideBtn = this.add
            .circle(
                this.shootJoyStick.x,
                this.shootJoyStick.y - 100,
                30,
                0x0000ff,
            )
            .setInteractive()
            .on("pointerdown", () => {
                this.slidePressed = true;
            })
            .on("pointerup", () => {
                this.slidePressed = false;
            });
    }
}

