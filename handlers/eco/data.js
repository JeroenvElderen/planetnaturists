const fs = require("fs");
const path = require("path");
const dataPath = path.join(__dirname, "../../data/ecoData.json");

function loadData() {
  if (!fs.existsSync(dataPath)) {
    fs.writeFileSync(dataPath, JSON.stringify({
      players: {},
      village: { resources: {}, structures: {}, calmness: 50 }
    }, null, 2));
  }
  return JSON.parse(fs.readFileSync(dataPath, "utf8"));
}

function saveData(data) {
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
}

function getPlayer(data, uid) {
  if (!data.players[uid]) data.players[uid] = { xp: 0, calm: 0, inventory: {}, money: 0 };
  if (!data.players[uid].inventory) data.players[uid].inventory = {};
  if (data.players[uid].money === undefined) data.players[uid].money = 0;
  return data.players[uid];
}

module.exports = { loadData, saveData, getPlayer };
