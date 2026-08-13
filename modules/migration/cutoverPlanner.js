const { evidenceReadiness } = require('./evidenceReadiness');
const { config: evidenceStoreConfig } = require('./evidenceStore');
const { getCapability } = require('../../registry/capabilities');
const { getConnection } = require('../../registry/connections');
const { resolveConnectionConfig } = require('../connections/config');

function architectureBlockers(capabilityName) {
  const capability = getCapability(capabilityName);
  if (!capability) return ['canonical_capability_registry'];

  const blockers = [];
  if (!capability.route) blockers.push('capability_route_not_implemented');
  if (capability.idempotency_required) blockers.push('idempotency_enforcement');

  const connection = getConnection(capability.owner);
  if (!connection) blockers.push('capability_owner_not_registered');
  else {
    const cfg = resolveConnectionConfig(connection);
    if (connection.status === 'excluded-until-final-phase') blockers.push('owner_excluded_from_current_phase');
    if (connection.status.includes('compatibility')) blockers.push('stable_service_boundary');
    if (!cfg?.configured && !connection.internal) blockers.push('owner_runtime_configuration');
  }
  return blockers;
}

function planCutover(capability) {
  const evidence = evidenceReadiness(capability);
  if (!evidence.found) return { contract:'migration.cutover-plan.v4', capability, executable:false, reason:'capability_not_mapped', steps:[] };

  const readiness = evidence.readiness;
  const durableEvidenceReady = Boolean(evidenceStoreConfig());
  const authReady = String(process.env.NEXUS_AUTH_MODE || 'audit').toLowerCase() === 'enforce' && Boolean(process.env.NEXUS_SERVICE_TOKEN_REGISTRY);
  const architecture = architectureBlockers(capability);
  const blockers = [...readiness.blockers];
  if (!durableEvidenceReady) blockers.push('durable_evidence_store');
  if (!authReady) blockers.push('service_auth_enforcement');
  blockers.push(...architecture);
  const uniqueBlockers = Array.from(new Set(blockers));
  const architectureReady = architecture.length === 0;
  const executable = readiness.ready_to_deprecate === true && durableEvidenceReady && authReady && architectureReady;

  const steps = [
    'confirm capability exists in the canonical registry',
    'freeze capability and response contract major versions',
    'confirm accepted durable shadow evidence exists',
    'confirm caller inventory is complete and active callers are zero',
    'confirm rollback route is available',
    'confirm observability is active',
    'confirm durable control-plane evidence store is configured',
    'confirm service authentication is in enforce mode',
    'confirm side-effecting capability idempotency is enforced when required',
    'confirm compatibility adapters have been replaced by stable service boundaries',
    'switch consumer routing to Nexus',
    'observe error and mismatch rates',
    'keep legacy source available during stabilization'
  ];

  return {
    contract:'migration.cutover-plan.v4',
    capability,
    executable,
    readiness_score:readiness.score,
    durable_evidence_ready:durableEvidenceReady,
    service_auth_ready:authReady,
    architecture_ready:architectureReady,
    blockers:uniqueBlockers,
    evidence:evidence.evidence,
    source_write_required:false,
    destructive_action_required:false,
    steps
  };
}

module.exports = { planCutover, architectureBlockers };
