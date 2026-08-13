'use strict';
const CAPABILITIES=[
{name:'email.message.search.v1',source:'channel_messages',status:'integrated',route:'/api/email/messages'},
{name:'email.message.read.v1',source:'channel_messages',status:'integrated',route:'/api/email/message?id='},
{name:'email.message.status.v1',source:'channel_messages+imap',status:'integrated',route:'/api/email/status'},
{name:'email.draft.list.v1',source:'email_drafts',status:'integrated',route:'/api/email/drafts'},
{name:'email.draft.create.v1',source:'email_drafts',status:'integrated',route:'/api/email/drafts'},
{name:'email.draft.action.v1',source:'email_drafts+send-direct',status:'integrated',route:'/api/email/draft-action'},
{name:'email.send.v1',source:'funnemail-send-direct',status:'integrated',route:'/api/email/send'},
{name:'email.sync.v1',source:'funnemail-imap-sync',status:'integrated',route:'/api/email/sync'},
{name:'email.classify.v1',source:'funnemail-classify',status:'integrated',route:'/api/email/classify'},
{name:'email.reclassify.v1',source:'funnemail-reclassify-*',status:'integrated',route:'/api/email/reclassify'},
{name:'email.compose.v1',source:'funnemail-compose',status:'integrated',route:'/api/email/compose'},
{name:'email.dashboard.v1',source:'channel_messages+email_drafts',status:'integrated',route:'/api/email/dashboard'},
{name:'email.senders.v1',source:'fn_list_all_senders',status:'integrated',route:'/api/email/senders'},
{name:'email.sender-intel.v1',source:'funnemail_sender_intel',status:'integrated',route:'/api/email/enrich'},
{name:'email.rules.v1',source:'email_address_rules+intent_rules',status:'integrated',route:'/api/email/rules'},
{name:'email.tasks.v1',source:'funnemail_tasks',status:'integrated',route:'/api/email/tasks'},
{name:'funnemail.auth.v1',source:'supabase-auth',status:'integrated',route:'/api/funnemail/login'}
];
module.exports=async function handler(req,res){if(req.method!=='GET')return res.status(405).json({error:'Method not allowed'});res.setHeader('Cache-Control','no-store');return res.status(200).json({service:'funnemail',status:'integration-complete-runtime-auth-required',integrated:CAPABILITIES.length,total:CAPABILITIES.length,capabilities:CAPABILITIES,rules:['Funnemail remains owner of mailbox state.','Nexus uses a controlled adapter over the existing Supabase REST/Edge surface.','Original Funnemail repository is never modified.','User-scoped operations require a valid Funnemail access token.']});};