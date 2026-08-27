# CropSage — AI-Powered Agriculture Crop Advisory Assistant

> **An AI decision-support tool for farmers.** CropSage collects structured farm information and uses Google Gemini AI to generate personalized, explainable crop recommendations — stored securely per-user in Supabase PostgreSQL.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture](#2-architecture)
3. [Prerequisites](#3-prerequisites)
4. [Environment Variables](#4-environment-variables)
5. [Supabase Setup](#5-supabase-setup)
6. [Database Migration](#6-database-migration)
7. [Migration Runner (Node.js)](#7-migration-runner-nodejs)
8. [Gemini API Configuration](#8-gemini-api-configuration)
9. [Local Development](#9-local-development)
10. [Production Build](#10-production-build)
11. [Security Considerations](#11-security-considerations)
12. [AI Advisory Limitations](#12-ai-advisory-limitations)

---

## 1. Project Overview

CropSage is a full-stack AgTech web application that:

- Collects farm profile data (location, soil type, pH, land area, irrigation, season, farming objective)
- Sends that data server-side to Google Gemini via `@google/genai`
- Returns a structured 15-section crop advisory (crop recommendation, soil prep, irrigation, nutrients, pests, weeds, harvest, risks, sustainability tips, disclaimer)
- Persists every advisory request and result in Supabase PostgreSQL with Row Level Security
- Provides authenticated advisory history with per-user data isolation

**Tech stack:**
| Layer | Technology |
|-------|------------|
| Frontend | React 18 + TypeScript + Vite + Tailwind CSS |
| Backend | Node.js + Express + TypeScript |
| Database | Supabase (PostgreSQL + Auth + RLS) |
| AI | Google Gemini (`gemini-2.0-flash` via `@google/genai`) |
| Validation | Zod (backend request + AI response) |

---

## 2. Architecture

```
Browser (React + Vite)
  │  Supabase Auth (JWT)
  │  fetch → /api/*
  ▼
Express API (Node.js + TypeScript)
  │  Auth middleware (validates Supabase JWT)
  │  Zod validation
  │  Gemini AI service (server-side only)
  │  Supabase service-role client
  ▼
Supabase (PostgreSQL + RLS)   +   Google Gemini API
```

**Key security boundaries:**
- `GEMINI_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` live **only** in backend environment variables
- Browser only receives the Supabase anon key (safe for client-side use)
- Every protected backend endpoint validates the user's Supabase JWT before any database operation
- RLS policies enforce ownership at the database layer independently of the API

---

## 3. Prerequisites

| Tool | Minimum Version |
|------|----------------|
| Node.js | 20.x LTS |
| npm | 10.x |
| Supabase account | — |
| Google AI Studio account | — |

---

## 4. Environment Variables

### Backend (`backend/.env`)

Copy `backend/.env.example` to `backend/.env` and fill in:

```env
PORT=3001
NODE_ENV=development
FRONTEND_ORIGIN=http://localhost:5173

# Supabase — found in: Dashboard → Project Settings → API
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # ⚠️ Never expose to browser

# Google Gemini — https://aistudio.google.com/app/apikey
GEMINI_API_KEY=AIza...             # ⚠️ Never expose to browser
GEMINI_MODEL=gemini-2.0-flash      # Optional: override default model
```

### Frontend (`frontend/.env`)

Copy `frontend/.env.example` to `frontend/.env` and fill in:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...      # Public anon key only — safe for browser
```

> **Note:** During local development, the Vite dev server proxies `/api/*` requests to `http://localhost:3001` automatically — no `VITE_API_URL` needed.

---

## 5. Supabase Setup

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. Once the project is ready, navigate to **Project Settings → API**.
3. Copy:
   - **Project URL** → `SUPABASE_URL` (both `.env` files)
   - **anon public** key → `SUPABASE_ANON_KEY` (both `.env` files)
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (backend `.env` only — **keep secret**)

### Email Confirmation (Optional)

By default, Supabase requires email confirmation after registration. For local testing:

1. Go to **Authentication → Settings**.
2. Under **Email Auth**, disable **"Enable email confirmations"**.

---

## 6. Database Migration

The migration file is at: `supabase/migrations/001_initial_schema.sql`

It creates:
- **Enums**: `advisory_status`, `land_unit`, `irrigation_availability`
- **Tables**: `farm_profiles`, `advisories`, `crop_reference`
- **Indexes**: all performance indexes including GIN on JSONB `advisory_result`
- **Triggers**: `set_updated_at()` on both user-owned tables
- **RLS**: enabled on `farm_profiles` and `advisories` (8 ownership policies)
- **Seed data**: 70+ crops in `crop_reference` with agronomic metadata

### Option A — SQL Editor (quick)

1. Open your Supabase dashboard → **SQL Editor → New query**
2. Paste the contents of `supabase/migrations/001_initial_schema.sql`
3. Click **Run**

### Option B — Migration runner (recommended for automation)

See [Section 7](#7-migration-runner-nodejs) below.

## 7. Migration Runner (Node.js)

The migration runner (`scripts/run-migration.mjs`) connects directly to Supabase PostgreSQL via the `pg` library, applies pending `.sql` files in order, and tracks applied migrations in a `migrations_log` table.

### Setup

```bash
cd agriculture-advisor/scripts
npm install
cp .env.example .env
# Edit scripts/.env — fill in DATABASE_URL
```

### Get Your DATABASE_URL

1. Supabase Dashboard → **Project Settings → Database**
2. Scroll to **Connection string** section
3. Select **URI** tab → copy the **Direct connection** string (NOT the pooler)
4. Replace `[YOUR-PASSWORD]` with your actual database password

```
postgresql://postgres.[project-ref]:[db-password]@db.[project-ref].supabase.co:5432/postgres
```

> ⚠️ **Important**: Use the **Direct connection** (port `5432`), not the Transaction Pooler (port `6543`). DDL statements (CREATE TABLE, RLS, etc.) require a direct session.

### Commands

```bash
# Apply all pending migrations
npm run migrate

# Preview SQL without executing (dry run)
npm run migrate:dry-run

# Check connection + list applied migrations
npm run migrate:verify
```

### Sample output

```
  CropSage — Database Migration Runner
  ✔ Loaded env from: scripts/.env
  ✔ Connected. PostgreSQL 15.x
  ✔ migrations_log table ensured.
  ✔ Found 1 migration file(s)
  → Applying: 001_initial_schema.sql
  ✔ 001_initial_schema.sql applied successfully (1842ms)
  ✔ All migrations applied successfully! ✔
```

---

## 7. Gemini API Configuration

1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Create or copy your API key.
3. Set it as `GEMINI_API_KEY` in `backend/.env`.

The backend uses `gemini-2.0-flash` by default. To use a different model, set `GEMINI_MODEL=gemini-1.5-pro` (or any available model) in `backend/.env`.

---

## 8. Local Development

Open two terminals:

### Terminal 1 — Backend

```bash
cd agriculture-advisor/backend
npm install
# Copy and fill in env variables
cp .env.example .env
# Edit backend/.env with your Supabase and Gemini credentials
npm run dev
# API available at: http://localhost:3001
```

### Terminal 2 — Frontend

```bash
cd agriculture-advisor/frontend
npm install
# Copy and fill in env variables
cp .env.example .env
# Edit frontend/.env with your Supabase URL and anon key
npm run dev
# App available at: http://localhost:5173
```

### Health check

```bash
curl http://localhost:3001/api/health
```

Expected response:
```json
{ "success": true, "data": { "status": "healthy", ... } }
```

---

## 9. Production Build

### Backend

```bash
cd backend
npm run build         # Compiles TypeScript to dist/
npm start             # Runs compiled output
```

Set `NODE_ENV=production` and `FRONTEND_ORIGIN` to your production frontend URL.

### Frontend

```bash
cd frontend
npm run build         # Outputs to frontend/dist/
```

Deploy `frontend/dist/` to any static host (Vercel, Netlify, Cloudflare Pages, etc.).

Set `VITE_API_URL` to your production backend URL if not on the same origin.

---

## 10. Security Considerations

| Concern | Implementation |
|---------|---------------|
| API key exposure | `GEMINI_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are backend-only env vars |
| Cross-user data access | RLS policies enforce `auth.uid() = user_id` at DB layer |
| Backend authorization | Auth middleware validates Supabase JWT on every protected request |
| Client-supplied user_id | Backend ignores any client-supplied user_id; always uses verified JWT identity |
| Input validation | Zod validates all API requests server-side |
| AI response validation | Zod validates Gemini's response before storage |
| Request size | Body parser limited to 100kb |
| Rate limiting | General: 100 req/15min; AI generation: 5 req/min |
| Security headers | Helmet.js sets secure HTTP headers |
| CORS | Restricted to configured `FRONTEND_ORIGIN` |
| Error leaking | Production errors return generic messages; no stack traces exposed |

---

## 11. AI Advisory Limitations

**CropSage is a decision-support tool, not a professional agricultural authority.**

- The AI advisory is generated from user-provided information only. It does not access real-time satellite data, local weather APIs, or certified soil laboratory results.
- All crop recommendations contain uncertainty and should be validated with a qualified local agronomist, agricultural extension officer, or certified soil laboratory before implementation.
- Fertilizer, pesticide, and herbicide references are general guidance only. Always follow locally approved product labels, application rates, and agricultural extension recommendations for your specific crop, growth stage, region, and regulations.
- Yield and profitability figures are not guaranteed. Market conditions, weather, and many other factors affect outcomes.
- CropSage does not claim to have inspected your farm, collected soil samples, or consulted a local agricultural expert.

**When in doubt, consult your local government agricultural extension service.**
