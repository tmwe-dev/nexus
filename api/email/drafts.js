'use strict';
const { requireScope }=require('../../modules/security/apiGuard');
const { SCOPES }=require('../../modules/security/scopes');
const { rest }=require('../../modules/funnemail/legacyAdapter');
module.exports=async function handler(req,res){
 const scope=req.method==='GET'?SCOPES.EMAIL_READ:SCOPES.EMAIL_WRITE;const guard=requireScope(req,res,scope);if(!guard.ok)return;
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
   const data=await rest(req,'/email_drafts',{method:'POST',headers:{Prefer:'return=representation'},body:payload});return res.status(201).json({contract:'email.draft.create.v1',source:'funnemail-compatibility-adapter',data:Array.isArray(data)?data[0]:data});
  }
  return res.status(405).json({error:'Method Not Allowed'});
 }catch(error){return res.status(error.status||502).json({error:'FUNNEMAIL_DRAFT_UNAVAILABLE',message:error.message,detail:error.detail||null});}
};