const axios = require("axios");
require("dotenv").config();

const {
  GITHUB_TOKEN,
  GITHUB_REPO,
  GITHUB_FILE_PATH,
  GITHUB_USERNAME,
} = process.env;

const BASE_URL = `https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/contents/${GITHUB_FILE_PATH}`;

async function readStory() {
  try {
    const res = await axios.get(BASE_URL, {
      headers: { Authorization: `token ${GITHUB_TOKEN}` },
    });
    const content = Buffer.from(res.data.content, "base64").toString("utf8");
    return JSON.parse(content);
  } catch (err) {
    console.warn("⚠️ No existing story found, creating a new one...");
    return { story: [], lastUserId: null, storyMessageId: null };
  }
}

async function writeStory(data, retries = 3) {
  try {
    // Always fetch the latest SHA before writing
    const res = await axios.get(BASE_URL, {
      headers: { Authorization: `token ${GITHUB_TOKEN}` },
    });
    const latestSha = res.data.sha;

    const json = JSON.stringify(data, null, 2);
    const contentEncoded = Buffer.from(json).toString("base64");

    await axios.put(
      BASE_URL,
      {
        message: "Update naturist story",
        content: contentEncoded,
        sha: latestSha,
      },
      {
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("☁️ Story synced to GitHub!");
  } catch (err) {
    // Retry a few times if there's a conflict
    if (err.response?.status === 409 && retries > 0) {
      console.warn("⚠️ GitHub sync conflict — retrying...");
      await new Promise((res) => setTimeout(res, 1000)); // wait 1s
      return writeStory(data, retries - 1);
    }

    console.error("❌ Failed to write story to GitHub:", err.message);
  }
}

module.exports = { readStory, writeStory };
