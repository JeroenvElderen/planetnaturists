const config = require("../../config/ecoConfig");
const { loadData, saveData } = require("./data");
const { getPlayer } = require("./utils");

function combine(uid, username, recipeName) {
  const data = loadData();
  const recipe = config.recipes[recipeName];
  if (!recipe)
    return `❌ Recipe **${recipeName}** not found. Use \`/eco recipes\`.`;

  const player = getPlayer(data, uid);
  const missing = [];

  for (const [res, qty] of Object.entries(recipe.inputs)) {
    const have = player.inventory[res] || 0;
    if (have < qty) missing.push(`${res} (${have}/${qty})`);
  }

  if (missing.length)
    return `🧱 Not enough materials for **${recipeName}**:\n${missing.join(", ")}`;

  for (const [res, qty] of Object.entries(recipe.inputs))
    player.inventory[res] -= qty;

  for (const [res, qty] of Object.entries(recipe.output))
    player.inventory[res] = (player.inventory[res] || 0) + qty;

  player.xp += recipe.xp;
  saveData(data);

  const outputName = Object.keys(recipe.output)[0];
  return `${recipe.emoji} **${username}** crafted ${outputName}! +${recipe.xp} XP 🌿`;
}

function recipesList() {
  return (
    "📜 **Crafting Recipes**\n" +
    Object.entries(config.recipes)
      .map(([n, r]) =>
        `${r.emoji} **${n}** → ${Object.keys(r.output)[0]} (needs: ${Object.entries(r.inputs)
          .map(([i, q]) => `${q} ${i}`).join(", ")})`
      )
      .join("\n")
  );
}

module.exports = { combine, recipesList };
