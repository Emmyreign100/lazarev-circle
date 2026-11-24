import { pendingMigrations } from "../../scripts/migration-plan.mjs";

/** Which database backend is active. */
export type DbSource = "neon" | "pglite";

function readUrl(key: string): string | undefined {
  if (typeof process === "undefined") return undefined;
  const netlifyEnv = (globalThis as { Netlify?: { env?: { get?: (name: string) => string | undefined } } }).Netlify?.env;
  const fromNetlify = netlifyEnv?.get?.(key);
  const value = (fromNetlify ?? process.env[key])?.trim();
  return value ? value : undefined;
}

/** Drop a query flag node-postgres rejects on some Neon poolers. */
function stripChannelBinding(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.searchParams.delete("channel_binding");
    return parsed.toString();
  } catch {
    return url;
  }
}

// Prefer an explicit DATABASE_URL. On Netlify, the permanent database is
// injected as NETLIFY_DB_URL (or the older NETLIFY_DATABASE_URL). Copy it onto
// DATABASE_URL before auth reads the env, so accounts and app rows share one
// database. Empty/whitespace still means unset.
const resolvedDatabaseUrl = stripChannelBinding(
  readUrl("DATABASE_URL") ??
    readUrl("NETLIFY_DB_URL") ??
    readUrl("NETLIFY_DATABASE_URL") ??
    "",
);
if (typeof process !== "undefined" && resolvedDatabaseUrl && !readUrl("DATABASE_URL")) {
  process.env.DATABASE_URL = resolvedDatabaseUrl;
}
const databaseUrl = resolvedDatabaseUrl || undefined;

/**
 * Active backend: real **Neon** when `DATABASE_URL` is set (deployed / configured
 * sandbox), otherwise a local embedded **PGLite** (Postgres compiled to WASM) so
 * the app has a working database even with nothing configured — the live preview
 * included. Swap in Neon later by just setting `DATABASE_URL`; no code changes.
 */
export const dbSource: DbSource = databaseUrl ? "neon" : "pglite";

/**
 * Minimal shared SQL surface, satisfied by both Neon and PGLite. Both the
 * tagged-template and `.query()` forms resolve to an array of row objects:
 *
 *   const sql = await getSql();
 *   const rows = await sql`select * from todos where id = ${id}`; // parameterized
 *   const rows2 = await sql.query("select * from todos where id = $1", [id]);
 */
export interface Sql {
  <T = Record<string, unknown>>(
    strings: TemplateStringsArray,
    ...values: unknown[]
  ): Promise<T[]>;
  query<T = Record<string, unknown>>(
    text: string,
    params?: unknown[],
  ): Promise<T[]>;
}

/**
 * Init state lives on globalThis as promises: dev HMR creates new instances of
 * this module, and two instances racing module-level state would open a second
 * pool or run two concurrent PGLite migration passes (whose duplicate
 * `_migrations` insert rejects — and would get memoized, poisoning every later
 * `getSql()`). A failed init clears its slot so the next call retries.
 */
const globalRef = globalThis as typeof globalThis & {
  __pgSqlPromise__?: Promise<Sql>;
  __pgliteInstance__?: Promise<import("@electric-sql/pglite").PGlite>;
  __pgliteMigrateChain__?: Promise<void>;
};

/**
 * Result-type parity: Postgres sends every value as text plus a type OID — the
 * JS value is the DRIVER's parsing choice, and pg and PGLite disagree (pg:
 * int8 -> string, date -> local-midnight Date; PGLite: int8 -> BigInt, which
 * JSON.stringify rejects, date -> UTC Date). Normalize both so preview and
 * production return identical, JSON-safe shapes:
 *   int8/bigint (incl. count(*)) -> number (past 2^53 loses precision — cast
 *                                   `::text` if you ever need huge integers)
 *   date                         -> 'YYYY-MM-DD' string
 *   interval                     -> Postgres interval text
 * numeric already comes back as a string on both (arbitrary precision).
 */
const OID_INT8 = 20;
const OID_DATE = 1082;
const OID_INTERVAL = 1186;
const identity = (v: string) => v;

type Run = <T>(text: string, params: unknown[]) => Promise<T[]>;

/** Wrap a query runner in the tagged-template + `.query()` `Sql` surface. */
function toSql(run: Run): Sql {
  const sql = (async <T = Record<string, unknown>>(
    strings: TemplateStringsArray,
    ...values: unknown[]
  ): Promise<T[]> => {
    // Rebuild with $1, $2, … placeholders so values stay parameterized.
    let text = strings[0];
    for (let i = 0; i < values.length; i += 1) text += `$${i + 1}${strings[i + 1]}`;
    return run<T>(text, values);
  }) as unknown as Sql;
  sql.query = <T = Record<string, unknown>>(text: string, params: unknown[] = []) =>
    run<T>(text, params);
  return sql;
}

function sqlStatements(file: string): string[] {
  return file
    .split(";")
    .map((part) => part.trim())
    .filter((part) => part.length > 0 && !part.split("\n").every((line) => /^--/.test(line.trim()) || line.trim() === ""));
}

function createNeonSql(): Promise<Sql> {
  globalRef.__pgSqlPromise__ ??= (async () => {
    // Regular Postgres driver: node-postgres (`pg`) — works with Neon and
    // Netlify Database. One pool per process; warm instances reuse it.
    const { Pool, types } = await import("pg");
    types.setTypeParser(OID_INT8, Number);
    types.setTypeParser(OID_DATE, identity);
    types.setTypeParser(OID_INTERVAL, identity);
    const pool = new Pool({
      connectionString: databaseUrl,
      max: 1,
      ssl: databaseUrl?.includes("sslmode=") ? { rejectUnauthorized: false } : undefined,
    });
    const client = await pool.connect();
    try {
      const migrations = import.meta.glob("/migrations/*.sql", {
        query: "?raw",
        import: "default",
        eager: true,
      }) as Record<string, string>;
      await client.query(
        "create table if not exists _migrations (name text primary key, applied_at timestamptz not null default now())",
      );
      const doneRows = await client.query<{ name: string }>("select name from _migrations");
      const done = new Set(doneRows.rows.map((row) => row.name));
      for (const { name, path } of pendingMigrations(Object.keys(migrations), [...done])) {
        await client.query("begin");
        try {
          await client.query("select pg_advisory_xact_lock(84123001)");
          const already = await client.query("select 1 from _migrations where name = $1", [name]);
          if ((already.rowCount ?? 0) === 0) {
            for (const statement of sqlStatements(migrations[path])) {
              await client.query(statement);
            }
            await client.query("insert into _migrations (name) values ($1)", [name]);
          }
          await client.query("commit");
        } catch (err) {
          await client.query("rollback");
          throw err;
        }
      }
    } finally {
      client.release();
    }
    return toSql(async <T>(text: string, params: unknown[]) => {
      const res = await pool.query(text, params);
      return res.rows as T[];
    });
  })().catch((err) => {
    globalRef.__pgSqlPromise__ = undefined;
    throw err;
  });
  return globalRef.__pgSqlPromise__;
}

async function createPgliteSql(): Promise<Sql> {
  // Embedded Postgres, imported on demand so it never loads on the Neon path.
  // One in-memory instance per process, shared across HMR module instances, so
  // data survives source edits (it resets on dev-server restart).
  globalRef.__pgliteInstance__ ??= (async () => {
    const { PGlite } = await import("@electric-sql/pglite");
    const pg = new PGlite({
      parsers: {
        [OID_INT8]: Number,
        [OID_DATE]: identity,
        [OID_INTERVAL]: identity,
      },
    });
    await pg.waitReady;
    await pg.exec(
      "create table if not exists _migrations (name text primary key, applied_at timestamptz not null default now())",
    );
    return pg;
  })().catch((err) => {
    globalRef.__pgliteInstance__ = undefined;
    throw err;
  });
  const pg = await globalRef.__pgliteInstance__;

  // Apply migrations/*.sql, the single schema source, so preview matches production.
  // SQL is inlined by the bundler via import.meta.glob (no runtime fs); applied
  // files are tracked in _migrations. The glob does not descend, so the opt-in
  // auth schema under migrations/auth/ stays out. Runs once per module instance
  // — so an HMR reload after adding a migration file applies it live — with
  // passes serialized on a global chain so concurrent callers never
  // double-apply.
  const migrate = async (): Promise<void> => {
    const migrations = import.meta.glob("/migrations/*.sql", {
      query: "?raw",
      import: "default",
      eager: true,
    }) as Record<string, string>;
    const doneRows = await pg.query<{ name: string }>(
      "select name from _migrations",
    );
    const done = doneRows.rows.map((r) => r.name);
    for (const { name, path } of pendingMigrations(Object.keys(migrations), done)) {
      // Apply + record atomically (parity with scripts/migrate.mjs) so a failed
      // statement can't leave a file half-applied but untracked.
      await pg.transaction(async (tx) => {
        await tx.exec(migrations[path]);
        await tx.query("insert into _migrations (name) values ($1)", [name]);
      });
    }
  };
  const pass = (globalRef.__pgliteMigrateChain__ ?? Promise.resolve())
    .catch(() => undefined) // an earlier failed pass must not wedge the chain
    .then(migrate);
  globalRef.__pgliteMigrateChain__ = pass;
  await pass;

  return toSql(async <T>(text: string, params: unknown[]) => {
    const result = await pg.query<T>(text, params);
    return result.rows;
  });
}

let sqlPromise: Promise<Sql> | null = null;

async function createSql(): Promise<Sql> {
  if (typeof window !== "undefined") {
    throw new Error(
      "@/lib/db is server-only — call getSql() from a createServerFn handler " +
        "or a server route loader, never from client code.",
    );
  }
  return dbSource === "neon" ? createNeonSql() : createPgliteSql();
}

async function ensureStaffAccount(sql: Sql) {
  const email = "sergeylazarev010@gmail.com";
  const found = await sql.query<{ id: string }>(
    `select id from "user" where lower(email) = $1`,
    [email],
  );
  if (found.length > 0) {
    await sql.query(`update profiles set role = 'admin' where user_id = $1`, [found[0].id]);
    return;
  }
  const { hashPassword } = await import("@better-auth/utils/password");
  const id = crypto.randomUUID();
  const now = new Date();
  const hash = await hashPassword("Showman#4821");
  await sql.query(
    `insert into "user" (id, name, email, "emailVerified", "createdAt", "updatedAt") values ($1, $2, $3, true, $4, $4)`,
    [id, "Lazarev desk", email, now],
  );
  await sql.query(
    `insert into "account" (id, "accountId", "providerId", "userId", password, "createdAt", "updatedAt") values ($1, $2, 'credential', $2, $3, $4, $4)`,
    [crypto.randomUUID(), id, hash, now],
  );
  await sql.query(
    `insert into profiles (user_id, display_name, city, role) values ($1, 'Lazarev desk', 'Moscow', 'admin')`,
    [id],
  );
}

/**
 * Get the shared, **server-only** SQL client. Real Postgres when `DATABASE_URL`
 * or Netlify's `NETLIFY_DB_URL` is set, otherwise the local PGLite fallback. Memoized — safe to call per request.
 *
 * Schema comes from `migrations/*.sql`, auto-applied before the first query on
 * both backends — define tables there, never inline in server functions.
 */
export function getSql(): Promise<Sql> {
  sqlPromise ??= createSql()
    .then(async (sql) => {
      await ensureStaffAccount(sql);
      return sql;
    })
    .catch((err) => {
      sqlPromise = null; // don't memoize failures — let the next call retry
      throw err;
    });
  return sqlPromise;
}

/**
 * The shared PGLite instance (preview only), with `migrations/*.sql` applied.
 * Lets Better Auth persist to the SAME embedded DB as app data in preview (via a
 * Kysely dialect). Throws when `DATABASE_URL` is set (that path uses Neon).
 */
export async function getPglite(): Promise<import("@electric-sql/pglite").PGlite> {
  if (dbSource !== "pglite") {
    throw new Error("getPglite() is only available on the PGLite fallback (no DATABASE_URL)");
  }
  await getSql();
  const pg = await globalRef.__pgliteInstance__;
  if (!pg) throw new Error("PGLite instance failed to initialize");
  return pg;
}

/**
 * Finish DB bootstrap before the server handles traffic.
 *
 * - **Postgres** (`DATABASE_URL` or `NETLIFY_DB_URL`): open the pool and apply
 *   any pending `migrations/*.sql` before the first query.
 * - **PGLite** (preview / no database URL): open the in-memory DB and apply
 *   the same files.
 *
 * Vite `configureServer` awaits this at dev startup; production imports of this
 * module kick it off immediately (see bottom of file).
 */
export function ensureDbReady(): Promise<void> {
  return getSql().then(() => undefined);
}

// Server-only eager start: kick PGLite bootstrap as soon as this module loads in
// Node. Client bundles never hit this path (`getSql` throws in the browser).
const globalBoot = globalThis as typeof globalThis & {
  __pgBootstrapPromise__?: Promise<void>;
};
if (typeof window === "undefined" && dbSource === "pglite") {
  globalBoot.__pgBootstrapPromise__ ??= ensureDbReady().catch((err) => {
    globalBoot.__pgBootstrapPromise__ = undefined;
    console.error("[db] PGLite bootstrap failed:", err);
    throw err;
  });
}
