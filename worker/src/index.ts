interface Env {
  DB: D1Database;
  ALLOWED_ORIGIN: string;
  PASTE_IP_HASH_SALT: string;
}

type Drawing = {
  width: number;
  height: number;
  strokes: Array<{
    color: string;
    width: number;
    points: Array<{ x: number; y: number; pressure: number }>;
  }>;
};

const LANGUAGES = new Set(["markdown", "text", "javascript", "typescript", "python", "shell", "json"]);
const EXPIRIES: Record<string, number | null> = {
  "1h": 60 * 60,
  "1d": 24 * 60 * 60,
  "7d": 7 * 24 * 60 * 60,
  "30d": 30 * 24 * 60 * 60,
  never: null,
};
const ID_PATTERN = /^[a-zA-Z0-9_-]{6,16}$/;
const MAX_TITLE_CHARS = 120;
const MAX_CONTENT_BYTES = 100_000;
const MAX_STROKES = 2_000;
const MAX_POINTS = 40_000;
const RATE_LIMIT = 20;
const RATE_WINDOW_SECONDS = 60 * 60;

const worker = {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get("origin");
    const cors = corsHeaders(origin, env.ALLOWED_ORIGIN);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: cors ? 204 : 403, headers: cors });
    }

    const url = new URL(request.url);
    if (url.pathname === "/health" && request.method === "GET") {
      return json({ ok: true }, 200, cors);
    }

    const match = url.pathname.match(/^\/pastes(?:\/([^/]+))?$/);
    if (!match) return json({ error: "Not found" }, 404, cors);

    try {
      if (request.method === "POST" && !match[1]) return createPaste(request, env, cors);
      if (request.method === "GET" && match[1]) return getPaste(match[1], env, cors);
      if (request.method === "DELETE" && match[1]) return deletePaste(request, match[1], env, cors);
      return json({ error: "Method not allowed" }, 405, cors);
    } catch (error) {
      console.error(error);
      return json({ error: "Internal server error" }, 500, cors);
    }
  },

  async scheduled(_controller: ScheduledController, env: Env): Promise<void> {
    await env.DB.prepare("DELETE FROM pastes WHERE expires_at IS NOT NULL AND expires_at <= ?")
      .bind(new Date().toISOString())
      .run();
    await env.DB.prepare("DELETE FROM rate_limits WHERE window_start < ?")
      .bind(Math.floor(Date.now() / 1000) - RATE_WINDOW_SECONDS * 2)
      .run();
  },
};

export default worker;

async function createPaste(request: Request, env: Env, cors: Headers): Promise<Response> {
  const origin = request.headers.get("origin");
  if (origin && origin !== env.ALLOWED_ORIGIN && origin !== "http://localhost:3000") {
    return json({ error: "Origin not allowed" }, 403, cors);
  }
  if (!request.headers.get("content-type")?.startsWith("application/json")) {
    return json({ error: "Expected application/json" }, 415, cors);
  }
  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (declaredLength > 1_000_000) return json({ error: "Request too large" }, 413, cors);

  const ip = request.headers.get("cf-connecting-ip") ?? "unknown";
  const ipHash = await sha256(`${env.PASTE_IP_HASH_SALT}:${ip}`);
  if (!(await allowRequest(ipHash, env.DB))) {
    return json({ error: "Too many pastes. Try again later." }, 429, cors, { "retry-after": "3600" });
  }

  const body = (await request.json()) as Record<string, unknown>;
  if (body.website) return json({ error: "Invalid request" }, 400, cors);
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const content = typeof body.content === "string" ? body.content : "";
  const language = typeof body.language === "string" ? body.language : "text";
  const expiresIn = typeof body.expiresIn === "string" ? body.expiresIn : "7d";
  const drawing = body.drawing === null || body.drawing === undefined ? null : validateDrawing(body.drawing);

  if (!drawing && body.drawing) return json({ error: "Invalid drawing" }, 400, cors);
  if (title.length > MAX_TITLE_CHARS) return json({ error: "Title is too long" }, 400, cors);
  if (!content.trim() && !drawing?.strokes.length) return json({ error: "Paste is empty" }, 400, cors);
  if (new TextEncoder().encode(content).byteLength > MAX_CONTENT_BYTES) {
    return json({ error: "Text is too large" }, 413, cors);
  }
  if (!LANGUAGES.has(language)) return json({ error: "Invalid language" }, 400, cors);
  if (!(expiresIn in EXPIRIES)) return json({ error: "Invalid expiry" }, 400, cors);

  const now = new Date();
  const ttl = EXPIRIES[expiresIn];
  const expiresAt = ttl === null ? null : new Date(now.getTime() + ttl * 1000).toISOString();
  const id = randomString(8);
  const deleteToken = randomString(32);
  const deleteTokenHash = await sha256(deleteToken);

  await env.DB.prepare(
    `INSERT INTO pastes
      (id, title, content, language, drawing, created_at, expires_at, delete_token_hash)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      id,
      title,
      content,
      language,
      drawing ? JSON.stringify(drawing) : null,
      now.toISOString(),
      expiresAt,
      deleteTokenHash,
    )
    .run();

  return json(
    {
      id,
      title,
      content,
      language,
      drawing,
      created_at: now.toISOString(),
      expires_at: expiresAt,
      delete_token: deleteToken,
    },
    201,
    cors,
  );
}

async function getPaste(id: string, env: Env, cors: Headers): Promise<Response> {
  if (!ID_PATTERN.test(id)) return json({ error: "Paste not found" }, 404, cors);
  const row = await env.DB.prepare(
    `SELECT id, title, content, language, drawing, created_at, expires_at
     FROM pastes
     WHERE id = ? AND (expires_at IS NULL OR expires_at > ?)`,
  )
    .bind(id, new Date().toISOString())
    .first<Record<string, string | null>>();
  if (!row) return json({ error: "Paste not found" }, 404, cors);

  return json(
    {
      ...row,
      drawing: row.drawing ? JSON.parse(row.drawing) : null,
    },
    200,
    cors,
    { "cache-control": "public, max-age=60, stale-while-revalidate=300" },
  );
}

async function deletePaste(request: Request, id: string, env: Env, cors: Headers): Promise<Response> {
  if (!ID_PATTERN.test(id)) return json({ error: "Paste not found" }, 404, cors);
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return json({ error: "Delete token required" }, 401, cors);
  const tokenHash = await sha256(authorization.slice(7));
  const result = await env.DB.prepare("DELETE FROM pastes WHERE id = ? AND delete_token_hash = ?")
    .bind(id, tokenHash)
    .run();
  if (!result.meta.changes) return json({ error: "Paste not found or token is invalid" }, 404, cors);
  return new Response(null, { status: 204, headers: cors });
}

async function allowRequest(ipHash: string, db: D1Database): Promise<boolean> {
  const now = Math.floor(Date.now() / 1000);
  const windowStart = now - (now % RATE_WINDOW_SECONDS);
  const existing = await db
    .prepare("SELECT count FROM rate_limits WHERE ip_hash = ? AND window_start = ?")
    .bind(ipHash, windowStart)
    .first<{ count: number }>();
  if ((existing?.count ?? 0) >= RATE_LIMIT) return false;
  await db
    .prepare(
      `INSERT INTO rate_limits (ip_hash, window_start, count)
       VALUES (?, ?, 1)
       ON CONFLICT (ip_hash, window_start) DO UPDATE SET count = count + 1`,
    )
    .bind(ipHash, windowStart)
    .run();
  return true;
}

function validateDrawing(input: unknown): Drawing | null {
  if (!input || typeof input !== "object") return null;
  const candidate = input as Partial<Drawing>;
  if (candidate.width !== 1200 || candidate.height !== 720 || !Array.isArray(candidate.strokes)) return null;
  if (candidate.strokes.length > MAX_STROKES) return null;
  let pointCount = 0;
  for (const stroke of candidate.strokes) {
    if (!stroke || !Array.isArray(stroke.points) || stroke.color !== "#f4f4f4") return null;
    if (!Number.isFinite(stroke.width) || stroke.width < 0.5 || stroke.width > 10) return null;
    pointCount += stroke.points.length;
    if (pointCount > MAX_POINTS) return null;
    for (const point of stroke.points) {
      if (
        !Number.isFinite(point.x) ||
        !Number.isFinite(point.y) ||
        !Number.isFinite(point.pressure) ||
        point.x < 0 ||
        point.x > 1200 ||
        point.y < 0 ||
        point.y > 720 ||
        point.pressure < 0 ||
        point.pressure > 1
      ) return null;
    }
  }
  return candidate as Drawing;
}

function corsHeaders(origin: string | null, allowedOrigin: string): Headers {
  const headers = new Headers({
    "access-control-allow-headers": "authorization, content-type",
    "access-control-allow-methods": "GET, POST, DELETE, OPTIONS",
    "access-control-max-age": "86400",
    "content-security-policy": "default-src 'none'",
    "x-content-type-options": "nosniff",
  });
  const allowed = new Set([allowedOrigin, "http://localhost:3000"]);
  if (origin && allowed.has(origin)) {
    headers.set("access-control-allow-origin", origin);
    headers.set("vary", "Origin");
  }
  return headers;
}

function json(
  body: unknown,
  status: number,
  headers: Headers,
  extra: Record<string, string> = {},
): Response {
  const responseHeaders = new Headers(headers);
  responseHeaders.set("content-type", "application/json; charset=utf-8");
  Object.entries(extra).forEach(([key, value]) => responseHeaders.set(key, value));
  return new Response(JSON.stringify(body), { status, headers: responseHeaders });
}

function randomString(length: number): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  const alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}
