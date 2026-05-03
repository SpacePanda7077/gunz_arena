export const getWeapons = () => {
  const weapons = [
    {
      type: "assault",
      name: "ak47",
      rpm: 600,
      range: 350,
      damage: 35,
      bulletPerShot: 1,
      isBurst: false,
    },
    {
      type: "assault",
      name: "aug",
      rpm: 700,
      range: 400,
      damage: 30,
      bulletPerShot: 1,
      isBurst: false,
    },
    {
      type: "assault",
      name: "sg550",
      rpm: 650,
      range: 450,
      damage: 32,
      bulletPerShot: 1,
      isBurst: false,
    },
    {
      type: "assault",
      name: "m4",
      rpm: 750,
      range: 320,
      damage: 28,
      bulletPerShot: 1,
      isBurst: false,
    },

    {
      type: "smg",
      name: "ump",
      rpm: 550,
      range: 450,
      damage: 32,
      bulletPerShot: 1,
      isBurst: false,
    },
    {
      type: "smg",
      name: "mac10",
      rpm: 1100,
      range: 400,
      damage: 22,
      bulletPerShot: 1,
      isBurst: false,
    },
    {
      type: "smg",
      name: "p90",
      rpm: 900,
      range: 500,
      damage: 24,
      bulletPerShot: 1,
      isBurst: false,
    },
  ];

  return weapons;
};
