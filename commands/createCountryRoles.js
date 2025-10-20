// commands/createCountryRoles.js
const { SlashCommandBuilder } = require('discord.js');
const { countries } = require('../countries');
const fs = require('fs');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('create-country-roles')
    .setDescription('Creates one role for each country and updates emoji-to-role mapping.')
    .setDefaultMemberPermissions(8), // Admin only (optional, remove if you want everyone to use)

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const guild = interaction.guild;
    let created = 0;
    const emojiRoleMap = {};

    for (const [emoji, name] of Object.entries(countries)) {
      const roleName = `${emoji} ${name}`;
      let role = guild.roles.cache.find(r => r.name === roleName);

      if (!role) {
        role = await guild.roles.create({ name: roleName, mentionable: true });
        created++;
      }

      emojiRoleMap[emoji] = role.id; // store ID for future reaction linking
    }

    // Save the emoji-to-role map to a local JSON file
    fs.writeFileSync('./emojiRoleMap.json', JSON.stringify(emojiRoleMap, null, 2));

    await interaction.editReply(`🌍 Created ${created} new roles.\n🔗 Updated emoji-role map automatically!`);
    console.log('✅ emojiRoleMap.json updated successfully.');
  },
};
