'use strict';
const { requireScope } = require('../../modules/security/apiGuard');
const { SCOPES } = require('../../modules/security/scopes');
const { request } = require('../../modules/connections/liveConnector');
module.exports=async function handler(req,res){
 if(req.method!=='POST')return res.status(405).json({error:'Method Not Allowed'});
 const guard=requireScope(req,res,SCOPES.EMAIL_CLASSIFY);if(!guard.ok)return;
 const body=req.body||{};if(!body.message_id&&!body.message)return res.status(400).json({error:'EMAIL_CLASSIFY_INPUT_REQUIRED'});
 try{const data=await request('FUNNEMAIL','/classify',{method:'POST',body:JSON.stringify(body)});return res.status(200).json({contract:'email.classify.v1',source:'funnemail',data});}
 catch(error){return res.status(502).json({error:'FUNNEMAIL_CLASSIFY_UNAVAILABLE',message:error.message});}
};