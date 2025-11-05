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
    xpReward: 15,
    calmReward: 1,
    preferredSeasons: ["Summer"],
    dislikedSeasons: ["Winter"],
    preferredWeather: ["Sunny"],
    dislikedWeather: ["Windy"],
    stages: ["Seedling", "Flowering Vine", "Vibrant Cluster"],
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

const seedChoices = Object.values(SEED_DEFINITIONS).map((seed) => ({
  name: `${seed.emoji} ${seed.displayName}`,
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

function formatHarvestSummary(yields) {
  return Object.entries(yields)
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

  if (garden.length >= MAX_PLOTS) {
    return `🌿 Your garden is full (${MAX_PLOTS} plots). Harvest something before planting more.`;
  }

  const now = Date.now();
  const { growthTime, notes } = calculateGrowthTime(seed, data.village);

  garden.push({
    id: `${seed.key}-${now}`,
    seed: seed.key,
    plantedAt: now,
    growthTime,
    notifiedStages: [],
  });

  saveData(data);

  const noteText = notes.length ? `\n${notes.join("\n")}` : "";
  return `${seed.emoji} **${username}**, you planted a ${seed.displayName}!\n⏳ Ready in about ${formatDuration(
    growthTime
  )}.${noteText}`;
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

  for (const plot of ready) {
    const seed = SEED_DEFINITIONS[plot.seed];
    if (!seed) continue;
    Object.entries(seed.harvest).forEach(([item, amount]) => {
      player.inventory[item] = (player.inventory[item] || 0) + amount;
    });
    totalXp += seed.xpReward || 0;
    totalCalm += seed.calmReward || 0;
    harvestSummaries.push(
      `${seed.emoji} ${seed.displayName}: ${formatHarvestSummary(seed.harvest)}`
    );
  }

  player.garden = remaining.map(({ plot }) => plot);
  player.xp = (player.xp || 0) + totalXp;
  player.calm = (player.calm || 0) + totalCalm;

  saveData(data);

  const calmText = totalCalm ? ` +${totalCalm} Calm` : "";
  const xpText = totalXp ? ` +${totalXp} XP` : "";

  return (
    `🌾 **${username}** harvested:\n` +
    harvestSummaries.join("\n") +
    `\nRewards:${xpText}${calmText}`
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
};