// handlers/dailyThisOrThatHandler.js
const fs = require("fs");
const path = require("path");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const THIS_OR_THAT_CHANNEL_ID = "1434963096283250819";
const STATE_PATH = path.join(__dirname, "../data/thisOrThatState.json");

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
  const channel = await client.channels.fetch(THIS_OR_THAT_CHANNEL_ID);
  if (!channel) return console.error("❌ Channel not found");

  let state = { lastMessageId: null, lastPostedAt: 0 };
  if (fs.existsSync(STATE_PATH)) state = JSON.parse(fs.readFileSync(STATE_PATH, "utf8"));

  const now = Date.now();
  const twentyFourHours = 24 * 60 * 60 * 1000;
  if (now - state.lastPostedAt < twentyFourHours && state.lastMessageId) {
    console.log("⏱️ Previous 'This or That' still active; skipping new post.");
    return;
  }

  if (state.lastMessageId) {
    try {
      const oldMsg = await channel.messages.fetch(state.lastMessageId);
      if (oldMsg) await oldMsg.delete();
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

  fs.writeFileSync(
    STATE_PATH,
    JSON.stringify({ lastMessageId: msg.id, lastPostedAt: now }, null, 2)
  );
  console.log(`✅ Posted new poll: This or That — ${optionA} vs ${optionB}`);

  setTimeout(() => postDailyThisOrThat(client), twentyFourHours);
}

module.exports = { postDailyThisOrThat };
