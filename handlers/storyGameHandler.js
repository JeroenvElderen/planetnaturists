const {
  STORY_CHANNEL_ID,
  MIN_WORDS,
  MAX_WORDS,
  MAX_HISTORY,
} = require("../config/storyGame");

const { readStory, writeStory } = require("../utils/storyStorage");

let storyData = { story: [], lastUserId: null, storyMessageId: null };

async function initializeStoryGame() {
  try {
    storyData = await readStory();
  } catch (err) {
    console.error("⚠️ Failed to load story from Supabase:", err);
    storyData = { story: [], lastUserId: null, storyMessageId: null };
  }
}

let isProcessing = false;

module.exports = {
  async handleStoryMessage(message) {
    if (message.channel.id !== STORY_CHANNEL_ID) return;
    if (message.author.bot) return;

    if (isProcessing) {
      await message.delete().catch(() => {});
      return;
    }
    isProcessing = true;

    try {
      const content = message.content.trim().toLowerCase();
      const words = content.split(/\s+/);

      // 1️⃣ Only 1–2 words allowed
      if (words.length < MIN_WORDS || words.length > MAX_WORDS) {
        await message.delete().catch(() => {});
        const warn = await message.channel.send(
          `⚠️ <@${message.author.id}>, you can only post **1–2 words** per message! 🌿`
        );
        setTimeout(() => warn.delete().catch(() => {}), 4000);
        return;
      }

      // 2️⃣ No double posting
      if (message.author.id === storyData.lastUserId) {
        await message.delete().catch(() => {});
        const warn = await message.channel.send(
          `🚫 <@${message.author.id}>, wait for another naturist before posting again! ☀️`
        );
        setTimeout(() => warn.delete().catch(() => {}), 4000);
        return;
      }

      // ✅ Add to story
      storyData.story.push(...words);
      if (storyData.story.length > MAX_HISTORY) {
        storyData.story = storyData.story.slice(-MAX_HISTORY);
      }

      storyData.lastUserId = message.author.id;
      await message.delete().catch(() => {});

      const fullStory = storyData.story.join(" ");
      const embed = {
        title: "📜 The Naturist Story",
        description: `> ${fullStory}`,
        color: 0x2ecc71,
        footer: { text: "Add your words to continue the naturist tale 🌞" },
      };

      // 🪶 Find or reuse the single embed message
      let storyMessage = null;
      if (storyData.storyMessageId) {
        try {
          storyMessage = await message.channel.messages.fetch(storyData.storyMessageId);
        } catch {
          storyMessage = null;
        }
      }

      // If no existing embed found (like after restart)
      if (!storyMessage) {
        // Try to find an existing embed in recent messages
        const recent = await message.channel.messages.fetch({ limit: 20 });
        storyMessage = recent.find(m => m.author.bot && m.embeds.length > 0) || null;
        if (storyMessage) {
          storyData.storyMessageId = storyMessage.id;
        }
      }

      // 🆙 Edit existing embed if possible, otherwise send a new one
      if (storyMessage) {
        await storyMessage.edit({ embeds: [embed] }).catch(async () => {
          // fallback if can't edit
          storyMessage = await message.channel.send({ embeds: [embed] });
          storyData.storyMessageId = storyMessage.id;
        });
      } else {
        const newMsg = await message.channel.send({ embeds: [embed] });
        storyData.storyMessageId = newMsg.id;
      }

      // 💾 Save story to Supabase
      await writeStory(storyData);
      console.log(`🌴 Story updated by ${message.author.username}: "${content}"`);
    } catch (err) {
      console.error("❌ Error updating story message:", err);
    } finally {
      isProcessing = false;
    }
  },

  // 🔄 Reset command
  async resetStory(message) {
    if (!message.member.permissions.has("ManageGuild")) {
      return message.reply("🚫 You don't have permission to reset the story.");
    }

    storyData = { story: [], lastUserId: null, storyMessageId: null };
    await writeStory(storyData);
    await message.channel.send("🧹 The naturist story has been reset! Start fresh 🌞");
  },
  initializeStoryGame,
};
