// commands/createCountryRoles.js
const { SlashCommandBuilder } = require('discord.js');
const {
  initializeCommunityData,
  getCountryEntries,
  getCountries,
  saveEmojiRoleMap,
} = require('../services/communityDataCache');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('create-country-roles')
    .setDescription('Creates one role for each country and updates emoji-to-role mapping.')
    .setDefaultMemberPermissions(8), // Admin only (optional, remove if you want everyone to use)

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    await initializeCommunityData();

    const guild = interaction.guild;
    let created = 0;
    const emojiRoleMap = {};
    const roleIdsByName = new Map();

    const countryEntries = getCountryEntries();

    for (const { emoji, name } of countryEntries) {
      const roleName = `${emoji} ${name}`;
      let role = guild.roles.cache.find((r) => r.name === roleName);

      if (!role) {
        role = await guild.roles.create({ name: roleName, mentionable: true });
        created++;
      }

      emojiRoleMap[emoji] = role.id; // store ID for future reaction linking
      roleIdsByName.set(name, role.id);
    }

    const fullCountryMap = getCountries();
    for (const [emoji, name] of Object.entries(fullCountryMap)) {
      if (emojiRoleMap[emoji]) continue;
      const roleId = roleIdsByName.get(name);
      if (roleId) {
        emojiRoleMap[emoji] = roleId;
      }
    }

    await saveEmojiRoleMap(emojiRoleMap);

    await interaction.editReply(`🌍 Created ${created} new roles.\n🔗 Updated emoji-role map automatically!`);
    console.log('✅ Supabase emoji role map updated successfully.');
  },
};
