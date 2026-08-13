'use strict';
const { user }=require('../../modules/funnemail/legacyAdapter');
module.exports=async function handler(req,res){
 if(req.method!=='GET')return res.status(405).json({error:'Method Not Allowed'});
 try{return res.status(200).json({contract:'funnemail.auth.user.v1',user:await user(req)});}
 catch(error){return res.status(error.status||401).json({error:'FUNNEMAIL_USER_UNAVAILABLE',message:error.message,detail:error.detail||null});}
};