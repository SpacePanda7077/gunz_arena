import { ArraySchema, MapSchema, Schema, type } from "@colyseus/schema";

class Input extends Schema {
  @type("number") x: number = 0;
  @type("number") y: number = 0;
  @type("number") inputIndex: number = 0;
}

export class Player extends Schema {
  inputQueue: {
    input: { x: number; y: number };
    aimPos: { x: number; y: number };
    slide: boolean;
    shoot: { shoot: boolean; timestamp: number };
    speed: number;
    inputIndex: number;
  }[] = [];
  @type("number") x: number = 0;
  @type("number") y: number = 0;
  @type("number") z: number = 0;
  @type("number") health: number = 300;
  @type("number") aimAngle: number = 0;
  @type("number") currentInputIndex: number = 0;
  @type("number") flipped: number = 1;
  @type("string") teamid: string = "";
  @type("string") weaponName: string = "";
  @type("string") sessionId: string = "";
  @type("boolean") isMoving: boolean = false;
  @type("boolean") isSliding: boolean = false;
  @type("boolean") isShooting: boolean = false;
}

export class GameState extends Schema {
  snapshots: {
    timestamp: number;
    positions: Map<string, { x: number; y: number }>;
  }[] = [];
  @type({ map: Player }) players = new MapSchema<Player>();
}
