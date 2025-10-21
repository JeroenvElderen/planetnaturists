// handlers/ticketHandler.js
const TICKET_CONFIG = {
  requestVerification: { targetCategoryId: "1427685018746097805" },
  support: { targetCategoryId: "1429876070894534826" },
  closedCategoryId: "1428718337239678996",
};

async function handleTicketCreate(channel) {
  try {
    if (!channel.guild || channel.type !== 0) return;
    if (channel.parentId) return;
    if (!/^ticket-\d+$/i.test(channel.name)) return;

    await new Promise((res) => setTimeout(res, 7000));
    if (channel.parentId) return;

    const messages = await channel.messages.fetch({ limit: 20 }).catch(() => null);
    let type = "support";
    if (messages) {
      const joined = Array.from(messages.values())
        .map((m) => (m.content + " " + m.author.username).toLowerCase())
        .join(" ");
      if (joined.includes("verification") || joined.includes("verify"))
        type = "verification";
    }

    await handleNewTicket(channel, type);
  } catch (err) {
    console.error("❌ Error handling ticket creation:", err);
  }
}

async function handleNewTicket(channel, type) {
  try {
    const guild = channel.guild;
    const messages = await channel.messages.fetch({ limit: 20 }).catch(() => null);
    let username = "unknown-user";
    if (messages && messages.size > 0) {
      const ticketToolMsg = [...messages.values()].find(
        (m) => m.author.bot && m.content.includes("<@")
      );
      if (ticketToolMsg) {
        const match = ticketToolMsg.content.match(/<@!?(\d+)>/);
        if (match) {
          const userId = match[1];
          const member = await guild.members.fetch(userId).catch(() => null);
          if (member) username = member.user.username.toLowerCase();
        }
      }
    }

    await channel.setName(username);
    const categoryId =
      type === "verification"
        ? TICKET_CONFIG.requestVerification.targetCategoryId
        : TICKET_CONFIG.support.targetCategoryId;
    await channel.setParent(categoryId, { lockPermissions: false });
  } catch (err) {
    console.error("❌ Error moving ticket:", err);
  }
}

async function handleTicketUpdate(oldChannel, newChannel) {
  try {
    if (!newChannel.guild || newChannel.type !== 0) return;
    const name = newChannel.name.toLowerCase();
    if (!name.includes("closed")) return;

    const guild = newChannel.guild;
    let type = "support";
    if (
      oldChannel.parentId === TICKET_CONFIG.requestVerification.targetCategoryId
    )
      type = "verification";

    let baseUsername = oldChannel.name.replace(/^resolved-|^closed-|\W/g, "").trim();
    if (!baseUsername) baseUsername = "unknown";
    const newName = `resolved-${type}-${baseUsername}`;
    await newChannel.setName(newName);
    await newChannel.setParent(TICKET_CONFIG.closedCategoryId, { lockPermissions: true });
  } catch (err) {
    console.error("❌ Error handling ticket update:", err);
  }
}

module.exports = { handleTicketCreate, handleTicketUpdate };
