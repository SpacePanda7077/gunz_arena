import { Client, Room, SeatReservation } from "@colyseus/sdk";
import { create } from "zustand";

export const client = new Client("http://localhost:2567");
//https://gunzarena-production.up.railway.app

type RoomType = {
    room: Room | null;
    isConnecting: boolean;
    connectionError: string | null;
    connectToServer: () => Promise<void>;
    consumeReservation: (reservation: SeatReservation) => Promise<void>;
};

export const useHandleColyseus = create<RoomType>((set, get) => ({
    room: null,
    isConnecting: false,
    connectionError: null,

    connectToServer: async () => {
        const state = get();
        if (state.isConnecting) return;

        set({ isConnecting: true, connectionError: null });

        try {
            const room = await client.create("LOBBY"); // or client.join("LOBBY") if it already exists
            console.log("✅ Connected to LOBBY room:", room.roomId);

            set({
                room,
                isConnecting: false,
            });

            // Optional: listen to room events
            room.onMessage("message", (msg) =>
                console.log("Message from server:", msg),
            );
            room.onLeave(() => {
                console.log("Disconnected from room");
                set({ room: null });
            });
        } catch (error: any) {
            console.error("❌ Connection failed:", error);
            set({
                isConnecting: false,
                connectionError: error.message || "Failed to connect",
            });
        }
    },

    consumeReservation: async (reservation: SeatReservation) => {
        try {
            const room = await client.consumeSeatReservation(reservation);
            set({ room, isConnecting: false, connectionError: null });
            console.log("✅ Joined via reservation:", room.roomId);
        } catch (error: any) {
            console.error("Reservation failed:", error);
            set({ connectionError: error.message });
        }
    },
}));

