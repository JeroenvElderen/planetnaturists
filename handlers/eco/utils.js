// handlers/eco/utils.js
const { ensureVillageDefaults, getPlayer: baseGetPlayer } = require("./data");

function ensureResources(data) {
  ensureVillageDefaults(data);
  if (!data.village.resources) data.village.resources = {};
}

function getPlayer(data, uid) {
  return baseGetPlayer(data, uid);
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
  getPlayer,
  ensureResources,
  calculateVillageLevel,
  formatLevelUpSummary,
};
