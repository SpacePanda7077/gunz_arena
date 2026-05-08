import { AnimationController } from "../../Animation_Controller/Animation_Controller";
import { getWeapons } from "../../Weapons/Weapons";

const weapons = getWeapons();

export class MenuCharacter {
    scene: Phaser.Scene;

    body: Phaser.GameObjects.Container;

    camTarget: Phaser.GameObjects.Rectangle;
    weapon: Phaser.GameObjects.Sprite;
    lastShootTime = 0;
    root: Phaser.GameObjects.Container;
    main_body: Phaser.GameObjects.Container;
    hand: Phaser.GameObjects.Container;
    animation_controller: AnimationController;
    shadow: Phaser.GameObjects.Ellipse;
    flipped = 1;

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

    constructor(
        scene: Phaser.Scene,
        position: { x: number; y: number },
        weapon: (typeof weapons)[0],
    ) {
        this.scene = scene;

        this.weaponInfo = weapon;
        this.mag = this.weaponInfo.magSize;

        this.create_body(position);
    }
    create_body(position: { x: number; y: number }) {
        this.shadow = this.scene.add.ellipse(0, 32, 60, 20, 0x000000, 0.3);

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

                this.scene.load.on(
                    `filecomplete-image-${this.weaponInfo.name}`,
                    () => {
                        if (this.weapon && !this.weapon.scene) return; // object destroyed
                        this.weapon.setTexture(this.weaponInfo.name);
                        this.weapon.setVisible(true);
                    },
                );

                this.scene.load.start();
            } else {
                console.warn(
                    `Loader not available for weapon: ${this.weaponInfo.name}`,
                );
            }
        } else if (this.scene.textures?.exists(this.weaponInfo.name)) {
            console.log("Existe");
            this.weapon.setTexture(this.weaponInfo.name);
            this.weapon.setVisible(true);
        }
    }

    switchWeapon(weaponName: string) {
        // Only load if the texture doesn't already exist
        if (this.scene.textures && !this.scene.textures.exists(weaponName)) {
            if (this.scene.load) {
                // ← Safety check
                this.scene.load.image(
                    weaponName,
                    `weapons/weapons/${weaponName}/${weaponName}.png`,
                );

                this.scene.load.on(`filecomplete-image-${weaponName}`, () => {
                    if (this.weapon && !this.weapon.scene) return; // object destroyed
                    this.weapon.setTexture(weaponName);
                    this.weapon.setVisible(true);
                });

                this.scene.load.start();
            } else {
                console.warn(`Loader not available for weapon: ${weaponName}`);
            }
        } else if (this.scene.textures?.exists(weaponName)) {
            console.log("Existe");
            this.weapon.setTexture(weaponName);
            this.weapon.setVisible(true);
        }
    }
}

