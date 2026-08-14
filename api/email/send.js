'use strict';
const { requireEmailAccess }=require('../../modules/funnemail/accessGuard');
const { SCOPES }=require('../../modules/security/scopes');
const { edge }=require('../../modules/funnemail/legacyAdapter');
const service=require('../../modules/funnemail/serviceClient');
const idempotency=require('../../modules/idempotency/ledger');
module.exports=async function handler(req,res){
 if(req.method!=='POST')return res.status(405).json({error:'Method Not Allowed'});
 const guard=await requireEmailAccess(req,res,SCOPES.EMAIL_SEND);if(!guard.ok)return;
 const b=req.body||{};if(!b.to||!b.subject)return res.status(400).json({error:'EMAIL_TO_AND_SUBJECT_REQUIRED'});
 try{
  const recipients=Array.isArray(b.to)?b.to:[b.to];
  const payload={to:recipients.filter(Boolean),subject:String(b.subject||''),html_body:b.html_body||b.html||b.body||'',text_body:b.text_body||b.text||b.body||''};
  if(b.user_id)payload.user_id=b.user_id;if(b.reply_to_message_id)payload.reply_to_message_id=b.reply_to_message_id;if(b.attachments)payload.attachments=b.attachments;
  const execution=await idempotency.run({req,capability:'email.send.v1',auth:guard.auth,responseStatus:200},async()=>{
   if(service.configured()){const boundary=await service.request(req,'/send',{method:'POST',body:payload});return boundary?.data||null;}
   return edge(req,'funnemail-send-direct',payload);
  });
  if(execution.replayed)return res.status(execution.ticket.response_status||200).json({contract:'email.send.v1',source:'idempotency-ledger',data:null,idempotency:{replayed:true,key:execution.ticket.key,durable:true,result_ref:execution.ticket.result_ref||null}});
  return res.status(200).json({contract:'email.send.v1',source:service.configured()?'funnemail-service-boundary':'funnemail-send-direct',data:execution.result,idempotency:{replayed:false,key:execution.ticket.key||null,durable:Boolean(execution.ticket.durable)}});
 }catch(error){return res.status(error.status||502).json({error:error.code||'FUNNEMAIL_SEND_UNAVAILABLE',message:error.message,detail:error.details||error.detail||null});}
};