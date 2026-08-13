'use strict';

const { probe,tokenFrom,user } = require('../../modules/funnemail/legacyAdapter');
const service = require('../../modules/funnemail/serviceClient');
const { capabilitiesForOwner } = require('../../registry/capabilities');
const idempotency = require('../../modules/idempotency/ledger');

module.exports=async function handler(req,res){
 if(req.method!=='GET')return res.status(405).json({error:'Method Not Allowed'});
 res.setHeader('Cache-Control','no-store');
 const [runtime,target,idempotencyStatus]=await Promise.all([probe(),service.probe(),idempotency.probe()]);
 let authenticated=false,currentUser=null;
 if(tokenFrom(req)){try{currentUser=await user(req);authenticated=true}catch{}}
 const capabilities=capabilitiesForOwner('funnemail');
 const idempotentCapabilities=capabilities.filter(item=>item.idempotency_required);
 const blockers=[];
 if(!target.reachable)blockers.push('stable_funnemail_service_boundary');
 if(idempotentCapabilities.length&&!idempotencyStatus.ready)blockers.push(...idempotentCapabilities.map(item=>`idempotency:${item.name}`));
 if(!target.reachable){
  if(!runtime.configured)blockers.push('compatibility_runtime_configuration');
  else if(!runtime.reachable)blockers.push('compatibility_runtime_reachability');
 }
 return res.status(200).json({
  contract:'funnemail.integration-status.v5',
  integration:target.reachable?'service-boundary-live':runtime.reachable?'compatibility-live':'not-ready',
  production_ready:false,
  active_adapter:target.reachable?'funnemail-service-boundary':'supabase-rest-edge-compatibility',
  runtime,
  target_service_boundary:target,
  authenticated,
  user:currentUser,
  auth:{service_to_service:true,user_token_bridge:true,enforce_compatible:true,service_token_in_browser:false},
  idempotency:idempotencyStatus,
  capabilities:{published:capabilities.length,implemented:capabilities.filter(item=>item.route).length,production_ready:0},
  blockers:Array.from(new Set(blockers)),
  originals_modified:false
 });
};