'use strict';
const { requireScope }=require('../../modules/security/apiGuard');
const { SCOPES }=require('../../modules/security/scopes');
const { edge }=require('../../modules/funnemail/legacyAdapter');
module.exports=async function handler(req,res){
 if(req.method!=='POST')return res.status(405).json({error:'Method Not Allowed'});
 const guard=requireScope(req,res,SCOPES.EMAIL_CLASSIFY);if(!guard.ok)return;
 const b=req.body||{};if(!b.message_id&&!b.id&&!b.message)return res.status(400).json({error:'EMAIL_CLASSIFY_INPUT_REQUIRED'});
 try{const data=await edge(req,'funnemail-classify',b);return res.status(200).json({contract:'email.classify.v1',source:'funnemail-classify',data});}
 catch(error){return res.status(error.status||502).json({error:'FUNNEMAIL_CLASSIFY_UNAVAILABLE',message:error.message,detail:error.detail||null});}
};