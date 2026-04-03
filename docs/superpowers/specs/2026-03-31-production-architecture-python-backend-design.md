# Turnera Production Architecture: Python AI Backend + Multi-Tenant SaaS

## Context

Turnera is pivoting from n8n (visual workflow tool) to a Python/FastAPI backend for all AI, WhatsApp, and automation features. This is driven by the need for a full medical AI agent (RAG, booking, patient history queries, reminders, future dictation) that exceeds n8n's capabilities. The research across 33 deep-dive files confirms this architecture is the correct approach for the Argentine medical market.

---

## Architecture Overview

```
Browser → Vercel (Next.js) ──→ Supabase ←── FastAPI (VPS, Docker)
                                  ↑               ↑
                            same database    WhatsApp (YCloud BSP)
                            (anon + JWT)     (service_role key)
```

**Clean separation:**
- **Next.js (Vercel)** = staff web UI only (calendar, patients, doctors, reports)
- **FastAPI (VPS)** = AI agent + WhatsApp + reminders + RAG + future dictation
- **Supabase** = single source of truth. Database triggers enforce business rules for both callers.
- **No middleman.** Python talks directly to Supabase with `service_role` key. No `/api/chatbot/*` routes in Next.js.

### Phase 5 Sanatorio Addition (Hybrid)

On-premise server in Sanatorio UPCN LAN:
- **Orthanc** (PACS) — receives DICOM images from devices
- **OHIF Viewer** — web-based image viewing
- **Mirth Connect 4.5.2** — HL7v2/ASTM integration when lab devices need it
- Images stay local; only RIS metadata syncs to Supabase

---

## Python Backend Stack

- **FastAPI** — async web framework, Pydantic validation
- **LangChain** — AI agent orchestration (LLM-agnostic — provider TBD)
- **supabase-py** — direct DB access with service_role key
- **Celery + Redis** — scheduled reminders, async jobs, conversation flush
- **pgvector** (in Supabase) — vector store for RAG, filtered by clinic_id
- **Embedding model** — TBD (OpenAI, Cohere, local, etc.)
- **httpx** — async HTTP client for YCloud WhatsApp API

> **Note: LLM & embedding provider not decided yet.** The architecture is designed to be LLM-agnostic via LangChain abstractions. Swapping between Claude, OpenAI, Gemini, local models, or any other provider is a config change, not an architecture change. This decision will be made before implementation.

### Project Structure: `turnera-ai/` (separate repo)

```
turnera-ai/
├── docker-compose.yml          # FastAPI + Redis + Celery Worker + Celery Beat
├── Dockerfile
├── app/
│   ├── main.py                 # FastAPI app factory
│   ├── config.py               # pydantic-settings (env vars)
│   ├── api/
│   │   ├── webhooks/whatsapp.py    # POST /webhook/whatsapp
│   │   ├── internal/health.py      # GET /health
│   │   ├── internal/embeddings.py  # POST /internal/embeddings/sync
│   │   └── internal/reminders.py   # POST /internal/reminders/trigger
│   ├── agent/
│   │   ├── orchestrator.py     # LangChain agent: message → tools → response
│   │   ├── tools/              # 9 tools (see below)
│   │   ├── prompts/            # System prompt + per-clinic context
│   │   └── memory.py           # Redis-backed conversation memory
│   ├── rag/
│   │   ├── embedder.py         # Embed clinic data into pgvector
│   │   ├── retriever.py        # Vector search with clinic_id filter
│   │   └── sync.py             # Celery task: sync clinic data → embeddings
│   ├── whatsapp/
│   │   ├── client.py           # YCloud API client
│   │   └── models.py           # Pydantic models for webhook payload
│   ├── reminders/
│   │   ├── scheduler.py        # Celery Beat schedule definitions
│   │   └── tasks.py            # send_24h, send_sameday, send_post
│   └── db/
│       ├── client.py           # supabase-py singleton (service_role)
│       └── queries.py          # Common query helpers
├── celery_app.py
└── tests/
```

### AI Agent Tools (LangChain)

| Tool | What it does | Supabase call |
|------|-------------|---------------|
| `check_availability` | Available slots for doctor+date | RPC `get_available_slots()` |
| `book_appointment` | Book appointment (source='whatsapp') | INSERT `appointments` |
| `cancel_appointment` | Cancel with reason | UPDATE `appointments` |
| `reschedule_appointment` | Cancel old + book new, link via IDs | UPDATE + INSERT |
| `list_doctors` | Active doctors with specialties/days | SELECT `doctors` + `doctor_clinic_settings` |
| `patient_lookup` | Find patient by phone or DNI | SELECT `clinic_patients` |
| `patient_appointments` | Upcoming/past appointments | SELECT `appointments` |
| `clinic_faq` | RAG search for clinic knowledge | RPC `match_clinic_documents()` |
| `confirm_appointment` | Patient confirms via WhatsApp | UPDATE `appointments` status |

### Two-Tier LLM Strategy (provider TBD)

- **Small/fast model** → intent classification + simple responses (greetings, confirmations)
- **Large/capable model** → complex reasoning (booking flow, multi-step queries)
- Reduces cost ~60% for typical conversations
- LangChain makes this provider-agnostic: swap models via config, not code

---

## RAG Design

### What Gets Embedded Per Clinic

| Source | Strategy | Example |
|--------|----------|---------|
| Doctor profiles | 1 chunk per doctor | "Dr. Lopez, Cardiologia, lunes/miercoles, turnos 20 min, $15000" |
| Schedules | 1 chunk per doctor-day | "Dr. Lopez: lunes 8:00-12:00, miercoles 14:00-18:00" |
| Insurance plans | 1 chunk listing all | "Obras sociales: OSDE, Swiss Medical, PAMI..." |
| Clinic info | 1 chunk | Address, phone, hours, cancellation policy |
| FAQs | 1 chunk per entry | "Q: Que estudios hacen? A: Ecografia, ecodoppler..." |
| Services | 1 chunk per service | "Ecografia abdominal - $15000 - ayuno 8h - 30 min" |

### Vector Search with Tenant Isolation

```sql
-- RPC function: match_clinic_documents(query_embedding, match_clinic_id, match_count)
-- Returns content + metadata + similarity score
-- WHERE clinic_id = match_clinic_id
-- ORDER BY embedding <=> query_embedding
-- LIMIT match_count
```

### Conversation Memory

- **Redis**: active conversations (key: `conv:{clinic_id}:{phone}`, TTL 24h)
- **PostgreSQL** (`conversation_sessions`): completed conversations for analytics
- Flush: idle 30 min → move from Redis to PostgreSQL

---

## Database Changes (Migration 017)

### New Tables (4)

1. **`document_embeddings`** — pgvector store (clinic_id, source_type, content, embedding vector(1536), metadata JSONB)
2. **`conversation_sessions`** — completed WhatsApp conversations (clinic_id, patient_phone, messages JSONB, outcome)
3. **`clinic_faqs`** — admin-managed FAQ entries (clinic_id, question, answer, category)
4. **`clinic_services`** — services offered per clinic (clinic_id, name, duration, price, preparation_instructions)

### New Functions

- `match_clinic_documents(query_embedding, match_clinic_id, match_count)` — pgvector similarity search filtered by clinic_id

### Remove (n8n cleanup)

- DROP COLUMN `clinics.n8n_webhook_url`
- DROP COLUMN `clinics.n8n_webhook_secret`
- DROP TABLE `n8n_chat_histories`

### Add to `clinics`

- `whatsapp_connected_at TIMESTAMPTZ`
- `whatsapp_status TEXT DEFAULT 'not_connected'`
- `ycloud_api_key TEXT`

### RLS

- `document_embeddings`, `conversation_sessions` → service_role only (Python backend)
- `clinic_faqs`, `clinic_services` → staff can read own clinic, admin can manage

---

## Deployment

### VPS (Docker Compose)

```
VPS (Hetzner CX22, $5.39/mo for 1-10 clinics)
├── Caddy (reverse proxy + auto-SSL)
├── Docker Compose:
│   ├── fastapi-app (:8000)
│   ├── celery-worker (concurrency=4)
│   ├── celery-beat (scheduler)
│   └── redis (:6379)
└── (Phase 5: + orthanc + ohif + mirth)
```

### Domains

- `turnera.app` → Vercel (Next.js)
- `ai.turnera.app` → VPS (FastAPI)

### Celery Beat Schedule

| Job | Schedule | What |
|-----|----------|------|
| 24h reminders | Every 15 min | Query pending, send WhatsApp |
| Same-day reminders | 7:00 AM ART | Morning reminder batch |
| Flush conversations | Every 30 min | Redis → PostgreSQL |
| Sync embeddings | 2:00 AM ART | Re-embed all clinic data |

---

## Scaling Path

| Phase | Clinics | Supabase | VPS | Monthly Cost (excl. LLM) |
|-------|---------|----------|-----|--------------------------|
| 1 | 1-10 | Micro ($10) | CX22 2vCPU/4GB ($5) | $35-75 + LLM costs |
| 2 | 10-50 | Medium ($60) | CX32 4vCPU/8GB ($10) | $170-370 + LLM costs |
| 3 | 50-200 | Large ($110) | CX42 8vCPU/16GB ($25) | $535-1,135 + LLM costs |
| 5 | Sanatorio | Same + on-prem server | + Orthanc/OHIF/Mirth | +$130 amortized |

> LLM + embedding costs depend on provider choice. Could range from $0 (local models) to $15-500/mo (cloud APIs) depending on volume and provider.

---

## Migration Plan (What to Do)

### 1. Database migration (`supabase/migrations/20260401000000_python_ai_backend.sql`)
- Create 4 new tables + 1 function
- Add columns to clinics
- Drop n8n columns + table
- RLS policies + indexes

### 2. Remove n8n references from 15+ files
- CLAUDE.md, docs/plan.md, docs/architecture/*.md, docs/decisions/*.md, docs/system-design.md, docs/runbooks/*.md, src/proxy.ts, src/lib/supabase/admin.ts
- Regenerate database.ts types

### 3. Create new ADR-012: Python AI Backend (supersedes ADR-006)

### 4. Update Second Brain
- `turnera-overview.md` line 23: n8n → FastAPI + LangChain
- `2026-03-30-deep-research-completed.md`: minor chatbot reference

### 5. Initialize `turnera-ai/` Python project
- Docker Compose + FastAPI skeleton
- WhatsApp webhook (receive + echo)
- First agent tool: check_availability
- Incremental tool additions
- RAG pipeline
- Celery reminders
- Deploy to VPS

### 6. Update docs
- Rewrite docs/architecture/overview.md with new diagram
- Update docs/system-design.md reminder section
- Add docs/architecture/python-backend.md
- Update CLAUDE.md

---

## Verification

1. **Database**: Run migration, verify tables exist with `\dt`, verify pgvector with `SELECT * FROM pg_extension WHERE extname = 'vector'`
2. **Types**: Regenerate `database.ts`, verify n8n columns gone, new tables present
3. **Docs**: Grep for "n8n" across entire codebase — should only appear in ADR-006 (marked superseded) and historical research files
4. **Second Brain**: Verify turnera-overview.md updated
5. **Python**: `docker-compose up`, hit `/health`, verify 200 OK
6. **Webhook**: Send test WhatsApp message, verify it reaches FastAPI and echoes back
7. **RAG**: Seed a clinic's FAQs, sync embeddings, query via WhatsApp — verify relevant answer
8. **Reminders**: Create appointment for tomorrow, wait for Celery Beat cycle, verify WhatsApp sent
