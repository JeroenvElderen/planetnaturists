// handlers/ecoHandler.js
const fs = require("fs");
const path = require("path");
const { EmbedBuilder } = require("discord.js");
const config = require("../config/ecoConfig");

const dataPath = path.join(__dirname, "../data/ecoData.json");

function loadData() {
  if (!fs.existsSync(dataPath)) {
    fs.writeFileSync(dataPath, JSON.stringify({ players: {}, village: { resources: {}, structures: {}, calmness: 50 } }, null, 2));
  }
  const raw = fs.readFileSync(dataPath, "utf8");
  return JSON.parse(raw);
}

function saveData(data) {
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
}

function ensureResources(data) {
  if (!data.village.resources) data.village.resources = {};
  for (const res of config.resources) {
    if (typeof data.village.resources[res.name] !== "number")
      data.village.resources[res.name] = 0;
  }
}

function calcLevel(xp) {
  if (xp >= 1000) return 5;
  if (xp >= 500) return 4;
  if (xp >= 250) return 3;
  if (xp >= 100) return 2;
  return 1;
}

// ========== BASE ACTIONS ==========
function gather(uid, username) {
  const data = loadData();
  ensureResources(data);
  const res = config.resources[Math.floor(Math.random() * config.resources.length)];
  const amount = Math.floor(Math.random() * (res.max - res.min + 1)) + res.min;
  data.village.resources[res.name] += amount;

  const player = data.players[uid] || { xp: 0, calm: 0 };
  player.xp += config.xpPerGather;
  data.players[uid] = player;
  saveData(data);

  return `${res.emoji} **${username}** gathered ${amount} ${res.name}! XP: ${player.xp} (Level ${calcLevel(player.xp)})`;
}

function relax(uid, username) {
  const data = loadData();
  const player = data.players[uid] || { xp: 0, calm: 0 };
  player.calm += config.calmPerRelax;
  player.xp += config.xpPerRelax;
  data.village.calmness = Math.min(100, data.village.calmness + 1);
  data.players[uid] = player;
  saveData(data);
  return `🧘 ${username} relaxes. +${config.calmPerRelax} Calm, +${config.xpPerRelax} XP 🌞`;
}

function status() {
  const data = loadData();
  const res = Object.entries(data.village.resources)
    .map(([k, v]) => `${k}:${v}`)
    .join(", ");
  const built = Object.values(data.village.structures)
    .map(s => s.name)
    .join(", ") || "none yet";
  return `🏡 **EcoVillage Status**\nResources: ${res}\nBuilt: ${built}\n💚 Calmness: ${data.village.calmness}%`;
}

function top() {
  const data = loadData();
  const players = Object.entries(data.players).map(([id, p]) => ({ id, xp: p.xp || 0 }));
  players.sort((a, b) => b.xp - a.xp);
  if (!players.length) return "🌱 No players yet. Use `/eco gather`!";
  return "🏆 **Top Helpers**\n" + players.slice(0, 10).map((p, i) => `${i + 1}. <@${p.id}> — ${p.xp} XP`).join("\n");
}

// ========== CRAFTING ==========
function combine(uid, username, recipeName) {
  const data = loadData();
  ensureResources(data);

  const recipe = config.recipes[recipeName];
  if (!recipe) {
    return `❌ Recipe **${recipeName}** not found. Use \`/eco recipes\` to see available options.`;
  }

  const missing = [];
  for (const [res, qty] of Object.entries(recipe.inputs)) {
    const have = data.village.resources[res] || 0;
    if (have < qty) missing.push(`${res} (${have}/${qty})`);
  }

  if (missing.length) {
    return `🧱 Not enough resources for **${recipeName}**:\n${missing.join(", ")}`;
  }

  for (const [res, qty] of Object.entries(recipe.inputs)) {
    data.village.resources[res] -= qty;
  }

  for (const [res, qty] of Object.entries(recipe.output)) {
    data.village.resources[res] = (data.village.resources[res] || 0) + qty;
  }

  const player = data.players[uid] || { xp: 0, calm: 0 };
  player.xp += recipe.xp;
  data.players[uid] = player;
  saveData(data);

  const outputName = Object.keys(recipe.output)[0];
  return `${recipe.emoji} **${username}** crafted ${outputName}! +${recipe.xp} XP`;
}

function recipesList() {
  const list = Object.entries(config.recipes)
    .map(([name, r]) => `${r.emoji} **${name}** → ${Object.keys(r.output)[0]} (requires: ${Object.entries(r.inputs).map(([i, q]) => `${q} ${i}`).join(", ")})`)
    .join("\n");
  return `📜 **Crafting Recipes**\n${list}`;
}

function help() {
  return (
    "🌿 **EcoVillage Commands:**\n" +
    "`/eco gather` – collect resources\n" +
    "`/eco combine [recipe]` – craft new materials\n" +
    "`/eco recipes` – view all crafting recipes\n" +
    "`/eco buildlist` – view available building projects\n" +
    "`/eco build [name]` – help construct a chosen building\n" +
    "`/eco relax` – gain calm and XP\n" +
    "`/eco status` – view village status\n" +
    "`/eco top` – leaderboard"
  );
}

// ========== BUILDING SYSTEM WITH EMBEDS ==========
function buildList() {
  const data = loadData();
  ensureResources(data);

  const embed = new EmbedBuilder()
    .setTitle("🏗️ EcoVillage — Building Projects")
    .setDescription("Help your community by contributing materials to shared projects!")
    .setColor("#3cb371");

  for (const [key, b] of Object.entries(config.buildings)) {
    const done = data.village.structures[key];

    if (done) {
      embed.addFields({
        name: `${b.emoji} ${b.name}`,
        value: `✅ Completed by **${done.builtBy}**`,
        inline: false,
      });
      continue;
    }

    const lines = [];
    let totalHave = 0;
    let totalNeed = 0;

    for (const [res, need] of Object.entries(b.cost)) {
      const have = data.village.resources[res] || 0;
      totalHave += Math.min(have, need);
      totalNeed += need;

      const pct = Math.min(1, have / need);
      const filled = Math.round(pct * 10);
      const bar = "▓".repeat(filled) + "░".repeat(10 - filled);
      lines.push(`${bar} ${have}/${need} ${res}`);
    }

    const overallPct = Math.min(1, totalHave / totalNeed);
    const overallBar = "█".repeat(Math.round(overallPct * 20)) + "░".repeat(20 - Math.round(overallPct * 20));

    const unlockText = b.unlocks?.length
      ? `🔓 Unlocks: ${b.unlocks.join(", ")}`
      : "";

    embed.addFields({
      name: `${b.emoji} ${b.name}`,
      value: `**Progress:** ${overallBar} ${Math.round(overallPct * 100)}%\n${lines.join("\n")}\n${unlockText}`,
      inline: false,
    });
  }

  embed.setFooter({ text: "Use /eco build name:<building> to help construct one!" });
  return { embeds: [embed] };
}

function buildSpecific(uid, username, key) {
  const data = loadData();
  ensureResources(data);
  const building = config.buildings[key];
  if (!building)
    return `❌ No building named **${key}**. Use \`/eco buildlist\` to view options.`;

  if (data.village.structures[key])
    return `✅ **${building.name}** is already completed!`;

  const missing = [];
  for (const [res, need] of Object.entries(building.cost)) {
    const have = data.village.resources[res] || 0;
    if (have < need) missing.push(`${res} (${have}/${need})`);
  }
  if (missing.length)
    return `🧱 Not enough materials for **${building.name}**:\n${missing.join(", ")}`;

  for (const [res, need] of Object.entries(building.cost))
    data.village.resources[res] -= need;

  data.village.structures[key] = {
    name: building.name,
    builtBy: username,
    at: Date.now()
  };
  data.village.calmness = Math.min(100, data.village.calmness + building.reward.calm);

  const player = data.players[uid] || { xp: 0, calm: 0 };
  player.xp += building.reward.xp;
  data.players[uid] = player;

  saveData(data);
  return `🎉 **${building.name}** completed by ${username}! +${building.reward.xp} XP 🌿 (Calmness ${data.village.calmness}%)`;
}

module.exports = {
  gather, relax, status, top, combine, recipesList, help, buildList, buildSpecific
};
