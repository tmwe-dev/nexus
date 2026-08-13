'use strict';
module.exports=async function handler(req,res){
 res.setHeader('Cache-Control','no-store');const branch=process.env.VERCEL_GIT_COMMIT_REF||process.env.NEXUS_RELEASE_BRANCH||'unknown';
 const checks=[
  ['NEXUS_CRM_STORE_URL','Durable CRM Store URL',true],['NEXUS_CRM_STORE_TOKEN','Durable CRM Store Token',true],['NEXUS_SERVICE_TOKEN_REGISTRY','Service Token Registry',true],['NEXUS_SERVICE_AUTH_MODE','Production Auth Mode',true],
  ['NEXUS_FUNNEMAIL_SUPABASE_URL','Funnemail Supabase URL override',false],['NEXUS_FUNNEMAIL_ANON_KEY','Funnemail anon key override',false],['NEXUS_FUNNEMAIL_USER_TOKEN','Funnemail service user token',false],
  ['NEXUS_BARTALK_URL','BarTalk Endpoint',true],['NEXUS_BARTALK_TOKEN','BarTalk Auth',true],['NEXUS_TMWE2_URL','TMWE2 Endpoint',true],['NEXUS_TMWE2_TOKEN','TMWE2 Auth',true],['NEXUS_EXPECTED_RELEASE_SHA','Expected Release SHA',false]
 ];
 const items=checks.map(([key,label,required])=>{let configured=Boolean(process.env[key]);let value_hint;if(key.startsWith('NEXUS_FUNNEMAIL_')&&!configured){configured=true;value_hint='built-in Funnemail project adapter';}if(key==='NEXUS_SERVICE_AUTH_MODE')value_hint=process.env[key]||'not set';if(key==='NEXUS_EXPECTED_RELEASE_SHA'&&branch==='main'){configured=true;value_hint='Git-linked main';}return {key,label,required,configured,value_hint};});
 const required=items.filter(x=>x.required),configured=required.filter(x=>x.configured).length;return res.status(200).json({contract:'operations.config-diagnostics.v5',configured,total:required.length,percent:Math.round(configured/required.length*100),missing:required.filter(x=>!x.configured).map(x=>x.key),items,git_linked_main:branch==='main',funnemail_adapter_embedded:true,originals_modified:false});
};