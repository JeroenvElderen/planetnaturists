// handlers/eco/villageStatus.js
const { EmbedBuilder } = require("discord.js");
const { loadData } = require("./data");
const config = require("../../config/ecoConfig");
const { getEnvironmentSnapshot } = require("./environment");

function formatDuration(ms) {
  if (typeof ms !== "number") return "—";
  if (ms <= 0) return "changing soon";
  const totalMinutes = Math.round(ms / (60 * 1000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours && minutes) return `${hours}h ${minutes}m remaining`;
  if (hours) return `${hours}h remaining`;
  return `${Math.max(1, minutes)}m remaining`;
}

// Progress bar
function progressBar(pct) {
  const filled = Math.round(pct / 10);
  return "▓".repeat(filled) + "░".repeat(10 - filled) + ` ${pct}%`;
}

// Level label helper
function getLevelName(level) {
  if (level >= 10) return "Legendary Sanctuary";
  if (level >= 6) return "Thriving Community";
  if (level >= 3) return "Flourishing Settlement";
  return "Peaceful Haven";
}

function generateVillageEmbed() {
  const data = loadData();
  const now = Date.now();
  const calmness = data.village.calmness ?? 50;
  const level = data.village.level ?? 1;
  const structuresBuilt = Object.keys(data.village.structures || {}).length;
  const totalDonations = data.village.metrics?.totalDonations || 0;
  const growthScore = calmness + structuresBuilt + totalDonations;
  const xpRequirement =
    typeof data.village.nextLevelRequirement === "number" &&
    data.village.nextLevelRequirement > 0
      ? data.village.nextLevelRequirement
      : level * 100;
  const currentXp = data.village.xp ?? 0;
  const progressPct = Math.min(
    100,
    xpRequirement === 0 ? 100 : Math.round((currentXp / xpRequirement) * 100)
  );
  const xpRemaining =
    level >= 1000 ? 0 : Math.max(0, xpRequirement - currentXp);

  const builtList = Object.values(data.village.structures || {}).map(
    (s) => s.name
  );
  const resources = Object.entries(data.village.resources || {});
  const progress = data.village.progress || {};
  const storage = data.village.storage || { level: level, capacity: 100 };
  const unlockedBuildings =
    data.village.metrics?.unlockedBuildings || level * 5;
  const rareEvents = data.village.metrics?.rareEvents ?? Math.max(0, level - 1);

  const underConstruction = [];
  for (const [key, b] of Object.entries(config.buildings || {})) {
    if (data.village.structures[key]) continue;
    const prog = progress[key];
    if (prog) {
      const total = Object.values(b.cost).reduce((a, v) => a + v, 0);
      const done = Object.values(prog).reduce((a, v) => a + v, 0);
      const pct = Math.min(100, Math.round((done / total) * 100));
      underConstruction.push(
        `${b.emoji} **${b.name}**\n${progressBar(pct)} 🪵`
      );
    }
  }

  const nonEmptyResources = resources.filter(([_, qty]) => qty > 0);

  const environment = getEnvironmentSnapshot(data.village, now);
  const { season: seasonInfo, weather: weatherInfo, time: timeInfo, timers } =
    environment;

  const weatherRemaining = formatDuration(timers.weather);
  const seasonRemaining = formatDuration(timers.season);
  const timeRemaining = formatDuration(timers.time);

  const climateSummary = [
    `${seasonInfo.emoji} **Season:** ${seasonInfo.name} — ${seasonInfo.effect} (${seasonRemaining})`,
    `${weatherInfo.emoji} **Weather:** ${weatherInfo.type} — ${weatherInfo.effect} (${weatherRemaining})`,
    `${timeInfo.emoji} **Time:** ${timeInfo.name} — ${timeInfo.effect} (${timeRemaining})`,
  ].join("\n");

  const embed = new EmbedBuilder()
    .setColor(timeInfo.color || seasonInfo.color || "#7BC47F")
    .setTitle(
      `${seasonInfo.emoji} EcoVillage — Level ${level} (${getLevelName(level)})`
    )
    .addFields(
      {
        name: "🌦️ Village Climate",
        value: `${climateSummary}\n\u200B`,
        inline: false,
      },
      {
        name: "💚 Serenity Level",
        value: `**${calmness}% Calmness** — ${
          calmness < 40
            ? "The air feels restless. 🍃"
            : calmness < 80
            ? "Peace drifts through the trees. 🌿"
            : "Perfect harmony — a tranquil paradise. 🌸"
        }\n${progressBar(calmness)}\n\u200B`,
        inline: false,
      },
      {
        name: "📈 Village Growth",
        value:
          level >= 1000
            ? "The EcoVillage has reached its legendary pinnacle."
            : `Growth score (calmness + structures + donations): **${growthScore} XP**.\n` +
              `Progress toward Level ${Math.min(1000, level + 1)}:\n` +
              `${progressBar(progressPct)}\n` +
              `${xpRemaining} XP remaining (next level needs ${xpRequirement} XP).\n\u200B`,
        inline: false,
      },
      {
        name: "🏗️ Village Projects",
        value:
          builtList.length || underConstruction.length
            ? [
                builtList.length
                  ? "__Completed Buildings__\n" +
                    builtList.map((b) => `✅ ${b}`).join("\n")
                  : null,
                underConstruction.length
                  ? "__In Progress__\n" + underConstruction.join("\n\n")
                  : null,
              ]
                .filter(Boolean)
                .join("\n\n") + "\n\u200B"
            : "_No projects yet — the land awaits your creativity._\n\u200B",
        inline: false,
      },
      {
        name: "🌾 Shared Resources",
        value: nonEmptyResources.length
          ? nonEmptyResources
              .map(([res, qty]) => `• ${res} — **${qty}**`)
              .join("\n")
          : "_The storeroom is empty. Time to gather under the sun!_",
        inline: false,
      },
      {
        name: "🧺 Storage",
        value: `Level ${storage.level} storage holds **${storage.capacity}** resources.`,
        inline: true,
      },
      {
        name: "🏘️ Unlocks",
        value: `Blueprint slots: **${unlockedBuildings}**\nRare events discovered: **${rareEvents}**`,
        inline: true,
      }
    )
    .setFooter({ text: "EcoVillage 🌻 — calm minds, growing hearts" })
    .setTimestamp();

  return embed;
}

module.exports = { generateVillageEmbed };
