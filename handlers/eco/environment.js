const HOUR_IN_MS = 60 * 60 * 1000;
const DAY_IN_MS = 24 * HOUR_IN_MS;
const TIME_SLOT_HOURS = 6;
const WEATHER_MIN_HOURS = 3;
const WEATHER_MAX_HOURS = 6;

const SEASONS = [
  {
    name: "Spring",
    emoji: "🌸",
    effect: "More plant yield (+1 plant resources)",
    color: "#7BC47F",
  },
  {
    name: "Summer",
    emoji: "🌞",
    effect: "Relax gives +1 calm",
    color: "#F7B801",
  },
  {
    name: "Autumn",
    emoji: "🍂",
    effect: "Double gather XP",
    color: "#D2691E",
  },
  {
    name: "Winter",
    emoji: "❄️",
    effect: "Gather yields half resources",
    color: "#8AB6D6",
  },
];

const WEATHER = [
  { type: "Sunny", emoji: "🌞", effect: "+1 XP to gather" },
  { type: "Rainy", emoji: "🌧️", effect: "+2 calm for relax" },
  { type: "Windy", emoji: "🌬️", effect: "Gather chance lower" },
  { type: "Cloudy", emoji: "⛅", effect: "Normal conditions" },
];

const TIMES_OF_DAY = [
  { name: "Day", emoji: "☀️", effect: "Gather yields +1 resource", color: "#FFD166" },
  { name: "Night", emoji: "🌙", effect: "Relax restores +1 calm", color: "#3A86FF" },
];

const PLANT_RESOURCES = new Set(["herbs", "leaves", "fiber", "soil", "water"]);

function createEnvironmentState(now = Date.now()) {
  return {
    weather: {
      type: WEATHER[0].type,
      nextChange: now + getRandomWeatherDuration(),
      changedAt: now,
    },
    season: SEASONS[0].name,
    seasonChangeAt: now + DAY_IN_MS,
    seasonChangedAt: now,
    time: TIMES_OF_DAY[0].name,
    timeChangeAt: now + getTimeSlotDuration(),
    timeChangedAt: now,
  };
}

function ensureEnvironmentState(village, now = Date.now()) {
  if (!village) {
    return createEnvironmentState(now);
  }

  const state = village;

  if (!state.weather || typeof state.weather !== "object") {
    const type =
      typeof state.weather === "string" ? state.weather : WEATHER[0].type;
    state.weather = {
      type,
      nextChange: now + getRandomWeatherDuration(),
      changedAt: now,
    };
  } else {
    if (typeof state.weather.type !== "string") {
      state.weather.type = WEATHER[0].type;
    }
    if (typeof state.weather.nextChange !== "number") {
      state.weather.nextChange = now + getRandomWeatherDuration();
    }
    if (typeof state.weather.changedAt !== "number") {
      state.weather.changedAt = now;
    }
  }

  if (typeof state.season !== "string") {
    state.season = SEASONS[0].name;
  }
  if (typeof state.seasonChangeAt !== "number") {
    state.seasonChangeAt = now + DAY_IN_MS;
  }
  if (typeof state.seasonChangedAt !== "number") {
    state.seasonChangedAt = now;
  }

  if (typeof state.time !== "string") {
    state.time = TIMES_OF_DAY[0].name;
  }
  if (typeof state.timeChangeAt !== "number") {
    state.timeChangeAt = now + getTimeSlotDuration();
  }
  if (typeof state.timeChangedAt !== "number") {
    state.timeChangedAt = now;
  }

  return state;
}

function getSeasonInfo(name = "Spring") {
  return SEASONS.find((season) => season.name === name) || SEASONS[0];
}

function getNextSeasonInfo(currentName = "Spring") {
  const idx = SEASONS.findIndex((season) => season.name === currentName);
  const nextIndex = idx === -1 ? 0 : (idx + 1) % SEASONS.length;
  return SEASONS[nextIndex];
}

function getWeatherInfo(type = "Sunny") {
  return WEATHER.find((w) => w.type === type) || WEATHER[0];
}

function getRandomWeatherDuration() {
  const hours =
    Math.floor(
      Math.random() * (WEATHER_MAX_HOURS - WEATHER_MIN_HOURS + 1)
    ) + WEATHER_MIN_HOURS;
  return hours * HOUR_IN_MS;
}

function getRandomWeather(type) {
  const options = WEATHER.filter((w) => w.type !== type);
  if (!options.length) return getWeatherInfo(type);
  return options[Math.floor(Math.random() * options.length)];
}

function getTimeOfDayInfo(name = "Day") {
  return TIMES_OF_DAY.find((t) => t.name === name) || TIMES_OF_DAY[0];
}

function getNextTimeOfDayInfo(name = "Day") {
  const idx = TIMES_OF_DAY.findIndex((t) => t.name === name);
  const nextIndex = idx === -1 ? 0 : (idx + 1) % TIMES_OF_DAY.length;
  return TIMES_OF_DAY[nextIndex];
}

function getTimeSlotDuration() {
  return TIME_SLOT_HOURS * HOUR_IN_MS;
}

function getEnvironmentSnapshot(village, now = Date.now()) {
  const seasonInfo = getSeasonInfo(village?.season);
  const weatherInfo = getWeatherInfo(village?.weather?.type);
  const timeInfo = getTimeOfDayInfo(village?.time);

  return {
    season: seasonInfo,
    weather: weatherInfo,
    time: timeInfo,
    timers: {
      season: typeof village?.seasonChangeAt === "number"
        ? Math.max(0, village.seasonChangeAt - now)
        : null,
      weather: typeof village?.weather?.nextChange === "number"
        ? Math.max(0, village.weather.nextChange - now)
        : null,
      time: typeof village?.timeChangeAt === "number"
        ? Math.max(0, village.timeChangeAt - now)
        : null,
    },
  };
}

function computeGatherOutcome({
  resource,
  baseAmount,
  baseXp,
  village,
  random = Math.random,
}) {
  const snapshot = getEnvironmentSnapshot(village);
  let amount = baseAmount;
  let xp = baseXp;
  const notes = [];

  if (snapshot.weather.type === "Windy" && random() < 0.3) {
    return {
      blockedMessage:
        "the gusts scattered everything away! Try again when the winds calm.",
    };
  }

  if (snapshot.season.name === "Spring" && PLANT_RESOURCES.has(resource.name)) {
    amount += 1;
    notes.push("🌸 Spring bloom: +1 plant resource.");
  }

  if (snapshot.season.name === "Autumn") {
    xp *= 2;
    notes.push("🍂 Autumn focus: gather XP doubled.");
  }

  if (snapshot.season.name === "Winter") {
    amount = Math.max(1, Math.floor(amount / 2));
    notes.push("❄️ Winter chill: harvest halved.");
  }

  if (snapshot.weather.type === "Sunny") {
    xp += 1;
    notes.push("🌞 Sunny skies: +1 gather XP.");
  }

  if (snapshot.time.name === "Day") {
    amount += 1;
    notes.push("☀️ Daylight boost: +1 resource.");
  }

  return { amount, xp, notes, snapshot };
}

function computeRelaxOutcome({ baseCalm, baseXp, village }) {
  const snapshot = getEnvironmentSnapshot(village);
  let calm = baseCalm;
  const notes = [];

  if (snapshot.season.name === "Summer") {
    calm += 1;
    notes.push("🌞 Summer warmth: +1 calm.");
  }

  if (snapshot.weather.type === "Rainy") {
    calm += 2;
    notes.push("🌧️ Rainy comfort: +2 calm.");
  }

  if (snapshot.time.name === "Night") {
    calm += 1;
    notes.push("🌙 Night hush: +1 calm.");
  }

  return { calm, xp: baseXp, notes, snapshot };
}

module.exports = {
  HOUR_IN_MS,
  DAY_IN_MS,
  SEASONS,
  WEATHER,
  TIMES_OF_DAY,
  PLANT_RESOURCES,
  createEnvironmentState,
  ensureEnvironmentState,
  getSeasonInfo,
  getNextSeasonInfo,
  getWeatherInfo,
  getRandomWeather,
  getRandomWeatherDuration,
  getTimeOfDayInfo,
  getNextTimeOfDayInfo,
  getTimeSlotDuration,
  getEnvironmentSnapshot,
  computeGatherOutcome,
  computeRelaxOutcome,
};