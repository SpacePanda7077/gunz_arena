import { Room, Client, CloseCode } from "colyseus";
import { GameState, Player } from "./schema/GameRoomState.js";
import {
  EventQueue,
  init,
  RigidBody,
  Vector2,
  World,
} from "@dimforge/rapier2d-compat";
import { MapMaker } from "../Components/Map/Map_Maker.js";
import { Match_Controller } from "../Components/Match_Controller/Match_Controller.js";
import { Character } from "../Components/Character/Character.js";
import { AngleBetween, Between } from "../Helper/Math/Math.js";
import { BulletGenerator } from "../Components/BulletGenerator/BulletGenerator.js";
import { CollisionChecker } from "../Components/Collisionchecker/CollisionChecker.js";
import { Bot } from "../Components/Bots/Bots.js";
import uniqid from "uniqid";
import { getWeapons } from "../Components/Weapons/Weapons.js";
export class TeamDeathMatchRoom extends Room {
  maxClients = 6;
  state = new GameState();
  world: World;
  map: MapMaker;
  matchController: Match_Controller;
  waitTimer: any;
  players: { [key: string]: Character | Bot } = {};
  thingsToDestroy: RigidBody[];
  elapsedTime = 0;
  pastTime = 0;
  fixedTick = 1000 / 30;
  messages = {
    move: (
      client: Client,
      data: {
        input: { x: number; y: number };
        aimPos: { x: number; y: number };
        slide: boolean;
        shoot: { shoot: boolean; timestamp: number };
        speed: number;
        inputIndex: number;
      },
    ) => {
      const id = client.sessionId;
      const playerState = this.state.players.get(id);

      playerState.inputQueue.push(data);
    },
  };
  bulletGenerator: BulletGenerator;
  collisionChecker = new CollisionChecker();
  eventQueue: EventQueue;
  weapons: {
    type: string;
    name: string;
    rpm: number;
    range: number;
    damage: number;
    bulletPerShot: number;
    isBurst: boolean;
  }[];

  async onCreate(options: any) {
    await this.InitRapier();
    this.seatReservationTimeout = 30;
    this.setMetadata({
      playerCount: options.playerCount,
      game_mode: options.game_mode,
      teams: options.teams,
    });
    console.log("Game Teams : ", this.metadata.teams);
    this.matchController = new Match_Controller("TEAMDEATHMATCH");
    this.awaitForAllPlayer();
    this.map = new MapMaker(this.world, "killzone");
    this.weapons = getWeapons();
    this.thingsToDestroy = [];
    this.bulletGenerator = new BulletGenerator(this.world);

    /**
     * Simulate Interval.
     */

    this.setSimulationInterval((delta: number) => {
      this.elapsedTime += delta;

      while (this.elapsedTime >= this.fixedTick) {
        this.elapsedTime -= this.fixedTick;
        this.fixedUpdate();
      }
    }, 1000 / 30);
  }

  fixedUpdate() {
    this.pastTime += this.fixedTick;
    const currentSnapshot: Map<string, { x: number; y: number }> = new Map();

    for (const id in this.players) {
      const player = this.players[id];

      const playerState = this.state.players.get(id);
      const input = playerState.inputQueue.shift();
      if (input) {
        if (!player.isSliding) {
          player.handleInput(input.input);
        }
        if (input.input.x !== 0) {
          player.flipped = Math.sign(input.input.x);
        }

        playerState.currentInputIndex = input.inputIndex;
        const position = player.rigidBody.translation();
        const aimAngle = AngleBetween(
          position.x,
          position.y,
          input.aimPos.x,
          input.aimPos.y,
        );
        playerState.aimAngle = aimAngle;

        if (input.slide) {
          player.slide();
        }
        player.isShooting = input.shoot.shoot;
        if (player.isShooting) {
          this.shoot(id, player.isShooting, input.shoot.timestamp);
        }
      }
      if (player.isDead) {
        player.respawn(
          this.pastTime,
          this.map.positions.allPossiblePosition,
          this,
        );
        continue;
      }
      if (player instanceof Bot) {
        playerState.aimAngle = player.angle;
        if (player.isShooting) {
          this.shoot(id, player.isShooting, Date.now());
        }
        player.checkDistance(this.state, this.players, this.pastTime);
        const canSee = player.checkIfCanSee(this.players, this.fixedTick);

        player.canSee = canSee;
      }
      player.isMoving = player.direction.x !== 0 || player.direction.y !== 0;

      player.update_body(this.fixedTick, this.pastTime);

      player.handleAnimations();
      if (player.health <= 0) {
        player.die(this.pastTime, this);
      }

      const position = player.rigidBody.translation();

      playerState.x = position.x;
      playerState.y = position.y;
      playerState.z = player.z;
      playerState.health = player.health;
      playerState.isMoving = player.isMoving;
      playerState.isSliding = player.isSliding;
      playerState.isShooting = player.isShooting;
      playerState.flipped = player.flipped;
      currentSnapshot.set(id, position);
    }
    this.state.snapshots.push({
      timestamp: Date.now(),
      positions: currentSnapshot,
    });
    if (this.state.snapshots.length > 60) {
      this.state.snapshots.shift();
    }
    this.world.step(this.eventQueue);
    this.bulletGenerator.simulateBullets();
    this.collisionChecker.checkCollision(
      this.eventQueue,
      this.world,
      this.bulletGenerator,
      this.thingsToDestroy,
      this,
    );
    this.applyPendingPhysicsChanges();
  }
  applyPendingPhysicsChanges() {
    // 1. First remove everything that needs removing
    for (const body of this.thingsToDestroy) {
      if (body) {
        try {
          this.world.removeRigidBody(body);
        } catch (e) {
          console.warn("removeRigidBody failed", e);
        }
      }
    }
    this.thingsToDestroy.length = 0;
  }

  shoot(id: string, shoot: boolean, clientTimestamp: number) {
    const player = this.players[id];
    if (!shoot) return;
    const delay = (60 / player.weapon.rpm) * 1000;
    if (this.pastTime > player.lastShootTime + delay) {
      const playerState = this.state.players.get(id);
      this.bulletGenerator.createBullet(
        player,
        this.players,
        this.state,
        clientTimestamp,
        playerState.aimAngle,
        id,
        this,
        this.pastTime,
      );
      player.lastShootTime = this.pastTime;
    }
  }

  onJoin(client: Client, options: any) {
    /**
     * Called when a client joins the room.
     */
    console.log(client.sessionId, "joined!");
    const id = client.sessionId;
    const teamData = options.teamData;
    const index = this.getMyTeam(teamData.id);
    const teamid = this.matchController.match.teamIds[index];
    const player = new Player();
    const position = this.map.positions.teamDeathMatchPosition[index];
    const mainPosition = {
      x: Between(position.x - 200, position.x + 200),
      y: Between(position.y - 200, position.y + 200),
    };
    console.log(position);
    player.x = mainPosition.x;
    player.y = mainPosition.y;
    player.sessionId = id;
    player.teamid = teamid;
    const weapon = this.weapons[4];
    player.weaponName = weapon.name;
    this.players[id] = new Character(
      this.world,
      mainPosition,
      teamid,
      id,
      weapon,
    );
    this.state.players.set(id, player);

    if (this.clients.length === this.metadata.playerCount) {
      const remainingSpot = this.maxClients - this.clients.length;
      for (let i = 0; i < remainingSpot; i++) {
        this.addBots();
      }
    }
  }

  onLeave(client: Client, code: CloseCode) {
    console.log(client.sessionId, "left!", code);
  }

  onDispose() {
    /**
     * Called when the room is disposed.
     */
    console.log("room", this.roomId, "disposing...");
  }
  async InitRapier() {
    await init();
    const gravity = new Vector2(0, 0);
    this.world = new World(gravity);
    this.eventQueue = new EventQueue(true);
  }

  awaitForAllPlayer() {
    this.waitTimer = this.clock.setTimeout(() => {
      this.matchController.initialize();
    }, 10000);
  }
  getMyTeam(id: string) {
    const teams = this.metadata.teams as {
      sessionId: string;
      teamId: string;
    }[][];
    const teamIndex = teams.findIndex((t) => t.find((p) => p.sessionId === id));
    return teamIndex;
  }
  addBots() {
    const id = uniqid();
    const teams = this.metadata.teams as {
      sessionId: string;
      teamId: string;
    }[][];

    const index = teams.findIndex((t) => t.length < 3);
    if (index === -1) return;
    const teamid = this.matchController.match.teamIds[index];
    const player = new Player();
    const position = this.map.positions.teamDeathMatchPosition[index];
    const mainPosition = {
      x: Between(position.x - 200, position.x + 200),
      y: Between(position.y - 200, position.y + 200),
    };
    console.log(position);
    player.x = mainPosition.x;
    player.y = mainPosition.y;
    player.sessionId = id;
    player.teamid = teamid;
    const weapon = this.weapons[Math.floor(Math.random() * 4)];
    player.weaponName = weapon.name;
    this.players[id] = new Bot(
      this.world,
      mainPosition,
      teamid,
      id,
      this.map.mapgrid,
      this.map.positions.allPossiblePosition,
      weapon,
    );
    this.state.players.set(id, player);
    teams[index].push({ sessionId: id, teamId: teamid });
    console.log(teams);
  }
}
