const CONNECTIONS = [
  {
    id: 'wca',
    name: 'WCA App',
    kind: 'data-source',
    status: 'configured',
    mode: 'read',
    sourceOfTruth: true,
    endpointEnv: 'WCA_BASE_URL',
    tokenEnv: 'WCA_SERVICE_TOKEN',
    capabilities: [
      'partner.search.v1',
      'partner.read.v1',
      'contact.search.v1',
      'contact.read.v1',
      'business-card.search.v1',
      'business-card.read.v1'
    ]
  },
  {
    id: 'report-aziende',
    name: 'Report Aziende',
    kind: 'data-source',
    status: 'contract-pending-source-review',
    mode: 'read',
    sourceOfTruth: true,
    endpointEnv: 'REPORT_AZIENDE_BASE_URL',
    tokenEnv: 'REPORT_AZIENDE_SERVICE_TOKEN',
    capabilities: []
  },
  { id: 'funnemail', name: 'Funnemail', kind: 'application', status: 'planned', mode: 'read-write', capabilities: [] },
  { id: 'bartalk', name: 'BarTalk', kind: 'application', status: 'planned', mode: 'session', capabilities: [] },
  { id: 'scraper', name: 'Scraper', kind: 'service', status: 'planned', mode: 'read', capabilities: [] },
  { id: 'research', name: 'Research', kind: 'service', status: 'planned', mode: 'read', capabilities: [] },
  { id: 'ai-platform', name: 'AI Platform', kind: 'service', status: 'planned', mode: 'read-write', capabilities: [] },
  { id: 'cobra', name: 'Cobra', kind: 'service', status: 'planned', mode: 'orchestrate', capabilities: [] },
  { id: 'crm', name: 'CRM', kind: 'application', status: 'planned-extraction', mode: 'read-write', capabilities: [] },
  { id: 'navigator', name: 'Navigator', kind: 'application', status: 'migration-source', mode: 'consumer', capabilities: [] },
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

function getConnection(id) {
  return CONNECTIONS.find(connection => connection.id === id) || null;
}

module.exports = { CONNECTIONS, publicConnection, getConnection };
