// handlers/ecoHandler.js
const { gather, relax, status, top } = require("./eco/actions");
const { combine, recipesList } = require("./eco/crafting");
const { buildList, buildSpecific } = require("./eco/buildings");
const { inventory, donate } = require("./eco/inventory");
const { statusCard } = require("./eco/statusCard");
const { progress } = require("./eco/progress");
const { trade } = require("./eco/trading");
const { house } = require("./eco/house");
const { earn, buy, sell } = require("./eco/economy");

module.exports = {
  gather,
  relax,
  status,
  top,
  combine,
  recipesList,
  buildList,
  buildSpecific,
  inventory,
  donate,
  statusCard,
  progress,
  trade,
  house,
  earn,
  buy,
  sell
};
