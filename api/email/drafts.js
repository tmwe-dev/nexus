'use strict';
const { requireEmailAccess }=require('../../modules/funnemail/accessGuard');
const { SCOPES }=require('../../modules/security/scopes');
const { rest }=require('../../modules/funnemail/legacyAdapter');
const idempotency=require('../../modules/idempotency/ledger');
module.exports=async function handler(req,res){
 const scope=req.method==='GET'?SCOPES.EMAIL_READ:SCOPES.EMAIL_WRITE;const guard=await requireEmailAccess(req,res,scope);if(!guard.ok)return;
 try{
  if(req.method==='GET'){
   const limit=Math.min(Math.max(Number(req.query.limit)||100,1),500),status=String(req.query.status||'').trim();
   let path=`/email_drafts?select=id,source_message_id,subject,html_body,status,sent_at,created_at,category,queue_started_at&order=created_at.desc&limit=${limit}`;
   if(status)path+=`&status=eq.${encodeURIComponent(status)}`;
   const data=await rest(req,path);return res.status(200).json({contract:'email.draft.list.v1',source:'funnemail-compatibility-adapter',items:data||[]});
  }
  if(req.method==='POST'){
   const b=req.body||{};if(!b.subject&&!b.body&&!b.html_body)return res.status(400).json({error:'EMAIL_DRAFT_CONTENT_REQUIRED'});
   const payload={subject:b.subject||'',html_body:b.html_body||b.body||'',status:b.status||'in_attesa'};if(b.source_message_id)payload.source_message_id=b.source_message_id;if(b.to)payload.to_address=b.to;if(b.category)payload.category=b.category;
   const execution=await idempotency.run({req,capability:'email.draft.create.v1',auth:guard.auth,responseStatus:201},async()=>{
    const data=await rest(req,'/email_drafts',{method:'POST',headers:{Prefer:'return=representation'},body:payload});return Array.isArray(data)?data[0]:data;
   });
   if(execution.replayed)return res.status(execution.ticket.response_status||201).json({contract:'email.draft.create.v1',source:'idempotency-ledger',data:execution.ticket.result_ref?{id:execution.ticket.result_ref}:null,idempotency:{replayed:true,key:execution.ticket.key,durable:true}});
   return res.status(201).json({contract:'email.draft.create.v1',source:'funnemail-compatibility-adapter',data:execution.result,idempotency:{replayed:false,key:execution.ticket.key||null,durable:Boolean(execution.ticket.durable)}});
  }
  return res.status(405).json({error:'Method Not Allowed'});
 }catch(error){return res.status(error.status||502).json({error:error.code||'FUNNEMAIL_DRAFT_UNAVAILABLE',message:error.message,detail:error.details||error.detail||null});}
};