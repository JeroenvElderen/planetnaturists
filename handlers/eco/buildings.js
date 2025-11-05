// handlers/eco/buildings.js
const { EmbedBuilder } = require("discord.js");
const config = require("../../config/ecoConfig");
const { loadData, saveData } = require("./data");
const { 
  ensureResources, 
  getPlayer, 
  calculateVillageLevel,
  formatLevelUpSummary,
 } = require("./utils");
const { refreshVillageEmbed } = require("../villageUpdater");

function buildList() {
  const data = loadData();
  ensureResources(data);

  const unlockedCount =
    data.village.metrics?.unlockedBuildings ||
    (data.village.level ? data.village.level * 5 : 5);
  const buildingEntries = Object.entries(config.buildings);
  const unlockedEntries = buildingEntries.slice(0, unlockedCount);

  const embed = new EmbedBuilder()
    .setTitle("🏗️ EcoVillage — Building Projects")
    .setColor("#3cb371")
    .setDescription(
      unlockedEntries.length
        ? "Help your community by contributing materials!"
        : "No building blueprints are available yet. Level up the village to unlock more!"
    );

  for (const [key, b] of unlockedEntries) {
    const done = data.village.structures[key];
    if (done) {
      embed.addFields({
        name: `${b.emoji} ${b.name}`,
        value: `✅ Completed by ${done.builtBy}`,
        inline: false,
      });
      continue;
    }

    const progress = data.village.progress?.[key] || {};
    const lines = [];
    let pct = 0;
    for (const [res, need] of Object.entries(b.cost)) {
      const have = progress[res] || 0;
      const bar =
        "▓".repeat(Math.round((have / need) * 10)) +
        "░".repeat(10 - Math.round((have / need) * 10));
      lines.push(`${bar} ${have}/${need} ${res}`);
      pct += have / need;
    }
    pct = Math.round((pct / Object.keys(b.cost).length) * 100);
    embed.addFields({
      name: `${b.emoji} ${b.name} (${key})`,
      value: `**Progress:** ${pct}%\n${lines.join(
        "\n"
      )}\n🔨 Use /eco build name:${key}`,
      inline: false,
    });
  }

  if (unlockedEntries.length < buildingEntries.length) {
    embed.addFields({
      name: "🔒 Locked Blueprints",
      value: `Reach higher village levels to reveal ${
        buildingEntries.length - unlockedEntries.length
      } more building types.`,
      inline: false,
    });
  }

  return { embeds: [embed] };
}

function buildSpecific(uid, username, key, client) {
  const data = loadData();
  ensureResources(data);

  const normalized = key.toLowerCase();
  const buildingEntries = Object.entries(config.buildings);
  const unlockedCount =
    data.village.metrics?.unlockedBuildings ||
    (data.village.level ? data.village.level * 5 : 5);
  const unlockedEntries = buildingEntries.slice(0, unlockedCount);

  let building = unlockedEntries.find(([k]) => k === normalized)?.[1];
  let realKey = normalized;

  if (!building) {
    for (const [k, b] of unlockedEntries) {
      if (b.name.toLowerCase() === normalized) {
        building = b;
        realKey = k;
        break;
      }
    }
  }

  if (!building)
    return `❌ No building named **${key}** is unlocked yet. Use \`/eco buildlist\` to see available projects.`;

  if (!data.village.progress) data.village.progress = {};
  if (!data.village.progress[realKey])
    data.village.progress[realKey] = Object.fromEntries(
      Object.entries(building.cost).map(([r, q]) => [r, 0])
    );

  const progress = data.village.progress[realKey];
  if (data.village.structures[realKey])
    return `✅ **${building.name}** is already completed!`;

  let contributed = false;
  let completed = true;
  const report = [];

  for (const [res, need] of Object.entries(building.cost)) {
    const have = data.village.resources[res] || 0;
    const current = progress[res] || 0;
    const remaining = need - current;

    if (remaining > 0 && have > 0) {
      const used = Math.min(have, remaining);
      data.village.resources[res] -= used;
      progress[res] += used;
      report.push(`🔹 ${used} ${res} (${progress[res]}/${need})`);
      contributed = true;
    }
    if (progress[res] < need) completed = false;
  }

  let msg;
  if (!contributed) {
    msg = `🧱 No available materials for **${building.name}**. Use /eco donate first.`;
  } else if (completed) {
    data.village.structures[realKey] = {
      name: building.name,
      builtBy: username,
      at: Date.now(),
    };
    const player = getPlayer(data, uid);
    player.xp += building.reward.xp;
    data.village.calmness = Math.min(
      100,
      data.village.calmness + building.reward.calm
    );

    msg = `🎉 **${building.name}** completed by ${username}! +${building.reward.xp} XP 🌿`;
  } else {
    msg = `🏗️ **${building.name}** progress updated:\n${report.join("\n")}`;
  }

  // 🌿 Level progression
  const leveledUp = calculateVillageLevel(data);
  saveData(data);
  if (client) refreshVillageEmbed(client);

  return leveledUp ? `${msg}\n${formatLevelUpSummary(data.village)}` : msg;
}

module.exports = { buildList, buildSpecific };
