// handlers/eco/utils.js
const fs = require("fs");
const path = require("path");

const DATA_PATH = path.join(__dirname, "../../data/ecoData.json");
const { createEnvironmentState, ensureEnvironmentState } = require("./environment");

function loadData() {
  if (!fs.existsSync(DATA_PATH)) {
    return {
      village: {
        level: 1,
        xp: 0,
        xpToNext: 50,
        calmness: 50,
        ...createEnvironmentState(Date.now()),
        resources: {},
        structures: {},
        progress: {},
        storage: { level: 1, capacity: 100 },
        nextLevelRequirement: 100,
        xpRemaining: 100,
        metrics: {
          totalDonations: 0,
          unlockedBuildings: 5,
          rareEvents: 0,
          lastGrowthScore: 50,
        },
      },
      players: {},
    };
  }

  const data = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));

  // Ensure new fields exist for legacy saves.
  if (!data.village) data.village = {};
  const v = data.village;
  if (typeof v.level !== "number") v.level = 1;
  if (typeof v.xp !== "number") v.xp = 0;
  if (typeof v.calmness !== "number") v.calmness = 50;
  ensureEnvironmentState(v, Date.now());
  if (!v.resources) v.resources = {};
  if (!v.structures) v.structures = {};
  if (!v.progress) v.progress = {};
  const structureScore = Object.keys(v.structures || {}).length;
  const currentGrowth =
    (typeof v.calmness === "number" ? v.calmness : 50) +
    structureScore +
    (v.metrics?.totalDonations || 0);

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
    if (typeof v.metrics.totalDonations !== "number")
      v.metrics.totalDonations = 0;
    v.metrics.unlockedBuildings = v.level * 5;
    v.metrics.rareEvents = Math.max(0, v.level - 1);
    if (typeof v.metrics.lastGrowthScore !== "number")
      v.metrics.lastGrowthScore = currentGrowth;
  }

  if (typeof v.xpToNext !== "number") v.xpToNext = currentGrowth;
  if (typeof v.nextLevelRequirement !== "number" || v.nextLevelRequirement <= 0)
    v.nextLevelRequirement = v.level * 100;
  if (typeof v.xpRemaining !== "number")
    v.xpRemaining = Math.max(0, v.nextLevelRequirement - (v.xp || 0));

  return data;
}

function saveData(data) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
}

function getPlayer(data, uid) {
  if (!data.players[uid]) {
    data.players[uid] = { inventory: {}, money: 0, calmness: 50 };
  }
  return data.players[uid];
}

function ensureResources(data) {
  if (!data.village.resources) data.village.resources = {};
}

function formatLevelUpSummary(village) {
  if (!village) return "";
  const storage = village.storage?.capacity || 100;
  const blueprints = village.metrics?.unlockedBuildings || village.level * 5;
  const rareEvents =
    village.metrics?.rareEvents ?? Math.max(0, (village.level || 1) - 1);
  const nextTarget = village.nextLevelRequirement || 0;

  return (
    `🎉 The EcoVillage has leveled up to Level ${village.level}! 🌿` +
    `\n📦 Storage capacity: ${storage}` +
    `\n🏘️ Building blueprints unlocked: ${blueprints}` +
    `\n✨ Rare events discovered: ${rareEvents}` +
    (village.level >= 1000
      ? "\n🏔️ The village has reached its legendary peak!"
      : `\n🎯 Next milestone requires ${nextTarget} XP.`)
  );
}

//
// 🌿 New: Village Level System
//
function calculateVillageLevel(data) {
  const v = data.village;
  if (!v) return false;

  v.metrics = v.metrics || {};
  if (typeof v.metrics.totalDonations !== "number") v.metrics.totalDonations = 0;

  const calmnessScore = Math.max(0, v.calmness || 0);
  const structureScore = Object.keys(v.structures || {}).length;
  const donationScore = v.metrics.totalDonations;

  const growthScore = calmnessScore + structureScore + donationScore;
  const previousGrowth =
    typeof v.metrics.lastGrowthScore === "number"
      ? v.metrics.lastGrowthScore
      : growthScore;
  const gainedXp = Math.max(0, growthScore - previousGrowth);
  v.metrics.lastGrowthScore = growthScore;

  v.xp = Math.max(0, (v.xp || 0) + gainedXp);

  // XP target for display uses the village's growth score.
  v.xpToNext = growthScore;

  const MAX_LEVEL = 1000;
  let leveledUp = false;

  if (typeof v.nextLevelRequirement !== "number" || v.nextLevelRequirement <= 0)
    v.nextLevelRequirement = v.level * 100;

  if (v.level < MAX_LEVEL) {
    if (v.xp >= v.nextLevelRequirement) {
      v.level = Math.min(MAX_LEVEL, v.level + 1);
      v.xp = 0;
      leveledUp = true;
      if (v.level < MAX_LEVEL) {
        v.nextLevelRequirement = v.level * 100;
      } else {
        v.nextLevelRequirement = 0;
      }
    }
  } else {
    v.xp = 0;
    v.nextLevelRequirement = 0;
  }

  v.xpRemaining =
    v.level >= MAX_LEVEL ? 0 : Math.max(0, v.nextLevelRequirement - v.xp);

  // Derived unlocks
  v.storage = {
    level: v.level,
    capacity: 100 + (v.level - 1) * 50,
  };

  v.metrics.unlockedBuildings = v.level * 5;
  v.metrics.rareEvents = Math.max(0, v.level - 1);

  return leveledUp;
}

module.exports = {
  loadData,
  saveData,
  getPlayer,
  ensureResources,
  calculateVillageLevel,
  formatLevelUpSummary,
};
