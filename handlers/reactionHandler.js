// handlers/reactionHandler.js
const {
  getWelcomeMessages,
  getChannelNames,
  getEmojiRoleMap,
  normalizeCountryKey,
} = require("../services/communityDataCache");

const MESSAGE_ID = "1429841307538423838";
const CHANNEL_ID = "1429840375387914311";

// 🏴 Decode regional flags
function normalizeEmoji(reaction) {
  if (!reaction || !reaction.emoji) return null;
  const raw = reaction.emoji.toString();
  const id = reaction.emoji.identifier || "";
  const combined = `${raw} ${id}`.toLowerCase();
  if (combined.includes("gbeng")) return ":england:";
  if (combined.includes("gbsct")) return ":scotland:";
  if (combined.includes("gbwls")) return ":wales:";
  return reaction.emoji.id ? reaction.emoji.id : reaction.emoji.name;
}

// 🎯 Reaction added → assign role + create category/channels
async function handleReactionAdd(reaction, user) {
  if (user.bot) return;
  try {
    if (reaction.partial) await reaction.fetch();
    if (reaction.message.partial) await reaction.message.fetch();

    if (reaction.message.id !== MESSAGE_ID || reaction.message.channel.id !== CHANNEL_ID)
      return;

    const emojiRoleMap = getEmojiRoleMap();
    const emoji = normalizeEmoji(reaction);
    const roleId = emojiRoleMap[emoji];
    if (!roleId) return;

    const guild = reaction.message.guild;
    const member = await guild.members.fetch(user.id);
    const role = guild.roles.cache.get(roleId);
    if (!role) return;

    await member.roles.add(role);
    console.log(`✅ Added role "${role.name}" to ${user.tag}`);

    // Prevent double flag
    const hasFlagAlready = /[\u{1F1E6}-\u{1F1FF}]/u.test(role.name);
    const categoryName = hasFlagAlready ? role.name : `${reaction.emoji.name} ${role.name}`;

    let category = guild.channels.cache.find(
      (c) => c.type === 4 && c.name.toLowerCase() === categoryName.toLowerCase()
    );

    if (!category) {
      console.log(`🆕 Creating category & channels for ${role.name}`);
      category = await guild.channels.create({
        name: categoryName,
        type: 4,
        permissionOverwrites: [
          { id: guild.roles.everyone.id, deny: ["ViewChannel"] },
          { id: role.id, allow: ["ViewChannel", "SendMessages", "Connect", "Speak"] },
        ],
      });

      const channelNames = getChannelNames();
      const cleanRole = role.name.replace(/[^\p{L}\s]/gu, "").trim();
      const localized = channelNames[cleanRole] || channelNames.default;

      const channels = [
        localized.chat,
        localized.locations,
        localized.offtopic,
        localized.experiences,
      ];

      for (const chName of channels) {
        const channel = await guild.channels.create({
          name: chName,
          type: 0,
          parent: category.id,
          permissionOverwrites: [
            { id: guild.roles.everyone.id, deny: ["ViewChannel"] },
            { id: role.id, allow: ["ViewChannel", "SendMessages", "ReadMessageHistory"] },
          ],
        });

        if (chName === localized.chat) {
          const welcomeMessages = getWelcomeMessages();
          const localeKey = normalizeCountryKey(cleanRole);
          const welcome = welcomeMessages[localeKey] || welcomeMessages.default;
          await channel.send({
            embeds: [
              {
                title: "🌞 Welcome!",
                description: welcome.text,
                color: 0x2ecc71,
              },
            ],
          });
        }
      }

      console.log(`✅ Created ${channels.length} channels for ${role.name}`);
    }
  } catch (err) {
    console.error("❌ Error in handleReactionAdd:", err);
  }
}

// 🎯 Reaction removed → remove role & maybe delete channels
async function handleReactionRemove(reaction, user) {
  if (user.bot) return;
  try {
    if (reaction.partial) await reaction.fetch();
    if (reaction.message.partial) await reaction.message.fetch();

    if (reaction.message.id !== MESSAGE_ID || reaction.message.channel.id !== CHANNEL_ID)
      return;

    const emojiRoleMap = getEmojiRoleMap();
    const emoji = normalizeEmoji(reaction);
    const roleId = emojiRoleMap[emoji];
    if (!roleId) return;

    const guild = reaction.message.guild;
    const member = await guild.members.fetch(user.id);
    const role = guild.roles.cache.get(roleId);
    if (!role) return;

    await member.roles.remove(role);
    console.log(`❌ Removed role "${role.name}" from ${user.tag}`);

    // 🧹 Check if that reaction is now completely gone
    const reactionObj = reaction.message.reactions.cache.get(reaction.emoji.name);
    const count = reactionObj ? reactionObj.count : 0;

    if (count <= 1) {
      // Last user removed the flag → delete category
      const hasFlagAlready = /[\u{1F1E6}-\u{1F1FF}]/u.test(role.name);
      const categoryName = hasFlagAlready ? role.name : `${reaction.emoji.name} ${role.name}`;
      const category = guild.channels.cache.find(
        (c) => c.type === 4 && c.name.toLowerCase() === categoryName.toLowerCase()
      );

      if (category) {
        console.log(`🗑️ Deleting category "${category.name}" and its channels...`);
        for (const ch of category.children.cache.values()) {
          await ch.delete().catch(() => null);
        }
        await category.delete().catch(() => null);
        console.log(`✅ Deleted all channels for ${role.name}`);
      }
    }
  } catch (err) {
    console.error("❌ Error in handleReactionRemove:", err);
  }
}

module.exports = { handleReactionAdd, handleReactionRemove };
