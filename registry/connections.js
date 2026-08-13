'use strict';

const { capabilityNamesForOwner } = require('./capabilities');

const CONNECTIONS = [
  {
    id: 'wca', name: 'WCA App', kind: 'data-source', status: 'configured', mode: 'read', sourceOfTruth: true,
    repository: 'tmweapp/wca-app', endpointEnv: 'WCA_BASE_URL', tokenEnv: 'WCA_SERVICE_TOKEN'
  },
  {
    id: 'report-aziende', name: 'Report Aziende', kind: 'data-source', status: 'contract-pending-source-review', mode: 'read', sourceOfTruth: true,
    endpointEnv: 'REPORT_AZIENDE_BASE_URL', tokenEnv: 'REPORT_AZIENDE_SERVICE_TOKEN'
  },
  {
    id: 'identity', name: 'Nexus Identity', kind: 'federation-index', status: 'contract-design', mode: 'read-write-metadata-only', sourceOfTruth: false, internal: true
  },
  {
    id: 'funnemail', name: 'Funnemail', kind: 'application', status: 'stable-boundary-deployed', mode: 'read-write',
    repository: 'tmwe-dev/funnemail',
    endpointEnv: 'NEXUS_FUNNEMAIL_SUPABASE_URL', tokenEnv: 'NEXUS_FUNNEMAIL_ANON_KEY',
    targetEndpointEnv: 'FUNNEMAIL_BASE_URL',
    targetAuthMode: 'delegated-user-jwt', targetHealthPath: '/health'
  },
  {
    id: 'bartalk', name: 'BarTalk / Voice Translator', kind: 'application', status: 'source-mapped-contract-design', mode: 'session',
    repository: 'tmwe-dev/voice-translator2', endpointEnv: 'BARTALK_BASE_URL', tokenEnv: 'BARTALK_SERVICE_TOKEN',
    endpointEnvAliases: ['NEXUS_BARTALK_URL'], tokenEnvAliases: ['NEXUS_BARTALK_TOKEN']
  },
  {
    id: 'cobra', name: 'COBRA', kind: 'service', status: 'connector-ready-compatibility-mode', mode: 'orchestrate',
    repository: 'tmwe-dev/COBRA', endpointEnv: 'COBRA_BASE_URL', tokenEnv: 'COBRA_SERVICE_TOKEN'
  },
  { id: 'ai-platform', name: 'AI Platform', kind: 'service', status: 'planned-extraction', mode: 'read-write' },
  {
    id: 'crm', name: 'CRM', kind: 'application', status: 'contacts-read-extraction-active', mode: 'independent-read-adapter', sourceOfTruth: false,
    repository: 'tmwe-dev/nexus', endpointEnv: 'NEXUS_CRM_STORE_URL', tokenEnv: 'NEXUS_CRM_STORE_TOKEN'
  },
  { id:'sales-intelligence', name:'Sales Intelligence', kind:'service', status:'active-internal', mode:'read', internal:true },
  { id:'marketing', name:'Marketing Planner', kind:'service', status:'active-internal', mode:'plan', internal:true },
  { id: 'navigator', name: 'Navigator', kind: 'application', status: 'migration-source', mode: 'consumer', repository: 'tmwe-dev/wca-network-navigator' },
  { id: 'tmwe2', name: 'TMWE2', kind: 'application', status: 'excluded-until-final-phase', mode: 'none' }
].map(connection => Object.freeze({ ...connection, capabilities: capabilityNamesForOwner(connection.id) }));

function publicConnection(connection) {
  return {
    id: connection.id,
    name: connection.name,
    kind: connection.kind,
    status: connection.status,
    mode: connection.mode,
    source_of_truth: Boolean(connection.sourceOfTruth),
    capabilities: connection.capabilities
  };
}

function getConnection(id) { return CONNECTIONS.find(connection => connection.id === id) || null; }
module.exports = { CONNECTIONS, publicConnection, getConnection };
