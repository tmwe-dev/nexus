'use strict';
const { requireEmailAccess }=require('../../modules/funnemail/accessGuard');
const { SCOPES }=require('../../modules/security/scopes');
const { rest,edge }=require('../../modules/funnemail/legacyAdapter');
const service=require('../../modules/funnemail/serviceClient');
const idempotency=require('../../modules/idempotency/ledger');
module.exports=async function handler(req,res){
 const scope=req.method==='GET'?SCOPES.EMAIL_READ:SCOPES.EMAIL_WRITE;const guard=await requireEmailAccess(req,res,scope);if(!guard.ok)return;
 try{
  if(req.method==='GET'){
   if(service.configured())return res.status(200).json({...await service.request(req,'/rules'),source:'funnemail-service-boundary'});
   const [address,intent]=await Promise.all([rest(req,'/email_address_rules?select=*&order=updated_at.desc.nullslast&limit=2000').catch(()=>[]),rest(req,'/funnemail_intent_rules?select=*&order=updated_at.desc.nullslast&limit=500').catch(()=>[])]);
   return res.status(200).json({contract:'email.rules.v1',source:'funnemail-compatibility-adapter',address_rules:address||[],intent_rules:intent||[]});
  }
  if(req.method==='POST'){
   const execution=await idempotency.run({req,capability:'email.rules.apply.v1',auth:guard.auth,responseStatus:200},async()=>{
    if(service.configured()){
     const boundary=await service.request(req,'/rules',{method:'POST',body:req.body||{}});
     return boundary?.data??boundary;
    }
    return edge(req,'funnemail-apply-rules',req.body||{});
   });
   if(execution.replayed)return res.status(execution.ticket.response_status||200).json({contract:'email.rules.apply.v1',source:'idempotency-ledger',data:null,idempotency:{replayed:true,key:execution.ticket.key,durable:true}});
   return res.status(200).json({contract:'email.rules.apply.v1',source:service.configured()?'funnemail-service-boundary':'funnemail-apply-rules',data:execution.result,idempotency:{replayed:false,key:execution.ticket.key||null,durable:Boolean(execution.ticket.durable)}});
  }
  return res.status(405).json({error:'Method Not Allowed'});
 }catch(error){return res.status(error.status||502).json({error:error.code||'FUNNEMAIL_RULES_UNAVAILABLE',message:error.message,detail:error.details||error.detail||null});}
};
