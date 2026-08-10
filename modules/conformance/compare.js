function normalize(value, ignored = []) {
  if (Array.isArray(value)) return value.map(v => normalize(v, ignored));
  if (value && typeof value === 'object') {
    return Object.keys(value).sort().reduce((acc, key) => {
      if (!ignored.includes(key)) acc[key] = normalize(value[key], ignored);
      return acc;
    }, {});
  }
  return value;
}

function compareResults(reference, candidate, options = {}) {
  const ignored = Array.isArray(options.ignore_fields) ? options.ignore_fields : ['latency_ms','occurred_at','correlation_id'];
  const left = normalize(reference, ignored);
  const right = normalize(candidate, ignored);
  const equal = JSON.stringify(left) === JSON.stringify(right);
  return {
    contract: 'conformance.result.v1',
    equal,
    status: equal ? 'match' : 'mismatch',
    ignored_fields: ignored,
    reference: options.include_values ? left : undefined,
    candidate: options.include_values ? right : undefined
  };
}

module.exports = { compareResults, normalize };