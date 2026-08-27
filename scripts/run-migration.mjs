#!/usr/bin/env node
/**
 * CropSage — Database Migration Runner
 * =====================================
 * Applies supabase/migrations/*.sql files to Supabase Cloud PostgreSQL
 * in filename order, tracking applied migrations in a migrations_log table.
 *
 * Usage:
 *   cd scripts
 *   npm install
 *   cp .env.example .env          # fill in DATABASE_URL
 *   node run-migration.mjs        # apply all pending migrations
 *   node run-migration.mjs --dry-run       # preview SQL without executing
 *   node run-migration.mjs --verify-only   # check connection + list applied migrations
 *
 * Requirements:
 *   - DATABASE_URL in scripts/.env (direct PostgreSQL connection — NOT pooler)
 *   - Node.js >= 18
 *
 * Connection string format (from Supabase Dashboard → Settings → Database):
 *   postgresql://postgres.[project-ref]:[db-password]@db.[project-ref].supabase.co:5432/postgres
 */

import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import { config as dotenvConfig } from 'dotenv';

// ---------------------------------------------------------------------------
// Bootstrap
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Logging helpers
// ---------------------------------------------------------------------------
const RESET  = '\x1b[0m';
const GREEN  = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED    = '\x1b[31m';
const CYAN   = '\x1b[36m';
const BOLD   = '\x1b[1m';

function log(level, message) {
  const ts = new Date().toISOString();
  const prefix = {
    info:    `${GREEN}  ✔${RESET}`,
    warn:    `${YELLOW}  ⚠${RESET}`,
    error:   `${RED}  ✖${RESET}`,
    step:    `${CYAN}  →${RESET}`,
    heading: `\n${BOLD}`,
  }[level] ?? '  ';
  console.log(`${prefix} [${ts}] ${message}${level === 'heading' ? RESET : ''}`);
}

// ---------------------------------------------------------------------------
// Environment setup
// ---------------------------------------------------------------------------
const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');
const migrationsDir = join(projectRoot, 'supabase', 'migrations');

// Load scripts/.env first, then fall back to project root .env
const scriptEnvPath = join(__dirname, '.env');
const rootEnvPath   = join(projectRoot, '.env');

if (existsSync(scriptEnvPath)) {
  dotenvConfig({ path: scriptEnvPath });
  log('info', `Loaded env from: scripts/.env`);
} else if (existsSync(rootEnvPath)) {
  dotenvConfig({ path: rootEnvPath });
  log('info', `Loaded env from: .env (project root)`);
} else {
  log('warn', 'No .env file found. Relying on system environment variables.');
}

// ---------------------------------------------------------------------------
// Parse CLI flags
// ---------------------------------------------------------------------------
const args = process.argv.slice(2);
const DRY_RUN     = args.includes('--dry-run');
const VERIFY_ONLY = args.includes('--verify-only');

// ---------------------------------------------------------------------------
// Validate environment
// ---------------------------------------------------------------------------
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  log('error', 'DATABASE_URL is not set.');
  log('error', 'Copy scripts/.env.example to scripts/.env and fill in your Supabase direct connection string.');
  log('error', 'Find it at: Supabase Dashboard → Project Settings → Database → Direct connection URI');
  process.exit(1);
}

// Sanity check: warn if someone accidentally uses the pooler URL (port 6543)
if (DATABASE_URL.includes(':6543/')) {
  log('warn', 'DATABASE_URL appears to use the Transaction Pooler (port 6543).');
  log('warn', 'DDL migrations (CREATE TABLE, RLS, etc.) require a DIRECT connection (port 5432).');
  log('warn', 'Update DATABASE_URL to the "Direct connection" URI from your Supabase dashboard.');
}

// ---------------------------------------------------------------------------
// Database client
// ---------------------------------------------------------------------------
const { Pool } = pg;

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // Required for Supabase Cloud SSL
  max: 1,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 15_000,
});

// ---------------------------------------------------------------------------
// Migration log table
// Tracks which migration files have already been applied so re-running the
// script is safe and idempotent.
// ---------------------------------------------------------------------------
const CREATE_LOG_TABLE_SQL = `
  create table if not exists public.migrations_log (
    id           serial      primary key,
    filename     text        not null unique,
    applied_at   timestamptz not null default now(),
    checksum     text,
    duration_ms  integer
  );
`;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Compute a simple FNV-1a 32-bit hash of a string for change detection. */
function simpleChecksum(str) {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = (hash * 16777619) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

/** Return all .sql files in the migrations directory, sorted by filename. */
function getMigrationFiles() {
  if (!existsSync(migrationsDir)) {
    log('error', `Migrations directory not found: ${migrationsDir}`);
    process.exit(1);
  }
  return readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();
}

/** Return the set of migration filenames already recorded in migrations_log. */
async function getAppliedMigrations(client) {
  const result = await client.query(
    'select filename, applied_at, checksum from public.migrations_log order by applied_at asc'
  );
  return result.rows;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  log('heading', 'CropSage — Database Migration Runner');

  if (DRY_RUN)     log('warn', 'DRY RUN mode — SQL will be printed but NOT executed.');
  if (VERIFY_ONLY) log('warn', 'VERIFY ONLY mode — checking connection and applied migrations.');

  // --- Connect ---
  log('step', 'Connecting to Supabase PostgreSQL…');
  const client = await pool.connect();

  try {
    // Verify connection
    const versionResult = await client.query('select version()');
    const pgVersion = versionResult.rows[0].version.split(' ').slice(0, 2).join(' ');
    log('info', `Connected. ${pgVersion}`);

    if (VERIFY_ONLY) {
      await verifyOnly(client);
      return;
    }

    // --- Ensure migrations log table exists ---
    if (!DRY_RUN) {
      await client.query(CREATE_LOG_TABLE_SQL);
      log('info', 'migrations_log table ensured.');
    }

    // --- Discover migration files ---
    const files = getMigrationFiles();
    log('info', `Found ${files.length} migration file(s) in supabase/migrations/`);

    // --- Get already-applied migrations ---
    let applied = new Set();
    let appliedRows = [];
    if (!DRY_RUN) {
      appliedRows = await getAppliedMigrations(client);
      applied = new Set(appliedRows.map((r) => r.filename));
    }

    // --- Report already applied ---
    if (appliedRows.length > 0) {
      log('heading', 'Previously applied migrations:');
      for (const row of appliedRows) {
        const ts = new Date(row.applied_at).toLocaleString();
        log('info', `  ${row.filename}  (applied ${ts})`);
      }
    }

    // --- Find pending migrations ---
    const pending = files.filter((f) => !applied.has(f));

    if (pending.length === 0) {
      log('info', `\n${GREEN}${BOLD}All migrations are up to date. Nothing to apply.${RESET}`);
      return;
    }

    log('heading', `Pending migrations (${pending.length}):`);
    for (const f of pending) log('step', `  ${f}`);

    // --- Apply pending migrations ---
    let appliedCount = 0;
    let errorCount   = 0;

    for (const filename of pending) {
      const filePath = join(migrationsDir, filename);
      const sql      = readFileSync(filePath, 'utf8');
      const checksum = simpleChecksum(sql);

      log('step', `Applying: ${filename} (checksum: ${checksum})`);

      if (DRY_RUN) {
        console.log(`\n${'─'.repeat(60)}`);
        console.log(`-- FILE: ${filename}`);
        console.log(`${'─'.repeat(60)}`);
        // Print first 2000 chars to avoid flooding the terminal
        console.log(sql.slice(0, 2000));
        if (sql.length > 2000) console.log(`\n... [${sql.length - 2000} more characters — see full file] ...`);
        console.log(`${'─'.repeat(60)}\n`);
        appliedCount++;
        continue;
      }

      const start = Date.now();

      try {
        // Run in a transaction so partial failures don't leave the DB in a
        // corrupt state.
        await client.query('begin');
        await client.query(sql);

        const duration = Date.now() - start;

        // Record successful application
        await client.query(
          `insert into public.migrations_log (filename, checksum, duration_ms)
           values ($1, $2, $3)`,
          [filename, checksum, duration]
        );

        await client.query('commit');

        log('info', `${GREEN}✔${RESET} ${filename} applied successfully (${duration}ms)`);
        appliedCount++;

      } catch (err) {
        await client.query('rollback').catch(() => {});
        log('error', `Failed to apply ${filename}:`);
        log('error', `  ${err.message}`);

        // Show the specific SQL position if available
        if (err.position) {
          const lineNum = sql.slice(0, parseInt(err.position)).split('\n').length;
          log('error', `  Error near line ${lineNum} of ${filename}`);
        }

        errorCount++;

        // Stop on first error — don't attempt subsequent migrations
        // after a failure to avoid cascading issues.
        log('error', 'Migration halted. Fix the error and re-run.');
        break;
      }
    }

    // --- Summary ---
    log('heading', 'Migration Summary');
    log('info', `  Total migration files : ${files.length}`);
    log('info', `  Already applied       : ${applied.size}`);
    log('info', `  Applied this run      : ${appliedCount}`);
    if (errorCount > 0) {
      log('error', `  Errors                : ${errorCount}`);
      process.exitCode = 1;
    } else if (!DRY_RUN) {
      log('info', `\n${GREEN}${BOLD}All migrations applied successfully! ✔${RESET}\n`);
    }

  } finally {
    client.release();
    await pool.end();
  }
}

// ---------------------------------------------------------------------------
// Verify-only mode: just print connection info and applied migrations
// ---------------------------------------------------------------------------
async function verifyOnly(client) {
  try {
    await client.query(CREATE_LOG_TABLE_SQL);
    const rows = await getAppliedMigrations(client);

    log('heading', 'Applied migrations in this database:');
    if (rows.length === 0) {
      log('warn', '  No migrations have been applied yet.');
    } else {
      for (const row of rows) {
        const ts = new Date(row.applied_at).toLocaleString();
        log('info', `  ${row.filename}  —  applied ${ts}  —  checksum ${row.checksum}`);
      }
    }

    // Verify key tables exist
    log('heading', 'Checking schema objects:');
    const tableCheck = await client.query(`
      select table_name
      from information_schema.tables
      where table_schema = 'public'
        and table_name in ('farm_profiles','advisories','crop_reference','migrations_log')
      order by table_name
    `);
    const foundTables = tableCheck.rows.map((r) => r.table_name);
    const expectedTables = ['advisories', 'crop_reference', 'farm_profiles', 'migrations_log'];
    for (const t of expectedTables) {
      if (foundTables.includes(t)) {
        log('info', `  ✔ Table: public.${t}`);
      } else {
        log('warn', `  ✖ Table NOT found: public.${t}  (migration may not have run yet)`);
      }
    }

    // Verify RLS is enabled
    log('heading', 'Checking Row Level Security:');
    const rlsCheck = await client.query(`
      select tablename, rowsecurity
      from pg_tables
      where schemaname = 'public'
        and tablename in ('farm_profiles','advisories')
    `);
    for (const row of rlsCheck.rows) {
      if (row.rowsecurity) {
        log('info', `  ✔ RLS enabled: public.${row.tablename}`);
      } else {
        log('warn', `  ✖ RLS NOT enabled: public.${row.tablename}`);
      }
    }

    // Seed data count
    const seedCount = await client.query('select count(*) as n from public.crop_reference');
    log('info', `\n  crop_reference seed rows: ${seedCount.rows[0].n}`);

  } catch (err) {
    log('error', `Verify failed: ${err.message}`);
    process.exitCode = 1;
  }
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------
main().catch((err) => {
  log('error', `Unexpected error: ${err.message}`);
  process.exit(1);
});
