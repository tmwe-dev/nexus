'use strict';
const { requireScope }=require('../../modules/security/apiGuard');
const { SCOPES }=require('../../modules/security/scopes');
const { edge }=require('../../modules/funnemail/legacyAdapter');
module.exports=async function handler(req,res){
 if(req.method!=='POST')return res.status(405).json({error:'Method Not Allowed'});const guard=requireScope(req,res,SCOPES.EMAIL_CLASSIFY);if(!guard.ok)return;
 const b=req.body||{};if(!b.message_id&&!b.message_ids)return res.status(400).json({error:'MESSAGE_ID_REQUIRED'});
 try{const name=Array.isArray(b.message_ids)&&b.message_ids.length>1?'funnemail-reclassify-batch':'funnemail-reclassify-now';const data=await edge(req,name,b);return res.status(200).json({contract:'email.reclassify.v1',source:name,data});}
 catch(error){return res.status(error.status||502).json({error:'FUNNEMAIL_RECLASSIFY_UNAVAILABLE',message:error.message,detail:error.detail||null});}
};