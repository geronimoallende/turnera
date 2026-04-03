# Sistema de notificaciones para turneras médicas en Argentina

**WhatsApp es el canal dominante e indiscutible para notificaciones de turnos médicos en Argentina**, con **93% de penetración** y **98% de tasa de apertura**, a un costo de apenas **USD 0,026 por mensaje de utilidad** vía YCloud. Un sistema de recordatorios bien implementado puede reducir el ausentismo del **25-34%** (baseline argentino) a menos del **10%**, generando un retorno masivo para cualquier consultorio. Este informe presenta la arquitectura completa de notificaciones para un SaaS de secretaría virtual con IA, construido sobre Supabase + YCloud + Python/Node.js.

El mercado argentino de turneras presenta una oportunidad clara: las plataformas locales (DocTurno, ClickSalud, Neocita) ofrecen notificaciones básicas por WhatsApp pero carecen de configuración granular por profesional, analíticas de entrega, y gestión inteligente de preferencias del paciente. La arquitectura propuesta en este documento permite implementar un MVP funcional en **2-3 semanas**, con un costo operativo de **USD 5-77/mes** para volúmenes de 100 a 1.000 turnos mensuales.

---

## 1. WhatsApp lidera por lejos, pero la cascada multicanal es esencial

### WhatsApp: el canal predeterminado para Argentina

Argentina tiene una de las tasas de adopción de WhatsApp más altas del mundo. Según DataReportal y Statista (2024-2025), **el 93% de los usuarios de internet argentinos usa WhatsApp**, cifra que sube a **97-99%** entre usuarios de smartphones. Con **41,6 millones de usuarios de internet** sobre una población de 45,9 millones, y **145% de penetración de conexiones móviles**, prácticamente todo paciente argentino con celular tiene WhatsApp.

Las métricas de efectividad son contundentes: **98% de tasa de apertura** (vs. 32% email en LATAM), respuestas en menos de 5 minutos esperadas por el 65% de los usuarios, y tasas de conversión del **45-60%** para mensajes de negocio. Para comunicaciones médicas operativas (recordatorios, confirmaciones), WhatsApp supera a cualquier otro canal por un margen enorme.

**Costos por mensaje de WhatsApp Business API (Argentina, USD):**

| Categoría | Precio Meta | YCloud (sin markup) | Twilio (+$0,005) | 360dialog |
|---|---|---|---|---|
| **Utilidad** (recordatorios) | $0,026 | $0,026 | $0,031 | $0,026 + suscripción |
| **Marketing** | $0,0618 | $0,0618 | $0,0668 | $0,0618 + suscripción |
| **Autenticación** | $0,026 | $0,026 | $0,031 | $0,026 + suscripción |
| **Servicio** (dentro de ventana 24h) | **Gratis** | **Gratis** | $0,005 | **Gratis** + suscripción |

**Regla crítica para ahorro de costos**: Los mensajes de utilidad enviados dentro de una ventana de servicio activa (24 horas desde el último mensaje del paciente) son **completamente gratuitos**. Si el paciente inicia la conversación para reservar un turno por chatbot, la confirmación inmediata es gratis. Solo los recordatorios proactivos (enviados 24-48h antes, fuera de la ventana) se cobran a USD 0,026.

YCloud es la opción más económica como BSP: **cero markup** sobre las tarifas de Meta, con un plan gratuito permanente que incluye acceso ilimitado a la API de mensajería. Comparado con Twilio (que agrega $0,005 por mensaje), YCloud ahorra un **16% por mensaje** en utilidad.

### SMS: fallback costoso pero necesario

El SMS llega donde WhatsApp no puede — pacientes sin smartphone, números inactivos de WhatsApp, o fallos de entrega. Sin embargo, el costo es significativamente mayor:

| Proveedor | Costo por SMS (Argentina) |
|---|---|
| Twilio | USD 0,0935/segmento |
| Plivo | USD 0,0525/segmento |
| Operadores locales (Claro directo) | ~ARS 0,50 (~USD 0,0004) |

El mercado móvil argentino está dominado por **Claro (39%)**, **Personal (33%)** y **Movistar (28%)**, con un **55-61% de líneas prepagas**. La alta proporción de prepago implica números inactivos frecuentes, lo que reduce la confiabilidad del SMS como canal primario.

Con **95% de tasa de apertura** y buena delivery rate, el SMS funciona como segundo canal. Pero a **USD 0,0935 por mensaje** (Twilio), es **3,6 veces más caro que WhatsApp** con peor interactividad (sin botones, sin multimedia, sin confirmación bidireccional fácil).

### Email: barato pero inefectivo como canal primario

El email tiene el costo más bajo (~USD 0,001/mensaje) pero la peor tasa de apertura en la región: **31,97% en LATAM** según MailerLite 2025, la más baja de todas las regiones del mundo. Para comunicaciones de salud específicamente, la tasa global ronda el **33%** (Constant Contact). En Argentina, donde la expectativa cultural es recibir comunicaciones operativas por WhatsApp, el email tiene un rol terciario.

El email sigue siendo útil para: confirmaciones con detalle completo (dirección, instrucciones, mapas), digestos diarios al staff médico, y documentación formal de cancelaciones. No debe usarse como canal primario de recordatorios.

### Push notifications e IVR: roles específicos y limitados

Las **push notifications** tienen tasas de opt-in del **61%** promedio (67% Android, 56% iOS) y CTR de **0,5-7,4%** según industria. Para una app de turnos, el push es útil solo si hay app nativa — no aplica para el MVP basado en chatbot WhatsApp.

Las **llamadas automatizadas (IVR)** cuestan ~USD 0,014/min vía Twilio y pueden reducir no-shows hasta un 30%. Son el último recurso para pacientes mayores que no usan WhatsApp ni SMS, pero requieren que el paciente atienda el teléfono — comportamiento en declive entre menores de 60 años.

### La cascada recomendada

La estrategia óptima para Argentina es clara: **WhatsApp → SMS → Email → Llamada telefónica**. El orden prioriza penetración, engagement y costo-efectividad.

Para el MVP, implementar solo **WhatsApp + notificaciones in-app** cubre el **95%+** de los casos. Agregar SMS como fallback en Fase 3 captura el 3-4% restante. El email se incluye desde el inicio solo para confirmaciones detalladas y digestos al staff.

**Costo comparativo para 1.000 recordatorios:**

| Canal | Costo total | Tasa apertura | Interactividad |
|---|---|---|---|
| WhatsApp (utilidad) | **USD 26** | 98% | Botones, bidireccional |
| SMS (Twilio) | USD 93,50 | 95% | Texto plano, limitada |
| Email | USD 1 | 32% | Links, unidireccional |
| IVR (1 min/llamada) | USD 14 | Variable | Voz, press-to-confirm |

---

## 2. Dos recordatorios con confirmación interactiva reducen el ausentismo un 40%

### El timing óptimo está respaldado por evidencia clínica robusta

El estudio más riguroso disponible es el **RCT de Steiner et al. (2018)** con **54.066 pacientes** en Kaiser Permanente Colorado, que comparó tres estrategias de recordatorio:

- Recordatorio a **3 días + 1 día antes**: **4,4% de no-show**
- Solo a 3 días antes: 5,8%
- Solo a 1 día antes: 5,3%
- La diferencia fue estadísticamente significativa (p < 0,001)

Un segundo RCT de **Kaiser Permanente Washington (2022)** con **125.076 visitas** confirmó que un recordatorio adicional por texto redujo no-shows un **7% en atención primaria** y un **11% en salud mental**.

El análisis de **Solutionreach sobre 20 millones de citas** reveló que la cadencia óptima es la regla **"3-3-3"**: 3 semanas, 3 días, y 3 horas antes. El mensaje a 3 semanas aumentó la confirmación un **126%**; el de 3 días sumó un **26% adicional**; el de 3 horas solo agregó un **0,1%** extra en confirmación pero mejora la puntualidad.

### La cadencia recomendada para Argentina

Para turnos reservados con más de una semana de anticipación: **48h + 24h antes**. Para turnos reservados dentro de la semana: **24h + 2h antes**. Para turnos del día siguiente: **solo recordatorio la tarde anterior (18-19h)**.

**Mejor hora del día para enviar**: Los datos indican mayor engagement entre **8-10h** y **17-19h**. Para turnos matutinos, el recordatorio de la tarde/noche anterior (18-19h) es más efectivo que uno temprano el mismo día. Para turnos vespertinos, funciona bien un recordatorio a las 10-11h del mismo día. Se debe evitar enviar antes de las 7h o después de las 22h.

### Los recordatorios interactivos son significativamente superiores a los pasivos

El dato más importante para el diseño del sistema: **los recordatorios bidireccionales (que piden confirmación) reducen no-shows un 23% más que los unidireccionales** según el Journal of General Internal Medicine. Esto se explica por dos mecanismos: el compromiso psicológico del acto de confirmar, y la capacidad de identificar pacientes en riesgo (los que no responden).

Un estudio de servicios psiquiátricos mostró la diferencia dramática del contacto efectivo: **3% no-show** cuando hubo contacto en vivo, **24%** cuando solo se dejó mensaje, y **39%** cuando no hubo respuesta. Los botones de respuesta rápida de WhatsApp ("CONFIRMAR" / "CANCELAR") funcionan como un proxy de contacto en vivo con el costo de un mensaje automatizado.

### El baseline argentino y el impacto cuantificado

Los datos específicos de Argentina:

- **Hospital Italiano de Buenos Aires (HIBA)**: tasa de no-show de **23-34%** en consultas ambulatorias programadas. Predictores principales: hospitalización previa (OR 5,2), turnos superpuestos (OR 1,8). Causas reportadas: olvido, conflictos de agenda, resolución de síntomas.
- **Ministerio de Salud**: hasta **20%** de pacientes no asisten a turnos programados.
- **Hospital Pediátrico Fundación Hospitalaria (Buenos Aires, 2016)**: recordatorios por SMS lograron **22% más asistencia** vs. grupo control sin recordatorio.
- **Plataformas con recordatorios + seña**: Crontu reporta reducción del ausentismo del **30% al 3%** con sistema de pago anticipado + recordatorios.

La combinación óptima de recordatorios WhatsApp interactivos + confirmación con deadline + lista de espera puede llevar el no-show del **25-30% a 8-12%**. Agregar cobro de seña por Mercado Pago podría bajarlo a **3-5%**.

### Variación por especialidad: personalizar la agresividad del recordatorio

Las tasas de no-show varían dramáticamente por especialidad, lo que justifica configurar la cadencia por tipo de servicio:

| Especialidad | No-show promedio | Estrategia sugerida |
|---|---|---|
| Psiquiatría/Salud mental | 30-50% | 3 recordatorios + llamada si no confirma |
| Dermatología | 30% | 2 recordatorios + deadline de confirmación |
| Pediatría | 30% | 2 recordatorios (dirigidos al tutor) |
| Clínica médica | 5-19% | 1-2 recordatorios estándar |
| Odontología | 15% | 1-2 recordatorios estándar |

Los **pacientes jóvenes (18-40)** tienen mayor tasa de no-show que los mayores de 65 (OR 2,3-2,5). Los turnos con **lead time mayor a 60 días** tienen casi el doble de no-show que los de menos de 15 días (7,7% vs 4,3%). Los **pacientes nuevos** tienen mayor riesgo que los de seguimiento.

---

## 3. Qué notificar al staff: menos ruido, más inteligencia

### La secretaria necesita información accionable en tiempo real

El error más común en sistemas de notificación al staff es notificar de todo, generando fatiga que lleva a ignorar alertas críticas. La clave es clasificar por prioridad y canal:

**Notificaciones en tiempo real (toast + campana in-app):**
- Nueva reserva desde el chatbot de WhatsApp
- Cancelación o reprogramación por parte del paciente
- No-show detectado (tras período de gracia)
- Paciente que confirma o rechaza recordatorio
- Coincidencia en lista de espera (slot liberado)

**Solo campana in-app (sin interrupción):**
- Verificación de obra social completada
- Mensajes o consultas del paciente
- Tareas administrativas pendientes

**Digesto diario (email matutino):**
- Agenda del día por profesional
- Turnos sin confirmar (requieren acción)
- Resumen del día anterior (completados, no-shows, cancelaciones)
- Preview del día siguiente (envío vespertino)

### El médico solo quiere saber lo que afecta su día

Los profesionales de salud tienen tolerancia cero al ruido digital durante la atención. Las notificaciones al médico deben ser mínimas y de alto valor:

**Push/in-app inmediato (solo situaciones que requieren decisión):**
- Cambio de agenda que afecta al día actual
- Paciente que no se presenta (decisión: esperar o avanzar)
- Solicitud de turno de urgencia

**Campana in-app (consulta cuando el médico lo desee):**
- Confirmaciones y reprogramaciones de pacientes
- Nuevas derivaciones recibidas

**Briefing matutino (email + in-app, a la hora de apertura del consultorio):**

```
📋 Buenos días, Dr. García — Martes 31 de marzo

AGENDA DE HOY (12 turnos)
━━━━━━━━━━━━━━━━━━━━━━
08:00  María López — Control (Confirmado ✅)
08:30  Juan Pérez — Primera vez (Sin confirmar ⚠️)
09:00  [SLOT LIBRE]
09:30  Ana Martínez — Seguimiento (Confirmado ✅)
...

⚠️ REQUIERE ATENCIÓN
• 2 turnos sin confirmar — recordatorio enviado
• 1 paciente en lista de espera para hoy

📊 RESUMEN
Ayer: 10/11 turnos completados, 1 no-show
Semana: 85% tasa de confirmación
```

Este briefing matutino es la **notificación de mayor valor** para el médico. Elimina la necesidad de consultar la app manualmente y proporciona contexto inmediato para arrancar el día.

### Prevenir la fatiga de notificaciones

Las mejores prácticas incluyen: **rate limiting** (máximo 5-10 notificaciones por usuario/día), **batching inteligente** (agrupar "3 nuevos turnos reservados" en lugar de 3 notificaciones separadas), **horario silencioso** (no notificar fuera del horario del consultorio), **deduplicación temporal** (si un turno se modifica 3 veces en 5 minutos, enviar una sola notificación con el estado final), y **preferencias por categoría** configurables por cada usuario del staff.

---

## 4. Arquitectura de notificaciones: Supabase como núcleo, sin dependencias externas

### Por qué construir propio en lugar de usar Novu/Knock/Courier

Para el MVP de una turnera argentina, los servicios externos de notificación (Novu, Knock, Courier) son una decisión prematura. El volumen inicial (< 5.000 notificaciones/mes) no justifica la complejidad adicional ni el vendor lock-in. Supabase ya ofrece todos los componentes necesarios:

| Componente | Supabase ofrece | Servicio externo equivalente |
|---|---|---|
| Cola de mensajes | **pgmq** (exactly-once delivery) | Redis/BullMQ, SQS |
| Scheduler | **pg_cron** (hasta 32 jobs, resolución 1 segundo) | Cron externo, Trigger.dev |
| HTTP dispatcher | **pg_net** (200 req/s async) + **Edge Functions** | Workers, Lambda |
| Realtime in-app | **Realtime** (WebSocket, Postgres Changes) | Pusher, Ably |
| Status tracking | Tabla `notifications` con JSONB | Base de datos separada |
| Webhooks | **Database Webhooks** (trigger → HTTP) | Webhook.site, custom |

**Si el volumen supera 50.000 notificaciones/mes** o se necesita orquestación multicanal compleja (digests, batching avanzado, fallbacks automáticos entre canales), entonces migrar a **Novu Cloud ($30/mes, Pro)** o **Knock (free tier developer)** tiene sentido. Ambos ofrecen componentes React preconstruidos para el inbox in-app.

**Comparación rápida de servicios externos:**

| Servicio | Tier gratuito | Tier pago | Open-source | HIPAA |
|---|---|---|---|---|
| **Novu** | 10K workflows/mes | $30/mes (Pro) | Sí (MIT) | Enterprise only |
| **Knock** | 10K mensajes/mes | $250/mes (Starter) | No | Enterprise only |
| **Courier** | 10K notificaciones/mes | ~$99-350/mes | No | Enterprise |

### Flujo arquitectónico recomendado

```
[Paciente reserva turno por chatbot WhatsApp]
        ↓
[Supabase: INSERT en tabla appointments]
        ↓ (Trigger PostgreSQL)
[Crear registros en tabla notifications]
  - confirmación (send_at = NOW)
  - reminder_48h (send_at = appointment_time - 48h)
  - reminder_24h (send_at = appointment_time - 24h)
        ↓
[pg_cron ejecuta cada 60 segundos]
  → Llama Edge Function vía pg_net
        ↓
[Edge Function: "process-notifications"]
  1. SELECT * FROM notifications WHERE send_at <= now() AND status = 'pending' LIMIT 50
  2. POST a YCloud API por cada notificación
  3. UPDATE status = 'sent', guardar ycloud_message_id
        ↓
[YCloud webhook → Edge Function: "delivery-status"]
  → Actualiza status a delivered/read/failed
        ↓
[Supabase Realtime → Frontend del admin]
  → Secretaria ve estado en tiempo real
```

### Capacidades técnicas de Supabase relevantes

**pg_cron**: Ejecuta jobs programados dentro de PostgreSQL. Granularidad mínima de 1 segundo. Máximo **32 jobs concurrentes**. Ideal como trigger periódico para procesar notificaciones pendientes. Los tiempos se manejan en GMT por defecto — almacenar todo en UTC y convertir al timezone de la clínica solo al calcular `send_at`.

**Edge Functions**: Runtime Deno/TypeScript con cold start de **~42ms** promedio. Límite de ejecución de **60 segundos**. Perfectas como dispatchers livianos: reciben el trigger de pg_cron, consultan notificaciones pendientes, llaman a YCloud, y actualizan estados.

**pg_net**: Permite hacer requests HTTP asíncronos directamente desde SQL. Throughput de hasta **200 requests/segundo**. Las respuestas se almacenan por 6 horas en `net._http_response`.

**Supabase Realtime**: WebSockets basados en Elixir/Phoenix que escuchan cambios en tablas PostgreSQL (INSERT, UPDATE, DELETE). El frontend se suscribe a cambios en la tabla `notifications` para mostrar actualizaciones en tiempo real en el dashboard.

**pgmq (Supabase Queues)**: Cola de mensajes durable nativa de PostgreSQL con garantía de entrega exactly-once. Soporta visibility timeout, FIFO ordering, y archivado. Si el polling simple de la tabla `notifications` no escala, pgmq ofrece una alternativa robusta sin agregar Redis.

### Integración con YCloud API

La API de YCloud es directa y bien documentada:

```bash
POST https://api.ycloud.com/v2/whatsapp/messages
Header: X-API-Key: YOUR_API_KEY
Body: {
  "from": "+5491112345678",
  "to": "+5491198765432",
  "type": "template",
  "template": {
    "name": "recordatorio_turno",
    "language": { "code": "es" },
    "components": [{
      "type": "body",
      "parameters": [
        { "type": "text", "text": "Dr. García" },
        { "type": "text", "text": "15 de abril, 10:00hs" }
      ]
    }]
  }
}
```

Los estados de mensaje fluyen: **accepted → sent → delivered → read** (o **failed** en cualquier punto). YCloud envía webhooks con evento `whatsapp.message.updated` incluyendo el ID del mensaje, estado, costo, y timestamps. También soporta `whatsapp.inbound_message.received` para procesar respuestas del paciente (confirmaciones, cancelaciones).

### Manejo de reintentos, fallos y deduplicación

**Reintentos**: Implementar exponential backoff con jitter: 30s → 2min → 10min → 1h. Máximo 3-5 intentos antes de mover a Dead Letter Queue (una tabla `failed_notifications`). Si la API de YCloud devuelve error, marcar status como `failed` con mensaje de error y programar reintento.

**Deduplicación**: Usar claves de idempotencia compuestas: `{appointment_id}_{notification_type}_{send_at}`. Almacenar como columna UNIQUE en la tabla de notificaciones. Esto previene duplicados incluso si el trigger se ejecuta múltiples veces.

**Cancelación en cascada**: Cuando se cancela un turno, ejecutar `UPDATE notifications SET status = 'cancelled' WHERE appointment_id = X AND status = 'pending'`. El job de pg_cron ignora notificaciones canceladas.

### Schema mínimo viable para la base de datos

```sql
CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID REFERENCES appointments(id),
  patient_phone TEXT NOT NULL,
  template_name TEXT NOT NULL,
  template_params JSONB,
  notification_type TEXT NOT NULL,  -- 'confirmation', 'reminder_48h', 'reminder_24h'
  channel TEXT DEFAULT 'whatsapp',  -- 'whatsapp', 'sms', 'email'
  status TEXT DEFAULT 'pending',    -- pending, sent, delivered, read, failed, cancelled
  send_at TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  ycloud_message_id TEXT,
  error_message TEXT,
  retry_count SMALLINT DEFAULT 0,
  idempotency_key TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_notif_pending ON notifications (send_at)
  WHERE status = 'pending';

CREATE INDEX idx_notif_appointment ON notifications (appointment_id);
```

---

## 5. Preferencias, templates y cumplimiento legal en Argentina

### Ley 25.326: los datos de salud son "datos sensibles"

La Ley 25.326 de Protección de Datos Personales clasifica la información de salud como **"datos sensibles"**, la categoría de mayor protección legal. El Artículo 8 permite que establecimientos de salud y profesionales procesen datos de salud de pacientes dentro de la relación terapéutica, respetando el **secreto profesional**.

**Requisitos clave para una turnera:**

1. **Consentimiento explícito y por escrito** para el procesamiento de datos personales (Art. 5) y datos sensibles (Art. 7). Para comunicaciones electrónicas por WhatsApp/SMS, se recomienda obtener un opt-in específico que detalle el canal y los tipos de mensaje.

2. **Texto de consentimiento recomendado**: *"Autorizo a [nombre de la clínica] a enviarme comunicaciones electrónicas (WhatsApp/SMS) relacionadas con la gestión de mis turnos médicos, recordatorios de citas y comunicaciones operativas. Entiendo que mis datos de salud son datos sensibles protegidos por la Ley 25.326 y que puedo revocar este consentimiento en cualquier momento respondiendo BAJA."*

3. **Nunca incluir información clínica** en los mensajes de WhatsApp/SMS: ni diagnósticos, ni resultados de estudios, ni detalles de tratamiento, ni la especialidad médica específica si revela una condición. Limitar el contenido a datos operativos (fecha, hora, nombre del profesional, dirección).

4. **Registro de bases de datos** ante la AAIP (Agencia de Acceso a la Información Pública) a través del Registro Nacional de Bases de Datos (RNBD).

5. **Medidas de seguridad** (Art. 9 + Resolución AAIP 47/2018): cifrado en tránsito y reposo, control de acceso basado en roles, logging de auditoría.

Las **penalidades actuales son bajas** (ARS 1.000-100.000, equivalente a USD 1-100 por la devaluación desde 2000), pero hay **dos proyectos de ley en el Congreso** (Carro y Doñate, 2025) que proponen multas del **2-4% de la facturación anual global** alineadas con GDPR, notificación de brechas en 72 horas, y designación obligatoria de DPO. Aunque siguen pendientes de aprobación a marzo 2026, diseñar el sistema pensando en cumplimiento futuro es prudente.

### Políticas de WhatsApp Business para salud

WhatsApp **permite explícitamente** que servicios médicos envíen recordatorios de turnos, confirmaciones, y seguimientos post-consulta. Requisitos: obtener opt-in previo del paciente especificando que recibirá mensajes por WhatsApp, usar solo la API oficial de WhatsApp Business (no WhatsApp personal), y enviar templates aprobados por Meta.

**Restricción importante**: No usar WhatsApp para telemedicina ni para enviar/solicitar información de salud si las regulaciones locales lo prohíben en sistemas que no cumplan requisitos especiales de seguridad.

### Gestión de preferencias del paciente

El sistema debe almacenar por paciente: canal preferido (WhatsApp por defecto, con opción a SMS o email), tipos de notificación habilitados (recordatorios, confirmaciones, seguimientos), idioma preferido, y horario aceptable para recibir mensajes. El **opt-out debe ser tan fácil como el opt-in**: responder "BAJA" o "STOP" al mensaje de WhatsApp y procesar la baja inmediatamente.

Para el MVP, un campo `notification_preferences JSONB` en la tabla de pacientes es suficiente. La configuración por defecto debe ser WhatsApp habilitado para recordatorios y confirmaciones.

### Templates de WhatsApp para el MVP

Se necesitan como mínimo **3 templates de utilidad** aprobados por Meta:

**1. Confirmación de turno:**
> "Hola {{1}}, tu turno con {{2}} en {{3}} fue confirmado para el {{4}} a las {{5}}. 📍 {{6}}. Para cancelar o cambiar, respondé CAMBIAR o llamá al {{7}}."

**2. Recordatorio 24-48h:**
> "Hola {{1}}, te recordamos tu turno mañana {{2}} a las {{3}} con {{4}} en {{5}}. Respondé ✅ para confirmar o ❌ para cancelar."

**3. Cancelación/Reprogramación:**
> "Hola {{1}}, tu turno del {{2}} con {{3}} fue cancelado. Para reprogramar, respondé TURNO o llamá al {{4}}."

Cada template usa variables genéricas que se llenan dinámicamente. El contenido debe ser profesional pero cálido, incluir siempre la identificación del consultorio, y ofrecer un mecanismo de acción (confirmar, cancelar, contactar). Los templates se aprueban en **minutos a 24 horas** por Meta.

### Configuración por clínica

Los parámetros configurables por clínica deben incluir: tipos de notificación habilitados (toggles on/off), timing de recordatorios (24h, 48h, 72h antes), canal por defecto y canal fallback, ventana de envío (hora más temprana y más tardía), branding del consultorio para templates (nombre, teléfono, dirección), e instrucciones especiales por tipo de turno (venir en ayunas, traer estudios previos). Las configuraciones del profesional deben **heredar del consultorio** con posibilidad de override.

---

## 6. El mercado argentino: WhatsApp es estándar, la configuración granular es la oportunidad

### Panorama competitivo de turneras argentinas

Las plataformas locales líderes comparten un patrón común: WhatsApp como canal principal, pricing por paquetes de mensajes, y configuración básica. La tabla comparativa revela las diferencias:

| Feature | DocTurno | ClickSalud | DarTurnos | Neocita | AgendaPro |
|---|---|---|---|---|---|
| **WhatsApp** | ✅ Oficial | ✅ IA 24/7 | ✅ Auto | ✅ Bot | ✅ |
| **SMS** | ✅ | ✅ | ❌ | ❌ | ✅ |
| **Email** | ✅ todos planes | ✅ | ✅ | Solo pago | ✅ todos planes |
| **Timing configurable** | 24h, 3h | 72h, 48h | No especifica | 1 día | Mismo día a 3 días |
| **Auto-cancelación sin confirmar** | ❌ | ✅ | ❌ | ❌ | ❌ |
| **Config por profesional** | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Config por paciente** | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Lista de espera** | ❌ | ✅ | ❌ | ❌ | ❌ |
| **Doble confirmación** | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Analytics entrega** | ❌ | ❌ | ❌ | ❌ | Básico |

**DocTurno** es el más establecido, autoproclamándose el único con integración oficial de WhatsApp en LATAM. Cobra AR$ 4.500 + IVA por pack de 50 mensajes WhatsApp (~AR$ 90/msg). Permite adjuntar instrucciones personalizadas por tipo de turno a los recordatorios.

**ClickSalud** es el más innovador con su chatbot de IA por WhatsApp y su sistema de **auto-cancelación**: si el paciente no confirma en 48h, el turno se libera automáticamente y se asigna desde lista de espera. Dice reducir ausentismo hasta un 80%.

**AgendaPro** opera en 17 países y tiene la configuración más granular: per-locación, per-profesional, notificaciones para reservas manuales/online/cancelaciones, tracking de apertura de emails. Sin embargo, reviews en App Store reportan problemas de estabilidad ("notificaciones dejaron de llegar después de actualización").

**Neocita** cobra desde AR$ 6.000/mes por 50 recordatorios WhatsApp automáticos. Su modelo freemium limita severamente las notificaciones en el plan gratuito.

### Las plataformas internacionales marcan el estándar

**Doctolib** (450.000 profesionales, 80 millones de pacientes en Europa) representa el gold standard: lógica inteligente push vs. SMS (si el paciente tiene push habilitado, no envía SMS), configuración por agenda/tipo de consulta/paciente individual, SMS personalizable por tipo de consulta, y tasa de no-show reducida a **~2%**. Sin WhatsApp (no es estándar en Europa).

**Jane App** (Canadá) destaca por: sistema manual de lista de llamadas telefónicas, return visit reminders (recalls automáticos), preferencias de recordatorio editables por paciente con opt-in durante booking online, y manejo inteligente de múltiples citas el mismo día (un solo recordatorio).

### Brechas que representan oportunidades

Ninguna plataforma argentina ofrece: configuración por paciente individual, analytics de entrega detallados (tasas de lectura, confirmación por canal), escalamiento inteligente (si no confirma por WhatsApp, enviar SMS automáticamente), predicción de no-show basada en historial, ni briefing matutino automatizado para el médico. Estas son las funcionalidades que pueden diferenciar el producto.

---

## 7. Sistema mínimo viable de notificaciones para el MVP (Fase 2)

### Qué incluir y qué postergar

**MVP (Fase 2) — Implementar ahora:**
- Recordatorio WhatsApp automático a **24h antes** del turno con botones de confirmación/cancelación
- Confirmación WhatsApp inmediata al reservar (gratis si el paciente inició la conversación)
- Notificación in-app a la secretaria de nuevas reservas, cancelaciones, y confirmaciones
- Tabla de notificaciones en Supabase con tracking de estado
- pg_cron + Edge Function como dispatcher
- Webhook de YCloud para actualizar estados de entrega
- Template de consentimiento para opt-in de WhatsApp

**Fase 3 — Agregar después:**
- Segundo recordatorio (48h + 24h), configurable por clínica
- Briefing matutino por email/in-app para el médico
- Fallback a SMS cuando WhatsApp falla
- Lista de espera con notificación automática de slots liberados
- Auto-cancelación por no-confirmación
- Dashboard de analytics de notificaciones

**Fase 4 — Diferenciación:**
- Predicción de no-show basada en historial del paciente
- Configuración por profesional y por tipo de turno
- Cascada multicanal automática (WhatsApp → SMS → llamada)
- Instrucciones pre-turno personalizadas por tipo de estudio/consulta

### ¿Qué maneja el backend de chatbot vs. qué se construye en la app?

El **servicio Python del chatbot** ya procesa las conversaciones de WhatsApp y puede manejar: recepción de respuestas del paciente (confirmar/cancelar), procesamiento de mensajes entrantes, y lógica conversacional. Lo que el chatbot **no debe** manejar es el scheduling de recordatorios futuros (eso es responsabilidad de la base de datos con pg_cron).

La **app (frontend + Supabase)** maneja: notificaciones in-app vía Realtime, dashboard de estado de notificaciones, configuración de preferencias, y visualización de analytics.

El **flujo de división óptimo** es: Supabase como fuente de verdad (tabla de notificaciones + scheduling con pg_cron), Edge Functions como dispatchers (llaman a YCloud), y el servicio Python como processor de respuestas entrantes (webhooks de YCloud con mensajes del paciente).

### La arquitectura más simple que funciona

```
┌─────────────────────────────────────────────────┐
│                   SUPABASE                       │
│                                                  │
│  appointments ──trigger──→ notifications         │
│       (tabla)                  (tabla)           │
│                                  ↑               │
│  pg_cron (cada 60s) ──pg_net──→ Edge Function    │
│                                  │               │
│  Realtime ──WebSocket──→ Frontend (admin)        │
│                                                  │
└───────────────────────┬──────────────────────────┘
                        │
                   Edge Function
                   "process-notifications"
                        │
                ┌───────┴────────┐
                ↓                ↓
          YCloud API      Supabase UPDATE
     (envía WhatsApp)    (status = 'sent')
                │
                ↓
        YCloud Webhook
                │
                ↓
          Edge Function
     "delivery-status"
                │
                ↓
        Supabase UPDATE
    (status = delivered/read/failed)
```

**¿Necesito n8n?** No para el MVP de notificaciones. pg_cron + Edge Functions es más simple, tiene menos componentes, y no requiere hosting adicional. n8n es útil si ya lo tenés desplegado para otros workflows del chatbot, pero agrega una dependencia innecesaria para el sistema de recordatorios.

**¿Necesito Redis/BullMQ?** No. La tabla `notifications` con un índice parcial en `status = 'pending'` funciona como una cola simple y efectiva para menos de 50.000 mensajes/mes. Si se necesita exactly-once delivery, pgmq está disponible sin costo adicional dentro de Supabase.

---

## Matriz de notificaciones: evento × canal × timing × destinatario

| Evento | Destinatario | Canal | Timing | Template | Fase |
|---|---|---|---|---|---|
| **Turno reservado** | Paciente | WhatsApp | Inmediato | Confirmación con datos + instrucciones | MVP |
| **Turno reservado** | Secretaria | In-app (toast + campana) | Inmediato | "Nuevo turno: [paciente] con [Dr.] el [fecha]" | MVP |
| **Recordatorio** | Paciente | WhatsApp | 24h antes | "Te recordamos tu turno mañana..." + botones Confirmar/Cancelar | MVP |
| **Recordatorio 2** | Paciente | WhatsApp | 48h antes | "Tu turno es pasado mañana..." + botones | Fase 3 |
| **Recordatorio 3** | Paciente | SMS (fallback) | 24h antes | Texto plano si WhatsApp falló | Fase 3 |
| **Paciente confirma** | Secretaria | In-app (campana) | Inmediato | "[Paciente] confirmó turno del [fecha]" | MVP |
| **Paciente no confirma** | Secretaria | In-app (alerta) | 12h antes del turno | "⚠️ [Paciente] no confirmó turno de mañana" | Fase 3 |
| **Cancelación por paciente** | Secretaria | In-app (toast) | Inmediato | "[Paciente] canceló turno del [fecha]" | MVP |
| **Cancelación por paciente** | Médico | In-app (campana) | Inmediato | "Turno cancelado: [hora] quedó libre" | MVP |
| **Cancelación por clínica** | Paciente | WhatsApp | Inmediato | "Tu turno fue cancelado..." + opción reprogramar | MVP |
| **Reprogramación** | Paciente | WhatsApp | Inmediato | "Tu turno fue cambiado a [nueva fecha]" | MVP |
| **Slot liberado (lista espera)** | Paciente en espera | WhatsApp | Inmediato | "Hay un turno disponible el [fecha]. ¿Lo querés?" | Fase 3 |
| **No-show detectado** | Secretaria | In-app (alerta) | +15min post-turno | "⚠️ [Paciente] no se presentó" | Fase 3 |
| **Briefing matutino** | Médico | Email + In-app | 07:00 hora clínica | Resumen del día: pacientes, sin confirmar, stats | Fase 3 |
| **Briefing matutino** | Secretaria | Email + In-app | 07:00 hora clínica | Agenda completa + acciones pendientes | Fase 3 |
| **Cambio de agenda** | Médico | In-app (push) | Inmediato | "Su agenda de [fecha] fue modificada" | Fase 3 |
| **Resumen semanal** | Administrador | Email | Lunes 08:00 | Stats: turnos, no-shows, confirmaciones, ocupación | Fase 4 |

---

## Estimación de costos mensuales

| Volumen | Msgs WhatsApp/mes | Costo WhatsApp* | Supabase | YCloud | **Total estimado** |
|---|---|---|---|---|---|
| **100 turnos/mes** | ~200 | ~USD 4 | USD 0 (Free) | USD 0 (Free) | **~USD 4/mes** |
| **500 turnos/mes** | ~1.000 | ~USD 21 | USD 25 (Pro) | USD 0 (Free) | **~USD 46/mes** |
| **1.000 turnos/mes** | ~2.000 | ~USD 42 | USD 25 (Pro) | USD 0 (Free) | **~USD 67/mes** |
| **5.000 turnos/mes** | ~10.000 | ~USD 208 | USD 25 (Pro) | USD 39 (Growth) | **~USD 272/mes** |

*Cálculo WhatsApp: ~2 mensajes cobrados por turno (1 confirmación fuera de ventana + 1 recordatorio) × USD 0,026 utilidad. ~20% de confirmaciones son gratis (dentro de ventana de servicio). No incluye mensajes de servicio (gratis) por respuestas del paciente.*

Para **100 turnos/mes** (1-2 profesionales, consultorio chico), el costo operativo total es de apenas **USD 4-5/mes** usando Supabase Free + YCloud Free. Para **1.000 turnos/mes** (clínica mediana con 5-8 profesionales), el costo sube a **~USD 67/mes**, significativamente menor que los paquetes de mensajes de competidores como Neocita (AR$ 6.000-24.000/mes por 50-200 recordatorios).

---

## Recomendación de arquitectura para Supabase + YCloud + Python/Node

### Stack final recomendado para MVP

| Componente | Tecnología | Rol |
|---|---|---|
| **Base de datos + scheduling** | Supabase (PostgreSQL + pg_cron + pgmq) | Fuente de verdad, cola de notificaciones, scheduling |
| **Dispatcher de WhatsApp** | Supabase Edge Functions (Deno/TS) | Procesa pendientes, llama YCloud API, actualiza estados |
| **Delivery de WhatsApp** | YCloud API (BSP) | Envío y recepción de mensajes, templates, webhooks |
| **Procesador de respuestas** | Python service (existente) | Recibe webhooks de YCloud, procesa confirmaciones/cancelaciones del paciente |
| **Notificaciones in-app** | Supabase Realtime (WebSocket) | Push en tiempo real al dashboard de la secretaria |
| **Frontend** | React/Next.js con Supabase Client | Campana de notificaciones, toast messages, dashboard |

### Los 5 pasos para implementar el MVP de notificaciones

1. **Crear tabla `notifications`** en Supabase con el schema descrito, incluyendo índice parcial en `status = 'pending'`.

2. **Crear trigger PostgreSQL** que al insertar un appointment genere automáticamente los registros de notificación con `send_at` calculado.

3. **Crear Edge Function `process-notifications`** que pg_cron invoca cada 60 segundos. Consulta pendientes, envía vía YCloud API, actualiza estados.

4. **Crear Edge Function `delivery-webhook`** que recibe callbacks de YCloud y actualiza `delivered_at`, `read_at`, o `error_message`.

5. **Suscribir el frontend** a cambios en la tabla `notifications` vía Supabase Realtime para mostrar actualizaciones en tiempo real.

**Tiempo estimado de implementación**: 2-3 semanas para un desarrollador senior. La arquitectura es deliberadamente simple — una tabla, dos Edge Functions, un trigger, y un cron job. Esta simplicidad es una ventaja: menos componentes significan menos puntos de falla y más facilidad para depurar y escalar cuando sea necesario.

---

## Conclusión

El sistema de notificaciones para una turnera médica argentina no necesita ser complejo para ser efectivo. **WhatsApp a USD 0,026 por recordatorio con 98% de apertura** es el canal que ningún competidor local puede ignorar y que YCloud hace accesible sin markup. La evidencia clínica es clara: **dos recordatorios interactivos (48h + 24h) con botones de confirmación reducen el no-show del 25-30% al 8-12%**, un impacto que justifica el producto por sí solo.

La decisión arquitectónica más importante es **resistir la tentación de sobreingeniería**: Supabase ya incluye todo lo necesario — pg_cron como scheduler, pgmq como cola, Edge Functions como dispatchers, y Realtime para notificaciones in-app. No se necesitan Redis, Kafka, ni servicios externos de notificación para el volumen de una clínica argentina. El costo operativo total de **USD 4-67/mes** para 100-1.000 turnos hace que el sistema sea económicamente viable incluso para consultorios individuales.

La oportunidad de diferenciación está en lo que ninguna turnera argentina ofrece hoy: **configuración granular por profesional**, **escalamiento inteligente entre canales**, **analytics de entrega**, y el **briefing matutino automatizado** que transforma datos en acción. Estas features no son para el MVP — pero deben estar previstas en la arquitectura desde el primer día, lo cual esta propuesta garantiza con su diseño extensible basado en una tabla de notificaciones con JSONB metadata y un dispatcher desacoplado por Edge Functions.