import { Input, Scene, Math as PhaserMath, Display } from "phaser";
import { EventBus } from "../EventBus";
import { Map_Maker } from "../GameComponent/Map_Maker/Map_Maker";
import { RigidBody, Vector2, World } from "@dimforge/rapier2d-compat";
import RapierDebugRenderer from "../Helper/PhysicsDebug/PhysicDebug";
import { Character } from "../GameComponent/character_Maker/Character";
import { Input_Handler } from "../GameComponent/Input/input_handler";
import { Callbacks, type Room } from "@colyseus/sdk";
import { backendPlayer } from "../Helper/SchemaTypes/PlayerSchemaType";
import PhaserRaycaster from "phaser-raycaster";
import { BulletGenerator } from "../GameComponent/BulletGenerator/BulletGenerator";

import { Loader } from "../Helper/Loader/Loader";
import { getWeapons } from "../GameComponent/Weapons/Weapons";

export class Game extends Scene {
    world: World;
    map: Map_Maker;
    debugRenderer: RapierDebugRenderer;
    inputHandler: Input_Handler;
    room: Room<any, any>;
    frontendPlayers: { [key: string]: Character };
    targetPlayer: Phaser.GameObjects.Rectangle;
    elapsedTime = 0;
    fixedTick = 1000 / 30;
    aimTarget: Phaser.GameObjects.Rectangle;
    mouse: { x: number; y: number };
    pastTime: number;
    bulletGenerator: BulletGenerator;
    raycasterPlugin: PhaserRaycaster;
    thingsToDestroy: RigidBody[] = [];
    raycaster: Raycaster;
    ray: Raycaster.Ray;
    overlay: Phaser.GameObjects.Graphics;
    visibleArea: Phaser.GameObjects.Graphics;
    lastPos: { x: number; y: number };
    constructor() {
        super("Game");
    }
    init(data: { room: Room }) {
        this.room = data.room;
    }

    preload() {
        this.load.setPath("assets");
        const loader = new Loader(this);
        loader.LoadDefault();
        loader.LoadBody();
    }

    create() {
        this.input.mouse?.disableContextMenu();
        this.initialize_world();
        this.scene.launch("Ui");
        this.lastPos = {
            x: 0,
            y: 0,
        };
        this.debugRenderer = new RapierDebugRenderer(this, this.world, {});
        this.raycaster = this.raycasterPlugin.createRaycaster({
            debug: {
                enabled: false, //enable debug mode
                maps: true, //enable maps debug
                rays: true, //enable rays debug
                graphics: {
                    ray: 0x00ff00, //debug ray color; set false to disable
                    rayPoint: 0xff00ff, //debug ray point color; set false to disable
                    mapPoint: 0x00ffff, //debug map point color; set false to disable
                    mapSegment: 0x0000ff, //debug map segment color; set false to disable
                    mapBoundingBox: 0xff0000, //debug map bounding box color; set false to disable
                },
            },
        });
        // this.raycaster.debugOptions.enable = true;

        // this.raycaster.setOptions({
        //     debug: true,
        // });
        this.overlay = this.add.graphics();
        this.visibleArea = this.make.graphics();

        this.ray = this.raycaster.createRay();
        this.map = new Map_Maker(this, this.world, "killzone", this.raycaster);
        this.overlay
            .fillStyle(0x000000, 0.7)
            .fillRect(
                -10,
                -10,
                this.map.map.widthInPixels,
                this.map.map.heightInPixels,
            );
        this.overlay.setDepth(-1000);
        const darkmask = this.visibleArea.createGeometryMask();
        const mask = this.visibleArea.createGeometryMask();
        mask.invertAlpha = true;
        this.overlay.setMask(mask);
        this.frontendPlayers = {};
        this.pastTime = 0;
        this.mouse = { x: 0, y: 0 };
        const weapons = getWeapons();
        this.bulletGenerator = new BulletGenerator(this, this.world);
        this.aimTarget = this.add
            .rectangle(200, 200, 20, 20, 0xff0000)
            .setVisible(true);

        this.input.on("pointermove", (pointer: Input.Pointer) => {
            this.mouse.x = pointer.x;
            this.mouse.y = pointer.y;
        });

        EventBus.emit("current-scene-ready", this);

        const callbacks = Callbacks.get(this.room);

        callbacks.onAdd("players", (player, sessionId) => {
            console.log("Player joined:", player);
            const id = sessionId as string;
            const backendPlayer = player as backendPlayer;
            const weapon = weapons.find(
                (w) => w.name === backendPlayer.weaponName,
            );
            if (!weapon) return;
            this.frontendPlayers[id] = new Character(
                this,
                this.world,
                {
                    x: backendPlayer.x,
                    y: backendPlayer.y,
                },
                backendPlayer.teamid,
                weapon,
            );
            this.frontendPlayers[id].body.setMask(darkmask);
            this.frontendPlayers[id].health.setMask(darkmask);
            if (id === this.room.sessionId) {
                this.frontendPlayers[id].health.setVisible(false);
                this.targetPlayer = this.add
                    .rectangle(
                        backendPlayer.x,
                        backendPlayer.y,
                        32,
                        32,
                        0xfff000,
                    )
                    .setDepth(10000)
                    .setVisible(false);

                this.cameras.main.startFollow(
                    this.frontendPlayers[id].camTarget,
                    false,
                    0.2,
                    0.2,
                );
                this.inputHandler = new Input_Handler(this);
            }

            callbacks.onChange(player as any, () => {
                const backendPlayer = player as backendPlayer;

                if (id === this.room.sessionId) {
                    const f_player = this.frontendPlayers[id];
                    const ui: any = this.scene.get("Ui");
                    if (ui) {
                        ui.healthBar.setHealth(
                            PhaserMath.Clamp(backendPlayer.health, 0, 300),
                        );
                    }

                    if (!f_player) return;

                    const serverPos = {
                        x: backendPlayer.x,
                        y: backendPlayer.y,
                    };

                    // === RECONCILIATION ===
                    const acknowledgedIndex =
                        this.inputHandler.frontendInput.findIndex(
                            (input) =>
                                input.inputIndex ===
                                backendPlayer.currentInputIndex,
                        );

                    if (acknowledgedIndex !== -1) {
                        // Remove acknowledged inputs
                        this.inputHandler.frontendInput.splice(
                            0,
                            acknowledgedIndex + 1,
                        );

                        // Replay remaining inputs

                        this.inputHandler.frontendInput.forEach((input) => {
                            serverPos.x += input.computedMovement.x;
                            serverPos.y += input.computedMovement.y;
                        });

                        this.targetPlayer.setPosition(serverPos.x, serverPos.y);
                        const currentPos =
                            f_player.physicsBody.rigidBody.translation();
                        const error = PhaserMath.Distance.Between(
                            currentPos.x,
                            currentPos.y,
                            serverPos.x,
                            serverPos.y,
                        );
                        //console.log("Error : ", error);

                        if (error > 20) {
                            f_player.physicsBody.rigidBody.setTranslation(
                                {
                                    x: this.targetPlayer.x,
                                    y: this.targetPlayer.y,
                                },
                                true,
                            );
                        }
                    }
                } else {
                    const f_player = this.frontendPlayers[id];
                    if (
                        f_player.teamid ===
                        this.frontendPlayers[this.room.sessionId].teamid
                    ) {
                        f_player.health.setVisible(false);
                    }
                    const position =
                        f_player.physicsBody.rigidBody.translation();
                    f_player.health.setHealth(backendPlayer.health);

                    const interpolatedPos = {
                        x: PhaserMath.Linear(position.x, backendPlayer.x, 0.6),
                        y: PhaserMath.Linear(position.y, backendPlayer.y, 0.6),
                    };
                    f_player.health.setPosition(
                        interpolatedPos.x,
                        interpolatedPos.y - 100,
                    );
                    f_player.physicsBody.rigidBody.setTranslation(
                        interpolatedPos,
                        true,
                    );

                    f_player.physicsBody.direction.x = backendPlayer.flipped;
                    f_player.flipped = backendPlayer.flipped;

                    f_player.physicsBody.isMoving = backendPlayer.isMoving;
                    f_player.physicsBody.isSliding = backendPlayer.isSliding;
                    f_player.physicsBody.isShooting = backendPlayer.isShooting;
                    f_player.handleAnimations();
                    const aimPos = {
                        x:
                            backendPlayer.x +
                            Math.cos(backendPlayer.aimAngle) * 100,
                        y:
                            backendPlayer.y +
                            Math.sin(backendPlayer.aimAngle) * 100,
                    };
                    f_player.flipCharacter(aimPos);
                    f_player.updateWeaponRotation(aimPos);
                }
            });
        });
        callbacks.onRemove("players", (player, sessionId) => {
            console.log("Player left:", player);
        });

        this.room.onMessage(
            "bullet_shot",
            (data: {
                shooterId: string;
                rayOrigin: { x: number; y: number };
                angle: number;
                toi: number;
            }) => {
                if (data.shooterId === this.room.sessionId) return;
                this.bulletGenerator.drawBullet(
                    data.rayOrigin,
                    data.angle,
                    data.toi,
                );

                this.frontendPlayers[data.shooterId].gunsound.play();
            },
        );
        this.room.onMessage("deleteBullet", (id: string) => {
            console.log("Delete ", id);
            this.bulletGenerator.destroyBullet(id);
        });
        this.room.onMessage("player_died", (data: { id: string }) => {
            this.frontendPlayers[data.id].die();
        });
        this.room.onMessage("respawn", (data: { id: string }) => {
            this.frontendPlayers[data.id].respawn();
        });
    }

    update(time: number, delta: number): void {
        this.elapsedTime += delta;
        while (this.elapsedTime >= this.fixedTick) {
            this.elapsedTime -= this.fixedTick;
            this.fixedUpdate(time);
        }
        for (const id in this.frontendPlayers) {
            const player = this.frontendPlayers[id];

            if (player) {
                if (id === this.room.sessionId) {
                    player.updateWeaponRotation(this.aimTarget);
                    player.handleAnimations();
                    player.flipCharacter(this.aimTarget);
                    this.ray.setOrigin(player.body.x, player.body.y + 32);
                    this.updateCamera(player);
                    this.draw(player);
                    player.autoreload();
                }
                player.updateVisual(0.4);
            }
        }

        //this.debugRenderer.render();
    }
    fixedUpdate(time: number) {
        this.pastTime += this.fixedTick;

        const player = this.frontendPlayers[this.room.sessionId];
        if (!player) return;
        if (!player.physicsBody.isDead) {
            const movement = player.physicsBody.update_body(this.fixedTick);
            this.inputHandler.tick(
                player,
                { x: this.aimTarget.x, y: this.aimTarget.y },
                movement,
                this.room,
                this.pastTime,
                this.bulletGenerator,
            );

            this.updateTarget();
        }
        this.world.step();
        this.bulletGenerator.simulateBullets();
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
    updateTarget() {
        this.aimTarget.x =
            this.cameras.main.worldView.x +
            this.mouse.x / this.cameras.main.zoom;
        this.aimTarget.y =
            this.cameras.main.worldView.y +
            this.mouse.y / this.cameras.main.zoom;
    }

    initialize_world() {
        const gravity = new Vector2(0, 0);
        this.world = new World(gravity);
    }
    draw(player: Character) {
        const dist = PhaserMath.Distance.Between(
            player.body.x,
            player.body.y,
            this.lastPos.x,
            this.lastPos.y,
        );
        this.lastPos = { x: player.body.x, y: player.body.y };
        if (dist > 10) return;
        const intersections = this.ray.castCircle();
        this.visibleArea.clear();
        this.visibleArea.fillPoints(intersections);
        for (let intersection of intersections) {
            this.visibleArea.strokeLineShape({
                x1: this.ray.origin.x,
                y1: this.ray.origin.y,
                x2: intersection.x,
                y2: intersection.y,
                type: 0,
                getPoint: function <O extends Phaser.Geom.Point>(
                    position: number,
                    output?: O,
                ): O {
                    throw new Error("Function not implemented.");
                },
                getPoints: function <O extends Phaser.Geom.Point[]>(
                    quantity: number,
                    stepRate?: number,
                    output?: O,
                ): O {
                    throw new Error("Function not implemented.");
                },
                getRandomPoint: function <O extends Phaser.Geom.Point>(
                    point?: O,
                ): O {
                    throw new Error("Function not implemented.");
                },
                setTo: function (
                    x1?: number,
                    y1?: number,
                    x2?: number,
                    y2?: number,
                ): Phaser.Geom.Line {
                    throw new Error("Function not implemented.");
                },
                setFromObjects: function (
                    start: Phaser.Types.Math.Vector2Like,
                    end: Phaser.Types.Math.Vector2Like,
                ): Phaser.Geom.Line {
                    throw new Error("Function not implemented.");
                },
                getPointA: function <O extends Phaser.Math.Vector2>(
                    vec2?: O,
                ): O {
                    throw new Error("Function not implemented.");
                },
                getPointB: function <O extends Phaser.Math.Vector2>(
                    vec2?: O,
                ): O {
                    throw new Error("Function not implemented.");
                },
                left: 0,
                right: 0,
                top: 0,
                bottom: 0,
            });
        }
        this.visibleArea.fillPoint(this.ray.origin.x, this.ray.origin.y);
    }
    updateCamera(player: Character, delta: number = 16.67) {
        const cam = this.cameras.main;

        // 1. Calculate the desired center point (midpoint between player and aim)
        const targetX = (player.body.x + this.aimTarget.x) * 0.5;
        const targetY = (player.body.y + this.aimTarget.y) * 0.5;

        // 2. Add some "aim bias" - pull camera more towards where you're aiming
        const aimBias = 1; // 0.5 = pure midpoint, 0.7+ = more towards aim
        const biasedX =
            player.body.x * (1 - aimBias) + this.aimTarget.x * aimBias;
        const biasedY =
            player.body.y * (1 - aimBias) + this.aimTarget.y * aimBias;

        // 3. Smooth follow using lerp (feels much better than instant centerOn)
        const lerpFactor = 0.1; // lower = smoother/slower, higher = snappier

        const newScrollX = Phaser.Math.Linear(
            cam.scrollX,
            biasedX - cam.width * 0.5,
            lerpFactor,
        );
        const newScrollY = Phaser.Math.Linear(
            cam.scrollY,
            biasedY - cam.height * 0.5,
            lerpFactor,
        );

        cam.scrollX = newScrollX;
        cam.scrollY = newScrollY;
    }
}
