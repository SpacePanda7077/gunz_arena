import { Math as PhaserMath } from "phaser";
import {
    BodyPart,
    initialBodyPartPositions,
} from "../../../character_Maker/bodyParts";

export class HandRunAnimation {
    isAdaptive = true;
    start(
        initialBodyPartPositions: initialBodyPartPositions,
        bodyParts: BodyPart,
    ) {
        bodyParts.hand.setPosition(
            initialBodyPartPositions.hand.x,
            initialBodyPartPositions.hand.y,
        );
    }
    update(
        bodyParts: BodyPart,
        initialBodyPartPositions: initialBodyPartPositions,
        time: number,
    ) {
        const speed = 0.015;
        const sway1 = Math.cos(time * speed);
        bodyParts.hand.x =
            initialBodyPartPositions.hand.x + ((0.8 + -sway1) / 2) * 10;
    }
    end(bodyParts: BodyPart) {}
}

