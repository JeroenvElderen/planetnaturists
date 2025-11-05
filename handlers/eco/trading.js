const { loadData, saveData, getPlayer } = require("./data");

function trade(fromId, toId, resource, amount) {
  const data = loadData();
  const from = getPlayer(data, fromId);
  const to = getPlayer(data, toId);
  const have = from.inventory[resource] || 0;
  if (have < amount) return `❌ You only have ${have} ${resource}.`;
  from.inventory[resource] -= amount;
  to.inventory[resource] = (to.inventory[resource]||0) + amount;
  saveData(data);
  return `🤝 Trade complete! Transferred ${amount} ${resource} to <@${toId}>.`;
}
module.exports = { trade };
