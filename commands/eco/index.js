// commands/eco/index.js
const ecoCommand = require("./ecoBase");
const { executeEco } = require("./ecoExecute");
const { ensureEcoChannel, sendSilentReply } = require("./ecoUtils");

module.exports = {
  data: ecoCommand,
  async execute(interaction) {
    if (!(await ensureEcoChannel(interaction))) return;

    try {
      await interaction.deferReply({ ephemeral: true });
      const msg = await executeEco(interaction);
      await sendSilentReply(interaction, msg);
    } catch (err) {
      console.error("❌ Eco command error:", err);
      if (!interaction.replied) {
        await interaction.reply({
          content: "⚠️ Error in EcoVillage command.",
          ephemeral: true,
        });
      }
    }
  },
};
