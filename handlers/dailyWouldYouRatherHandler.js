// handlers/dailyWouldYouRatherHandler.js
const fs = require("fs");
const path = require("path");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const WOULD_YOU_RATHER_CHANNEL_ID = "1434948784336535592";
const STATE_PATH = path.join(__dirname, "../data/wouldYouRatherState.json");
const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
const MIN_RETRY_DELAY = 5 * 60 * 1000;

let wouldYouRatherTimeout = null;

function scheduleNextWouldYouRather(client, delay = TWENTY_FOUR_HOURS) {
  if (wouldYouRatherTimeout) clearTimeout(wouldYouRatherTimeout);
  const nextDelay = Math.max(delay, MIN_RETRY_DELAY);
  wouldYouRatherTimeout = setTimeout(() => {
    postDailyWouldYouRather(client).catch((err) =>
      console.error("❌ Failed scheduled 'Would You Rather' run:", err)
    );
  }, nextDelay);
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

  // simple cleanup
  const clean = text.replace(/^["']|["']$/g, "");
  const parts = clean.replace(/^\s*would you rather\s*/i, "").split(/\s+or\s+/i);
  const optionA = parts[0]?.replace(/\?$/, "").trim() || "Option A";
  const optionB = parts[1]?.replace(/\?$/, "").trim() || "Option B";
  return { optionA, optionB };
}

async function postDailyWouldYouRather(client) {
  let nextDelay = TWENTY_FOUR_HOURS;

  try {
    let channel;
    try {
      channel = await client.channels.fetch(WOULD_YOU_RATHER_CHANNEL_ID);
    } catch (err) {
      console.error("❌ Unable to fetch 'Would You Rather' channel:", err);
      nextDelay = MIN_RETRY_DELAY;
      return false;
    }

    if (!channel) {
      console.error("❌ 'Would You Rather' channel not found");
      nextDelay = MIN_RETRY_DELAY;
      return false;
    }

    let state = { lastMessageId: null, lastPostedAt: 0 };
    if (fs.existsSync(STATE_PATH)) {
      try {
        state = JSON.parse(fs.readFileSync(STATE_PATH, "utf8"));
      } catch (err) {
        console.error("⚠️ Failed to parse wouldYouRatherState.json, resetting state.", err);
        state = { lastMessageId: null, lastPostedAt: 0 };
      }
    }

    const now = Date.now();
    const elapsed = now - (state.lastPostedAt || 0);
    const remaining = TWENTY_FOUR_HOURS - elapsed;

    let previousMessage = null;
    if (state.lastMessageId) {
      try {
        previousMessage = await channel.messages.fetch(state.lastMessageId);
      } catch (err) {
        previousMessage = null;
        if (elapsed < TWENTY_FOUR_HOURS) {
          console.log(
            "ℹ️ Previous 'Would You Rather' poll missing; posting a fresh one early."
          );
        }
      }
    }

    if (elapsed < TWENTY_FOUR_HOURS && previousMessage) {
      console.log("⏱️ Previous 'Would You Rather' still active; skipping new post.");
      nextDelay = Math.max(remaining, MIN_RETRY_DELAY);
      return false;
    }

    if (previousMessage) {
      try {
        await previousMessage.delete();
        console.log("🗑️ Deleted previous 'Would You Rather' poll.");
      } catch {
        console.log("ℹ️ Previous poll already deleted or missing.");
      }
    }

    console.log("🌞 Posting scheduled 'Would You Rather' poll...");
    const { optionA, optionB } = await generateWouldYouRather();
    const msg = await channel.send({
      poll: {
        question: { text: "Would You Rather" },
        answers: [{ text: optionA }, { text: optionB }],
        duration: 24,
        allowMultiselect: false,
      },
    });

    const postedAt = Date.now();
    fs.writeFileSync(
      STATE_PATH,
      JSON.stringify({ lastMessageId: msg.id, lastPostedAt: postedAt }, null, 2)
    );
    console.log(`✅ Posted new poll: Would you rather ${optionA} or ${optionB}?`);
    return true;
  } catch (error) {
    nextDelay = MIN_RETRY_DELAY;
    console.error("❌ Error posting 'Would You Rather' poll:", error);
    return false;
  } finally {
    scheduleNextWouldYouRather(client, nextDelay);
  }
}

module.exports = { postDailyWouldYouRather };
