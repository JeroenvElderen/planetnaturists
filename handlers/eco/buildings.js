const { EmbedBuilder } = require("discord.js");
const config = require("../../config/ecoConfig");
const { loadData, saveData } = require("./data");
const { ensureResources, getPlayer } = require("./utils");
const { refreshVillageEmbed } = require("../villageUpdater");

function buildList() {
  const data = loadData();
  ensureResources(data);

  const embed = new EmbedBuilder()
    .setTitle("🏗️ EcoVillage — Building Projects")
    .setColor("#3cb371")
    .setDescription("Help your community by contributing materials!");

  for (const [key, b] of Object.entries(config.buildings)) {
    const done = data.village.structures[key];
    if (done) {
      embed.addFields({
        name: `${b.emoji} ${b.name}`,
        value: `✅ Completed by ${done.builtBy}`,
        inline: false
      });
      continue;
    }

    const progress = data.village.progress?.[key] || {};
    const lines = [];
    let pct = 0;
    for (const [res, need] of Object.entries(b.cost)) {
      const have = progress[res] || 0;
      const bar = "▓".repeat(Math.round((have / need) * 10)) + "░".repeat(10 - Math.round((have / need) * 10));
      lines.push(`${bar} ${have}/${need} ${res}`);
      pct += have / need;
    }
    pct = Math.round((pct / Object.keys(b.cost).length) * 100);
    embed.addFields({
      name: `${b.emoji} ${b.name} (${key})`,
      value: `**Progress:** ${pct}%\n${lines.join("\n")}\n🔨 Use /eco build name:${key}`,
      inline: false
    });
  }

  return { embeds: [embed] };
}

function buildSpecific(uid, username, key, client) {
  const data = loadData();
  ensureResources(data);

  const normalized = key.toLowerCase();
  let building = config.buildings[normalized];
  let realKey = normalized;

  if (!building) {
    for (const [k, b] of Object.entries(config.buildings)) {
      if (b.name.toLowerCase() === normalized) {
        building = b;
        realKey = k;
        break;
      }
    }
  }

  if (!building) return `❌ No building named **${key}**. Use \`/eco buildlist\`.`;

  if (!data.village.progress) data.village.progress = {};
  if (!data.village.progress[realKey])
    data.village.progress[realKey] = Object.fromEntries(Object.entries(building.cost).map(([r, q]) => [r, 0]));

  const progress = data.village.progress[realKey];
  if (data.village.structures[realKey]) return `✅ **${building.name}** is already completed!`;

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
    data.village.structures[realKey] = { name: building.name, builtBy: username, at: Date.now() };
    const player = getPlayer(data, uid);
    player.xp += building.reward.xp;
    data.village.calmness = Math.min(100, data.village.calmness + building.reward.calm);
    msg = `🎉 **${building.name}** completed by ${username}! +${building.reward.xp} XP 🌿`;
  } else {
    msg = `🏗️ **${building.name}** progress updated:\n${report.join("\n")}`;
  }

  saveData(data);
  if (client) refreshVillageEmbed(client);
  return msg;
}

module.exports = { buildList, buildSpecific };
