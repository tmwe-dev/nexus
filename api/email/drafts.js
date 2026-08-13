'use strict';
const { requireScope }=require('../../modules/security/apiGuard');
const { SCOPES }=require('../../modules/security/scopes');
const { rest }=require('../../modules/funnemail/legacyAdapter');
module.exports=async function handler(req,res){
 if(req.method!=='POST')return res.status(405).json({error:'Method Not Allowed'});
 const guard=requireScope(req,res,SCOPES.EMAIL_WRITE);if(!guard.ok)return;
 const b=req.body||{};if(!b.subject&&!b.body&&!b.html_body)return res.status(400).json({error:'EMAIL_DRAFT_CONTENT_REQUIRED'});
 try{const payload={subject:b.subject||'',html_body:b.html_body||b.body||'',status:b.status||'in_attesa'};if(b.source_message_id)payload.source_message_id=b.source_message_id;if(b.to)payload.to_address=b.to;if(b.category)payload.category=b.category;const data=await rest(req,'/email_drafts',{method:'POST',headers:{Prefer:'return=representation'},body:payload});return res.status(201).json({contract:'email.draft.create.v2',source:'funnemail-supabase-adapter',data:Array.isArray(data)?data[0]:data});}
 catch(error){return res.status(error.status||502).json({error:'FUNNEMAIL_DRAFT_UNAVAILABLE',message:error.message,detail:error.detail||null});}
};