// handlers/ecoHandler.js

// 🌾 Base actions
const { gather, relax, status, top } = require("./eco/actions");

// ⚒️ Crafting & buildings
const { combine, recipesList } = require("./eco/crafting");
const { buildList, buildSpecific } = require("./eco/buildings");

// 🎒 Inventory & donations
const { inventory, donate } = require("./eco/inventory");

// 🪪 Player extensions
const { statusCard } = require("./eco/statusCard");
const { progress } = require("./eco/progress");
const { trade } = require("./eco/trading");

// 🏡 Home & decoration
const { house, buyItem } = require("./eco/house");
const { showCatalog } = require("./eco/catalog"); // ✅ fixed import

// 💰 Economy system
const { earn, buy, sell } = require("./eco/economy");

module.exports = {
  // Basic actions
  gather,
  relax,
  status,
  top,

  // Crafting & building
  combine,
  recipesList,
  buildList,
  buildSpecific,

  // Inventory system
  inventory,
  donate,

  // Player extensions
  statusCard,
  progress,
  trade,

  // Home system
  house,
  buyItem,
  showCatalog, // ✅ now points to the correct file

  // Economy
  earn,
  buy,
  sell,
};
