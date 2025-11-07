const { select, upsert, remove } = require('../utils/supabaseClient');

let countries = {};
let countryEntries = [];
let channelNames = {};
let welcomeMessages = {};
let emojiRoleMap = {};
let initialized = false;
let initializing = null;

function normalizeCountryKey(name) {
  return (name || '').replace(/\s+/g, '');
}

async function loadCommunityData() {
  const [countryRows, aliasRows, channelRows, welcomeRows, emojiRows] = await Promise.all([
    select('countries', { columns: 'emoji,name' }),
    select('country_aliases', { columns: 'alias,emoji' }),
    select('channel_names', {
      columns: 'country_name,chat,locations,offtopic,experiences',
    }),
    select('welcome_messages', {
      columns: 'country_key,language,message',
    }),
    select('emoji_role_map', { columns: 'emoji,role_id' }),
  ]);

  const countryMap = {};
  const entries = [];
  for (const row of countryRows) {
    if (!row.emoji || !row.name) continue;
    countryMap[row.emoji] = row.name;
    entries.push({ emoji: row.emoji, name: row.name });
  }

  for (const alias of aliasRows) {
    if (!alias.alias || !alias.emoji) continue;
    if (countryMap[alias.emoji]) {
      countryMap[alias.alias] = countryMap[alias.emoji];
    }
  }

  const channelMap = {};
  for (const row of channelRows) {
    if (!row.country_name) continue;
    channelMap[row.country_name] = {
      chat: row.chat,
      locations: row.locations,
      offtopic: row.offtopic,
      experiences: row.experiences,
    };
  }

  const welcomeMap = {};
  for (const row of welcomeRows) {
    if (!row.country_key) continue;
    welcomeMap[row.country_key] = {
      lang: row.language || 'en',
      text: row.message || '',
    };
  }

  const emojiMap = {};
  for (const row of emojiRows) {
    if (!row.emoji || !row.role_id) continue;
    emojiMap[row.emoji] = row.role_id;
  }

  countries = countryMap;
  countryEntries = entries;
  channelNames = channelMap;
  welcomeMessages = welcomeMap;
  emojiRoleMap = emojiMap;
  initialized = true;
}

async function initializeCommunityData() {
  if (initialized) return;
  if (initializing) {
    await initializing;
    return;
  }

  initializing = loadCommunityData();
  try {
    await initializing;
  } finally {
    initializing = null;
  }
}

function getCountries() {
  if (!initialized) {
    throw new Error('Community data not initialized');
  }
  return countries;
}

function getChannelNames() {
  if (!initialized) {
    throw new Error('Community data not initialized');
  }
  return channelNames;
}

function getCountryEntries() {
  if (!initialized) {
    throw new Error('Community data not initialized');
  }
  return countryEntries;
}

function getWelcomeMessages() {
  if (!initialized) {
    throw new Error('Community data not initialized');
  }
  return welcomeMessages;
}

function getEmojiRoleMap() {
  if (!initialized) {
    throw new Error('Community data not initialized');
  }
  return emojiRoleMap;
}

async function refreshEmojiRoleMap() {
  const emojiRows = await select('emoji_role_map', { columns: 'emoji,role_id' });
  const emojiMap = {};
  for (const row of emojiRows) {
    if (!row.emoji || !row.role_id) continue;
    emojiMap[row.emoji] = row.role_id;
  }
  emojiRoleMap = emojiMap;
}

function encodeInList(values) {
  return values
    .map((value) => {
      const needsQuotes = /[,:()\s]/.test(value);
      const escaped = value.replace(/"/g, '""');
      return needsQuotes ? `"${escaped}"` : escaped;
    })
    .join(',');
}

async function saveEmojiRoleMap(newMap) {
  const entries = Object.entries(newMap || {}).map(([emoji, roleId]) => ({
    emoji,
    role_id: roleId,
  }));

  const existingRows = await select('emoji_role_map', { columns: 'emoji' });
  const toDelete = existingRows
    .map((row) => row.emoji)
    .filter((emoji) => !newMap[emoji]);

  if (toDelete.length) {
    await remove('emoji_role_map', {
      emoji: `in.(${encodeInList(toDelete)})`,
    });
  }

  if (entries.length) {
    await upsert('emoji_role_map', entries);
  }

  emojiRoleMap = { ...newMap };
}

async function reloadCommunityData() {
  initialized = false;
  await initializeCommunityData();
}

module.exports = {
  initializeCommunityData,
  reloadCommunityData,
  getCountries,
  getChannelNames,
  getWelcomeMessages,
  getEmojiRoleMap,
  refreshEmojiRoleMap,
  saveEmojiRoleMap,
  normalizeCountryKey,
  getCountryEntries,
};
