const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

const OWNER_ID = "946346329783803945";
const VIDEO_VERIFIED_ROLE_ID = "1434942767699853359";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("verifyvideo")
    .setDescription("✅ Verify a user and close their verification channels")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The user to verify")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

  async execute(interaction) {
    const targetUser = interaction.options.getUser("user");
    const guild = interaction.guild;
    const member = await guild.members.fetch(targetUser.id);

    // ✅ Permission check
    const isOwner = interaction.user.id === OWNER_ID;
    const hasModPerms = interaction.member.permissions.has(PermissionFlagsBits.ManageRoles);
    if (!isOwner && !hasModPerms) {
      return interaction.reply({
        content: "⛔ You don’t have permission to use this command.",
        ephemeral: true,
      });
    }

    try {
      // ✅ Give role
      await member.roles.add(VIDEO_VERIFIED_ROLE_ID);

      // ✅ Find both channels
      const username = member.user.username.toLowerCase();

      const textChannel = guild.channels.cache.find(
        (ch) => ch.name === `video-${username}`
      );
      const voiceChannel = guild.channels.cache.find(
        (ch) => ch.name === `🎥 verify-${username}`
      );

      // ✅ Announce verification
      await interaction.reply({
        content: `✅ <@${member.id}> has been verified and given the **Video Verified** role!\n\nThis verification session will close in **60 seconds**.`,
        ephemeral: true,
      });

      if (textChannel) {
        const msg = await textChannel.send(
          `✅ <@${member.id}> has been verified by <@${interaction.user.id}>.\nThis channel will close in **60 seconds**.`
        );

        // 🕒 Schedule deletion
        setTimeout(async () => {
          try {
            await msg.delete().catch(() => {});
            await textChannel.delete().catch(() => {});
            if (voiceChannel) await voiceChannel.delete().catch(() => {});
            console.log(`🗑️ Closed verification channels for ${member.user.tag}`);
          } catch (err) {
            console.error("❌ Error deleting verification channels:", err);
          }
        }, 60000);
      } else {
        // if no text channel found, still delete the voice
        if (voiceChannel) {
          await voiceChannel.delete().catch(() => {});
        }
        await interaction.followUp({
          content: "⚠️ Couldn’t find the text verification channel, but the user was verified.",
          ephemeral: true,
        });
      }
    } catch (err) {
      console.error(err);
      if (!interaction.replied) {
        await interaction.reply({
          content: "❌ Could not assign the role. Check bot permissions or role hierarchy.",
          ephemeral: true,
        });
      }
    }
  },
};
