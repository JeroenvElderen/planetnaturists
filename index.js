// index.js
require("dotenv").config();
const fs = require("fs");
const { Client, GatewayIntentBits, Partials } = require("discord.js");

// Handlers
const { setupKeepAlive } = require("./handlers/keepAlive");
const { registerSlashCommands } = require("./handlers/slashCommandHandler");
const { handleReactionAdd, handleReactionRemove } = require("./handlers/reactionHandler");
const { handleTicketCreate, handleTicketUpdate } = require("./handlers/ticketHandler");

// 🌐 Start Express keep-alive server
setupKeepAlive();

// 🧠 Initialize emoji-role map
let emojiRoleMap = {};
if (fs.existsSync("./data/emojiRoleMap.json")) {
  emojiRoleMap = JSON.parse(fs.readFileSync("./data/emojiRoleMap.json"));
  console.log(`📄 Loaded emojiRoleMap.json (${Object.keys(emojiRoleMap).length} entries)`);
}

// ✨ Initialize Discord client
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

client.once("ready", async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  await registerSlashCommands();
});

client.on("messageReactionAdd", (r, u) => handleReactionAdd(r, u, emojiRoleMap));
client.on("messageReactionRemove", (r, u) => handleReactionRemove(r, u, emojiRoleMap));
client.on("channelCreate", handleTicketCreate);
client.on("channelUpdate", handleTicketUpdate);

client.login(process.env.TOKEN);
