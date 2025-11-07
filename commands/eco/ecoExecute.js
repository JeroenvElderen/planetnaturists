const eco = require("../../handlers/ecoHandler");
const { refreshVillageEmbed } = require("../../handlers/villageUpdater");
const { resetEcoData } = require("../../handlers/eco/data");
const OWNER_IDS = ["946346329783803945"]; // 👈 your ID

async function executeEco(interaction) {
  const sub = interaction.options.getSubcommand();
  const user = interaction.user;
  const client = interaction.client;
  let msg;

  try {
    switch (sub) {
      // 🌾 Base actions
      case "gather":
        msg = eco.gather(user.id, user.username, client);
        break;
      case "relax":
        msg = eco.relax(user.id, user.username, client);
        break;

      // 🎒 Inventory & Donations
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

      // ⚒️ Crafting
      case "combine": {
        const recipeOption = interaction.options.getString("recipe");
        if (!recipeOption) {
          msg = "❌ Please specify a recipe to craft. Try `/eco recipes` for options.";
          break;
        }
        msg = eco.combine(user.id, user.username, recipeOption);
        break;
      }
      case "recipes":
        msg = eco.recipesList();
        break;

      // 🏗️ Building
      case "buildlist":
        msg = eco.buildList();
        break;
      case "build":
        msg = eco.buildSpecific(
          user.id,
          user.username,
          interaction.options.getString("name"),
          client
        );
        break;

      // 🌿 Status
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

      // 💬 Player Trades
      case "trade":
        msg = eco.trade(
          user.id,
          interaction.options.getUser("target").id,
          interaction.options.getString("resource").toLowerCase(),
          interaction.options.getInteger("amount")
        );
        break;

      // 🏡 Housing System
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

      // 🌱 Planting System
      case "plant":
        msg = await eco.plantSeed(
          user.id,
          user.username,
          interaction.options.getString("seed").toLowerCase()
        );
        break;
      case "harvest":
        msg = await eco.harvest(user.id, user.username);
        break;

      // 💰 Economy
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
  } catch (err) {
    console.error(`❌ Error executing /eco ${sub}:`, err);
    return "⚠️ Something went wrong while executing your command.";
  }
}

/**
 * 🔒 Reset Handler — resets all village and player data (Owner only)
 */
async function handleReset(interaction, client) {
  const userId = interaction.user.id;

  if (!OWNER_IDS.includes(userId)) {
    return "🚫 You don’t have permission to reset the EcoVillage.";
  }

  try {
    await resetEcoData();
    await refreshVillageEmbed(client);
    return "🌿 The **EcoVillage** has been completely reset. A new era begins 🌞";
  } catch (err) {
    console.error("❌ Error resetting data:", err);
    return "⚠️ Failed to reset data.";
  }
}

module.exports = { executeEco };
