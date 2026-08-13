'use strict';
const { requireScope }=require('../../modules/security/apiGuard');
const { SCOPES }=require('../../modules/security/scopes');
const { rest }=require('../../modules/funnemail/legacyAdapter');
module.exports=async function handler(req,res){
 if(req.method!=='GET')return res.status(405).json({error:'Method Not Allowed'});const guard=requireScope(req,res,SCOPES.EMAIL_READ);if(!guard.ok)return;
 const safe=async(path,fb=[])=>{try{return await rest(req,path)}catch{return fb}};
 try{
  const msgs=await safe('/channel_messages?channel=eq.email&direction=eq.inbound&deleted_at=is.null&select=email_date,read_at,category&order=email_date.desc.nullslast&limit=2000');
  const drafts=await safe('/email_drafts?select=status&limit=1000');
  const intel=await safe('/funnemail_sender_intel?select=email_domain&limit=1000');
  const today=new Date().toISOString().slice(0,10);const inbound=msgs.length,unread=msgs.filter(x=>!x.read_at).length,oggi=msgs.filter(x=>String(x.email_date||'').slice(0,10)===today).length;
  const categories={};for(const m of msgs){const c=m.category||'non classificata';categories[c]=(categories[c]||0)+1;}
  const draftStatus={};for(const d of drafts){const s=d.status||'unknown';draftStatus[s]=(draftStatus[s]||0)+1;}
  return res.status(200).json({contract:'email.dashboard.v1',source:'funnemail-supabase-adapter',totals:{inbound,unread,today:oggi,drafts:drafts.length,enriched_senders:intel.length},categories,draft_status:draftStatus});
 }catch(error){return res.status(error.status||502).json({error:'FUNNEMAIL_DASHBOARD_UNAVAILABLE',message:error.message});}
};