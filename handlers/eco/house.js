// handlers/eco/house.js
const { loadData, saveData } = require("./data");
const { getPlayer } = require("./utils");
const catalog = require("../../config/catalog");

function house(uid, username) {
  const data = loadData();
  const player = getPlayer(data, uid);

  // ✅ Always ensure structure exists — safe for old saves too
  if (!player.house) player.house = {};
  if (!Array.isArray(player.house.furniture)) player.house.furniture = [];
  if (!Array.isArray(player.house.decor)) player.house.decor = [];
  if (!Array.isArray(player.house.plants)) player.house.plants = [];

  const home = player.house;

  // 🪑 Format item lists safely
  const furnitureList =
    home.furniture.length > 0
      ? home.furniture.map(i => `${catalog.furniture[i]?.emoji || "❓"} ${catalog.furniture[i]?.name || i}`).join(", ")
      : "none";

  const decorList =
    home.decor.length > 0
      ? home.decor.map(i => `${catalog.decor[i]?.emoji || "❓"} ${catalog.decor[i]?.name || i}`).join(", ")
      : "none";

  const plantsList =
    home.plants.length > 0
      ? home.plants.map(i => `${catalog.plants[i]?.emoji || "❓"} ${catalog.plants[i]?.name || i}`).join(", ")
      : "none";

  return (
    `🏡 **${username}’s Home**\n` +
    `🪑 **Furniture:** ${furnitureList}\n` +
    `🕯️ **Decor:** ${decorList}\n` +
    `🌿 **Plants:** ${plantsList}\n` +
    `💰 **Balance:** ${player.money || 0} coins`
  );
}

function buyItem(uid, username, type, itemKey) {
  const data = loadData();
  const player = getPlayer(data, uid);

  // ✅ Validate category
  if (!["furniture", "decor", "plants"].includes(type))
    return `❌ Invalid category **${type}**. Valid options: furniture, decor, plants.`;

  const shop = catalog[type];
  if (!shop || !shop[itemKey])
    return `❌ Item **${itemKey}** not found in category **${type}**.`;

  const item = shop[itemKey];

  // 💰 Check funds
  if ((player.money || 0) < item.price)
    return `💸 You need **${item.price} coins** to buy **${item.name}**, but you only have ${player.money || 0}.`;

  // ✅ Ensure nested arrays exist before pushing
  if (!player.house) player.house = {};
  if (!Array.isArray(player.house[type])) player.house[type] = [];

  // 💵 Deduct and add item
  player.money -= item.price;
  player.house[type].push(itemKey);

  saveData(data);

  return `🛋️ **${username}** bought ${item.emoji} **${item.name}** for **${item.price} coins!**  
💰 New balance: ${player.money} coins.`;
}

module.exports = { house, buyItem };
