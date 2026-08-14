'use strict';

const { resolveConnectionConfig } = require('../connections/config');
const { tokenFrom } = require('./legacyAdapter');
const { probeTarget } = require('../connections/targetProbe');
const circuit = require('../resilience/circuitBreaker');

const CIRCUIT_NAME='funnemail-boundary';
const CIRCUIT_OPTIONS={failure_threshold:3,reset_timeout_ms:30000};

function config() { return resolveConnectionConfig('funnemail'); }
function configured() { const cfg=config(); return Boolean(cfg?.target_configured && cfg.target_base); }

function headers(req) {
  const out={Accept:'application/json','Content-Type':'application/json'};
  const userToken=tokenFrom(req);if(userToken)out.Authorization=`Bearer ${userToken}`;
  const idem=String(req?.headers?.['idempotency-key']||req?.headers?.['x-idempotency-key']||'').trim();if(idem)out['Idempotency-Key']=idem;
  return out;
}

async function request(req,path,options={}) {
  const cfg=config();
  if(!configured()){const e=new Error('funnemail_service_boundary_not_configured');e.status=503;e.code='FUNNEMAIL_BOUNDARY_NOT_CONFIGURED';throw e;}
  const gate=circuit.shouldAllow(CIRCUIT_NAME,CIRCUIT_OPTIONS);
  if(!gate.allowed){const e=new Error('funnemail_service_boundary_circuit_open');e.status=503;e.code='FUNNEMAIL_BOUNDARY_CIRCUIT_OPEN';e.detail=circuit.snapshot(CIRCUIT_NAME);throw e;}
  try{
    const timeout=Math.max(1000,Number(process.env.FUNNEMAIL_BOUNDARY_TIMEOUT_MS)||12000);
    const response=await fetch(`${cfg.target_base}${path}`,{method:options.method||'GET',headers:headers(req),body:options.body===undefined?undefined:JSON.stringify(options.body),signal:AbortSignal.timeout(timeout)});
    const text=await response.text();let data=null;try{data=text?JSON.parse(text):null}catch{data=text}
    if(!response.ok){const e=new Error(`funnemail_boundary_http_${response.status}`);e.status=response.status;e.code='FUNNEMAIL_BOUNDARY_HTTP_ERROR';e.detail=data;throw e;}
    circuit.recordSuccess(CIRCUIT_NAME);
    return data;
  }catch(error){
    circuit.recordFailure(CIRCUIT_NAME,CIRCUIT_OPTIONS);
    if(error?.name==='TimeoutError'){error.status=504;error.code='FUNNEMAIL_BOUNDARY_TIMEOUT';}
    throw error;
  }
}

async function probe(){return probeTarget('funnemail');}
module.exports={config,configured,headers,request,probe,circuitState:()=>circuit.snapshot(CIRCUIT_NAME)};
