const {
  select,
  upsert,
  insert,
  remove,
} = require("../../utils/supabaseClient");
const {
  createEnvironmentState,
  ensureEnvironmentState,
} = require("./environment");

const ECO_VILLAGE_ID = "main";

let dataCache = null;
let initializationPromise = null;

function createDefaultData(now = Date.now()) {
  const environment = createEnvironmentState(now);
  return {
    players: {},
    village: {
      level: 1,
      xp: 0,
      xpToNext: 0,
      nextLevelRequirement: 100,
      xpRemaining: 100,
      calmness: 50,
      ...environment,
      resources: {},
      structures: {},
      progress: {},
      storage: { level: 1, capacity: 100 },
      metrics: {
        totalDonations: 0,
        unlockedBuildings: 5,
        rareEvents: 0,
        lastGrowthScore: 0,
      },
    },
  };
}

function ensureVillageDefaults(data) {
  if (!data.village) data.village = createDefaultData().village;
  const v = data.village;

  if (typeof v.level !== "number" || v.level < 1) v.level = 1;
  if (typeof v.xp !== "number") v.xp = 0;
  if (typeof v.calmness !== "number") v.calmness = 50;

  ensureEnvironmentState(v, Date.now());

  if (!v.resources) v.resources = {};
  if (!v.structures) v.structures = {};
  if (!v.progress) v.progress = {};

  const structureScore = Object.keys(v.structures || {}).length;
  const currentGrowth =
    (typeof v.calmness === "number" ? v.calmness : 50) +
    structureScore +
    (v.metrics?.totalDonations || 0);

  if (!v.metrics)
    v.metrics = {
      totalDonations: 0,
      unlockedBuildings: v.level * 5,
      rareEvents: Math.max(0, v.level - 1),
      lastGrowthScore: currentGrowth,
    };
  else {
    if (typeof v.metrics.totalDonations !== "number")
      v.metrics.totalDonations = 0;
    v.metrics.unlockedBuildings = v.level * 5;
    v.metrics.rareEvents = Math.max(0, v.level - 1);
    if (typeof v.metrics.lastGrowthScore !== "number")
      v.metrics.lastGrowthScore = currentGrowth;
  }

  if (!v.storage)
    v.storage = { level: v.level, capacity: 100 + (v.level - 1) * 50 };
  else {
    v.storage.level = v.level;
    v.storage.capacity = 100 + (v.level - 1) * 50;
  }

  if (typeof v.nextLevelRequirement !== "number" || v.nextLevelRequirement <= 0)
    v.nextLevelRequirement = v.level * 100;
  if (typeof v.xpRemaining !== "number")
    v.xpRemaining = Math.max(0, v.nextLevelRequirement - (v.xp || 0));
  if (typeof v.xpToNext !== "number") v.xpToNext = currentGrowth;
}

async function loadEcoDataFromSupabase() {
  const [villageRow, playerRows, inventoryRows, gardenRows, gatherRows] =
    await Promise.all([
      select("eco_village", {
        columns:
          "id,level,xp,xp_to_next,next_level_requirement,xp_remaining,calmness,weather,season,season_change_at,season_changed_at,time,time_change_at,time_changed_at,resources,structures,progress,storage_level,storage_capacity,metrics",
        filter: { id: `eq.${ECO_VILLAGE_ID}` },
        single: true,
      }).catch(() => null),
      select("eco_players", { columns: "player_id,xp,calm,money" }).catch(
        () => []
      ),
      select("eco_player_inventory", {
        columns: "player_id,item_name,quantity",
      }).catch(() => []),
      select("eco_player_garden", {
        columns:
          "plot_id,player_id,seed,planted_at,growth_time,notified_stages",
      }).catch(() => []),
      select("eco_player_gathers", {
        columns: "player_id,gathered_at",
      }).catch(() => []),
    ]);

  let needsSeed = false;
  let village;

  if (!villageRow) {
    const defaults = createDefaultData();
    village = defaults.village;
    needsSeed = true;
  } else {
    village = {
      level: villageRow.level ?? 1,
      xp: villageRow.xp ?? 0,
      xpToNext: villageRow.xp_to_next ?? 0,
      nextLevelRequirement:
        villageRow.next_level_requirement ?? villageRow.level * 100,
      xpRemaining: villageRow.xp_remaining ?? 0,
      calmness: villageRow.calmness ?? 50,
      weather: villageRow.weather || null,
      season: villageRow.season || null,
      seasonChangeAt: villageRow.season_change_at || null,
      seasonChangedAt: villageRow.season_changed_at || null,
      time: villageRow.time || null,
      timeChangeAt: villageRow.time_change_at || null,
      timeChangedAt: villageRow.time_changed_at || null,
      resources: villageRow.resources || {},
      structures: villageRow.structures || {},
      progress: villageRow.progress || {},
      storage: {
        level: villageRow.storage_level ?? villageRow.level ?? 1,
        capacity: villageRow.storage_capacity ?? 100,
      },
      metrics: villageRow.metrics || {},
    };
  }

  const players = {};
  for (const row of playerRows) {
    players[row.player_id] = {
      xp: row.xp ?? 0,
      calm: row.calm ?? 0,
      money: row.money ?? 0,
      inventory: {},
      garden: [],
      gathers: [],
    };
  }

  for (const row of inventoryRows) {
    const player = players[row.player_id];
    if (!player) continue;
    player.inventory[row.item_name] = row.quantity ?? 0;
  }

  for (const row of gardenRows) {
    const player = players[row.player_id];
    if (!player) continue;
    const notified = Array.isArray(row.notified_stages)
      ? row.notified_stages
      : Array.isArray(row.notifiedStages)
      ? row.notifiedStages
      : [];
    player.garden.push({
      id: row.plot_id,
      seed: row.seed,
      plantedAt: row.planted_at,
      growthTime: row.growth_time,
      notifiedStages: notified,
    });
  }

  for (const row of gatherRows) {
    const player = players[row.player_id];
    if (!player) continue;
    if (!player.gathers) player.gathers = [];
    if (row.gathered_at !== undefined && row.gathered_at !== null) {
      player.gathers.push(row.gathered_at);
    }
  }

  for (const player of Object.values(players)) {
    if (!player.inventory) player.inventory = {};
    if (!Array.isArray(player.garden)) player.garden = [];
    if (!Array.isArray(player.gathers)) player.gathers = [];
  }

  const data = { players, village };
  ensureVillageDefaults(data);
  return { data, needsSeed };
}

async function initializeEcoData() {
  if (dataCache) return dataCache;
  if (!initializationPromise) {
    initializationPromise = (async () => {
      try {
        const { data, needsSeed } = await loadEcoDataFromSupabase();
        dataCache = data;
        if (needsSeed) {
          await persistEcoData(data);
        }
      } catch (err) {
        console.warn(
          "⚠️  Failed to load Eco data from Supabase. Using default offline data.",
          err
        );
        dataCache = createDefaultData();
        ensureVillageDefaults(dataCache);
      }
      return dataCache;
    })();
  }

  return initializationPromise;
}

function loadData() {
  if (!dataCache) {
    throw new Error(
      "Eco data not initialized. Call initializeEcoData() first."
    );
  }
  return dataCache;
}

function getPlayer(data, uid) {
  if (!data.players[uid])
    data.players[uid] = {
      xp: 0,
      calm: 0,
      inventory: {},
      money: 0,
      garden: [],
      gathers: [],
    };
  const player = data.players[uid];
  if (!player.inventory) player.inventory = {};
  if (!Array.isArray(player.garden)) player.garden = [];
  if (!Array.isArray(player.gathers)) player.gathers = [];
  if (player.money === undefined) player.money = 0;
  if (player.calm === undefined) player.calm = 0;
  if (player.xp === undefined) player.xp = 0;
  return player;
}

async function persistEcoData(data) {
  ensureVillageDefaults(data);
  const village = data.village;
  const players = data.players || {};

  const villagePayload = {
    id: ECO_VILLAGE_ID,
    level: village.level,
    xp: village.xp,
    xp_to_next: village.xpToNext,
    next_level_requirement: village.nextLevelRequirement,
    xp_remaining: village.xpRemaining,
    calmness: village.calmness,
    weather: village.weather,
    season: village.season,
    season_change_at: village.seasonChangeAt,
    season_changed_at: village.seasonChangedAt,
    time: village.time,
    time_change_at: village.timeChangeAt,
    time_changed_at: village.timeChangedAt,
    resources: village.resources,
    structures: village.structures,
    progress: village.progress,
    storage_level: village.storage?.level ?? village.level,
    storage_capacity: village.storage?.capacity ?? 100,
    metrics: village.metrics,
  };

  await upsert("eco_village", villagePayload);

  await remove("eco_player_garden", { player_id: "not.is.null" });
  await remove("eco_player_inventory", { player_id: "not.is.null" });
  await remove("eco_player_gathers", { player_id: "not.is.null" });
  await remove("eco_players", { player_id: "not.is.null" });

  const playerEntries = Object.entries(players);
  if (playerEntries.length) {
    const playerRows = playerEntries.map(([playerId, player]) => ({
      player_id: playerId,
      xp: player.xp ?? 0,
      calm: player.calm ?? 0,
      money: player.money ?? 0,
    }));
    await upsert("eco_players", playerRows);

    const inventoryRows = [];
    const gardenRows = [];
    const gatherRows = [];

    for (const [playerId, player] of playerEntries) {
      for (const [item, quantity] of Object.entries(player.inventory || {})) {
        inventoryRows.push({
          player_id: playerId,
          item_name: item,
          quantity: quantity ?? 0,
        });
      }

      for (const plot of player.garden || []) {
        gardenRows.push({
          plot_id: plot.id,
          player_id: playerId,
          seed: plot.seed,
          planted_at: plot.plantedAt,
          growth_time: plot.growthTime,
          notified_stages: Array.isArray(plot.notifiedStages)
            ? plot.notifiedStages
            : [],
        });
      }

      for (const timestamp of player.gathers || []) {
        gatherRows.push({ player_id: playerId, gathered_at: timestamp });
      }
    }

    if (inventoryRows.length)
      await upsert("eco_player_inventory", inventoryRows);
    if (gardenRows.length) await upsert("eco_player_garden", gardenRows);
    if (gatherRows.length) await upsert("eco_player_gathers", gatherRows);
  }
}

function saveData(data) {
  dataCache = data;
  persistEcoData(data).catch((err) =>
    console.error("❌ Failed to persist EcoVillage data:", err)
  );
}

async function resetEcoData() {
  const fresh = createDefaultData();
  ensureVillageDefaults(fresh);
  dataCache = fresh;

  await remove("eco_player_garden", { player_id: "not.is.null" });
  await remove("eco_player_inventory", { player_id: "not.is.null" });
  await remove("eco_player_gathers", { player_id: "not.is.null" });
  await remove("eco_players", { player_id: "not.is.null" });
  await remove("eco_village", { id: `eq.${ECO_VILLAGE_ID}` });

  await upsert("eco_village", {
    id: ECO_VILLAGE_ID,
    level: fresh.village.level,
    xp: fresh.village.xp,
    xp_to_next: fresh.village.xpToNext,
    next_level_requirement: fresh.village.nextLevelRequirement,
    xp_remaining: fresh.village.xpRemaining,
    calmness: fresh.village.calmness,
    weather: fresh.village.weather,
    season: fresh.village.season,
    season_change_at: fresh.village.seasonChangeAt,
    season_changed_at: fresh.village.seasonChangedAt,
    time: fresh.village.time,
    time_change_at: fresh.village.timeChangeAt,
    time_changed_at: fresh.village.timeChangedAt,
    resources: fresh.village.resources,
    structures: fresh.village.structures,
    progress: fresh.village.progress,
    storage_level: fresh.village.storage.level,
    storage_capacity: fresh.village.storage.capacity,
    metrics: fresh.village.metrics,
  });

  return dataCache;
}

module.exports = {
  initializeEcoData,
  loadData,
  saveData,
  getPlayer,
  resetEcoData,
  ensureVillageDefaults,
};
