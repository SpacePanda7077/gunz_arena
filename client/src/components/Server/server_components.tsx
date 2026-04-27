import { useHandleColyseus } from "../../Zustand/Store";

export default function Server_Components() {
    const isConnecting = useHandleColyseus((store) => store.isConnecting);
    const error = useHandleColyseus((store) => store.connectionError);
    return (
        <>
            {isConnecting && (
                <div className=" w-full h-full absolute left-0 top-0 flex justify-center items-center">
                    <div className="w-full h-full absolute bg-black opacity-70"></div>
                    <div className="z-40 w-[40%] bg-blue-500 flex justify-center items-center h-[50%] rounded-lg shadow-lg">
                        <h1 className="text-3xl font-bold">
                            Connecting To Server
                        </h1>
                    </div>
                </div>
            )}
            {error && (
                <div className=" w-full h-full absolute left-0 top-0 flex justify-center items-center">
                    <div className="w-full h-full absolute bg-black opacity-70"></div>
                    <div className="z-40 w-[40%] bg-blue-500 flex justify-center items-center h-[50%] rounded-lg shadow-lg">
                        <h1 className="text-3xl font-bold">
                            Error Connecting to Server
                        </h1>
                    </div>
                </div>
            )}
        </>
    );
}

