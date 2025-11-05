const { EmbedBuilder } = require("discord.js");
const { loadData, getPlayer } = require("./data");

function statusCard(uid, username) {
  const data = loadData();
  const p = getPlayer(data, uid);
  const embed = new EmbedBuilder()
    .setTitle(`🌿 ${username}’s Status`)
    .setColor("#4CAF50")
    .addFields(
      { name: "Level / XP", value: `${p.xp}`, inline: true },
      { name: "Calm", value: `${p.calm ?? 0}`, inline: true },
      { name: "Money", value: `${p.money ?? 0} 💰`, inline: true },
      { name: "Inventory", value: Object.entries(p.inventory||{}).map(([r,q])=>`${r}: ${q}`).join(", ")||"empty", inline: false }
    )
    .setTimestamp();
  return { embeds: [embed] };
}
module.exports = { statusCard };
