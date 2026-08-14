'use strict';
const { login }=require('../../modules/funnemail/legacyAdapter');
const service=require('../../modules/funnemail/serviceClient');
module.exports=async function handler(req,res){
 if(req.method!=='POST')return res.status(405).json({error:'Method Not Allowed'});
 const {email,password}=req.body||{};if(!email||!password)return res.status(400).json({error:'EMAIL_AND_PASSWORD_REQUIRED'});
 try{
  if(service.configured())return res.status(200).json(await service.request(req,'/auth/login',{method:'POST',body:{email,password}}));
  const d=await login(email,password);return res.status(200).json({contract:'funnemail.auth.login.v1',access_token:d.access_token,refresh_token:d.refresh_token,expires_in:d.expires_in,expires_at:d.expires_at,user:d.user,source:'funnemail-compatibility-adapter'});
 }catch(error){return res.status(error.status||401).json({error:'FUNNEMAIL_LOGIN_FAILED',message:error.message,detail:error.detail||null});}
};
