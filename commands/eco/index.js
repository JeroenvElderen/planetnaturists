// commands/eco/index.js
const ecoCommand = require("./ecoBase");
const { executeEco } = require("./ecoExecute");
const { ensureEcoChannel, sendSilentReply } = require("./ecoUtils");

module.exports = {
  data: ecoCommand,

  async execute(interaction) {
    if (!(await ensureEcoChannel(interaction))) return;

    // ⚡️ STEP 1: ACKNOWLEDGE IMMEDIATELY — never wait for anything before this
    let deferred = false;
    try {
      await interaction.deferReply({ flags: 64 }); // 64 = EPHEMERAL
      deferred = true;
    } catch (err) {
      console.warn("⚠️ Could not defer in time:", err.message);
      return; // stop, Discord already dropped it
    }

    try {
      // 🧠 STEP 2: Perform the eco logic
      const msg = await executeEco(interaction);

      // 🕊️ STEP 3: Safe reply (no pings)
      await sendSilentReply(interaction, msg);

      // ⏳ STEP 4: Optional cleanup
      setTimeout(async () => {
        try { await interaction.deleteReply(); } catch {}
      }, 15000);

    } catch (err) {
      console.error("❌ Eco command error:", err);
      if (!interaction.replied && deferred) {
        await interaction.editReply({
          content: "⚠️ Error in EcoVillage command.",
          allowedMentions: { parse: [] },
        }).catch(() => {});
      }
    }
  },
};
