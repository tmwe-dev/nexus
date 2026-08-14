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
   if(service.configured())return res.status(200).json({...await service.request(req,`/enrich?domains=${encodeURIComponent(String(req.query.domains||''))}`),source:'funnemail-service-boundary'});
   const domains=String(req.query.domains||'').split(',').map(x=>x.trim().toLowerCase()).filter(Boolean);if(!domains.length)return res.status(400).json({error:'DOMAINS_REQUIRED'});const inClause=domains.map(encodeURIComponent).join(',');const rows=await rest(req,`/funnemail_sender_intel?email_domain=in.(${inClause})&select=email_domain,company_type,country,role_guess,scout_source,evidence`);return res.status(200).json({contract:'email.sender-intel.v1',source:'funnemail-compatibility-adapter',items:rows||[]});
  }
  if(req.method==='POST'){
   const execution=await idempotency.run({req,capability:'email.enrich.v1',auth:guard.auth,responseStatus:200},async()=>{
    if(service.configured()){
     const boundary=await service.request(req,'/enrich',{method:'POST',body:req.body||{}});
     return boundary?.data??boundary;
    }
    return edge(req,'funnemail-enrich-inbox',req.body||{});
   });
   if(execution.replayed)return res.status(execution.ticket.response_status||200).json({contract:'email.enrich.v1',source:'idempotency-ledger',data:null,idempotency:{replayed:true,key:execution.ticket.key,durable:true}});
   return res.status(200).json({contract:'email.enrich.v1',source:service.configured()?'funnemail-service-boundary':'funnemail-enrich-inbox',data:execution.result,idempotency:{replayed:false,key:execution.ticket.key||null,durable:Boolean(execution.ticket.durable)}});
  }
  return res.status(405).json({error:'Method Not Allowed'});
 }catch(error){return res.status(error.status||502).json({error:error.code||'FUNNEMAIL_ENRICH_UNAVAILABLE',message:error.message,detail:error.details||error.detail||null});}
};
