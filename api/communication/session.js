'use strict';
const { requireScope } = require('../../modules/security/apiGuard');
const { SCOPES } = require('../../modules/security/scopes');
const { request } = require('../../modules/connections/liveConnector');

module.exports = async function handler(req,res){
  if(req.method!=='POST') return res.status(405).json({error:'Method Not Allowed'});
  const guard=requireScope(req,res,SCOPES.COMMUNICATION_SESSION); if(!guard.ok) return;
  try{
    const body=req.body||{};
    const data=await request('BARTALK','/sessions',{method:'POST',body:JSON.stringify(body)});
    return res.status(200).json({contract:'communication.session.v1',source:'bartalk',data});
  }catch(error){ return res.status(502).json({error:'BARTALK_SESSION_UNAVAILABLE',message:error.message}); }
};
