// index.js
require("dotenv").config();
const fs = require("fs");
const { Client, GatewayIntentBits, Partials } = require("discord.js");

// 🧩 Handlers
const { setupKeepAlive } = require("./handlers/keepAlive");
const { registerSlashCommands } = require("./handlers/slashCommandHandler");
const { handleReactionAdd, handleReactionRemove } = require("./handlers/reactionHandler");
const { handleTicketCreate, handleTicketUpdate } = require("./handlers/ticketHandler");
const { handleStoryMessage, resetStory } = require("./handlers/storyGameHandler");
const {
  initVideoRequestMessage,
  handleInteraction: handleVideoInteraction,
} = require("./handlers/videoVerifyHandler");

// 🌴 Daily poll handlers
const { postDailyWouldYouRather } = require("./handlers/dailyWouldYouRatherHandler");
const { postDailyThisOrThat } = require("./handlers/dailyThisOrThatHandler");

// 🧩 Slash command files
const verifyVideo = require("./commands/verifyVideo");
const createCountryRoles = require("./commands/createCountryRoles");
const eco = require("./commands/eco");
// 🌐 Start Express keep-alive server
setupKeepAlive();

// 🧠 Load emoji-role map
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

// ✅ When the bot is ready
client.once("ready", async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  await registerSlashCommands();
  await initVideoRequestMessage(client);

  // 🌴 Post both polls immediately at startup
  await postDailyWouldYouRather(client);

  // Wait 5 minutes before posting “This or That”
  setTimeout(async () => {
    await postDailyThisOrThat(client);
  }, 5 * 60 * 1000);

  // 🕒 Set up repeating 26-hour timers
  const TWENTY_SIX_HOURS = 26 * 60 * 60 * 1000;

  // “Would You Rather” every 26 hours
  setInterval(async () => {
    console.log("🕒 26-hour interval: Posting 'Would You Rather' poll...");
    await postDailyWouldYouRather(client);

    // Chain the “This or That” poll 5 minutes later
    setTimeout(async () => {
      console.log("🕒 26-hour interval: Posting 'This or That' poll (5-min offset)...");
      await postDailyThisOrThat(client);
    }, 5 * 60 * 1000);
  }, TWENTY_SIX_HOURS);

  console.log("📆 26-hour interval scheduler started for both polls!");
});

// 🌴 Naturist Story Game
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  await handleStoryMessage(message);

  if (message.content === "!resetstory") {
    await resetStory(message);
  }
});

// 🌍 Role reactions + tickets
client.on("messageReactionAdd", (r, u) => handleReactionAdd(r, u, emojiRoleMap));
client.on("messageReactionRemove", (r, u) => handleReactionRemove(r, u, emojiRoleMap));
client.on("channelCreate", handleTicketCreate);
client.on("channelUpdate", handleTicketUpdate);

// 🎯 Handle all interactions (slash commands + buttons)
client.on("interactionCreate", async (interaction) => {
  try {
    if (interaction.isChatInputCommand()) {
      console.log(`⚙️ Slash command used: ${interaction.commandName}`);

      if (interaction.commandName === "verifyvideo") {
        return verifyVideo.execute(interaction);
      }

      if (interaction.commandName === "createcountryroles") {
        return createCountryRoles.execute(interaction);
      }

      if (interaction.commandName === "eco") {
        return eco.execute(interaction);
      }

      return interaction.reply({
        content: "❓ Unknown command.",
        ephemeral: true,
      });
    }

    if (interaction.isButton()) {
      return handleVideoInteraction(interaction);
    }
  } catch (err) {
    console.error("❌ Error handling interaction:", err);
    if (!interaction.replied) {
      await interaction.reply({
        content: "⚠️ An error occurred while processing that interaction.",
        ephemeral: true,
      });
    }
  }
});

// ✅ Start the bot
client.login(process.env.TOKEN);
