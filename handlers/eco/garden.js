const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require("discord.js");
const { loadData, saveData, getPlayer } = require("./data");
const { getEnvironmentSnapshot } = require("./environment");

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

const SEED_DEFINITIONS = {
  sunflower: {
    key: "sunflower",
    displayName: "Sunflower",
    emoji: "🌻",
    baseGrowth: DAY,
    harvest: { sunflower: 3 },
    seedYield: 1,
    seedItem: "sunflower_seed",
    seedCost: 12,
    xpReward: 18,
    calmReward: 2,
    preferredSeasons: ["Spring", "Summer"],
    dislikedSeasons: ["Winter"],
    preferredWeather: ["Sunny", "Cloudy"],
    dislikedWeather: ["Windy"],
    stages: ["Sprout", "Bud", "Golden Bloom"],
  },
  pumpkin: {
    key: "pumpkin",
    displayName: "Pumpkin",
    emoji: "🎃",
    baseGrowth: 2 * DAY,
    harvest: { pumpkin: 2 },
    seedYield: 1,
    seedItem: "pumpkin_seed",
    seedCost: 18,
    xpReward: 28,
    calmReward: 1,
    preferredSeasons: ["Autumn"],
    dislikedSeasons: ["Winter"],
    preferredWeather: ["Rainy", "Cloudy"],
    dislikedWeather: ["Windy"],
    stages: ["Vine", "Flower", "Harvest Ready"],
  },
  lavender: {
    key: "lavender",
    displayName: "Lavender",
    emoji: "💜",
    baseGrowth: 18 * HOUR,
    harvest: { lavender: 5 },
    seedYield: 1,
    seedItem: "lavender_seed",
    seedCost: 14,
    xpReward: 20,
    calmReward: 4,
    preferredSeasons: ["Spring"],
    dislikedSeasons: ["Autumn"],
    preferredWeather: ["Sunny"],
    dislikedWeather: ["Rainy"],
    stages: ["Seedling", "Fragrant Buds", "Full Bloom"],
  },
  blueberry: {
    key: "blueberry",
    displayName: "Blueberry",
    emoji: "🫐",
    baseGrowth: 20 * HOUR,
    harvest: { blueberries: 6 },
    seedYield: 2,
    seedItem: "blueberry_seed",
    seedCost: 16,
    xpReward: 16,
    calmReward: 1,
    preferredSeasons: ["Summer"],
    dislikedSeasons: ["Winter"],
    preferredWeather: ["Rainy", "Cloudy"],
    dislikedWeather: ["Windy"],
    stages: ["Seedling", "Berries Forming", "Berry Bonanza"],
  },
  cactus: {
    key: "cactus",
    displayName: "Cactus",
    emoji: "🌵",
    baseGrowth: 36 * HOUR,
    harvest: { cactus: 2 },
    seedYield: 1,
    seedItem: "cactus_seed",
    seedCost: 22,
    xpReward: 22,
    calmReward: 3,
    preferredSeasons: ["Summer"],
    dislikedSeasons: ["Autumn"],
    preferredWeather: ["Sunny"],
    dislikedWeather: ["Rainy"],
    stages: ["Sprout", "Spines", "Desert Bloom"],
  },
  lotus: {
    key: "lotus",
    displayName: "Lotus",
    emoji: "🌸",
    baseGrowth: 30 * HOUR,
    harvest: { lotus_bloom: 3 },
    seedYield: 1,
    seedItem: "lotus_seed",
    seedCost: 24,
    xpReward: 24,
    calmReward: 5,
    preferredSeasons: ["Spring", "Summer"],
    dislikedSeasons: ["Winter"],
    preferredWeather: ["Rainy"],
    dislikedWeather: ["Windy"],
    stages: ["Floating Leaf", "Emerging Bud", "Radiant Lotus"],
  },
  bamboo: {
    key: "bamboo",
    displayName: "Bamboo",
    emoji: "🎋",
    baseGrowth: 40 * HOUR,
    harvest: { bamboo: 4 },
    seedYield: 2,
    seedItem: "bamboo_seed",
    seedCost: 25,
    xpReward: 26,
    calmReward: 2,
    preferredSeasons: ["Summer", "Autumn"],
    dislikedSeasons: [],
    preferredWeather: ["Rainy", "Cloudy"],
    dislikedWeather: [],
    stages: ["Shoot", "Stalk", "Towering Grove"],
  },
  tea_leaf: {
    key: "tea_leaf",
    displayName: "Tea Leaf",
    emoji: "🍃",
    baseGrowth: 22 * HOUR,
    harvest: { tea_leaves: 5 },
    seedYield: 1,
    seedItem: "tea_leaf_seed",
    seedCost: 15,
    xpReward: 18,
    calmReward: 4,
    preferredSeasons: ["Spring"],
    dislikedSeasons: ["Winter"],
    preferredWeather: ["Cloudy", "Rainy"],
    dislikedWeather: ["Windy"],
    stages: ["Shoot", "Tender Leaves", "Ready to Brew"],
  },
  strawberry: {
    key: "strawberry",
    displayName: "Strawberry",
    emoji: "🍓",
    baseGrowth: 16 * HOUR,
    harvest: { strawberries: 5 },
    seedYield: 2,
    seedItem: "strawberry_seed",
    seedCost: 14,
    xpReward: 14,
    calmReward: 1,
    preferredSeasons: ["Spring", "Summer"],
    dislikedSeasons: ["Winter"],
    preferredWeather: ["Sunny", "Rainy"],
    dislikedWeather: ["Windy"],
    stages: ["Seedling", "Flower", "Sweet Harvest"],
  },
  tomato: {
    key: "tomato",
    displayName: "Tomato",
    emoji: "🍅",
    baseGrowth: 18 * HOUR,
    harvest: { tomatoes: 6 },
    seedYield: 2,
    seedItem: "tomato_seed",
    seedCost: 13,
    xpReward: 15,
    calmReward: 1,
    preferredSeasons: ["Summer"],
    dislikedSeasons: ["Winter"],
    preferredWeather: ["Sunny"],
    dislikedWeather: ["Windy"],
    stages: ["Seedling", "Flowering Vine", "Vibrant Cluster"],
  },
  carrot: {
    key: "carrot",
    displayName: "Carrot",
    emoji: "🥕",
    baseGrowth: 14 * HOUR,
    harvest: { carrots: 5 },
    seedYield: 2,
    seedItem: "carrot_seed",
    seedCost: 9,
    xpReward: 12,
    calmReward: 1,
    preferredSeasons: ["Spring", "Autumn"],
    dislikedSeasons: ["Winter"],
    preferredWeather: ["Rainy", "Cloudy"],
    dislikedWeather: ["Windy"],
    stages: ["Sprout", "Rooting", "Crunchy Harvest"],
  },
  potato: {
    key: "potato",
    displayName: "Potato",
    emoji: "🥔",
    baseGrowth: 20 * HOUR,
    harvest: { potatoes: 4 },
    seedYield: 2,
    seedItem: "potato_seed",
    seedCost: 11,
    xpReward: 14,
    calmReward: 1,
    preferredSeasons: ["Spring", "Autumn"],
    dislikedSeasons: ["Summer"],
    preferredWeather: ["Cloudy", "Rainy"],
    dislikedWeather: ["Windy"],
    stages: ["Sprout", "Leafy Growth", "Tuber Time"],
  },
  corn: {
    key: "corn",
    displayName: "Corn",
    emoji: "🌽",
    baseGrowth: 26 * HOUR,
    harvest: { corn: 4 },
    seedYield: 2,
    seedItem: "corn_seed",
    seedCost: 15,
    xpReward: 18,
    calmReward: 2,
    preferredSeasons: ["Summer"],
    dislikedSeasons: ["Winter"],
    preferredWeather: ["Sunny", "Rainy"],
    dislikedWeather: ["Windy"],
    stages: ["Shoot", "Tassel", "Golden Ears"],
  },
  coffee: {
    key: "coffee",
    displayName: "Coffee",
    emoji: "☕",
    baseGrowth: 32 * HOUR,
    harvest: { coffee_beans: 4 },
    seedYield: 1,
    seedItem: "coffee_seed",
    seedCost: 22,
    xpReward: 24,
    calmReward: 3,
    preferredSeasons: ["Summer"],
    dislikedSeasons: ["Winter"],
    preferredWeather: ["Rainy", "Cloudy"],
    dislikedWeather: ["Windy"],
    stages: ["Sapling", "Cherry Buds", "Bean Harvest"],
  },
  chili: {
    key: "chili",
    displayName: "Chili Pepper",
    emoji: "🌶️",
    baseGrowth: 22 * HOUR,
    harvest: { chili_peppers: 5 },
    seedYield: 2,
    seedItem: "chili_seed",
    seedCost: 15,
    xpReward: 18,
    calmReward: 2,
    preferredSeasons: ["Summer"],
    dislikedSeasons: ["Winter"],
    preferredWeather: ["Sunny"],
    dislikedWeather: ["Rainy"],
    stages: ["Sprout", "Blossom", "Fiery Pods"],
  },
  rice: {
    key: "rice",
    displayName: "Rice",
    emoji: "🍚",
    baseGrowth: 28 * HOUR,
    harvest: { rice: 5 },
    seedYield: 2,
    seedItem: "rice_seed",
    seedCost: 13,
    xpReward: 17,
    calmReward: 2,
    preferredSeasons: ["Summer"],
    dislikedSeasons: ["Winter"],
    preferredWeather: ["Rainy"],
    dislikedWeather: ["Windy"],
    stages: ["Shoot", "Flooded Fields", "Golden Grains"],
  },
  mint: {
    key: "mint",
    displayName: "Mint",
    emoji: "🌿",
    baseGrowth: 16 * HOUR,
    harvest: { mint_leaves: 6 },
    seedYield: 2,
    seedItem: "mint_seed",
    seedCost: 8,
    xpReward: 13,
    calmReward: 3,
    preferredSeasons: ["Spring", "Summer"],
    dislikedSeasons: ["Winter"],
    preferredWeather: ["Cloudy", "Rainy"],
    dislikedWeather: ["Windy"],
    stages: ["Sprig", "Leafy Patch", "Refreshing Bounty"],
  },
  cocoa: {
    key: "cocoa",
    displayName: "Cocoa",
    emoji: "🍫",
    baseGrowth: 34 * HOUR,
    harvest: { cocoa_beans: 3 },
    seedYield: 1,
    seedItem: "cocoa_seed",
    seedCost: 23,
    xpReward: 26,
    calmReward: 4,
    preferredSeasons: ["Summer", "Autumn"],
    dislikedSeasons: ["Winter"],
    preferredWeather: ["Rainy", "Cloudy"],
    dislikedWeather: ["Windy"],
    stages: ["Sapling", "Pods Forming", "Chocolate Harvest"],
  },
};

const SEASON_MODIFIERS = {
  Spring: 0.9,
  Summer: 0.95,
  Autumn: 1.05,
  Winter: 1.2,
};

const WEATHER_MODIFIERS = {
  Sunny: 0.95,
  Rainy: 0.9,
  Cloudy: 1,
  Windy: 1.1,
};

const STAGE_THRESHOLDS = [
  { key: "sprout", progress: 0.33 },
  { key: "bloom", progress: 0.66 },
  { key: "ready", progress: 1 },
];

const CHECK_INTERVAL = 60 * 1000;
const MAX_PLOTS = 6;

function getSeedItemKey(seed) {
  return seed.seedItem || `${seed.key}_seed`;
}

const seedChoices = Object.values(SEED_DEFINITIONS)
  .sort((a, b) => (a.seedCost || 0) - (b.seedCost || 0))
  .map((seed) => ({
    name: `${seed.emoji} ${seed.displayName} (${seed.seedCost || 0}c)`,
    value: seed.key,
  }));

function ensureGarden(player) {
  if (!player.garden) player.garden = [];
  return player.garden;
}

function formatDuration(ms) {
  if (ms <= 0) return "ready now";
  const totalMinutes = Math.round(ms / 60000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes - days * 60 * 24) / 60);
  const minutes = totalMinutes % 60;
  const parts = [];
  if (days) parts.push(`${days}d`);
  if (hours) parts.push(`${hours}h`);
  if (minutes || !parts.length) parts.push(`${minutes}m`);
  return parts.join(" ");
}

function formatSeedList() {
  return seedChoices.map((choice) => choice.name).join(", ");
}

function findSeedByInventoryItem(itemKey) {
  return Object.values(SEED_DEFINITIONS).find(
    (seed) => getSeedItemKey(seed) === itemKey
  );
}

function getSeedByKey(seedKey) {
  return SEED_DEFINITIONS[seedKey];
}

function calculateGrowthTime(seed, village) {
  let growth = seed.baseGrowth;
  const notes = [];
  const snapshot = getEnvironmentSnapshot(village, Date.now());

  if (snapshot.season && SEASON_MODIFIERS[snapshot.season.name]) {
    const modifier = SEASON_MODIFIERS[snapshot.season.name];
    growth *= modifier;
    if (modifier < 1) {
      notes.push(`${snapshot.season.emoji} ${snapshot.season.name} hastens growth.`);
    } else if (modifier > 1) {
      notes.push(`${snapshot.season.emoji} ${snapshot.season.name} slows growth.`);
    }
  }

  if (seed.preferredSeasons?.includes(snapshot.season?.name)) {
    growth *= 0.85;
    notes.push(`💚 ${seed.displayName} thrives in ${snapshot.season.name}.`);
  } else if (seed.dislikedSeasons?.includes(snapshot.season?.name)) {
    growth *= 1.15;
    notes.push(`🥶 ${seed.displayName} struggles during ${snapshot.season.name}.`);
  }

  const weatherType = snapshot.weather?.type;
  if (weatherType && WEATHER_MODIFIERS[weatherType]) {
    const modifier = WEATHER_MODIFIERS[weatherType];
    growth *= modifier;
    if (modifier < 1) {
      notes.push(`${snapshot.weather.emoji} ${weatherType} nourishes the soil.`);
    } else if (modifier > 1) {
      notes.push(`${snapshot.weather.emoji} ${weatherType} makes growth tougher.`);
    }
  }

  if (seed.preferredWeather?.includes(weatherType)) {
    growth *= 0.9;
    notes.push(`🌦️ Perfect ${weatherType} skies for ${seed.displayName}.`);
  } else if (seed.dislikedWeather?.includes(weatherType)) {
    growth *= 1.1;
    notes.push(`⚠️ ${seed.displayName} dislikes the ${weatherType.toLowerCase()} weather.`);
  }

  return { growthTime: Math.round(growth), notes };
}

function randomInt(min, max) {
  const low = Math.ceil(Math.min(min, max));
  const high = Math.floor(Math.max(min, max));
  if (!Number.isFinite(low) || !Number.isFinite(high)) return 0;
  if (high <= 0) return 0;
  const rangeMin = Math.max(1, low);
  const rangeMax = Math.max(rangeMin, high);
  return Math.floor(Math.random() * (rangeMax - rangeMin + 1)) + rangeMin;
}

function resolveAmount(definition, fallback) {
  if (typeof definition === "number") {
    if (definition <= 0) return 0;
    const variance = Math.max(1, Math.ceil(definition * 0.25));
    const min = Math.max(1, definition - variance);
    const max = definition + variance;
    return randomInt(min, max);
  }

  if (typeof definition === "object" && definition) {
    if (typeof definition.min === "number" && typeof definition.max === "number") {
      return randomInt(definition.min, definition.max);
    }
    if (typeof definition.amount === "number") {
      return resolveAmount(definition.amount, fallback);
    }
  }

  if (typeof fallback === "number") {
    return resolveAmount(fallback);
  }

  return 0;
}

function formatHarvestSummary(yields) {
  const entries = Object.entries(yields).filter(([, amount]) => amount > 0);
  if (!entries.length) return "nothing";
  return entries
    .map(([item, amount]) => `${amount} ${item}`)
    .join(", ");
}

async function plantSeed(uid, username, seedKey) {
  const seed = SEED_DEFINITIONS[seedKey];
  if (!seed) {
    return `❌ Unknown seed. Available seeds: ${formatSeedList()}`;
  }

  const data = loadData();
  const player = getPlayer(data, uid);
  const garden = ensureGarden(player);

  const seedItemKey = getSeedItemKey(seed);
  const haveSeeds = player.inventory[seedItemKey] || 0;
  if (haveSeeds <= 0) {
    const priceText =
      typeof seed.seedCost === "number"
        ? ` for **${seed.seedCost} coins**`
        : "";
    return (
      `🌾 You need ${seed.displayName.toLowerCase()} seeds (${seedItemKey.replace(/_/g, " ")}) to plant this crop.` +
      ` Use \`/eco buy resource:${seedItemKey} amount:1\`${priceText} or craft more from your harvest via \`/eco recipes\`.`
    );
  }

  if (garden.length >= MAX_PLOTS) {
    return `🌿 Your garden is full (${MAX_PLOTS} plots). Harvest something before planting more.`;
  }

  const now = Date.now();
  const { growthTime, notes } = calculateGrowthTime(seed, data.village);

  player.inventory[seedItemKey] = haveSeeds - 1;
  if (player.inventory[seedItemKey] <= 0) delete player.inventory[seedItemKey];

  garden.push({
    id: `${seed.key}-${now}`,
    seed: seed.key,
    plantedAt: now,
    growthTime,
    notifiedStages: [],
  });

  saveData(data);

  const seedCount = player.inventory[seedItemKey] || 0;
  const seedStatus = `\n🌰 ${seedCount} ${seed.displayName.toLowerCase()} seeds remaining.`;
  const noteText = notes.length ? `\n${notes.join("\n")}` : "";
  return `${seed.emoji} **${username}**, you planted a ${seed.displayName}!\n⏳ Ready in about ${formatDuration(
    growthTime
  )}.${seedStatus}${noteText}`;
}

async function harvest(uid, username) {
  const data = loadData();
  const player = getPlayer(data, uid);
  const garden = ensureGarden(player);

  if (!garden.length) {
    return "🌱 You haven't planted anything yet. Use `/eco plant` to start your garden.";
  }

  const now = Date.now();
  const ready = [];
  const remaining = [];

  for (const plot of garden) {
    const progress = Math.min(1, (now - plot.plantedAt) / plot.growthTime);
    if (progress >= 1) {
      ready.push(plot);
    } else {
      remaining.push({ plot, progress });
    }
  }

  if (!ready.length) {
    const statusLines = remaining
      .map(({ plot, progress }) => {
        const seed = SEED_DEFINITIONS[plot.seed];
        const pct = Math.floor(progress * 100);
        const timeLeft = formatDuration(plot.growthTime - (now - plot.plantedAt));
        return `${seed.emoji} ${seed.displayName}: ${pct}% grown (about ${timeLeft} left)`;
      })
      .join("\n");

    const detail = statusLines || "🌱 Your seedlings are just getting started.";
    return `⏳ Nothing is ready to harvest yet, ${username}.\n${detail}`;
  }

  const harvestSummaries = [];
  let totalXp = 0;
  let totalCalm = 0;
  const seedReturns = [];

  for (const plot of ready) {
    const seed = SEED_DEFINITIONS[plot.seed];
    if (!seed) continue;
    const actualHarvest = {};
    Object.entries(seed.harvest).forEach(([item, amountDef]) => {
      const amount = resolveAmount(amountDef);
      if (amount <= 0) return;
      player.inventory[item] = (player.inventory[item] || 0) + amount;
      actualHarvest[item] = (actualHarvest[item] || 0) + amount;
    });
    const seedYieldAmount = resolveAmount(seed.seedYield);
    if (seedYieldAmount > 0) {
      const seedItemKey = getSeedItemKey(seed);
      player.inventory[seedItemKey] =
        (player.inventory[seedItemKey] || 0) + seedYieldAmount;
      seedReturns.push(`${seedYieldAmount} ${seedItemKey.replace(/_/g, " ")}`);
    }
    totalXp += seed.xpReward || 0;
    totalCalm += seed.calmReward || 0;
    harvestSummaries.push(
      `${seed.emoji} ${seed.displayName}: ${formatHarvestSummary(actualHarvest)}${
        seedYieldAmount
          ? ` + ${seedYieldAmount} ${getSeedItemKey(seed).replace(/_/g, " ")}`
          : ""
      }`
    );
  }

  player.garden = remaining.map(({ plot }) => plot);
  player.xp = (player.xp || 0) + totalXp;
  player.calm = (player.calm || 0) + totalCalm;

  saveData(data);

  const calmText = totalCalm ? ` +${totalCalm} Calm` : "";
  const xpText = totalXp ? ` +${totalXp} XP` : "";
  const seedText = seedReturns.length
    ? `\n🌰 Seeds saved: ${seedReturns.join(", ")}`
    : "";

  return (
    `🌾 **${username}** harvested:\n` +
    harvestSummaries.join("\n") +
    `${seedText}\nRewards:${xpText}${calmText}`
  );
}

function getSeedStageLabel(seed, index) {
  if (!seed?.stages?.length) return ["Sprout", "Bloom", "Harvest ready"][index] || "Growth";
  return seed.stages[Math.min(index, seed.stages.length - 1)];
}

async function notifyStage(client, userId, seed, stageIndex, progress) {
  if (!client) return false;
  try {
    const user = await client.users.fetch(userId);
    if (!user) return false;

    const stageLabel = getSeedStageLabel(seed, stageIndex);
    const embed = new EmbedBuilder()
      .setTitle(`${seed.emoji} ${seed.displayName} — ${stageLabel}`)
      .setDescription(
        stageIndex === STAGE_THRESHOLDS.length - 1
          ? `Your ${seed.displayName.toLowerCase()} is fully grown! Use **/eco harvest** to collect it.`
          : `The ${seed.displayName.toLowerCase()} is progressing nicely (${Math.round(
              progress * 100
            )}% grown).`
      )
      .setColor(stageIndex === STAGE_THRESHOLDS.length - 1 ? 0x4caf50 : 0x81c784)
      .setFooter({ text: "EcoVillage Garden" });

    const closeRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("eco_garden_ack")
        .setStyle(ButtonStyle.Secondary)
        .setLabel("Close notification")
    );

    await user.send({ embeds: [embed], components: [closeRow] });
    return true;
  } catch (err) {
    console.warn(`⚠️ Could not DM garden update to ${userId}:`, err.message);
    return false;
  }
}

async function checkGardenGrowth(client) {
  if (!client) return;
  const data = loadData();
  const now = Date.now();
  let touched = false;

  for (const [uid, player] of Object.entries(data.players || {})) {
    if (!player) continue;
    ensureGarden(player);
    if (!player.garden.length) continue;

    for (const plot of player.garden) {
      const seed = SEED_DEFINITIONS[plot.seed];
      if (!seed) continue;
      plot.notifiedStages = Array.isArray(plot.notifiedStages)
        ? plot.notifiedStages
        : [];

      const progress = Math.min(1, (now - plot.plantedAt) / plot.growthTime);

      for (let i = 0; i < STAGE_THRESHOLDS.length; i += 1) {
        const stage = STAGE_THRESHOLDS[i];
        if (progress >= stage.progress && !plot.notifiedStages.includes(stage.key)) {
          await notifyStage(client, uid, seed, i, progress);
          plot.notifiedStages.push(stage.key);
          touched = true;
        }
      }
    }
  }

  if (touched) {
    saveData(data);
  }
}

function scheduleGardenNotifications(client) {
  if (!client) return;
  checkGardenGrowth(client);
  setInterval(() => checkGardenGrowth(client), CHECK_INTERVAL);
}

async function handleGardenButton(interaction) {
  if (!interaction.customId.startsWith("eco_garden_ack")) return false;

  await interaction.update({
    components: [],
  });
  return true;
}

module.exports = {
  plantSeed,
  harvest,
  seedChoices,
  scheduleGardenNotifications,
  handleGardenButton,
  checkGardenGrowth,
  getSeedByKey,
  findSeedByInventoryItem,
};