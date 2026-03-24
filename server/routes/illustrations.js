const express = require('express');
const router = express.Router();
const { buildSvgFallback, getGeneratedImageUrl } = require('../services/generatedImageService');

router.post('/', (req, res) => {
  const { prompt = 'Step' } = req.body || {};
  const childrenMode = Boolean(req.body?.childrenMode);
  const imagePrompt = `${prompt}. ${childrenMode ? 'Friendly children cookbook illustration, simple shapes, warm colors.' : 'Clean cooking illustration, food prep scene, warm kitchen light.'}`;
  const imageUrl = getGeneratedImageUrl(imagePrompt, { width: 960, height: 640, seed: 13 });
  res.json({ imageUrl, dataUri: buildSvgFallback(prompt) });
});

module.exports = router;
