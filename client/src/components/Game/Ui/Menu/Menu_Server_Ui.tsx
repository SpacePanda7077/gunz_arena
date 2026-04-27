import { type Room } from "@colyseus/sdk";
import { useCallback, useEffect, useState } from "react";
import { useHandleColyseus } from "../../../../Zustand/Store";

interface Menu_Server_Ui_Props {
    room: Room | null;
    isMatchMaking: boolean;
    setIsMatchMaking: (value: boolean) => void;
}
export default function Menu_Server_Ui({
    room,
    isMatchMaking,
    setIsMatchMaking,
}: Menu_Server_Ui_Props) {
    const [timeLeft, setTimeLeft] = useState(0);
    const [currentPlayer, setCurrentPlayer] = useState(0);
    const ConnectToServer = useHandleColyseus((store) => store.connectToServer);

    useEffect(() => {
        if (!room || room.name !== "MATCHMAKE") return;
        const handler = (data: {
            timeleft: number;
            players: { current: number; max: number };
        }) => {
            setTimeLeft(data.timeleft);
            setCurrentPlayer(data.players.current);
        };

        const leaveHandler = () => {
            ConnectToServer();
            setIsMatchMaking(false);
        };

        room.onMessage("time_left", handler);
        room.onLeave(leaveHandler);

        return () => room.removeAllListeners(); // clean up
    }, [room]);

    const handle_leave_room = useCallback(() => {
        if (!room || room.name !== "MATCHMAKE") return;
        room.send("leave_room");
    }, [room]);
    useEffect(() => {
        if (room && room.name === "MATCHMAKE") {
            setIsMatchMaking(true);
        } else {
            console.log("left thr room");
        }
    }, [room]);
    return (
        <>
            {isMatchMaking && (
                <div className=" w-full h-full absolute left-0 top-0 flex justify-center items-center">
                    <div className="w-full h-full absolute bg-black opacity-70"></div>
                    <div className="z-40 w-[40%] bg-blue-500 flex flex-col gap-7 justify-center items-center h-[50%] rounded-lg shadow-lg">
                        <p className="text-2xl font-bold">{timeLeft}</p>
                        <h1 className="text-3xl font-bold">
                            Waiting For Other Players
                        </h1>
                        <p className="text-2xl font-bold">
                            {currentPlayer} / 6
                        </p>
                        <button
                            onClick={handle_leave_room}
                            className="bg-red-500 text-2xl font-bold px-5 py-2 rounded-md"
                        >
                            Leave Room
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}

