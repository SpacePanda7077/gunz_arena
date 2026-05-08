import { motion } from "motion/react";
import { getWeapons } from "../../../../game/GameComponent/Weapons/Weapons";
import { EventBus } from "../../../../game/EventBus";
import { useState } from "react";
interface GunSelectionProp {
    currentScene: Phaser.Scene;
    setSeletedWeapon: (value: string) => void;
}
export default function GunSelection({
    currentScene,
    setSeletedWeapon,
}: GunSelectionProp) {
    const [isOpen, setIsOpen] = useState(false);
    const weapons = getWeapons();
    const handleSelectWeapon = (weaponName: string) => {
        if (currentScene && currentScene.scene.key === "Menu") {
            EventBus.emit("select", weaponName);
            setSeletedWeapon(weaponName);
        }
    };
    return (
        <>
            <div className="relative">
                <button
                    onClick={() => {
                        setIsOpen((prev) => !prev);
                    }}
                    className="bg-blue-500 p-5 rounded-md w-[200px] "
                >
                    LoadOuts
                </button>

                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: isOpen ? 1 : 0, opacity: isOpen ? 1 : 0 }}
                    className="absolute px-2 gap-3 grid grid-cols-2 justify-center items-center bg-black top-0 left-0 translate-x-[-100%] w-[22vw] h-[70vh] max-h-[70vh] overflow-y-auto rounded-md"
                >
                    {weapons.map((w) => (
                        <div
                            onClick={() => {
                                handleSelectWeapon(w.name);
                            }}
                            key={w.name}
                            className="cursor-pointer w-auto h-auto flex flex-col justify-center items-center border-white border-2 rounded-md overflow-hidden"
                        >
                            <div className="bg-green-500 w-full h-full flex justify-center items-center">
                                <img
                                    src={`assets/weapons/weapons/${w.name}/${w.name}.png`}
                                    alt={`${w.name}`}
                                />
                            </div>
                            <p className="font-bold">{w.name}</p>
                        </div>
                    ))}
                </motion.div>
            </div>
        </>
    );
}

