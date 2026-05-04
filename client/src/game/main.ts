import { init } from "@dimforge/rapier2d-compat";
import { Game as MainGame } from "./scenes/Game";
import { Menu } from "./scenes/Menu";
import { Ui } from "./scenes/Ui";
import { AUTO, WEBGL, Game, Scale, Types } from "phaser";
import PhaserRaycaster from "phaser-raycaster";

// Find out more information about the Game Config at:
// https://docs.phaser.io/api-documentation/typedef/types-core#gameconfig
await init();
const config: Types.Core.GameConfig = {
    type: WEBGL,

    scale: {
        mode: Scale.FIT,
        autoCenter: Scale.CENTER_BOTH,
        width: window.innerWidth,
        height: window.innerHeight,
    },
    parent: "game-container",
    backgroundColor: "#26567c",
    scene: [Menu, MainGame, Ui],
    plugins: {
        scene: [
            {
                key: "PhaserRaycaster",
                plugin: PhaserRaycaster,
                mapping: "raycasterPlugin",
            },
        ],
    },
};

const StartGame = (parent: string) => {
    return new Game({ ...config, parent });
};

export default StartGame;
