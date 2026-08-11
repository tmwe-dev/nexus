'use strict';
const store=require('../../modules/crm/storage/store');
const {authMode}=require('../../modules/security/serviceAuth');
const {probe}=require('../../modules/connections/liveConnector');
const {evaluate,REQUIRED}=require('../../modules/connections/conformance');
module.exports=async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 const durable=store.durableConfig(); let crm=false;if(durable.enabled){try{await store.stats();crm=true}catch{}}
 const [fm,bt,tm]=await Promise.all([probe('FUNNEMAIL'),probe('BARTALK'),probe('TMWE2')]);
 const f=evaluate('FUNNEMAIL',fm,REQUIRED.FUNNEMAIL),b=evaluate('BARTALK',bt,REQUIRED.BARTALK),t=evaluate('TMWE2',tm,REQUIRED.TMWE2);
 const commit=process.env.VERCEL_GIT_COMMIT_SHA||process.env.NEXUS_RELEASE_SHA||'unknown',branch=process.env.VERCEL_GIT_COMMIT_REF||process.env.NEXUS_RELEASE_BRANCH||'unknown',expected=process.env.NEXUS_EXPECTED_RELEASE_SHA||null;
 const deploymentReady=Boolean(commit!=='unknown'&&(expected?commit.startsWith(expected):branch==='main'));
 const items=[
 {id:'durable_crm',label:'Durable CRM Runtime',priority:1,ready:durable.enabled&&crm,action:durable.enabled?'Restore Nexus datastore reachability':'Configure NEXUS_CRM_STORE_URL + NEXUS_CRM_STORE_TOKEN'},
 {id:'token_registry',label:'Service Token Registry',priority:2,ready:Boolean(process.env.NEXUS_SERVICE_TOKEN_REGISTRY),action:'Configure least-privilege production service tokens'},
 {id:'auth_enforce',label:'Production Auth Enforce',priority:3,ready:authMode()==='enforce',action:'Set service auth to enforce after token registry validation'},
 {id:'funnemail',label:'Funnemail Live Connector',priority:4,ready:f.score===100,action:'Configure NEXUS_FUNNEMAIL_URL/TOKEN and required capabilities'},
 {id:'bartalk',label:'BarTalk Live Connector',priority:5,ready:b.score===100,action:'Configure NEXUS_BARTALK_URL/TOKEN and required capabilities'},
 {id:'tmwe2',label:'TMWE2 Final Connector',priority:6,ready:t.score===100,action:'Configure NEXUS_TMWE2_URL/TOKEN and required capabilities'},
 {id:'deployment_sync',label:'Deployment Sync',priority:7,ready:deploymentReady,action:expected?'Deploy expected release SHA':'Deploy production from GitHub main'}];
 const ready=items.filter(x=>x.ready).length,pending=items.filter(x=>!x.ready).sort((a,b)=>a.priority-b.priority);
 return res.status(200).json({contract:'operations.readiness-checklist.v4',ready,total:items.length,percent:Math.round(ready/items.length*100),next_action:pending[0]||null,items,connector_scores:{funnemail:f.score,bartalk:b.score,tmwe2:t.score},originals_modified:false});
};