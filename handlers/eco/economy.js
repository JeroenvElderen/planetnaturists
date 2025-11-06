// handlers/eco/economy.js
const { loadData, saveData } = require("./data");
const { getPlayer } = require("./utils");
const { findSeedByInventoryItem } = require("./garden");
const config = require("../../config/ecoConfig");

// 🌞 Earn random coins for naturist-friendly community tasks (limit: 5/hour)
function earn(uid, username) {
  const data = loadData();
  const player = getPlayer(data, uid);

  const LIMIT = 5;
  const now = Date.now();
  player.earns = (player.earns || []).filter(t => now - t < 3600000); // within last hour

  if (player.earns.length >= LIMIT) {
    return `🕒 **${username}**, you’ve already helped out plenty this hour!  
Take a dip in the lake or join a yoga session 🌊 (limit ${LIMIT}/hour).`;
  }

  player.earns.push(now);

  // 🌿 Naturist-friendly earning activities
  const jobs = [
    { action: "helped maintain the sun garden", min: 6, max: 14 },
    { action: "welcomed new guests to the naturist camp", min: 7, max: 15 },
    { action: "cleaned the natural lake area", min: 8, max: 18 },
    { action: "organized a sunrise yoga session by the beach", min: 10, max: 20 },
    { action: "set up hammocks near the relaxation grove", min: 7, max: 16 },
    { action: "guided visitors through the peaceful forest trail", min: 9, max: 19 },
    { action: "helped restore the wooden paths near the spa", min: 8, max: 17 },
    { action: "prepared a fruit and herbal drink stand", min: 6, max: 14 },
    { action: "arranged towels at the sun deck for guests", min: 10, max: 21 },
    { action: "collected smooth river stones for the garden pond", min: 9, max: 18 },
    { action: "trimmed plants around the naturist park walkways", min: 8, max: 17 },
  ];

  // 🎲 Pick a random job and calculate reward
  const job = jobs[Math.floor(Math.random() * jobs.length)];
  const reward = Math.floor(Math.random() * (job.max - job.min + 1)) + job.min;

  player.money = (player.money || 0) + reward;
  saveData(data);

  return `🌞 **${username}** ${job.action} and earned **${reward} coins!**  
💰 Balance: ${player.money} coins (${player.earns.length}/${LIMIT} this hour).`;
}

// 🛒 Buy resources from the village store
function resolvePrice(resource) {
  const seed = findSeedByInventoryItem(resource);
  if (seed && typeof seed.seedCost === "number") {
    return { unitPrice: seed.seedCost, label: `${seed.displayName} seeds` };
  }

  const unitPrice = config.store?.prices?.[resource];
  if (typeof unitPrice === "number") {
    return { unitPrice, label: resource };
  }

  return { unitPrice: 5, label: resource };
}

function buy(uid, resource, amount) {
  if (amount <= 0)
    return "❌ Please specify an amount of at least 1 to buy.";

  const data = loadData();
  const player = getPlayer(data, uid);

  const { unitPrice, label } = resolvePrice(resource);
  const totalPrice = unitPrice * amount;

  if (player.money < totalPrice)
    return `❌ Not enough money. You need **${totalPrice} coins** to buy ${amount} ${label}.`;

  player.money -= totalPrice;
  player.inventory[resource] = (player.inventory[resource] || 0) + amount;
  saveData(data);

  return `🛒 You bought **${amount} ${label}** for **${totalPrice} coins**.  
💰 Remaining balance: ${player.money}.`;
}

// 💵 Sell resources to the village store
function sell(uid, resource, amount) {
  if (amount <= 0)
    return "❌ Please specify an amount of at least 1 to sell.";

  const data = loadData();
  const player = getPlayer(data, uid);

  const have = player.inventory[resource] || 0;
  if (have < amount)
    return `❌ You only have **${have} ${resource}** available to sell.`;

  const { unitPrice, label } = resolvePrice(resource);
  const totalPrice = unitPrice * amount;

  player.inventory[resource] -= amount;
  player.money = (player.money || 0) + totalPrice;
  saveData(data);

  return `💵 You sold **${amount} ${label}** for **${totalPrice} coins**.  
💰 New balance: ${player.money}.`;
}

module.exports = { earn, buy, sell };
