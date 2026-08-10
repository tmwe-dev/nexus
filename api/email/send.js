'use strict';
const { requireScope } = require('../../modules/security/apiGuard');
const { SCOPES } = require('../../modules/security/scopes');
const { request } = require('../../modules/connections/liveConnector');

module.exports = async function handler(req,res){
  if(req.method!=='POST') return res.status(405).json({error:'Method Not Allowed'});
  const guard=requireScope(req,res,SCOPES.EMAIL_SEND); if(!guard.ok) return;
  try{
    const body=req.body||{};
    if(!body.to||!body.subject) return res.status(400).json({error:'EMAIL_TO_AND_SUBJECT_REQUIRED'});
    const data=await request('FUNNEMAIL','/send',{method:'POST',body:JSON.stringify(body)});
    return res.status(200).json({contract:'email.send.v1',source:'funnemail',data});
  }catch(error){ return res.status(502).json({error:'FUNNEMAIL_SEND_UNAVAILABLE',message:error.message}); }
};
