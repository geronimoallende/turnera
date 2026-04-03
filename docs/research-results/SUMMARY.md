# Research Results Summary

Comprehensive summary of 33 research files across 6 categories, completed 2026-03-30. Each topic was researched independently by Claude and/or Gemini (deep research). Where both versions exist, differences are noted.

---

## Business (3 files, Claude only)

### 01 - Sales Strategy
**File:** `business/01-sales-strategy-claude.md`

Althem Group has a strategic advantage most startups lack: direct access to UPCN, one of Argentina's largest unions with 700,000+ affiliates, 5 sanatorios, and 132 centers nationwide. The research maps out who decides software purchases at each clinic size (solo doctor for small, committee for large), the 5 triggers that make clinics seek new software (regulatory mandates being #1 in 2026), and a complete 12-month go-to-market plan starting with Sanatorio de UPCN in Parana. It includes cold outreach scripts, objection-handling scripts in Spanish, legal compliance checklist (Ley 25.326 registration, data processing contracts), and competitive analysis of DrApp/Cormos ($10M raised, 18M+ turns/year), Medicloud, Turnito, Gendu, and Calu.

**Key takeaway:** Julio should be the commercial face (40-year-old accountant generates more trust in a conservative sector than an 18-year-old), while Geronimo positions as "the tech/AI brain." Compete on service and proximity (presencial in Entre Rios), not features. Target 10-12 paying clinics and $200K-400K ARS/month recurring revenue by month 12.

### 02 - Pricing Models
**File:** `business/02-pricing-models-claude.md`

The Argentine medical software market ranges from ARS $9,900 (Gendu) to $55,000/month (Doctoralia VIP). No competitor includes unlimited WhatsApp automation with AI chatbot in their base plan -- this is Turnera's core differentiator. Recommended pricing: 3 tiers at ARS $24,900/prof (solo), $18,900/prof (2-5 doctors), $14,900/prof (6-15 doctors), all including WhatsApp + AI chatbot. WhatsApp costs are the dominant variable cost at $0.026/msg (85-95% of variable costs per clinic). Unit economics show the business reaches viability at ~30-40 clinics, with a 27x ROI pitch: "Recover ARS $1,850,000/month in lost appointments for ARS $24,900."

**Key takeaway:** Charge in ARS (never USD), adjust quarterly by IPC, include WhatsApp in the base plan as the differentiator, and optimize conversational flows to maximize the free 24-hour service window (reduces WhatsApp costs 20-35%).

### 03 - Onboarding & Migration
**File:** `business/03-onboarding-migration-claude.md`

75% of users abandon new software in week 1 without effective onboarding, and 80% of Argentine health centers still use paper records. The research covers migration from paper (cuadernos, fichas), Excel, and competitor software, with detailed data cleaning strategies for Argentine-specific issues (DNI normalization, phone format to E.164, fuzzy name matching). The secretary's tacit knowledge is the most valuable and hardest-to-capture data -- dedicated 30-minute structured interviews are recommended. Parallel system operation should last 2-4 weeks, with productivity dropping 40-50% in week 1, recovering to 95-100% by week 4. The first 5 clients should be treated as co-creators, investing 15-24 hours per clinic in the first month.

**Key takeaway:** Never deliver an empty system -- pre-load patient data and existing appointments before go-live. The competitive gap is clear: no one combines personalized migration assistance + presencial training + affordable ARS pricing.

---

## Operations (4 files, Claude only)

### 01 - Secretary Daily Workflow
**File:** `operations/01-secretary-daily-workflow-claude.md`

The secretary is the true operator of Argentina's private health system, spending 6-8 hours daily juggling phone (40-50%), WhatsApp (30-40%), and presencial patients (10-20%) simultaneously. A typical office receives 40-80 phone calls daily plus dozens of WhatsApp messages, all managed manually. The 5 biggest pain points: ausentismo (33% no-show rate), manual phone/WhatsApp consuming hours, multi-obra-social complexity causing billing errors, systems that don't talk to each other, and existing software that's expensive/limited. The research identifies the "empty space" in the market: no product solves turnera + obras sociales management + affordable WhatsApp automation + MercadoPago, at a reasonable ARS price, for 3-10 doctor clinics.

**Key takeaway:** The MVP must include: multi-doctor visual agenda, WhatsApp automatic reminders, online booking link (no app/account required), patient database with obra social fields, check-in with one click, and payment registration with daily cash closing. Without all six, the secretary cannot abandon paper.

### 02 - Obras Sociales System
**File:** `operations/02-obras-sociales-system-claude.md`

Argentina has 300+ health financing entities (obras sociales, prepagas, PAMI), each with different rules for authorization, copayments, and billing. A typical urban clinic works with 20-40 different financiers regularly, though 80% of volume concentrates in 5-10 main ones. The research details the complete authorization flow (what requires prior auth, channels used, timing), billing cycles (monthly retrospective, 30-90 day payment terms), and the critical role of "gerenciadoras" (intermediary companies). It includes a proposed data model for the MVP covering insurance entities, plans, copayment configuration, and authorization workflow tracking.

**Key takeaway:** Do not attempt to integrate with obra social APIs in the MVP -- there are no public APIs and each prepaga has a different proprietary system. Instead, handle coverage verification as a separate manual process, and focus on correctly modeling the insurance entity + plan + copayment structure in the database.

### 03 - Sanatorio Operations
**File:** `operations/03-sanatorio-operations-claude.md`

A detailed operational anatomy of a typical 120-bed Argentine sanatorio: 250-400 employees, 20+ interdependent departments, and a complete patient flow from appointment to discharge. Covers the full organizational chart (Director Medico + Director Administrativo branches), all departments (asistenciales, diagnostico, terapeuticos, administrativos), ambulatory patient flow (8 steps), internacion flow, emergency flow, and quirofano scheduling. Important finding: UPCN does not own/operate a sanatorio in Cordoba -- the Red Sanatorio Anchorena is concentrated in AMBA. In Cordoba, UPCN has an administrative delegation and affiliates access contracted providers.

**Key takeaway:** The turnera must start with consultorios externos (ambulatory) as Phase 1, then expand to internacion admission, quirofano scheduling, and emergency triage as later phases. Each expansion roughly doubles complexity.

### 04 - Specialty Workflows
**File:** `operations/04-specialty-workflows-claude.md`

Appointment duration, preparation requirements, and workflows vary dramatically across medical specialties. The research covers 11 specialties in detail (clinica medica, cardiologia, dermatologia, traumatologia, ginecologia, pediatria, oftalmologia, ORL, urologia, diagnostico por imagen, laboratorio) with specific Argentine data. Average no-show rate is 25-30% (UdeSA study of 1,077,201 appointments), with the strongest predictor being booking lead time (14% for <7 days vs 32% for >7 days). Clear seasonal patterns exist: pediatrics peaks in winter, dermatology +30% in summer. The system must support sobreturnos (culturally accepted in Argentina) for some specialties but not others.

**Key takeaway:** The 5 most important product decisions: (1) configurable duration by specialty AND appointment type, (2) preparation instructions as first-class entities sent automatically, (3) laboratory needs a differentiated module (walk-in, not fixed schedule), (4) model the complete consultation-to-study-to-results cycle as a workflow, (5) anti-ausentismo must be a product pillar (WhatsApp reminders + prepayment + smart waitlist).

---

## Patient Experience (2 files, Claude only)

### 01 - Patient Self-Scheduling
**File:** `patient-experience/01-patient-self-scheduling-claude.md`

Phone still dominates (~40-50% of all appointments), but WhatsApp is closing the gap fast. Argentina leads the world in WhatsApp usage: 93% penetration, 31.4 hours/month per user. 65% of consumers expect a response in under 5 minutes via WhatsApp. Current competitor landscape: Doctoralia (110K+ professionals), Cormos (18M digital appointments/year), OSDE (3M+ online bookings, 4,543 digital agendas). No public APIs exist for prepaga integration. The generational divide is real: 97.8% of 18-29 year olds use phones vs 74.7-80% of 65+.

**Key takeaway:** For the MVP, WhatsApp chatbot + secretary scheduling is sufficient and correct -- it covers 85-90% of the market. A web self-scheduling portal should come at months 6-9, and should NOT require account creation (following Turnito's model). Never try to integrate with obra social apps -- there are no APIs.

### 02 - Patient Portal
**File:** `patient-experience/02-patient-portal-claude.md`

A patient portal MVP (login with OTP, study listing, PDF download) can be built in 3-4 weeks at ~USD 100-200/month operating cost. The Hospital Italiano is the regional benchmark with 700K registered users and 20K daily accesses. Key design decisions: passwordless auth via WhatsApp OTP (essential for patients 40+), magic link as fallback, delegated family access (critical for elderly patients). Lab results are the #1 adoption driver (used by 95.9% of active portal users). Realistic adoption: 20-30% in year 1 without aggressive promotion, potentially 50-65% with dedicated effort. A 15-30% of patients will never adopt digital -- always maintain an alternative channel.

**Key takeaway:** Build it as a separate subdomain (portal.clinica.com) sharing the same Supabase project. Use WhatsApp OTP for authentication, not passwords. The most important investment is in adoption strategy (assisted registration at the front desk), not features.

---

## Sanatorio (12 files: 6 topics x Claude + Gemini)

### 01 - DICOM Device Integration
**Files:** `sanatorio/01-dicom-device-integration-claude.md` and `-gemini.md`

DICOM is the universal standard for medical imaging (ISO 12052:2017), with 4,100+ pages of specification. The practical 80/20: master C-STORE (receive images), Orthanc's REST API (metadata), and OHIF (web visualization). The hierarchical data model is Patient > Study > Series > Instance. Modality Worklist (MWL) is the critical bridge between scheduling and imaging equipment, eliminating manual patient data entry on equipment consoles. Orthanc + OHIF can replace a broken Philips Vue PACS in 2-4 weeks for under USD 3,500 in hardware.

**Claude vs Gemini:** Claude is more practical and action-oriented ("here's what to build in week 1"), providing a prioritized implementation plan. Gemini is significantly more detailed on protocol internals (DIMSE commands, association negotiation, transfer syntaxes) and reads more like an academic textbook. Gemini is ~3x longer. Both reach the same conclusion on the Orthanc + OHIF recommendation.

### 02 - RIS/PACS Open-Source Solutions
**Files:** `sanatorio/02-ris-pacs-open-source-claude.md` and `-gemini.md`

Orthanc is the recommended mini-PACS: lightweight, REST API, Docker-ready, with real deployments in Malaysia, Ecuador, Belgium. OHIF Viewer (by Massachusetts General Hospital) is the gold standard for web DICOM visualization. For this project, Supabase acts as RIS and Orthanc as PACS, with Next.js as the unified interface. Storage requirements: CT studies are 50-500MB each, MRI 30-200MB. The RIS-PACS cycle has 7 steps: order > worklist > acquisition > storage > interpretation > report > delivery.

**Claude vs Gemini:** Claude provides a clearer "what to build" guide with Docker commands and week-by-week plan. Gemini provides deeper architectural analysis of the RIS/PACS distinction and more detailed protocol-level explanations. Both agree on the Orthanc + OHIF + Supabase architecture.

### 03 - Argentine Medical Laws & Compliance
**Files:** `sanatorio/03-argentine-medical-laws-claude.md` and `-gemini.md`

Health data are "datos sensibles" under Ley 25.326 (maximum protection). AWS Sao Paulo is legal but Brazil is NOT on the "adequate protection" list -- requires standard contractual clauses (Disp. 60-E/2016). Ley 26.529 requires digital health records to guarantee integrity, authenticity, inalterability, durability, and recoverability, with 10-year minimum retention. Both digital signature (certificated) and electronic signature (robust, with MFA + audit trail) are legally sufficient for health records (Decreto 393/2023). The database MUST be registered with the AAIP/RNBD.

**Claude vs Gemini:** Claude is more practical with a clear compliance checklist and specific recommendations for the Supabase/cloud setup. Gemini is significantly more thorough on legal doctrine, constitutional foundations (habeas data Art. 43), and the theoretical framework. Gemini covers WhatsApp-specific legal risks more deeply (informal clinical communication via messaging). Both reach the same practical conclusions.

### 04 - AI Medical Dictation
**Files:** `sanatorio/04-ai-medical-dictation-claude.md` and `-gemini.md`

No STT provider offers a medical model for Spanish -- the strategy must be general STT + LLM post-processing. Groq Whisper Large V3 is the clear winner: $0.00185/min, 299x real-time speed, ~$0.008 per 10-minute consultation -- 50-100x cheaper than Dragon Medical ($470/month/doctor). The pipeline: Audio > Whisper/Groq > free text > LLM (Claude/GPT) > structured JSON > TipTap editor > doctor reviews and signs. Argentine Spanish challenges: yeismo rehilado, s-aspiration, voseo -- Whisper handles these reasonably well. MVP buildable in 3-4 weeks, full system in 8-11 weeks.

**Claude vs Gemini:** Claude provides concrete cost tables, code examples, and a phased build plan. Gemini goes deeper into the phonetic challenges of Argentine Spanish and the linguistic theory behind ASR errors. Both recommend the same Groq Whisper + LLM pipeline.

### 05 - Medical Software Market
**Files:** `sanatorio/05-medical-software-market-claude.md` and `-gemini.md`

The Argentine health SaaS market grew from USD 123M (2021) to a projected USD 489M by 2028 (21.7% CAGR). No competitor offers a truly integrated platform combining turnos + native PACS + obra social billing + AI dictation + patient portal. Grupo Cormos dominates ambulatory turnos (50%+ market share, 25K professionals) but does NOT offer PACS, advanced billing, or internacion. Geclisa/Macena (Cordoba, 200+ clients, 30+ years) is the main local competitor for sanatorios. Critical security concern: Informe Medico was hacked in 2025 exposing 665,128 medical files from 30 clinics.

**Claude vs Gemini:** Claude is more concise with clearer competitive positioning recommendations. Gemini provides more granular detail on ANMAT regulations, international vendor presence (Philips, GE, Siemens), and the Cordoba market specifically. Both identify the same market gap.

### 06 - Medical Middleware
**Files:** `sanatorio/06-medical-middleware-claude.md` and `-gemini.md`

Healthcare integration engines (middleware) reduce N*N point-to-point interfaces to N hub-and-spoke connections. Mirth Connect 4.5.2 is the last open-source version (MPL 2.0) -- version 4.6+ is commercial (~$15-20K/year). Critical recommendation: start WITHOUT an integration engine, model data internally with FHIR structure, and add Mirth Connect only when the first real HL7v2 device appears. HAPI FHIR stores and serves FHIR resources; Mirth transforms and routes messages -- they're complementary, not alternatives. Commercial options (Rhapsody $25K+/year, InterSystems $50-150K+/year) are completely unnecessary for a Cordoba sanatorio.

**Claude vs Gemini:** Both reach the same practical conclusion (start simple, add middleware later). Gemini provides more detailed protocol comparisons and a more comprehensive evaluation table. Claude is more opinionated about what NOT to build yet.

---

## Technical (4 files, Claude only)

### 01 - WhatsApp Business API
**File:** `technical/01-whatsapp-business-api-claude.md`

Complete technical guide to WhatsApp Business API for medical scheduling. Three message categories: Utility ($0.026/msg, free within 24h window), Marketing ($0.0618), Authentication ($0.026). Service messages within the 24h window are always FREE. Argentina has no restrictions on healthcare use of WhatsApp (unlike US/France). Rate limits: Tier 0 = 250 contacts/24h, scaling to Tier 4 (unlimited). Templates are approved in 15-30 minutes via ML. Key design insight: engineer conversational flows so the patient responds first (e.g., "Reply CONFIRM"), which opens the free 24h service window for all subsequent utility messages.

**Key takeaway:** YCloud is the recommended BSP (zero markup over Meta pricing). The 24-hour service window optimization is the single most important technical lever for margins -- every percentage point improvement in patient response rate translates directly to profit.

### 02 - Multi-Tenant Scaling
**File:** `technical/02-multi-tenant-scaling-claude.md`

The current architecture (Supabase shared DB + RLS with clinic_id) is correct and will scale to 200-500 clinics without fundamental changes. RLS overhead is 2-5% per query with proper indexes. The critical optimization: wrap auth functions in SELECT (`(select auth.clinic_id())`) -- this converts 3-minute queries into 2ms queries. Notion ran 20 billion blocks on a single PostgreSQL before needing sharding. Schema-per-tenant is explicitly NOT recommended. Detailed scaling checklist: NOW (1-10 clinics), SOON (10-50), LATER (50+), with specific Supabase compute recommendations and cost estimates ($35/month at 1-10 clinics to $500-1000/month at 200-500).

**Key takeaway:** The three actions that matter now: (1) clinic_id with composite indexes on ALL tenant-scoped tables, (2) `(select auth.clinic_id())` wrapper in ALL RLS policies, (3) automate onboarding in an Edge Function. Everything else can wait.

### 03 - Notification Systems
**File:** `technical/03-notification-systems-claude.md`

WhatsApp has 98% open rate vs 32% for email in LATAM. Two interactive reminders (48h + 24h) with confirmation buttons reduce no-shows from 25-30% to 8-12%. Adding prepayment via MercadoPago drops it to 3-5%. The architecture uses Supabase natively: pg_cron as scheduler, pgmq as queue, Edge Functions as dispatchers, Realtime for in-app notifications -- no Redis, Kafka, or external notification services needed for the MVP. YCloud (zero markup BSP) keeps costs at USD 4-67/month for 100-1,000 appointments. The doctor's morning briefing email is the highest-value staff notification. Rate limiting (max 5-10 notifications/user/day) prevents alert fatigue.

**Key takeaway:** Build the notification system entirely within Supabase (pg_cron + Edge Functions + pgmq). The cost for 1,000 appointments/month is ~USD 67 total. Do NOT use n8n, Redis, or external notification services for the MVP.

### 04 - Offline/Reliability
**File:** `technical/04-offline-reliability-claude.md`

No Argentine scheduling system offers offline capability -- this is a genuine market differentiator. 47% of public primary care centers lack reliable internet, and even urban clinics face weekly outages. Supabase has ZERO built-in offline support (the #1 most-upvoted feature request since 2020). Worse, Supabase Auth actively breaks offline by deleting sessions when JWT refresh fails. Three tiers of offline support are recommended: Tier 1 (<5 min, everything works from cache), Tier 2 (5-30 min, core operations with warnings), Tier 3 (>30 min, fallback mode with conflict warnings + printable "paper mode"). PowerSync is the production-ready local-first option (free tier: 50 concurrent connections, official Supabase partner). A 5-day MVP implementation plan is provided.

**Key takeaway:** Even basic offline resilience (caching today's schedule + "you're offline" banner) would differentiate from every competitor. For the MVP, implement Tier 1 using TanStack Query persistence + Serwist service worker. PowerSync is the path for full offline-first if the market demands it.

---

## Turnera UX (8 files: 4 topics x Claude + Gemini)

### 01 - Calendar & Scheduling UI
**Files:** `turnera-ux/01-calendar-scheduling-ui-claude.md` and `-gemini.md`

The best medical calendar combines Jane App's sliding side panel, Doctolib's columns-per-doctor, and Argentine-specific WhatsApp integration. With FullCalendar free tier, multi-doctor view requires multiple synchronized instances (a workaround that avoids the $480/dev/year premium license). Argentine platforms have massive UX gaps vs international ones: none offer drag-and-drop, multi-doctor overlay, or visual state workflows. Key patterns: side panel for booking/details (not modals), background events for availability, status via block colors + complementary icons, blur mode for shared screens.

**Claude vs Gemini:** Claude analyzes 6 international + 5 Argentine competitors with specific UI pattern recommendations. Gemini is more theoretical about cognitive ergonomics and interaction design principles. Both recommend the same core patterns (side panel, column-per-doctor, color-coded states).

### 02 - Appointment Booking Flows
**Files:** `turnera-ux/02-appointment-booking-flows-claude.md` and `-gemini.md`

The dominant pattern is "click on calendar > side panel > fill fields > save" -- booking should take 3-4 clicks maximum. DNI search is mandatory for Argentina (Docturno implements this). Inline new-patient creation is critical (Doctolib does this best by preserving appointment data while creating the patient). No product supports natural language booking ("sometime next week"). The research covers 8 complete flow areas: new booking, rescheduling, cancellation, sobreturnos, recurring appointments, walk-ins, waitlist, and check-in/arrival.

**Claude vs Gemini:** Claude provides specific click-by-click flows from real products. Gemini is more structured around state machine theory and transition diagrams. Both provide comprehensive coverage but from different angles.

### 03 - Patient Management & CRM
**Files:** `turnera-ux/03-patient-management-crm-claude.md` and `-gemini.md`

The patient is the central axis, not the appointment. Global persistent search bar is the gold standard (DrChrono's "Hotspot Search" accessible from every page). DNI is the natural deduplication key in Argentina -- MEDICLINE's WhatsApp chatbot identifies patients by DNI sent via message. Patient profile should show: alerts at the top (allergies, no-show history, blacklist, balance), obra social with plan details, appointment history as timeline, and communication log. CRM-lite features (tags, segments, automated re-engagement for inactive patients) drive retention.

**Claude vs Gemini:** Claude analyzes 20+ real products with specific UX patterns. Gemini focuses more on architectural patterns and database design for CRM. Both emphasize the same core principle: patient-centric design with global search.

### 04 - Dashboard, Reports & Notifications
**Files:** `turnera-ux/04-dashboard-reports-notifications-claude.md` and `-gemini.md`

The calendar IS the homepage (industry standard), but sophisticated products are evolving toward KPI overlays on the calendar (Jane App's hybrid model). Three models exist: pure calendar home (majority), separate dashboard with KPIs (SimplyBook.me, DrChrono), and hybrid calendar + dashboard overlay (Jane App -- the most innovative). Key reports: no-show rate by doctor/specialty/day, occupancy percentage, revenue by obra social, and cancellation reasons. WhatsApp integration for reminders is table stakes in Argentina. The doctor's morning briefing is the highest-value notification.

**Claude vs Gemini:** Claude provides more specific product comparisons and actionable recommendations. Gemini is more theoretical about information architecture and cognitive load principles. Both recommend the hybrid calendar-as-homepage approach with KPI overlay.

---

## Cross-Cutting Themes

Several themes emerge across all 33 files:

1. **WhatsApp is THE channel in Argentina** -- 93% penetration, 98% open rate, 31.4 hours/month usage. Every product decision should be WhatsApp-first.

2. **The 33% no-show rate is the #1 sales pitch** -- WhatsApp reminders + prepayment can reduce it to 3-5%, generating a 27x ROI that makes the software price irrelevant.

3. **Obras sociales complexity is Argentina's unique challenge** -- 300+ entities, each with different rules. No system solves this well. Even partial automation is valuable.

4. **The secretary is the real user** -- She uses the system 8 hours/day. The doctor decides the purchase but the secretary determines adoption success.

5. **Price in ARS, never USD** -- The market expects pesos, quarterly adjustments, and MercadoPago integration.

6. **UPCN is the strategic play** -- 700K+ affiliates, 5 sanatorios, 132 centers. Even if national expansion doesn't materialize, the local Entre Rios market is viable.

7. **No competitor offers the full stack** -- Turnos + WhatsApp automation + obras sociales + PACS + AI dictation + patient portal. This integration is the long-term moat.
