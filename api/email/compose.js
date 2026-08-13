'use strict';
const { requireEmailAccess }=require('../../modules/funnemail/accessGuard');
const { SCOPES }=require('../../modules/security/scopes');
const { edge }=require('../../modules/funnemail/legacyAdapter');
module.exports=async function handler(req,res){
 if(req.method!=='POST')return res.status(405).json({error:'Method Not Allowed'});
 const guard=await requireEmailAccess(req,res,SCOPES.EMAIL_WRITE);if(!guard.ok)return;
 const b=req.body||{};
 try{
  const payload=b.mode?b:{mode:b.source_message_id?'reply':'draft',recipient_email:b.recipient_email||b.to||'',text:b.text||b.body||'',goal:b.goal||b.subject||'',target_language:b.target_language||'auto',instructions:b.instructions||'',...(b.source_message_id?{message_id:b.source_message_id}: {})};
  const data=await edge(req,'funnemail-compose',payload);return res.status(200).json({contract:'email.compose.v2',source:'funnemail-compose',data});
 }catch(error){return res.status(error.status||502).json({error:'FUNNEMAIL_COMPOSE_UNAVAILABLE',message:error.message,detail:error.detail||null});}
};