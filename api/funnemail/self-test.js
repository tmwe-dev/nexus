'use strict';
const {probe,tokenFrom,user,rest}=require('../../modules/funnemail/legacyAdapter');
module.exports=async function handler(req,res){
 if(req.method!=='GET')return res.status(405).json({error:'Method Not Allowed'});res.setHeader('Cache-Control','no-store');
 const checks=[];const runtime=await probe();checks.push({id:'runtime',ok:runtime.reachable,detail:runtime});
 const hasToken=Boolean(tokenFrom(req));let authOk=false;if(hasToken){try{const u=await user(req);authOk=true;checks.push({id:'user_auth',ok:true,detail:{id:u.id,email:u.email}})}catch(e){checks.push({id:'user_auth',ok:false,detail:e.message})}}else checks.push({id:'user_auth',ok:null,detail:'not_run_no_user_token'});
 if(authOk){try{const rows=await rest(req,'/channel_messages?channel=eq.email&direction=eq.inbound&deleted_at=is.null&select=id,subject,email_date&order=email_date.desc.nullslast&limit=1');checks.push({id:'safe_inbox_read',ok:true,detail:{rows:(rows||[]).length}})}catch(e){checks.push({id:'safe_inbox_read',ok:false,detail:e.message})}}else checks.push({id:'safe_inbox_read',ok:null,detail:'not_run_without_authenticated_user'});
 const required=checks.filter(x=>x.ok!==null),passed=required.filter(x=>x.ok).length;return res.status(200).json({contract:'funnemail.self-test.v1',non_destructive:true,runtime_ready:runtime.reachable,authenticated:authOk,passed,total:required.length,checks,originals_modified:false});
};