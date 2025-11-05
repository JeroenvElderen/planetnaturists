// commands/eco.js
const { SlashCommandBuilder } = require("discord.js");
const eco = require("../handlers/ecoHandler");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("eco")
    .setDescription("Play the EcoVillage cooperative roleplay game")

    // 🌾 Basic Actions
    .addSubcommand((sub) =>
      sub.setName("gather").setDescription("Gather natural resources")
    )
    .addSubcommand((sub) =>
      sub.setName("relax").setDescription("Relax and restore calmness")
    )

    // 🎒 Inventory & Donations
    .addSubcommand((sub) =>
      sub.setName("inventory").setDescription("View your personal inventory")
    )
    .addSubcommand((sub) =>
      sub
        .setName("donate")
        .setDescription("Donate resources to help the EcoVillage grow")
        .addStringOption((o) =>
          o
            .setName("resource")
            .setDescription("Resource name")
            .setRequired(true)
        )
        .addIntegerOption((o) =>
          o
            .setName("amount")
            .setDescription("Amount to donate")
            .setRequired(true)
        )
    )

    // ⚒️ Crafting
    .addSubcommand((sub) =>
      sub
        .setName("combine")
        .setDescription("Craft new materials from existing resources")
        .addStringOption((o) =>
          o.setName("recipe").setDescription("Recipe name").setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub.setName("recipes").setDescription("List available crafting recipes")
    )

    // 🏗️ Building
    .addSubcommand((sub) =>
      sub.setName("buildlist").setDescription("Show available buildings")
    )
    .addSubcommand((sub) =>
      sub
        .setName("build")
        .setDescription("Help construct a chosen building")
        .addStringOption((o) =>
          o
            .setName("name")
            .setDescription("Building name or key")
            .setRequired(true)
        )
    )

    // 🌿 Village Overview
    .addSubcommand((sub) =>
      sub
        .setName("status")
        .setDescription("Check village resources and calmness")
    )
    .addSubcommand((sub) =>
      sub.setName("top").setDescription("Show helper leaderboard")
    )

    // 🪪 Player Extensions
    .addSubcommand((sub) =>
      sub.setName("statuscard").setDescription("Show your player status card")
    )
    .addSubcommand((sub) =>
      sub.setName("progress").setDescription("Show global building progress")
    )
    .addSubcommand((sub) =>
      sub
        .setName("trade")
        .setDescription("Trade resources with another player")
        .addUserOption((o) =>
          o
            .setName("target")
            .setDescription("Player to trade with")
            .setRequired(true)
        )
        .addStringOption((o) =>
          o
            .setName("resource")
            .setDescription("Resource name")
            .setRequired(true)
        )
        .addIntegerOption((o) =>
          o
            .setName("amount")
            .setDescription("Amount to trade")
            .setRequired(true)
        )
    )

    // 🏡 Home System
    .addSubcommand((sub) =>
      sub.setName("house").setDescription("View your cozy house")
    )
    .addSubcommand((sub) =>
      sub
        .setName("catalog")
        .setDescription("Browse furniture, decor, and plants")
    )
    .addSubcommand((sub) =>
      sub
        .setName("buyitem")
        .setDescription("Buy an item for your house")
        .addStringOption((o) =>
          o
            .setName("type")
            .setDescription("furniture/decor/plant")
            .setRequired(true)
        )
        .addStringOption((o) =>
          o
            .setName("name")
            .setDescription("Item key from catalog")
            .setRequired(true)
        )
    )

    // 💰 Economy
    .addSubcommand((sub) =>
      sub.setName("earn").setDescription("Earn coins by helping the village")
    )
    .addSubcommand((sub) =>
      sub
        .setName("buy")
        .setDescription("Buy resources from the store")
        .addStringOption((o) =>
          o
            .setName("resource")
            .setDescription("Resource to buy")
            .setRequired(true)
        )
        .addIntegerOption((o) =>
          o.setName("amount").setDescription("Amount to buy").setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("sell")
        .setDescription("Sell your resources to the store")
        .addStringOption((o) =>
          o
            .setName("resource")
            .setDescription("Resource to sell")
            .setRequired(true)
        )
        .addIntegerOption((o) =>
          o.setName("amount").setDescription("Amount to sell").setRequired(true)
        )
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const user = interaction.user;

    // Restrict all EcoVillage commands to one channel
    const allowedChannelId = "1435568091290402836";
    if (interaction.channelId !== allowedChannelId) {
      return interaction.reply({
        content: `🌻 Please use EcoVillage commands only in <#${allowedChannelId}>.`,
        ephemeral: true,
      });
    }

    try {
      // 🌿 All commands private
      await interaction.deferReply({ ephemeral: true });

      let msg;
      switch (sub) {
        case "gather":
          msg = eco.gather(user.id, user.username, interaction.client);
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
            interaction.client
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
            interaction.client
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
        default:
          msg = "❓ Unknown command.";
      }

      // ✅ Send private reply silently
      await interaction.editReply({
        content: msg,
        allowedMentions: { parse: [] }, // 🚫 No pings, ever
      });

      // 🕒 Auto delete after 15s
      setTimeout(async () => {
        try {
          await interaction.deleteReply();
        } catch {}
      }, 15000);
    } catch (err) {
      console.error(err);
      if (!interaction.replied) {
        await interaction.reply({
          content: "⚠️ Error in EcoVillage command.",
          ephemeral: true,
        });
      }
    }
  },
};
