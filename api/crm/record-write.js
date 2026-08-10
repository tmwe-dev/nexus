'use strict';
const { requireScope } = require('../../modules/security/apiGuard');
const { SCOPES } = require('../../modules/security/scopes');
const { createOrUpdate, deleteRecord } = require('../../modules/crm/storage/writeService');

module.exports = async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  const guard=requireScope(req,res,SCOPES.CRM_WRITE); if(!guard.ok) return;
  try{
    const body=req.body||{};
    if(req.method==='POST'||req.method==='PUT'||req.method==='PATCH'){
      const record=await createOrUpdate(body.entity,body.record||{});
      return res.status(200).json({contract:'crm.write.v1',operation:'upsert',writes_to_legacy:false,record});
    }
    if(req.method==='DELETE'){
      const deleted=await deleteRecord(body.entity,body.id);
      return res.status(200).json({contract:'crm.write.v1',operation:'delete',writes_to_legacy:false,deleted});
    }
    res.setHeader('Allow','POST, PUT, PATCH, DELETE');
    return res.status(405).json({error:'Method Not Allowed'});
  }catch(error){ return res.status(400).json({error:error.message||'crm_write_failed'}); }
};
