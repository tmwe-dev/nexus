'use strict';
const { requireScope }=require('../../modules/security/apiGuard');
const { SCOPES }=require('../../modules/security/scopes');
const { edge }=require('../../modules/funnemail/legacyAdapter');
module.exports=async function handler(req,res){
 if(req.method!=='POST')return res.status(405).json({error:'Method Not Allowed'});
 const guard=requireScope(req,res,SCOPES.EMAIL_SEND);if(!guard.ok)return;
 const b=req.body||{};if(!b.to||!b.subject)return res.status(400).json({error:'EMAIL_TO_AND_SUBJECT_REQUIRED'});
 try{const payload={...b,html:b.html||b.html_body||b.body||'',body:b.body||b.text||''};const data=await edge(req,'funnemail-send-direct',payload);return res.status(200).json({contract:'email.send.v2',source:'funnemail-send-direct',data});}
 catch(error){return res.status(error.status||502).json({error:'FUNNEMAIL_SEND_UNAVAILABLE',message:error.message,detail:error.detail||null});}
};