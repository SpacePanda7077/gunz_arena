import { Scene } from "phaser";
import { EventBus } from "../EventBus";

export class Menu extends Scene {
    constructor() {
        super("Menu");
    }

    preload() {
        this.load.setPath("assets");
    }

    create() {
        this.add.text(500, 300, "MENU SCENE");
        EventBus.emit("current-scene-ready", this);
    }
}
