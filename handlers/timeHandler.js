const { loadData, saveData } = require("./eco/data");
const { refreshVillageEmbed } = require("./villageUpdater");
const {
  getNextTimeOfDayInfo,
  getTimeSlotDuration,
  getTimeOfDayInfo,
  ensureEnvironmentState,
} = require("./eco/environment");

async function advanceTimeOfDay(client) {
  try {
    const data = loadData();
    const now = Date.now();
    ensureEnvironmentState(data.village, now);
    const nextTime = getNextTimeOfDayInfo(data.village.time);

    data.village.time = nextTime.name;
    data.village.timeChangedAt = now;
    data.village.timeChangeAt = now + getTimeSlotDuration();
    saveData(data);

    console.log(`🕒 Time of day is now ${nextTime.name}.`);
    if (client) await refreshVillageEmbed(client);
  } catch (err) {
    console.error("❌ Failed to advance time of day:", err);
  }
}

function scheduleTimeCycle(client) {
  const scheduleNext = () => {
    let delay = getTimeSlotDuration();
    try {
      const data = loadData();
      const now = Date.now();
      ensureEnvironmentState(data.village, now);
      let nextChange = data.village.timeChangeAt;
      if (typeof nextChange !== "number") {
        nextChange = now + getTimeSlotDuration();
        const current = getTimeOfDayInfo(data.village.time);
        data.village.time = current.name;
        data.village.timeChangedAt = now;
        data.village.timeChangeAt = nextChange;
        saveData(data);
      }
      delay = Math.max(1000, nextChange - now);
    } catch (err) {
      console.error("⚠️ Unable to schedule time-of-day update:", err);
    }

    setTimeout(async () => {
      await advanceTimeOfDay(client);
      scheduleNext();
    }, delay);
  };

  scheduleNext();
}

module.exports = { scheduleTimeCycle };