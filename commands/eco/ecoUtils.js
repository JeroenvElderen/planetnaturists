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
function chunkMessage(message, maxLength = 1900) {
  if (typeof message !== "string") return [message];

  const lines = message.split("\n");
  const chunks = [];
  let current = "";

  for (const line of lines) {
    const pending = current ? `${current}\n${line}` : line;

    if (pending.length > maxLength) {
      if (current) chunks.push(current);
      if (line.length > maxLength) {
        for (let i = 0; i < line.length; i += maxLength) {
          chunks.push(line.slice(i, i + maxLength));
        }
        current = "";
      } else {
        current = line;
      }
    } else {
      current = pending;
    }
  }

  if (current) chunks.push(current);

  if (!chunks.length) return [];

  if (chunks.length === 1) return chunks;

  return chunks.map((chunk, idx) => {
    const suffix = `\n(Page ${idx + 1}/${chunks.length})`;
    return chunk.length + suffix.length > 2000 ? chunk : `${chunk}${suffix}`;
  });
}

function normalizePayload(payload) {
  if (!payload) return null;
  if (typeof payload === "string") {
    return { content: payload, allowedMentions: { parse: [] } };
  }
  if (typeof payload === "object") return payload;
  return null;
}

async function sendSilentReply(interaction, msg, delay = 15000) {
  try {
    if (!msg) return;

    // 🔍 Determine message type (string or object)
    const rawPayloads = Array.isArray(msg) ? msg : chunkMessage(msg);
    const payloads = rawPayloads
      .map(normalizePayload)
      .filter((payload) => Boolean(payload));

    if (!payloads.length) return;

    const followUps = [];

    if (interaction.deferred || interaction.replied) {
      // ✅ Safe path if already acknowledged
      await interaction.editReply(payloads[0]);
    } else {
      await interaction.reply({ ...payloads[0], flags: 64 });
    }

    for (let i = 1; i < payloads.length; i += 1) {
      try {
        const message = await interaction.followUp({
          ...payloads[i],
          flags: 64,
        });
        followUps.push(message);
      } catch (err) {
        console.warn("⚠️ sendSilentReply follow-up failed:", err.message);
      }
    }

    // 🕒 Auto-delete after delay
    setTimeout(async () => {
      try {
        await interaction.deleteReply();
      } catch {}

      await Promise.all(
        followUps.map(async (message) => {
          try {
            await message.delete();
          } catch {}
        })
      );
    }, delay);
  } catch (err) {
    console.warn("⚠️ sendSilentReply failed:", err.message);
  }
}

module.exports = { ensureEcoChannel, sendSilentReply, ECO_CHANNEL_ID };
