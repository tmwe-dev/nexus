'use strict';
const { requireEmailAccess }=require('../../modules/funnemail/accessGuard');
const { SCOPES }=require('../../modules/security/scopes');
const { rest,edge }=require('../../modules/funnemail/legacyAdapter');
module.exports=async function handler(req,res){
 if(req.method!=='POST')return res.status(405).json({error:'Method Not Allowed'});
 const guard=await requireEmailAccess(req,res,SCOPES.EMAIL_WRITE);if(!guard.ok)return;
 const b=req.body||{},id=String(b.message_id||b.id||'').trim(),action=String(b.action||'').toLowerCase();if(!id||!action)return res.status(400).json({error:'MESSAGE_ID_AND_ACTION_REQUIRED'});
 try{
  if(action==='read'||action==='unread'){
   const seen=action==='read';await rest(req,`/channel_messages?id=eq.${encodeURIComponent(id)}`,{method:'PATCH',headers:{Prefer:'return=representation'},body:{read_at:seen?new Date().toISOString():null}});await edge(req,'funnemail-imap-mark-seen',{message_ids:[id],seen});
  }else if(action==='trash'||action==='archive'){
   const key=action==='trash'?'trashed_at':'archived_at',now=new Date().toISOString();
   await rest(req,`/funnemail_message_status?on_conflict=message_id,user_id`,{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=representation'},body:{message_id:id,[key]:now}});await edge(req,'funnemail-imap-move',{message_ids:[id],target:action});
  }else if(action==='flag'||action==='unflag'){
   const flagged=action==='flag';await edge(req,'funnemail-imap-mark-flag',{message_ids:[id],flagged});
  }else return res.status(400).json({error:'UNSUPPORTED_EMAIL_ACTION'});
  return res.status(200).json({contract:'email.message.status.v1',source:'funnemail',message_id:id,action,ok:true});
 }catch(error){return res.status(error.status||502).json({error:'FUNNEMAIL_STATUS_UNAVAILABLE',message:error.message,detail:error.detail||null});}
};