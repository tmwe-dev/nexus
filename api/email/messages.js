'use strict';
const { requireEmailAccess }=require('../../modules/funnemail/accessGuard');
const { SCOPES }=require('../../modules/security/scopes');
const { rest,normalizeMessage }=require('../../modules/funnemail/legacyAdapter');
const service=require('../../modules/funnemail/serviceClient');
module.exports=async function handler(req,res){
 if(req.method!=='GET')return res.status(405).json({error:'Method Not Allowed'});
 const guard=await requireEmailAccess(req,res,SCOPES.EMAIL_READ);if(!guard.ok)return;
 try{
  const limit=Math.min(Math.max(Number(req.query.limit)||50,1),500),offset=Math.max(Number(req.query.offset)||0,0),search=String(req.query.search||'').trim();
  if(service.configured()){
   const q=new URLSearchParams({limit:String(limit),offset:String(offset)});if(search)q.set('search',search);
   const data=await service.request(req,`/messages?${q.toString()}`);return res.status(200).json({...data,source:'funnemail-service-boundary'});
  }
  const cols='id,channel,direction,from_address,from_name,to_address,to_name,subject,email_date,internal_date,created_at,read_at,folder,category,smart_folder,thread_id,thread_key,imap_flags,ai_classification_suggestion,ai_summary,ai_intent,ai_tags,ai_keyfacts,ai_sentiment,phishing_risk,phishing_reasons,due_at';
  let path=`/channel_messages?channel=eq.email&direction=eq.inbound&deleted_at=is.null&select=${encodeURIComponent(cols)}&order=email_date.desc.nullslast&limit=${limit}&offset=${offset}`;
  if(search)path+=`&or=${encodeURIComponent(`subject.ilike.*${search}*,from_address.ilike.*${search}*,from_name.ilike.*${search}*`)}`;
  const rows=await rest(req,path);return res.status(200).json({contract:'email.message.search.v1',source:'funnemail-compatibility-adapter',items:(rows||[]).map(normalizeMessage),page:{limit,offset,count:(rows||[]).length}});
 }catch(error){return res.status(error.status||502).json({error:'FUNNEMAIL_READ_UNAVAILABLE',message:error.message,detail:error.detail||null});}
};