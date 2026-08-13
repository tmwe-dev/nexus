'use strict';
const { requireScope }=require('../../modules/security/apiGuard');
const { SCOPES }=require('../../modules/security/scopes');
const { edge }=require('../../modules/funnemail/legacyAdapter');
module.exports=async function handler(req,res){
 if(req.method!=='POST')return res.status(405).json({error:'Method Not Allowed'});
 const guard=requireScope(req,res,SCOPES.EMAIL_WRITE);if(!guard.ok)return;
 try{const data=await edge(req,'funnemail-compose',req.body||{});return res.status(200).json({contract:'email.compose.v1',source:'funnemail-compose',data});}
 catch(error){return res.status(error.status||502).json({error:'FUNNEMAIL_COMPOSE_UNAVAILABLE',message:error.message,detail:error.detail||null});}
};