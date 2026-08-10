'use strict';
const store = require('../../modules/crm/storage/store');
const { authMode } = require('../../modules/security/serviceAuth');
const { migrationPortfolio } = require('../../modules/migration/portfolio');
const { probe } = require('../../modules/connections/liveConnector');
const { evaluate, REQUIRED } = require('../../modules/connections/conformance');

module.exports = async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  const durable=store.durableConfig();
  let crmReachable=false;
  if(durable.enabled){ try{ await store.stats(); crmReachable=true; }catch{} }
  const auth=authMode();
  const [fm,bt]=await Promise.all([probe('FUNNEMAIL'),probe('BARTALK')]);
  const fmConf=evaluate('FUNNEMAIL',fm,REQUIRED.FUNNEMAIL);
  const btConf=evaluate('BARTALK',bt,REQUIRED.BARTALK);
  const connectors=Math.round((fmConf.score+btConf.score)/2);
  const migration=migrationPortfolio();
  const runtimeScore=Math.round(([durable.enabled,crmReachable,auth==='enforce',Boolean(process.env.NEXUS_SERVICE_TOKEN_REGISTRY)].filter(Boolean).length/4)*100);
  const score=Math.round(runtimeScore*0.35+connectors*0.25+migration.score*0.40);
  const blockers=[];
  if(!durable.enabled) blockers.push('durable_crm_not_configured');
  if(!crmReachable) blockers.push('durable_crm_not_reachable');
  if(auth!=='enforce') blockers.push('service_auth_not_enforced');
  if(!process.env.NEXUS_SERVICE_TOKEN_REGISTRY) blockers.push('service_token_registry_missing');
  if(connectors<100) blockers.push('connector_conformance_incomplete');
  if(migration.ready_to_deprecate!==migration.total_capabilities) blockers.push('migration_capabilities_blocked');
  const productionReady=score===100&&blockers.length===0;
  return res.status(200).json({contract:'operations.release-gate.v1',score,production_ready:productionReady,cutover_allowed:productionReady,runtime_score:runtimeScore,connector_score:connectors,migration_score:migration.score,blockers,originals_modified:false});
};
