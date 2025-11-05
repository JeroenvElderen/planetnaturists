const config = require("../../config/ecoConfig");
const { loadData, saveData } = require("./data");
const { ensureResources, getPlayer } = require("./utils");
const { refreshVillageEmbed } = require("../villageUpdater");

function gather(uid, username, client) {
  const data = loadData();
  ensureResources(data);
  const player = getPlayer(data, uid);

  const LIMIT = 5;
  const now = Date.now();
  player.gathers = (player.gathers || []).filter((t) => now - t < 3600000);
  if (player.gathers.length >= LIMIT)
    return `⏳ **${username}**, you’ve reached your hourly gather limit (${LIMIT}). Try again soon.`;

  player.gathers.push(now);

  const res =
    config.resources[Math.floor(Math.random() * config.resources.length)];
  const amount = Math.floor(Math.random() * (res.max - res.min + 1)) + res.min;
  player.inventory[res.name] = (player.inventory[res.name] || 0) + amount;
  player.xp += config.xpPerGather;

  saveData(data);
  if (client) refreshVillageEmbed(client);

  return `${res.emoji} **${username}** gathered ${amount} ${
    res.name
  }! (Total: ${player.inventory[res.name]})`;
}

function relax(uid, username) {
  const data = loadData();
  const player = getPlayer(data, uid);
  player.calm += config.calmPerRelax;
  player.xp += config.xpPerRelax;
  data.village.calmness = Math.min(100, data.village.calmness + 1);
  saveData(data);
  return `🧘 ${username} relaxes. +${config.calmPerRelax} Calm, +${config.xpPerRelax} XP 🌞`;
}

function status() {
  const data = loadData();
  const resources = Object.entries(data.village.resources)
    .map(([k, v]) => `${k}:${v}`)
    .join(", ");
  const built =
    Object.values(data.village.structures)
      .map((s) => s.name)
      .join(", ") || "none yet";
  return `🏡 **EcoVillage Status**\nResources: ${resources}\nBuilt: ${built}\n💚 Calmness: ${data.village.calmness}%`;
}

function top() {
  const data = loadData();
  const players = Object.entries(data.players)
    .map(([id, p]) => ({ id, xp: p.xp || 0 }))
    .sort((a, b) => b.xp - a.xp);
  if (!players.length) return "🌱 No players yet. Use `/eco gather`!";
  return (
    "🏆 **Top Helpers**\n" +
    players
      .slice(0, 10)
      .map((p, i) => `${i + 1}. <@${p.id}> — ${p.xp} XP`)
      .join("\n")
  );
}

module.exports = { gather, relax, status, top };
