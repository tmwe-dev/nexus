'use strict';
const { probe } = require('../../modules/connections/liveConnector');
const { evaluate, REQUIRED } = require('../../modules/connections/conformance');

module.exports = async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  const [fm,bt]=await Promise.all([probe('FUNNEMAIL'),probe('BARTALK')]);
  const services=[
    evaluate('FUNNEMAIL',fm,REQUIRED.FUNNEMAIL),
    evaluate('BARTALK',bt,REQUIRED.BARTALK)
  ];
  const average=Math.round(services.reduce((a,s)=>a+s.score,0)/services.length);
  return res.status(200).json({contract:'connections.conformance.v1',score:average,conformant:services.every(s=>s.conformant),services,originals_modified:false});
};
