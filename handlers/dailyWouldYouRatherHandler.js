// handlers/dailyWouldYouRatherHandler.js
const fs = require("fs");
const path = require("path");
const cron = require("node-cron");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const WOULD_YOU_RATHER_CHANNEL_ID = "1434948784336535592";
const STATE_PATH = path.join(__dirname, "../data/wouldYouRatherState.json");
const TIMEZONE = "Europe/Dublin";
const MAX_HISTORY_ENTRIES = 60;

let wouldYouRatherJob = null;

function formatDateInIrish(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function getLatestEntry(history) {
  return Object.values(history || {}).reduce((latest, entry) => {
    if (!entry) return latest;
    if (!latest) return entry;
    const currentPosted =
      typeof entry.postedAt === "number"
        ? entry.postedAt
        : Number(entry.postedAt) || 0;
    const latestPosted =
      typeof latest.postedAt === "number"
        ? latest.postedAt
        : Number(latest.postedAt) || 0;
    if (currentPosted > latestPosted) return entry;
    if (currentPosted === latestPosted && entry.date > latest.date) return entry;
    return latest;
  }, null);
}

function ensureStateFile() {
  if (fs.existsSync(STATE_PATH)) {
    return;
  }

  const directory = path.dirname(STATE_PATH);
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }

  const emptyState = { history: {}, lastPost: null };
  fs.writeFileSync(STATE_PATH, JSON.stringify(emptyState, null, 2));
}

function loadState() {
  ensureStateFile();
  const state = { history: {}, lastPost: null };

  try {
    const raw = JSON.parse(fs.readFileSync(STATE_PATH, "utf8"));
    if (raw && typeof raw === "object") {
      if (raw.history && typeof raw.history === "object") {
        for (const [date, entry] of Object.entries(raw.history)) {
          if (!entry || typeof entry !== "object") continue;
          state.history[date] = {
            date,
            messageId: entry.messageId || null,
            optionA: entry.optionA || null,
            optionB: entry.optionB || null,
            postedAt:
              typeof entry.postedAt === "number"
                ? entry.postedAt
                : Number(entry.postedAt) || Date.now(),
          };
        }
      } else {
        const timestamp =
          typeof raw.lastPostedAt === "number"
            ? raw.lastPostedAt
            : Number(raw.lastPostedAt) || null;
        if (timestamp) {
          const date = formatDateInIrish(new Date(timestamp));
          state.history[date] = {
            date,
            messageId: raw.lastMessageId || null,
            optionA: raw.optionA || null,
            optionB: raw.optionB || null,
            postedAt: timestamp,
          };
        }
      }
    }
  } catch (err) {
    console.error(
      "⚠️ Failed to read wouldYouRatherState.json, starting with empty state.",
      err
    );
    return state;
  }

  const latest = getLatestEntry(state.history);
  state.lastPost = latest
    ? {
        date: latest.date,
        messageId: latest.messageId || null,
        postedAt: latest.postedAt || null,
      }
    : null;

  return state;
}

function saveState(state) {
  ensureStateFile();
  const entries = Object.values(state.history || {}).filter(Boolean);
  entries.sort((a, b) => {
    const aTime =
      typeof a.postedAt === "number" ? a.postedAt : Number(a.postedAt) || 0;
    const bTime =
      typeof b.postedAt === "number" ? b.postedAt : Number(b.postedAt) || 0;
    return aTime - bTime;
  });

  const trimmed = entries.slice(-MAX_HISTORY_ENTRIES);
  const history = {};
  for (const entry of trimmed) {
    history[entry.date] = {
      date: entry.date,
      messageId: entry.messageId || null,
      optionA: entry.optionA || null,
      optionB: entry.optionB || null,
      postedAt:
        typeof entry.postedAt === "number"
          ? entry.postedAt
          : Number(entry.postedAt) || Date.now(),
    };
  }

  const latest = trimmed.length ? trimmed[trimmed.length - 1] : null;
  const payload = {
    history,
    lastPost: latest
      ? {
          date: latest.date,
          messageId: latest.messageId || null,
          postedAt:
            typeof latest.postedAt === "number"
              ? latest.postedAt
              : Number(latest.postedAt) || null,
        }
      : null,
  };

  fs.writeFileSync(STATE_PATH, JSON.stringify(payload, null, 2));
}

function ensureSchedule(client) {
  if (wouldYouRatherJob) return;

  wouldYouRatherJob = cron.schedule(
    "0 13 * * *",
    async () => {
      try {
        console.log(
          "⏰ Running scheduled 'Would You Rather' poll check (Europe/Dublin 13:00)."
        );
        await postDailyWouldYouRather(client);
      } catch (err) {
        console.error("❌ Failed scheduled 'Would You Rather' run:", err);
      }
    },
    { timezone: TIMEZONE }
  );

  console.log(
    "🗓️ Scheduled daily 'Would You Rather' poll check for 13:00 Europe/Dublin."
  );
}

async function deletePreviousPollIfNeeded(channel, state, today) {
  if (!state.lastPost || !state.lastPost.messageId) {
    return;
  }
  if (state.lastPost.date === today) {
    return;
  }

  try {
    const previousMessage = await channel.messages.fetch(state.lastPost.messageId);
    if (previousMessage) {
      await previousMessage.delete();
      console.log("🗑️ Deleted previous 'Would You Rather' poll message.");
    }
  } catch (err) {
    if (err?.code === 10008) {
      console.log(
        "ℹ️ Previous 'Would You Rather' poll message already removed (Discord code 10008)."
      );
    } else {
      console.log(
        "ℹ️ Previous 'Would You Rather' poll message not found or could not be deleted.",
        err
      );
    }
  }
}

async function generateWouldYouRather() {
  const prompt = `
You are a friendly naturist community game host.
Write ONE short, fun, respectful "Would you rather" question
for a naturist or nudist audience (topics may include nature, beaches, sports, parks, relaxation, etc).
Keep it wholesome and SFW.

Format like:
"Would you rather [Option A] or [Option B]?"
Do NOT include (A) or (B) markers or any greetings.
Keep it under 25 words.
`;
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();

  const clean = text.replace(/^["']|["']$/g, "");
  const parts = clean.replace(/^\s*would you rather\s*/i, "").split(/\s+or\s+/i);
  const optionA = parts[0]?.replace(/\?$/, "").trim() || "Option A";
  const optionB = parts[1]?.replace(/\?$/, "").trim() || "Option B";
  return { optionA, optionB };
}

async function postDailyWouldYouRather(client, { skipSchedule = false } = {}) {
  if (!skipSchedule) {
    ensureSchedule(client);
  }

  const state = loadState();
  const today = formatDateInIrish();

  if (state.history[today]) {
    console.log(
      `⏱️ 'Would You Rather' poll already recorded for ${today}; skipping new post.`
    );
    return false;
  }

  let channel;
  try {
    channel = await client.channels.fetch(WOULD_YOU_RATHER_CHANNEL_ID);
  } catch (err) {
    console.error("❌ Unable to fetch 'Would You Rather' channel:", err);
    return false;
  }

  if (!channel) {
    console.error("❌ 'Would You Rather' channel not found");
    return false;
  }

  await deletePreviousPollIfNeeded(channel, state, today);

  let options;
  try {
    options = await generateWouldYouRather();
  } catch (error) {
    console.error("❌ Error generating 'Would You Rather' poll options:", error);
    return false;
  }

  let message;
  try {
    message = await channel.send({
      poll: {
        question: { text: "Would You Rather" },
        answers: [{ text: options.optionA }, { text: options.optionB }],
        duration: 24,
        allowMultiselect: false,
      },
    });
  } catch (error) {
    console.error("❌ Error posting 'Would You Rather' poll:", error);
    return false;
  }

  const entry = {
    date: today,
    messageId: message.id,
    optionA: options.optionA,
    optionB: options.optionB,
    postedAt: Date.now(),
  };

  state.history[today] = entry;
  state.lastPost = {
    date: entry.date,
    messageId: entry.messageId,
    postedAt: entry.postedAt,
  };

  saveState(state);

  console.log(
    `✅ Posted new 'Would You Rather' poll for ${today}: ${options.optionA} vs ${options.optionB}.`
  );
  return true;
}

async function initializeDailyWouldYouRather(client) {
  ensureSchedule(client);

  const state = loadState();
  const today = formatDateInIrish();

  if (state.history[today]) {
    console.log(
      "📘 'Would You Rather' poll already posted for today; waiting for next scheduled run."
    );
  } else {
    console.log(
      "🕒 'Would You Rather' poll scheduled for 13:00 Europe/Dublin."
    );
  }
}

module.exports = { postDailyWouldYouRather, initializeDailyWouldYouRather };
