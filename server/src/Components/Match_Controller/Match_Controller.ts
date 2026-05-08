import { TeamDeathMatch } from "./Matches/TeamDeathMatch";

type Match_Type = "TEAMDEATHMATCH" | "FREEFORALL";
export class Match_Controller {
  match: TeamDeathMatch;
  GameStarted: boolean;
  GameOver: boolean;
  constructor(matchType: Match_Type) {
    this.GameStarted = false;
    this.GameOver = false;
    if (matchType === "TEAMDEATHMATCH") {
      this.match = new TeamDeathMatch();
    }
  }

  initialize() {
    this.GameStarted = true;
  }
}
