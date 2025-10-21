// handlers/slashCommandHandler.js
const { REST, Routes } = require("discord.js");
const createCountryRoles = require("../commands/createCountryRoles");

async function registerSlashCommands() {
  const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);
  try {
    console.log("🔁 Registering guild slash commands...");
    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, "1408151481009311845"),
      { body: [createCountryRoles.data.toJSON()] }
    );
    console.log("✅ Slash commands registered!");
  } catch (err) {
    console.error("❌ Error registering slash commands:", err);
  }
}

module.exports = { registerSlashCommands };
