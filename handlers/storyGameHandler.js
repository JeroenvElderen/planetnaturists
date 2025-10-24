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

async function updateStoryEmbed(channel) {
  const fullStory = storyData.story.join(" ");
  const embed = {
    title: "📜 The Naturist Story",
    description: `> ${fullStory}`,
    color: 0x2ecc71,
    footer: { text: "Add your words to continue the naturist tale 🌞" },
  };

  try {
    if (storyData.storyMessageId) {
      const existingMsg = await channel.messages
        .fetch(storyData.storyMessageId)
        .catch(() => null);

      if (existingMsg) {
        await existingMsg.edit({ embeds: [embed] });
        return;
      }
    }

    // Send new message if previous one not found
    const newMessage = await channel.send({ embeds: [embed] });
    storyData.storyMessageId = newMessage.id;
    saveStoryData(storyData);
  } catch (err) {
    console.error("❌ Error updating story embed:", err);
  }
}

module.exports = {
  // ✨ Handle each new story word
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

      // ✅ Passed all checks — add new words
      storyData.story.push(...words);
      if (storyData.story.length > MAX_HISTORY) {
        storyData.story = storyData.story.slice(-MAX_HISTORY);
      }

      storyData.lastUserId = message.author.id;

      // 🧹 Delete user's message to keep channel clean
      await message.delete().catch(() => {});

      // 🌿 Update or send embed
      await updateStoryEmbed(message.channel);

      // 💾 Save story data
      saveStoryData(storyData);

      console.log(`🌴 Story updated by ${message.author.username}: "${content}"`);
    } catch (err) {
      console.error("❌ Error updating story message:", err);
    } finally {
      // 🔓 Always release lock
      isProcessing = false;
    }
  },

  // 🪄 Restore story after restart
  async restoreStory(client) {
    try {
      const channel = await client.channels.fetch(STORY_CHANNEL_ID).catch(() => null);
      if (!channel) {
        console.warn("⚠️ Story channel not found during restore.");
        return;
      }

      if (!storyData.story || storyData.story.length === 0) {
        console.log("ℹ️ No existing story to restore.");
        return;
      }

      console.log("🌿 Restoring naturist story after restart...");
      await updateStoryEmbed(channel);
    } catch (err) {
      console.error("❌ Error restoring story:", err);
    }
  },

  // 🔄 Reset story manually
  async resetStory(message) {
    if (!message.member.permissions.has("ManageGuild")) {
      return message.reply("🚫 You don't have permission to reset the story.");
    }

    storyData = { story: [], lastUserId: null, storyMessageId: null };
    saveStoryData(storyData);

    await message.channel.send("🧹 The naturist story has been reset! Start fresh 🌞");
  },
};
