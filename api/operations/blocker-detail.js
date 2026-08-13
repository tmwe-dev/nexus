'use strict';
const store=require('../../modules/crm/storage/store');
const {authMode}=require('../../modules/security/serviceAuth');
const {migrationPortfolio}=require('../../modules/migration/portfolio');
const {probe:genericProbe}=require('../../modules/connections/liveConnector');
const {probe:funnemailProbe}=require('../../modules/funnemail/legacyAdapter');
const {evaluate,REQUIRED}=require('../../modules/connections/conformance');
module.exports=async function handler(req,res){
 res.setHeader('Cache-Control','no-store');const durable=store.durableConfig();let crm=false;if(durable.enabled){try{await store.stats();crm=true}catch{}}
 const [fm,bt,tm]=await Promise.all([funnemailProbe(),genericProbe('BARTALK'),genericProbe('TMWE2')]);const scores={FUNNEMAIL:evaluate('FUNNEMAIL',fm,REQUIRED.FUNNEMAIL),BARTALK:evaluate('BARTALK',bt,REQUIRED.BARTALK),TMWE2:evaluate('TMWE2',tm,REQUIRED.TMWE2)},migration=migrationPortfolio(),items=[];
 if(!durable.enabled||!crm)items.push({area:'CRM',type:'runtime',owner:'production-config',action:!durable.enabled?'Configure NEXUS_CRM_STORE_URL and NEXUS_CRM_STORE_TOKEN':'Restore datastore reachability'});if(!process.env.NEXUS_SERVICE_TOKEN_REGISTRY)items.push({area:'Security',type:'config',owner:'production-config',action:'Configure NEXUS_SERVICE_TOKEN_REGISTRY'});if(authMode()!=='enforce')items.push({area:'Security',type:'config',owner:'production-config',action:'Set NEXUS_SERVICE_AUTH_MODE=enforce after token registry validation'});
 if(scores.FUNNEMAIL.score<100)items.push({area:'FUNNEMAIL',type:'runtime',owner:'external-runtime',score:scores.FUNNEMAIL.score,action:'Restore reachability of Funnemail Supabase project; adapter code is complete'});
 for(const name of ['BARTALK','TMWE2']){const result=scores[name];if(result.score<100)items.push({area:name,type:'connector',owner:'deferred',score:result.score,action:`Deferred until Funnemail integration is closed`});}
 for(const item of migration.items||[]){const r=item.evidence_readiness?.readiness;if(r&&!r.ready_to_deprecate)items.push({area:item.capability,type:'migration-evidence',owner:'runtime-evidence',score:r.score,grade:r.grade,action:'Complete accepted shadow evidence, observability evidence and verified caller migration; do not modify legacy source'});}
 const byOwner=items.reduce((a,x)=>{a[x.owner]=(a[x.owner]||0)+1;return a;},{});return res.status(200).json({contract:'operations.blocker-detail.v2',focus:'FUNNEMAIL',total:items.length,by_owner:byOwner,items,originals_modified:false});
};