'use strict';
const { requireScope } = require('../../modules/security/apiGuard');
const { SCOPES } = require('../../modules/security/scopes');
const { request } = require('../../modules/connections/liveConnector');
module.exports=async function handler(req,res){
 if(req.method!=='GET')return res.status(405).json({error:'Method Not Allowed'});
 const guard=requireScope(req,res,SCOPES.EMAIL_READ);if(!guard.ok)return;
 const id=String(req.query.id||'').trim();if(!id)return res.status(400).json({error:'EMAIL_MESSAGE_ID_REQUIRED'});
 try{const data=await request('FUNNEMAIL',`/messages/${encodeURIComponent(id)}`,{method:'GET'});return res.status(200).json({contract:'email.message.read.v1',source:'funnemail',data});}
 catch(error){return res.status(502).json({error:'FUNNEMAIL_MESSAGE_READ_UNAVAILABLE',message:error.message});}
};