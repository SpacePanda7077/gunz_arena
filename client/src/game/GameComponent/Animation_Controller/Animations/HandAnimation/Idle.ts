import {
    BodyPart,
    initialBodyPartPositions,
} from "../../../character_Maker/bodyParts";

export class HandIdleAnimation {
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
        const speed = 0.004;
        const sway = -Math.sin(time * speed);

        bodyParts.hand.y =
            initialBodyPartPositions.hand.y + ((1 + -sway) / 2) * 3;
    }
    end(bodyParts: BodyPart) {}
}

