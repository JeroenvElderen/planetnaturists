const fs = require("fs");
const path = require("path");
const dataPath = path.join(__dirname, "../../data/ecoData.json");

const { createEnvironmentState, ensureEnvironmentState } = require("./environment");

const DEFAULT_DATA = (() => {
  const now = Date.now();
  const environment = createEnvironmentState(now);
  return {
    players: {},
    village: {
      level: 1,
      xp: 0,
      xpToNext: 0,
      nextLevelRequirement: 100,
      xpRemaining: 100,
      calmness: 50,
      ...environment,
      resources: {},
      structures: {},
      progress: {},
      storage: { level: 1, capacity: 100 },
      metrics: {
        totalDonations: 0,
        unlockedBuildings: 5,
        rareEvents: 0,
        lastGrowthScore: 0,
      },
    },
  };
})();

function ensureVillageDefaults(data) {
  if (!data.village) data.village = { ...DEFAULT_DATA.village };
  const v = data.village;

  if (typeof v.level !== "number" || v.level < 1) v.level = 1;
  if (typeof v.xp !== "number") v.xp = 0;
  const structureScore = Object.keys(v.structures || {}).length;
  const currentGrowth =
    (typeof v.calmness === "number" ? v.calmness : 50) +
    structureScore +
    (v.metrics?.totalDonations || 0);
  if (typeof v.xpToNext !== "number") v.xpToNext = currentGrowth;
  if (typeof v.calmness !== "number") v.calmness = 50;
  ensureEnvironmentState(v, Date.now());
  if (!v.resources) v.resources = {};
  if (!v.structures) v.structures = {};
  if (!v.progress) v.progress = {};
  if (!v.storage)
    v.storage = { level: v.level, capacity: 100 + (v.level - 1) * 50 };
  else {
    v.storage.level = v.level;
    v.storage.capacity = 100 + (v.level - 1) * 50;
  }

  if (!v.metrics)
    v.metrics = {
      totalDonations: 0,
      unlockedBuildings: v.level * 5,
      rareEvents: Math.max(0, v.level - 1),
      lastGrowthScore: currentGrowth,
    };
  else {
    if (typeof v.metrics.totalDonations !== "number") v.metrics.totalDonations = 0;
    v.metrics.unlockedBuildings = v.level * 5;
    v.metrics.rareEvents = Math.max(0, v.level - 1);
    if (typeof v.metrics.lastGrowthScore !== "number")
      v.metrics.lastGrowthScore = currentGrowth;
  }

  if (typeof v.nextLevelRequirement !== "number" || v.nextLevelRequirement <= 0)
    v.nextLevelRequirement = v.level * 100;
  if (typeof v.xpRemaining !== "number")
    v.xpRemaining = Math.max(0, v.nextLevelRequirement - v.xp);
}

function loadData() {
  if (!fs.existsSync(dataPath)) {
    fs.writeFileSync(dataPath, JSON.stringify(DEFAULT_DATA, null, 2));
    return JSON.parse(JSON.stringify(DEFAULT_DATA));
  }
  
  const data = JSON.parse(fs.readFileSync(dataPath, "utf8"));
  if (!data.players) data.players = {};
  ensureVillageDefaults(data);
  return data;
}

function saveData(data) {
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
}

function getPlayer(data, uid) {
  if (!data.players[uid])
    data.players[uid] = { xp: 0, calm: 0, inventory: {}, money: 0, garden: [] };
  if (!data.players[uid].inventory) data.players[uid].inventory = {};
  if (!Array.isArray(data.players[uid].garden)) data.players[uid].garden = [];
  if (data.players[uid].money === undefined) data.players[uid].money = 0;
  return data.players[uid];
}

module.exports = { loadData, saveData, getPlayer };
