'use strict';
const { requireScope } = require('../../modules/security/apiGuard');
const { SCOPES } = require('../../modules/security/scopes');
const { request } = require('../../modules/connections/liveConnector');

module.exports = async function handler(req,res){
  if(req.method!=='GET') return res.status(405).json({error:'Method Not Allowed'});
  const guard=requireScope(req,res,SCOPES.EMAIL_READ); if(!guard.ok) return;
  try{
    const qs=new URLSearchParams();
    if(req.query.limit) qs.set('limit',String(req.query.limit));
    if(req.query.cursor) qs.set('cursor',String(req.query.cursor));
    if(req.query.search) qs.set('search',String(req.query.search));
    const data=await request('FUNNEMAIL',`/messages${qs.toString()?`?${qs}`:''}`,{method:'GET'});
    return res.status(200).json({contract:'email.messages.v1',source:'funnemail',data});
  }catch(error){ return res.status(502).json({error:'FUNNEMAIL_READ_UNAVAILABLE',message:error.message}); }
};
