'use strict';

const { probe,tokenFrom,user } = require('../../modules/funnemail/legacyAdapter');
const { capabilitiesForOwner } = require('../../registry/capabilities');
const { resolveConnectionConfig } = require('../../modules/connections/config');
const idempotency = require('../../modules/idempotency/ledger');

module.exports=async function handler(req,res){
 if(req.method!=='GET')return res.status(405).json({error:'Method Not Allowed'});
 res.setHeader('Cache-Control','no-store');
 const [runtime,idempotencyStatus]=await Promise.all([probe(),idempotency.probe()]);
 const config=resolveConnectionConfig('funnemail');
 let authenticated=false,currentUser=null;
 if(tokenFrom(req)){try{currentUser=await user(req);authenticated=true}catch{}}
 const capabilities=capabilitiesForOwner('funnemail');
 const idempotentCapabilities=capabilities.filter(item=>item.idempotency_required);
 const blockers=['stable_funnemail_service_boundary'];
 if(idempotentCapabilities.length&&!idempotencyStatus.ready)blockers.push(...idempotentCapabilities.map(item=>`idempotency:${item.name}`));
 if(!runtime.configured)blockers.push('compatibility_runtime_configuration');
 else if(!runtime.reachable)blockers.push('compatibility_runtime_reachability');
 return res.status(200).json({
  contract:'funnemail.integration-status.v4',
  integration:runtime.reachable?'compatibility-live':'compatibility-not-ready',
  production_ready:false,
  adapter:'supabase-rest-edge-compatibility',
  runtime,
  target_service_boundary_configured:Boolean(config?.target_configured),
  authenticated,
  user:currentUser,
  auth:{service_to_service:true,user_token_bridge:true,enforce_compatible:true,service_token_in_browser:false},
  idempotency:idempotencyStatus,
  capabilities:{published:capabilities.length,implemented:capabilities.filter(item=>item.route).length,production_ready:0},
  blockers:Array.from(new Set(blockers)),
  originals_modified:false
 });
};