// config/ecoConfig.js
module.exports = {
  resources: [
    { name: "wood", emoji: "🪵", min: 1, max: 4 },
    { name: "stone", emoji: "🪨", min: 1, max: 3 },
    { name: "clay", emoji: "🧱", min: 1, max: 3 },
    { name: "leaves", emoji: "🍃", min: 2, max: 5 },
    { name: "water", emoji: "💧", min: 1, max: 4 },
    { name: "fiber", emoji: "🧶", min: 1, max: 2 },
    { name: "soil", emoji: "🌱", min: 1, max: 3 },
    { name: "herbs", emoji: "🌿", min: 1, max: 2 },
  ],

  // 🌾 Crafting recipes
  recipes: {
    plank: { emoji: "🪚", inputs: { wood: 3 }, output: { plank: 1 }, xp: 8 },
    brick: { emoji: "🧱", inputs: { clay: 3 }, output: { brick: 1 }, xp: 8 },
    rope: { emoji: "🪢", inputs: { fiber: 2 }, output: { rope: 1 }, xp: 8 },
    bottle: { emoji: "🍾", inputs: { sand: 3 }, output: { bottle: 1 }, xp: 10 },
    potion: { emoji: "🧪", inputs: { herbs: 2, water: 1 }, output: { potion: 1 }, xp: 12 },
    torch: { emoji: "🔥", inputs: { wood: 1, rope: 1 }, output: { torch: 1 }, xp: 10 },
    brick_wall: { emoji: "🏗️", inputs: { brick: 3, plank: 1 }, output: { brick_wall: 1 }, xp: 14 },
    herbal_mix: { emoji: "🌿✨", inputs: { herbs: 3 }, output: { herbal_mix: 1 }, xp: 10 },
    honey_balm: { emoji: "🧴", inputs: { herbal_mix: 1, water: 1 }, output: { honey_balm: 1 }, xp: 15 },
    charm: { emoji: "🧿", inputs: { rope: 1, herbs: 1 }, output: { charm: 1 }, xp: 10 },
    crystal: { emoji: "🔮", inputs: { stone: 5 }, output: { crystal: 1 }, xp: 20 },
    glass: { emoji: "🔹", inputs: { sand: 2, water: 1 }, output: { glass: 1 }, xp: 15 },
    steel: { emoji: "⚙️", inputs: { stone: 5, water: 1 }, output: { steel: 1 }, xp: 25 },
    power_core: { emoji: "💠", inputs: { crystal: 1, steel: 1 }, output: { power_core: 1 }, xp: 35 },
    arcane_scroll: { emoji: "📜✨", inputs: { herbal_mix: 1, crystal: 1 }, output: { arcane_scroll: 1 }, xp: 30 },
    solar_panel: { emoji: "🔆", inputs: { glass: 3, steel: 2 }, output: { solar_panel: 1 }, xp: 40 },
    garden_seed: { emoji: "🌾", inputs: { soil: 2, water: 1 }, output: { garden_seed: 1 }, xp: 10 },
    statue: { emoji: "🗿", inputs: { stone: 10 }, output: { statue: 1 }, xp: 40 },
    herbal_potion: { emoji: "🧪✨", inputs: { herbs: 2, potion: 1 }, output: { herbal_potion: 1 }, xp: 20 },
    sacred_blend: { emoji: "🌿💫", inputs: { herbal_mix: 2, crystal: 1 }, output: { sacred_blend: 1 }, xp: 35 },
  },

  // inside module.exports
  buildings: {
    garden: {
      name: "Community Garden",
      emoji: "🌿",
      cost: { soil: 20, water: 10, wood: 10 },
      reward: { calm: 10, xp: 40 },
      unlocks: ["garden_seed", "herbal_mix"]
    },
    sauna: {
      name: "Nature Sauna",
      emoji: "🔥",
      cost: { wood: 25, stone: 15, water: 10 },
      reward: { calm: 15, xp: 60 },
      unlocks: ["honey_balm", "torch"]
    },
    workshop: {
      name: "Village Workshop",
      emoji: "🛠️",
      cost: { wood: 30, stone: 20, plank: 10 },
      reward: { calm: 10, xp: 70 },
      unlocks: ["steel", "glass", "power_core"]
    },
    temple: {
      name: "Harmony Temple",
      emoji: "🏛️",
      cost: { brick: 50, crystal: 5, sacred_blend: 2 },
      reward: { calm: 25, xp: 120 },
      unlocks: ["sacred_blend", "arcane_scroll"]
    }
  },

  xpPerGather: 5,
  xpPerRelax: 5,
  calmPerRelax: 5
};
