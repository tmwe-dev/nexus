'use strict';
const { requireEmailAccess }=require('../../modules/funnemail/accessGuard');
const { SCOPES }=require('../../modules/security/scopes');
const { rest }=require('../../modules/funnemail/legacyAdapter');
module.exports=async function handler(req,res){
 if(req.method!=='GET')return res.status(405).json({error:'Method Not Allowed'});const guard=await requireEmailAccess(req,res,SCOPES.EMAIL_READ);if(!guard.ok)return;
 const limit=Math.min(Math.max(Number(req.query.limit)||200,1),1000),offset=Math.max(Number(req.query.offset)||0,0);
 try{let rows=[];try{rows=await rest(req,'/rpc/fn_list_all_senders',{method:'POST',body:{p_limit:limit,p_offset:offset}})}catch{const sample=await rest(req,`/channel_messages?channel=eq.email&direction=eq.inbound&deleted_at=is.null&select=from_address,subject,email_date&order=email_date.desc.nullslast&limit=${Math.min(limit*5,5000)}`);const m=new Map();for(const r of sample||[]){const e=String(r.from_address||'').toLowerCase().trim();if(!e)continue;const x=m.get(e)||{email:e,count:0,last:r.email_date,sample:r.subject||''};x.count++;m.set(e,x);}rows=[...m.values()].sort((a,b)=>b.count-a.count).slice(0,limit);}return res.status(200).json({contract:'email.senders.v1',source:'funnemail',items:rows||[]});}
 catch(error){return res.status(error.status||502).json({error:'FUNNEMAIL_SENDERS_UNAVAILABLE',message:error.message,detail:error.detail||null});}
};