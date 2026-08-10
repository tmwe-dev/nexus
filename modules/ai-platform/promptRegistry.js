const PROMPTS = new Map();

function key(id, version) { return `${id}@${version}`; }

function registerPrompt(prompt) {
  if (!prompt?.id || !prompt?.version || !prompt?.template) throw new Error('INVALID_PROMPT');
  PROMPTS.set(key(prompt.id, prompt.version), Object.freeze({ ...prompt }));
  return PROMPTS.get(key(prompt.id, prompt.version));
}

function getPrompt(id, version) {
  return PROMPTS.get(key(id, version)) || null;
}

function listPrompts() {
  return Array.from(PROMPTS.values()).map(({ template, ...meta }) => meta);
}

module.exports = { registerPrompt, getPrompt, listPrompts };
