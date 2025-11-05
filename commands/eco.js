// commands/eco.js
const { SlashCommandBuilder } = require("discord.js");
const {
  gather,
  relax,
  status,
  top,
  combine,
  recipesList,
  help,
  buildList,
  buildSpecific
} = require("../handlers/ecoHandler");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("eco")
    .setDescription("Play the EcoVillage cooperative game")
    .addSubcommand(sub =>
      sub.setName("gather").setDescription("Gather resources"))
    .addSubcommand(sub =>
      sub.setName("combine")
        .setDescription("Craft new materials")
        .addStringOption(o =>
          o.setName("recipe")
            .setDescription("Recipe name")
            .setRequired(true)
        ))
    .addSubcommand(sub =>
      sub.setName("recipes").setDescription("List available crafting recipes"))
    .addSubcommand(sub =>
      sub.setName("buildlist").setDescription("Show available buildings to construct"))
    .addSubcommand(sub =>
      sub.setName("build")
        .setDescription("Help construct a chosen building")
        .addStringOption(o =>
          o.setName("name")
            .setDescription("Building key name")
            .setRequired(true)
        ))
    .addSubcommand(sub =>
      sub.setName("relax").setDescription("Relax and raise calmness"))
    .addSubcommand(sub =>
      sub.setName("status").setDescription("Check EcoVillage status"))
    .addSubcommand(sub =>
      sub.setName("top").setDescription("Show leaderboard"))
    .addSubcommand(sub =>
      sub.setName("help").setDescription("Show help")),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const user = interaction.user;

    // 🌿 Restrict to your EcoVillage channel
    const allowedChannelId = "1435568091290402836";
    if (interaction.channelId !== allowedChannelId) {
      return interaction.reply({
        content: `🌻 Please use EcoVillage commands only in <#${allowedChannelId}>.`,
        ephemeral: true,
      });
    }

    try {
      await interaction.deferReply();
      let msg;

      if (sub === "gather") msg = gather(user.id, user.username);
      else if (sub === "combine") msg = combine(user.id, user.username, interaction.options.getString("recipe").toLowerCase());
      else if (sub === "recipes") msg = recipesList();
      else if (sub === "buildlist") msg = buildList();
      else if (sub === "build") msg = buildSpecific(user.id, user.username, interaction.options.getString("name").toLowerCase());
      else if (sub === "relax") msg = relax(user.id, user.username);
      else if (sub === "status") msg = status();
      else if (sub === "top") msg = top();
      else msg = help();

      await interaction.editReply(msg);
    } catch (err) {
      console.error(err);
      if (!interaction.replied) {
        await interaction.reply({ content: "⚠️ Error in EcoVillage command.", ephemeral: true });
      }
    }
  }
};
