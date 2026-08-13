'use strict';

const { capabilitiesForOwner } = require('../../registry/capabilities');

module.exports=async function handler(req,res){
 if(req.method!=='GET')return res.status(405).json({error:'Method not allowed'});
 res.setHeader('Cache-Control','no-store');
 const capabilities=capabilitiesForOwner('funnemail').map(item=>({
  name:item.name,
  contract:item.name,
  route:item.route,
  method:item.method,
  scope:item.scope,
  status:item.status,
  source:'canonical-registry',
  side_effects:item.side_effects,
  idempotency_required:item.idempotency_required
 }));
 return res.status(200).json({
  service:'funnemail',
  status:'compatibility-boundary',
  published:capabilities.length,
  production_ready:false,
  capabilities,
  rules:[
   'Funnemail remains owner of mailbox state.',
   'Current Nexus access is a temporary compatibility adapter over the existing Supabase REST/Edge surface.',
   'A stable Funnemail service boundary must replace direct Supabase access before cutover.',
   'Browser user authentication and Nexus service authentication must remain separate.',
   'Original Funnemail repository is not modified by this adapter.'
  ]
 });
};