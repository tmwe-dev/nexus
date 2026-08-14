// NEXUS-OWNED INTEGRATION BOUNDARY — canonical source for the new TMWE infrastructure.
// The original Funnemail repository is read-only. User-scoped access preserves Funnemail RLS.
// Deploy with verify_jwt=false because this function performs explicit auth validation.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL=String(Deno.env.get("SUPABASE_URL")||"").replace(/\/$/,"");
const SUPABASE_ANON_KEY=String(Deno.env.get("SUPABASE_ANON_KEY")||"");
const CORS={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, idempotency-key, content-type","Access-Control-Allow-Methods":"GET, POST, OPTIONS","Cache-Control":"no-store"};
const json=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers:{...CORS,"Content-Type":"application/json"}});
const publicClient=()=>createClient(SUPABASE_URL,SUPABASE_ANON_KEY,{auth:{persistSession:false,autoRefreshToken:false}});

function bearer(req:Request):string{const raw=String(req.headers.get("authorization")||"");const match=raw.match(/^Bearer\s+(.+)$/i);return match?match[1].trim():"";}
function pathAfterFunction(req:Request):string[]{const parts=new URL(req.url).pathname.split("/").filter(Boolean),index=parts.lastIndexOf("funnemail-nexus-v1");return index>=0?parts.slice(index+1):[];}
function cleanSearch(value:string):string{return String(value||"").replace(/[,()]/g," ").replace(/\s+/g," ").trim().slice(0,200);}
function sessionPayload(session:any){return {access_token:session?.access_token,refresh_token:session?.refresh_token,expires_in:session?.expires_in,expires_at:session?.expires_at,user:session?.user};}

async function userContext(req:Request){
 if(!SUPABASE_URL||!SUPABASE_ANON_KEY)return {error:json({error:"SERVICE_NOT_CONFIGURED"},503)};
 const token=bearer(req);if(!token)return {error:json({error:"FUNNEMAIL_USER_TOKEN_REQUIRED"},401)};
 const client=createClient(SUPABASE_URL,SUPABASE_ANON_KEY,{global:{headers:{Authorization:`Bearer ${token}`}},auth:{persistSession:false,autoRefreshToken:false}});
 const {data,error}=await client.auth.getUser(token);if(error||!data?.user)return {error:json({error:"FUNNEMAIL_USER_TOKEN_INVALID"},401)};
 return {token,client,user:data.user};
}

function normalizeMessage(row:Record<string,unknown>|null){if(!row)return null;return {id:row.id,channel:row.channel,direction:row.direction,from:{email:row.from_address||"",name:row.from_name||""},to:{email:row.to_address||"",name:row.to_name||""},subject:row.subject||"",body_text:row.body_text||null,body_html:row.body_html||null,date:row.email_date||row.internal_date||row.created_at||null,read_at:row.read_at||null,folder:row.folder||null,category:row.category||null,smart_folder:row.smart_folder||null,thread_id:row.thread_id||null,thread_key:row.thread_key||null,imap_flags:row.imap_flags||null,ai:{summary:row.ai_summary||null,intent:row.ai_intent||null,tags:row.ai_tags||null,keyfacts:row.ai_keyfacts||null,sentiment:row.ai_sentiment||null,suggestion:row.ai_classification_suggestion||null},security:{phishing_risk:row.phishing_risk||null,phishing_reasons:row.phishing_reasons||null},due_at:row.due_at||null};}

async function callExistingEdge(req:Request,name:string,body:unknown,token:string){
 const headers:Record<string,string>={apikey:SUPABASE_ANON_KEY,Authorization:`Bearer ${token}`,"Content-Type":"application/json"};const idem=req.headers.get("idempotency-key");if(idem)headers["Idempotency-Key"]=idem;
 const response=await fetch(`${SUPABASE_URL}/functions/v1/${name}`,{method:"POST",headers,body:JSON.stringify(body||{})});const text=await response.text();let data:unknown=null;try{data=text?JSON.parse(text):null}catch{data=text}if(!response.ok)return {error:json({error:"UPSTREAM_EDGE_FAILED",upstream:name,status:response.status},502)};return {data};
}

const MESSAGE_LIST_COLUMNS="id,channel,direction,from_address,from_name,to_address,to_name,subject,email_date,internal_date,created_at,read_at,folder,category,smart_folder,thread_id,thread_key,imap_flags,ai_classification_suggestion,ai_summary,ai_intent,ai_tags,ai_keyfacts,ai_sentiment,phishing_risk,phishing_reasons,due_at";
const MESSAGE_DETAIL_COLUMNS=`${MESSAGE_LIST_COLUMNS},body_text,body_html`;

Deno.serve(async(req:Request)=>{
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers:CORS});
 const parts=pathAfterFunction(req),resource=parts[0]||"health",sub=parts[1]||"";
 if(req.method==="GET"&&resource==="health")return json({service:"funnemail-nexus-v1",owner:"funnemail",status:"ok",auth:"delegated-funnemail-user-jwt",contracts:["funnemail.auth.login.v1","funnemail.auth.refresh.v1","funnemail.auth.user.v1","email.message.search.v1","email.message.read.v1","email.dashboard.v1","email.message.status.v1","email.draft.create.v1","email.send.v1","email.sync.v1","email.classify.v1"]});
 if(!SUPABASE_URL||!SUPABASE_ANON_KEY)return json({error:"SERVICE_NOT_CONFIGURED"},503);

 if(req.method==="POST"&&resource==="auth"&&sub==="login"){
  const body=await req.json().catch(()=>({})) as Record<string,unknown>,email=String(body.email||"").trim(),password=String(body.password||"");if(!email||!password)return json({error:"EMAIL_AND_PASSWORD_REQUIRED"},400);
  const {data,error}=await publicClient().auth.signInWithPassword({email,password});if(error||!data.session)return json({error:"FUNNEMAIL_LOGIN_FAILED"},401);return json({contract:"funnemail.auth.login.v1",...sessionPayload(data.session)});
 }
 if(req.method==="POST"&&resource==="auth"&&sub==="refresh"){
  const body=await req.json().catch(()=>({})) as Record<string,unknown>,refresh_token=String(body.refresh_token||"").trim();if(!refresh_token)return json({error:"REFRESH_TOKEN_REQUIRED"},400);
  const {data,error}=await publicClient().auth.refreshSession({refresh_token});if(error||!data.session)return json({error:"FUNNEMAIL_REFRESH_FAILED"},401);return json({contract:"funnemail.auth.refresh.v1",...sessionPayload(data.session)});
 }

 const context=await userContext(req);if("error" in context)return context.error;const {client,token,user}=context;const url=new URL(req.url);
 if(req.method==="GET"&&resource==="auth"&&sub==="user")return json({contract:"funnemail.auth.user.v1",user:{id:user.id,email:user.email,app_metadata:user.app_metadata,created_at:user.created_at}});

 if(req.method==="GET"&&resource==="messages"&&!sub){const limit=Math.min(Math.max(Number(url.searchParams.get("limit"))||50,1),500),offset=Math.max(Number(url.searchParams.get("offset"))||0,0),search=cleanSearch(url.searchParams.get("search")||"");let query=client.from("channel_messages").select(MESSAGE_LIST_COLUMNS).eq("channel","email").eq("direction","inbound").is("deleted_at",null).order("email_date",{ascending:false,nullsFirst:false}).range(offset,offset+limit-1);if(search)query=query.or(`subject.ilike.%${search}%,from_address.ilike.%${search}%,from_name.ilike.%${search}%`);const {data,error}=await query;if(error)return json({error:"MESSAGE_SEARCH_FAILED"},502);return json({contract:"email.message.search.v1",items:(data||[]).map(normalizeMessage),page:{limit,offset,count:data?.length||0}});}
 if(req.method==="GET"&&resource==="messages"&&sub){const {data,error}=await client.from("channel_messages").select(MESSAGE_DETAIL_COLUMNS).eq("id",sub).maybeSingle();if(error)return json({error:"MESSAGE_READ_FAILED"},502);if(!data)return json({error:"MESSAGE_NOT_FOUND"},404);return json({contract:"email.message.read.v1",data:normalizeMessage(data)});}

 if(req.method==="GET"&&resource==="dashboard"){
  const [mr,dr,sr]=await Promise.all([client.from("channel_messages").select("email_date,read_at,category").eq("channel","email").eq("direction","inbound").is("deleted_at",null).limit(2000),client.from("email_drafts").select("status").limit(1000),client.from("funnemail_sender_intel").select("email_domain").limit(1000)]);if(mr.error)return json({error:"DASHBOARD_MESSAGES_FAILED"},502);
  const messages=mr.data||[],drafts=dr.error?[]:(dr.data||[]),senders=sr.error?[]:(sr.data||[]),today=new Date().toISOString().slice(0,10),categories:Record<string,number>={},draftStatus:Record<string,number>={};for(const m of messages){const c=String(m.category||"non classificata");categories[c]=(categories[c]||0)+1}for(const d of drafts){const s=String(d.status||"unknown");draftStatus[s]=(draftStatus[s]||0)+1}return json({contract:"email.dashboard.v1",totals:{inbound:messages.length,unread:messages.filter(m=>!m.read_at).length,today:messages.filter(m=>String(m.email_date||"").slice(0,10)===today).length,drafts:drafts.length,enriched_senders:senders.length},categories,draft_status:draftStatus});
 }

 if(req.method==="POST"&&resource==="status"){
  const body=await req.json().catch(()=>({})) as Record<string,unknown>,id=String(body.message_id||body.id||"").trim(),action=String(body.action||"").toLowerCase();if(!id||!action)return json({error:"MESSAGE_ID_AND_ACTION_REQUIRED"},400);
  if(action==="read"||action==="unread"){const seen=action==="read",{error}=await client.from("channel_messages").update({read_at:seen?new Date().toISOString():null}).eq("id",id);if(error)return json({error:"MESSAGE_STATUS_UPDATE_FAILED"},502);const up=await callExistingEdge(req,"funnemail-imap-mark-seen",{message_ids:[id],seen},token);if("error" in up)return up.error}
  else if(action==="trash"||action==="archive"){const payload:Record<string,unknown>={message_id:id,user_id:user.id};payload[action==="trash"?"trashed_at":"archived_at"]=new Date().toISOString();const {error}=await client.from("funnemail_message_status").upsert(payload,{onConflict:"message_id,user_id"});if(error)return json({error:"MESSAGE_STATUS_UPDATE_FAILED"},502);const up=await callExistingEdge(req,"funnemail-imap-move",{message_ids:[id],target:action},token);if("error" in up)return up.error}
  else if(action==="flag"||action==="unflag"){const up=await callExistingEdge(req,"funnemail-imap-mark-flag",{message_ids:[id],flagged:action==="flag"},token);if("error" in up)return up.error}else return json({error:"UNSUPPORTED_EMAIL_ACTION"},400);return json({contract:"email.message.status.v1",message_id:id,action,ok:true});
 }

 if(req.method==="POST"&&resource==="drafts"){
  const body=await req.json().catch(()=>({})) as Record<string,unknown>;if(!body.subject&&!body.body&&!body.html_body)return json({error:"EMAIL_DRAFT_CONTENT_REQUIRED"},400);const payload:Record<string,unknown>={subject:String(body.subject||""),html_body:body.html_body||body.body||"",status:body.status||"in_attesa"};if(body.source_message_id)payload.source_message_id=body.source_message_id;if(body.to)payload.to_address=body.to;if(body.category)payload.category=body.category;const {data,error}=await client.from("email_drafts").insert(payload).select("id,source_message_id,subject,html_body,status,sent_at,created_at,category,queue_started_at").single();if(error)return json({error:"DRAFT_CREATE_FAILED"},502);return json({contract:"email.draft.create.v1",data},201);
 }
 if(req.method==="POST"&&resource==="send"){
  const body=await req.json().catch(()=>({})) as Record<string,unknown>;if(!body.to||!body.subject)return json({error:"EMAIL_TO_AND_SUBJECT_REQUIRED"},400);const recipients=Array.isArray(body.to)?body.to:[body.to],payload={to:recipients.filter(Boolean),subject:String(body.subject||""),html_body:body.html_body||body.html||body.body||"",text_body:body.text_body||body.text||body.body||"",user_id:user.id,...(body.reply_to_message_id?{reply_to_message_id:body.reply_to_message_id}:{}),...(body.attachments?{attachments:body.attachments}:{})};const up=await callExistingEdge(req,"funnemail-send-direct",payload,token);if("error" in up)return up.error;return json({contract:"email.send.v1",data:up.data});
 }
 if(req.method==="POST"&&resource==="sync"){const body=await req.json().catch(()=>({}));const up=await callExistingEdge(req,"funnemail-imap-sync",body,token);if("error" in up)return up.error;return json({contract:"email.sync.v1",data:up.data});}
 if(req.method==="POST"&&resource==="classify"){const body=await req.json().catch(()=>({})) as Record<string,unknown>;if(!body.message_id&&!body.id&&!body.message)return json({error:"EMAIL_CLASSIFY_INPUT_REQUIRED"},400);const up=await callExistingEdge(req,"funnemail-classify",body,token);if("error" in up)return up.error;return json({contract:"email.classify.v1",data:up.data});}
 return json({error:"ROUTE_NOT_FOUND"},404);
});
