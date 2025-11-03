const { GoogleGenerativeAI } = require("@google/generative-ai");

const WOULD_YOU_RATHER_CHANNEL_ID = "1434948784336535592";

module.exports = {
  async postDailyWouldYouRather(client) {
    try {
      const channel = await client.channels.fetch(WOULD_YOU_RATHER_CHANNEL_ID);
      if (!channel) return console.error("❌ Channel not found");

      console.log("🧠 Generating today's naturist 'Would You Rather' question (Gemini)…");

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

      // 🧹 Clean text, remove any prefix like "Hello naturists"
      let cleanText = text.replace(/^hello.*?(would you rather)/i, "$1").trim();

      // 🧩 Extract Option A / Option B by splitting at " or "
      const lower = cleanText.toLowerCase();
      const startIndex = lower.indexOf("would you rather");
      let rest = cleanText;
      if (startIndex !== -1) rest = cleanText.slice(startIndex + "would you rather".length).trim();

      const parts = rest.split(/\s+or\s+/i);
      let optionA = parts[0]?.replace(/\?+$/, "").trim() || "Option A";
      let optionB = parts[1]?.replace(/\?+$/, "").trim() || "Option B";

      // 🧹 Remove leftover “would you rather” or “or” text
      optionA = optionA.replace(/^would you rather\s*/i, "").trim();
      optionB = optionB.replace(/^would you rather\s*/i, "").trim();

      // ✅ Post Discord poll (clean title)
      await channel.send({
        poll: {
          question: { text: "Would you rather" },
          answers: [
            { text: optionA },
            { text: optionB },
          ],
          duration: 24, // hours
          allowMultiselect: false,
        },
      });

      console.log(`🌞 Posted poll: Would you rather ${optionA} or ${optionB}?`);
    } catch (err) {
      console.error("❌ Error posting daily 'Would You Rather' poll (Gemini):", err);
    }
  },
};
