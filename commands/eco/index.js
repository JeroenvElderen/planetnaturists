// commands/eco/index.js
const ecoCommand = require("./ecoBase");
const { executeEco } = require("./ecoExecute");
const ecoUtils = require("./ecoUtils");
const { recipeAutocompleteChoices } = require("../../handlers/eco/crafting");

const { ensureEcoChannel, sendSilentReply } = ecoUtils;

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
    } catch (err) {
      console.error("❌ Eco command error:", err);
      if (!interaction.replied && deferred) {
        await interaction
          .editReply({
            content: "⚠️ Error in EcoVillage command.",
            allowedMentions: { parse: [] },
          })
          .catch(() => {});
      }
    }
  },

  async autocomplete(interaction) {
    try {
      if (
        interaction.channelId &&
        interaction.channelId !== ecoUtils.ECO_CHANNEL_ID
      ) {
        await interaction.respond([]);
        return;
      }

      let subcommand;
      try {
        subcommand = interaction.options.getSubcommand();
      } catch (_) {
        subcommand = null;
      }

      if (subcommand && subcommand !== "combine") {
        await interaction.respond([]);
        return;
      }

      const focused = interaction.options.getFocused(true);
      if (!focused || focused.name !== "recipe") {
        await interaction.respond([]);
        return;g
      }

      const choices = recipeAutocompleteChoices(focused.value);
      return interaction.respond(choices);
    } catch (err) {
      console.warn("⚠️ Autocomplete for /eco failed:", err.message);
      if (!interaction.responded) {
        try {
          await interaction.respond([]);
        } catch (_) {}
      }
      return undefined;
    }
  },
};
