const SCHEMAS = new Map();

function registerEventSchema(schema) {
  if (!schema?.event || !schema?.version || !schema?.owner || !schema?.payload) {
    throw new Error('INVALID_EVENT_SCHEMA');
  }
  const id = `${schema.event}.v${schema.version}`;
  if (SCHEMAS.has(id)) throw new Error(`EVENT_SCHEMA_ALREADY_REGISTERED:${id}`);
  const normalized = Object.freeze({ ...schema, id });
  SCHEMAS.set(id, normalized);
  return normalized;
}

function getEventSchema(id) {
  return SCHEMAS.get(id) || null;
}

function listEventSchemas() {
  return Array.from(SCHEMAS.values()).map(schema => ({
    id: schema.id,
    event: schema.event,
    version: schema.version,
    owner: schema.owner,
    description: schema.description || '',
    compatibility: schema.compatibility || 'backward'
  }));
}

module.exports = { registerEventSchema, getEventSchema, listEventSchemas };
