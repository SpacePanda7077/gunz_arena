import { Math as PhaserMath } from "phaser";
import {
    BodyPart,
    initialBodyPartPositions,
} from "../../character_Maker/bodyParts";

export class RunAnimation {
    isAdaptive = false;
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
        const speed = 0.015;
        const sway1 = Math.cos(time * speed);
        const sway2 = -Math.sin(time * speed);
        const bodySway = Math.sin(time * speed * 2);
        bodyParts.main_body.y =
            initialBodyPartPositions.main_body.y + ((-1 + bodySway) / 2) * 4;
        bodyParts.left_leg.x =
            initialBodyPartPositions.left_leg.x + ((-1 + sway1) / 2) * 20;
        bodyParts.left_leg.y =
            initialBodyPartPositions.left_leg.y + -1 * ((1 + sway2) / 2) * 5;
        bodyParts.left_leg.rotation = PhaserMath.DegToRad(
            ((-sway1 + 1) / 2) * 100 - 20,
        );

        bodyParts.right_leg.x =
            initialBodyPartPositions.right_leg.x + ((1 + -sway1) / 2) * 20;
        bodyParts.right_leg.y =
            initialBodyPartPositions.right_leg.y + -1 * ((1 - sway2) / 2) * 5;
        bodyParts.right_leg.rotation = PhaserMath.DegToRad(
            ((sway1 + 1) / 2) * 100 - 20,
        );
    }
    end(bodyParts: BodyPart) {}
}

