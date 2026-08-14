'use strict';
const { requireEmailAccess }=require('../../modules/funnemail/accessGuard');
const { SCOPES }=require('../../modules/security/scopes');
const { edge }=require('../../modules/funnemail/legacyAdapter');
const service=require('../../modules/funnemail/serviceClient');
const idempotency=require('../../modules/idempotency/ledger');
module.exports=async function handler(req,res){
 if(req.method!=='POST')return res.status(405).json({error:'Method Not Allowed'});
 const guard=await requireEmailAccess(req,res,SCOPES.EMAIL_CLASSIFY);if(!guard.ok)return;
 const b=req.body||{};if(!b.message_id&&!b.id&&!b.message)return res.status(400).json({error:'EMAIL_CLASSIFY_INPUT_REQUIRED'});
 try{
  const execution=await idempotency.run({req,capability:'email.classify.v1',auth:guard.auth,responseStatus:200},async()=>{
   if(service.configured()){
    const boundary=await service.request(req,'/classify',{method:'POST',body:b});
    return boundary?.data??boundary;
   }
   return edge(req,'funnemail-classify',b);
  });
  if(execution.replayed)return res.status(execution.ticket.response_status||200).json({contract:'email.classify.v1',source:'idempotency-ledger',data:execution.ticket.result_ref?{message_id:execution.ticket.result_ref}:null,idempotency:{replayed:true,key:execution.ticket.key,durable:true}});
  return res.status(200).json({contract:'email.classify.v1',source:service.configured()?'funnemail-service-boundary':'funnemail-classify',data:execution.result,idempotency:{replayed:false,key:execution.ticket.key||null,durable:Boolean(execution.ticket.durable)}});
 }catch(error){return res.status(error.status||502).json({error:error.code||'FUNNEMAIL_CLASSIFY_UNAVAILABLE',message:error.message,detail:error.details||error.detail||null});}
};