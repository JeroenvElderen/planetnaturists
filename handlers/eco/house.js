const { loadData, saveData, getPlayer } = require("./data");
const { EmbedBuilder } = require("discord.js");

function house(uid, username) {
  const data = loadData();
  const p = getPlayer(data, uid);
  if (!p.house) p.house = { level: 1, name: `${username}’s Cabin` };
  const embed = new EmbedBuilder()
    .setTitle(`🏡 ${p.house.name}`)
    .setDescription(`Level ${p.house.level} — A cozy naturist home by the forest.`)
    .setColor("#d2b48c");
  saveData(data);
  return { embeds:[embed] };
}
module.exports = { house };
