'use strict';
const { requireScope }=require('../../modules/security/apiGuard');
const { SCOPES }=require('../../modules/security/scopes');
const { rest }=require('../../modules/funnemail/legacyAdapter');
function due(priority){const h={1:4,2:24,3:72,4:168,5:720}[priority]||72;return new Date(Date.now()+h*3600000).toISOString();}
module.exports=async function handler(req,res){
 const scope=req.method==='GET'?SCOPES.EMAIL_READ:SCOPES.EMAIL_WRITE;const guard=requireScope(req,res,scope);if(!guard.ok)return;
 try{
  if(req.method==='GET'){const rows=await rest(req,'/funnemail_tasks_board?select=*&order=due_at.asc.nullslast,created_at.desc&limit=500').catch(()=>rest(req,'/funnemail_tasks?select=*&order=created_at.desc.nullslast&limit=500'));return res.status(200).json({contract:'email.tasks.v2',items:rows||[]});}
  if(req.method==='POST'){
   const b=req.body||{};if(!b.message_id&&!b.source_message_id)return res.status(400).json({error:'MESSAGE_ID_REQUIRED'});const priority=Number(b.priority)||3;
   const data=await rest(req,'/rpc/fn_create_task_from_mail',{method:'POST',body:{p_message_id:b.message_id||b.source_message_id,p_title:String(b.title||'(senza titolo)').slice(0,200),p_priority:priority,p_due_at:b.due_at||due(priority),p_auto_reason:b.auto_reason||'manual',p_snapshot:b.snapshot||{}}});return res.status(201).json({contract:'email.task.create.v2',data});
  }
  if(req.method==='PATCH'){const b=req.body||{},id=String(b.id||'').trim();if(!id)return res.status(400).json({error:'TASK_ID_REQUIRED'});const changes={...b};delete changes.id;const rows=await rest(req,`/funnemail_tasks?id=eq.${encodeURIComponent(id)}`,{method:'PATCH',headers:{Prefer:'return=representation'},body:changes});return res.status(200).json({contract:'email.task.update.v1',data:rows?.[0]||null});}
  if(req.method==='DELETE'){const id=String(req.query.id||'').trim();if(!id)return res.status(400).json({error:'TASK_ID_REQUIRED'});await rest(req,`/funnemail_tasks?id=eq.${encodeURIComponent(id)}`,{method:'DELETE'});return res.status(200).json({contract:'email.task.delete.v1',id,deleted:true});}
  return res.status(405).json({error:'Method Not Allowed'});
 }catch(error){return res.status(error.status||502).json({error:'FUNNEMAIL_TASKS_UNAVAILABLE',message:error.message,detail:error.detail||null});}
};