const { select, upsert, insert, remove } = require('./supabaseClient');

const STORY_STATE_ID = 'main';

function toStoryData({ storyRows = [], stateRow = null }) {
  const sorted = storyRows
    .slice()
    .sort((a, b) => (a.position || 0) - (b.position || 0));

  return {
    story: sorted.map((row) => row.word),
    lastUserId: stateRow?.last_user_id || null,
    storyMessageId: stateRow?.story_message_id || null,
  };
}

async function readStory() {
  const [stateRow, storyRows] = await Promise.all([
    select('story_state', {
      columns: 'id,last_user_id,story_message_id',
      filter: { id: `eq.${STORY_STATE_ID}` },
      single: true,
    }),
    select('story_words', { columns: 'position,word', order: 'position.asc' }),
  ]);

  return toStoryData({ storyRows, stateRow });
}

function normalizeStoryArray(story = []) {
  if (!Array.isArray(story)) return [];
  return story.map((word) => String(word || '').trim()).filter(Boolean);
}

async function writeStory(data) {
  const storyArray = normalizeStoryArray(data?.story);
  const statePayload = {
    id: STORY_STATE_ID,
    last_user_id: data?.lastUserId || null,
    story_message_id: data?.storyMessageId || null,
  };

  await upsert('story_state', statePayload);

  await remove('story_words', { position: 'gte.0' });

  if (storyArray.length) {
    const rows = storyArray.map((word, index) => ({ position: index, word }));
    await insert('story_words', rows);
  }

  return {
    story: storyArray,
    lastUserId: statePayload.last_user_id,
    storyMessageId: statePayload.story_message_id,
  };
}

module.exports = { readStory, writeStory };
