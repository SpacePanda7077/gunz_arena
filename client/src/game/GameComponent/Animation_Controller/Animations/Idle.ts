import {
    BodyPart,
    initialBodyPartPositions,
} from "../../character_Maker/bodyParts";

export class IdleAnimation {
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
        const speed = 0.004;
        const sway = -Math.sin(time * speed);

        bodyParts.head.y =
            initialBodyPartPositions.head.y + ((1 + sway) / 2) * 3;
        bodyParts.head.x =
            initialBodyPartPositions.head.x + ((-0.6 + sway) / 2) * 2;
        bodyParts.body.y =
            initialBodyPartPositions.body.y + ((1 + -sway) / 2) * 1.5;
        bodyParts.hand.y =
            initialBodyPartPositions.hand.y + ((1 + -sway) / 2) * 3;
    }
    end(bodyParts: BodyPart) {}
}

