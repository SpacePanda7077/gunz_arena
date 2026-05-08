import { SeatReservation, type Room } from "@colyseus/sdk";
import { useCallback, useEffect, useState } from "react";
import uniqid from "uniqid";

import Menu_Server_Ui from "./Menu_Server_Ui";
import { useHandleColyseus } from "../../../../Zustand/Store";
import Maps from "./Maps";
import { motion } from "motion/react";
import LeaderBoard from "./LeaderBoard";
import Store from "./Store";
import GunSelection from "./GunSelection";

interface Menu_Ui_Props {
    currentScene: Phaser.Scene;
}
export default function Menu_Ui({ currentScene }: Menu_Ui_Props) {
    const [mapSelectionOpen, setMapSelectionOpen] = useState(false);
    const [isMatchMaking, setIsMatchMaking] = useState(false);
    const [selectedWeapon, setSelectedWeapon] = useState("ak47");
    const room = useHandleColyseus((state) => state.room);
    const consumeReservation = useHandleColyseus(
        (state) => state.consumeReservation,
    );

    const handle_start_game = useCallback(() => {
        console.log(room);
        if (room && room.name === "LOBBY") {
            const teamId = uniqid();
            room.send("match_make", {
                teamId,
                game_mode: "TEAMDEATHMATCH",
                selectedWeapon,
            });
        }
    }, [room, selectedWeapon]);

    useEffect(() => {
        if (!room || room.name !== "LOBBY") return;
        room.onMessage(
            "consume_reservation",
            (data: { reservation: SeatReservation; teamId: string }) => {
                console.log("reservation, tomatch matchmake", data.reservation);

                consumeReservation(data.reservation);
            },
        );
    }, [room]);
    useEffect(() => {
        if (!room || room.name !== "MATCHMAKE") return;
        room.onMessage("consume_reservation", (data: SeatReservation) => {
            console.log(data);
            consumeReservation(data);
        });
    }, [room]);

    useEffect(() => {
        if (room && room.name === "TEAMDEATHMATCH" && currentScene) {
            currentScene.scene.start("Game", { room });
        }
    }, [room, currentScene]);

    return (
        <>
            <div className="absolute w-full top-0 left-0 h-[10%] px-6 flex justify-between items-center">
                <div className="flex items-center">
                    <div className="bg-red-500 p-5 rounded-full border-white border-3">
                        <img
                            className="scale-150"
                            src="favicon.png"
                            alt="favicon"
                        />
                    </div>
                    <div className="bg-[#00000035]">
                        <p> Ikukerredserrereredsu</p>
                        <p>10dfe</p>
                    </div>
                </div>
                <div></div>
            </div>
            <div>
                <div className="w-[200px] absolute left-full top-[100%] translate-x-[-100%] translate-y-[-100%] px-5 py-5">
                    <div className="relative">
                        <Maps selectMapOpen={mapSelectionOpen} />
                        <div className="rounded-md overflow-hidden">
                            <div
                                onClick={() => {
                                    setMapSelectionOpen((prev) => !prev);
                                }}
                                className="bg-black cursor-default px-1"
                            >
                                <h2>ClassRoom</h2>
                            </div>

                            <motion.button
                                onClick={handle_start_game}
                                className="bg-blue-500 text-3xl px-5 py-2 w-full cursor-pointer"
                            >
                                PLAY
                            </motion.button>
                        </div>
                    </div>
                </div>
            </div>
            <Menu_Server_Ui
                room={room}
                isMatchMaking={isMatchMaking}
                setIsMatchMaking={setIsMatchMaking}
            />
            <div className="absolute left-[0%] top-[20%] px-5 py-5 flex flex-col gap-10">
                <Store />
                <LeaderBoard />
            </div>
            <div className="absolute left-[100%] top-[20%] px-5 py-5 flex flex-col gap-10 translate-x-[-100%]">
                <GunSelection
                    setSeletedWeapon={setSelectedWeapon}
                    currentScene={currentScene}
                />
            </div>
        </>
    );
}

