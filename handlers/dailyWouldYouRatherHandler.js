// handlers/dailyWouldYouRatherHandler.js
const cron = require("node-cron");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { select, upsert, remove } = require("../utils/supabaseClient");

const WOULD_YOU_RATHER_CHANNEL_ID = "1434948784336535592";
const TIMEZONE = "Europe/Dublin";
const MAX_HISTORY_ENTRIES = 60;
const STATE_ROW_ID = "main";

let wouldYouRatherJob = null;
let stateCache = { history: {}, lastPost: null };
let stateLoaded = false;
let loadingPromise = null;

function formatDateInIrish(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function normalizeEntry(entry) {
  if (!entry) return null;
  const postedAt =
    typeof entry.postedAt === "number"
      ? entry.postedAt
      : Number(entry.postedAt) || Date.now();

  return {
    date: entry.date,
    messageId: entry.messageId || null,
    optionA: entry.optionA || null,
    optionB: entry.optionB || null,
    postedAt,
  };
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

function sortAndTrim(history) {
  const entries = Object.values(history || {}).filter(Boolean);
  entries.sort((a, b) => {
    const aTime = typeof a.postedAt === "number" ? a.postedAt : Number(a.postedAt) || 0;
    const bTime = typeof b.postedAt === "number" ? b.postedAt : Number(b.postedAt) || 0;
    if (aTime === bTime) {
      return (a.date || "").localeCompare(b.date || "");
    }
    return aTime - bTime;
  });
  return entries.slice(-MAX_HISTORY_ENTRIES);
}

async function loadStateFromSupabase() {
  const [historyRows, stateRow] = await Promise.all([
    select("would_you_rather_history", {
      columns: "date_key,message_id,option_a,option_b,posted_at",
    }),
    select("would_you_rather_state", {
      columns: "id,last_post_date,last_message_id,last_posted_at",
      filter: { id: `eq.${STATE_ROW_ID}` },
      single: true,
    }),
  ]);

  const history = {};
  for (const row of historyRows) {
    if (!row.date_key) continue;
    history[row.date_key] = normalizeEntry({
      date: row.date_key,
      messageId: row.message_id,
      optionA: row.option_a,
      optionB: row.option_b,
      postedAt: row.posted_at,
    });
  }

  const lastPost = stateRow?.last_post_date
    ? {
        date: stateRow.last_post_date,
        messageId: stateRow.last_message_id || null,
        postedAt:
          typeof stateRow.last_posted_at === "number"
            ? stateRow.last_posted_at
            : Number(stateRow.last_posted_at) || null,
      }
    : null;

  return { history, lastPost };
}

async function ensureStateLoaded() {
  if (stateLoaded) return stateCache;
  if (!loadingPromise) {
    loadingPromise = (async () => {
      try {
        return await loadStateFromSupabase();
      } catch (err) {
        console.error("⚠️ Failed to load 'Would You Rather' state from Supabase:", err);
        return { history: {}, lastPost: null };
      }
    })();
  }

  stateCache = await loadingPromise;
  stateLoaded = true;
  loadingPromise = null;
  return stateCache;
}

async function initializeWouldYouRatherState() {
  await ensureStateLoaded();
}

async function getState() {
  await ensureStateLoaded();
  return stateCache;
}

async function persistState(state) {
  const trimmedEntries = sortAndTrim(state.history);
  const normalizedHistory = {};
  for (const entry of trimmedEntries) {
    if (!entry?.date) continue;
    normalizedHistory[entry.date] = normalizeEntry(entry);
  }

  const historyPayload = trimmedEntries.map((entry) => ({
    date_key: entry.date,
    message_id: entry.messageId || null,
    option_a: entry.optionA || null,
    option_b: entry.optionB || null,
    posted_at: entry.postedAt || null,
  }));

  await remove("would_you_rather_history", { date_key: "not.is.null" });
  if (historyPayload.length) {
    await upsert("would_you_rather_history", historyPayload);
  }

  const latest = trimmedEntries.length ? trimmedEntries[trimmedEntries.length - 1] : null;
  await upsert("would_you_rather_state", {
    id: STATE_ROW_ID,
    last_post_date: latest?.date || null,
    last_message_id: latest?.messageId || null,
    last_posted_at: latest?.postedAt || null,
  });

  stateCache = {
    history: normalizedHistory,
    lastPost: latest
      ? {
          date: latest.date,
          messageId: latest.messageId || null,
          postedAt: latest.postedAt || null,
        }
      : null,
  };

  return stateCache;
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

  const state = await getState();
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

  const entry = normalizeEntry({
    date: today,
    messageId: message.id,
    optionA: options.optionA,
    optionB: options.optionB,
    postedAt: Date.now(),
  });

  state.history[today] = entry;
  state.lastPost = {
    date: entry.date,
    messageId: entry.messageId,
    postedAt: entry.postedAt,
  };

  await persistState(state);

  console.log(
    `✅ Posted new 'Would You Rather' poll for ${today}: ${options.optionA} vs ${options.optionB}.`
  );
  return true;
}

async function initializeDailyWouldYouRather(client) {
  await ensureStateLoaded();
  ensureSchedule(client);

  const state = await getState();
  const today = formatDateInIrish();

  if (state.history[today]) {
    console.log(
      "📘 'Would You Rather' poll already posted for today; waiting for next scheduled run."
    );
  } else {
    console.log("🕒 'Would You Rather' poll scheduled for 13:00 Europe/Dublin.");
  }
}

module.exports = {
  postDailyWouldYouRather,
  initializeDailyWouldYouRather,
  initializeWouldYouRatherState,
};
