const { loadData, saveData, getPlayer } = require("./data");
const config = require("../../config/ecoConfig");

function earn(uid, amount, reason = "work") {
  const data = loadData();
  const player = getPlayer(data, uid);
  player.money += amount;
  saveData(data);
  return `💰 You earned ${amount} coins for ${reason}! Balance: ${player.money}`;
}

function buy(uid, resource, amount) {
  const data = loadData();
  const player = getPlayer(data, uid);
  const price = (config.store?.prices?.[resource] ?? 5) * amount;
  if (player.money < price) return `❌ Not enough money. Need ${price} 💰.`;
  player.money -= price;
  player.inventory[resource] = (player.inventory[resource] || 0) + amount;
  saveData(data);
  return `🛒 You bought ${amount} ${resource} for ${price} 💰.`;
}

function sell(uid, resource, amount) {
  const data = loadData();
  const player = getPlayer(data, uid);
  const have = player.inventory[resource] || 0;
  if (have < amount) return `❌ You only have ${have} ${resource}.`;
  const price = (config.store?.prices?.[resource] ?? 5) * amount;
  player.inventory[resource] -= amount;
  player.money += price;
  saveData(data);
  return `💵 Sold ${amount} ${resource} for ${price} 💰.`;
}

module.exports = { earn, buy, sell };
