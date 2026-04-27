import {
    BodyPart,
    initialBodyPartPositions,
} from "../../../character_Maker/bodyParts";
import { Math as PhaserMath } from "phaser";
export class HandSlideAnimation {
    isAdaptive = true;
    progress = 0;
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
        bodyParts.main_body.setDepth(-10000);
        this.progress += 0.2;
        if (this.progress > 1) this.progress = 1;

        bodyParts.hand.y = PhaserMath.Linear(
            initialBodyPartPositions.hand.y,
            25,
            this.progress,
        );
        bodyParts.hand.x = PhaserMath.Linear(
            initialBodyPartPositions.hand.x,
            -13,
            this.progress,
        );
    }
    end(bodyParts: BodyPart) {
        this.progress = 0;
        bodyParts.root.sendToBack(bodyParts.right_leg);
    }
}

