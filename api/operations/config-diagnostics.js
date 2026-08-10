'use strict';
module.exports=async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 const checks=[
  ['NEXUS_CRM_STORE_URL','Durable CRM Store URL'],
  ['NEXUS_CRM_STORE_TOKEN','Durable CRM Store Token'],
  ['NEXUS_SERVICE_TOKEN_REGISTRY','Service Token Registry'],
  ['NEXUS_SERVICE_AUTH_MODE','Production Auth Mode'],
  ['FUNNEMAIL_BASE_URL','Funnemail Endpoint'],
  ['FUNNEMAIL_SERVICE_TOKEN','Funnemail Auth'],
  ['BARTALK_BASE_URL','BarTalk Endpoint'],
  ['BARTALK_SERVICE_TOKEN','BarTalk Auth'],
  ['NEXUS_EXPECTED_RELEASE_SHA','Expected Release SHA']
 ];
 const items=checks.map(([key,label])=>({key,label,configured:Boolean(process.env[key]),value_hint:key==='NEXUS_SERVICE_AUTH_MODE'?(process.env[key]||'not set'):undefined}));
 const configured=items.filter(x=>x.configured).length;
 return res.status(200).json({contract:'operations.config-diagnostics.v2',configured,total:items.length,percent:Math.round(configured/items.length*100),missing:items.filter(x=>!x.configured).map(x=>x.key),items,originals_modified:false});
};