'use strict';
const { requireScope } = require('../../modules/security/apiGuard');
const { SCOPES } = require('../../modules/security/scopes');
const { request } = require('../../modules/connections/liveConnector');
module.exports=async function handler(req,res){
 if(req.method!=='POST')return res.status(405).json({error:'Method Not Allowed'});
 const guard=requireScope(req,res,SCOPES.EMAIL_SYNC);if(!guard.ok)return;
 try{const data=await request('FUNNEMAIL','/sync',{method:'POST',body:JSON.stringify(req.body||{})});return res.status(200).json({contract:'email.sync.v1',source:'funnemail',data});}
 catch(error){return res.status(502).json({error:'FUNNEMAIL_SYNC_UNAVAILABLE',message:error.message});}
};