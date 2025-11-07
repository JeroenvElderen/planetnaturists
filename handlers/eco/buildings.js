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

function formatId(id) {
  if (id === undefined || id === null) return "??";
  return String(id).padStart(2, "0");
}

const buildingEntries = Object.entries(config.buildings);
const buildingMeta = buildingEntries.map(([key, building]) => ({
  key,
  building,
  id: building.id,
  name: building.name,
  emoji: building.emoji || "🏗️",
}));

const buildingIdLookup = new Map();
buildingMeta.forEach((entry) => {
  if (entry.id !== undefined) buildingIdLookup.set(String(entry.id), entry.key);
});

const buildingChoices = buildingMeta
  .slice()
  .sort((a, b) => {
    if (a.id !== undefined && b.id !== undefined && a.id !== b.id)
      return a.id - b.id;
    if (a.id !== undefined && b.id === undefined) return -1;
    if (a.id === undefined && b.id !== undefined) return 1;
    return a.name.localeCompare(b.name);
  })
  .map((entry) => ({
    name: `${entry.emoji} [${formatId(entry.id)}] ${entry.name}`,
    value:
      entry.id !== undefined
        ? String(entry.id)
        : entry.key.slice(0, 100),
  }));

function resolveBuilding(unlockedEntries, identifier) {
  if (identifier === undefined || identifier === null) return null;
  const raw = identifier.toString().trim();
  if (!raw) return null;

  const numeric = Number(raw);
  if (!Number.isNaN(numeric)) {
    const keyFromId = buildingIdLookup.get(String(numeric));
    if (keyFromId) {
      const matched = unlockedEntries.find(([key]) => key === keyFromId);
      if (matched) return matched;
    }
  }

  const lowered = raw.toLowerCase();
  return (
    unlockedEntries.find(([key]) => key === lowered) ||
    unlockedEntries.find(([, building]) => building.name.toLowerCase() === lowered) ||
    null
  );
}

function buildList() {
  const data = loadData();
  ensureResources(data);

  const unlockedCount =
    data.village.metrics?.unlockedBuildings ||
    (data.village.level ? data.village.level * 5 : 5);
  const unlockedEntries = buildingEntries.slice(0, unlockedCount);

  const embed = new EmbedBuilder()
    .setTitle("🏗️ EcoVillage — Building Projects")
    .setColor("#3cb371")
    .setDescription(
      unlockedEntries.length
        ? "Help your community by contributing materials!"
        : "No building blueprints are available yet. Level up the village to unlock more!"
    );

  for (const [key, building] of unlockedEntries) {
    const done = data.village.structures[key];
    const idLabel = formatId(building.id);
    const commandValue =
      building.id !== undefined ? String(building.id) : key;

    if (done) {
      embed.addFields({
        name: `${building.emoji} [${idLabel}] ${building.name}`,
        value: `✅ Completed by ${done.builtBy}\nID: ${commandValue} | Key: ${key}`,
        inline: false,
      });
      continue;
    }

    const progress = data.village.progress?.[key] || {};
    const lines = [];
    let pct = 0;
    for (const [res, need] of Object.entries(building.cost)) {
      const have = progress[res] || 0;
      const bar =
        "▓".repeat(Math.round((have / need) * 10)) +
        "░".repeat(10 - Math.round((have / need) * 10));
      lines.push(`${bar} ${have}/${need} ${res}`);
      pct += have / need;
    }
    pct = Math.round((pct / Object.keys(building.cost).length) * 100);
    embed.addFields({
      name: `${building.emoji} [${idLabel}] ${building.name}`,
      value: `ID: ${commandValue} | Key: ${key}\n**Progress:** ${pct}%\n${lines.join(
        "\n"
      )}\n🔨 Use /eco build name:${commandValue}`,
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

function buildSpecific(uid, username, identifier, client) {
  const data = loadData();
  ensureResources(data);

  const unlockedCount =
    data.village.metrics?.unlockedBuildings ||
    (data.village.level ? data.village.level * 5 : 5);
  const unlockedEntries = buildingEntries.slice(0, unlockedCount);

  const resolvedEntry = resolveBuilding(unlockedEntries, identifier);

  if (!resolvedEntry)
    return `❌ No building matching **${identifier}** is unlocked yet. Use \`/eco buildlist\` to see available projects.`;

  const [realKey, building] = resolvedEntry;

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

module.exports = { buildList, buildSpecific, buildingChoices };
