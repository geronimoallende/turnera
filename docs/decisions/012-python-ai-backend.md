# ADR-012: Python AI Backend Replaces n8n

## Status
Accepted (supersedes ADR-006)

## Context
n8n was planned for WhatsApp chatbot and reminder workflows (one workflow per clinic). As requirements evolved to include RAG-based FAQ answering, patient history queries, intelligent booking conversations, and future AI dictation, n8n's visual workflow builder became insufficient. The AI agent needs:
- LLM integration with tool use (LangChain)
- Vector search for clinic knowledge (pgvector + RAG)
- Conversation memory across message turns
- Complex intent classification and routing

## Decision
Replace n8n entirely with a Python FastAPI backend:
- FastAPI handles WhatsApp webhooks directly from YCloud BSP
- LangChain orchestrates the AI agent with tools (booking, cancellation, FAQ, patient queries)
- Celery + Redis handles scheduled reminders and async jobs
- supabase-py with `service_role` key talks directly to Supabase (no Next.js middleman)
- Database triggers remain the source of truth for business rules (overlap, payments, no-show)
- LLM provider is TBD — architecture is LLM-agnostic via LangChain abstractions

## Alternatives Considered
- **Keep n8n + add AI layer**: n8n calls an AI service. But adds unnecessary hop, n8n's state management is weak for multi-turn conversations, and licensing for commercial SaaS use is unclear.
- **Build AI into Next.js API routes**: Keep everything in one codebase. But Python has the best AI/ML ecosystem (LangChain, vector stores, Celery), and mixing AI workloads with web UI hosting is architecturally messy.
- **Python backend via Next.js middleman**: Python calls Next.js API routes (like n8n was designed to). Unnecessary latency and complexity when database triggers already enforce all business rules.
- **Python talks directly to Supabase (chosen)**: Simplest, fastest, no duplicated logic. Database triggers protect data integrity for all callers.

## Consequences
- Clean domain split: Next.js = staff web UI, Python = AI + automation
- Two deployments to manage (Vercel + VPS) but they are fully independent
- Python uses `service_role` key — must always include `clinic_id` explicitly
- Per-clinic isolation maintained in RAG via `clinic_id` filter on vector search
- New tables: `document_embeddings`, `conversation_sessions`, `clinic_faqs`, `clinic_services`
- n8n columns removed from `clinics` table, `n8n_chat_histories` table dropped
