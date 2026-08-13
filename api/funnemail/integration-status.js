'use strict';

const { probe,tokenFrom,user } = require('../../modules/funnemail/legacyAdapter');
const { capabilitiesForOwner } = require('../../registry/capabilities');
const { resolveConnectionConfig } = require('../../modules/connections/config');

module.exports=async function handler(req,res){
 if(req.method!=='GET')return res.status(405).json({error:'Method Not Allowed'});
 res.setHeader('Cache-Control','no-store');
 const runtime=await probe();
 const config=resolveConnectionConfig('funnemail');
 let authenticated=false,currentUser=null;
 if(tokenFrom(req)){try{currentUser=await user(req);authenticated=true}catch{}}
 const capabilities=capabilitiesForOwner('funnemail');
 const blockers=[
  'stable_funnemail_service_boundary',
  ...capabilities.filter(item=>item.idempotency_required).map(item=>`idempotency:${item.name}`)
 ];
 if(!runtime.configured)blockers.push('compatibility_runtime_configuration');
 else if(!runtime.reachable)blockers.push('compatibility_runtime_reachability');
 return res.status(200).json({
  contract:'funnemail.integration-status.v3',
  integration:runtime.reachable?'compatibility-live':'compatibility-not-ready',
  production_ready:false,
  adapter:'supabase-rest-edge-compatibility',
  runtime,
  target_service_boundary_configured:Boolean(config?.target_configured),
  authenticated,
  user:currentUser,
  auth:{service_to_service:true,user_token_bridge:true,enforce_compatible:true,service_token_in_browser:false},
  capabilities:{published:capabilities.length,implemented:capabilities.filter(item=>item.route).length,production_ready:0},
  blockers:Array.from(new Set(blockers)),
  originals_modified:false
 });
};