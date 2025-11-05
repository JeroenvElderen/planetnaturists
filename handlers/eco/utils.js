// handlers/eco/utils.js
const fs = require("fs");
const path = require("path");

const DATA_PATH = path.join(__dirname, "../../data/ecoData.json");

function loadData() {
  if (!fs.existsSync(DATA_PATH)) {
    return { village: { level: 1, xp: 0, calmness: 50, resources: {}, structures: {}, progress: {}, storage: { level: 1, capacity: 500 } }, players: {} };
  }
  return JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
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

//
// 🌿 New: Village Level System
//
function calculateVillageLevel(data) {
  const v = data.village;
  if (!v) return;

  // XP sources
  const calmnessXP = v.calmness || 0;
  const structureXP = Object.keys(v.structures || {}).length * 25;
  const donationXP = Object.values(v.resources || {}).reduce((sum, amount) => sum + amount, 0);

  const totalXP = calmnessXP + structureXP + donationXP;
  v.xp = totalXP;

  // Level scaling
  const newLevel = Math.floor(totalXP / 200) + 1;
  const leveledUp = newLevel !== v.level;
  v.level = newLevel;
  return leveledUp;
}

module.exports = {
  loadData,
  saveData,
  getPlayer,
  ensureResources,
  calculateVillageLevel,
};
