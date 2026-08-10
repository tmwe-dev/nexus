'use strict';
const store=require('../../modules/crm/storage/store');
const {authMode}=require('../../modules/security/serviceAuth');
const {probe}=require('../../modules/connections/liveConnector');
const {evaluate,REQUIRED}=require('../../modules/connections/conformance');
module.exports=async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 const durable=store.durableConfig(); let crm=false;
 if(durable.enabled){try{await store.stats();crm=true}catch{}}
 const [fm,bt]=await Promise.all([probe('FUNNEMAIL'),probe('BARTALK')]);
 const f=evaluate('FUNNEMAIL',fm,REQUIRED.FUNNEMAIL),b=evaluate('BARTALK',bt,REQUIRED.BARTALK);
 const commit=process.env.VERCEL_GIT_COMMIT_SHA||process.env.NEXUS_RELEASE_SHA||'unknown';
 const expected=process.env.NEXUS_EXPECTED_RELEASE_SHA||null;
 const items=[
  {id:'durable_crm',label:'Durable CRM Runtime',ready:durable.enabled&&crm,action:durable.enabled?'Restore CRM datastore reachability':'Configure production CRM datastore'},
  {id:'auth_enforce',label:'Production Auth Enforce',ready:authMode()==='enforce',action:'Set service auth to enforce after token registry validation'},
  {id:'token_registry',label:'Service Token Registry',ready:Boolean(process.env.NEXUS_SERVICE_TOKEN_REGISTRY),action:'Configure least-privilege production service tokens'},
  {id:'funnemail',label:'Funnemail Live Connector',ready:f.score===100,action:'Configure endpoint/auth and satisfy required capabilities'},
  {id:'bartalk',label:'BarTalk Live Connector',ready:b.score===100,action:'Configure endpoint/auth and satisfy required capabilities'},
  {id:'deployment_sync',label:'Deployment Sync',ready:Boolean(expected&&commit!=='unknown'&&commit.startsWith(expected)),action:'Deploy current main and set expected release SHA'}
 ];
 const ready=items.filter(x=>x.ready).length;
 return res.status(200).json({contract:'operations.readiness-checklist.v1',ready,total:items.length,percent:Math.round(ready/items.length*100),items,originals_modified:false});
};
