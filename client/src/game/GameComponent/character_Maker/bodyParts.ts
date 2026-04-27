import { GameObjects } from "phaser";

export const parts = [
    "head",
    "body",
    "right_hand",
    "left_hand",
    "right_leg",
    "left_leg",
];

export type BodyPart = {
    head: GameObjects.Sprite;
    body: GameObjects.Sprite;
    right_hand: GameObjects.Sprite;
    left_hand: GameObjects.Sprite;
    right_leg: GameObjects.Sprite;
    left_leg: GameObjects.Sprite;
    hand: GameObjects.Container;
    main_body: GameObjects.Container;
    root: GameObjects.Container;
};

export type initialBodyPartPositions = {
    head: { x: number; y: number };
    body: { x: number; y: number };
    right_hand: { x: number; y: number };
    left_hand: { x: number; y: number };
    right_leg: { x: number; y: number };
    left_leg: { x: number; y: number };
    hand: { x: number; y: number };
    main_body: { x: number; y: number };
};

