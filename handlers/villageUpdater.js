// handlers/villageUpdater.js
const { generateVillageEmbed } = require("./eco/villageStatus");

const ECO_CHANNEL_ID = "1435568091290402836"; // 🌿 EcoVillage channel ID
const UPDATE_INTERVAL = 5 * 60 * 1000; // 5 min scheduled refresh
const THROTTLE_MS = 5000; // 5s cooldown between live updates

let lastUpdate = 0;
let pendingUpdate = null;

/**
 * Create or update the pinned EcoVillage status embed.
 */
async function updateVillageStatusEmbed(client) {
  try {
    const channel = await client.channels.fetch(ECO_CHANNEL_ID);
    if (!channel) {
      console.error("❌ EcoVillage channel not found.");
      return;
    }

    const embed = generateVillageEmbed();
    const pins = await channel.messages.fetchPinned();
    let pinned = pins.find(
      msg => msg.embeds.length && msg.embeds[0].title?.includes("EcoVillage")
    );

    if (pinned) {
      await pinned.edit({
        embeds: [embed],
        allowedMentions: { parse: [] }, // 🚫 No pings
      });
      console.log("♻️ Updated pinned EcoVillage embed.");
    } else {
      const msg = await channel.send({
        embeds: [embed],
        allowedMentions: { parse: [] },
      });
      await msg.pin();
      console.log("📌 Created and pinned EcoVillage status embed.");
    }
  } catch (err) {
    console.error("❌ Failed to update village status embed:", err);
  }
}

/**
 * Silently refresh the embed when data changes,
 * throttled to max once every THROTTLE_MS.
 */
async function refreshVillageEmbed(client) {
  if (!client) return;
  const now = Date.now();

  // Too soon? queue one combined update
  if (now - lastUpdate < THROTTLE_MS) {
    if (!pendingUpdate) {
      pendingUpdate = setTimeout(() => {
        pendingUpdate = null;
        refreshVillageEmbed(client);
      }, THROTTLE_MS);
    }
    return;
  }

  lastUpdate = now;
  try {
    await updateVillageStatusEmbed(client);
  } catch (err) {
    console.error("⚠️ Could not refresh EcoVillage embed:", err);
  }
}

/**
 * Periodically update the embed as backup (every 5 minutes)
 */
function scheduleVillageUpdates(client) {
  updateVillageStatusEmbed(client);
  setInterval(() => updateVillageStatusEmbed(client), UPDATE_INTERVAL);
}

module.exports = { scheduleVillageUpdates, refreshVillageEmbed };
