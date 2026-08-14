'use strict';
const { requireEmailAccess }=require('../../modules/funnemail/accessGuard');
const { SCOPES }=require('../../modules/security/scopes');
const { edge }=require('../../modules/funnemail/legacyAdapter');
const service=require('../../modules/funnemail/serviceClient');
const idempotency=require('../../modules/idempotency/ledger');
module.exports=async function handler(req,res){
 if(req.method!=='POST')return res.status(405).json({error:'Method Not Allowed'});
 const guard=await requireEmailAccess(req,res,SCOPES.EMAIL_SYNC);if(!guard.ok)return;
 try{
  const execution=await idempotency.run({req,capability:'email.sync.v1',auth:guard.auth,responseStatus:200},async()=>{
   if(service.configured()){const boundary=await service.request(req,'/sync',{method:'POST',body:req.body||{}});return boundary?.data||null;}
   return edge(req,'funnemail-imap-sync',req.body||{});
  });
  if(execution.replayed)return res.status(execution.ticket.response_status||200).json({contract:'email.sync.v1',source:'idempotency-ledger',data:null,idempotency:{replayed:true,key:execution.ticket.key,durable:true,result_ref:execution.ticket.result_ref||null}});
  return res.status(200).json({contract:'email.sync.v1',source:service.configured()?'funnemail-service-boundary':'funnemail-imap-sync',data:execution.result,idempotency:{replayed:false,key:execution.ticket.key||null,durable:Boolean(execution.ticket.durable)}});
 }catch(error){return res.status(error.status||502).json({error:error.code||'FUNNEMAIL_SYNC_UNAVAILABLE',message:error.message,detail:error.details||error.detail||null});}
};