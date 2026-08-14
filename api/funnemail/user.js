'use strict';
const { user }=require('../../modules/funnemail/legacyAdapter');
const service=require('../../modules/funnemail/serviceClient');
module.exports=async function handler(req,res){
 if(req.method!=='GET')return res.status(405).json({error:'Method Not Allowed'});
 try{
  if(service.configured())return res.status(200).json(await service.request(req,'/auth/user'));
  return res.status(200).json({contract:'funnemail.auth.user.v1',user:await user(req),source:'funnemail-compatibility-adapter'});
 }catch(error){return res.status(error.status||401).json({error:'FUNNEMAIL_USER_UNAVAILABLE',message:error.message,detail:error.detail||null});}
};
