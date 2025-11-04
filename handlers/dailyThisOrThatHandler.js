const { GoogleGenerativeAI } = require("@google/generative-ai");

const THIS_OR_THAT_CHANNEL_ID = "1434963096283250819";

module.exports = {
  async postDailyThisOrThat(client) {
    try {
      const channel = await client.channels.fetch(THIS_OR_THAT_CHANNEL_ID);
      if (!channel) return console.error("❌ Channel not found");

      console.log("🧠 Checking for existing active 'This or That' poll…");

      // 🔹 1. Check for an active poll (force refresh + fallback timestamp check)
      const recentMessages = await channel.messages.fetch({ limit: 20, force: true });
      const now = Date.now();
      const activePoll = recentMessages.find((msg) => {
        if (!msg.poll) return false;

        const createdAt = msg.createdTimestamp;
        const hoursSince = (now - createdAt) / (1000 * 60 * 60);
        const bufferHours = 0.1; // ~6 minutes buffer

        const isExpired = msg.poll.expired || hoursSince > (msg.poll.duration + bufferHours);
        return !isExpired;
      });

      if (activePoll) {
        console.log("⏸️ Active poll found — skipping new post.");
        return;
      }

      console.log("🧠 Generating today's naturist 'This or That' question (Gemini)…");

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

      // 🔹 Generate using Gemini
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const result = await model.generateContent(prompt);
      const text = result.response.text().trim();

      // 🧹 Clean intro
      let cleanText = text.replace(/^hello.*?(this or that)/i, "$1").trim();

      const lower = cleanText.toLowerCase();
      const startIndex = lower.indexOf("this or that");
      let rest = cleanText;
      if (startIndex !== -1)
        rest = cleanText.slice(startIndex + "this or that".length).trim();

      const parts = rest.split(/\s+or\s+/i);
      let optionA =
        parts[0]?.replace(/^[:\-]?\s*/, "").replace(/\?+$/, "").trim() ||
        "Option A";
      let optionB = parts[1]?.replace(/\?+$/, "").trim() || "Option B";

      optionA = optionA.replace(/^this or that[:\-]?\s*/i, "").trim();
      optionB = optionB.replace(/^this or that[:\-]?\s*/i, "").trim();

      // ✅ Post poll
      await channel.send({
        poll: {
          question: { text: "This or That" },
          answers: [
            { text: optionA },
            { text: optionB },
          ],
          duration: 24, // hours
          allowMultiselect: false,
        },
      });

      console.log(`🌞 Posted poll: This or That — ${optionA} vs ${optionB}`);
    } catch (err) {
      console.error("❌ Error posting daily 'This or That' poll:", err);
    }
  },
};
