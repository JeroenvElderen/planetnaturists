// handlers/dailyThisOrThatHandler.js
const fs = require("fs");
const path = require("path");
const cron = require("node-cron");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const THIS_OR_THAT_CHANNEL_ID = "1434963096283250819";
const STATE_PATH = path.join(__dirname, "../data/thisOrThatState.json");
const TIMEZONE = "Europe/Dublin";
const MAX_HISTORY_ENTRIES = 60;

let thisOrThatJob = null;

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
    if (currentPosted === latestPosted && entry.date > latest.date)
      return entry;
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
      "⚠️ Failed to read thisOrThatState.json, starting with empty state.",
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
    const previousMessage = await channel.messages.fetch(
      state.lastPost.messageId
    );
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
You are a friendly naturist community game host.
Write ONE short, fun, respectful "This or That" question
for a naturist or nudist audience. It can involve nature, beaches, sports,
relaxation, parks, or social settings — but must be wholesome and SFW.

Format like:
"This or that: [Option A] or [Option B]"
Do NOT include greetings or intros.
Keep it under 25 words.
`;
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();

  const clean = text.replace(/^["']|["']$/g, "");
  const parts = clean.replace(/^this or that[:\-]?\s*/i, "").split(/\s+or\s+/i);
  const optionA = parts[0]?.replace(/\?$/, "").trim() || "Option A";
  const optionB = parts[1]?.replace(/\?$/, "").trim() || "Option B";
  return { optionA, optionB };
}

async function postDailyThisOrThat(client) {
  ensureSchedule(client);

  const state = loadState();
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
    console.error("❌ Error generating 'This or That' poll options:", error);
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
    `✅ Posted new 'This or That' poll for ${today}: ${options.optionA} vs ${options.optionB}.`
  );
  return true;
}

module.exports = { postDailyThisOrThat };
