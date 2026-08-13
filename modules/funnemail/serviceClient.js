'use strict';

const { resolveConnectionConfig } = require('../connections/config');
const { tokenFrom } = require('./legacyAdapter');
const { probeTarget } = require('../connections/targetProbe');

function config() { return resolveConnectionConfig('funnemail'); }
function configured() { const cfg=config(); return Boolean(cfg?.target_configured && cfg.target_base); }

function headers(req) {
  const out={
    Accept:'application/json',
    'Content-Type':'application/json'
  };
  const userToken=tokenFrom(req);if(userToken)out.Authorization=`Bearer ${userToken}`;
  const idem=String(req?.headers?.['idempotency-key']||req?.headers?.['x-idempotency-key']||'').trim();if(idem)out['Idempotency-Key']=idem;
  return out;
}

async function request(req,path,options={}) {
  const cfg=config();
  if(!configured()){const e=new Error('funnemail_service_boundary_not_configured');e.status=503;throw e;}
  const response=await fetch(`${cfg.target_base}${path}`,{method:options.method||'GET',headers:headers(req),body:options.body===undefined?undefined:JSON.stringify(options.body)});
  const text=await response.text();let data=null;try{data=text?JSON.parse(text):null}catch{data=text}
  if(!response.ok){const e=new Error(`funnemail_boundary_http_${response.status}`);e.status=response.status;e.detail=data;throw e;}
  return data;
}

async function probe(){return probeTarget('funnemail');}
module.exports={config,configured,headers,request,probe};
