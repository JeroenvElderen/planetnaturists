// index.js
const fs = require('fs');
const express = require('express');
const { Client, GatewayIntentBits, Partials, REST, Routes } = require('discord.js');
require('dotenv').config();

const { countries } = require('./countries');
const createCountryRoles = require('./commands/createCountryRoles');

// 🎟️ Ticket configuration
const TICKET_CONFIG = {
  requestVerification: {
    parentChannelId: '1427675870394449930', // #request-verification
    targetCategoryId: '1427685018746097805', // Verification Tickets
  },
  support: {
    parentChannelId: '1427650123604820038', // #support
    targetCategoryId: '1429876070894534826', // Support Tickets
  },
  closedCategoryId: '1428718337239678996', // Closed Tickets
};

// 🌐 Keep Render service alive (for free hosting)
const app = express();
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('✅ PlanetNaturists bot is alive! 🌍'));
app.listen(PORT, () => console.log(`🌐 Express keep-alive running on port ${PORT}`));

// 🧠 Load emoji → role ID map (auto-updated by /create-country-roles)
let emojiRoleMap = {};
if (fs.existsSync('./emojiRoleMap.json')) {
  emojiRoleMap = JSON.parse(fs.readFileSync('./emojiRoleMap.json'));
  console.log(`📄 Loaded emojiRoleMap.json (${Object.keys(emojiRoleMap).length} entries)`);
} else {
  console.log('⚠️ No emojiRoleMap.json found — run /create-country-roles to generate it.');
}

// ✨ Initialize bot
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

// ✅ Log when bot is ready
client.once('clientReady', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

// 🧾 Reaction message and channel IDs
const MESSAGE_ID = '1429841307538423838';
const CHANNEL_ID = '1429840375387914311';

// ✨ Register slash command for your guild
const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
(async () => {
  try {
    console.log('🔁 Registering guild slash commands...');
    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, '1408151481009311845'), // your guild ID
      { body: [createCountryRoles.data.toJSON()] }
    );
    console.log('✅ Slash command registered for guild!');
  } catch (err) {
    console.error('❌ Error registering slash commands:', err);
  }
})();

// 🎯 Reaction added → assign role
client.on('messageReactionAdd', async (reaction, user) => {
  if (user.bot) return;
  try {
    if (reaction.partial) await reaction.fetch();
    if (reaction.message.partial) await reaction.message.fetch();
    if (reaction.message.id !== MESSAGE_ID || reaction.message.channel.id !== CHANNEL_ID) return;

    const emoji = reaction.emoji.id ? reaction.emoji.id : reaction.emoji.name;
    const roleId = emojiRoleMap[emoji];
    if (!roleId) return console.warn(`⚠️ No mapping found for emoji ${emoji}`);

    const guild = reaction.message.guild;
    const member = await guild.members.fetch(user.id);
    const role = guild.roles.cache.get(roleId);

    if (!role) return console.warn(`⚠️ Role not found for emoji: ${emoji}`);
    await member.roles.add(role);
    console.log(`✅ Added role "${role.name}" to ${user.tag}`);
  } catch (err) {
    console.error('❌ Error adding role:', err);
  }
});

// 🎯 Reaction removed → remove role
client.on('messageReactionRemove', async (reaction, user) => {
  if (user.bot) return;
  try {
    if (reaction.partial) await reaction.fetch();
    if (reaction.message.partial) await reaction.message.fetch();
    if (reaction.message.id !== MESSAGE_ID || reaction.message.channel.id !== CHANNEL_ID) return;

    const emoji = reaction.emoji.id ? reaction.emoji.id : reaction.emoji.name;
    const roleId = emojiRoleMap[emoji];
    if (!roleId) return console.warn(`⚠️ No mapping found for emoji ${emoji}`);

    const guild = reaction.message.guild;
    const member = await guild.members.fetch(user.id);
    const role = guild.roles.cache.get(roleId);

    if (!role) return console.warn(`⚠️ Role not found for emoji: ${emoji}`);
    await member.roles.remove(role);
    console.log(`❌ Removed role "${role.name}" from ${user.tag}`);
  } catch (err) {
    console.error('❌ Error removing role:', err);
  }
});

// ⚡ Slash command handler
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;
  if (interaction.commandName === 'create-country-roles') {
    await createCountryRoles.execute(interaction);
    // Reload updated emojiRoleMap
    if (fs.existsSync('./emojiRoleMap.json')) {
      emojiRoleMap = JSON.parse(fs.readFileSync('./emojiRoleMap.json'));
      console.log(`🔁 Reloaded emojiRoleMap.json (${Object.keys(emojiRoleMap).length} entries)`);
    }
  }
});

// 🆕 Detect new ticket channel creation
client.on('channelCreate', async (channel) => {
  try {
    if (!channel.guild || channel.type !== 0) return;
    console.log(`🧩 New channel created: ${channel.name} | parent=${channel.parentId}`);

    // Wait longer — Ticket Tool may take a few seconds to finish setup
    await new Promise(res => setTimeout(res, 7000));

    // Fetch last 20 messages for analysis
    const messages = await channel.messages.fetch({ limit: 20 }).catch(() => null);
    let type = 'support';

    if (messages && messages.size > 0) {
      const joinedText = Array.from(messages.values())
        .map(m => (m.content + ' ' + m.author.username).toLowerCase())
        .join(' ');

      if (joinedText.includes('verification') || joinedText.includes('verify')) {
        type = 'verification';
      }
    }

    console.log(`📩 Detected new ${type} ticket: ${channel.name}`);
    await handleNewTicket(channel, type);

  } catch (err) {
    console.error('❌ Error handling new ticket:', err);
  }
});

// 🧩 Handle ticket rename + move
async function handleNewTicket(channel, type) {
  try {
    const guild = channel.guild;
    console.log(`⚙️ Handling ${type} ticket ${channel.name}`);

    // Wait again to ensure Ticket Tool message & mention are loaded
    await new Promise(res => setTimeout(res, 3000));

    const messages = await channel.messages.fetch({ limit: 20 }).catch(() => null);
    let username = 'unknown-user';

    if (messages && messages.size > 0) {
      // ✅ 1. Try to find the Ticket Tool message that mentions the user
      const ticketToolMsg = [...messages.values()].find(
        m => m.author.bot && m.content.includes('<@')
      );

      if (ticketToolMsg) {
        const mentionMatch = ticketToolMsg.content.match(/<@!?(\d+)>/);
        if (mentionMatch) {
          const userId = mentionMatch[1];
          const member = await guild.members.fetch(userId).catch(() => null);
          if (member) {
            username = member.user.username.toLowerCase();
            console.log(`👤 Ticket opener found via mention: ${username}`);
          }
        }
      }

      // ✅ 2. If not found, fallback to first human message
      if (username === 'unknown-user') {
        const firstUserMsg = [...messages.values()].reverse().find(m => !m.author.bot);
        if (firstUserMsg) {
          username = firstUserMsg.author.username.toLowerCase();
          console.log(`👤 Fallback to first human message: ${username}`);
        }
      }
    }

    // ✅ If still not found, name it by default ticket number (e.g., ticket-0016)
    if (username === 'unknown-user') {
      username = channel.name.replace('ticket-', '');
    }

    // Rename channel
    await channel.setName(username);
    console.log(`✏️ Renamed ${type} ticket to ${username}`);

    // Move to correct category
    const categoryId =
      type === 'verification'
        ? TICKET_CONFIG.requestVerification.targetCategoryId
        : TICKET_CONFIG.support.targetCategoryId;

    await channel.setParent(categoryId, { lockPermissions: false });
    console.log(`📂 Moved ${username}'s ${type} ticket to ${guild.channels.cache.get(categoryId)?.name}`);
  } catch (err) {
    console.error('❌ Error renaming/moving ticket:', err);
  }
}

// 🏁 Detect when a ticket is closed, rename it, and move to Closed Tickets
client.on('channelUpdate', async (oldChannel, newChannel) => {
  try {
    // Only handle text channels
    if (!newChannel.guild || newChannel.type !== 0) return;

    const name = newChannel.name.toLowerCase();

    // Only trigger if it contains "closed"
    if (!name.includes('closed')) return;

    const guild = newChannel.guild;

    // Determine type based on the old parent
    let type = 'support';
    if (oldChannel.parentId === TICKET_CONFIG.requestVerification.targetCategoryId) {
      type = 'verification';
    }

    // Extract username from the old name
    let baseUsername = oldChannel.name
      .replace(/^resolved-|^closed-|verification-|support-|ticket-|\W/g, '')
      .trim();

    if (!baseUsername || baseUsername.length < 2) baseUsername = 'unknown';

    const newName = `resolved-${type}-${baseUsername}`;

    // ✅ Rename only if not already renamed
    if (newChannel.name !== newName) {
      await newChannel.setName(newName);
      console.log(`✏️ Renamed closed ${type} ticket to ${newName}`);
    }

    // ✅ Move to Closed Tickets category if not already there
    if (newChannel.parentId !== TICKET_CONFIG.closedCategoryId) {
      await newChannel.setParent(TICKET_CONFIG.closedCategoryId, { lockPermissions: true });
      console.log(`📦 Moved closed ${type} ticket "${newName}" to Closed Tickets`);
    }

    // ✅ Optionally lock messages from everyone
    const everyoneRole = guild.roles.everyone;
    await newChannel.permissionOverwrites.edit(everyoneRole, {
      SendMessages: false,
      AddReactions: false,
      CreatePublicThreads: false,
      CreatePrivateThreads: false,
    });

  } catch (err) {
    console.error('❌ Error handling closed ticket:', err);
  }
});

// ✅ Start bot
client.login(process.env.TOKEN);
