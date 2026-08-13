'use strict';
const { requireScope } = require('../../modules/security/apiGuard');
const { SCOPES } = require('../../modules/security/scopes');
const { request } = require('../../modules/connections/liveConnector');
module.exports=async function handler(req,res){
 if(req.method!=='POST')return res.status(405).json({error:'Method Not Allowed'});
 const guard=requireScope(req,res,SCOPES.EMAIL_WRITE);if(!guard.ok)return;
 const body=req.body||{};if(!body.to&&!body.subject&&!body.body)return res.status(400).json({error:'EMAIL_DRAFT_CONTENT_REQUIRED'});
 try{const data=await request('FUNNEMAIL','/drafts',{method:'POST',body:JSON.stringify(body)});return res.status(200).json({contract:'email.draft.create.v1',source:'funnemail',data});}
 catch(error){return res.status(502).json({error:'FUNNEMAIL_DRAFT_UNAVAILABLE',message:error.message});}
};