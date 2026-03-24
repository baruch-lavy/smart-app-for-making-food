function buildSvgFallback(prompt) {
  const escaped = String(prompt || 'Recipe').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#fff2cc"/><stop offset="1" stop-color="#ffd7ba"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/><circle cx="1080" cy="120" r="180" fill="#fff7e8"/><circle cx="160" cy="650" r="220" fill="#ffe0c7"/><text x="80" y="320" font-family="Arial, sans-serif" font-size="44" font-weight="700" fill="#7a3e12">${escaped}</text><text x="80" y="390" font-family="Arial, sans-serif" font-size="24" fill="#8c5a30">AI illustration unavailable</text></svg>`)}`;
}

function buildPollinationsUrl(prompt, options = {}) {
  const model = options.model || process.env.AI_IMAGE_MODEL || 'flux';
  const width = options.width || 1200;
  const height = options.height || 800;
  const seed = options.seed || 7;
  const encodedPrompt = encodeURIComponent(prompt);
  return `https://image.pollinations.ai/prompt/${encodedPrompt}?model=${encodeURIComponent(model)}&width=${width}&height=${height}&seed=${seed}&nologo=true`;
}

function getGeneratedImageUrl(prompt, options = {}) {
  if (process.env.AI_IMAGE_PROVIDER === 'disabled') {
    return buildSvgFallback(prompt);
  }

  return buildPollinationsUrl(prompt, options);
}

module.exports = {
  buildSvgFallback,
  getGeneratedImageUrl,
};