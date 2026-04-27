import { Room, Client, CloseCode, matchMaker } from "colyseus";
import { GameState } from "./schema/GameRoomState.js";
import {} from "@dimforge/rapier2d-compat";
export class LobbyRoom extends Room {
  maxClients = 3;
  state = new GameState();

  messages = {
    match_make: async (
      client: Client,
      data: { teamId: string; game_mode: string },
    ) => {
      if (this.inGame) {
        return;
      }
      await this.lock();
      await this.findRoom(data.game_mode, data.teamId);
      this.inGame = true;
      console.log("MatchMaking", this.roomId);
    },
  };
  MaxRoomCount: number = 5;
  inGame: boolean;

  onCreate(options: any) {
    this.inGame = false;
    /**
     * Called when a new room is created.
     */
  }

  async onJoin(client: Client, options: any) {
    /**
     * Called when a client joins the room.
     */
    console.log(client.sessionId, "joined! Lobby");
    const allRooms = await matchMaker.query({ name: "LOBBY" });
    console.log(allRooms.length);
    console.log(this.clients.length);
  }

  onLeave(client: Client, code: CloseCode) {
    /**
     * Called when a client leaves the room.
     */
    console.log(client.sessionId, "left! LOBBY", code);
  }

  onDispose() {
    /**
     * Called when the room is disposed.
     */
    console.log("room LOBBY", this.roomId, "disposing...");
  }

  async findRoom(game_mode: string, teamId: string) {
    const allRooms = await matchMaker.query({ name: "MATCHMAKE" });
    if (allRooms.length >= this.MaxRoomCount) {
      console.log("[Server Full]: Server is full !!!");
      return;
    }
    console.log(allRooms);
    const available_room = allRooms.find(
      (room) =>
        !room.locked &&
        !room.private &&
        room.metadata.game_mode === game_mode &&
        room.maxClients - room.clients >= this.clients.length &&
        !this.checkIfWouldCreateThreePairs(teamId, room.metadata.teamIds),
    );
    const teamIds: string[] = [];
    this.clients.forEach(async (cl) => {
      teamIds.push(teamId);
    });
    if (available_room) {
      console.log(available_room);
      this.clients.forEach(async (cl) => {
        const reservation = await matchMaker.reserveSeatFor(available_room, {
          teamId,
        });
        cl.send("consume_reservation", { reservation, teamId });
      });
    } else {
      const room = await matchMaker.createRoom("MATCHMAKE", {
        game_mode,
      });
      this.clients.forEach(async (cl) => {
        const reservation = await matchMaker.reserveSeatFor(room, { teamId });
        console.log(reservation);
        cl.send("consume_reservation", { reservation, teamId });
      });
    }
  }
  checkIfWouldCreateThreePairs(
    teamId: string,
    currentGroups: any[][],
  ): boolean {
    const newGroups = [...currentGroups, [teamId]];

    if (newGroups.length !== 3) return false;

    const pairCount = newGroups.filter((g) => g.length === 2).length;

    return pairCount === 3;
  }
}
