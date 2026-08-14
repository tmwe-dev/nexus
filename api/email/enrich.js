'use strict';
const { requireEmailAccess }=require('../../modules/funnemail/accessGuard');
const { SCOPES }=require('../../modules/security/scopes');
const { rest,edge }=require('../../modules/funnemail/legacyAdapter');
const service=require('../../modules/funnemail/serviceClient');
module.exports=async function handler(req,res){
 const scope=req.method==='GET'?SCOPES.EMAIL_READ:SCOPES.EMAIL_WRITE;const guard=await requireEmailAccess(req,res,scope);if(!guard.ok)return;
 try{
  if(service.configured()&&(req.method==='GET'||req.method==='POST')){
   const path=req.method==='GET'?`/enrich?domains=${encodeURIComponent(String(req.query.domains||''))}`:'/enrich';
   return res.status(200).json({...await service.request(req,path,{method:req.method,body:req.method==='POST'?(req.body||{}):undefined}),source:'funnemail-service-boundary'});
  }
  if(req.method==='GET'){const domains=String(req.query.domains||'').split(',').map(x=>x.trim().toLowerCase()).filter(Boolean);if(!domains.length)return res.status(400).json({error:'DOMAINS_REQUIRED'});const inClause=domains.map(encodeURIComponent).join(',');const rows=await rest(req,`/funnemail_sender_intel?email_domain=in.(${inClause})&select=email_domain,company_type,country,role_guess,scout_source,evidence`);return res.status(200).json({contract:'email.sender-intel.v1',source:'funnemail-compatibility-adapter',items:rows||[]});}
  if(req.method==='POST'){const data=await edge(req,'funnemail-enrich-inbox',req.body||{});return res.status(200).json({contract:'email.enrich.v1',source:'funnemail-enrich-inbox',data});}
  return res.status(405).json({error:'Method Not Allowed'});
 }catch(error){return res.status(error.status||502).json({error:'FUNNEMAIL_ENRICH_UNAVAILABLE',message:error.message,detail:error.detail||null});}
};
