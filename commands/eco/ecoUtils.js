// commands/eco/ecoUtils.js
const ECO_CHANNEL_ID = "1435568091290402836";

async function ensureEcoChannel(interaction) {
  if (interaction.channelId !== ECO_CHANNEL_ID) {
    await interaction.reply({
      content: `🌻 Please use EcoVillage commands only in <#${ECO_CHANNEL_ID}>.`,
      ephemeral: true,
    });
    return false;
  }
  return true;
}

async function sendSilentReply(interaction, msg, delay = 15000) {
  await interaction.editReply({ content: msg, allowedMentions: { parse: [] } });
  setTimeout(async () => {
    try { await interaction.deleteReply(); } catch {}
  }, delay);
}

module.exports = { ensureEcoChannel, sendSilentReply };
