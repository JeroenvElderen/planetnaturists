// commands/eco/index.js
const ecoCommand = require("./ecoBase");
const { executeEco } = require("./ecoExecute");
const { ensureEcoChannel, sendSilentReply } = require("./ecoUtils");

module.exports = {
  data: ecoCommand,

  async execute(interaction) {
    // ✅ Check channel restriction first
    if (!(await ensureEcoChannel(interaction))) return;

    try {
      // ✅ Use modern Discord API: flags instead of deprecated "ephemeral"
      await interaction.deferReply({ flags: 64 }); // 64 = EPHEMERAL

      // ✅ Safely execute the main logic
      const msg = await executeEco(interaction);

      // ✅ Use helper to send reply (no pings, safe)
      await sendSilentReply(interaction, msg);

      // 🕒 Auto-delete after 15 seconds to reduce clutter
      setTimeout(async () => {
        try {
          await interaction.deleteReply();
        } catch {
          /* ignore deletion errors */
        }
      }, 15000);

    } catch (err) {
      console.error("❌ Eco command error:", err);

      // ✅ Avoid double replies and use modern flags
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: "⚠️ Error in EcoVillage command.",
          flags: 64, // private
        }).catch(() => {});
      }
    }
  },
};
