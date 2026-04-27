import { Scene } from "phaser";

export class Ui extends Scene {
    UiLayer: Phaser.GameObjects.Layer;
    healthUi: Phaser.GameObjects.Text;
    constructor() {
        super("Ui");
    }
    create() {
        this.healthUi = this.add.text(300, 300, "300");
    }
    update(time: number, delta: number): void {}
}

