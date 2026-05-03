import { Input, Scene, Math as PhaserMath } from "phaser";
import { EventBus } from "../EventBus";
import { Map_Maker } from "../GameComponent/Map_Maker/Map_Maker";
import { RigidBody, Vector2, World } from "@dimforge/rapier2d-compat";
import RapierDebugRenderer from "../Helper/PhysicsDebug/PhysicDebug";
import { Character } from "../GameComponent/character_Maker/Character";
import { Input_Handler } from "../GameComponent/Input/input_handler";
import { Callbacks, type Room } from "@colyseus/sdk";
import { backendPlayer } from "../Helper/SchemaTypes/PlayerSchemaType";

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
    thingsToDestroy: RigidBody[] = [];
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
        this.debugRenderer = new RapierDebugRenderer(this, this.world, {});
        this.map = new Map_Maker(this, this.world, "killzone");
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
            console.log(backendPlayer, id);
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
            if (id === this.room.sessionId) {
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
                    ui.healthUi.text = backendPlayer.health.toString();
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
                            const hurtBoxPosition = {
                                x: this.targetPlayer.x,
                                y: this.targetPlayer.y + backendPlayer.z,
                            };

                            f_player.physicsBody.hurtBox_rigidBody.setTranslation(
                                hurtBoxPosition,
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
                    f_player.health.text = backendPlayer.health.toString();

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
                    const hurtBoxPosition = {
                        x: interpolatedPos.x,
                        y: interpolatedPos.y,
                    };

                    f_player.physicsBody.hurtBox_rigidBody.setTranslation(
                        hurtBoxPosition,
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
                console.log("shooting");
                if (data.shooterId === this.room.sessionId) return;
                this.bulletGenerator.drawBullet(
                    data.rayOrigin,
                    data.angle,
                    data.toi,
                );
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
}
