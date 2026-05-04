import { Scene } from "phaser";
import { HealthBar } from "../GameComponent/ui/healthbar";

export class Ui extends Scene {
    UiLayer: Phaser.GameObjects.Layer;

    width: number;
    height: number;
    reloadUi: Phaser.GameObjects.Sprite;
    weaponInvetory: Phaser.GameObjects.Container;
    healthBar: HealthBar;
    constructor() {
        super("Ui");
    }
    preload() {
        this.load.setPath("assets");
        this.load.image("selected", "ui/weaponInventory/selected.png");
        this.load.image("healthbar", "ui/weaponInventory/healthbar.png");
        this.load.image(
            "innerHealthbar",
            "ui/weaponInventory/innerHealthbar.png",
        );
        this.load.image("throwables", "ui/weaponInventory/throwables.png");
        this.load.spritesheet("reload", "ui/reload.png", {
            frameWidth: 48,
            frameHeight: 48,
        });
    }
    create() {
        this.width = Number(this.game.config.width);
        this.height = Number(this.game.config.height);

        this.addReloadUi();
        this.addweaponInventory();
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
        const primaryWeapon = this.add.sprite(0, 0, "selected");
        const scale = (this.width / primaryWeapon.width) * 0.1;
        primaryWeapon.x = -(primaryWeapon.width * scale + 20);
        primaryWeapon.setScale(scale);
        const secondaryWeapon = this.add.sprite(0, 0, "selected");
        secondaryWeapon.setScale(scale);

        const throwable1 = this.add.sprite(0, 0, "throwables");
        const tScale = (this.width / throwable1.width) * 0.05;
        throwable1.x =
            secondaryWeapon.x +
            (secondaryWeapon.width / 2) * scale +
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
            primaryWeapon,
            secondaryWeapon,
            throwable1,
            throwable2,
        ]);
    }
}

