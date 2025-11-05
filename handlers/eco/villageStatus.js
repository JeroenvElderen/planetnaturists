// handlers/eco/villageStatus.js
const { EmbedBuilder } = require("discord.js");
const { loadData } = require("./data");
const config = require("../../config/ecoConfig");

// Progress bar
function progressBar(pct) {
  const filled = Math.round(pct / 10);
  return "▓".repeat(filled) + "░".repeat(10 - filled) + ` ${pct}%`;
}

// Level label helper
function getLevelName(level) {
  if (level >= 10) return "🌺 Legendary Sanctuary";
  if (level >= 6) return "🌻 Thriving Community";
  if (level >= 3) return "🌿 Flourishing Settlement";
  return "🌱 Peaceful Haven";
}

function generateVillageEmbed() {
  const data = loadData();
  const calmness = data.village.calmness ?? 50;
  const level = data.village.level ?? 1;

  const builtList = Object.values(data.village.structures || {}).map((s) => s.name);
  const resources = Object.entries(data.village.resources || {});
  const progress = data.village.progress || {};

  const underConstruction = [];
  for (const [key, b] of Object.entries(config.buildings || {})) {
    if (data.village.structures[key]) continue;
    const prog = progress[key];
    if (prog) {
      const total = Object.values(b.cost).reduce((a, v) => a + v, 0);
      const done = Object.values(prog).reduce((a, v) => a + v, 0);
      const pct = Math.min(100, Math.round((done / total) * 100));
      underConstruction.push(`${b.emoji} **${b.name}**\n${progressBar(pct)} 🪵`);
    }
  }

  const nonEmptyResources = resources.filter(([_, qty]) => qty > 0);

  const embed = new EmbedBuilder()
    .setColor("#7BC47F")
    .setTitle(`🏡 EcoVillage — Level ${level} (${getLevelName(level)})`)
    .addFields(
      {
        name: "💚 Serenity Level",
        value:
          `**${calmness}% Calmness** — ${
            calmness < 40
              ? "The air feels restless. 🍃"
              : calmness < 80
              ? "Peace drifts through the trees. 🌿"
              : "Perfect harmony — a tranquil paradise. 🌸"
          }\n${progressBar(calmness)}\n\u200B`,
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
        value:
          nonEmptyResources.length
            ? nonEmptyResources
                .map(([res, qty]) => `• ${res} — **${qty}**`)
                .join("\n")
            : "_The storeroom is empty. Time to gather under the sun!_",
        inline: false,
      }
    )
    .setFooter({ text: "EcoVillage 🌻 — calm minds, growing hearts" })
    .setTimestamp();

  return embed;
}

module.exports = { generateVillageEmbed };
