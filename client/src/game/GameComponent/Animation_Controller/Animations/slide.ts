import {
    BodyPart,
    initialBodyPartPositions,
} from "../../character_Maker/bodyParts";
import { Math as PhaserMath } from "phaser";
export class SlideAnimation {
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

        bodyParts.main_body.y = PhaserMath.Linear(
            initialBodyPartPositions.main_body.y,
            10,
            this.progress,
        );
        bodyParts.head.x = PhaserMath.Linear(
            initialBodyPartPositions.head.x,
            -5,
            this.progress,
        );

        bodyParts.right_leg.x = PhaserMath.Linear(
            initialBodyPartPositions.right_leg.x,
            -3,
            this.progress,
        );
        bodyParts.left_leg.x = PhaserMath.Linear(
            initialBodyPartPositions.left_leg.x,
            15,
            this.progress,
        );
        bodyParts.left_leg.y = PhaserMath.Linear(
            initialBodyPartPositions.left_leg.y,
            30,
            this.progress,
        );
        bodyParts.right_leg.y = PhaserMath.Linear(
            initialBodyPartPositions.left_leg.y,
            34,
            this.progress,
        );
        bodyParts.left_leg.rotation = PhaserMath.Angle.RotateTo(
            bodyParts.left_leg.rotation,
            PhaserMath.DegToRad(-90),
            this.progress,
        );
        bodyParts.right_leg.rotation = PhaserMath.Angle.RotateTo(
            bodyParts.left_leg.rotation,
            PhaserMath.DegToRad(-90),
            this.progress,
        );
        bodyParts.main_body.rotation = PhaserMath.Angle.RotateTo(
            bodyParts.main_body.angle,
            PhaserMath.DegToRad(-30),
            this.progress,
        );
        bodyParts.root.bringToTop(bodyParts.right_leg);
    }
    end(bodyParts: BodyPart) {
        this.progress = 0;
        bodyParts.root.sendToBack(bodyParts.right_leg);
        bodyParts.main_body.rotation = 0;
    }
}

