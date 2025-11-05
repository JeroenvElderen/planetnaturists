// handlers/eco/inventory.js
const { loadData, saveData } = require("./data");
const { 
  ensureResources, 
  getPlayer, 
  calculateVillageLevel,
  formatLevelUpSummary,
 } = require("./utils");
const { refreshVillageEmbed } = require("../villageUpdater");

function inventory(uid) {
  const data = loadData();
  const player = getPlayer(data, uid);
  const inv = Object.entries(player.inventory);
  if (!inv.length) return "🎒 Your inventory is empty.";
  return (
    "🎒 **Your Inventory:**\n" +
    inv.map(([r, q]) => `${r}: ${q}`).join("\n")
  );
}

function donate(uid, username, resource, amount, client) {
  const data = loadData();
  ensureResources(data);
  const player = getPlayer(data, uid);
  const have = player.inventory[resource] || 0;

  if (have < amount || amount <= 0)
    return `❌ Not enough **${resource}** (you have ${have}).`;

   const storageCapacity = data.village.storage?.capacity || 100;
  const totalStored = Object.values(data.village.resources || {}).reduce(
    (sum, qty) => sum + qty,
    0
  );
  if (totalStored + amount > storageCapacity) {
    return `📦 The village storage is full! Current capacity: ${storageCapacity}. Remove or use resources before donating more.`;
  }

  // Transfer donation
  player.inventory[resource] -= amount;
  data.village.resources[resource] =
    (data.village.resources[resource] || 0) + amount;

  if (!data.village.metrics) data.village.metrics = {};
  data.village.metrics.totalDonations =
    (data.village.metrics.totalDonations || 0) + amount;
  
  // 🌿 Recalculate village level
  const leveledUp = calculateVillageLevel(data);
  saveData(data);

  // 🌸 Refresh village embed
  if (client) refreshVillageEmbed(client);

  const levelMessage = leveledUp
    ? `\n${formatLevelUpSummary(data.village)}`
    : "";

  return `🤝 **${username}** donated ${amount} ${resource} to the village!${levelMessage}`;
}

module.exports = { inventory, donate };
