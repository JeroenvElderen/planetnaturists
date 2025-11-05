// handlers/dailyWouldYouRatherHandler.js
const fs = require("fs");
const path = require("path");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const WOULD_YOU_RATHER_CHANNEL_ID = "1434948784336535592";
const STATE_PATH = path.join(__dirname, "../data/wouldYouRatherState.json");

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
  const channel = await client.channels.fetch(WOULD_YOU_RATHER_CHANNEL_ID);
  if (!channel) return console.error("❌ Channel not found");

  // load last state
  let state = { lastMessageId: null, lastPostedAt: 0 };
  if (fs.existsSync(STATE_PATH)) state = JSON.parse(fs.readFileSync(STATE_PATH, "utf8"));

  const now = Date.now();
  const twentyFourHours = 24 * 60 * 60 * 1000;
  if (now - state.lastPostedAt < twentyFourHours && state.lastMessageId) {
    console.log("⏱️ Previous 'Would You Rather' still active; skipping new post.");
    return;
  }

  // try deleting old poll if exists
  if (state.lastMessageId) {
    try {
      const oldMsg = await channel.messages.fetch(state.lastMessageId);
      if (oldMsg) await oldMsg.delete();
      console.log("🗑️ Deleted previous 'Would You Rather' poll.");
    } catch {
      console.log("ℹ️ Previous poll already deleted or missing.");
    }
  }

  // generate and post new poll
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

  // save state
  fs.writeFileSync(
    STATE_PATH,
    JSON.stringify({ lastMessageId: msg.id, lastPostedAt: now }, null, 2)
  );
  console.log(`✅ Posted new poll: Would you rather ${optionA} or ${optionB}?`);

  // schedule deletion & re-post after 24 h
  setTimeout(() => postDailyWouldYouRather(client), twentyFourHours);
}

module.exports = { postDailyWouldYouRather };
