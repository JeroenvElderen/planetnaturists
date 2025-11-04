// index.js
require("dotenv").config();
const fs = require("fs");
const cron = require("node-cron"); // 🔹 Added for hourly scheduling
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

  // 🌴 Run the daily polls once at startup
  await postDailyWouldYouRather(client);
  await postDailyThisOrThat(client);

  // 🕒 Hourly recheck for both polls (independent channels)
  cron.schedule("0 * * * *", async () => {
    console.log("🕐 Hourly check for 'Would You Rather' poll...");
    await postDailyWouldYouRather(client);
  });

  cron.schedule("5 * * * *", async () => {
    console.log("🕐 Hourly check for 'This or That' poll...");
    await postDailyThisOrThat(client);
  });

  console.log("📆 Hourly poll scheduler started for both channels!");
});

// 🌴 Naturist Story Game
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  // Handle story posts
  await handleStoryMessage(message);

  // Handle reset command
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
    // 🟢 Slash Commands
    if (interaction.isChatInputCommand()) {
      console.log(`⚙️ Slash command used: ${interaction.commandName}`);

      if (interaction.commandName === "verifyvideo") {
        return verifyVideo.execute(interaction);
      }

      if (interaction.commandName === "createcountryroles") {
        return createCountryRoles.execute(interaction);
      }

      return interaction.reply({
        content: "❓ Unknown command.",
        ephemeral: true,
      });
    }

    // 🟢 Buttons (Video Verify system)
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
