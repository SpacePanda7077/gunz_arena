import { ColliderDesc, RigidBodyDesc, World } from "@dimforge/rapier2d-compat";
import fs from "fs";

export class MapMaker {
  world: World;

  positions: {
    teamDeathMatchPosition: { x: number; y: number }[];
    allPossiblePosition: { x: number; y: number }[];
  };

  mapgrid: number[][];

  constructor(world: World, name: string) {
    this.world = world;

    this.positions = {
      teamDeathMatchPosition: [],
      allPossiblePosition: [],
    };

    this.mapgrid = [];

    this.create_map(name);
  }

  private create_map(name: string) {
    const data = fs.readFileSync(`src/Files/Map/${name}/${name}.json`, "utf-8");

    const mapdata = JSON.parse(data);

    const collisionLayer = mapdata.layers.find(
      (layer: any) => layer.name === "collision",
    );

    const positionLayer = mapdata.layers.find(
      (layer: any) => layer.name === "positions",
    );

    const pathFindingLayer = mapdata.layers.find(
      (layer: any) => layer.name === "pathfind",
    );

    if (!collisionLayer || !positionLayer || !pathFindingLayer) {
      console.log("[MAP CREATION ERROR]: Missing required layers");
      return;
    }

    // collisions
    for (const obj of collisionLayer.objects) {
      this.addCollision(obj);
    }

    // positions
    for (const pos of positionLayer.objects) {
      const position = { x: pos.x, y: pos.y };

      this.positions.allPossiblePosition.push(position);

      if (pos.name) {
        this.positions.teamDeathMatchPosition.push(position);
      }
    }

    // grid
    for (let i = 0; i < pathFindingLayer.data.length; i += mapdata.width) {
      this.mapgrid.push(pathFindingLayer.data.slice(i, i + mapdata.width));
    }
  }

  private addCollision(obj: any) {
    const rbdesc = RigidBodyDesc.fixed()
      .setTranslation(obj.x + obj.width / 2, obj.y + obj.height / 2)
      .setUserData({ type: "WALL" });

    const rb = this.world.createRigidBody(rbdesc);

    const coldesc = ColliderDesc.cuboid(obj.width / 2, obj.height / 2);

    this.world.createCollider(coldesc, rb);
  }
}
