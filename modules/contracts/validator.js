function isObject(value) { return value && typeof value === 'object' && !Array.isArray(value); }

function validateShape(payload, contract = {}) {
  const errors = [];
  const required = Array.isArray(contract.required) ? contract.required : [];
  for (const field of required) {
    if (payload == null || payload[field] === undefined || payload[field] === null || payload[field] === '') {
      errors.push({ field, code: 'required' });
    }
  }
  const properties = isObject(contract.properties) ? contract.properties : {};
  for (const [field, rule] of Object.entries(properties)) {
    if (payload?.[field] === undefined) continue;
    const value = payload[field];
    if (rule.type === 'string' && typeof value !== 'string') errors.push({ field, code: 'type_string' });
    if (rule.type === 'number' && typeof value !== 'number') errors.push({ field, code: 'type_number' });
    if (rule.type === 'boolean' && typeof value !== 'boolean') errors.push({ field, code: 'type_boolean' });
    if (rule.type === 'array' && !Array.isArray(value)) errors.push({ field, code: 'type_array' });
    if (rule.type === 'object' && !isObject(value)) errors.push({ field, code: 'type_object' });
    if (Array.isArray(rule.enum) && !rule.enum.includes(value)) errors.push({ field, code: 'enum' });
  }
  return { valid: errors.length === 0, errors };
}

module.exports = { validateShape };