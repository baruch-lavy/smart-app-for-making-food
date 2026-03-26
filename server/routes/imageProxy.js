const express = require("express");
const axios = require("axios");
const router = express.Router();

// Proxy image requests to Spoonacular
router.get("/spoonacular-image", async (req, res) => {
  const { url } = req.query;
  if (!url || !url.startsWith("https://img.spoonacular.com/")) {
    return res.status(400).json({ error: "Invalid or missing image URL" });
  }
  try {
    const response = await axios.get(url, { responseType: "arraybuffer" });
    res.set("Content-Type", response.headers["content-type"] || "image/jpeg");
    res.set("Access-Control-Allow-Origin", "*");
    res.send(response.data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch image" });
  }
});

module.exports = router;
