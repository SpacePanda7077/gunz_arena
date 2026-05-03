import { Character } from "../../Character/Character";
import { Bot } from "../Bots";
import { ChasingState } from "./States/chasing";
import { WanderingState } from "./States/Wandering";

export class StateManager {
  bot: Bot;
  grid: number[][];
  allPossiblePosition: { x: number; y: number }[];
  states: { wandering: WanderingState; chasing: ChasingState };
  currentState: WanderingState;
  constructor(
    bot: Bot,
    grid: number[][],
    allPossiblePosition: { x: number; y: number }[],
  ) {
    this.bot = bot;
    this.grid = grid;
    this.allPossiblePosition = allPossiblePosition;
    this.states = {
      wandering: new WanderingState(bot, grid, allPossiblePosition, this),
      chasing: new ChasingState(bot, grid, allPossiblePosition, this),
    };

    this.setState("wandering");
  }
  setState(state: "wandering" | "chasing") {
    this.currentState = this.states[state];
    this.currentState.finish();
    this.currentState.start();
  }
  update(currentTarget: Character | Bot, time: number) {
    this.currentState.update(currentTarget, time);
  }
}
