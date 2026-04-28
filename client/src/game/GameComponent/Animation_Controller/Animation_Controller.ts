import { Scene } from "phaser";
import {
    BodyPart,
    initialBodyPartPositions,
} from "../character_Maker/bodyParts";
import { IdleAnimation } from "./Animations/Idle";
import { RunBackwardAnimation, RunForwardAnimation } from "./Animations/run";
import { SlideAnimation } from "./Animations/slide";
import { JumpForwardAnimation } from "./Animations/jumpForward";
import { JumpBackwardAnimation } from "./Animations/jumpBackward";
import { HandRunAnimation } from "./Animations/HandAnimation/run";
import { HandIdleAnimation } from "./Animations/HandAnimation/Idle";
import { HandSlideAnimation } from "./Animations/HandAnimation/slide";
import { HandShootAnimation } from "./Animations/HandAnimation/shoot";

export class AnimationController {
    bodyParts: BodyPart;
    allAnimations = [
        { idle: new IdleAnimation() },
        { hand_idle: new HandIdleAnimation() },
        { runForward: new RunForwardAnimation() },
        { runBackward: new RunBackwardAnimation() },
        { hand_run: new HandRunAnimation() },
        { slide: new SlideAnimation() },
        { hand_slide: new HandSlideAnimation() },
        { jumpForward: new JumpForwardAnimation() },
        { jumpBackward: new JumpBackwardAnimation() },
        { hand_shoot: new HandShootAnimation() },
    ];

    anims = new Map<string, IdleAnimation>();
    currentAnimation: IdleAnimation | undefined;
    initialBodyPartPositions: initialBodyPartPositions;
    currentAadptiveAnumation: IdleAnimation | undefined;
    constructor(scene: Scene, bodyParts: BodyPart) {
        this.bodyParts = bodyParts;
        this.initializeAnimations();
        this.currentAnimation = this.anims.get("run");
        this.currentAadptiveAnumation = this.anims.get("hand_idle");
        scene.events.on("update", (time: number, delta: number) => {
            if (this.currentAnimation) {
                this.currentAnimation.update(
                    this.bodyParts,
                    this.initialBodyPartPositions,
                    time,
                );
                this.currentAadptiveAnumation?.update(
                    this.bodyParts,
                    this.initialBodyPartPositions,
                    time,
                );
            }
        });
    }

    initializeAnimations() {
        this.initialBodyPartPositions = {
            head: { x: this.bodyParts.head.x, y: this.bodyParts.head.y },
            body: { x: this.bodyParts.body.x, y: this.bodyParts.body.y },
            right_hand: {
                x: this.bodyParts.right_hand.x,
                y: this.bodyParts.right_hand.y,
            },
            left_hand: {
                x: this.bodyParts.left_hand.x,
                y: this.bodyParts.left_hand.y,
            },
            right_leg: {
                x: this.bodyParts.right_leg.x,
                y: this.bodyParts.right_leg.y,
            },
            left_leg: {
                x: this.bodyParts.left_leg.x,
                y: this.bodyParts.left_leg.y,
            },
            hand: { x: this.bodyParts.hand.x, y: this.bodyParts.hand.y },
            main_body: {
                x: this.bodyParts.main_body.x,
                y: this.bodyParts.main_body.y,
            },
        };
        this.allAnimations.forEach((anim) => {
            const [name, animClass] = Object.entries(anim)[0];
            this.anims.set(name, animClass);
        });
    }

    play(key: string) {
        const anim = this.anims.get(key);
        if (anim) {
            if (this.currentAnimation !== anim) {
                this.currentAnimation?.end(this.bodyParts);
                this.currentAnimation = anim;
                this.currentAnimation.start(
                    this.initialBodyPartPositions,
                    this.bodyParts,
                );
            }
        }
    }
    playAdaptive(key: string) {
        const anim = this.anims.get(key);
        if (!anim?.isAdaptive) return;
        if (anim) {
            if (this.currentAadptiveAnumation !== anim) {
                this.currentAadptiveAnumation?.end(this.bodyParts);
                this.currentAadptiveAnumation = anim;
                this.currentAadptiveAnumation.start(
                    this.initialBodyPartPositions,
                    this.bodyParts,
                );
            }
        }
    }
}

