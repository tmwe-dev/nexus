'use strict';
const { requireEmailAccess }=require('../../modules/funnemail/accessGuard');
const { SCOPES }=require('../../modules/security/scopes');
const { edge }=require('../../modules/funnemail/legacyAdapter');
const service=require('../../modules/funnemail/serviceClient');

async function classifyViaBoundary(req,messageId){
 const response=await service.request(req,'/classify',{method:'POST',body:{message_id:messageId}});
 return response?.data??response;
}

module.exports=async function handler(req,res){
 if(req.method!=='POST')return res.status(405).json({error:'Method Not Allowed'});
 const guard=await requireEmailAccess(req,res,SCOPES.EMAIL_CLASSIFY);if(!guard.ok)return;
 const b=req.body||{};
 const ids=[...(Array.isArray(b.message_ids)?b.message_ids:[]),...(b.message_id?[b.message_id]:[])].map(x=>String(x||'').trim()).filter(Boolean);
 const unique=[...new Set(ids)];
 if(!unique.length)return res.status(400).json({error:'MESSAGE_ID_REQUIRED'});
 try{
  if(service.configured()){
   if(unique.length===1){
    const data=await classifyViaBoundary(req,unique[0]);
    return res.status(200).json({contract:'email.reclassify.v1',source:'funnemail-service-boundary',mode:'single',message_id:unique[0],data});
   }
   const results=[];
   for(const id of unique){
    try{results.push({message_id:id,ok:true,data:await classifyViaBoundary(req,id)});}
    catch(error){results.push({message_id:id,ok:false,error:error instanceof Error?error.message:String(error)});}
   }
   const failed=results.filter(x=>!x.ok);
   return res.status(failed.length?207:200).json({contract:'email.reclassify.v1',source:'funnemail-service-boundary',mode:'explicit-message-batch',requested:unique.length,processed:results.length-failed.length,failed:failed.length,results});
  }

  // Rollback-only compatibility path. The historical single-message function may no longer exist;
  // keep this path only while migration gates require an explicit legacy escape hatch.
  if(unique.length===1){
   const data=await edge(req,'funnemail-classify',{message_id:unique[0]});
   return res.status(200).json({contract:'email.reclassify.v1',source:'funnemail-classify-compatibility',mode:'single',message_id:unique[0],data});
  }
  const results=[];
  for(const id of unique){
   try{results.push({message_id:id,ok:true,data:await edge(req,'funnemail-classify',{message_id:id})});}
   catch(error){results.push({message_id:id,ok:false,error:error instanceof Error?error.message:String(error)});}
  }
  const failed=results.filter(x=>!x.ok);
  return res.status(failed.length?207:200).json({contract:'email.reclassify.v1',source:'funnemail-classify-compatibility',mode:'explicit-message-batch',requested:unique.length,processed:results.length-failed.length,failed:failed.length,results});
 }catch(error){return res.status(error.status||502).json({error:'FUNNEMAIL_RECLASSIFY_UNAVAILABLE',message:error.message,detail:error.detail||null});}
};