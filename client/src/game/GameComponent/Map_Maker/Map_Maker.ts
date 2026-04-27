import { ColliderDesc, RigidBodyDesc, World } from "@dimforge/rapier2d-compat";

export class Map_Maker {
    scene: Phaser.Scene;
    world: World;
    map: Phaser.Tilemaps.Tilemap;
    constructor(scene: Phaser.Scene, world: World, mapName: string) {
        this.scene = scene;
        this.world = world;
        this.createVisuals(mapName);
    }
    createVisuals(mapName: string) {
        this.map = this.scene.make.tilemap({ key: mapName });
        const tileset = this.map.addTilesetImage(
            "walls",
        ) as Phaser.Tilemaps.Tileset;
        const groundLayer = this.map.createLayer("ground", tileset);
        const front_wall_layer = this.map.createLayer("front_wall", tileset);
        const back_wall_layer = this.map.createLayer("back_wall", tileset);
        groundLayer?.setDepth(-1000);
        front_wall_layer?.setDepth(-100);
        back_wall_layer?.setDepth(10000);
        this.add_collision();
    }

    add_collision() {
        const collisionLayer = this.map.objects.find(
            (layer) => layer.name === "collision",
        );
        if (collisionLayer) {
            collisionLayer.objects.forEach((obj) => {
                const rbdesc = RigidBodyDesc.fixed().setTranslation(
                    obj.x! + obj.width! / 2,
                    obj.y! + obj.height! / 2,
                );
                const rb = this.world.createRigidBody(rbdesc);
                const coldesc = ColliderDesc.cuboid(
                    obj.width! / 2,
                    obj.height! / 2,
                );
                this.world.createCollider(coldesc, rb);
            });
        }
    }
}

