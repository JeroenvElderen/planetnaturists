// commands/eco/ecoExecute.js
const eco = require("../../handlers/ecoHandler");
const fs = require("fs");
const path = require("path");
const { refreshVillageEmbed } = require("../../handlers/villageUpdater");

const DATA_PATH = path.join(__dirname, "../../handlers/eco/data.json");
const OWNER_IDS = ["946346329783803945"]; // 👈 replace with your ID (or multiple IDs)

async function executeEco(interaction) {
  const sub = interaction.options.getSubcommand();
  const user = interaction.user;
  const client = interaction.client;
  let msg;

  switch (sub) {
    case "gather":
      msg = eco.gather(user.id, user.username, client);
      break;
    case "relax":
      msg = eco.relax(user.id, user.username);
      break;
    case "inventory":
      msg = eco.inventory(user.id);
      break;
    case "donate":
      msg = eco.donate(
        user.id,
        user.username,
        interaction.options.getString("resource").toLowerCase(),
        interaction.options.getInteger("amount"),
        client
      );
      break;
    case "combine":
      msg = eco.combine(
        user.id,
        user.username,
        interaction.options.getString("recipe").toLowerCase()
      );
      break;
    case "recipes":
      msg = eco.recipesList();
      break;
    case "buildlist":
      msg = eco.buildList();
      break;
    case "build":
      msg = eco.buildSpecific(
        user.id,
        user.username,
        interaction.options.getString("name").toLowerCase(),
        client
      );
      break;
    case "status":
      msg = eco.status();
      break;
    case "top":
      msg = eco.top();
      break;
    case "statuscard":
      msg = eco.statusCard(user.id, user.username);
      break;
    case "progress":
      msg = eco.progress();
      break;
    case "trade":
      msg = eco.trade(
        user.id,
        interaction.options.getUser("target").id,
        interaction.options.getString("resource").toLowerCase(),
        interaction.options.getInteger("amount")
      );
      break;
    case "house":
      msg = eco.house(user.id, user.username);
      break;
    case "catalog":
      msg = eco.showCatalog();
      break;
    case "buyitem":
      msg = eco.buyItem(
        user.id,
        user.username,
        interaction.options.getString("type").toLowerCase(),
        interaction.options.getString("name").toLowerCase()
      );
      break;
    case "earn":
      msg = eco.earn(user.id, 10, "helping the village");
      break;
    case "buy":
      msg = eco.buy(
        user.id,
        interaction.options.getString("resource").toLowerCase(),
        interaction.options.getInteger("amount")
      );
      break;
    case "sell":
      msg = eco.sell(
        user.id,
        interaction.options.getString("resource").toLowerCase(),
        interaction.options.getInteger("amount")
      );
      break;

    // 🧹 RESET — OWNER ONLY
    case "reset":
      msg = await handleReset(interaction, client);
      break;

    default:
      msg = "❓ Unknown command.";
  }

  return msg;
}

// 🔒 Reset Handler
async function handleReset(interaction, client) {
  const userId = interaction.user.id;

  if (!OWNER_IDS.includes(userId)) {
    return "🚫 You don’t have permission to reset the EcoVillage.";
  }

  const defaultData = {
    village: {
      resources: {},
      structures: {},
      calmness: 100,
      progress: {},
    },
    players: {},
  };

  try {
    fs.writeFileSync(DATA_PATH, JSON.stringify(defaultData, null, 2));
    await refreshVillageEmbed(client);
    return "🌿 The **EcoVillage** has been completely reset. A new era begins 🌞";
  } catch (err) {
    console.error("❌ Error resetting data:", err);
    return "⚠️ Failed to reset data.";
  }
}

module.exports = { executeEco };
