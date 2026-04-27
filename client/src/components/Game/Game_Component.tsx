import { useRef } from "react";
import { IRefPhaserGame, PhaserGame } from "../../PhaserGame";
import { useSceneComponentWatcher } from "../../hooks/useSceneComponentWatcher";
import Menu_Ui from "./Ui/Menu/Menu_Ui";
import { Client, type Room } from "@colyseus/sdk";

export default function Game_Component() {
    const phaserRef = useRef<IRefPhaserGame | null>(null);

    const { currentScene } = useSceneComponentWatcher();

    return (
        <>
            <PhaserGame ref={phaserRef} />
            <div>
                {currentScene?.scene.key === "Menu" && (
                    <Menu_Ui currentScene={currentScene} />
                )}
            </div>
        </>
    );
}

