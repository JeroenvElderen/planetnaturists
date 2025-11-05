const { loadData, saveData } = require("./eco/data");
const { refreshVillageEmbed } = require("./villageUpdater");
const {
  DAY_IN_MS,
  getNextSeasonInfo,
  ensureEnvironmentState,
} = require("./eco/environment");

async function rotateSeason(client) {
  try {
    const data = loadData();
    const now = Date.now();
    ensureEnvironmentState(data.village, now);
    const nextSeason = getNextSeasonInfo(data.village.season);

    data.village.season = nextSeason.name;
    data.village.seasonChangedAt = now;
    data.village.seasonChangeAt = now + DAY_IN_MS;
    saveData(data);

    console.log(`🌍 Season changed to ${nextSeason.name}.`);
    if (client) await refreshVillageEmbed(client);
  } catch (err) {
    console.error("❌ Failed to rotate season:", err);
  }
}

function scheduleSeasonRotation(client) {
  const scheduleNext = () => {
    let delay = DAY_IN_MS;
    try {
      const data = loadData();
      const now = Date.now();
      ensureEnvironmentState(data.village, now);
      let nextChange = data.village.seasonChangeAt;
      if (typeof nextChange !== "number") {
        nextChange = now + DAY_IN_MS;
        data.village.seasonChangeAt = nextChange;
        data.village.seasonChangedAt = now;
        saveData(data);
      }
      delay = Math.max(1000, nextChange - now);
    } catch (err) {
      console.error("⚠️ Unable to schedule season rotation:", err);
    }

    setTimeout(async () => {
      await rotateSeason(client);
      scheduleNext();
    }, delay);
  };

  scheduleNext();
}

module.exports = { scheduleSeasonRotation };