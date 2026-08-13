'use strict';

const { evidenceReadiness } = require('./evidenceReadiness');
const { config: evidenceStoreConfig } = require('./evidenceStore');
const { getCapability } = require('../../registry/capabilities');
const { getConnection } = require('../../registry/connections');
const { resolveConnectionConfig } = require('../connections/config');
const { probeTarget } = require('../connections/targetProbe');
const idempotency = require('../idempotency/ledger');

async function architectureBlockers(capabilityName, idempotencyStatus = null, targetStatus = null) {
  const capability = getCapability(capabilityName);
  if (!capability) return ['canonical_capability_registry'];

  const blockers = [];
  if (!capability.route) blockers.push('capability_route_not_implemented');
  if (capability.idempotency_required && !idempotencyStatus?.ready) blockers.push('idempotency_enforcement');

  const connection = getConnection(capability.owner);
  if (!connection) blockers.push('capability_owner_not_registered');
  else {
    const cfg = resolveConnectionConfig(connection);
    if (connection.status === 'excluded-until-final-phase') blockers.push('owner_excluded_from_current_phase');
    if (connection.status.includes('compatibility') && !targetStatus?.reachable) blockers.push('stable_service_boundary');
    if (!cfg?.configured && !cfg?.target_configured && !connection.internal) blockers.push('owner_runtime_configuration');
  }
  return blockers;
}

async function planCutover(capability) {
  const evidence = evidenceReadiness(capability);
  if (!evidence.found) return { contract:'migration.cutover-plan.v6', capability, executable:false, reason:'capability_not_mapped', steps:[] };

  const capabilityDefinition = getCapability(capability);
  const connection = capabilityDefinition ? getConnection(capabilityDefinition.owner) : null;
  const [idempotencyStatus,targetStatus] = await Promise.all([
    capabilityDefinition?.idempotency_required ? idempotency.probe() : Promise.resolve({ required:false, ready:true, mode:idempotency.mode(), configured:Boolean(idempotency.config()) }),
    connection?.targetEndpointEnv ? probeTarget(connection) : Promise.resolve({ configured:false, reachable:false, required:false })
  ]);
  const readiness = evidence.readiness;
  const durableEvidenceReady = Boolean(evidenceStoreConfig());
  const authReady = String(process.env.NEXUS_AUTH_MODE || 'audit').toLowerCase() === 'enforce' && Boolean(process.env.NEXUS_SERVICE_TOKEN_REGISTRY);
  const architecture = await architectureBlockers(capability, idempotencyStatus, targetStatus);
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
    'confirm durable idempotency ledger is reachable and enforced when required',
    'confirm compatibility adapters have been replaced by a reachable stable service boundary',
    'switch consumer routing to Nexus',
    'observe error and mismatch rates',
    'keep legacy source available during stabilization'
  ];

  return {
    contract:'migration.cutover-plan.v6',
    capability,
    executable,
    readiness_score:readiness.score,
    durable_evidence_ready:durableEvidenceReady,
    service_auth_ready:authReady,
    idempotency:idempotencyStatus,
    target_boundary:targetStatus,
    architecture_ready:architectureReady,
    blockers:uniqueBlockers,
    evidence:evidence.evidence,
    source_write_required:false,
    destructive_action_required:false,
    steps
  };
}

module.exports = { planCutover, architectureBlockers };
