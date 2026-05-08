import { Scene } from "phaser";
import { EventBus } from "../EventBus";
import { Character } from "../GameComponent/character_Maker/Character";
import { World } from "@dimforge/rapier2d-compat";
import { getWeapons } from "../GameComponent/Weapons/Weapons";
import { Loader } from "../Helper/Loader/Loader";
import { MenuCharacter } from "../GameComponent/character_Maker/MenuSelectionCharacter/Character";

export class Menu extends Scene {
    width: number;
    height: number;
    character: MenuCharacter;
    constructor() {
        super("Menu");
    }

    preload() {
        this.load.setPath("assets");
        const loader = new Loader(this);
        loader.LoadBody();
    }

    create() {
        this.width = Number(this.game.config.width);
        this.height = Number(this.game.config.height);
        const weapon = getWeapons()[0];
        this.character = new MenuCharacter(
            this,
            { x: this.width * 0.5, y: this.height * 0.5 },
            weapon,
        );
        this.character.animation_controller.play("idle");

        this.character.body.setScale(3);
        EventBus.emit("current-scene-ready", this);
        EventBus.on("select", (weaponName: string) =>
            this.loadWeapon(weaponName),
        );
    }
    loadWeapon(weaponName: string) {
        this.character.switchWeapon(weaponName);
    }
}
