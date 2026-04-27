import { Room, Client, CloseCode, matchMaker, Delayed } from "colyseus";
import { GameState } from "./schema/GameRoomState.js";
import {} from "@dimforge/rapier2d-compat";
import { Between } from "../Helper/Math/Math.js";
export class MatchMakeRoom extends Room {
  maxClients = 6;
  state = new GameState();
  clientJoinTime = 5;
  myteam: { [key: string]: { id: string; teamId: string } } = {};

  messages = {
    leave_room: (client: Client) => {
      if (this.isLocked) return;
      const teams = this.metadata.teamIds as {
        sessionId: string;
        teamId: string;
      }[][];
      const index = teams.findIndex((t) =>
        t.find((p) => p.sessionId === client.sessionId),
      );
      if (index >= 0) {
        const mainIndex = teams[index].findIndex(
          (t) => t.sessionId === client.sessionId,
        );
        if (mainIndex >= 0) {
          this.metadata.teamIds[index].splice(mainIndex, 1);
          if (this.metadata.teamIds[index].length <= 0) {
            this.metadata.teamIds.splice(index, 1);
          }
          client.leave();
          console.log("Remaining Temes", this.metadata.teamIds);
        }
      } else {
        console.log("Your Not In This Lobby");
      }
    },
  };
  clientWaitTime: Delayed;
  teams: { [key: string]: { clients: string[] } };
  sortedTeams: any[];
  isLocked: boolean;

  onCreate(options: any) {
    this.isLocked = false;
    this.sortedTeams = [];
    this.setMetadata({
      game_mode: options.game_mode,
      teamIds: [],
    });

    this.clientWaitTime = this.clock.setInterval(async () => {
      this.clientJoinTime--;
      this.broadcast("time_left", {
        timeleft: this.clientJoinTime,
        players: {
          current: this.clients.length,
          max: this.maxClients,
        },
      });
      if (this.clientJoinTime <= 0) {
        await this.lock();
        console.log(this.metadata.teamIds);
        await this.joinGameRoom();
      }
    }, 1000);
    this.teams = {};
  }

  onJoin(client: Client, options: any) {
    /**
     * Called when a client joins the room.
     */
    const id = client.sessionId;
    const teamId = options.teamId;
    this.myteam[id] = { id: id, teamId };
    const teams = this.metadata.teamIds as {
      sessionId: string;
      teamId: string;
    }[][];
    const index = teams.findIndex((t) => t.find((p) => p.teamId === teamId));
    if (index >= 0) {
      teams[index].push({ sessionId: id, teamId });
    } else {
      teams.push([{ sessionId: id, teamId }]);
    }

    console.log(client.sessionId, "joined! MatchMake");
    console.log("JOINING TEAMs", teams);
  }

  onLeave(client: Client, code: CloseCode) {
    /**
     * Called when a client leaves the room.
     */
    console.log(client.sessionId, "left! MatchMake", code);
  }

  onDispose() {
    /**
     * Called when the room is disposed.
     */
    console.log("room MatchMake", this.roomId, "disposing...");
  }
  async joinGameRoom() {
    if (this.metadata.game_mode === "TEAMDEATHMATCH") {
      this.distributeIntoTwoTeams();
    }
    const room = await matchMaker.createRoom(this.metadata.game_mode, {
      playerCount: this.clients.length,
      game_mode: this.metadata.game_mode,
      teams: this.metadata.teamIds,
    });
    if (room) {
      this.isLocked = true;
      this.clients.forEach(async (cl) => {
        const reservation = await matchMaker.reserveSeatFor(room, {
          teamData: this.myteam[cl.sessionId],
        });
        cl.send("consume_reservation", reservation);
      });
    }
    this.clientWaitTime.clear();
  }

  distributeIntoTwoTeams() {
    const groups = [...this.metadata.teamIds] as any[][]; // copy
    const teams: any[][] = [[], []];

    // Sort largest groups first
    groups.sort((a, b) => b.length - a.length);

    for (const group of groups) {
      // Find team with most available space
      const bestTeamIndex = teams.reduce((bestIdx, team, idx) => {
        const currentSpace = 3 - teams[bestIdx].length;
        const thisSpace = 3 - team.length;
        return thisSpace > currentSpace ? idx : bestIdx;
      }, 0);

      const bestTeam = teams[bestTeamIndex];

      if (bestTeam.length + group.length <= 3) {
        bestTeam.push(...group);
      } else {
        console.warn(`Could not fit group of size ${group.length}`);
        // Fallback: put in first team anyway
        teams[0].push(...group);
      }
    }
    console.log("Distributed Teams:", teams);
    this.metadata.teamIds = teams;
  }
}
