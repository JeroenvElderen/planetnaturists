// index.js
const fs = require('fs');
const { Client, GatewayIntentBits, Partials, REST, Routes } = require('discord.js');
require('dotenv').config();

const { countries } = require('./countries');
const createCountryRoles = require('./commands/createCountryRoles'); // slash command file

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
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

// ✅ Log when bot is ready
client.once('clientReady', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

// 🧾 Reaction message and channel IDs (update these for your setup)
const MESSAGE_ID = '1429841307538423838';
const CHANNEL_ID = '1429840375387914311';

// ✨ Register slash command for your guild (instant registration)
const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
(async () => {
  try {
    console.log('🔁 Registering guild slash commands...');
    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, '1408151481009311845'), // your server ID
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

    // After creating roles, reload the new emojiRoleMap
    if (fs.existsSync('./emojiRoleMap.json')) {
      emojiRoleMap = JSON.parse(fs.readFileSync('./emojiRoleMap.json'));
      console.log(`🔁 Reloaded emojiRoleMap.json (${Object.keys(emojiRoleMap).length} entries)`);
    }
  }
});

// ✅ Start bot
client.login(process.env.TOKEN);
