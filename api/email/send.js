'use strict';
const { requireEmailAccess }=require('../../modules/funnemail/accessGuard');
const { SCOPES }=require('../../modules/security/scopes');
const { edge }=require('../../modules/funnemail/legacyAdapter');
module.exports=async function handler(req,res){
 if(req.method!=='POST')return res.status(405).json({error:'Method Not Allowed'});
 const guard=await requireEmailAccess(req,res,SCOPES.EMAIL_SEND);if(!guard.ok)return;
 const b=req.body||{};if(!b.to||!b.subject)return res.status(400).json({error:'EMAIL_TO_AND_SUBJECT_REQUIRED'});
 try{
  const recipients=Array.isArray(b.to)?b.to:[b.to];
  const payload={to:recipients.filter(Boolean),subject:String(b.subject||''),html_body:b.html_body||b.html||b.body||'',text_body:b.text_body||b.text||b.body||''};
  if(b.user_id)payload.user_id=b.user_id;if(b.reply_to_message_id)payload.reply_to_message_id=b.reply_to_message_id;if(b.attachments)payload.attachments=b.attachments;
  const data=await edge(req,'funnemail-send-direct',payload);return res.status(200).json({contract:'email.send.v1',source:'funnemail-send-direct',data});
 }catch(error){return res.status(error.status||502).json({error:'FUNNEMAIL_SEND_UNAVAILABLE',message:error.message,detail:error.detail||null});}
};