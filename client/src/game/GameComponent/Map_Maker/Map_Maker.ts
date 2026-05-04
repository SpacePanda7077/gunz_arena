import { ColliderDesc, RigidBodyDesc, World } from "@dimforge/rapier2d-compat";
import { Math as PhaserMath } from "phaser";

// Assuming VisibilityPolygon is loaded via script tag or global
declare const VisibilityPolygon: any;

export class Map_Maker {
    scene: Phaser.Scene;
    world: World;
    map: Phaser.Tilemaps.Tilemap;
    raycaster: Raycaster;

    constructor(
        scene: Phaser.Scene,
        world: World,
        mapName: string,
        raycaster: Raycaster,
    ) {
        this.scene = scene;
        this.world = world;
        this.raycaster = raycaster;
        this.createVisuals(mapName);
    }

    createVisuals(mapName: string) {
        this.map = this.scene.make.tilemap({ key: mapName });
        const tileset = this.map.addTilesetImage(
            "walls",
        ) as Phaser.Tilemaps.Tileset;

        this.map.createLayer("ground", tileset)?.setDepth(-5000);
        this.map.createLayer("front_wall", tileset)?.setDepth(-100);
        this.map.createLayer("back_wall", tileset)?.setDepth(100);

        this.add_collision();
    }

    add_collision() {
        const collisionLayer = this.map.objects.find(
            (l) => l.name === "collision",
        );
        if (!collisionLayer) return;

        collisionLayer.objects.forEach((obj) => {
            const rb = this.world.createRigidBody(
                RigidBodyDesc.fixed().setTranslation(
                    obj.x! + obj.width! / 2,
                    obj.y! + obj.height! / 2,
                ),
            );
            this.world.createCollider(
                ColliderDesc.cuboid(obj.width! / 2, obj.height! / 2),
                rb,
            );
            const rect = this.scene.add.rectangle(
                obj.x! + obj.width! / 2,
                obj.y! + obj.height! / 2,
                obj.width!,
                obj.height!,
            );
            this.raycaster.mapGameObjects(rect);
        });

        // Add map boundaries as a polygon so light doesn't leak out of the world
    }
}

