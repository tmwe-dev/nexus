'use strict';
const { requireEmailAccess }=require('../../modules/funnemail/accessGuard');
const { SCOPES }=require('../../modules/security/scopes');
const { rest,edge }=require('../../modules/funnemail/legacyAdapter');
module.exports=async function handler(req,res){
 const scope=req.method==='GET'?SCOPES.EMAIL_READ:SCOPES.EMAIL_WRITE;const guard=await requireEmailAccess(req,res,scope);if(!guard.ok)return;
 try{
  if(req.method==='GET'){
   const [address,intent]=await Promise.all([rest(req,'/email_address_rules?select=*&order=updated_at.desc.nullslast&limit=2000').catch(()=>[]),rest(req,'/funnemail_intent_rules?select=*&order=updated_at.desc.nullslast&limit=500').catch(()=>[])]);
   return res.status(200).json({contract:'email.rules.v1',address_rules:address||[],intent_rules:intent||[]});
  }
  if(req.method==='POST'){const data=await edge(req,'funnemail-apply-rules',req.body||{});return res.status(200).json({contract:'email.rules.apply.v1',source:'funnemail-apply-rules',data});}
  return res.status(405).json({error:'Method Not Allowed'});
 }catch(error){return res.status(error.status||502).json({error:'FUNNEMAIL_RULES_UNAVAILABLE',message:error.message,detail:error.detail||null});}
};