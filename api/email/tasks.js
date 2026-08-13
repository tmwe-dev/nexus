'use strict';
const { requireScope }=require('../../modules/security/apiGuard');
const { SCOPES }=require('../../modules/security/scopes');
const { rest }=require('../../modules/funnemail/legacyAdapter');
module.exports=async function handler(req,res){
 const scope=req.method==='GET'?SCOPES.EMAIL_READ:SCOPES.EMAIL_WRITE;const guard=requireScope(req,res,scope);if(!guard.ok)return;
 try{
  if(req.method==='GET'){const rows=await rest(req,'/funnemail_tasks_board?select=*&order=created_at.desc.nullslast&limit=500').catch(()=>rest(req,'/funnemail_tasks?select=*&order=created_at.desc.nullslast&limit=500'));return res.status(200).json({contract:'email.tasks.v1',items:rows||[]});}
  if(req.method==='POST'){const b=req.body||{};if(!b.message_id)return res.status(400).json({error:'MESSAGE_ID_REQUIRED'});const data=await rest(req,'/rpc/fn_create_task_from_mail',{method:'POST',body:{p_message_id:b.message_id,p_title:b.title||null,p_due_at:b.due_at||null}});return res.status(201).json({contract:'email.task.create.v1',data});}
  return res.status(405).json({error:'Method Not Allowed'});
 }catch(error){return res.status(error.status||502).json({error:'FUNNEMAIL_TASKS_UNAVAILABLE',message:error.message,detail:error.detail||null});}
};