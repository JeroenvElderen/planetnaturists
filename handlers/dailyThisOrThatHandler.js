// handlers/dailyThisOrThatHandler.js
const fs = require("fs");
const path = require("path");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const THIS_OR_THAT_CHANNEL_ID = "1434963096283250819";
const STATE_PATH = path.join(__dirname, "../data/thisOrThatState.json");
const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
const MIN_RETRY_DELAY = 5 * 60 * 1000;

let thisOrThatTimeout = null;

function scheduleNextThisOrThat(client, delay = TWENTY_FOUR_HOURS) {
  if (thisOrThatTimeout) clearTimeout(thisOrThatTimeout);
  const nextDelay = Math.max(delay, MIN_RETRY_DELAY);
  thisOrThatTimeout = setTimeout(() => {
    postDailyThisOrThat(client).catch((err) =>
      console.error("❌ Failed scheduled 'This or That' run:", err)
    );
  }, nextDelay);
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
  let nextDelay = TWENTY_FOUR_HOURS;

  try {
    let channel;
    try {
      channel = await client.channels.fetch(THIS_OR_THAT_CHANNEL_ID);
    } catch (err) {
      console.error("❌ Unable to fetch 'This or That' channel:", err);
      nextDelay = MIN_RETRY_DELAY;
      return false;
    }

    if (!channel) {
      console.error("❌ 'This or That' channel not found");
      nextDelay = MIN_RETRY_DELAY;
      return false;
    }

    let state = { lastMessageId: null, lastPostedAt: 0 };
    if (fs.existsSync(STATE_PATH)) {
      try {
        state = JSON.parse(fs.readFileSync(STATE_PATH, "utf8"));
      } catch (err) {
        console.error("⚠️ Failed to parse thisOrThatState.json, resetting state.", err);
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
            "ℹ️ Previous 'This or That' poll missing; posting a fresh one early."
          );
        }
      }
    }

    if (elapsed < TWENTY_FOUR_HOURS && previousMessage) {
      console.log("⏱️ Previous 'This or That' still active; skipping new post.");
      nextDelay = Math.max(remaining, MIN_RETRY_DELAY);
      return false;
    }

    if (previousMessage) {
      try {
        await previousMessage.delete();
        console.log("🗑️ Deleted previous 'This or That' poll.");
      } catch {
        console.log("ℹ️ Previous poll already deleted or missing.");
      }
    }

    console.log("🌞 Posting scheduled 'This or That' poll...");
    const { optionA, optionB } = await generateThisOrThat();
    const msg = await channel.send({
      poll: {
        question: { text: "This or That" },
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
    console.log(`✅ Posted new poll: This or That — ${optionA} vs ${optionB}`);
    return true;
  } catch (error) {
    nextDelay = MIN_RETRY_DELAY;
    console.error("❌ Error posting 'This or That' poll:", error);
    return false;
  } finally {
    scheduleNextThisOrThat(client, nextDelay);
  }
}

module.exports = { postDailyThisOrThat };
