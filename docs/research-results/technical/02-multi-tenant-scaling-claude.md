# Arquitectura multi-tenant para tu turnera: de 1 a 500 clínicas con Supabase

**Tu arquitectura actual — Supabase compartido + RLS con `clinic_id` — es la decisión correcta y te llevará cómodamente hasta 200–500 clínicas sin cambios fundamentales.** La clave no es migrar de patrón ahora, sino implementar las optimizaciones correctas en cada etapa. Las empresas más exitosas del mundo (Shopify, Notion, Figma, Slack) arrancaron exactamente así — una sola base de datos compartida — y solo migraron a sharding cuando alcanzaron millones de usuarios. Para una turnera médica en Argentina apuntando a 50–500 clínicas, el overhead de RLS bien implementado es del **2–5% por query**, equivalente a un WHERE clause adicional. Este documento es tu hoja de ruta completa, desde la primera clínica hasta la escala.

---

## 1. Comparación de patrones multi-tenant: cuál usar y cuándo

### Base de datos compartida + RLS (tu modelo actual)

Este es el patrón que usan la mayoría de los SaaS B2B exitosos en etapa temprana y media. Todas las clínicas comparten las mismas tablas, y una columna `clinic_id` en cada tabla tenant-scoped, combinada con políticas RLS de PostgreSQL, garantiza que cada clínica solo vea sus datos.

**Rendimiento real medido**: Con índices compuestos en `(clinic_id, ...)`, el overhead de RLS es de **2–4% sobre queries indexados** (benchmarks en PostgreSQL 16, 10M filas, 500 tenants). Políticas simples como `clinic_id = current_setting('app.clinic_id')` se optimizan exactamente igual que un WHERE clause — el query planner de PostgreSQL las empuja hasta el index scan. El problema aparece con **políticas complejas que incluyen subqueries**: una política mal escrita que hace JOIN contra otra tabla puede convertir un query de 2ms en uno que tarda **3+ minutos** en una tabla de 1M filas.

**Cuándo empieza a sufrir**: No es por cantidad de tenants sino por **volumen total de datos, complejidad de políticas e indexación**. Con 500 clínicas × 10K turnos cada una = 5M filas — PostgreSQL maneja esto trivialmente. Los puntos de dolor reales son: CPU del servidor consistentemente >60%, queries complejos que no usan índices, y el problema del "vecino ruidoso" (una clínica que hace queries pesados afectando a todas las demás).

**Pros**: Operativamente simple (un schema, una migración, un backup). Costo mínimo. Onboarding instantáneo (solo insertar filas). RLS previene bugs de aplicación (WHERE olvidados).

**Cons**: Riesgo de leak entre tenants si RLS está mal configurado. Superusers y table owners bypassean RLS por defecto. Sin aislamiento de recursos por tenant nativo. Backup/restore por tenant individual requiere solución custom.

### Schema-per-tenant (un esquema PostgreSQL por clínica)

Cada clínica tiene sus propias tablas dentro de un schema separado (`clinic_abc.appointments`, `clinic_xyz.appointments`). Supabase **no soporta bien este patrón** — sus client libraries están diseñadas para tablas compartidas. Además, las migraciones escalan linealmente: con 500 clínicas, cada migración se ejecuta 500 veces. El catálogo de sistema de PostgreSQL sufre degradación notable arriba de ~1,000 schemas. **Bytebase (2026) recomienda evitarlo**: "Introduce complejidad comparable a database-per-tenant sin ofrecer aislamiento suficiente."

**Veredicto**: No usar para la turnera. Mayor complejidad sin beneficio real sobre RLS bien implementado.

### Database-per-tenant (una base de datos por clínica)

Cada clínica tiene su propia instancia de base de datos. En Supabase, esto significaría un proyecto separado por clínica (~$25/mes mínimo cada uno). Un caso de PingCAP documentó un SaaS que migró a per-tenant databases en AWS Aurora y la factura "amenazó la viabilidad del negocio". Un equipo de DBAs que eliminó este patrón reportó que sus DBAs "nos invitaron a una cena elegante para celebrar".

**Cuándo es necesario**: Requisitos regulatorios de aislamiento físico (HIPAA estricto, residencia de datos geográfica), clientes enterprise "whale" con SLAs dedicados, o cuando necesitás encripción con llaves separadas por cliente. Para clínicas argentinas en una turnera, **no es necesario**.

### Qué usan las empresas exitosas

| Empresa | Modelo inicial | Modelo actual | Escala |
|---------|---------------|---------------|--------|
| **Shopify** | Una sola DB MySQL | Sharded MySQL + "pods" (DB por grupo de shops) | 275K+ merchants |
| **Notion** | Una sola DB PostgreSQL | 96 DBs físicas, sharding por workspace_id | 200B+ blocks |
| **Figma** | Una sola DB PostgreSQL (RDS) | Particionamiento vertical (12 DBs) + sharding horizontal | ~100x crecimiento desde 2020 |
| **Slack** | Sharded MySQL/Vitess | Sharding por workspace_id | 1B+ mensajes/semana |
| **Stripe** | MongoDB | Custom DocDB sharding por merchant_id | 5M queries/segundo |

**El patrón universal**: Todas empezaron con una sola base de datos. Todas migraron a sharding por tenant_id cuando la CPU superó 60–65% consistentemente o las migraciones de schema empezaron a tardar semanas. **Ninguna usa schema-per-tenant a gran escala** — todas van directo de shared-DB a sharding horizontal. La lección para tu turnera: **tu modelo actual es exactamente el correcto para tu etapa**.

---

## 2. Multi-tenancy específico de Supabase: configuración y límites reales

### RLS performante: la optimización que cambia todo

La diferencia entre RLS lento y rápido es una sola técnica. Envolver las funciones de auth en un `SELECT` hace que PostgreSQL evalúe la función **una sola vez** en lugar de por cada fila:

```sql
-- ❌ LENTO: auth.uid() se evalúa por cada fila
USING (clinic_id = auth.clinic_id());

-- ✅ RÁPIDO: se evalúa una vez y se cachea
USING (clinic_id = (select auth.clinic_id()));
```

MakerKit, con más de 100 deployments en producción, reporta que esta técnica convirtió queries de **3 minutos en respuestas de 2ms**. La segunda optimización crítica es la dirección del query en políticas con JOINs:

```sql
-- ❌ LENTO: correlaciona con cada fila
USING ((select auth.uid()) IN (
  SELECT user_id FROM clinic_members WHERE clinic_members.clinic_id = appointments.clinic_id
));

-- ✅ RÁPIDO: obtiene los clinic_ids del usuario una vez
USING (clinic_id IN (
  SELECT clinic_id FROM clinic_members WHERE user_id = (select auth.uid())
));
```

**Regla práctica**: 1–3 políticas simples por tabla tienen overhead despreciable. Políticas con subqueries contra otras tablas protegidas por RLS generan evaluación en cadena — usar funciones `SECURITY DEFINER` para bypassear el RLS anidado.

### Función helper esencial para RLS

```sql
CREATE OR REPLACE FUNCTION auth.clinic_id()
RETURNS text LANGUAGE sql STABLE AS $$
  SELECT nullif(
    (current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'clinic_id'),
    ''
  )::text
$$;
```

### Índices obligatorios en cada tabla tenant-scoped

```sql
-- Índice simple en clinic_id (mínimo)
CREATE INDEX idx_appointments_clinic ON appointments (clinic_id);
-- Índice compuesto para queries comunes (ideal)
CREATE INDEX idx_appointments_clinic_date ON appointments (clinic_id, appointment_date);
CREATE INDEX idx_patients_clinic_name ON patients (clinic_id, last_name);
```

**Sin estos índices compuestos, RLS no puede usar index scans y escanea toda la tabla.** Este es el "performance killer #1" documentado.

### Connection pooling: Supavisor y límites reales

Supabase usa **Supavisor** (cloud-native, escrito en Elixir) como pooler principal, y opcionalmente **PgBouncer** dedicado para mínima latencia. Siempre usar **transaction mode (puerto 6543)** para tráfico API/serverless.

| Compute | Precio/mes | Conexiones directas | Pooler clients | Pool size |
|---------|-----------|--------------------|--------------------|-----------|
| Micro (incluido en Pro) | $10 | 60 | 200 | 15 |
| Small | $15 | 90 | 200 | 15 |
| Medium | $60 | 120 | 200 | 15 |
| Large | $110 | 160 | 300 | 20 |
| XL | $210 | 240 | 700 | 30 |
| 2XL | $410 | 380 | 1,500 | 50 |

**Para 50 clínicas con ~5 usuarios concurrentes cada una = ~250 conexiones simultáneas máximo**: el plan Micro (200 pooler clients) alcanza apretado; **Medium o Large es la recomendación** cuando llegues a 20+ clínicas activas.

### Supabase Auth multi-tenant: una pool, muchas clínicas

Usar una sola instancia de Auth para todas las clínicas. El `clinic_id` se almacena en `app_metadata` del usuario (solo modificable server-side):

```javascript
// Server-side con service_role key
await supabase.auth.admin.updateUserById(userId, {
  app_metadata: { clinic_id: clinicId, role: 'admin' }
});
```

**Crítico**: Nunca usar `user_metadata` para `clinic_id` — los usuarios pueden modificarlo desde el cliente. Solo `app_metadata` es seguro porque requiere `service_role` key.

Para inyectar el `clinic_id` directamente en el JWT, usar **Custom Access Token Hook**:

```sql
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb LANGUAGE plpgsql STABLE AS $$
DECLARE claims jsonb; v_clinic_id text;
BEGIN
  claims := event->'claims';
  SELECT cm.clinic_id INTO v_clinic_id
  FROM public.clinic_memberships cm
  WHERE cm.user_id = (event->>'user_id')::uuid LIMIT 1;
  claims := jsonb_set(claims, '{clinic_id}', to_jsonb(v_clinic_id));
  RETURN jsonb_set(event, '{claims}', claims);
END; $$;
```

### Storage per-tenant: un bucket, carpetas por clínica

```
clinic-files/
  ├── {clinic_id_1}/logos/logo.png
  ├── {clinic_id_1}/documents/consent.pdf
  ├── {clinic_id_2}/logos/logo.png
  └── {clinic_id_2}/documents/...
```

Política RLS en `storage.objects` para aislamiento:

```sql
CREATE POLICY "Aislamiento por clínica" ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'clinic-files' AND
  (storage.foldername(name))[1] = (
    current_setting('request.jwt.claims')::jsonb -> 'app_metadata' ->> 'clinic_id'
  )
);
```

### Realtime: sí respeta RLS

Supabase Realtime con `postgres_changes` **respeta las políticas RLS** — los usuarios solo reciben eventos de filas que sus políticas permiten. Agregar filtro explícito por `clinic_id` como optimización adicional:

```javascript
supabase.channel('turnos')
  .on('postgres_changes', {
    event: '*', schema: 'public', table: 'appointments',
    filter: `clinic_id=eq.${clinicId}`
  }, handler)
  .subscribe();
```

**Límites Pro**: 500 conexiones realtime peak, 5M mensajes/mes. Overage: $10/1K conexiones, $2.50/1M mensajes.

### Límites del plan Pro ($25/mes base)

| Recurso | Incluido | Overage |
|---------|----------|---------|
| Base de datos | 8 GB disco (auto-escala) | $0.125/GB/mes |
| Storage | 100 GB | $0.021/GB/mes |
| MAUs (Auth) | 100,000 | $0.00325/MAU |
| Edge Functions | 2M invocaciones | $2/millón |
| Backups | Diarios, 7 días retención | — |
| Egress | 250 GB | $0.09/GB |

---

## 3. Automatización de onboarding: de signup a primera consulta agendada

### Qué debe pasar cuando una clínica se registra

El onboarding debe ser un **proceso único orquestado por una Edge Function** usando `service_role`:

1. Crear registro en tabla `clinics` (UUID, nombre, slug, plan = 'trial')
2. Asignar `clinic_id` en `app_metadata` del usuario que se registra
3. Crear membresía: usuario como `owner` en `clinic_memberships`
4. Seedear configuración default (horarios Lun-Vie 8:00-20:00, tipos de turno: Consulta General 30min, Control 15min, Primera Consulta 45min)
5. Seedear datos demo (2 doctores ficticios, 3 pacientes de ejemplo, turnos de la próxima semana)
6. Enviar email de bienvenida con checklist de setup
7. Configurar cuenta de billing (MercadoPago)

```sql
CREATE TABLE clinics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  plan TEXT NOT NULL DEFAULT 'trial',
  status TEXT NOT NULL DEFAULT 'onboarding',
  config JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  trial_ends_at TIMESTAMPTZ DEFAULT (now() + interval '14 days')
);
```

### Modelo híbrido para clínicas médicas argentinas

Las secretarias de consultorio son las usuarias principales, no los médicos. Son cómodas con WhatsApp y apps web básicas pero pueden frustrarse con configuración compleja. **El onboarding debe sentirse como configurar un perfil de WhatsApp Business** — simple, visual, mobile-friendly.

**Tier 1 — Self-service (60% de clínicas)**: Wizard guiado de 5 pasos → Nombre clínica → Horarios → Primer doctor → Primer tipo de turno → Página de turnos funcionando. Tiempo objetivo: **menos de 5 minutos hasta el primer "¡funciona!"**

**Tier 2 — Low-touch asistido (30%)**: Mismo flujo self-service + link de Calendly para agendar videollamada de 30 minutos donde un CSM configura la cuenta junto con la admin de la clínica.

**Tier 3 — White-glove (10% — policlínicas grandes)**: Onboarding especialista dedicado, migración de datos custom, capacitación del staff.

### Trial con datos demo pre-cargados

Implementar trial de **14 días** con datos de ejemplo que permitan explorar el producto sin configurar nada. Marcar `clinics.plan = 'trial'` con `trial_ends_at`. Enviar emails automáticos día 7, 12 y 14. **Métrica clave de activación**: "primer turno real agendado". Al vencer el trial, degradar a tier limitado gratuito — nunca borrar datos.

### Importación de pacientes desde Excel/CSV

Usar **SheetJS** para parsear archivos en el browser. Implementar UI de mapeo de columnas con auto-detección (columna "DNI" → `patients.dni`). Validaciones específicas para Argentina:

- DNI: 7–8 dígitos
- Teléfono: formato argentino (+54 11 XXXX-XXXX)
- Fecha nacimiento: **DD/MM/AAAA** (no MM/DD/YYYY)
- Obra social: match contra lista conocida

Procesar asincrónicamente vía Edge Function. No bloquear por errores — guardar filas válidas, retornar errores con número de fila, columna y mensaje. Para deduplicación, matchear por DNI primero, luego por teléfono + nombre.

---

## 4. Personalización por clínica sin bloat en la base de datos

### JSONB para configuración, tablas dedicadas para entidades

La regla es simple: si se lee frecuentemente y se escribe raramente, va en `clinics.config` (JSONB). Si tiene su propio ciclo de vida, necesita índices, foreign keys o puede crecer ilimitadamente, va en tabla dedicada.

```jsonc
// clinics.config — estructura recomendada
{
  "branding": {
    "logo_url": "https://...",
    "primary_color": "#2563EB",
    "accent_color": "#10B981"
  },
  "business_hours": {
    "mon": {"open": "08:00", "close": "20:00"},
    "sat": {"open": "08:00", "close": "13:00"},
    "sun": null
  },
  "booking": {
    "max_advance_days": 30,
    "min_advance_hours": 2,
    "cancellation_policy": "Cancelaciones con 24hs de anticipación"
  },
  "notifications": {
    "reminder_hours_before": [24, 2],
    "whatsapp_enabled": true,
    "email_enabled": true
  },
  "features": {
    "online_payments": false,
    "telemedicine": false,
    "patient_portal": true,
    "waitlist": false
  }
}
```

Usar `jsonb_set()` para actualizaciones parciales — nunca reemplazar toda la columna.

### Feature flags basados en plan + overrides por clínica

El patrón más efectivo para la turnera es combinar **entitlements por plan** con **overrides por clínica**:

```sql
CREATE TABLE plans (
  id TEXT PRIMARY KEY, -- 'free', 'basic', 'professional'
  name TEXT NOT NULL,
  features JSONB NOT NULL
  -- {"max_doctors": 3, "online_payments": false, "whatsapp": true}
);

CREATE TABLE clinic_feature_overrides (
  clinic_id UUID REFERENCES clinics(id),
  feature_key TEXT NOT NULL,
  enabled BOOLEAN NOT NULL,
  expires_at TIMESTAMPTZ, -- para trials de features premium
  PRIMARY KEY (clinic_id, feature_key)
);
```

Lógica de evaluación: primero chequear override por clínica, luego caer al plan. Esto permite dar acceso temporal a features premium ("probá telemedicina gratis 30 días") sin cambiar el plan.

**Herramientas recomendadas**: Para tu etapa, flags custom en la DB. Al crecer, **PostHog** (free tier generoso, SDK de Next.js, analytics incluido). Para enterprise: LaunchDarkly.

### White-labeling: branding "lite" ahora, dominio custom después

**Implementar ahora**: Logo por clínica en la página de turnos, colores primario/acento vía CSS custom properties, URL tipo `turnera.app/clinica-nombre` o `clinica-nombre.turnera.app`, mensaje de bienvenida personalizado.

```typescript
// Layout de página de turnos
const { branding } = clinic.config;
return (
  <div style={{
    '--primary': branding.primary_color,
    '--accent': branding.accent_color
  }}>
    {branding.logo_url && <img src={branding.logo_url} alt={clinic.name} />}
  </div>
);
```

**Diferir para tier enterprise**: Dominios custom (`turnos.clinicasanmartin.com.ar`) usando **Vercel for Platforms** — maneja SSL automático, DNS routing y wildcard domains. Next.js middleware resuelve el tenant por hostname.

---

## 5. Preocupaciones operacionales: monitoreo, billing, backups y migraciones

### Monitoreo por clínica sin revisión manual

Inyectar `clinic_id` como tag en todas las herramientas de observabilidad. **Sentry** con tags custom para error tracking por tenant. **PostHog** para analytics de producto con metadata de organización. Construir un health check automatizado como Edge Function programada:

```sql
-- Vista materializada de salud por clínica (actualizar nightly)
CREATE MATERIALIZED VIEW clinic_health AS
SELECT
  c.id as clinic_id, c.name,
  COUNT(a.id) FILTER (WHERE a.created_at > now() - interval '7 days') as appointments_last_7d,
  COUNT(DISTINCT u.id) as active_users,
  MAX(a.created_at) as last_appointment,
  c.status
FROM clinics c
LEFT JOIN appointments a ON a.clinic_id = c.id
LEFT JOIN clinic_memberships cm ON cm.clinic_id = c.id
LEFT JOIN auth.users u ON u.id = cm.user_id
GROUP BY c.id;
```

Alertar cuando: clínica con usuarios activos tiene 0 turnos en 7 días, spike repentino de errores por `clinic_id`, o inactividad inesperada de clínica previamente activa.

### Billing: MercadoPago para Argentina

Para clínicas argentinas, **suscripciones flat-rate con MercadoPago** es lo más práctico. La API de MercadoPago Subscriptions soporta cobros recurrentes en ARS, trials, y pagos con tarjeta, Rapipago y Pago Fácil. El billing por uso (metered) es complejo con MercadoPago — arrancar con tiers fijos (Básico/Pro/Enterprise con límites de turnos) y trackear usage internamente para informar decisiones de pricing.

```sql
CREATE TABLE usage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES clinics(id),
  event_type TEXT NOT NULL, -- 'appointment_created', 'message_sent'
  quantity INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Backup y restore por clínica individual

Con base de datos compartida, **no se puede usar PITR nativo de Supabase para restaurar una sola clínica**. La solución es **export lógico por tenant**:

```sql
-- Exportar datos de una clínica
COPY (SELECT * FROM appointments WHERE clinic_id = $1) TO STDOUT WITH CSV HEADER;
COPY (SELECT * FROM patients WHERE clinic_id = $1) TO STDOUT WITH CSV HEADER;
```

Programar exports nocturnos a Supabase Storage organizados por `clinic_id/fecha/`. Alternativa más robusta: **restore-to-side** (restaurar backup completo a DB temporal, extraer filas de la clínica, upsert de vuelta a producción).

### Migraciones de schema: más simple de lo que parece

Con schema compartido, las migraciones se aplican **una sola vez** a las tablas compartidas — mucho más simple que schema-per-tenant. Usar el patrón **expand-contract** para zero-downtime:

1. **Expand**: Agregar nueva columna/tabla (compatible hacia atrás)
2. **Migrate**: Backfill datos de estructura vieja a nueva
3. **Contract**: Eliminar columna/tabla vieja después de confirmar que todo usa la nueva

Usar **Supabase CLI** (`supabase migration new`) con archivos en Git desde el día 1. Nunca renombrar o eliminar columnas en una sola migración. Siempre agregar columnas `NOT NULL` con DEFAULT, o como nullable primero. Usar `CREATE INDEX CONCURRENTLY` para evitar locks.

---

## 6. Seguridad y aislamiento: defensa en profundidad más allá de RLS

### Capas de seguridad necesarias

RLS es la base pero **no es suficiente solo**. Implementar defensa en profundidad:

1. **RLS** (capa de base de datos) — ya implementado con `clinic_id`
2. **Validación en aplicación** — verificar `clinic_id` en API routes/middleware de Next.js, nunca confiar solo en el cliente
3. **Gestión de keys** — `service_role` key NUNCA en código cliente; solo en Edge Functions y server-side
4. **Audit logging** — trigger en tablas sensibles registrando operación, clinic_id, user_id, datos anteriores/nuevos
5. **Encripción** — TLS en tránsito (default de Supabase); considerar encripción a nivel columna para datos de salud sensibles (DNI, diagnósticos) usando Supabase Vault
6. **Tests automatizados de aislamiento** — CI que verifica que un tenant no puede acceder a datos de otro

### Verificación automatizada de RLS en CI

```sql
-- Script CI: verificar que todas las tablas tenant tienen RLS habilitado
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('appointments', 'patients', 'doctors', 'clinic_members')
AND rowsecurity = false;
-- Si retorna filas, FALLAR el build
```

Test de aislamiento automatizado: conectar como tenant A, intentar leer datos de tenant B, verificar que retorna 0 filas. Ejecutar esto en cada deploy.

### Rate limiting por clínica con Upstash

```typescript
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, "1m"),
});

// En middleware de Next.js
const clinicId = session.user.app_metadata.clinic_id;
const { success } = await ratelimit.limit(`clinic:${clinicId}`);
if (!success) return new Response("Rate limited", { status: 429 });
```

Usar `clinic_id` como key de rate limit (no IP), así toda la clínica comparte cuota. Límites sugeridos: login 10/min por IP, CRUD de turnos 100/min por clínica, búsquedas 500/min, operaciones bulk 5/min.

### Tenant ruidoso: detección y mitigación

Trackear métricas por `clinic_id`: llamadas API, queries a DB, tasa de errores. Alertar cuando una clínica excede 3x el uso promedio. Rate limiting es la primera línea de defensa. A escala (50+ clínicas), implementar `SET statement_timeout` por sesión para limitar queries pesados. En la práctica, el 95% de los problemas de "noisy neighbor" se resuelven con **rate limiting + buenos índices**.

### GDPR y Ley 25.326: eliminación completa de datos

Construir un **procedimiento de offboarding documentado y testeado**:

```sql
BEGIN;
DELETE FROM appointment_messages WHERE appointment_id IN
  (SELECT id FROM appointments WHERE clinic_id = $1);
DELETE FROM appointments WHERE clinic_id = $1;
DELETE FROM patients WHERE clinic_id = $1;
DELETE FROM clinic_memberships WHERE clinic_id = $1;
DELETE FROM clinics WHERE id = $1;
-- También: eliminar usuarios de Auth, archivos de Storage
COMMIT;
```

La Ley 25.326 de Protección de Datos Personales clasifica datos de salud como **datos sensibles** (Artículo 8). El Artículo 16 otorga derecho de rectificación y supresión. La Resolución 47/2018 de la AAIP establece medidas de seguridad técnicas y organizacionales obligatorias. **Siempre proveer export de datos antes de la eliminación** (Art. 14-15). Implementar soft deletes primero (`deleted_at`), hard delete después del período de retención. Mantener registro en audit log como prueba de cumplimiento.

---

## 7. Evaluación de viabilidad: hasta dónde llega tu arquitectura actual

### Supabase + RLS + clinic_id: pronóstico por escala

| Escala | Viabilidad | Compute sugerido | Costo estimado |
|--------|-----------|-----------------|---------------|
| **1–10 clínicas** | ✅ Excelente | Micro ($10) | ~$35/mes total |
| **10–50 clínicas** | ✅ Bueno | Medium ($60) o Large ($110) | ~$85–135/mes |
| **50–200 clínicas** | ⚠️ Viable con inversión | Large ($110) o XL ($210) | ~$200–400/mes |
| **200–500 clínicas** | ⚠️ Requiere optimización | 2XL+ ($410+) | ~$500–1,000/mes |
| **500+ clínicas** | 🔶 Revisión de arquitectura | Enterprise o sharding | Custom |

Con 500 clínicas × 10K turnos = **5M filas** — PostgreSQL maneja esto trivialmente con índices correctos. El cuello de botella real será **conexiones concurrentes** (necesitás ~250 pooler clients para 50 clínicas activas) y **queries complejos sin índices**.

### Qué cambiar AHORA para evitar migraciones dolorosas

- **`clinic_id` en TODAS las tablas tenant-scoped** con índice — ya lo tenés, verificar cobertura completa
- **Índices compuestos** `(clinic_id, columna_de_filtro_frecuente)` en todas las tablas
- **`(select auth.clinic_id())` en todas las políticas RLS** — nunca sin el wrapper SELECT
- **Supabase CLI migrations en Git** — control de versiones desde el día 1
- **Tests de aislamiento en CI** — verificar RLS automáticamente en cada deploy
- **`service_role` key solo server-side** — nunca en código cliente
- **`app_metadata` para `clinic_id`** — nunca `user_metadata`
- **Audit log básico** — tabla con triggers para operaciones sensibles

### Qué puede esperar hasta tener muchas clínicas

- Read replicas (después de 50 clínicas)
- Encripción a nivel columna con Vault (después de 20 clínicas)
- Feature flags sofisticados con PostHog (después de 10 clínicas)
- Rate limiting con Upstash (después de 10 clínicas)
- Custom domains para white-labeling (después de 20 clínicas enterprise)
- Per-tenant backup exports automatizados (después de 10 clínicas)
- Upgrade a Supabase Team plan para SOC2/HIPAA (después de 50 clínicas o primer cliente enterprise)
- Sharding de base de datos (no necesario hasta 500+ clínicas probablemente)

### Camino crítico de 1 clínica a 50 clínicas

**Semana 1–2** (1 clínica): Verificar cobertura completa de RLS + índices. Implementar Supabase CLI migrations. Configurar Sentry con tags de `clinic_id`.

**Primeras 5 clínicas**: Setup de MercadoPago suscripciones. Admin panel básico interno. Onboarding wizard de 5 pasos. Demo data seeding.

**5–10 clínicas**: Rate limiting con Upstash. Health checks automatizados. CSV import para pacientes. Feature flags en DB.

**10–20 clínicas**: Procedimiento de offboarding testeado. Admin impersonation con audit trail. Upgrade de compute a Medium/Large. Tests de aislamiento en CI.

**20–50 clínicas**: Per-tenant backup exports programados. Considerar Supabase Team plan. Dashboard de usage y billing interno. Branding lite (logos + colores) en páginas de turnos.

---

## Scaling checklist: verificación completa por etapa

### ✅ AHORA (1–10 clínicas)

- [ ] `clinic_id` UUID con índice en TODAS las tablas tenant-scoped
- [ ] Índices compuestos `(clinic_id, campo_frecuente)` en tablas principales
- [ ] Políticas RLS con `(select auth.clinic_id())` (con wrapper SELECT) en todas las tablas
- [ ] `auth.clinic_id()` helper function creada como `STABLE`
- [ ] `clinic_id` almacenado en `app_metadata` (nunca `user_metadata`)
- [ ] `service_role` key exclusivamente en Edge Functions / server-side
- [ ] Supabase CLI migrations versionadas en Git
- [ ] Sentry configurado con tag `clinic_id` en todos los errores
- [ ] Tabla `clinics` con columna `config JSONB` para personalización
- [ ] Tabla `usage_events` para tracking de uso por clínica
- [ ] Edge Function de onboarding automatizado (crear clinic → seed data → set app_metadata)
- [ ] `.eq('clinic_id', clinicId)` explícito en queries del cliente (ayuda al query planner)
- [ ] Views con `security_invoker = true` (PostgreSQL 15+)
- [ ] Trial de 14 días con datos demo pre-cargados

### 🟡 PRONTO (10–50 clínicas)

- [ ] Rate limiting por `clinic_id` con Upstash Redis
- [ ] Tests automatizados de aislamiento entre tenants en CI
- [ ] Script CI que verifica RLS habilitado en todas las tablas tenant
- [ ] Admin panel interno con `service_role` para soporte
- [ ] Impersonation de tenant para debugging (con audit trail)
- [ ] Procedimiento de eliminación de tenant documentado y testeado (Ley 25.326)
- [ ] Export lógico per-tenant a Storage (backup nocturno)
- [ ] Feature flags basados en plan + overrides por clínica
- [ ] Upgrade de compute a Medium ($60) o Large ($110)
- [ ] Importación CSV/Excel con validación argentina (DNI, teléfono, fechas DD/MM/AAAA)
- [ ] Health dashboard con métricas por clínica (materialized view)
- [ ] MercadoPago suscripciones configuradas con tiers

### 🔴 DESPUÉS (50+ clínicas)

- [ ] Read replicas para separar tráfico de lectura/analytics
- [ ] Supabase Team plan ($599/mes) para SOC2, SSO, backups extendidos
- [ ] Encripción a nivel columna para datos sensibles de salud (Vault)
- [ ] Rate limiting por tiers (diferentes límites según plan)
- [ ] Detección automática de noisy neighbor con throttling
- [ ] Dominios custom para clínicas enterprise (Vercel for Platforms)
- [ ] Multi-región si expandís fuera de Argentina
- [ ] Billing metered vía Stripe para mercado internacional
- [ ] Event sourcing para restore granular por clínica
- [ ] Evaluación de sharding si CPU consistentemente >60% en pico

---

## Conclusión: las tres decisiones que importan ahora

La arquitectura multi-tenant no se trata de elegir el patrón perfecto desde el día uno sino de **tomar las decisiones que preserven opciones futuras**. Las tres acciones más impactantes que podés tomar hoy son: primero, garantizar que **`clinic_id` con índices compuestos esté en absolutamente todas las tablas** — esto es lo que hace viable cualquier migración futura, sea a sharding, read replicas o bases dedicadas. Segundo, usar el patrón **`(select auth.clinic_id())`** en todas las políticas RLS — esta micro-optimización es la diferencia entre queries de milisegundos y queries de minutos a escala. Tercero, **automatizar el onboarding en una Edge Function** desde ahora — cada clínica nueva que requiere setup manual es deuda operativa que escala linealmente.

El dato más tranquilizador de toda esta investigación: Notion corrió **20 mil millones de blocks en un solo PostgreSQL** antes de necesitar sharding. Figma operó con **una sola instancia RDS** hasta que la CPU llegó al 65%. Tu turnera con 500 clínicas y 5 millones de turnos está órdenes de magnitud por debajo de esos umbrales. La inversión correcta hoy no es en infraestructura más compleja sino en **índices, RLS optimizado, y automatización de operaciones**. La complejidad arquitectónica puede — y debe — esperar hasta que los datos te digan que la necesitás.