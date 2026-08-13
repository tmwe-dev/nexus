'use strict';

const DEFAULT_URL='https://rxocvyfhsqduowltmfbp.supabase.co';
const DEFAULT_ANON='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4b2N2eWZoc3FkdW93bHRtZmJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyODEyOTcsImV4cCI6MjA5NDg1NzI5N30.zjBnGr2RAmt6q--b3MhiBJXQvxOuo-kO13WX5OYVKf0';

function cfg(){
 const base=String(process.env.NEXUS_FUNNEMAIL_SUPABASE_URL||DEFAULT_URL).replace(/\/$/,'');
 const anon=String(process.env.NEXUS_FUNNEMAIL_ANON_KEY||DEFAULT_ANON);
 return {base,anon,project_id:'rxocvyfhsqduowltmfbp'};
}
function tokenFrom(req){
 return String(req?.headers?.['x-funnemail-access-token']||process.env.NEXUS_FUNNEMAIL_USER_TOKEN||'').trim();
}
function headers(token,extra={}){const c=cfg();return {'apikey':c.anon,'Authorization':`Bearer ${token||c.anon}`,'Content-Type':'application/json',...extra};}
async function parse(r){const t=await r.text();let d=null;try{d=t?JSON.parse(t):null}catch{d=t}if(!r.ok){const e=new Error(`funnemail_http_${r.status}`);e.status=r.status;e.detail=d;throw e;}return d;}
async function rest(req,path,opt={}){const c=cfg(),token=tokenFrom(req);const r=await fetch(`${c.base}/rest/v1${path}`,{method:opt.method||'GET',headers:headers(token,opt.headers||{}),body:opt.body===undefined?undefined:JSON.stringify(opt.body)});return parse(r);}
async function edge(req,name,body={}){const c=cfg(),token=tokenFrom(req);const r=await fetch(`${c.base}/functions/v1/${name}`,{method:'POST',headers:headers(token),body:JSON.stringify(body)});return parse(r);}
async function login(email,password){const c=cfg();const r=await fetch(`${c.base}/auth/v1/token?grant_type=password`,{method:'POST',headers:{apikey:c.anon,'Content-Type':'application/json'},body:JSON.stringify({email:String(email||'').trim().toLowerCase(),password:String(password||'')})});return parse(r);}
async function refresh(refresh_token){const c=cfg();const r=await fetch(`${c.base}/auth/v1/token?grant_type=refresh_token`,{method:'POST',headers:{apikey:c.anon,'Content-Type':'application/json'},body:JSON.stringify({refresh_token})});return parse(r);}
async function user(req){const c=cfg(),token=tokenFrom(req);if(!token)throw new Error('funnemail_user_token_required');const r=await fetch(`${c.base}/auth/v1/user`,{headers:headers(token)});return parse(r);}
function normalizeMessage(r){if(!r)return null;return {id:r.id,channel:r.channel,direction:r.direction,from:{email:r.from_address||'',name:r.from_name||''},to:{email:r.to_address||'',name:r.to_name||''},subject:r.subject||'',body_text:r.body_text||null,body_html:r.body_html||null,date:r.email_date||r.internal_date||r.created_at||null,read_at:r.read_at||null,folder:r.folder||null,category:r.category||null,smart_folder:r.smart_folder||null,thread_id:r.thread_id||null,thread_key:r.thread_key||null,imap_flags:r.imap_flags||null,ai:{summary:r.ai_summary||null,intent:r.ai_intent||null,tags:r.ai_tags||null,keyfacts:r.ai_keyfacts||null,sentiment:r.ai_sentiment||null,suggestion:r.ai_classification_suggestion||null},security:{phishing_risk:r.phishing_risk||null,phishing_reasons:r.phishing_reasons||null},due_at:r.due_at||null};}
module.exports={cfg,tokenFrom,rest,edge,login,refresh,user,normalizeMessage};
