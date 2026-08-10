'use strict';
const {probe}=require('../../modules/connections/liveConnector');
const {evaluate,REQUIRED}=require('../../modules/connections/conformance');
module.exports=async function handler(req,res){res.setHeader('Cache-Control','no-store');const p=await probe('TMWE2');const c=evaluate('TMWE2',p,REQUIRED.TMWE2);return res.status(200).json({contract:'tmwe2.connector.health.v1',probe:p,conformance:c,originals_modified:false});};