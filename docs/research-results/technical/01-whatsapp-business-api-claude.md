# Sistema de Turnos Médicos por WhatsApp Business API para Clínicas Argentinas — Guía Técnica Completa

**La WhatsApp Business API permite construir un sistema de turnos médicos automatizado, escalable y conforme a la regulación argentina, con costos de USD 0,026 por mensaje de recordatorio y tasas de reducción de ausentismo del 30-60%.** Este documento cubre desde la arquitectura técnica hasta los flujos conversacionales exactos, plantillas listas para aprobar en Meta, y las mejores prácticas para un desarrollador solo construyendo un SaaS multi-tenant. Argentina no tiene restricciones regulatorias que impidan a prestadores de salud usar WhatsApp (a diferencia de EE.UU. y Francia), y el canal ya es usado por plataformas como DrApp, MEDICLINE y Calu para gestión de turnos.

---

## 1. WhatsApp Business API — Cómo funciona realmente

### Tipos de mensaje: templates vs sesión

La API maneja dos tipos fundamentales de mensajes. Los **mensajes template** (antes llamados HSM) son mensajes pre-aprobados por Meta, obligatorios para iniciar conversaciones con pacientes que no escribieron en las últimas 24 horas. Soportan variables (`{{1}}`, `{{2}}`), headers (texto, imagen, video, documento), botones (quick reply o CTA), y un footer de hasta 60 caracteres. El body admite hasta **1.024 caracteres**.

Los **mensajes de sesión** (free-form) son cualquier mensaje que el negocio envía dentro de la ventana de 24 horas tras el último mensaje del paciente. No requieren aprobación de Meta, permiten texto libre, listas interactivas, botones, imágenes, audio, video y documentos, con un límite de **1.600 caracteres**. Son siempre **gratuitos**. Si intentás enviar un mensaje de sesión fuera de la ventana de 24h, la API lo rechaza.

| Escenario | Template Messages | Mensajes de Sesión |
|---|---|---|
| Dentro de ventana 24h | Se pueden enviar (utility gratis, marketing/auth con costo) | Se pueden enviar (GRATIS) |
| Fuera de ventana 24h | Se pueden enviar (siempre con costo) | NO se pueden enviar (rechazados) |

### La ventana de 24 horas

Cuando un paciente envía cualquier mensaje a tu número de WhatsApp Business, arranca un timer de **24 horas**. Cada nuevo mensaje del paciente reinicia el timer. Durante la ventana, el negocio puede enviar mensajes de sesión ilimitados y templates de categoría Utility **sin costo**. Al cerrarse la ventana, solo se puede contactar al paciente con templates aprobados (con costo). La ventana **solo puede ser reabierta por el paciente** enviando otro mensaje. El negocio puede enviar un template fuera de la ventana para intentar que el paciente responda y así reabrir la ventana.

Existe además una **ventana especial de 72 horas** para pacientes que llegan desde Click-to-WhatsApp Ads de Facebook/Instagram, durante la cual todos los mensajes son gratuitos.

### Categorías de templates y cuáles aplican a turnos médicos

Desde 2025, Meta maneja tres categorías de templates:

**Utility** — Mensajes transaccionales disparados por una acción del usuario: confirmaciones, recordatorios, actualizaciones de estado. Deben ser no-promocionales y referir a una transacción específica. Son **gratuitos dentro de la ventana de 24h** y cobran tarifa utility fuera de ella. Los **recordatorios de turnos, confirmaciones y reprogramaciones** caen en esta categoría.

**Marketing** — Contenido promocional, ofertas, re-engagement. Cualquier template que no califique como Utility o Authentication es Marketing. **Siempre se cobra**, incluso dentro de la ventana de 24h. Un recordatorio tipo "Es hora de tu chequeo anual" sin turno existente sería Marketing.

**Authentication** — OTPs y códigos de verificación. Usan formato preset de WhatsApp con botón de "copiar código". No aplica a turnos médicos.

| Caso de uso médico | Categoría recomendada | Justificación |
|---|---|---|
| Recordatorio de turno | **Utility** | Transaccional, turno ya existe |
| Confirmación de turno | **Utility** | Relacionado a acción del paciente |
| Aviso de reprogramación | **Utility** | Actualización de transacción existente |
| Seguimiento post-consulta | **Utility** | Follow-up del servicio |
| "¿Necesitás tu control anual?" | **Marketing** | No hay transacción previa |
| Respuestas a consultas (dentro de 24h) | **Sesión (gratis)** | Dentro de la ventana |

### Proceso de aprobación de templates

La mayoría de los templates se aprueban automáticamente en **15-30 minutos** mediante ML. Algunos flaggeados para revisión manual demoran **24-48 horas**. Los **motivos de rechazo más comunes** para templates médicos son:

- Variable al inicio o final del mensaje (ej: `{{1}}, tu turno es mañana`)
- Variables consecutivas sin texto fijo entre ellas
- Categoría incorrecta (contenido marketing enviado como Utility)
- Lenguaje excesivamente promocional ("¡Oferta limitada!", mayúsculas excesivas)
- Links acortados (bit.ly, TinyURL) — rechazo automático
- Solicitar datos sensibles (DNI completo, tarjeta de crédito)
- Plantillas duplicadas con el mismo body/footer de una existente
- No proveer valores de ejemplo para las variables al momento del envío

Meta monitorea templates post-aprobación. Asigna ratings de calidad (Verde/Amarillo/Rojo) y puede **pausar templates** por 3h, 6h, o deshabilitarlos si reciben feedback negativo de usuarios. También puede **reclasificar** un template de Utility a Marketing si detecta contenido promocional, cambiando su pricing sin eliminar el template.

**Sobre contenido médico:** Argentina no está en la lista de países restringidos (EE.UU. y Francia sí). Los prestadores de salud **pueden usar** la API para recordatorios, confirmaciones, seguimiento post-consulta, y avisos de vacunación. No se puede promover medicamentos, dispositivos médicos ni hacer claims médicos sin disclaimers.

### Pricing en Argentina (actualizado a 2026)

Desde el **1 de julio de 2025**, Meta migró de pricing por conversación a **pricing por mensaje entregado**. El 1 de octubre de 2025, redujo las tarifas de Utility y Authentication específicamente para Argentina.

| Categoría | Costo por mensaje entregado (USD) |
|---|---|
| **Marketing** | **$0,0618** |
| **Utility** | **$0,026** |
| **Authentication** | **$0,026** |
| **Sesión (dentro de ventana 24h)** | **GRATIS** |
| **Utility dentro de ventana 24h** | **GRATIS** |

Para una clínica que envía **1.000 recordatorios de turnos mensuales** (Utility fuera de ventana): USD **26**. Si el paciente respondió en las últimas 24h y el template es Utility: **gratis**. Para campañas de marketing (1.000 mensajes): USD **61,80**. Todas las respuestas a consultas de pacientes dentro de la ventana: **$0**.

Existen **descuentos por volumen** para Utility y Authentication en tiers altos. La facturación es en USD. Argentina no está incluida en el programa de facturación en moneda local de Meta (que arrancó con India y México).

### Rate limits y tiers de mensajería

**Tiers de contactos únicos por 24 horas** (desde octubre 2025, aplican a nivel de Business Portfolio, no por número):

| Tier | Contactos únicos / 24h |
|---|---|
| Tier 0 (no verificado) | **250** |
| Tier 1 | **1.000** |
| Tier 2 | **10.000** |
| Tier 3 | **100.000** |
| Tier 4 (ilimitado) | **Sin límite** |

Para subir de tier, Meta requiere: negocio verificado en Business Manager, rating de calidad Medium o High, y usar al menos la mitad del límite actual durante 7 días. El upgrade es automático (en ~6 horas). No se puede pagar para subir de tier.

**Throughput**: La Cloud API maneja **80 mensajes por segundo** por defecto, escalable hasta **1.000 MPS** automáticamente si tenés tier ilimitado y rating de calidad medio o alto.

**Frequency capping de Marketing**: Meta limita a cada usuario a recibir aproximadamente **~2 templates de marketing por día** combinando todos los negocios que le escriben.

### Cambios recientes de Meta (2025-2026)

Los cambios más importantes para tener en cuenta:

- **Julio 2025**: Fin del pricing por conversación, inicio del pricing por mensaje entregado. Templates Utility dentro de la ventana de 24h pasan a ser **gratuitos**.
- **Octubre 2025**: Reducción de tarifas Utility/Auth para Argentina. Límites de mensajería migran de por-número a por-Business Portfolio.
- **Noviembre 2024**: Las conversaciones de servicio (sesión) pasan a ser **completamente gratis sin límite mensual** (antes había 1.000 gratis por WABA por mes).
- **Enero 2026**: Ajustes de tarifas en otros mercados (Argentina sin cambios adicionales). Facturación en moneda local para India y México.
- **Enero 2026**: Meta **prohibió chatbots de IA de propósito general** — solo se permiten agentes de IA para tareas específicas (como turnos médicos, soporte, etc.).
- **Próximo (abril 2026)**: Sistema de bidding para mensajes de marketing (max-price bidding, fecha exacta por confirmar).

---

## 2. Flujos conversacionales para turnos médicos en español argentino

### Flujo de reserva de turno

El paciente inicia la conversación y el bot guía paso a paso usando listas interactivas y botones.

**Paso 1 — Bienvenida e intención:**
```
📱 Paciente: "Hola, quiero sacar un turno"

🤖 Bot: ¡Hola! 👋 Soy el asistente de [Clínica San Martín].
¿En qué te puedo ayudar?

[Lista interactiva - "Elegí una opción"]
  → Sacar un turno nuevo
  → Consultar mis turnos
  → Cancelar o reprogramar
  → Hablar con la secretaria
```

**Paso 2 — Identificación del paciente:**
```
🤖 Bot: Para buscar tu turno, necesito tu DNI.
Escribilo sin puntos (ej: 35678901).

📱 Paciente: 35678901

🤖 Bot: ¡Perfecto, María! Te encontré en el sistema. 👍
```

Si no existe en el sistema:
```
🤖 Bot: No encontré ese DNI en nuestro sistema.
¿Es tu primera vez en la clínica?

[Botón] Sí, soy paciente nuevo
[Botón] No, debe haber un error
```

**Paso 3 — Selección de especialidad:**
```
🤖 Bot: ¿Qué especialidad necesitás?

[Lista interactiva - "Elegí especialidad"]
  → Clínica médica
  → Cardiología
  → Dermatología
  → Ginecología
  → Traumatología
  → Pediatría
  → Otra especialidad

📱 Paciente: [selecciona "Cardiología"]
```

**Paso 4 — Selección de profesional:**
```
🤖 Bot: En Cardiología tenemos estos profesionales:

[Lista interactiva - "Elegí profesional"]
  → Dr. García - Lu/Mi/Vi mañana
  → Dra. López - Ma/Ju tarde
  → Sin preferencia de profesional

📱 Paciente: [selecciona "Dr. García"]
```

**Paso 5 — Selección de fecha y hora:**
```
🤖 Bot: Los próximos turnos disponibles con el Dr. García son:

[Lista interactiva - "Elegí fecha y hora"]
  → Lunes 6/4 - 09:00
  → Lunes 6/4 - 09:30
  → Miércoles 8/4 - 10:00
  → Miércoles 8/4 - 10:30
  → Viernes 10/4 - 08:30
  → Ver más opciones

📱 Paciente: [selecciona "Miércoles 8/4 - 10:00"]
```

**Paso 6 — Confirmación:**
```
🤖 Bot: 📋 *Resumen de tu turno:*

👨‍⚕️ Dr. García - Cardiología
📅 Miércoles 8 de abril, 10:00 hs
📍 Av. Rivadavia 4500, CABA
💊 Recordá traer estudios previos si tenés

¿Confirmamos?

[Botón] ✅ Confirmar turno
[Botón] 🔄 Cambiar fecha/hora
[Botón] ❌ Cancelar
```

**Paso 7 — Turno confirmado:**
```
📱 Paciente: [toca "Confirmar turno"]

🤖 Bot: ¡Listo! ✅ Tu turno quedó reservado.

Te vamos a enviar un recordatorio el día anterior.
Si necesitás cancelar o reprogramar, escribinos por acá.

¡Que tengas un buen día! 😊
```

### Flujo de recordatorio y confirmación

**Recordatorio 24h antes (template Utility con quick reply):**
```
🤖 Bot [template]: Hola María 👋

📅 Te recordamos tu turno de mañana:
👨‍⚕️ Dr. García - Cardiología
🕙 Miércoles 8 de abril, 10:00 hs
📍 Av. Rivadavia 4500, CABA

¿Podés asistir?

[Botón] ✅ Confirmo
[Botón] ❌ No puedo ir
[Botón] 🔄 Reprogramar
```

**Si confirma:**
```
📱 Paciente: [toca "Confirmo"]

🤖 Bot: ¡Genial! ✅ Tu turno está confirmado.
Recordá llegar 10 minutos antes con DNI y obra social.
¡Te esperamos mañana!
```

**Si no puede ir:**
```
📱 Paciente: [toca "No puedo ir"]

🤖 Bot: Entendido, cancelo tu turno del miércoles.
¿Querés que te busque otro horario?

[Botón] Sí, reprogramar
[Botón] No, gracias
```

**Recordatorio mismo día, 2h antes (template Utility):**
```
🤖 Bot [template]: Hola María ⏰
Tu turno con el Dr. García es hoy a las 10:00 hs.
📍 Av. Rivadavia 4500, CABA

¡Te esperamos!
```

### Flujo de reprogramación

```
📱 Paciente: "Necesito cambiar mi turno"

🤖 Bot: Encontré tu próximo turno:
👨‍⚕️ Dr. García - Cardiología
📅 Miércoles 8/4 - 10:00 hs

¿Querés reprogramarlo?

[Botón] Sí, cambiar fecha
[Botón] No, está bien así

📱 Paciente: [toca "Sí, cambiar fecha"]

🤖 Bot: Los próximos horarios disponibles con el Dr. García son:

[Lista interactiva - "Elegí nueva fecha"]
  → Viernes 10/4 - 08:30
  → Viernes 10/4 - 09:00
  → Lunes 13/4 - 09:30
  → Lunes 13/4 - 10:00
  → Ver más opciones

📱 Paciente: [selecciona "Viernes 10/4 - 09:00"]

🤖 Bot: ✅ ¡Listo! Tu turno fue reprogramado:

👨‍⚕️ Dr. García - Cardiología
📅 Viernes 10 de abril, 09:00 hs
📍 Av. Rivadavia 4500, CABA

Te enviamos un recordatorio el día anterior. 👍
```

### Flujo de cancelación

```
📱 Paciente: "Quiero cancelar mi turno"

🤖 Bot: Tu próximo turno es:
👨‍⚕️ Dr. García - Cardiología
📅 Miércoles 8/4 - 10:00 hs

¿Estás segura de que querés cancelarlo?

[Botón] Sí, cancelar
[Botón] No, mantener

📱 Paciente: [toca "Sí, cancelar"]

🤖 Bot: Tu turno fue cancelado. ✅

¿Querés sacar un turno para otro día?

[Botón] Sí, sacar nuevo turno
[Botón] No, gracias

📱 Paciente: [toca "No, gracias"]

🤖 Bot: ¡Perfecto! Cuando necesites, escribinos por acá.
¡Que tengas un buen día! 😊
```

### Flujo de check-in (llegada del paciente)

```
📱 Paciente: "Ya llegué" / "Estoy en la clínica"

🤖 Bot: ¡Hola María! Veo que tenés turno a las 10:00 con el Dr. García.

✅ Ya te registré como presente.
🪑 Sentate en la sala de espera de Cardiología (1er piso).
El doctor te va a llamar en unos minutos.

Si necesitás algo, hablá con recepción o escribí "secretaria" acá.
```

### Flujo post-consulta

**Seguimiento (template Utility, enviado 2-4 horas después):**
```
🤖 Bot [template]: Hola María 👋

Esperamos que tu consulta con el Dr. García haya sido buena.

¿Podrías decirnos cómo fue tu experiencia?

[Botón] 😊 Muy buena
[Botón] 😐 Regular
[Botón] 😞 Mala
```

**Si responde positivo:**
```
📱 Paciente: [toca "Muy buena"]

🤖 Bot: ¡Nos alegra mucho! 🙌
Recordá que si el doctor te indicó un control, podés sacarlo desde acá escribiendo "turno".
¡Hasta la próxima!
```

**Si responde negativo:**
```
📱 Paciente: [toca "Mala"]

🤖 Bot: Lamentamos que tu experiencia no haya sido buena. 😔
¿Querés contarnos qué pasó? Te paso con alguien del equipo para que te ayude.

[Botón] Sí, quiero hablar con alguien
[Botón] Prefiero no dar detalles
```

**Recordatorio de próximo turno (si el médico indicó control):**
```
🤖 Bot [template, enviado según indicación médica]:
Hola María 👋

El Dr. García indicó un control de Cardiología en 3 meses.
¿Querés que te busquemos un turno para julio?

[Botón] Sí, buscar turno
[Botón] Después lo veo
```

---

## 3. Estrategias de recordatorio que realmente funcionan

### El timing óptimo según los datos

Un análisis de **20 millones de turnos** de Solutionreach reveló que la cadencia más efectiva es **multi-toque**: un recordatorio entre 48-72 horas antes genera la tasa de confirmación más alta (**126% mayor** que sin recordatorios), un segundo a las 24 horas agrega un **26% adicional** de lift, y un tercero 2-3 horas antes no mejora significativamente la confirmación pero reduce llegadas tarde.

Para clínicas argentinas, el esquema práctico recomendado es:

**24 horas antes**: Recordatorio principal con botones de Confirmar / Cancelar / Reprogramar (template Utility con quick reply). Este es el mensaje más importante — el que genera la acción del paciente.

**2-3 horas antes**: Recordatorio breve del mismo día, solo informativo, sin botones de acción (template Utility simple). Funciona como nudge logístico.

**Para turnos programados con más de 7 días de anticipación**: Agregar un recordatorio a los 3-7 días antes, especialmente para pacientes nuevos que tienen **mayor tasa de ausentismo**.

El mejor horario de envío es **entre las 10 y las 14 horas** — evitar las 6:30-8:30 (rush matutino) y las 16-19 (rush vespertino). Un estudio de Cleveland Clinic encontró que los mensajes enviados a las 18:00 tenían **41,4% más confirmaciones** que los enviados al mediodía, pero esto varía por población.

### Tasas de respuesta: WhatsApp vs teléfono vs nada

Las diferencias entre canales son dramáticas. WhatsApp tiene una **tasa de apertura del 95-98%**, con el 90% de los mensajes leídos dentro de 3 minutos. La tasa de respuesta a recordatorios de turnos ronda el **60%** y las clínicas reportan **3 veces más respuestas** que con SMS tradicional.

Las llamadas telefónicas tienen una **tasa de contacto del 25-40%** (el 86% de la gente ignora llamadas de números desconocidos), aunque cuando logran contactar son más efectivas por interacción. El email tiene una tasa de apertura del **20-30%** y es el canal menos efectivo como recordatorio standalone.

**Sin recordatorios**, la tasa de ausentismo promedio es del **23%** (mediana de 29 estudios). **Con recordatorios**, baja al **13%** — una reducción relativa del **34%**. En Argentina específicamente, datos de plataformas locales muestran tasas de ausentismo del ~20-30% sin recordatorios, bajando al **6-10%** con WhatsApp activo. Crontu reportó una reducción de **30% a 3%** en sus mejores casos.

La combinación más poderosa en Argentina es: **recordatorio por WhatsApp + posibilidad de confirmar/cancelar con botones + cobro de seña por Mercado Pago**. Esta triple estrategia puede llevar el ausentismo por debajo del 5%.

### Manejo del paciente que no responde

El protocolo de escalamiento recomendado sigue esta secuencia:

Primero, el recordatorio WhatsApp a las 24-48 horas antes (template con botones). Si no hay respuesta en 6-8 horas, se envía un **segundo recordatorio** por WhatsApp con texto diferente y más urgencia: "Tu turno es mañana y necesitamos tu confirmación." Si sigue sin responder al mediodía del día anterior, se escala a **llamada telefónica** de la secretaria. Si después de la llamada tampoco hay respuesta, se marca el turno como "no confirmado" y se ofrece el slot a pacientes en lista de espera. El día del turno, se envía el recordatorio de 2-3 horas antes de todas formas.

**No hay que asumir que viene.** La no-respuesta es el indicador de mayor riesgo de ausentismo. Pero tampoco hay que liberar el slot automáticamente sin intentar contactar, ya que muchos pacientes simplemente no responden pero igual asisten. La práctica recomendada es un sistema de **doble booking controlado**: si el paciente no confirmó, ofrecer el slot a lista de espera pero mantener el turno original como "tentativo" hasta que alguien de la lista lo acepte explícitamente.

### Protección contra doble-booking por confirmación tardía

Se establece un **deadline de confirmación** (por ejemplo, 12 horas antes del turno) comunicado claramente en el recordatorio. Pasado ese deadline sin confirmación, el slot se ofrece a la lista de espera con una oferta limitada en tiempo: "Se liberó un turno para mañana a las 10:00. ¿Lo querés? Tenés 30 minutos para responder." Si el paciente original confirma tarde y el slot ya fue tomado, se le ofrece el próximo horario disponible con una disculpa y se le da prioridad. Nunca se debe eliminar completamente el turno original — se marca como "en riesgo" para que si nadie de la lista lo toma, el paciente original todavía pueda asistir.

---

## 4. Handoff humano: del bot a la secretaria

### Cuándo transferir a un humano

El bot debe transferir a la secretaria en estos escenarios: el paciente dice explícitamente **"quiero hablar con una persona"** o variantes ("secretaria", "operador", "humano", "persona real"); la consulta involucra **quejas o reclamos** ("me atendieron mal", "quiero hacer una queja"); la solicitud es **compleja y fuera del flujo estándar** (preguntas sobre cobertura de obra social, consultas médicas sobre síntomas, urgencias); el bot **no puede resolver** tras 2-3 intentos de comprensión ("no entendí tu consulta"); y cualquier mención de **urgencia médica** ("me siento mal", "es una emergencia").

```
📱 Paciente: "Quiero hablar con una persona"

🤖 Bot: ¡Por supuesto! Te transfiero con nuestra secretaria.
⏳ En un momento te va a responder.

Nuestro horario de atención es de lunes a viernes de 8 a 18 hs.
Si es fuera de horario, te responderemos mañana a primera hora.
```

### Patrones de implementación

El patrón más efectivo para la transferencia es un **sistema de etiquetado + notificación**. Cuando el bot decide transferir, actualiza el estado de la conversación a `HUMAN_HANDOFF` en la base de datos, agrega un tag al contacto (ej: `needs_human`), y dispara una notificación a la secretaria. La notificación puede ser un webhook a un canal de Slack/Telegram del staff, un email, o una notificación push en un panel web de administración.

La secretaria responde directamente desde un **panel web** o desde la **WhatsApp Business App** configurada en modo coexistencia con la API. Mientras el estado sea `HUMAN_HANDOFF`, el bot no procesa mensajes entrantes — los pasa directamente al panel humano. La secretaria cierra la conversación con un comando (ej: escribiendo `/cerrar` o tocando un botón en el panel) que devuelve el estado a `IDLE` y el bot retoma el control.

### El problema de coexistencia: bot y secretaria en el mismo número

Este es uno de los desafíos técnicos más importantes. La Cloud API permite usar el mismo número para API y WhatsApp Business App ("coexistence mode"), pero con limitaciones: el throughput baja a **20 mensajes por segundo** (vs 80 normal) y no se puede subir. La app y la API comparten el mismo número pero **ven los mismos mensajes**.

El patrón correcto es: el bot procesa todo por defecto vía API. Cuando hay handoff, se desactiva el procesamiento del bot para esa conversación específica. La secretaria responde desde el panel web (no desde la app de WhatsApp Business, que puede causar conflictos). Cuando la secretaria termina, se reactiva el bot.

Un approach alternativo y más limpio es **no usar la WhatsApp Business App en absoluto** — construir un mini-dashboard web donde la secretaria ve las conversaciones transferidas, responde vía la API, y cierra el handoff. Esto evita por completo los conflictos de coexistencia.

### Timeout: la secretaria no responde

Si la secretaria no contesta en un tiempo configurable (recomendado: **5 minutos en horario laboral, inmediato fuera de horario**), el bot retoma con un mensaje:

```
🤖 Bot: Disculpá la demora 😔
Nuestra secretaria está ocupada en este momento.

¿Querés que te ayude yo con algo? O si preferís,
dejá tu consulta acá y te contactamos a la brevedad.

[Botón] Volver al menú
[Botón] Dejar mensaje
```

Si el paciente elige "Dejar mensaje", el bot graba el texto y lo entrega a la secretaria como tarea pendiente con notificación.

---

## 5. Registro de templates para clínicas médicas

A continuación, **15 templates listos para enviar a Meta**, en español argentino, con las variables, categoría recomendada y tipo de interacción. Todos cumplen las reglas de aprobación: no empiezan ni terminan con variable, no tienen variables consecutivas sin texto fijo, y usan lenguaje neutro sin mencionar diagnósticos.

### Template 1 — Recordatorio 24h antes

**Nombre:** `turno_recordatorio_24h`
**Categoría:** Utility
**Tipo:** Quick Reply (3 botones)
**Header:** Recordatorio de turno 📅
**Body:**
```
Hola {{1}}, te recordamos tu turno de mañana:

👨‍⚕️ {{2}}
📅 {{3}} a las {{4}} hs
📍 {{5}}

¿Podés asistir?
```
**Botones:** `✅ Confirmo` | `❌ No puedo ir` | `🔄 Reprogramar`
**Footer:** Clínica {{6}}
**Variables:** {{1}} nombre, {{2}} profesional y especialidad, {{3}} fecha, {{4}} hora, {{5}} dirección, {{6}} nombre clínica

### Template 2 — Recordatorio mismo día (2h antes)

**Nombre:** `turno_recordatorio_hoy`
**Categoría:** Utility
**Tipo:** Texto plano (sin botones)
**Body:**
```
Hola {{1}} ⏰ Te recordamos que tu turno con {{2}} es hoy a las {{3}} hs en {{4}}. ¡Te esperamos!
```
**Variables:** {{1}} nombre, {{2}} profesional, {{3}} hora, {{4}} dirección

### Template 3 — Confirmación de turno nuevo

**Nombre:** `turno_confirmacion_nuevo`
**Categoría:** Utility
**Tipo:** Quick Reply (2 botones)
**Body:**
```
¡Hola {{1}}! Tu turno fue reservado con éxito ✅

👨‍⚕️ {{2}}
📅 {{3}} a las {{4}} hs
📍 {{5}}

Te vamos a enviar un recordatorio el día anterior. Si necesitás cancelar o cambiar el turno, escribinos por acá.
```
**Botones:** `📋 Ver mis turnos` | `❌ Cancelar turno`
**Footer:** Clínica {{6}}

### Template 4 — Confirmación de cancelación

**Nombre:** `turno_cancelacion`
**Categoría:** Utility
**Tipo:** Quick Reply (2 botones)
**Body:**
```
Hola {{1}}, tu turno del {{2}} a las {{3}} hs con {{4}} fue cancelado correctamente.

¿Querés sacar un nuevo turno?
```
**Botones:** `Sí, sacar turno nuevo` | `No, gracias`

### Template 5 — Confirmación de reprogramación

**Nombre:** `turno_reprogramacion`
**Categoría:** Utility
**Tipo:** Texto plano
**Body:**
```
Hola {{1}}, tu turno fue reprogramado con éxito ✅

👨‍⚕️ {{2}}
📅 Nueva fecha: {{3}} a las {{4}} hs
📍 {{5}}

Te enviamos un recordatorio el día anterior. ¡Gracias!
```

### Template 6 — Bienvenida paciente nuevo

**Nombre:** `bienvenida_paciente_nuevo`
**Categoría:** Marketing
**Tipo:** Quick Reply (2 botones)
**Body:**
```
¡Hola {{1}}! 👋 Te damos la bienvenida a {{2}}.

A través de este canal podés sacar turnos, recibir recordatorios y hacer consultas.

¿Querés sacar tu primer turno?
```
**Botones:** `Sacar turno` | `Después lo veo`
**Footer:** Escribí "menú" en cualquier momento

### Template 7 — Seguimiento de ausencia (no-show)

**Nombre:** `turno_ausencia_seguimiento`
**Categoría:** Utility
**Tipo:** Quick Reply (2 botones)
**Body:**
```
Hola {{1}}, notamos que no pudiste asistir a tu turno de hoy con {{2}}.

Esperamos que esté todo bien. ¿Querés reprogramar tu consulta?
```
**Botones:** `Sí, reprogramar` | `No por ahora`

### Template 8 — Seguimiento post-consulta

**Nombre:** `postconsulta_seguimiento`
**Categoría:** Utility
**Tipo:** Quick Reply (3 botones)
**Body:**
```
Hola {{1}} 👋 Esperamos que tu consulta de hoy haya sido buena. Nos gustaría saber cómo fue tu experiencia en {{2}}.
```
**Botones:** `😊 Muy buena` | `😐 Regular` | `😞 Mala`

### Template 9 — Aviso de lista de espera

**Nombre:** `turno_lista_espera`
**Categoría:** Utility
**Tipo:** Quick Reply (2 botones)
**Body:**
```
¡Hola {{1}}! Se liberó un turno que puede interesarte:

👨‍⚕️ {{2}}
📅 {{3}} a las {{4}} hs

⏳ Tenés 30 minutos para confirmar. ¿Lo querés?
```
**Botones:** `✅ Sí, lo quiero` | `❌ No, gracias`

### Template 10 — Recordatorio de pago

**Nombre:** `pago_recordatorio`
**Categoría:** Utility
**Tipo:** CTA Button (URL)
**Body:**
```
Hola {{1}}, te recordamos que tenés un saldo pendiente de ${{2}} correspondiente a tu consulta del {{3}}.

Podés abonarlo online o en la clínica.
```
**Botón CTA:** `Pagar online` → URL de pago (Mercado Pago)

### Template 11 — Segundo recordatorio (para no-respondedores)

**Nombre:** `turno_recordatorio_urgente`
**Categoría:** Utility
**Tipo:** Quick Reply (2 botones)
**Body:**
```
Hola {{1}}, tu turno con {{2}} es mañana {{3}} a las {{4}} hs y todavía no lo confirmaste.

Necesitamos tu confirmación para mantener tu reserva. ¿Vas a poder asistir?
```
**Botones:** `✅ Sí, confirmo` | `❌ No puedo`

### Template 12 — Instrucciones previas al turno

**Nombre:** `turno_instrucciones_previas`
**Categoría:** Utility
**Tipo:** Texto plano
**Body:**
```
Hola {{1}}, te compartimos información importante para tu turno del {{2}}:

{{3}}

📍 {{4}}
🪪 Traé tu DNI y credencial de obra social.

Cualquier duda, escribinos. ¡Te esperamos!
```
**Variables:** {{3}} instrucciones específicas del tipo de turno (ej: "Asistir con 8 horas de ayuno")

### Template 13 — Recordatorio de control periódico

**Nombre:** `control_periodico_recordatorio`
**Categoría:** Marketing
**Tipo:** Quick Reply (2 botones)
**Body:**
```
Hola {{1}} 👋 Según los registros de {{2}}, tu próximo control de {{3}} debería ser este mes.

¿Querés que te busquemos un turno?
```
**Botones:** `Sí, buscar turno` | `Después lo veo`

### Template 14 — Turno cancelado por la clínica

**Nombre:** `turno_cancelado_por_clinica`
**Categoría:** Utility
**Tipo:** Quick Reply (2 botones)
**Body:**
```
Hola {{1}}, lamentamos informarte que tu turno del {{2}} a las {{3}} hs con {{4}} tuvo que ser cancelado por motivos ajenos a tu voluntad.

Disculpá las molestias. ¿Querés que te busquemos otro horario?
```
**Botones:** `Sí, reprogramar` | `Me comunico después`

### Template 15 — Encuesta de satisfacción detallada

**Nombre:** `encuesta_satisfaccion`
**Categoría:** Marketing
**Tipo:** CTA Button (URL)
**Body:**
```
Hola {{1}} 👋 En {{2}} queremos mejorar nuestro servicio. ¿Podrías dedicarnos 1 minuto para contarnos cómo fue tu experiencia?

Tu opinión nos ayuda mucho. ¡Gracias!
```
**Botón CTA:** `Responder encuesta` → URL del formulario

---

## 6. Casos borde y problemas

### El paciente cambia de número de WhatsApp

Es un problema frecuente en Argentina (cambio de chip, portabilidad, líneas prepagas que se pierden). La estrategia recomendada es **identificar pacientes por DNI, no por número de teléfono**. Al inicio de cada conversación con un número nuevo, el bot pide DNI para vincular al paciente. Si el DNI ya existe con otro número, se actualiza el número asociado y se notifica: "Veo que antes usabas otro número. Actualicé tu contacto." Los templates programados al número viejo fallarán silenciosamente (Meta reporta `failed` en el webhook de status) — se debe implementar un listener de status que detecte fallos de entrega y genere una alerta para que la secretaria contacte al paciente por otro medio.

### Teléfonos compartidos (familiares)

Común en familias donde un padre saca turnos para hijos, o un hijo maneja el WhatsApp de un abuelo. La solución: después de identificar por DNI, preguntar "¿Este turno es para vos o para otra persona?" Si es para otra persona, recolectar DNI del paciente real. Guardar en la base de datos la relación `phone_number → [paciente_A, paciente_B, paciente_C]` y al iniciar cada conversación preguntar: "¿Para quién es la consulta?" con lista de los pacientes asociados a ese número.

### Pacientes que bloquean el número de la clínica

Si un paciente bloquea el número, los templates enviados figuran como `sent` pero nunca como `delivered` ni `read`. Meta no reporta explícitamente el bloqueo. La estrategia: si un template queda en `sent` sin pasar a `delivered` después de 24-48 horas, asumir que hay un problema de entrega. Marcar al paciente como "contacto no alcanzable por WhatsApp" y escalar a **llamada telefónica o email** para los próximos recordatorios. No insistir por WhatsApp — enviar templates repetidos a usuarios que bloquearon puede bajar el rating de calidad del template.

### Múltiples clínicas en un número vs números separados

**Números separados** (recomendado para SaaS multi-tenant): cada clínica tiene su propio número de WhatsApp Business. El paciente sabe de qué clínica viene el mensaje. Los templates se gestionan por WABA independiente. Desventaja: costo de gestión de múltiples números y WABAs.

**Un solo número para múltiples sedes de una misma clínica**: viable si las sedes son de la misma marca. El bot pregunta "¿En qué sede querés atenderte?" al inicio del flujo. Los templates incluyen la sede en el texto. Más simple de administrar pero puede confundir al paciente.

**Un solo número para clínicas diferentes** (NO recomendado): genera confusión total en el paciente, viola la expectativa de identidad del negocio, y complica la gestión de templates (que son por WABA, no por clínica).

### Privacidad: qué se puede y qué no se puede incluir en mensajes

Argentina clasifica los datos de salud como **datos sensibles** bajo la Ley 25.326 de Protección de Datos Personales. Los prestadores de salud pueden tratar datos de pacientes bajo la excepción del Artículo 8, pero deben respetar el secreto profesional.

**Se puede incluir:** nombre del paciente (primer nombre recomendado), nombre del profesional y especialidad general, fecha/hora/dirección del turno, instrucciones logísticas ("traé DNI y obra social"), montos a pagar (sin datos de tarjeta), links a portales seguros.

**No se puede incluir:** diagnósticos o condiciones médicas específicas ("su turno de oncología" revela una condición), resultados de estudios directamente en el mensaje (usar link a portal seguro), datos completos de DNI/tarjeta/cuenta bancaria, detalles del tratamiento o medicación, historia clínica.

**Zona gris:** mencionar la especialidad puede inferir una condición. "Turno de Cardiología" es generalmente aceptable; "turno de Infectología" o "turno de Psiquiatría" podría revelar información sensible a quien vea la pantalla del teléfono. La práctica más segura es usar **"turno médico"** como descriptor genérico en los templates, y reservar la especialidad para los mensajes de sesión dentro del flujo conversacional donde el paciente ya está interactuando activamente.

Se debe obtener **doble consentimiento**: opt-in para recibir mensajes de WhatsApp y consentimiento separado para el tratamiento de datos de salud (Ley 25.326). La base de datos debe registrarse en el Registro Nacional de Bases de Datos Personales (RNBD) de la AAIP.

### Caídas de WhatsApp en Argentina

WhatsApp tiene una disponibilidad excelente globalmente, pero ha tenido caídas significativas (~2-3 veces por año). El sistema debe tener un **fallback a SMS o email** para recordatorios críticos. Implementar un monitor que detecte si los mensajes enviados no pasan de `sent` a `delivered` dentro de un umbral de tiempo y, si se detecta una caída generalizada, active el canal alternativo automáticamente. Los mensajes que fallan deben quedar en una cola de reintentos.

---

## 7. Análisis de competidores argentinos

### El panorama actual del mercado

El mercado argentino de turneras tiene más de 10 competidores activos, todos compitiendo por la integración con WhatsApp como diferenciador clave. Solo algunos usan la **WhatsApp Business API oficial**; muchos dependen de integraciones más básicas o semi-automáticas.

**DrApp (Grupo Cormos)** es el player más maduro, con 2.000+ centros médicos y 15.000+ profesionales. Se posicionan como "la única solución en Latinoamérica integrada oficialmente a WhatsApp" y usan la **API oficial de Meta**. Sin embargo, hacen una distinción confusa: los recordatorios "semi-automáticos" (la secretaria clickea para enviar) están incluidos en el plan base (~$16.499 ARS/mes/profesional + IVA), pero los recordatorios **totalmente automáticos** son un add-on pago. Esta distinción genera frustración entre usuarios que esperan automatización real.

**MEDICLINE (PIXELIO)** tiene la **integración de WhatsApp más avanzada** del mercado. Su chatbot permite a los pacientes gestionar turnos completos por WhatsApp — reservar, reprogramar y cancelar identificándose con DNI. Envían recordatorios 48 horas antes con confirmación/cancelación. Es el gold standard en funcionalidad conversacional, pero su pricing no es público y requiere contacto comercial.

**Calu** se diferencia por incluir WhatsApp **en todos los planes** (con cuotas: 50, 200 y 1.000 mensajes/mes según tier). Es la propuesta más transparente en pricing — no hay sorpresas ni add-ons ocultos. Probablemente usa la API oficial dado el esquema de cuotas por volumen.

**Medicloud** ofrece un bot de WhatsApp que gestiona turnos automáticamente 24/7, pero el costo reportado del add-on es de **~$150.000 ARS/mes**, lo que lo vuelve inaccesible para consultorios pequeños. Dice tener "100% de entregabilidad" en WhatsApp, consistente con uso de API oficial.

**Turnito** opera con modelo freemium (plan gratis con 100 reservas/mes pero sin WhatsApp). Los recordatorios por WhatsApp son feature premium, accesible pagando suscripción o aceptando 5% de comisión sobre pagos por Mercado Pago. Buena estrategia de entrada al mercado pero limita la funcionalidad clave al tier pago.

**Turnera.com.ar** es un nuevo entrante con un modelo interesante de **cobro por recordatorio** ($350 ARS por reminder). Solo cobra cuando efectivamente se envía el recordatorio — si el paciente cancela antes, no hay cargo. Es un pricing por uso real que reduce el riesgo para clínicas chicas.

**Neocita** usa la API oficial y cobra por paquetes de recordatorios ($6.000-$24.000 ARS/mes para 50-200 recordatorios). El paciente responde "1" para confirmar o "2" para cancelar — funcional pero básico comparado con botones interactivos.

### Las quejas más comunes

El patrón de frustración más repetido es el **costo elevado de la automatización real por WhatsApp**. Los usuarios esperan que los recordatorios automáticos estén incluidos en la suscripción, pero la mayoría de las plataformas los cobran como extra. Otro problema frecuente es la falta de un **chatbot bidireccional** — la mayoría solo envían recordatorios unidireccionales, sin permitir que el paciente reserve, cancele o reprograme desde WhatsApp. Solo MEDICLINE y Medicloud (a un costo muy alto) ofrecen esta funcionalidad completa.

### Quién lo hace mejor y por qué

**MEDICLINE** gana en funcionalidad de WhatsApp: es el único que ofrece gestión completa de turnos vía chatbot conversacional. **Calu** gana en transparencia de pricing: WhatsApp incluido en todos los planes sin sorpresas. **DrApp** gana en escala y madurez: la base instalada más grande con integración API oficial verificada. **La oportunidad** está en combinar la funcionalidad de MEDICLINE (chatbot bidireccional completo) con la transparencia de Calu (WhatsApp incluido sin add-ons) y un pricing accesible para consultorios pequeños — exactamente lo que un nuevo SaaS podría ofrecer.

---

## 8. Patrones de arquitectura del backend

### Enfoque Python: FastAPI + Supabase + BSP

La arquitectura Python sigue el patrón webhook estándar. El BSP (o Meta Cloud API directa) envía los mensajes entrantes a un endpoint POST en tu servicio FastAPI. El servicio debe **retornar HTTP 200 inmediatamente** y procesar la lógica de negocio de forma asíncrona (vía background tasks de FastAPI o una cola Redis/Celery). Si tardás más de 5-10 segundos, Meta reintenta y genera duplicados.

El manejo de estado de conversación usa un patrón de **máquina de estados finita (FSM)** almacenada en Supabase. Cada conversación se identifica por la tupla `(patient_phone, clinic_id)` y tiene un estado actual (`IDLE`, `ASK_SPECIALTY`, `ASK_DOCTOR`, `ASK_DATE`, `CONFIRM`, etc.) más un contexto JSON con los datos recolectados (slot filling). La librería `python-statemachine` o `transitions` de PyPI implementa las transiciones de forma declarativa y elegante.

```
Estado: IDLE → ASK_SPECIALTY → ASK_DOCTOR → ASK_DATE → ASK_TIME → CONFIRM → DONE
                                                                        ↕
                                                              HUMAN_HANDOFF
```

El esquema de base de datos incluye tablas para `clinics` (config multi-tenant con phone_number_id, especialidades, médicos, horarios), `conversation_sessions` (estado + contexto con expiración de 30 minutos), `patients` (identificados por DNI + clinic_id), y `message_log` (para deduplicación usando el wamid de WhatsApp y auditoría).

**Manejo de concurrencia**: múltiples pacientes escribiendo al mismo tiempo no es problema porque cada conversación tiene su propia fila en la base de datos. Para evitar race conditions cuando un mismo paciente envía mensajes rápidos, se usa **bloqueo optimista** (verificar `updated_at` antes de escribir) o un lock en Redis con key `conversation:{phone}:{clinic_id}`.

**Pros**: control total sobre la lógica, ideal para flujos multi-turno complejos, multi-tenant natural (rutear por `phone_number_id`), fácil de testear, escala bien con workers.
**Contras**: más tiempo de desarrollo inicial, requiere deployment y DevOps, sin editor visual de flujos.

### Enfoque n8n: workflows como flujos de chatbot

n8n tiene un nodo nativo de WhatsApp Business Cloud que funciona como trigger (recibe mensajes) y sender. El workflow básico es: WhatsApp Trigger → Switch (por tipo de mensaje) → lógica → WhatsApp Send.

Sin embargo, n8n tiene una **limitación crítica para turneras**: es **stateless por diseño**. Cada mensaje entrante es un evento independiente sin memoria de lo anterior. Para un flujo de reserva de turnos multi-paso, hay que implementar read/write de estado a una base de datos externa en cada nodo, lo que convierte lo que debería ser "low-code" en un workflow tan complejo como el código equivalente pero más difícil de debuggear.

La segunda limitación fatal es que Meta permite **un solo WhatsApp trigger por Facebook App**, lo que complica severamente la arquitectura multi-tenant. Si querés manejar 50 clínicas, no podés tener 50 workflows con triggers separados en la misma Meta App.

Otros problemas: debugging doloroso (revisar ejecuciones una por una), los flujos visuales se vuelven "spaghetti" con lógica compleja de branching, error handling hay que construirlo manualmente, y cuando el workflow se rompe todas las clínicas caen.

**n8n sirve para**: prototipos rápidos, integraciones simples (recibir mensaje → responder con info fija → terminar), automatizaciones de notificación unidireccionales. **No sirve para**: chatbots conversacionales con estado, multi-tenant, o flujos de booking multi-paso.

### BSP: cuál elegir para un desarrollador solo

Para un SaaS multi-tenant construido por un desarrollador solo, las opciones principales son:

**360dialog** (~$50/mes por número + tarifas Meta sin markup): la mejor opción para SaaS. Zero markup en mensajes (solo pagás las tarifas de Meta), API-first sin UI innecesaria, Partner API para gestionar WABAs de múltiples clínicas desde un hub, y embedded signup para que las clínicas onboardeen su número en minutos.

**Twilio** (pay-as-you-go + $0,005/mensaje de platform fee + tarifas Meta): segunda opción. La mejor documentación y SDKs del mercado, potencial para agregar SMS/voz después, pero el markup de $0,005 por mensaje se acumula.

**Meta Cloud API directa** (gratis, sin BSP): viable para MVP. Mismo formato de webhooks, sin markup, pero requiere implementar todo vos (gestión de tokens, templates, numbers). Podés migrar a un BSP después sin cambiar la lógica de webhooks.

**YCloud**: bueno si querés features de marketing built-in, pero menos ideal para desarrollo API puro. Tiene retry policy sólida (7 reintentos: 10s, 30s, 5m, 30m, 1h, 2h, 2h) y webhook signature verification con HMAC SHA256.

### Manejo de errores en producción

Cuando el servicio de chatbot cae, Meta reintenta con backoff exponencial durante **hasta 7 días** (Cloud API) o 24 horas (varía por BSP). Después de ese período, los mensajes **se pierden permanentemente** — Meta no tiene dead-letter queue. La mitigación: loguear el payload crudo a almacenamiento durable (S3, Supabase) **antes** de cualquier procesamiento, health checks con alerting para detectar caídas en minutos, y deployment en plataformas con auto-restart (Railway, Fly.io, Render).

Para fallos en la API del sistema de turnos (al intentar reservar), implementar **retry con backoff exponencial** (la librería `tenacity` de Python es ideal: 3 intentos, wait exponencial de 1-10 segundos). Si falla después de reintentos, transicionar a estado `ERROR`, enviar al paciente "Lo siento, hubo un problema al reservar tu turno. Por favor intentá de nuevo en unos minutos" y loguear el error para seguimiento manual.

La **idempotencia** es crítica: WhatsApp entrega mensajes con semántica at-least-once. Usar el `wamid` (message ID) como clave de deduplicación en la tabla `message_log`: si un wamid ya fue procesado, ignorar el mensaje.

Para producción se recomienda un patrón de **cola de mensajes**: webhook recibe el mensaje → devuelve 200 → encola en Redis/SQS → worker procesa → actualiza estado → envía respuesta. Esto desacopla la ingesta del procesamiento y evita duplicados por timeout.

### Python es la elección correcta para un dev solo construyendo SaaS

La recomendación para un desarrollador solo es **Python + FastAPI + Supabase + 360dialog** (o Cloud API directa para MVP). La reserva de turnos es un flujo multi-turno con estado — exactamente donde n8n falla. Multi-tenant es requisito de primer orden — exactamente donde n8n se rompe. FastAPI maneja miles de requests concurrentes, Supabase tiene tier gratis generoso con Row Level Security para aislamiento de tenants, y la librería **PyWa** maneja todo el boilerplate de la Cloud API (verificación de webhook, parsing de mensajes, envío, templates). El timeline estimado para un MVP funcional: **2-3 semanas** para el chatbot de un solo clinic, más 1-2 semanas para dashboard multi-tenant y onboarding.

### Diagrama de arquitectura

```
┌─────────────┐     ┌──────────┐     ┌──────────────┐     ┌──────────────────┐
│  WhatsApp   │────▶│   Meta   │────▶│  BSP/Cloud   │────▶│  FastAPI Service  │
│  Paciente   │◀────│  Servers │◀────│  API (360d)  │◀────│  (webhook)       │
└─────────────┘     └──────────┘     └──────────────┘     └────────┬─────────┘
                                                                    │
                                          ┌─────────────────────────┼──────────────────┐
                                          │                         │                  │
                                          ▼                         ▼                  ▼
                                   ┌─────────────┐         ┌──────────────┐   ┌───────────────┐
                                   │  Supabase   │         │  Sistema de  │   │  Panel Admin  │
                                   │             │         │  Turnos API  │   │  (Next.js)    │
                                   │ • Sessions  │         │  (existente) │   │               │
                                   │ • Patients  │         │              │   │ • Config      │
                                   │ • Clinics   │         │ • Agenda     │   │ • Templates   │
                                   │ • Msg Log   │         │ • Booking    │   │ • Handoff     │
                                   │ • Templates │         │ • Doctors    │   │ • Reportes    │
                                   └─────────────┘         └──────────────┘   └───────────────┘
```

**Flujo del mensaje entrante:**
1. Paciente envía mensaje por WhatsApp
2. Meta recibe y entrega al BSP configurado (360dialog, YCloud, o Cloud API directa)
3. BSP envía POST al webhook de FastAPI con el payload del mensaje
4. FastAPI retorna 200 inmediatamente, encola el procesamiento
5. Worker carga la sesión de conversación desde Supabase (por `patient_phone` + `clinic_id`)
6. State machine procesa el mensaje según el estado actual
7. Si se necesita data del sistema de turnos (disponibilidad, booking), se consulta la API del sistema de turnos
8. Se actualiza el estado y contexto en Supabase
9. Se envía la respuesta al paciente vía la API del BSP
10. Si hay handoff humano, se notifica a la secretaria vía el panel admin

**Flujo del template outbound (recordatorio):**
1. Cron job o scheduler consulta Supabase por turnos de mañana
2. Para cada turno no cancelado, envía template de recordatorio vía API del BSP
3. Cuando el paciente responde (ej: toca "Confirmo"), llega como mensaje entrante al webhook
4. State machine procesa la respuesta y actualiza el estado del turno en el sistema de turnos

---

## Conclusión

Construir una turnera por WhatsApp para clínicas argentinas es técnicamente viable y económicamente atractivo: a **USD 0,026 por recordatorio** (o gratis si el paciente interactuó en las últimas 24h), el ROI se justifica con reducir el ausentismo del 25% al 10% — lo que para una clínica con 100 turnos diarios significa **15 turnos recuperados por día**. La arquitectura Python + FastAPI + Supabase + 360dialog es la elección correcta para un dev solo: da control total sobre flujos conversacionales complejos, escala naturalmente a multi-tenant, y evita las limitaciones fatales de n8n para chatbots con estado. El mercado argentino tiene una oportunidad clara: ningún competidor actual combina chatbot conversacional completo (como MEDICLINE) con pricing accesible y transparente (como Calu) en una solución que cualquier consultorio pueda adoptar. La clave diferenciadora no está en la tecnología sino en la ejecución: flujos conversacionales bien diseñados en español argentino, templates aprobados desde el día uno, y un manejo inteligente del handoff humano que no deje al paciente esperando.