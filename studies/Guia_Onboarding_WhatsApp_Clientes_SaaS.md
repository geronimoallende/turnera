# Guía completa: Onboarding de WhatsApp para clientes de tu SaaS

## Panorama general: dos caminos de conexión

Cuando un cliente compra tu servicio de secretaria virtual con IA, necesita conectar su WhatsApp al sistema. Existen dos caminos fundamentalmente distintos, y la elección correcta depende de la situación del cliente:

**Camino A — WhatsApp Coexistence (recomendado para la mayoría):** El cliente ya tiene un número en la app WhatsApp Business y quiere seguir usándola mientras el bot de IA maneja las conversaciones por la API. No pierde su historial de chats ni sus contactos. Ambos canales (app y API) funcionan en paralelo sobre el mismo número.

**Camino B — Migración completa a Cloud API:** El cliente registra un número nuevo (o migra el existente) exclusivamente en la Cloud API. Pierde acceso a la app Business con ese número. Es el camino clásico para operaciones 100% automatizadas o de alto volumen.

Para tu producto — una secretaria virtual para clínicas y consultorios en Argentina — **el Camino A (Coexistence) es casi siempre la mejor opción**, porque las clínicas pequeñas quieren seguir respondiendo desde su celular cuando lo necesitan, y el bot solo se activa para las consultas de agendamiento.

---

## 1. ¿Cuándo necesita el cliente verificar su Meta Business Portfolio?

### La verificación NO es necesaria para empezar

Desde octubre 2023, Meta eliminó el requisito de verificación empresarial para comenzar a usar la WhatsApp Business API. Un cliente puede empezar a enviar y recibir mensajes inmediatamente después de completar el Embedded Signup, sin verificar su negocio.

Sin embargo, las cuentas no verificadas tienen limitaciones importantes:

| Estado | Límite de mensajes (por 24h) | Templates de marketing | OTP/Autenticación | Badge azul |
|--------|------------------------------|----------------------|-------------------|------------|
| **Sin verificar (Tier 0)** | 250 conversaciones business-initiated | Sí, pero con limitaciones | No disponible | No |
| **Verificado (Tier 1+)** | 1.000+ (auto-escala a 2K → 10K → 100K → ilimitado) | Completo | Disponible | Opcional |

### Cuándo SÍ necesita verificar

El cliente necesita verificar su Meta Business Portfolio cuando:

1. **Necesita enviar más de 250 mensajes de recordatorio/confirmación por día.** Para un consultorio con un solo profesional (~20 turnos/día), 250 es más que suficiente. Para una clínica con 10+ profesionales (~200+ turnos/día), se vuelve necesario.

2. **Quiere enviar mensajes de autenticación (OTP).** Si tu sistema incluye login por WhatsApp o verificación de identidad del paciente.

3. **Quiere el badge azul de verificación.** No es necesario para funcionar, pero genera confianza.

4. **Quiere acceder a templates de marketing** para campañas promocionales (recordatorios de chequeos, promociones, etc.) a gran escala.

### Cuándo NO necesita verificar

Para la gran mayoría de tus clientes en Argentina (profesionales independientes y clínicas pequeñas), la verificación no es necesaria al principio:

- Un psicólogo con 15 pacientes por día no va a superar los 250 mensajes.
- Un dentista con 20 pacientes por día tampoco, considerando que las conversaciones iniciadas por pacientes (service messages) son ilimitadas y gratis.
- El bot de IA respondiendo preguntas de pacientes (conversaciones iniciadas por el paciente) no consume límite.
- Solo los recordatorios enviados proactivamente (business-initiated) cuentan contra el límite.

**Regla práctica: si el cliente tiene menos de 50 turnos por día, puede arrancar sin verificar y verificar después cuando necesite escalar.**

### Ruta alternativa para escalar SIN verificar

Desde 2023, Meta permite escalar los límites automáticamente basándose en la calidad de las conversaciones. Si un negocio sin verificar mantiene conversaciones de alta calidad con 1.000+ contactos únicos en un período de 30 días, Meta puede promoverlo automáticamente al Tier 1 (1.000 conversaciones/día) sin verificación formal.

### Caso especial: Coexistence

En modo Coexistence, hay una particularidad importante: **la verificación empresarial estándar (Standard Business Verification) no está disponible.** En su lugar, se puede usar:

- **Partner-Led Business Verification (PLBV):** Tu SaaS, como Tech Provider, puede verificar al cliente en su nombre.
- **Meta Verified for Business:** El cliente paga una suscripción directa a Meta para verificarse (similar al "tick azul" de Instagram).

Esto simplifica el proceso para el cliente porque no necesita navegar el complicado Security Center de Meta Business Manager por su cuenta.

---

## 2. Flujo completo: desde la compra hasta la conexión

### Fase 0 — Pre-onboarding (durante la venta)

Antes de que el cliente compre, tu equipo de ventas debe:

1. **Confirmar que el cliente tiene WhatsApp Business App instalada** con el número que quiere usar (no WhatsApp personal).
2. **Verificar la versión**: debe ser 2.24.17 o posterior.
3. **Confirmar que el número tiene actividad reciente** — Meta no permite conectar números nuevos o inactivos a Coexistence. El número debe haber estado en uso activo durante al menos 7 días.
4. **Confirmar que el país es elegible** — Argentina está soportado para Coexistence. No hay problema.
5. **Confirmar que el cliente tiene o puede crear una cuenta de Facebook** para acceder a Meta Business Manager.

### Fase 1 — Alta del cliente en tu plataforma (Día 1)

Una vez que el cliente compra:

1. **Crear la cuenta del cliente en tu SaaS:** configurar tenant, clínica, profesionales, servicios, horarios.
2. **Recopilar información del negocio:** nombre legal, dirección, sitio web (si tiene), descripción del negocio, horarios de atención.
3. **Configurar la agenda:** cargar servicios, duraciones, horarios de cada profesional.

### Fase 2 — Conexión de WhatsApp vía Embedded Signup (Día 1-2)

Este es el paso clave. Tu plataforma debe tener un botón de "Conectar WhatsApp" que inicia el flujo de Embedded Signup:

**Paso 1:** El cliente hace clic en "Conectar WhatsApp" dentro de tu plataforma.

**Paso 2:** Se abre un popup de Meta (Login with Facebook). El cliente inicia sesión con su cuenta de Facebook.

**Paso 3:** Dentro del popup, el cliente:
- Crea o selecciona su Meta Business Portfolio (antes llamado Business Manager).
- Crea una WhatsApp Business Account (WABA) nueva — o selecciona una existente si ya tiene.
- Selecciona la opción "WhatsApp Business App Number" (para Coexistence).
- Ingresa el número de WhatsApp Business que quiere conectar.
- Acepta los permisos y términos.

**Paso 4:** Aparece un código QR en pantalla. El cliente lo escanea con su app WhatsApp Business desde el celular.

**Paso 5:** Meta pregunta si quiere sincronizar el historial de chats. Recomendación: seleccionar "Sí" para que las conversaciones previas aparezcan en tu plataforma (útil para contexto del chatbot).

**Paso 6:** En minutos, ambos canales quedan operativos. El cliente puede seguir usando su app Business normalmente, y tu API recibe/envía mensajes en paralelo.

**Datos que tu sistema recibe automáticamente de Meta:**
- `phone_number_id` — identificador del número conectado
- `waba_id` — identificador de la cuenta de WhatsApp Business
- `business_id` — identificador del Meta Business Portfolio

**Lo que tu backend debe hacer automáticamente:**
- Guardar estos IDs vinculados al tenant del cliente.
- Configurar los webhooks para recibir mensajes entrantes.
- Procesar los `smb_message_echoes` (mensajes enviados desde la app que se replican a la API).
- Registrar las templates de mensajes necesarias (confirmación de turno, recordatorio, etc.).

### Fase 3 — Configuración del bot y templates (Día 2-3)

**Aprobación de templates:** Antes de que el bot pueda enviar mensajes proactivos (recordatorios, confirmaciones), necesitas templates aprobados por Meta. Esto toma entre 1 hora y 48 horas generalmente. Prepara templates genéricos que sirvan para todos los clientes:

- Template de recordatorio de turno: "Hola {{1}}, te recordamos tu turno el {{2}} a las {{3}} con {{4}}. Respondé SI para confirmar o NO para cancelar."
- Template de confirmación: "Tu turno fue confirmado para el {{2}} a las {{3}}."
- Template de cancelación: "Tu turno del {{2}} fue cancelado. ¿Querés reprogramar?"

**Configuración del chatbot:** Personalizar las respuestas del bot con la información del consultorio — servicios, profesionales, horarios, políticas de cancelación, dirección.

### Fase 4 — Pruebas y ajustes (Día 3-5)

1. **Test de recepción:** Un miembro de tu equipo envía un mensaje al número del cliente y verifica que el bot responde.
2. **Test de envío:** Enviar un template de recordatorio de prueba.
3. **Test de handoff:** Verificar que cuando el bot no puede responder, el mensaje llega a la app del cliente para respuesta humana, y que la respuesta del cliente desde la app se detecta vía echo webhook para pausar el bot.
4. **Test de agendamiento:** Simular una conversación completa de reserva de turno.

### Fase 5 — Go-live y acompañamiento (Día 5-14)

1. **Activar el bot en producción** con supervisión cercana.
2. **Monitorear las primeras 50 conversaciones** reales para ajustar el comportamiento del bot.
3. **Capacitación final al staff:** cómo funciona el handoff bot↔humano, cómo ver los turnos agendados por el bot, cómo intervenir manualmente.

---

## 3. Cómo manejan esto los competidores

### AgendaPro

AgendaPro ofrece WhatsApp como add-on pago a sus planes. Su integración es principalmente de envío de recordatorios — no ofrecen un flujo de Embedded Signup donde el cliente conecte su propio número. En cambio, los recordatorios por WhatsApp se envían desde un número centralizado de AgendaPro o mediante configuración manual. El cliente no necesita crear un Meta Business Portfolio. La limitación es que no hay chatbot conversacional ni coexistencia real — es solo envío unidireccional de notificaciones.

### Medicloud

Medicloud cobra ~USD 107/mes por su add-on de WhatsApp. Según su sitio, ofrecen un bot básico con respuestas predefinidas. El setup parece ser asistido por su equipo de soporte, no self-service. El cliente probablemente necesita proporcionar datos de su negocio y Medicloud configura todo internamente. No hay evidencia de que usen Embedded Signup o que el cliente mantenga control directo sobre su WABA.

### Turnito App

Turnito envía recordatorios por WhatsApp como feature paga. No ofrecen chatbot ni automatización conversacional. Es puramente notificacional.

### Doctoralia

Doctoralia (DocPlanner) maneja todo internamente a gran escala. Los recordatorios por WhatsApp están incluidos en planes premium. Al ser una empresa con 2.800+ empleados, tienen su propia infraestructura de WhatsApp Business API como BSP. Los médicos que usan Doctoralia no necesitan gestionar nada de WhatsApp por su cuenta — Doctoralia lo envía desde su propia infraestructura.

### Wati / Respond.io / YCloud (plataformas de WhatsApp API)

Estas plataformas SÍ usan el flujo de Embedded Signup completo. Sus clientes:
1. Se registran en la plataforma.
2. Hacen clic en "Conectar WhatsApp".
3. Completan el Embedded Signup con su cuenta de Facebook.
4. Conectan su número (ya sea por migración completa o Coexistence).
5. Empiezan a operar en minutos.

**Wati** requiere que su equipo habilite Coexistence manualmente para cada cliente (no es self-service aún). **YCloud** y **Respond.io** ofrecen el flujo más automatizado con Coexistence self-service.

### Resumen comparativo de onboarding

| Competidor | Método de conexión | Self-service | Coexistence | Verificación Meta requerida | Tiempo de setup |
|-----------|-------------------|-------------|------------|---------------------------|----------------|
| AgendaPro | Centralizado/manual | ❌ | ❌ | No (lo manejan ellos) | 1-3 días |
| Medicloud | Asistido por soporte | ❌ | ❌ | No (lo manejan ellos) | 3-7 días |
| Turnito | Add-on simple | ✅ | ❌ | No | Horas |
| Doctoralia | Infraestructura propia | ❌ | ❌ | No | Parte del plan |
| Wati | Embedded Signup | Parcial | ✅ (previa habilitación) | No para empezar | Minutos-horas |
| YCloud | Embedded Signup | ✅ | ✅ Self-service | No para empezar | Minutos |
| **Tu SaaS (propuesto)** | Embedded Signup | ✅ | ✅ Self-service | No para empezar | **5-15 minutos** |

---

## 4. Comunicación con el cliente: qué decirle y cuándo

### Mensaje de bienvenida (post-compra)

El cliente acaba de comprar. No lo abrumes con tecnicismos. El mensaje debe ser:

> "¡Bienvenido/a! Para activar tu secretaria virtual de WhatsApp necesitamos hacer 3 cosas:
> 1. Configurar tu agenda (servicios, horarios, profesionales)
> 2. Conectar tu WhatsApp Business (toma 5 minutos)
> 3. Personalizar las respuestas del bot
>
> Empezamos hoy mismo. ¿Tenés WhatsApp Business instalado en tu celular?"

### Sobre Meta Business Portfolio

**NUNCA uses el término "Meta Business Portfolio" o "Business Manager" con el cliente.** Son términos técnicos que asustan. En cambio:

> "Para conectar WhatsApp, vamos a vincular tu número a través de tu cuenta de Facebook. Cuando hagas clic en 'Conectar WhatsApp', se va a abrir una ventana de Facebook donde tenés que iniciar sesión. Si no tenés cuenta de Facebook, podés crear una en el momento. Facebook te va a pedir algunos datos de tu negocio (nombre, dirección) — esto es para que Meta sepa que tu negocio es real."

### Si el cliente pregunta por verificación

> "Para empezar no necesitás verificar nada. Tu WhatsApp va a funcionar perfectamente desde el primer día. El sistema puede enviar hasta 250 recordatorios por día sin verificación, que es más que suficiente para la mayoría de los consultorios.
>
> Si más adelante necesitás enviar más mensajes porque tu clínica creció, podemos ayudarte a verificar tu cuenta empresarial con Meta — es un proceso simple donde subís un documento como la constancia de CUIT o un servicio a nombre del negocio."

### Documentación para verificación (cuando sea necesario)

En Argentina, Meta acepta los siguientes documentos:

- Constancia de inscripción en AFIP (CUIT)
- Constancia de monotributo
- Habilitación comercial / municipal
- Factura de servicio a nombre del negocio (luz, gas, internet)
- Extracto bancario empresarial

El nombre legal debe coincidir exactamente con lo que aparece en Meta Business Manager. Si el cliente se llama "Dr. Juan Pérez" pero su razón social es "Juan Carlos Pérez — Consultorio Odontológico", debe usar el nombre legal exacto.

### Guía paso a paso que le das al cliente

Prepara un video de 2-3 minutos o una guía visual con capturas mostrando:

1. "Abrí tu app WhatsApp Business en el celular y verificá que sea la versión más reciente."
2. "En nuestra plataforma, hacé clic en 'Conectar WhatsApp'."
3. "Iniciá sesión con Facebook cuando se abra la ventana."
4. "Elegí la opción 'Usar mi número de WhatsApp Business actual'."
5. "Escaneá el código QR que aparece en pantalla con tu celular."
6. "¡Listo! Ya estás conectado/a."

---

## 5. Requisitos operativos post-conexión que el cliente DEBE saber

Una vez conectado en modo Coexistence, hay requisitos que el cliente debe cumplir para mantener la conexión activa:

1. **Abrir la app WhatsApp Business al menos una vez cada 14 días.** Si pasan más de 14 días sin abrirla, Meta desconecta la coexistencia automáticamente. Esto es crítico comunicarlo.

2. **No desinstalar la app ni borrar la cuenta.** Hacerlo rompe la coexistencia.

3. **Mantener la app actualizada.** Meta requiere versiones recientes para soportar coexistencia.

4. **Entender que el bot y ellos pueden responder al mismo chat.** Cuando el staff responde desde la app a un paciente, el bot detecta esto y se pausa para esa conversación por un tiempo configurable (ej: 30 minutos). Si el staff no responde, el bot retoma.

5. **Las listas de difusión quedan deshabilitadas** en modo Coexistence. Si el cliente usaba broadcast lists, ya no podrá. En cambio, puede enviar campañas por la API (a través de tu plataforma).

### Mensaje de activación exitosa

> "¡Tu secretaria virtual de WhatsApp está activa! A partir de ahora:
> - Los pacientes que te escriban van a recibir respuesta automática 24/7.
> - Los recordatorios de turno se envían automáticamente.
> - Si el bot no puede responder algo, te llega el mensaje a tu celular para que respondas vos.
>
> **Importante:** Abrí tu WhatsApp Business al menos una vez cada dos semanas para mantener todo funcionando.
>
> Cualquier duda, escribinos por WhatsApp a [número de soporte]."

---

## 6. Flujo técnico resumido para tu equipo de desarrollo

```
COMPRA → Crear tenant en Supabase
       → Configurar agenda (servicios, profesionales, horarios)
       → Cliente hace clic "Conectar WhatsApp"
       → Embedded Signup (popup Meta)
           ├── Cliente login Facebook
           ├── Crea/selecciona Meta Business Portfolio
           ├── Crea WABA
           ├── Selecciona "WhatsApp Business App Number"
           ├── Ingresa número
           ├── Escanea QR con celular
           └── Meta retorna: phone_number_id, waba_id, business_id
       → Backend guarda IDs vinculados al tenant
       → Configura webhooks para este WABA
       → Registra message templates (recordatorio, confirmación, cancelación)
       → Espera aprobación de templates (1-48h)
       → Tests automatizados (envío, recepción, handoff)
       → Go-live
       → Monitoreo primeras 50 conversaciones
```

### Pre-fill de datos

Como Tech Provider, podés pre-llenar los datos del Embedded Signup con la información que ya recopilaste del cliente (nombre del negocio, categoría, etc.). Esto acelera el proceso porque el cliente solo necesita confirmar en lugar de escribir todo de nuevo.

### Manejo de errores comunes

| Error | Causa | Solución |
|-------|-------|----------|
| "Your phone number isn't eligible" | Número nuevo o inactivo | El cliente debe usar la app activamente por al menos 7 días antes de conectar |
| Verificación de display name rechazada | Nombre no coincide con presencia online | Ajustar el nombre o crear una presencia web mínima |
| Template rechazado | Contenido no cumple guidelines de Meta | Reformular sin lenguaje promocional excesivo, incluir opt-out |
| Coexistence se desconecta | No abrieron la app en 14+ días | Reconectar vía Embedded Signup (mismo proceso) |
| Companion devices desvinculados | Normal al activar Coexistence | Revincular después de completar la sincronización |

---

## 7. Consideraciones para Argentina

### Documentación AFIP para verificación

Si el cliente es monotributista (la mayoría de los profesionales independientes en Argentina), el documento más fácil de usar para verificación es la **Constancia de Inscripción de AFIP**, que se descarga gratis desde la web de AFIP y contiene nombre legal, CUIT, dirección y actividad.

### Número de teléfono

La mayoría de los profesionales en Argentina usan su número personal de celular para WhatsApp Business. Esto funciona perfectamente con Coexistence. No necesitan un número nuevo ni una línea empresarial dedicada.

### Facturación de Meta

Meta cobra los mensajes de la API directamente al Business Portfolio del cliente. Es necesario que el cliente tenga un método de pago válido (tarjeta de crédito internacional) cargado en su Meta Business Manager, O que tu SaaS absorba estos costos a través de tu propia cuenta como Tech Provider y los cobre como parte de la suscripción mensual.

**Recomendación para Argentina:** Que tu SaaS absorba los costos de WhatsApp API y los incluya en el precio mensual. Los profesionales argentinos no quieren gestionar pagos en USD a Meta por separado. Además, al concentrar el billing, podés optimizar costos y ofrecer una experiencia más simple.

### Hora local para recordatorios

Los templates de recordatorio deben respetar el huso horario de Argentina (UTC-3). Meta aplica frequency capping que limita la cantidad de mensajes de marketing que un usuario puede recibir por día (~2 de todos los negocios combinados). Enviar recordatorios de turno como "utility" en lugar de "marketing" evita este límite y es más barato.
