import { useEffect, useState } from "react";
import { EventBus } from "../game/EventBus";

export function useSceneComponentWatcher() {
    const [currentScene, setCurrentScene] = useState<Phaser.Scene | null>(null);

    useEffect(() => {
        const handler = (scene: Phaser.Scene) => {
            setCurrentScene(scene);
            console.log(scene);
        };

        EventBus.on("current-scene-ready", handler);

        return () => {
            EventBus.off("current-scene-ready", handler);
        };
    }, []);

    return {
        currentScene,
    };
}

