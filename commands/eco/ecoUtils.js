const ECO_CHANNEL_ID = "1435568091290402836";

/**
 * Ensure the user is in the designated EcoVillage channel.
 * Replies privately and blocks further command execution otherwise.
 */
async function ensureEcoChannel(interaction) {
  if (interaction.channelId !== ECO_CHANNEL_ID) {
    await interaction
      .reply({
        content: `🌻 Please use EcoVillage commands only in <#${ECO_CHANNEL_ID}>.`,
        flags: 64, // 64 = EPHEMERAL
      })
      .catch(() => {});
    return false;
  }
  return true;
}

/**
 * Sends a silent private reply that self-deletes after a delay.
 * Works with both string and object (embed) responses.
 */
async function sendSilentReply(interaction, msg, delay = 15000) {
  try {
    if (!msg) return;

    // 🔍 Determine message type (string or object)
    const isString = typeof msg === "string";
    const payload = isString
      ? { content: msg, allowedMentions: { parse: [] } }
      : msg; // directly use embed or other structured message objects

    if (interaction.deferred || interaction.replied) {
      // ✅ Safe path if already acknowledged
      await interaction.editReply(payload);
    } else {
      // ✅ Fallback if deferReply() failed or timed out
      await interaction.reply({
        ...payload,
        flags: 64, // Ephemeral (private)
      });
    }

    // 🕒 Auto-delete after delay
    setTimeout(async () => {
      try {
        await interaction.deleteReply();
      } catch {
        // ignore missing message / permissions
      }
    }, delay);
  } catch (err) {
    console.warn("⚠️ sendSilentReply failed:", err.message);
  }
}

module.exports = { ensureEcoChannel, sendSilentReply };
