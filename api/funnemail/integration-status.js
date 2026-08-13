'use strict';
const {probe,tokenFrom,user}=require('../../modules/funnemail/legacyAdapter');
module.exports=async function handler(req,res){
 if(req.method!=='GET')return res.status(405).json({error:'Method Not Allowed'});res.setHeader('Cache-Control','no-store');
 const runtime=await probe();let authenticated=false,currentUser=null;if(tokenFrom(req)){try{currentUser=await user(req);authenticated=true}catch{}}
 return res.status(200).json({contract:'funnemail.integration-status.v1',integration:'complete',adapter:'supabase-rest-edge',runtime,authenticated,user:currentUser,capabilities:{integrated:17,total:17},originals_modified:false});
};