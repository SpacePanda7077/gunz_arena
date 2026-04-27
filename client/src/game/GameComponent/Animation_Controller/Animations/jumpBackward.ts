import {
    BodyPart,
    initialBodyPartPositions,
} from "../../character_Maker/bodyParts";
import { Math as PhaserMath } from "phaser";
export class JumpBackwardAnimation {
    isAdaptive = false;
    progress = 0;
    start(
        initialBodyPartPositions: initialBodyPartPositions,
        bodyParts: BodyPart,
    ) {
        bodyParts.main_body.setPosition(
            initialBodyPartPositions.main_body.x,
            initialBodyPartPositions.main_body.y,
        );
        bodyParts.head.setPosition(
            initialBodyPartPositions.head.x,
            initialBodyPartPositions.head.y,
        );
        bodyParts.hand.setPosition(
            initialBodyPartPositions.hand.x,
            initialBodyPartPositions.hand.y,
        );
        bodyParts.right_leg.setPosition(
            initialBodyPartPositions.right_leg.x,
            initialBodyPartPositions.right_leg.y,
        );
        bodyParts.left_leg.setPosition(
            initialBodyPartPositions.left_leg.x,
            initialBodyPartPositions.left_leg.y,
        );
        bodyParts.left_leg.rotation = 0;
        bodyParts.right_leg.rotation = 0;
        bodyParts.head.flipX = false;
    }
    update(
        bodyParts: BodyPart,
        initialBodyPartPositions: initialBodyPartPositions,
        time: number,
    ) {
        bodyParts.main_body.setDepth(-10000);
        this.progress += 0.2;
        if (this.progress > 1) this.progress = 1;
        bodyParts.head.x = PhaserMath.Linear(
            bodyParts.head.x,
            -3,
            this.progress,
        );

        bodyParts.left_leg.y = PhaserMath.Linear(
            bodyParts.left_leg.y,
            initialBodyPartPositions.left_leg.y - 2,
            this.progress,
        );
        bodyParts.left_leg.rotation = PhaserMath.Angle.RotateTo(
            bodyParts.left_leg.rotation,
            PhaserMath.DegToRad(40),
            this.progress,
        );
        bodyParts.right_leg.rotation = PhaserMath.Angle.RotateTo(
            bodyParts.right_leg.rotation,
            PhaserMath.DegToRad(-10),
            this.progress,
        );
    }
    end(bodyParts: BodyPart) {
        this.progress = 0;
    }
}

