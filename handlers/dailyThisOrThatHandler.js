// handlers/dailyThisOrThatHandler.js
const cron = require("node-cron");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { select, upsert, remove } = require("../utils/supabaseClient");

const THIS_OR_THAT_CHANNEL_ID = "1434963096283250819";
const TIMEZONE = "Europe/Dublin";
const MAX_HISTORY_ENTRIES = 60;
const STATE_ROW_ID = "main";

let thisOrThatJob = null;
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
    select("this_or_that_history", {
      columns: "date_key,message_id,option_a,option_b,posted_at",
    }),
    select("this_or_that_state", {
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
        console.error("⚠️ Failed to load 'This or That' state from Supabase:", err);
        return { history: {}, lastPost: null };
      }
    })();
  }

  stateCache = await loadingPromise;
  stateLoaded = true;
  loadingPromise = null;
  return stateCache;
}

async function initializeThisOrThatState() {
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

  await remove("this_or_that_history", { date_key: "not.is.null" });
  if (historyPayload.length) {
    await upsert("this_or_that_history", historyPayload);
  }

  const latest = trimmedEntries.length ? trimmedEntries[trimmedEntries.length - 1] : null;
  await upsert("this_or_that_state", {
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
  if (thisOrThatJob) return;

  thisOrThatJob = cron.schedule(
    "0 13 * * *",
    async () => {
      try {
        console.log(
          "⏰ Running scheduled 'This or That' poll check (Europe/Dublin 13:00)."
        );
        await postDailyThisOrThat(client);
      } catch (err) {
        console.error("❌ Failed scheduled 'This or That' run:", err);
      }
    },
    { timezone: TIMEZONE }
  );

  console.log(
    "🗓️ Scheduled daily 'This or That' poll check for 13:00 Europe/Dublin."
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
      console.log("🗑️ Deleted previous 'This or That' poll message.");
    }
  } catch (err) {
    if (err?.code === 10008) {
      console.log(
        "ℹ️ Previous 'This or That' poll message already removed (Discord code 10008)."
      );
    } else {
      console.log(
        "ℹ️ Previous 'This or That' poll message not found or could not be deleted.",
        err
      );
    }
  }
}

async function generateThisOrThat() {
  const prompt = `
You are a naturist community host.
Write ONE family-friendly "This or That" prompt focused on naturist themes (nature, relaxation, activities, travel, etc.).
Format it exactly like "This or That: [Option A] vs [Option B]" without extra commentary.
Keep it under 20 words.
`;
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();

  const clean = text.replace(/^["']|["']$/g, "");
  const withoutPrefix = clean.replace(/^\s*this or that[:\-]?\s*/i, "");
  const parts = withoutPrefix.split(/\s+vs\s+/i);
  const optionA = parts[0]?.replace(/\?$/, "").trim() || "Option A";
  const optionB = parts[1]?.replace(/\?$/, "").trim() || "Option B";
  return { optionA, optionB };
}

async function postDailyThisOrThat(client, { skipSchedule = false } = {}) {
  if (!skipSchedule) {
    ensureSchedule(client);
  }

  const state = await getState();
  const today = formatDateInIrish();

  if (state.history[today]) {
    console.log(
      `⏱️ 'This or That' poll already recorded for ${today}; skipping new post.`
    );
    return false;
  }

  let channel;
  try {
    channel = await client.channels.fetch(THIS_OR_THAT_CHANNEL_ID);
  } catch (err) {
    console.error("❌ Unable to fetch 'This or That' channel:", err);
    return false;
  }

  if (!channel) {
    console.error("❌ 'This or That' channel not found");
    return false;
  }

  await deletePreviousPollIfNeeded(channel, state, today);

  let options;
  try {
    options = await generateThisOrThat();
  } catch (error) {
    console.error("❌ Error generating 'This or That' options:", error);
    return false;
  }

  let message;
  try {
    message = await channel.send({
      poll: {
        question: { text: "This or That" },
        answers: [{ text: options.optionA }, { text: options.optionB }],
        duration: 24,
        allowMultiselect: false,
      },
    });
  } catch (error) {
    console.error("❌ Error posting 'This or That' poll:", error);
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
    `✅ Posted new 'This or That' poll for ${today}: ${options.optionA} vs ${options.optionB}.`
  );
  return true;
}

async function initializeDailyThisOrThat(client) {
  await ensureStateLoaded();
  ensureSchedule(client);

  const state = await getState();
  const today = formatDateInIrish();

  if (state.history[today]) {
    console.log(
      "📘 'This or That' poll already posted for today; waiting for next scheduled run."
    );
  } else {
    console.log("🕒 'This or That' poll scheduled for 13:00 Europe/Dublin.");
  }
}

module.exports = {
  postDailyThisOrThat,
  initializeDailyThisOrThat,
  initializeThisOrThatState,
};
