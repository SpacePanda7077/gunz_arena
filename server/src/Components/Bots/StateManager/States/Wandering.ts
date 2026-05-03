import { AngleBetween, DistanceBetween } from "../../../../Helper/Math/Math";
import { Character } from "../../../Character/Character";
import { Bot } from "../../Bots";
import Easystar from "easystarjs";
import { StateManager } from "../StateMagager";

export class WanderingState {
  bot: Bot;
  grid: number[][];
  allPossiblePosition: { x: number; y: number }[];
  easystar: Easystar.js;
  path: { x: number; y: number }[];
  currentPathIndex: number;
  lastWanderTime: number;
  stateMamager: StateManager;
  constructor(
    bot: Bot,
    grid: number[][],
    allPossiblePosition: { x: number; y: number }[],
    stateMamager: StateManager,
  ) {
    this.bot = bot;
    this.grid = grid;
    this.path = [];
    this.stateMamager = stateMamager;
    this.currentPathIndex = 0;
    this.allPossiblePosition = allPossiblePosition;
    this.easystar = new Easystar.js();
    this.easystar.setGrid(this.grid);
    this.easystar.enableDiagonals();
    this.easystar.setAcceptableTiles([0]);
    this.lastWanderTime = 0;
  }
  start() {}

  update(currentTarget: Character | Bot, time: number) {
    if (this.bot.canSee) {
      this.bot.isChasing = true;
      this.stateMamager.setState("chasing");
    }
    if (this.path.length <= 0) {
      this.findPath();
      this.bot.handleInput({ x: 0, y: 0 });
      return;
    }
    const position = this.bot.rigidBody.translation();
    const mainPath = this.path[this.currentPathIndex];
    const convertedPath = {
      x: mainPath.x * 64,
      y: mainPath.y * 64,
    };
    const angleToTarget = AngleBetween(
      position.x,
      position.y,
      convertedPath.x,
      convertedPath.y,
    );
    const targetDir = {
      x: Math.cos(angleToTarget),
      y: Math.sin(angleToTarget),
    };

    this.bot.setInterest(targetDir);
    this.bot.setDanger();
    const dir = this.bot.choose_desired_dir();

    // dir.x += diradded.x;
    // dir.y += diradded.y;

    this.bot.handleInput(dir);

    const dist = DistanceBetween(
      position.x,
      position.y,
      convertedPath.x,
      convertedPath.y,
    );

    if (dist < 64) {
      this.path.splice(0, 1);
    }
    if (this.bot.velocity.x !== 0) {
      this.bot.flipped = Math.sign(this.bot.velocity.x);
    }

    //this.bot.angle = angleToTarget;
  }

  finish() {
    this.path = [];
  }

  findPath() {
    // Initialize wandering state, e.g., set a random direction
    this.currentPathIndex = 0;
    const random_tile_position =
      this.allPossiblePosition[
        Math.floor(Math.random() * this.allPossiblePosition.length)
      ];

    const position_to_tile = {
      x: Math.floor(this.bot.rigidBody.translation().x / 64),
      y: Math.floor((this.bot.rigidBody.translation().y + 32) / 64),
    };
    const random_tile_position_to_tile = {
      x: Math.floor(random_tile_position.x / 64),
      y: Math.floor(random_tile_position.y / 64),
    };
    this.easystar.findPath(
      position_to_tile.x,
      position_to_tile.y,
      random_tile_position_to_tile.x,
      random_tile_position_to_tile.y,
      (path) => {
        if (path === null) {
          console.log("No path found");
        } else {
          this.path = path;

          // You can set the bot's direction based on the first step in the path
        }
      },
    );
    this.easystar.calculate();
  }
}
