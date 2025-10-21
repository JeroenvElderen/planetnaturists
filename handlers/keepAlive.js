// handlers/keepAlive.js
const express = require("express");

function setupKeepAlive() {
  const app = express();
  const PORT = process.env.PORT || 3000;
  app.get("/", (req, res) => res.send("✅ PlanetNaturists bot is alive! 🌍"));
  app.listen(PORT, () => console.log(`🌐 Keep-alive running on port ${PORT}`));
}

module.exports = { setupKeepAlive };
