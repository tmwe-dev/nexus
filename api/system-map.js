'use strict';
const store = require('../modules/crm/storage/store');
const { authMode } = require('../modules/security/serviceAuth');
const { probe } = require('../modules/connections/liveConnector');

module.exports = async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  const durable=store.durableConfig();
  let crmReachable=false;
  if(durable.enabled){ try{ await store.stats(); crmReachable=true; }catch{} }
  const auth=authMode();
  const [funnemail,bartalk]=await Promise.all([probe('FUNNEMAIL'),probe('BARTALK')]);
  const groups={
    core:[
      ['Identity Federation',true,'identity.resolve.v1'],['Contract Registry',true,'contracts v1'],['Event Schemas Registry',true,'event.envelope.v1'],['Connections Control Plane',true,'control-plane'],['AI Platform',true,'ai-platform.v1'],['Agent Framework',true,'agent-framework.v1'],['Capability Enforcement',true,'enforcement'],['Independent Nexus Data Layer',true,'Phase 34']
    ],
    business:[
      ['CRM Contacts',true,'crm.contact.v1'],['CRM Accounts',true,'crm.account.v1'],['CRM Pipeline',true,'pipeline v1'],['CRM Activities',true,'crm.activity.v1'],['CRM Opportunities',true,'crm.opportunity.v1'],['Sales Intelligence',true,'sales.intelligence.v1'],['Marketing Automation',true,'marketing.automation.v1'],['Research Engine',true,'research.engine.v1'],['Dual Read / Shadow Read',true,'Phase 34'],['CRM Write Operations',true,'crm.write.v1'],['Operator CRM UI',true,'Phase 36'],['Unified Search',true,'nexus.search.v1']
    ],
    connections:[
      ['WCA App',true,'read-only source'],['COBRA',true,'connector'],['Funnemail Boundary',true,'boundary'],['BarTalk Boundary',true,'boundary'],['Live Connector Framework',true,'Phase 39'],['Funnemail Live Runtime',Boolean(funnemail.configured&&funnemail.reachable),'runtime'],['BarTalk Live Runtime',Boolean(bartalk.configured&&bartalk.reachable),'runtime'],['Report Aziende',false,'deferred'],['TMWE2',false,'final']
    ],
    safety:[
      ['Usage & Cost Ledger',true,'observability'],['Circuit Breakers',true,'resilience'],['Shadow Comparison',true,'shadow'],['Caller Inventory',true,'migration'],['Migration Gates',true,'gates'],['Rollback Policy',true,'rollback'],['Service Auth',true,'security'],['Durable Evidence Adapter',true,'control-plane'],['Runtime Readiness API',true,'Phase 38'],['Durable CRM Runtime',Boolean(durable.enabled&&crmReachable),'runtime'],['Production Auth Enforce',auth==='enforce','runtime'],['Full API Conformance',false,'ongoing'],['Production Cutover',false,'future']
    ]
  };
  const all=Object.values(groups).flat();
  const done=all.filter(x=>x[1]).length;
  return res.status(200).json({contract:'system.map.v1',groups,summary:{done,total:all.length,todo:all.length-done,percent:Math.round(done/all.length*100)},runtime:{crm_store_configured:durable.enabled,crm_store_reachable:crmReachable,auth_mode:auth,funnemail,bartalk},originals_modified:false});
};
