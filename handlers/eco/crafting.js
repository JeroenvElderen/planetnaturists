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

function formatId(id) {
  if (id === undefined || id === null) return "??";
  return String(id).padStart(2, "0");
}

const recipeEntries = Object.entries(config.recipes).map(([key, recipe]) => {
  const displayName = titleCase(key);
  const emoji = recipe.emoji || "🛠️";
  const searchTokens = new Set([
    key,
    displayName,
    displayName.replace(/\s+/g, ""),
  ]);

  if (recipe.id !== undefined) searchTokens.add(String(recipe.id));

  Object.keys(recipe.inputs).forEach((input) => searchTokens.add(input));
  Object.keys(recipe.output).forEach((output) => searchTokens.add(output));

  return {
    key,
    id: recipe.id,
    recipe,
    emoji,
    displayName,
    searchTokens: Array.from(searchTokens).map((token) =>
      token.toLowerCase()
    ),
  };
});

const recipeIndex = recipeEntries
  .slice()
  .sort((a, b) => {
    if (a.id !== undefined && b.id !== undefined && a.id !== b.id)
      return a.id - b.id;
    if (a.id !== undefined && b.id === undefined) return -1;
    if (a.id === undefined && b.id !== undefined) return 1;
    return a.displayName.localeCompare(b.displayName);
  });

const recipeById = new Map();
const recipeByKey = new Map();
recipeEntries.forEach((entry) => {
  if (entry.id !== undefined) recipeById.set(String(entry.id), entry);
  recipeByKey.set(entry.key, entry);
});

function resolveRecipe(identifier) {
  if (identifier === undefined || identifier === null) return null;
  const raw = identifier.toString().trim();
  if (!raw) return null;

  if (recipeById.has(raw)) return recipeById.get(raw);

  const lowered = raw.toLowerCase();
  if (recipeById.has(lowered)) return recipeById.get(lowered);
  if (recipeByKey.has(lowered)) return recipeByKey.get(lowered);

  const exact = recipeEntries.find(
    (entry) =>
      entry.displayName.toLowerCase() === lowered ||
      entry.searchTokens.includes(lowered)
  );
  if (exact) return exact;

  return (
    recipeEntries.find((entry) =>
      entry.searchTokens.some((token) => token.includes(lowered))
    ) || null
  );
}

function recipeAutocompleteChoices(query) {
  const normalizedQuery = (query || "").trim().toLowerCase();
  const matches = recipeIndex.filter((recipe) =>
    normalizedQuery
      ? recipe.searchTokens.some((token) => token.includes(normalizedQuery))
      : true
  );

  return matches.slice(0, MAX_AUTOCOMPLETE_CHOICES).map((recipe) => ({
   name: `${recipe.emoji} [${formatId(recipe.id)}] ${recipe.displayName}`.slice(
      0,
      100
    ),
    value:
      recipe.id !== undefined
        ? String(recipe.id)
        : recipe.key.slice(0, 100),
  }));
}

function combine(uid, username, recipeIdentifier) {
  const data = loadData();
  const resolved = resolveRecipe(recipeIdentifier);
  if (!resolved)
    return `❌ Recipe \`${recipeIdentifier}\` not found. Use \`/eco recipes\` for the full list.`;

  const { recipe, displayName, id } = resolved;

  const player = getPlayer(data, uid);
  const missing = [];

  for (const [res, qty] of Object.entries(recipe.inputs)) {
    const have = player.inventory[res] || 0;
    if (have < qty) missing.push(`${res} (${have}/${qty})`);
  }

  if (missing.length)
    return `🧱 Not enough materials for **${displayName}** (ID ${formatId(
      id
    )}):\n${missing.join(", ")}`;

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
  const lines = recipeIndex.map((entry) => {
    const needs = Object.entries(entry.recipe.inputs)
      .map(([i, q]) => `${q} ${i}`)
      .join(", ");
    const outputKey = Object.keys(entry.recipe.output)[0];
    return `${entry.emoji} [${formatId(entry.id)}] \`${entry.key}\` — **${
      entry.displayName
    }** → ${outputKey} • Needs: ${needs}`;
  });

  return [
    "📜 **Crafting Recipes**",
    ...lines,
    "🔢 Use the recipe ID with `/eco combine recipe:<id>`.",
  ].join("\n");
}

module.exports = { combine, recipesList, recipeAutocompleteChoices  };
