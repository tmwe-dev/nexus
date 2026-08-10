const TOOLS = new Map();

function registerTool(tool) {
  if (!tool?.id || typeof tool.execute !== 'function') throw new Error('INVALID_TOOL');
  const normalized = Object.freeze({
    id: tool.id,
    description: tool.description || '',
    owner: tool.owner || 'nexus',
    input_contract: tool.input_contract || null,
    output_contract: tool.output_contract || null,
    side_effects: Boolean(tool.side_effects),
    requires_approval: Boolean(tool.requires_approval),
    execute: tool.execute
  });
  TOOLS.set(tool.id, normalized);
  return normalized;
}

function getTool(id) { return TOOLS.get(id) || null; }
function listTools() { return Array.from(TOOLS.values()).map(({ execute, ...meta }) => meta); }

module.exports = { registerTool, getTool, listTools };
