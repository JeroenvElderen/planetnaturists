// handlers/eco/actions.js
const config = require("../../config/ecoConfig");
const { loadData, saveData } = require("./data");
const {
  ensureResources,
  getPlayer,
  calculateVillageLevel,
  formatLevelUpSummary,
} = require("./utils");
const { refreshVillageEmbed } = require("../villageUpdater");
const {
  computeGatherOutcome,
  computeRelaxOutcome,
} = require("./environment");

function gather(uid, username, client) {
  const data = loadData();
  ensureResources(data);
  const player = getPlayer(data, uid);

  if (typeof player.xp !== "number") player.xp = 0;

  const LIMIT = 5;
  const now = Date.now();
  player.gathers = (player.gathers || []).filter((t) => now - t < 3600000);
  if (player.gathers.length >= LIMIT)
    return `⏳ **${username}**, you’ve reached your hourly gather limit (${LIMIT}). Try again soon.`;

  player.gathers.push(now);

  const res =
    config.resources[Math.floor(Math.random() * config.resources.length)];
  let amount = Math.floor(Math.random() * (res.max - res.min + 1)) + res.min;
  let xpGain = config.xpPerGather;
  const notes = [];

  const outcome = computeGatherOutcome({
    resource: res,
    baseAmount: amount,
    baseXp: xpGain,
    village: data.village,
  });

  if (outcome.blockedMessage) {
    saveData(data);
    return `🌬️ ${username} tried to gather, but ${outcome.blockedMessage}`;
  }

  amount = outcome.amount;
  xpGain = outcome.xp;
  notes.push(...outcome.notes);

  player.inventory[res.name] = (player.inventory[res.name] || 0) + amount;
  player.xp += xpGain;

  saveData(data);
  if (client) refreshVillageEmbed(client);

  const detail = notes.length ? `\n${notes.join("\n")}` : "";
  return `${res.emoji} **${username}** gathered ${amount} ${
    res.name
  }! (Total: ${player.inventory[res.name]}) +${xpGain} XP${detail}`;
}

function relax(uid, username, client) {
  const data = loadData();
  const player = getPlayer(data, uid);

  if (typeof player.calm !== "number") player.calm = 0;
  if (typeof player.xp !== "number") player.xp = 0;

  let calmGain = config.calmPerRelax;
  const xpGain = config.xpPerRelax;
  const notes = [];

  const relaxOutcome = computeRelaxOutcome({
    baseCalm: calmGain,
    baseXp: xpGain,
    village: data.village,
  });

  calmGain = relaxOutcome.calm;
  xpGain = relaxOutcome.xp;
  notes.push(...relaxOutcome.notes);

  const extraVillageCalm = Math.max(0, calmGain - config.calmPerRelax);

  player.calm += calmGain;
  player.xp += xpGain;
  data.village.calmness = Math.min(
    100,
    data.village.calmness + 1 + extraVillageCalm
  );

  const leveledUp = calculateVillageLevel(data);
  saveData(data);
  if (client) refreshVillageEmbed(client);

  const levelMessage = leveledUp
    ? `\n${formatLevelUpSummary(data.village)}`
    : "";

  const detail = notes.length ? `\n${notes.join("\n")}` : "";
  return `🧘 ${username} relaxes. +${calmGain} Calm, +${xpGain} XP 🌞${detail}${levelMessage}`;
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
  const capacity = data.village.storage?.capacity || 100;
  const level = data.village.level || 1;
  const currentXp = data.village.xp || 0;
  const nextRequirement =
    data.village.nextLevelRequirement && data.village.nextLevelRequirement > 0
      ? data.village.nextLevelRequirement
      : level * 100;
  return `🏡 **EcoVillage Status**\nLevel: ${level} (XP: ${currentXp}/${nextRequirement})\nStorage Capacity: ${capacity}\nResources: ${resources}\nBuilt: ${built}\n💚 Calmness:${data.village.calmness}%`;
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
