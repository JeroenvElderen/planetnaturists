const { loadData, saveData } = require("./eco/data");
const { refreshVillageEmbed } = require("./villageUpdater");
const {
  getRandomWeather,
  getRandomWeatherDuration,
  getWeatherInfo,
  ensureEnvironmentState,
} = require("./eco/environment");

async function applyWeatherChange(client) {
  try {
    const data = loadData();
    const now = Date.now();
    ensureEnvironmentState(data.village, now);
    const currentType = data.village.weather?.type;
    const nextWeather = getRandomWeather(currentType);

    data.village.weather = {
      type: nextWeather.type,
      nextChange: now + getRandomWeatherDuration(),
      changedAt: now,
    };
    saveData(data);

    console.log(`🌦️ Weather shifted to ${nextWeather.type}.`);
    if (client) await refreshVillageEmbed(client);
  } catch (err) {
    console.error("❌ Failed to change weather:", err);
  }
}

function scheduleWeatherUpdates(client) {
  const scheduleNext = () => {
    let delay = getRandomWeatherDuration();
    try {
      const data = loadData();
      const now = Date.now();
      ensureEnvironmentState(data.village, now);
      let nextChange = data.village.weather?.nextChange;
      if (typeof nextChange !== "number") {
        const fallback = now + getRandomWeatherDuration();
        const type = data.village.weather?.type;
        data.village.weather = {
          type: getWeatherInfo(type).type,
          nextChange: fallback,
          changedAt: now,
        };
        saveData(data);
        nextChange = fallback;
      }
      delay = Math.max(1000, nextChange - now);
    } catch (err) {
      console.error("⚠️ Unable to schedule weather update:", err);
    }

    setTimeout(async () => {
      await applyWeatherChange(client);
      scheduleNext();
    }, delay);
  };

  scheduleNext();
}

module.exports = { scheduleWeatherUpdates };