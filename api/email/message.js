'use strict';
const { requireEmailAccess }=require('../../modules/funnemail/accessGuard');
const { SCOPES }=require('../../modules/security/scopes');
const { rest,normalizeMessage }=require('../../modules/funnemail/legacyAdapter');
module.exports=async function handler(req,res){
 if(req.method!=='GET')return res.status(405).json({error:'Method Not Allowed'});
 const guard=await requireEmailAccess(req,res,SCOPES.EMAIL_READ);if(!guard.ok)return;
 const id=String(req.query.id||'').trim();if(!id)return res.status(400).json({error:'EMAIL_MESSAGE_ID_REQUIRED'});
 try{const cols='id,channel,direction,from_address,from_name,to_address,to_name,subject,body_text,body_html,email_date,internal_date,created_at,read_at,folder,category,smart_folder,thread_id,thread_key,imap_flags,ai_classification_suggestion,ai_summary,ai_intent,ai_tags,ai_keyfacts,ai_sentiment,phishing_risk,phishing_reasons,due_at';const rows=await rest(req,`/channel_messages?id=eq.${encodeURIComponent(id)}&select=${encodeURIComponent(cols)}&limit=1`);if(!rows?.length)return res.status(404).json({error:'EMAIL_MESSAGE_NOT_FOUND'});return res.status(200).json({contract:'email.message.read.v1',source:'funnemail-compatibility-adapter',data:normalizeMessage(rows[0])});}
 catch(error){return res.status(error.status||502).json({error:'FUNNEMAIL_MESSAGE_READ_UNAVAILABLE',message:error.message,detail:error.detail||null});}
};