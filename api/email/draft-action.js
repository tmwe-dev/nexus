'use strict';
const { requireEmailAccess }=require('../../modules/funnemail/accessGuard');
const { SCOPES }=require('../../modules/security/scopes');
const { rest,edge }=require('../../modules/funnemail/legacyAdapter');
module.exports=async function handler(req,res){
 if(req.method!=='POST')return res.status(405).json({error:'Method Not Allowed'});
 const guard=await requireEmailAccess(req,res,SCOPES.EMAIL_WRITE);if(!guard.ok)return;
 const b=req.body||{},id=String(b.id||b.draft_id||'').trim(),action=String(b.action||'').toLowerCase();if(!id||!action)return res.status(400).json({error:'DRAFT_ID_AND_ACTION_REQUIRED'});
 try{
  let patch={};
  if(action==='approve')patch={status:'approvata'};
  else if(action==='discard')patch={status:'scartata'};
  else if(action==='schedule')patch={status:'programmata',scheduled_at:b.scheduled_at||null};
  else if(action==='update')patch={...(b.subject!==undefined?{subject:b.subject}:{}),...(b.html_body!==undefined||b.body!==undefined?{html_body:b.html_body||b.body}: {})};
  else if(action==='send'){
   if(b.html_body!==undefined||b.body!==undefined)await rest(req,`/email_drafts?id=eq.${encodeURIComponent(id)}`,{method:'PATCH',headers:{Prefer:'return=representation'},body:{html_body:b.html_body||b.body,status:'approvata'}});
   else await rest(req,`/email_drafts?id=eq.${encodeURIComponent(id)}`,{method:'PATCH',headers:{Prefer:'return=representation'},body:{status:'approvata'}});
   const send=await edge(req,'funnemail-send-direct',{draft_id:id});
   return res.status(200).json({contract:'email.draft.action.v2',action:'send',source:'funnemail-send-direct',data:send});
  } else return res.status(400).json({error:'UNSUPPORTED_DRAFT_ACTION'});
  const data=await rest(req,`/email_drafts?id=eq.${encodeURIComponent(id)}`,{method:'PATCH',headers:{Prefer:'return=representation'},body:patch});
  return res.status(200).json({contract:'email.draft.action.v2',action,data:Array.isArray(data)?data[0]:data});
 }catch(error){return res.status(error.status||502).json({error:'FUNNEMAIL_DRAFT_ACTION_UNAVAILABLE',message:error.message,detail:error.detail||null});}
};