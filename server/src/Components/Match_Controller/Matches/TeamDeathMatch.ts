import uniqid from "uniqid";

export class TeamDeathMatch {
  teamIds: string[];
  constructor() {
    this.teamIds = [];
    for (let i = 0; i < 2; i++) {
      const id = uniqid();
      this.teamIds.push(id);
    }
    console.log(this.teamIds);
  }
  init(teams: any[][]) {}
}
