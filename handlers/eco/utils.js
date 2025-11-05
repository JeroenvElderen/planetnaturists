const config = require("../../config/ecoConfig");

function ensureResources(data) {
  if (!data.village.resources) data.village.resources = {};
  for (const res of config.resources) {
    if (typeof data.village.resources[res.name] !== "number")
      data.village.resources[res.name] = 0;
  }
}

function calcLevel(xp) {
  if (xp >= 1000) return 5;
  if (xp >= 500) return 4;
  if (xp >= 250) return 3;
  if (xp >= 100) return 2;
  return 1;
}

function getPlayer(data, uid) {
  if (!data.players[uid])
    data.players[uid] = { xp: 0, calm: 0, inventory: {} };
  if (!data.players[uid].inventory)
    data.players[uid].inventory = {};
  return data.players[uid];
}

module.exports = { ensureResources, calcLevel, getPlayer };
