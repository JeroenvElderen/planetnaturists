// index.js
require("dotenv").config();
const fs = require("fs");
const { Client, GatewayIntentBits, Partials } = require("discord.js");

// 🧩 Handlers
const { setupKeepAlive } = require("./handlers/keepAlive");
const { registerSlashCommands } = require("./handlers/slashCommandHandler");
const { handleReactionAdd, handleReactionRemove } = require("./handlers/reactionHandler");
const { handleTicketCreate, handleTicketUpdate } = require("./handlers/ticketHandler");
const {
  handleStoryMessage,
  resetStory,
  restoreStory,
} = require("./handlers/storyGameHandler");

// 🌐 Keep Render service alive
setupKeepAlive();

// 🧠 Load emoji → role ID map
let emojiRoleMap = {};
if (fs.existsSync("./data/emojiRoleMap.json")) {
  emojiRoleMap = JSON.parse(fs.readFileSync("./data/emojiRoleMap.json"));
  console.log(`📄 Loaded emojiRoleMap.json (${Object.keys(emojiRoleMap).length} entries)`);
} else {
  console.warn("⚠️ No emojiRoleMap.json found — run /create-country-roles to generate it.");
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

// ✅ When bot starts
client.once("ready", async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  // 🔁 Register slash commands
  await registerSlashCommands();

  // 🌿 Restore the naturist story after a restart
  await restoreStory(client);
});

// 🌴 Naturist Story Game
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  // ✍️ Handle story continuation
  await handleStoryMessage(message);

  // 🔄 Reset story manually via command
  if (message.content === "!resetstory") {
    await resetStory(message);
  }
});

// 🌍 Reaction-based country roles
client.on("messageReactionAdd", (reaction, user) =>
  handleReactionAdd(reaction, user, emojiRoleMap)
);

client.on("messageReactionRemove", (reaction, user) =>
  handleReactionRemove(reaction, user, emojiRoleMap)
);

// 🎟️ Ticket Tool automation
client.on("channelCreate", handleTicketCreate);
client.on("channelUpdate", handleTicketUpdate);

// 🚀 Start bot
client.login(process.env.TOKEN);
