// handlers/eco/catalog.js
const catalog = require("../../config/catalog");

function showCatalog() {
  let msg = "🛒 **EcoVillage Home Catalog**\n\n";
  for (const [type, items] of Object.entries(catalog)) {
    msg += `**${type.toUpperCase()}**\n`;
    for (const [key, item] of Object.entries(items)) {
      msg += `${item.emoji} ${item.name} — 💰 ${item.price} coins (key: \`${key}\`)\n`;
    }
    msg += "\n";
  }
  msg += "Use `/eco buyitem` to purchase items for your house!";
  return msg;
}

module.exports = { showCatalog };
