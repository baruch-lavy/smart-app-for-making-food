const express = require('express');
const router = express.Router();

// Simple SVG generator for step illustrations. Accepts { prompt }
router.post('/', (req, res) => {
  const { prompt = 'Step' } = req.body || {};
  // create a simple SVG with the prompt text (escaped)
  const escaped = String(prompt).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const svg = `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="600" height="360"><rect width="100%" height="100%" fill="#fff5e6"/><text x="50%" y="45%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="28" fill="#333">${escaped}</text><text x="50%" y="65%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="16" fill="#666">Illustration</text></svg>`;
  const dataUri = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  res.json({ dataUri });
});

module.exports = router;
