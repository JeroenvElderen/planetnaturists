const config = require("../../config/ecoConfig");
const { loadData, saveData } = require("./data");
const { getPlayer } = require("./utils");

const MAX_AUTOCOMPLETE_CHOICES = 25;

function titleCase(key) {
  return key
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

const recipeIndex = Object.entries(config.recipes)
  .map(([key, recipe]) => {
    const displayName = titleCase(key);
    const searchTokens = new Set([key, displayName.replace(/\s+/g, "")]);

    Object.keys(recipe.inputs).forEach((input) => searchTokens.add(input));
    Object.keys(recipe.output).forEach((output) => searchTokens.add(output));

    return {
      key,
      emoji: recipe.emoji || "🛠️",
      displayName,
      searchTokens: Array.from(searchTokens).map((token) =>
        token.toLowerCase()
      ),
    };
  })
  .sort((a, b) => a.displayName.localeCompare(b.displayName));

function recipeAutocompleteChoices(query) {
  const normalizedQuery = (query || "").trim().toLowerCase();
  const matches = normalizedQuery
    ? recipeIndex.filter((recipe) =>
        recipe.searchTokens.some((token) => token.includes(normalizedQuery))
      )
    : recipeIndex;

  return matches.slice(0, MAX_AUTOCOMPLETE_CHOICES).map((recipe) => ({
    name: `${recipe.emoji} ${recipe.displayName}`.slice(0, 100),
    value: recipe.key.slice(0, 100),
  }));
}

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
    return `🧱 Not enough materials for **${recipeName}**:\n${missing.join(
      ", "
    )}`;

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
      .map(
        ([n, r]) =>
          `${r.emoji} **${titleCase(n)}** → ${
            Object.keys(r.output)[0]
          } (needs: ${Object.entries(r.inputs)
            .map(([i, q]) => `${q} ${i}`)
            .join(", ")})`
      )
      .join("\n")
  );
}

module.exports = { combine, recipesList };
