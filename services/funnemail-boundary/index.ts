// NEXUS-OWNED INTEGRATION COPY — canonical source for the new TMWE infrastructure.
// The original Funnemail repository is a read-only source of truth from this point forward.
// This boundary is deployed into the Funnemail Supabase project so RLS and user ownership stay with Funnemail.
// Deploy with verify_jwt=false: this function validates the delegated Funnemail user JWT itself.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = String(Deno.env.get("SUPABASE_URL") || "").replace(/\/$/, "");
const SUPABASE_ANON_KEY = String(Deno.env.get("SUPABASE_ANON_KEY") || "");

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, idempotency-key, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Cache-Control": "no-store"
};

const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { ...CORS, "Content-Type": "application/json" }
});

function bearer(req: Request): string {
  const raw = String(req.headers.get("authorization") || "");
  const match = raw.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : "";
}

async function userContext(req: Request) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return { error: json({ error: "SERVICE_NOT_CONFIGURED" }, 503) };
  const token = bearer(req);
  if (!token) return { error: json({ error: "FUNNEMAIL_USER_TOKEN_REQUIRED" }, 401) };
  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false }
  });
  const { data, error } = await client.auth.getUser(token);
  if (error || !data?.user) return { error: json({ error: "FUNNEMAIL_USER_TOKEN_INVALID" }, 401) };
  return { token, client, user: data.user };
}

function pathAfterFunction(req: Request): string[] {
  const parts = new URL(req.url).pathname.split("/").filter(Boolean);
  const index = parts.lastIndexOf("funnemail-nexus-v1");
  return index >= 0 ? parts.slice(index + 1) : [];
}

function cleanSearch(value: string): string {
  return String(value || "").replace(/[,()]/g, " ").replace(/\s+/g, " ").trim().slice(0, 200);
}

function normalizeMessage(row: Record<string, unknown> | null) {
  if (!row) return null;
  return {
    id: row.id,
    channel: row.channel,
    direction: row.direction,
    from: { email: row.from_address || "", name: row.from_name || "" },
    to: { email: row.to_address || "", name: row.to_name || "" },
    subject: row.subject || "",
    body_text: row.body_text || null,
    body_html: row.body_html || null,
    date: row.email_date || row.internal_date || row.created_at || null,
    read_at: row.read_at || null,
    folder: row.folder || null,
    category: row.category || null,
    smart_folder: row.smart_folder || null,
    thread_id: row.thread_id || null,
    thread_key: row.thread_key || null,
    imap_flags: row.imap_flags || null,
    ai: {
      summary: row.ai_summary || null,
      intent: row.ai_intent || null,
      tags: row.ai_tags || null,
      keyfacts: row.ai_keyfacts || null,
      sentiment: row.ai_sentiment || null,
      suggestion: row.ai_classification_suggestion || null
    },
    security: {
      phishing_risk: row.phishing_risk || null,
      phishing_reasons: row.phishing_reasons || null
    },
    due_at: row.due_at || null
  };
}

async function callExistingEdge(req: Request, name: string, body: unknown, token: string) {
  const headers: Record<string, string> = {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json"
  };
  const idempotencyKey = req.headers.get("idempotency-key");
  if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;
  const response = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body || {})
  });
  const text = await response.text();
  let data: unknown = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!response.ok) return { error: json({ error: "UPSTREAM_EDGE_FAILED", upstream: name, status: response.status }, 502) };
  return { data };
}

const MESSAGE_LIST_COLUMNS = "id,channel,direction,from_address,from_name,to_address,to_name,subject,email_date,internal_date,created_at,read_at,folder,category,smart_folder,thread_id,thread_key,imap_flags,ai_classification_suggestion,ai_summary,ai_intent,ai_tags,ai_keyfacts,ai_sentiment,phishing_risk,phishing_reasons,due_at";
const MESSAGE_DETAIL_COLUMNS = `${MESSAGE_LIST_COLUMNS},body_text,body_html`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });

  const parts = pathAfterFunction(req);
  const resource = parts[0] || "health";

  if (req.method === "GET" && resource === "health") {
    return json({
      service: "funnemail-nexus-v1",
      owner: "funnemail",
      status: "ok",
      auth: "delegated-funnemail-user-jwt",
      contracts: [
        "email.message.search.v1",
        "email.message.read.v1",
        "email.draft.create.v1",
        "email.send.v1",
        "email.sync.v1",
        "email.classify.v1"
      ]
    });
  }

  const context = await userContext(req);
  if ("error" in context) return context.error;
  const { client, token, user } = context;
  const url = new URL(req.url);

  if (req.method === "GET" && resource === "messages" && !parts[1]) {
    const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 50, 1), 500);
    const offset = Math.max(Number(url.searchParams.get("offset")) || 0, 0);
    const search = cleanSearch(url.searchParams.get("search") || "");
    let query = client.from("channel_messages")
      .select(MESSAGE_LIST_COLUMNS)
      .eq("channel", "email")
      .eq("direction", "inbound")
      .is("deleted_at", null)
      .order("email_date", { ascending: false, nullsFirst: false })
      .range(offset, offset + limit - 1);
    if (search) query = query.or(`subject.ilike.%${search}%,from_address.ilike.%${search}%,from_name.ilike.%${search}%`);
    const { data, error } = await query;
    if (error) return json({ error: "MESSAGE_SEARCH_FAILED" }, 502);
    return json({ contract: "email.message.search.v1", items: (data || []).map(normalizeMessage), page: { limit, offset, count: data?.length || 0 } });
  }

  if (req.method === "GET" && resource === "messages" && parts[1]) {
    const id = String(parts[1] || "").trim();
    const { data, error } = await client.from("channel_messages").select(MESSAGE_DETAIL_COLUMNS).eq("id", id).maybeSingle();
    if (error) return json({ error: "MESSAGE_READ_FAILED" }, 502);
    if (!data) return json({ error: "MESSAGE_NOT_FOUND" }, 404);
    return json({ contract: "email.message.read.v1", data: normalizeMessage(data) });
  }

  if (req.method === "POST" && resource === "drafts") {
    const body = await req.json().catch(() => ({})) as Record<string, unknown>;
    if (!body.subject && !body.body && !body.html_body) return json({ error: "EMAIL_DRAFT_CONTENT_REQUIRED" }, 400);
    const payload: Record<string, unknown> = {
      subject: String(body.subject || ""),
      html_body: body.html_body || body.body || "",
      status: body.status || "in_attesa"
    };
    if (body.source_message_id) payload.source_message_id = body.source_message_id;
    if (body.to) payload.to_address = body.to;
    if (body.category) payload.category = body.category;
    const { data, error } = await client.from("email_drafts").insert(payload).select("id,source_message_id,subject,html_body,status,sent_at,created_at,category,queue_started_at").single();
    if (error) return json({ error: "DRAFT_CREATE_FAILED" }, 502);
    return json({ contract: "email.draft.create.v1", data }, 201);
  }

  if (req.method === "POST" && resource === "send") {
    const body = await req.json().catch(() => ({})) as Record<string, unknown>;
    if (!body.to || !body.subject) return json({ error: "EMAIL_TO_AND_SUBJECT_REQUIRED" }, 400);
    const recipients = Array.isArray(body.to) ? body.to : [body.to];
    const payload = {
      to: recipients.filter(Boolean),
      subject: String(body.subject || ""),
      html_body: body.html_body || body.html || body.body || "",
      text_body: body.text_body || body.text || body.body || "",
      user_id: user.id,
      ...(body.reply_to_message_id ? { reply_to_message_id: body.reply_to_message_id } : {}),
      ...(body.attachments ? { attachments: body.attachments } : {})
    };
    const upstream = await callExistingEdge(req, "funnemail-send-direct", payload, token);
    if ("error" in upstream) return upstream.error;
    return json({ contract: "email.send.v1", data: upstream.data });
  }

  if (req.method === "POST" && resource === "sync") {
    const body = await req.json().catch(() => ({}));
    const upstream = await callExistingEdge(req, "funnemail-imap-sync", body, token);
    if ("error" in upstream) return upstream.error;
    return json({ contract: "email.sync.v1", data: upstream.data });
  }

  if (req.method === "POST" && resource === "classify") {
    const body = await req.json().catch(() => ({})) as Record<string, unknown>;
    if (!body.message_id && !body.id && !body.message) return json({ error: "EMAIL_CLASSIFY_INPUT_REQUIRED" }, 400);
    const upstream = await callExistingEdge(req, "funnemail-classify", body, token);
    if ("error" in upstream) return upstream.error;
    return json({ contract: "email.classify.v1", data: upstream.data });
  }

  return json({ error: "ROUTE_NOT_FOUND" }, 404);
});
