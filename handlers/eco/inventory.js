const { loadData, saveData } = require("./data");
const { ensureResources, getPlayer } = require("./utils");

function inventory(uid) {
  const data = loadData();
  const player = getPlayer(data, uid);
  const inv = Object.entries(player.inventory);
  if (!inv.length) return "🎒 Your inventory is empty.";
  return "🎒 **Your Inventory:**\n" + inv.map(([r, q]) => `${r}: ${q}`).join("\n");
}

function donate(uid, username, resource, amount) {
  const data = loadData();
  ensureResources(data);
  const player = getPlayer(data, uid);

  const have = player.inventory[resource] || 0;
  if (have < amount || amount <= 0)
    return `❌ Not enough **${resource}** (you have ${have}).`;

  player.inventory[resource] -= amount;
  data.village.resources[resource] = (data.village.resources[resource] || 0) + amount;

  saveData(data);
  return `🤝 **${username}** donated ${amount} ${resource} to the village!`;
}

module.exports = { inventory, donate };
