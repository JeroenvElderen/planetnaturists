// commands/eco/ecoUtils.js
const ECO_CHANNEL_ID = "1435568091290402836";

/**
 * Ensure the user is in the designated EcoVillage channel.
 * Replies privately and blocks further command execution otherwise.
 */
async function ensureEcoChannel(interaction) {
  if (interaction.channelId !== ECO_CHANNEL_ID) {
    await interaction.reply({
      content: `🌻 Please use EcoVillage commands only in <#${ECO_CHANNEL_ID}>.`,
      flags: 64, // 64 = EPHEMERAL
    }).catch(() => {});
    return false;
  }
  return true;
}

/**
 * Sends a silent private reply that self-deletes after a delay.
 * Works whether the interaction was deferred or not.
 */
async function sendSilentReply(interaction, msg, delay = 15000) {
  try {
    if (interaction.deferred || interaction.replied) {
      // ✅ Safe path if already acknowledged
      await interaction.editReply({
        content: msg,
        allowedMentions: { parse: [] },
      });
    } else {
      // ✅ Fallback path if deferReply() failed or timed out
      await interaction.reply({
        content: msg,
        flags: 64,
        allowedMentions: { parse: [] },
      });
    }

    // 🕒 Auto-delete after delay
    setTimeout(async () => {
      try {
        await interaction.deleteReply();
      } catch {
        // ignore missing message / perms
      }
    }, delay);
  } catch (err) {
    console.error("⚠️ sendSilentReply failed:", err.message);
  }
}

module.exports = { ensureEcoChannel, sendSilentReply };
