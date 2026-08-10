const CONNECTIONS = [
  {
    id: 'wca', name: 'WCA App', kind: 'data-source', status: 'configured', mode: 'read', sourceOfTruth: true,
    repository: 'tmweapp/wca-app', endpointEnv: 'WCA_BASE_URL', tokenEnv: 'WCA_SERVICE_TOKEN',
    capabilities: ['partner.search.v1','partner.read.v1','contact.search.v1','contact.read.v1','business-card.search.v1','business-card.read.v1']
  },
  {
    id: 'report-aziende', name: 'Report Aziende', kind: 'data-source', status: 'contract-pending-source-review', mode: 'read', sourceOfTruth: true,
    endpointEnv: 'REPORT_AZIENDE_BASE_URL', tokenEnv: 'REPORT_AZIENDE_SERVICE_TOKEN', capabilities: []
  },
  {
    id: 'funnemail', name: 'Funnemail', kind: 'application', status: 'source-mapped-contract-design', mode: 'read-write',
    repository: 'tmwe-dev/funnemail', endpointEnv: 'FUNNEMAIL_BASE_URL', tokenEnv: 'FUNNEMAIL_SERVICE_TOKEN',
    capabilities: ['email.message.search.v1','email.message.read.v1','email.draft.create.v1','email.send.v1','email.sync.v1','email.classify.v1']
  },
  {
    id: 'bartalk', name: 'BarTalk / Voice Translator', kind: 'application', status: 'source-mapped-contract-design', mode: 'session',
    repository: 'tmwe-dev/voice-translator2', endpointEnv: 'BARTALK_BASE_URL', tokenEnv: 'BARTALK_SERVICE_TOKEN',
    capabilities: ['communication.health.v1','communication.session.read.v1','communication.message.exchange.v1','translation.text.v1','translation.voice.v1','taxitalk.destination-handoff.v1']
  },
  {
    id: 'cobra', name: 'COBRA', kind: 'service', status: 'connector-ready-compatibility-mode', mode: 'orchestrate',
    repository: 'tmwe-dev/COBRA', endpointEnv: 'COBRA_BASE_URL', tokenEnv: 'COBRA_SERVICE_TOKEN',
    capabilities: ['workflow.execute.v1','web.research.v1','browser.execute.v1']
  },
  { id: 'ai-platform', name: 'AI Platform', kind: 'service', status: 'planned-extraction', mode: 'read-write', capabilities: [] },
  { id: 'crm', name: 'CRM', kind: 'application', status: 'planned-extraction', mode: 'read-write', capabilities: [] },
  { id: 'navigator', name: 'Navigator', kind: 'application', status: 'migration-source', mode: 'consumer', repository: 'tmwe-dev/wca-network-navigator', capabilities: [] },
  { id: 'tmwe2', name: 'TMWE2', kind: 'application', status: 'excluded-until-final-phase', mode: 'none', capabilities: [] }
];

function publicConnection(connection) {
  return {
    id: connection.id,
    name: connection.name,
    kind: connection.kind,
    status: connection.status,
    mode: connection.mode,
    source_of_truth: Boolean(connection.sourceOfTruth),
    configured: Boolean(connection.endpointEnv && process.env[connection.endpointEnv]),
    capabilities: connection.capabilities
  };
}

function getConnection(id) { return CONNECTIONS.find(connection => connection.id === id) || null; }
module.exports = { CONNECTIONS, publicConnection, getConnection };
