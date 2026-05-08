import { motion } from "motion/react";
interface MapProps {
    selectMapOpen: boolean;
}
export default function Maps({ selectMapOpen }: MapProps) {
    const MapData = [
        {
            name: "ClassRoom",
            availability: "Available",
        },
        {
            name: "KillZone",
            availability: "Coming Soon",
        },
        {
            name: "Yard",
            availability: "Coming Soon",
        },
        {
            name: "Yard",
            availability: "Coming Soon",
        },
    ];
    return (
        <>
            <motion.div
                initial={{ scale: 0 }}
                animate={{
                    scale: selectMapOpen ? 1 : 0,
                    opacity: selectMapOpen ? 1 : 0,
                }}
                className="absolute p-5 left-[5%] top-[0%] translate-x-[-100%] translate-y-[-100%] bg-black overflow-x-auto max-w-[50vw] w-[50vw] h-[70vh] flex gap-10 rounded-lg"
            >
                {MapData.map((data, index) => (
                    <div
                        key={index}
                        className="cursor-pointer border-white border-2 flex justify-center items-center min-w-[200px] w-[200px] rounded-md relative"
                    >
                        {data.availability !== "Available" && <ComingSoon />}

                        <div>
                            <h1>{data.name}</h1>
                        </div>
                    </div>
                ))}
            </motion.div>
        </>
    );
}

function ComingSoon() {
    return (
        <>
            <div className="absolute rotate-45">
                <h1 className="text-5xl z-10 opacity-50">Coming Soon !!!</h1>
            </div>
        </>
    );
}

