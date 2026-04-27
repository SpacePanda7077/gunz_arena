import { SeatReservation, type Room } from "@colyseus/sdk";
import { useCallback, useEffect, useState } from "react";
import uniqid from "uniqid";

import Menu_Server_Ui from "./Menu_Server_Ui";
import { useHandleColyseus } from "../../../../Zustand/Store";

interface Menu_Ui_Props {
    currentScene: Phaser.Scene;
}
export default function Menu_Ui({ currentScene }: Menu_Ui_Props) {
    const [isMatchMaking, setIsMatchMaking] = useState(false);
    const room = useHandleColyseus((state) => state.room);
    const consumeReservation = useHandleColyseus(
        (state) => state.consumeReservation,
    );

    const handle_start_game = useCallback(() => {
        console.log(room);
        if (room && room.name === "LOBBY") {
            const teamId = uniqid();
            room.send("match_make", { teamId, game_mode: "TEAMDEATHMATCH" });
        }
    }, [room]);

    useEffect(() => {
        if (!room || room.name !== "LOBBY") return;
        room.onMessage(
            "consume_reservation",
            (data: { reservation: SeatReservation; teamId: string }) => {
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
            <div>
                <div className="absolute left-full top-[100%] translate-x-[-100%] translate-y-[-100%] px-5 py-5">
                    <button
                        onClick={handle_start_game}
                        className="bg-blue-500 text-3xl px-5 py-2 rounded-md shadow-md"
                    >
                        PLAY
                    </button>
                </div>
            </div>
            <Menu_Server_Ui
                room={room}
                isMatchMaking={isMatchMaking}
                setIsMatchMaking={setIsMatchMaking}
            />
        </>
    );
}

