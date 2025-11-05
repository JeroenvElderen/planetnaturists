const { EmbedBuilder } = require("discord.js");
const { loadData } = require("./data");
const config = require("../../config/ecoConfig");

function progress() {
  const data = loadData();
  const embed = new EmbedBuilder().setTitle("🏗️ Village Progress").setColor("#3cb371");
  for (const [key, b] of Object.entries(config.buildings)) {
    const prog = data.village.progress?.[key];
    const done = data.village.structures[key];
    if (done) {
      embed.addFields({ name: `${b.emoji} ${b.name}`, value: "✅ Completed", inline: false });
      continue;
    }
    const totalNeed = Object.values(b.cost).reduce((a,b)=>a+b,0);
    const totalHave = Object.entries(b.cost).reduce((a,[r,n])=>a+(prog?.[r]||0),0);
    const pct = Math.round((totalHave/totalNeed)*100);
    const bar = "█".repeat(pct/5)+"░".repeat(20-pct/5);
    embed.addFields({ name: `${b.emoji} ${b.name}`, value: `${bar} ${pct}%`, inline: false });
  }
  return { embeds:[embed] };
}
module.exports = { progress };
