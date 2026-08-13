'use strict';
const { refresh }=require('../../modules/funnemail/legacyAdapter');
module.exports=async function handler(req,res){
 if(req.method!=='POST')return res.status(405).json({error:'Method Not Allowed'});
 const {refresh_token}=req.body||{};if(!refresh_token)return res.status(400).json({error:'REFRESH_TOKEN_REQUIRED'});
 try{const d=await refresh(refresh_token);return res.status(200).json({contract:'funnemail.auth.refresh.v1',access_token:d.access_token,refresh_token:d.refresh_token,expires_in:d.expires_in,expires_at:d.expires_at,user:d.user});}
 catch(error){return res.status(error.status||401).json({error:'FUNNEMAIL_REFRESH_FAILED',message:error.message,detail:error.detail||null});}
};