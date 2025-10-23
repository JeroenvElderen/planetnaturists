const fs = require("fs");
const path = require("path");
const {
  STORY_CHANNEL_ID,
  MIN_WORDS,
  MAX_WORDS,
  MAX_HISTORY,
} = require("../config/storyGame");

const STORY_FILE = path.join(__dirname, "../data/storyData.json");

// 🧠 Load story data from file or create a new one
function loadStoryData() {
  try {
    if (fs.existsSync(STORY_FILE)) {
      return JSON.parse(fs.readFileSync(STORY_FILE, "utf8"));
    }
  } catch (err) {
    console.error("⚠️ Error loading story data:", err);
  }
  return { story: [], lastUserId: null, storyMessageId: null };
}

// 💾 Save story data to file
function saveStoryData(data) {
  try {
    fs.writeFileSync(STORY_FILE, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.error("⚠️ Error saving story data:", err);
  }
}

let storyData = loadStoryData();
let isProcessing = false;

module.exports = {
  async handleStoryMessage(message) {
    if (message.channel.id !== STORY_CHANNEL_ID) return;
    if (message.author.bot) return;

    // 🔒 Prevent simultaneous updates
    if (isProcessing) {
      await message.delete().catch(() => {});
      return;
    }
    isProcessing = true;

    try {
      const content = message.content.trim().toLowerCase(); // force lowercase
      const words = content.split(/\s+/);

      // Rule 1️⃣: Only 1–2 words allowed
      if (words.length < MIN_WORDS || words.length > MAX_WORDS) {
        await message.delete().catch(() => {});
        const warn = await message.channel.send(
          `⚠️ <@${message.author.id}>, you can only post **1–2 words** per message! 🌿`
        );
        setTimeout(() => warn.delete().catch(() => {}), 4000);
        return;
      }

      // Rule 2️⃣: Same user cannot post twice in a row
      if (message.author.id === storyData.lastUserId) {
        await message.delete().catch(() => {});
        const warn = await message.channel.send(
          `🚫 <@${message.author.id}>, wait for another naturist before posting again! ☀️`
        );
        setTimeout(() => warn.delete().catch(() => {}), 4000);
        return;
      }

      // ✅ Passed all checks — add the new words
      storyData.story.push(...words);
      if (storyData.story.length > MAX_HISTORY) {
        storyData.story = storyData.story.slice(-MAX_HISTORY);
      }

      storyData.lastUserId = message.author.id;

      // 🧹 Delete the user’s message to keep the channel clean
      await message.delete().catch(() => {});

      const fullStory = storyData.story.join(" ");
      const embed = {
        title: "📜 The Naturist Story",
        description: `> ${fullStory}`,
        color: 0x2ecc71,
        footer: { text: "Add your words to continue the naturist tale 🌞" },
      };

      // 🪶 Remove old embed if exists
      if (storyData.storyMessageId) {
        const oldMsg = await message.channel.messages
          .fetch(storyData.storyMessageId)
          .catch(() => null);
        if (oldMsg) await oldMsg.delete().catch(() => {});
      }

      // 🆕 Send new story embed
      const newMessage = await message.channel.send({ embeds: [embed] });
      storyData.storyMessageId = newMessage.id;

      // 💾 Save story after every valid update
      saveStoryData(storyData);

      console.log(`🌴 Story updated by ${message.author.username}: "${content}"`);
    } catch (err) {
      console.error("❌ Error updating story message:", err);
    } finally {
      // 🔓 Always release the lock
      isProcessing = false;
    }
  },

  // 🔄 Reset command handler
  async resetStory(message) {
    if (!message.member.permissions.has("ManageGuild")) {
      return message.reply("🚫 You don't have permission to reset the story.");
    }

    storyData = { story: [], lastUserId: null, storyMessageId: null };
    saveStoryData(storyData);

    await message.channel.send("🧹 The naturist story has been reset! Start fresh 🌞");
  },
};
