import { Scene } from "phaser";
import { parts } from "../../GameComponent/character_Maker/bodyParts";

export class Loader {
    scene: Scene;
    constructor(scene: Scene) {
        this.scene = scene;
    }
    LoadDefault() {
        this.scene.load.tilemapTiledJSON(
            "killzone",
            "maps/json/killzone/killzone.json",
        );
        this.scene.load.image("walls", "maps/pngs/killzone/walls.png");
        this.scene.load.spritesheet(
            "assault_flash",
            "weapons/muzzle_flash/assault/assault.png",
            { frameWidth: 32, frameHeight: 32 },
        );

        this.scene.load.spritesheet(
            "blood_splat",
            "fx/blood_splat/blood_splat.png",
            { frameWidth: 64, frameHeight: 64 },
        );
        this.scene.load.spritesheet("blood", "fx/blood_splat/blood.png", {
            frameWidth: 256,
            frameHeight: 256,
        });
    }

    LoadBody(imageLink?: string) {
        parts.forEach((part) => {
            this.scene.load.image(
                part,
                imageLink ? `${imageLink}/${part}.png` : `body/${part}.png`,
            );
        });
    }
}

