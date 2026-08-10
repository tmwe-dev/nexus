const REQUIRED = ['NODE_ENV'];
const OPTIONAL_CONNECTION_ENVS = ['WCA_BASE_URL','FUNNEMAIL_BASE_URL','BARTALK_BASE_URL','COBRA_BASE_URL','REPORT_AZIENDE_BASE_URL','NAVIGATOR_SUPABASE_URL'];

function deployPreflight() {
  const missingRequired = REQUIRED.filter(name => !process.env[name]);
  const connections = OPTIONAL_CONNECTION_ENVS.map(name => ({ name, configured: Boolean(process.env[name]) }));
  return {
    contract: 'deploy.preflight.v1',
    deployable: missingRequired.length === 0,
    missing_required: missingRequired,
    connections,
    rules: [
      'Optional integrations do not block deploy.',
      'Unavailable integrations must degrade gracefully.',
      'No source-system write is required for deploy.'
    ]
  };
}

module.exports = { deployPreflight };