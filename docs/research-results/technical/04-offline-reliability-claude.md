# Offline-first architecture for Argentine medical scheduling software

**No Argentine scheduling system offers offline capability — and clinics desperately need it.** Research across 15+ competitors (AgendaPro, Wiri, Doctoralia, MediFé, and others) reveals a complete market gap: every product fails when internet drops. Meanwhile, **~47% of Argentina's public primary care centers lack reliable internet**, the government spent $8.2M just to bring satellite connectivity to 1,697 health centers with zero access, and even urban clinics face weekly outages. This document provides a complete offline strategy for a Next.js + Supabase turnera, from a 5-day MVP implementation to a full local-first architecture, with code examples, architecture patterns, and phased build recommendations.

---

## The Argentine connectivity crisis is worse than you think

Argentina's internet penetration looks strong at **90% nationally**, but the numbers mask a severe reliability problem for healthcare facilities. A Ministry of Health survey found that urban health centers have **60-85% connectivity penetration**, dropping to **~40% or less** in semi-urban and rural areas. The government's Plan Federal de Conectividad Satelital targeted 1,822 CAPS (primary care centers) that had literally no internet access — out of roughly 8,500 total CAPS nationwide.

Even where internet exists, reliability is poor. Major nationwide outages occur periodically — a documented August 2021 event lasted ~4 hours affecting millions. Regional fiber cuts leave entire corridors without service (a Patagonia fiber cut left the Bariloche-El Bolsón region disconnected with no estimated repair time). In 2022, 400 telecom cooperatives warned of potential service cuts due to import restrictions on networking equipment.

**Estimated outage frequency** by region (inferred from multiple sources — no official ENACOM statistics exist):

| Region | Outage frequency | Typical duration |
|--------|-----------------|------------------|
| Buenos Aires / AMBA | Weekly to bi-weekly | Minutes to a few hours |
| Provincial cities (Córdoba, Rosario, Mendoza) | Several times per week | Minutes to hours |
| Semi-urban / rural | Intermittent by default | Hours to days |

**Clinics have no backup infrastructure.** No evidence was found that Argentine clinics systematically deploy 4G failover or redundant connections. When internet drops, the documented fallback is informal: staff use personal mobile hotspots, revert to phone calls, or simply wait. Buenos Aires City's public health system explicitly maintains multi-channel fallback (web → WhatsApp bot "Boti" → phone line 147 → walk-in) precisely because single-channel digital systems are known to fail. The Buenos Aires provincial turnera FAQ warns users to "be patient and try again later" when systems go down.

**What secretaries do today:** They improvise. Many CAPS still maintain "espontaneous" walk-in scheduling alongside digital systems as a deliberate fallback. A La Plata municipality audit found clinics suffering from "non-functioning internet and phone services, bad and intermittent connectivity, and paper-based statistical records." When your turnera goes down, the secretary writes on paper, tracks patients from memory, and re-enters everything later — if she remembers.

---

## Zero competitors offer offline mode — this is your differentiator

A thorough review of **15+ Argentine and international scheduling products** found that not a single one offers genuine offline capability:

| Product | Type | Offline? | What happens when internet drops |
|---------|------|----------|--------------------------------|
| **AgendaPro** | Cloud SaaS (17+ countries) | ❌ None | Completely inaccessible |
| **Doctoralia** | Cloud marketplace (DocPlanner) | ❌ None | Platform inaccessible |
| **Wiri Salud** | Mobile-first (Argentine) | ❌ None | "100% online" — requires internet |
| **MediFé** | Prepaga app + web | ❌ None | Scheduling/telemedicine unavailable |
| **Argensoft** | Cloud + desktop client | ❌ None | Cloud-dependent |
| **Medicloud** | Cloud SaaS (Argentine) | ❌ None | Fully cloud-based |
| **PlexoMedica** | Web-only (Argentine) | ❌ None | "From any place with internet connection" |
| **Jane App** | Cloud SaaS (global) | ❌ None | 99.99% uptime claimed |
| **SimplePractice** | Cloud SaaS (global) | ❌ None | Requires connectivity |
| **Cliniko** | Cloud SaaS (global) | ❌ None | Cloud-dependent |

No PWA features, no service workers, no local-first architecture, no graceful degradation. Even government systems (Buenos Aires City CeSAC, Buenos Aires Province Turnos Web) are fully cloud-dependent and explicitly document downtime as expected.

**This is a genuine competitive advantage.** Even basic offline resilience — caching today's schedule and showing a clear "you're offline but here's your data" message — would differentiate your product from every competitor in the market.

---

## Three tiers of offline support and what to build at each

The offline strategy should follow a tiered model that matches outage duration to capability degradation. Here's the complete framework:

### Tier 1: Brief outage (< 5 minutes) — Everything keeps working

The secretary shouldn't even notice. The app continues functioning with cached data and queues changes locally.

**What works:** View today's full appointment list, see patient contact info and obra social, book new appointments (optimistic UI, queued for sync), cancel or reschedule (queued), search patients by name/DNI, navigate all pages (cached app shell).

**UI pattern:** Subtle yellow banner — *"Sin conexión — los cambios se guardarán cuando vuelva"*

### Tier 2: Medium outage (5-30 minutes) — Core operations continue with warnings

Scheduling continues but the secretary sees clear indicators that changes are pending confirmation.

**What works:** Everything from Tier 1, plus new patient registration (saved locally). **What degrades:** Real-time slot availability shows cached data with timestamp warning, WhatsApp notifications are deferred, all offline appointments show "pendiente de confirmación" badges.

**UI pattern:** Orange banner — *"Sin conexión desde las 10:23. Los turnos se confirmarán al reconectar."*

### Tier 3: Long outage (> 30 minutes) — Fallback mode with conflict warnings

The system remains usable but prominently warns about conflict risk for new bookings.

**What works:** Read-only access to all cached data, appointment creation with prominent conflict warnings. **What's disabled:** Payment processing, automated notifications, real-time availability. **Fallback:** "Modo papel" — printable view of today's schedule via PDF export.

**UI pattern:** Red persistent banner — *"⚠️ Sin conexión hace más de 30 min — los turnos nuevos podrían tener conflictos al reconectar."* Includes "Imprimir agenda" button.

### Architecture diagram for the offline strategy

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser/PWA)                         │
│                                                                     │
│  ┌──────────────┐  ┌──────────────────┐  ┌───────────────────────┐ │
│  │  Serwist SW  │  │   TanStack Query │  │   Dexie.js (IndexedDB)│ │
│  │              │  │                  │  │                       │ │
│  │ • App shell  │  │ • Query cache    │  │ • appointments        │ │
│  │ • Static     │  │ • Optimistic     │  │ • patients            │ │
│  │   assets     │  │   mutations      │  │ • offlineQueue        │ │
│  │ • API cache  │  │ • Persist to     │  │ • auditLog            │ │
│  │   (runtime)  │  │   localStorage   │  │                       │ │
│  └──────┬───────┘  └────────┬─────────┘  └───────────┬───────────┘ │
│         │                   │                         │             │
│  ┌──────┴───────────────────┴─────────────────────────┴───────────┐ │
│  │                    Network Status Manager                       │ │
│  │  • navigator.onLine + /api/health ping (30s interval)          │ │
│  │  • Tier calculation (1/2/3) based on offline duration           │ │
│  │  • Triggers sync when online, shows OfflineBanner when not     │ │
│  └──────────────────────────┬─────────────────────────────────────┘ │
└─────────────────────────────┼───────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │   ONLINE?         │
                    │  yes ↓     no ↓   │
                    └──┬────────────┬───┘
                       │            │
            ┌──────────┴──┐   ┌────┴──────────────┐
            │ Supabase    │   │ Queue mutations    │
            │ Cloud       │   │ in Dexie offline   │
            │             │   │ queue; serve from  │
            │ • Postgres  │   │ local cache        │
            │ • Auth      │   └───────────────────┘
            │ • Realtime  │
            │ • RPC       │
            └─────────────┘
```

**Sync flow when connection returns:**

```
offlineQueue (Dexie) → processQueue() → Supabase RPC (atomic slot lock)
    │                                         │
    │                                    ┌────┴────┐
    │                                    │ Result? │
    │                               ┌────┴───┐ ┌──┴────┐
    │                               │Success │ │Conflict│
    │                               └───┬────┘ └───┬───┘
    │                                   │          │
    ├── Update local: syncStatus='synced'   │          │
    └── Update local: syncStatus='conflict' ←──────────┘
                                           Show conflict UI
                                           with alternative slots
```

---

## What the Next.js + Supabase stack actually gives you (and doesn't)

### Supabase has zero built-in offline support

This is the most important technical finding. **Supabase-js has no offline capabilities whatsoever** — it's the #1 most-upvoted feature request in Supabase's GitHub (Discussion #357, opened 2020, still open). When offline, `supabase.from('table').select()` fails immediately with a network error. No local cache, no query queueing, no retry mechanism.

Worse, **Supabase Auth actively breaks offline**: when the JWT refresh fails due to no network, `_callRefreshToken()` deletes the stored session. Your secretary gets logged out because the internet dropped. The workaround is to cache the auth session in IndexedDB and defer token refresh until connectivity returns.

**Supabase Realtime is equally fragile offline.** It auto-reconnects via WebSocket, but reconnection is unreliable — multiple GitHub issues document status loops (SUBSCRIBED → CHANNEL_ERROR → CLOSED → TIMED_OUT). Critically, **missed events are never replayed.** Any database changes during disconnection are permanently missed unless you manually re-fetch.

### PowerSync is the production-ready local-first option

**PowerSync** is the strongest option for full offline-first with Supabase. It's an official Supabase partner that reads from Postgres WAL and syncs to client-side SQLite (WASM in browser). Key facts:

- **Production-ready** — spun off from JourneyApps platform with 10+ years in production for industrial apps
- **Web SDK v1 stable** since May 2024, with React Native, Flutter, Kotlin, and Swift SDKs
- **Free tier**: $0/month, 50 concurrent connections, 2GB sync/month, 500MB hosted data
- **Pro tier**: from $49/month with 1,000 concurrent connections
- **Self-hosted Open Edition**: completely free (source-available under FSL license)
- **Setup time**: ~2-4 hours for initial integration, 4-8 weeks for production-grade scheduling with conflict resolution
- Official **Next.js + Supabase demo** available on GitHub

### Library comparison matrix

| Feature | PowerSync | ElectricSQL | Replicache | TanStack Query + Custom |
|---------|-----------|-------------|------------|------------------------|
| **Maturity** | ✅ Production | ⚠️ Beta (Dec 2024) | ⚠️ Maintenance mode | ✅ Stable reads, ⚠️ brittle writes |
| **Offline reads** | ✅ Full (local SQLite) | ✅ Full (cached shapes) | ✅ Full (IndexedDB) | ⚠️ Cached data only |
| **Offline writes** | ✅ Upload queue | ❌ None (DIY) | ✅ Mutation queue | ⚠️ Limited, buggy persistence |
| **Conflict resolution** | Custom (you implement) | N/A | Server reconciliation | Manual |
| **Supabase integration** | ✅ Official partner | ✅ Works (needs IPv6) | ✅ Official partner | ✅ Any API |
| **Setup complexity** | Moderate | Low (reads only) | High (3 endpoints) | Low reads / High writes |
| **Cost** | Free tier + self-host | Open source | Free (open-sourced) | Free |
| **Recommendation** | Phase 3 if needed | Not for this use case | Avoid (maintenance mode) | **Phase 1-2 choice** |

### TanStack Query: good for caching, limited for offline writes

TanStack Query v5 provides three network modes: `online` (default), `always`, and `offlineFirst`. The `offlineFirst` mode tries the query function once then pauses retries — ideal when a service worker might serve cached data. Combined with `persistQueryClient`, the query cache survives page reloads.

However, **persistent offline mutation queuing is brittle.** Functions can't be serialized, so you must define `mutationDefaults` for every mutation key. A documented bug (TanStack/query#5847) causes `resumePausedMutations` to sometimes not fire after rehydration. For a turnera MVP, TanStack Query is excellent for read caching and basic optimistic updates, but don't rely on it for critical offline writes that must survive app restarts.

---

## Server-authoritative sync prevents double bookings

The central conflict scenario: a secretary books the 10:00 AM slot while offline. Meanwhile, a patient books the same slot via WhatsApp (hitting the server directly). When the secretary comes back online, both claim the same slot.

**The recommended strategy is server-authoritative with a human-in-the-loop conflict queue.** CRDTs are often suggested for offline sync but they solve data structure conflicts, not business logic conflicts. Two devices can both "reserve the last slot" and a CRDT merges perfectly while violating the constraint that only one patient can occupy a time slot.

### How it works in practice

The server is always the source of truth. Offline appointments are "proposals" that get validated on sync. The server uses Postgres advisory locks for atomic slot reservation:

```sql
CREATE OR REPLACE FUNCTION book_appointment(
  p_doctor_id UUID, p_slot_date DATE, p_slot_time TIME, p_patient_id UUID
) RETURNS JSONB AS $$
DECLARE
  existing RECORD;
  lock_key BIGINT;
BEGIN
  lock_key := hashtext(p_doctor_id::text || p_slot_date::text || p_slot_time::text);
  PERFORM pg_advisory_xact_lock(lock_key);

  SELECT * INTO existing FROM appointments
  WHERE doctor_id = p_doctor_id AND slot_date = p_slot_date
    AND slot_time = p_slot_time AND status != 'cancelled';

  IF existing IS NOT NULL THEN
    RETURN jsonb_build_object(
      'status', 'conflict',
      'currentSlot', row_to_json(existing),
      'alternatives', (SELECT jsonb_agg(s) FROM available_nearby_slots(...) s)
    );
  END IF;

  INSERT INTO appointments (doctor_id, slot_date, slot_time, patient_id, status)
  VALUES (p_doctor_id, p_slot_date, p_slot_time, p_patient_id, 'confirmed');
  RETURN jsonb_build_object('status', 'success');
END;
$$ LANGUAGE plpgsql;
```

When the offline queue syncs, each appointment proposal hits this RPC. Confirmed slots update locally to `syncStatus: 'synced'`. Conflicting slots get flagged as `syncStatus: 'conflict'` with a UI that shows the existing booking and suggests alternative nearby times. The secretary resolves it — she knows the patients, she can call them, she makes the judgment call. No algorithm can replace this human context.

### Handling payments and billing offline

**Defer card payment processing to online; record cash payments offline.** This follows the POS industry pattern (Square, for example, allows offline transactions up to configurable limits). For a medical turnera:

- **Cash/copago payments**: Record immediately offline with a local receipt number. Low risk — the money is already collected
- **Card payments**: Do NOT process offline. Record the billing amount, mark as "payment pending — awaiting connectivity," process when online
- **Obra social claims**: Always queue for online submission
- **AFIP invoicing**: Generate invoice with local sequential numbering offline, transmit when connected

### Audit trail requirements under Argentine law

Argentine Ley 26.529 requires clinical records to be "inalterable" with "marca temporal" (timestamp). Ley 25.326 (Data Protection) requires documenting who accesses personal data. Every offline action must capture dual timestamps (action time on device clock + server sync time), device ID, user ID, and a before/after snapshot of changes. The complete audit entry structure:

```typescript
interface AuditEntry {
  event_id: string;           // UUID v4
  action_type: 'appointment_created' | 'modified' | 'cancelled';
  entity_id: string;          // appointment UUID
  actor_id: string;           // user UUID
  device_id: string;          // unique per device
  performed_at: string;       // ISO-8601 with timezone (device clock)
  synced_at: string | null;   // filled on sync
  was_offline: boolean;
  offline_since: string | null;
  changes: { before: object; after: object };
  resolution?: {
    conflict_detected: boolean;
    resolution_type: 'auto_confirmed' | 'manual_merge' | 'rejected';
    resolved_by: string | null;
  };
}
```

---

## How healthcare systems handle downtime globally

No major EMR/EHR system offers true offline read-write mode. The universal pattern across hospital systems worldwide is **read-only cached data + paper fallback + manual re-entry upon recovery.**

Epic, the largest U.S. EMR (305M+ patient records), has the most mature downtime infrastructure called **Business Continuity Access (BCA)**. It provides three tiers: SRO (Shadow Read Only) for server-down/network-up scenarios, BCA Web for viewing cached patient reports, and BCA PC with standalone workstations that periodically download clinical data to local hard drives. None of these allow data entry — all changes during downtime go on paper forms and are manually re-entered in a strict sequence: ADT first, then scheduling, then orders, then clinical documentation.

**Key statistic:** A study of 80,381 incident reports found 76 directly related to EHR downtime. In **46% of cases, downtime procedures either didn't exist or weren't followed.** Lab results were delayed by ~62% during outages.

This pattern validates the phased approach for a turnera: even the most sophisticated healthcare systems rely on cached reads + paper as their primary fallback. The PDF export strategy isn't a compromise — it's industry standard.

---

## Practical implementation: PWA setup with Serwist and Dexie.js

### Service worker with Serwist (the recommended library for Next.js)

**Serwist** is the current recommended library, replacing the abandoned `next-pwa`. Next.js official docs reference it directly. It works with both webpack and Turbopack.

```bash
npm i @serwist/next && npm i -D serwist
```

**next.config.mjs:**
```typescript
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  additionalPrecacheEntries: [{ url: "/~offline", revision: "1" }],
  disable: process.env.NODE_ENV === "development",
  reloadOnOnline: false, // CRITICAL: prevents losing form data on reconnect
});

export default withSerwist({ /* your Next.js config */ });
```

**app/sw.ts:**
```typescript
import { defaultCache } from "@serwist/next/worker";
import { Serwist } from "serwist";

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    ...defaultCache,
    {
      urlPattern: /\/api\/appointments/,
      handler: "NetworkFirst",
      options: {
        cacheName: "appointment-api",
        expiration: { maxAgeSeconds: 60 * 30 },
        networkTimeoutSeconds: 3,
      },
    },
    {
      urlPattern: /\/api\/patients/,
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "patient-api",
        expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 },
      },
    },
  ],
  fallbacks: {
    entries: [{
      url: "/~offline",
      matcher({ request }) { return request.destination === "document"; },
    }],
  },
});
serwist.addEventListeners();
```

**Key gotchas:** Always disable Serwist in development (the #1 developer frustration is "my code changes aren't showing up" due to cached service workers). Set `reloadOnOnline: false` to prevent a secretary from losing an in-progress form when connectivity flickers. Add `"webworker"` to `lib` in tsconfig.json.

### Local database with Dexie.js

Dexie.js is the recommended IndexedDB library — Promise-based, with React hooks (`useLiveQuery`), excellent TypeScript support, and 200k+ weekly npm downloads.

```typescript
// lib/db.ts
import Dexie, { type EntityTable } from 'dexie';

interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  slotDate: string;
  slotTime: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  obraSocial?: string;
  syncStatus: 'synced' | 'pending' | 'conflict';
  updatedAt: number;
  createdOffline: boolean;
}

interface OfflineAction {
  id?: number;
  type: 'create_appointment' | 'cancel_appointment' | 'update_appointment';
  payload: any;
  timestamp: number;
  retries: number;
}

const db = new Dexie('TurneraDB') as Dexie & {
  appointments: EntityTable<Appointment, 'id'>;
  patients: EntityTable<Patient, 'id'>;
  offlineQueue: EntityTable<OfflineAction, 'id'>;
};

db.version(1).stores({
  appointments: 'id, patientId, doctorId, slotDate, [doctorId+slotDate], syncStatus',
  patients: 'id, dni, name, syncStatus',
  offlineQueue: '++id, type, timestamp',
});
```

**Reactive component using Dexie's `useLiveQuery`:**
```typescript
import { useLiveQuery } from 'dexie-react-hooks';

function TodayAppointments({ doctorId }: { doctorId: string }) {
  const today = new Date().toISOString().split('T')[0];
  const appointments = useLiveQuery(
    () => db.appointments
      .where('[doctorId+slotDate]')
      .equals([doctorId, today])
      .sortBy('slotTime'),
    [doctorId, today]
  );

  return (
    <ul>
      {appointments?.map(apt => (
        <li key={apt.id}>
          {apt.slotTime} — {apt.patientId}
          {apt.syncStatus === 'pending' && <span className="text-yellow-600"> ⏳</span>}
          {apt.syncStatus === 'conflict' && <span className="text-red-600"> ⚠️</span>}
        </li>
      ))}
    </ul>
  );
}
```

### Network status detection (don't trust `navigator.onLine`)

`navigator.onLine` is unreliable — MDN explicitly warns against using it to disable features. It returns `true` when connected to a LAN with no internet access. Use layered detection instead:

```typescript
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [tier, setTier] = useState<1 | 2 | 3>(1);
  const [lastOnline, setLastOnline] = useState(new Date());

  const checkServer = useCallback(async (): Promise<boolean> => {
    if (!navigator.onLine) return false;
    try {
      const res = await fetch(`/api/health?_=${Date.now()}`, {
        method: 'HEAD', cache: 'no-store',
        signal: AbortSignal.timeout(5000),
      });
      return res.ok;
    } catch { return false; }
  }, []);

  useEffect(() => {
    const update = async () => {
      const reachable = await checkServer();
      setIsOnline(reachable);
      if (reachable) {
        setLastOnline(new Date());
        setTier(1);
      } else {
        const offlineSec = (Date.now() - lastOnline.getTime()) / 1000;
        setTier(offlineSec < 300 ? 1 : offlineSec < 1800 ? 2 : 3);
      }
    };
    window.addEventListener('online', update);
    window.addEventListener('offline', () => setIsOnline(false));
    const interval = setInterval(update, 30_000);
    return () => { clearInterval(interval); /* cleanup listeners */ };
  }, [checkServer, lastOnline]);

  return { isOnline, tier, lastOnline };
}
```

### PWA manifest (makes it installable)

Making the app installable is critical — it bypasses Safari's **7-day storage eviction** for non-installed sites, provides a standalone window (no URL bar distractions), and signals to the secretary that this is "her" application.

```typescript
// app/manifest.ts
import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Turnera Médica',
    short_name: 'Turnera',
    description: 'Sistema de turnos para clínicas',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#2563eb',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  };
}
```

---

## The MVP vs future phases: a solo developer's honest roadmap

### Phase 1 — MVP launch (~5 days of offline work)

This is the pragmatic minimum that covers **90% of real clinic scenarios**. The secretary can see today's appointments when internet drops and has a paper fallback she printed at 8 AM.

**What to build:**
- PWA manifest + Serwist service worker (precache app shell + runtime cache API responses) — **2 days**
- Today's appointments cached via `StaleWhileRevalidate` — **1 day**
- "Sin conexión" banner component with tier-based messaging — **0.5 days**
- "Imprimir agenda del día" PDF export button (jsPDF + jspdf-autotable) — **1 day**
- Pre-cache tomorrow's appointments — **0.5 days**

**Packages to add:**
```json
{
  "@serwist/next": "^9.x",
  "serwist": "^9.x",
  "jspdf": "^2.x",
  "jspdf-autotable": "^3.x"
}
```

**The PDF export is your secret weapon.** It's the simplest, most reliable "offline" solution: the secretary prints it at 8 AM, and no internet outage can take that piece of paper away. This is literally what Epic and every major hospital system falls back to — cached reads and paper. You're in good company.

### Phase 2 — Post-launch enhancement (~2 weeks, after 10+ paying clinics)

Add persistent data caching and basic offline mutation queuing.

**What to build:**
- TanStack Query with `PersistQueryClientProvider` for cache that survives page reloads
- Mutation defaults for appointment CRUD operations
- Optimistic UI updates for booking/cancellation
- Dexie.js local database for structured offline storage
- Offline mutation queue with `processQueue()` sync engine
- Conflict detection and resolution UI

**Key addition — TanStack Query persistence setup:**
```typescript
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';

const persister = createSyncStoragePersister({ storage: window.localStorage });

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { gcTime: 1000 * 60 * 60 * 24, staleTime: 1000 * 60 * 5 },
    mutations: { gcTime: 1000 * 60 * 60 * 24 },
  },
});

// CRITICAL: Functions can't be serialized — must define defaults
queryClient.setMutationDefaults(['appointments', 'create'], {
  mutationFn: (newAppt) => supabase.rpc('book_appointment', newAppt),
});

// In App root:
<PersistQueryClientProvider
  client={queryClient}
  persistOptions={{ persister }}
  onSuccess={() => queryClient.resumePausedMutations()}
>
  <App />
</PersistQueryClientProvider>
```

### Phase 3 — Full offline-first (~4-8 weeks, only if proven necessary)

Only build this if you have 50+ clinics and receive frequent offline complaints, or if you're specifically targeting rural/provincial clinics.

**What to build:**
- PowerSync Web SDK integration with Supabase connector
- Local SQLite database (wa-sqlite WASM in browser)
- Sync rules for per-clinic data partitioning
- Full bidirectional sync with conflict resolution
- Replace TanStack Query data fetching with PowerSync local reads

**Cost analysis:** PowerSync Free tier handles 50 concurrent connections and 2GB sync/month — sufficient for a clinic with 2-3 secretaries. At 10 clinics (~20-30 connections), you're still on free. At 50+ clinics, you'd need Pro ($49/month) — but at that scale, you have revenue to cover it. The alternative of building a custom sync engine from scratch would take **months** of development time worth far more than $49/month.

### Decision framework

| Signal | Action |
|--------|--------|
| You're pre-launch, building MVP | **Phase 1 only** (5 days) |
| 10+ paying clinics, no offline complaints | **Stay at Phase 1**, add PDF if not done |
| Clinics mention "it breaks when internet drops" | **Add Phase 2** (2 weeks) |
| Targeting rural/provincial clinics specifically | **Plan Phase 3** from the start |
| 50+ clinics, offline is a recurring support issue | **Build Phase 3** with PowerSync |

---

## Conclusion: practical truths for building offline in Argentina

The research reveals three counterintuitive findings. First, **the bar is absurdly low** — because zero competitors offer any offline capability, even basic cached reads make your product meaningfully better. You don't need CRDTs, you don't need PowerSync, you don't need a PhD in distributed systems. You need a service worker, a cached appointment list, and a print button.

Second, **healthcare's own answer is paper.** Epic Systems, the world's largest EMR vendor, falls back to printed reports and paper forms. The PDF export isn't a hack — it's the industry-standard offline contingency. Build it with confidence.

Third, **the hard problem isn't caching, it's conflict resolution.** Two people booking the same slot from different channels while one is offline is a genuine distributed systems challenge. But for a small clinic, the answer is simple: the server is always right, offline bookings are proposals, and when conflicts happen, show both bookings to the secretary and let her decide. She knows the patients. She'll call one and reschedule. This human-in-the-loop approach is more reliable than any algorithm.

**Start with 5 days of work.** Ship the PWA shell, the cached schedule, the offline banner, and the PDF export. Tell clinics "your schedule stays visible even without internet, and you can always print it." That's already more than any competitor offers in Argentina. Then listen to what your users actually need before investing weeks in full offline-first architecture.