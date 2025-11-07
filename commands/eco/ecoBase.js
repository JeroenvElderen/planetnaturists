// commands/eco/ecoBase.js
const { SlashCommandBuilder } = require("discord.js");
const { seedChoices } = require("../../handlers/eco/garden");

module.exports = new SlashCommandBuilder()
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
    sub.setName("inventory").setDescription("View your inventory")
  )
  .addSubcommand((sub) =>
    sub
      .setName("plant")
      .setDescription("Plant a seed in your garden")
      .addStringOption((o) =>
        o
          .setName("seed")
          .setDescription("Choose a seed to plant")
          .setRequired(true)
          .addChoices(...seedChoices)
      )
  )
  .addSubcommand((sub) =>
    sub.setName("harvest").setDescription("Harvest any fully grown crops")
  )
  .addSubcommand((sub) =>
    sub
      .setName("donate")
      .setDescription("Donate resources to help the EcoVillage grow")
      .addStringOption((o) =>
        o.setName("resource").setDescription("Resource name").setRequired(true)
      )
      .addIntegerOption((o) =>
        o.setName("amount").setDescription("Amount to donate").setRequired(true)
      )
  )

  // ⚒️ Crafting & Building
  .addSubcommand((sub) =>
    sub
      .setName("combine")
      .setDescription("Craft new materials")
      .addStringOption((o) =>
        o
          .setName("recipe")
          .setDescription("Recipe key to craft")
          .setRequired(true)
          .setAutocomplete(true)
      )
  )
  .addSubcommand((sub) =>
    sub.setName("recipes").setDescription("List crafting recipes")
  )
  .addSubcommand((sub) =>
    sub.setName("buildlist").setDescription("Show available buildings")
  )
  .addSubcommand((sub) =>
    sub
      .setName("build")
      .setDescription("Help construct a chosen building")
      .addStringOption((o) =>
        o.setName("name").setDescription("Building key").setRequired(true)
      )
  )

  // 🌿 Info & Progress
  .addSubcommand((sub) =>
    sub.setName("status").setDescription("Check village status")
  )
  .addSubcommand((sub) => sub.setName("top").setDescription("Show leaderboard"))
  .addSubcommand((sub) =>
    sub.setName("statuscard").setDescription("Show your status card")
  )
  .addSubcommand((sub) =>
    sub.setName("progress").setDescription("Show building progress")
  )

  // 🏡 Home
  .addSubcommand((sub) =>
    sub.setName("house").setDescription("View your house")
  )
  .addSubcommand((sub) =>
    sub.setName("catalog").setDescription("Browse catalog")
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
        o.setName("name").setDescription("Item key").setRequired(true)
      )
  )

  // 💰 Economy
  .addSubcommand((sub) => sub.setName("earn").setDescription("Earn coins"))
  .addSubcommand((sub) =>
    sub
      .setName("buy")
      .setDescription("Buy resources")
      .addStringOption((o) =>
        o.setName("resource").setDescription("Resource").setRequired(true)
      )
      .addIntegerOption((o) =>
        o.setName("amount").setDescription("Amount").setRequired(true)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName("sell")
      .setDescription("Sell resources")
      .addStringOption((o) =>
        o.setName("resource").setDescription("Resource").setRequired(true)
      )
      .addIntegerOption((o) =>
        o.setName("amount").setDescription("Amount").setRequired(true)
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName("reset")
      .setDescription("⚠️ Reset all EcoVillage data (owner only!)")
  );
