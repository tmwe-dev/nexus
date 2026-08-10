const { listCircuitStates } = require('../../modules/resilience/circuitBreaker');
const { DEFAULT_POLICIES } = require('../../modules/resilience/policy');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  return res.status(200).json({
    contract: 'resilience.status.v1',
    circuits: listCircuitStates(),
    policies: DEFAULT_POLICIES
  });
};
