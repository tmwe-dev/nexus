'use strict';

const crypto=require('crypto');
const { requireEmailAccess }=require('../../modules/funnemail/accessGuard');
const { SCOPES }=require('../../modules/security/scopes');
const legacy=require('../../modules/funnemail/legacyAdapter');
const service=require('../../modules/funnemail/serviceClient');

function canonical(value){
 if(Array.isArray(value))return value.map(canonical);
 if(value&&typeof value==='object')return Object.keys(value).sort().reduce((out,key)=>{if(value[key]!==undefined)out[key]=canonical(value[key]);return out;},{});
 return value===undefined?null:value;
}
function hash(value){return crypto.createHash('sha256').update(JSON.stringify(canonical(value))).digest('hex');}
function projectionMessage(m){return {id:m?.id||null,from:m?.from||null,to:m?.to||null,subject:m?.subject||'',date:m?.date||null,read_at:m?.read_at||null,folder:m?.folder||null,category:m?.category||null,smart_folder:m?.smart_folder||null,thread_id:m?.thread_id||null,thread_key:m?.thread_key||null};}
function compare(name,boundary,compatibility){
 const b=canonical(boundary),c=canonical(compatibility);
 const boundaryHash=hash(b),compatibilityHash=hash(c);
 return {name,pass:boundaryHash===compatibilityHash,boundary_hash:boundaryHash,compatibility_hash:compatibilityHash,boundary_count:Array.isArray(b)?b.length:null,compatibility_count:Array.isArray(c)?c.length:null};
}
async function legacyDashboard(req){
 const safe=async(path,fb=[])=>{try{return await legacy.rest(req,path)}catch{return fb}};
 const [msgs,drafts,intel]=await Promise.all([
  safe('/channel_messages?channel=eq.email&direction=eq.inbound&deleted_at=is.null&select=email_date,read_at,category&order=email_date.desc.nullslast&limit=2000'),
  safe('/email_drafts?select=status&limit=1000'),
  safe('/funnemail_sender_intel?select=email_domain&limit=1000')
 ]);
 const today=new Date().toISOString().slice(0,10),categories={},draftStatus={};
 for(const m of msgs){const c=m.category||'non classificata';categories[c]=(categories[c]||0)+1;}
 for(const d of drafts){const s=d.status||'unknown';draftStatus[s]=(draftStatus[s]||0)+1;}
 return {contract:'email.dashboard.v1',totals:{inbound:msgs.length,unread:msgs.filter(x=>!x.read_at).length,today:msgs.filter(x=>String(x.email_date||'').slice(0,10)===today).length,drafts:drafts.length,enriched_senders:intel.length},categories,draft_status:draftStatus};
}

module.exports=async function handler(req,res){
 if(req.method!=='GET')return res.status(405).json({error:'Method Not Allowed'});
 const guard=await requireEmailAccess(req,res,SCOPES.EMAIL_READ);if(!guard.ok)return;
 if(guard.auth.mode!=='funnemail-user')return res.status(403).json({error:'CONFORMANCE_USER_SESSION_REQUIRED'});
 if(!service.configured())return res.status(503).json({error:'FUNNEMAIL_BOUNDARY_NOT_CONFIGURED'});
 if(!legacy.cfg().configured)return res.status(503).json({error:'FUNNEMAIL_COMPATIBILITY_ADAPTER_NOT_CONFIGURED',note:'Read-only conformance requires rollback adapter configuration; normal Mail routing does not.'});
 try{
  const checks=[];

  const [boundaryUser,legacyUser]=await Promise.all([service.request(req,'/auth/user'),legacy.user(req)]);
  checks.push(compare('auth.user',{id:boundaryUser?.user?.id||null,email:boundaryUser?.user?.email||null},{id:legacyUser?.id||null,email:legacyUser?.email||null}));

  const messageCols='id,channel,direction,from_address,from_name,to_address,to_name,subject,email_date,internal_date,created_at,read_at,folder,category,smart_folder,thread_id,thread_key,imap_flags,ai_classification_suggestion,ai_summary,ai_intent,ai_tags,ai_keyfacts,ai_sentiment,phishing_risk,phishing_reasons,due_at';
  const [boundaryMessages,legacyRows]=await Promise.all([
   service.request(req,'/messages?limit=50&offset=0'),
   legacy.rest(req,`/channel_messages?channel=eq.email&direction=eq.inbound&deleted_at=is.null&select=${encodeURIComponent(messageCols)}&order=email_date.desc.nullslast&limit=50`)
  ]);
  const bMessages=(boundaryMessages?.items||[]).map(projectionMessage);
  const lMessages=(legacyRows||[]).map(legacy.normalizeMessage).map(projectionMessage);
  checks.push(compare('message.search.first50',bMessages,lMessages));

  const [boundaryDashboard,compatDashboard]=await Promise.all([service.request(req,'/dashboard'),legacyDashboard(req)]);
  checks.push(compare('dashboard',{totals:boundaryDashboard?.totals||{},categories:boundaryDashboard?.categories||{},draft_status:boundaryDashboard?.draft_status||{}},{totals:compatDashboard.totals,categories:compatDashboard.categories,draft_status:compatDashboard.draft_status}));

  const [boundaryDrafts,legacyDrafts]=await Promise.all([
   service.request(req,'/drafts?limit=100'),
   legacy.rest(req,'/email_drafts?select=id,source_message_id,subject,html_body,status,sent_at,created_at,category,queue_started_at&order=created_at.desc&limit=100')
  ]);
  checks.push(compare('draft.list.first100',boundaryDrafts?.items||[],legacyDrafts||[]));

  const boundaryTasks=await service.request(req,'/tasks');
  let legacyTasks=[];
  try{legacyTasks=await legacy.rest(req,'/funnemail_tasks_board?select=*&order=due_at.asc.nullslast,created_at.desc&limit=500');}
  catch{legacyTasks=await legacy.rest(req,'/funnemail_tasks?select=*&order=created_at.desc.nullslast&limit=500');}
  checks.push(compare('tasks.list',boundaryTasks?.items||[],legacyTasks||[]));

  const [boundaryRules,addressRules,intentRules]=await Promise.all([
   service.request(req,'/rules'),
   legacy.rest(req,'/email_address_rules?select=*&order=updated_at.desc&limit=2000'),
   legacy.rest(req,'/funnemail_intent_rules?select=*&order=updated_at.desc&limit=500')
  ]);
  checks.push(compare('rules.address',boundaryRules?.address_rules||[],addressRules||[]));
  checks.push(compare('rules.intent',boundaryRules?.intent_rules||[],intentRules||[]));

  const passed=checks.filter(x=>x.pass).length;
  return res.status(200).json({contract:'funnemail.conformance.read.v1',mode:'read-only',user_id:guard.auth.user?.id||null,passed,total:checks.length,score:Math.round((passed/checks.length)*100),all_passed:passed===checks.length,checks});
 }catch(error){return res.status(error.status||502).json({error:'FUNNEMAIL_CONFORMANCE_UNAVAILABLE',message:error.message,detail:error.detail||null});}
};
