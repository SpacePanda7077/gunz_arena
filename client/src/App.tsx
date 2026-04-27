import { useEffect } from "react";
import { useHandleColyseus } from "./Zustand/Store";
import Game_Component from "./components/Game/Game_Component";
import Server_Components from "./components/Server/server_components";
import "./App.css";

function App() {
    const connectToServer = useHandleColyseus((state) => state.connectToServer);

    useEffect(() => {
        const connect = async () => {
            console.log("🔄 Starting connection...");
            await connectToServer();
        };

        connect();
    }, [connectToServer]);

    return (
        <div id="app">
            <Game_Component />
            <div>
                <Server_Components />
            </div>
        </div>
    );
}
export default App;
