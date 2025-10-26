// handlers/videoVerifyHandler.js
const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
  ChannelType,
  EmbedBuilder,
} = require("discord.js");

const REQUEST_CHANNEL_ID = "1431982265667289278";
const VIDEO_TICKET_CATEGORY_ID = "1431982037157285930";

module.exports = {
  async initVideoRequestMessage(client) {
    const channel = await client.channels.fetch(REQUEST_CHANNEL_ID);
    if (!channel) return console.error("❌ Video request channel not found");

    await channel.messages.fetch({ limit: 20 });
    channel.bulkDelete(20).catch(() => {});

    const embed = new EmbedBuilder()
      .setTitle("📹 Video Verification Needed")
      .setDescription(
        "Click below to request a private verification call.\n\n" +
        "🎥 Camera must be ON\n👤 Only you in frame\n⏳ Please wait patiently\n\n" +
        "Press when ready ☀️"
      )
      .setColor(0x2ecc71);

    const button = new ButtonBuilder()
      .setCustomId("request_video_call")
      .setLabel("Request Video Call")
      .setStyle(ButtonStyle.Primary)
      .setEmoji("🎥");

    await channel.send({
      embeds: [embed],
      components: [new ActionRowBuilder().addComponents(button)],
    });

    console.log("✅ Video verification button posted");
  },

  async handleInteraction(interaction) {
    if (!interaction.isButton()) return;
    const guild = interaction.guild;
    const member = interaction.member;

    // ✅ Close Ticket Handler
    if (interaction.customId === "close_video_ticket") {
      const channel = interaction.channel;

      const username = channel.name.replace("video-", "");
      const linkedVoice = guild.channels.cache.find(
        ch => ch.name === `🎥 verify-${username}`
      );

      if (linkedVoice) await linkedVoice.delete().catch(() => {});
      await channel.delete().catch(() => {});
      console.log(`📕 Closed video ticket for ${username}`);
      await interaction.reply({ content: "✅ Ticket closed!", ephemeral: true });
      return;
    }

    // ✅ Prevent multiple tickets per user
    const username = member.user.username.toLowerCase();
    const existing = guild.channels.cache.find(
      ch => ch.name === `video-${username}` || ch.name === `🎥 verify-${username}`
    );

    if (existing) {
      return interaction.reply({
        content: "⛔ You already have an active video verification ticket!",
        ephemeral: true,
      });
    }

    if (interaction.customId === "request_video_call") {
      // ✅ Create private text channel
      const ticketChannel = await guild.channels.create({
        name: `video-${username}`,
        type: ChannelType.GuildText,
        parent: VIDEO_TICKET_CATEGORY_ID,
        permissionOverwrites: [
          {
            id: guild.roles.everyone.id,
            deny: [PermissionFlagsBits.ViewChannel],
          },
          {
            id: member.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ReadMessageHistory,
            ],
          },
        ],
      });

      const closeButton = new ButtonBuilder()
        .setCustomId("close_video_ticket")
        .setLabel("Close")
        .setEmoji("🗑️")
        .setStyle(ButtonStyle.Danger);

      await ticketChannel.send({
        content: `🎥 <@${member.id}> Welcome! A staff member will start your video verification shortly.\n\n✅ Make sure your camera is ready!`,
        components: [new ActionRowBuilder().addComponents(closeButton)],
      });

      // ✅ Create private voice channel
      await guild.channels.create({
        name: `🎥 verify-${username}`,
        type: ChannelType.GuildVoice,
        parent: VIDEO_TICKET_CATEGORY_ID,
        permissionOverwrites: [
          {
            id: guild.roles.everyone.id,
            deny: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect],
          },
          {
            id: member.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.Connect,
              PermissionFlagsBits.Speak,
            ],
          },
        ],
      });

      await interaction.reply({
        content: "✅ Ticket created! Staff will join you soon.",
        ephemeral: true,
      });

      console.log(`📹 Verification ticket + voice channel created for ${member.user.tag}`);
    }
  },
};
