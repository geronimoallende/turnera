# Automatización de WhatsApp Business para agencias: 6 escenarios comparados en profundidad

**La coexistencia de WhatsApp Business App + API cambió las reglas del juego para agencias en 2025, pero no todos los escenarios son iguales.** El lanzamiento global del modo coexistencia (mayo 2025) permite por primera vez operar la app móvil y la Cloud API sobre el mismo número simultáneamente, resolviendo el dolor histórico de "perder el celular" al conectar la API. Sin embargo, cada combinación de herramientas —YCloud, ManyChat, Chatwoot, n8n y la API directa de Meta— presenta ventajas, riesgos y costos radicalmente diferentes. Esta investigación compara en profundidad 6 escenarios reales de implementación con datos actualizados a 2025-2026, enfocados en agencias de automatización en Argentina y Latinoamérica, donde el **97% de la población usa WhatsApp** y el **86% lo utiliza para comunicarse con negocios**.

---

## Resumen ejecutivo

Desde julio de 2025, Meta cobra **por mensaje de plantilla enviado** (no por conversación). Las conversaciones de servicio (iniciadas por el cliente) son **gratuitas e ilimitadas**. Los mensajes de utilidad dentro de la ventana de 24 horas también son gratuitos. Para Argentina, el costo por mensaje de marketing es **USD 0.071** y de utilidad **USD 0.030**. El modelo OBO (On-Behalf-Of) fue eliminado: cada negocio debe ser dueño de su propia WABA (WhatsApp Business Account).

**La coexistencia** permite usar WhatsApp Business App + Cloud API en el mismo número, pero reduce el throughput a **5-20 MPS** (versus 80 MPS estándar), no sincroniza grupos, desactiva mensajes que desaparecen y listas de difusión, y requiere abrir la app cada 14 días. Está disponible globalmente excepto Nigeria y Sudáfrica.

De los 6 escenarios evaluados, **YCloud con coexistencia** ofrece el mejor balance para agencias que atienden clientes pequeños-medianos que necesitan mantener el celular. **Chatwoot + API directa sin coexistencia** es ideal para agencias técnicas que buscan máximo control y margen. **ManyChat + n8n** destaca para funnels de marketing multicanal (Instagram + WhatsApp) pero tiene restricciones geográficas severas en coexistencia y costos escalables.

---

## Tabla comparativa general de los 6 escenarios

| Dimensión | 1. YCloud API | 2. YCloud Coex | 3. ManyChat+n8n Coex | 4. ManyChat+n8n API | 5. Meta API+Chatwoot | 6. Meta API+Chatwoot Coex |
|---|---|---|---|---|---|---|
| **Uso desde celular** | ❌ No | ✅ Sí | ⚠️ Beta, países limitados | ❌ No | ❌ No | ✅ Sí (v4.6+) |
| **Dificultad setup** | Baja | Baja | Alta | Media | Alta | Muy Alta |
| **Costo BSP mensual** | $0-89 | $0-89 | $15-99+ | $15-99+ | $0 (self-host) | $0 (self-host) |
| **Markup mensajes** | 0% | 0% | 0% (+fees ManyChat) | 0% (+fees ManyChat) | 0% | 0% |
| **Bandeja humana** | ✅ Incluida | ✅ Incluida | ✅ ManyChat Live Chat | ✅ ManyChat Live Chat | ✅ Chatwoot | ✅ Chatwoot |
| **IA/Bots** | ✅ AI Agent nativo | ✅ AI Agent nativo | ✅ AI Step + n8n | ✅ AI Step + n8n | ✅ via n8n/Captain AI | ✅ via n8n/Captain AI |
| **Integración n8n** | ✅ Oficial | ✅ Oficial | ✅ via webhooks | ✅ via webhooks | ✅ via webhooks | ✅ via webhooks |
| **Throughput** | 80 MPS | 5-20 MPS | 20 MPS | 80 MPS | 80 MPS | 5-20 MPS |
| **Control de datos** | Medio (SaaS) | Medio (SaaS) | Bajo (SaaS) | Bajo (SaaS) | Alto (self-host) | Alto (self-host) |
| **Riesgo operativo** | Bajo | Medio | Alto | Medio | Medio-Alto | Muy Alto |
| **Ideal para** | Mediano sin celular | Pequeño con celular | Marketing multicanal | Marketing sin celular | Agencia técnica | Agencia técnica+celular |

---

## Análisis profundo: Escenario 1 — YCloud usando simplemente la API

### Explicación general del modelo

En este escenario, YCloud actúa como **BSP (Business Solution Provider) certificado por Meta** que proporciona acceso a la Cloud API. El número de teléfono se registra exclusivamente en la API, desvinculándose completamente de la WhatsApp Business App. Meta proporciona la infraestructura de mensajería, YCloud proporciona la capa de software (bandeja de entrada, bots, campañas, webhooks), y el negocio es dueño de su propia WABA.

**El flujo técnico es:** Usuario envía mensaje → Meta Cloud API → Webhook a YCloud → YCloud procesa (bot/bandeja/automatización) → YCloud envía respuesta vía Cloud API → Meta entrega al usuario. Si se integra n8n, YCloud redirige webhooks a n8n para procesamiento adicional.

Este escenario es **100% viable y es el modelo estándar** de la industria desde 2022. No tiene limitaciones importantes más allá de perder el acceso desde el celular.

### Ventajas

**Máximo rendimiento técnico** con **80 MPS** de throughput, escalable hasta 1,000 MPS. Sin limitaciones de funcionalidad: todas las features de la Cloud API están disponibles, incluyendo Marketing Messages Lite API. YCloud cobra **cero markup** sobre las tarifas de Meta, lo que significa que el costo de mensajería es exactamente el oficial. El plan gratuito permanente incluye 1 usuario, 2 canales y API completa con webhooks ilimitados.

La **bandeja de entrada compartida** incluye asignación de agentes, notas internas, respuestas predeterminadas, traducción automática en 45+ idiomas y app móvil para agentes. El AI Agent nativo tiene constructor visual de flujos, base de conocimiento y reconocimiento de intención. La integración con n8n está **documentada oficialmente** por YCloud, con guías paso a paso.

Para agencias, permite gestionar **múltiples WABA bajo una sola cuenta** ($5/canal adicional). El Embedded Signup facilita el onboarding de clientes en minutos. Al ser SaaS, no requiere infraestructura propia ni mantenimiento técnico.

### Desventajas

**El cliente pierde completamente el acceso desde el celular.** Una vez registrado el número en la API, la WhatsApp Business App deja de funcionar con ese número. Todo el historial de chat previo se pierde. El dueño del negocio o la secretaria ya no pueden ver ni responder mensajes desde el teléfono — deben usar exclusivamente la bandeja de YCloud (web o app móvil de YCloud).

Existe dependencia del uptime de YCloud como intermediario. El soporte está limitado a horarios de Singapur (9:30-18:30 UTC+8) excepto en plan Enterprise. Algunos usuarios reportan problemas con el sistema antifraude que bloquea cuentas tras recargas de wallet. El almacenamiento de datos se limita a 6 meses en planes no-Enterprise.

### Manejo desde celular

**No es posible.** El cliente no puede usar WhatsApp Business App ni WhatsApp personal con ese número. La única forma de interactuar desde un dispositivo móvil es a través de la app móvil de YCloud (que funciona como bandeja de agente, no como WhatsApp). El dueño del negocio pierde la experiencia nativa de WhatsApp. Esto es un dealbreaker para muchos clientes pequeños en LATAM que están acostumbrados a manejar todo desde el celular.

### Qué debe hacer el cliente dentro de Meta

**Preparación previa:** Cuenta de Facebook activa (mínimo 1 mes de antigüedad), documentación legal del negocio (CUIT en Argentina, registro comercial), sitio web con HTTPS que muestre nombre del negocio, email corporativo que coincida con el dominio del sitio web.

**Paso a paso:**
1. Acceder a business.facebook.com y crear o verificar un Business Portfolio (antes Business Manager)
2. Tener rol de administrador en el Business Portfolio
3. Durante el Embedded Signup de YCloud, autorizar la conexión con Facebook
4. Seleccionar o crear el Business Portfolio dentro del flujo
5. Ingresar datos del negocio (nombre exacto según documentos legales, email corporativo, sitio web, dirección, país)
6. Agregar número de teléfono y verificar con código OTP (SMS o llamada)
7. Esperar aprobación del Display Name por Meta (horas a días)

**La verificación de negocio no es obligatoria** para comenzar (se arranca con límite de 250 mensajes/día), pero es necesaria para escalar. Se inicia desde Business Settings → Verificación. Requiere subir documentos y esperar 1-14 días hábiles.

**¿Qué parte hace la agencia?** En la práctica, la agencia guía al cliente por videollamada en el Embedded Signup, o el cliente otorga acceso de administrador al Business Portfolio para que la agencia haga todo. La agencia NO debe crear el Business Portfolio desde su propia cuenta — debe ser propiedad del cliente.

### Paso a paso operacional completo para agencia

**Fase comercial:** Vender como "automatización de WhatsApp con bandeja de agentes y bots inteligentes". Preguntar al cliente: ¿Cuántas conversaciones manejas por día? ¿Quiénes atienden? ¿Necesitas seguir usando el celular? (si dice sí → no es este escenario, pasar al escenario 2). ¿Tienes número exclusivo para el negocio o usas tu personal? ¿Tienes página de Facebook? ¿Sitio web? Detectar si tiene Business Manager ya creado. Pedir: número de teléfono a usar, acceso de admin a Business Portfolio, logo y datos del negocio.

**Fase de onboarding:** Verificar que el número NO esté registrado en otro BSP o WABA (consultar en WhatsApp Manager de Meta). Si el número tenía WhatsApp Business App, el cliente debe eliminar la cuenta de WhatsApp antes de registrar en API. Verificar que el Business Portfolio está en buen estado (sin restricciones). Asegurar que el sitio web tiene HTTPS y muestra el nombre del negocio. Preparar email corporativo que coincida con el dominio.

**Fase técnica:** Crear cuenta en YCloud. Ejecutar Embedded Signup con credenciales del cliente. Registrar número. Configurar webhook de YCloud apuntando a n8n (si aplica). Crear plantillas de mensaje y enviar a aprobación de Meta. Configurar bot/flujos en YCloud o en n8n. Configurar bandeja con agentes del cliente. Hacer pruebas de envío/recepción. Verificar que los webhooks lleguen correctamente. Probar handoff bot→humano.

**Fase de entrega:** Probar envío de plantillas aprobadas. Probar recepción de mensajes entrantes. Probar derivación a humano. Documentar accesos (YCloud, Meta Business). Capacitar al cliente en uso de bandeja y respuestas. Advertir sobre ventana de 24 horas, calidad del número y reglas de plantillas. Definir qué hace la agencia (configuración, bots, plantillas) vs qué hace el cliente (responder en bandeja, escalar temas).

---

## Análisis profundo: Escenario 2 — YCloud con coexistencia

### Explicación general del modelo

Idéntico al Escenario 1 en arquitectura, pero usando el **modo coexistencia** de Meta. El número permanece activo tanto en la WhatsApp Business App del celular como en la Cloud API a través de YCloud. El sistema **Messaging Echoes** sincroniza mensajes entre ambas plataformas en tiempo real. Los mensajes enviados desde la app aparecen en la bandeja de YCloud y viceversa.

**El flujo técnico tiene dos caminos simultáneos:** (1) Mensajes entrantes llegan a Meta → se replican tanto a la WhatsApp Business App como a YCloud vía API. (2) Mensajes salientes pueden originarse desde la app (gratis) o desde YCloud/API (con cargo según categoría). Ambos lados ven el historial unificado.

Este escenario es **viable desde mayo 2025** y es la opción más recomendada para clientes que necesitan mantener el control manual desde el celular.

### Ventajas

**El cliente mantiene su celular funcionando normalmente.** El dueño del negocio o la secretaria puede seguir respondiendo desde WhatsApp Business App como siempre, mientras los bots y automatizaciones operan en paralelo vía API. Las respuestas desde la app son **completamente gratuitas** (no generan cargo de API). Se sincronizan hasta **6 meses de historial** y todos los contactos durante el setup.

El onboarding es extraordinariamente rápido: **5 minutos** para conectar (escaneo de QR desde la app), 4-6 horas para sincronizar historial. No requiere eliminar la cuenta de WhatsApp existente. No se pierde historial de chat. El número no necesita ser "virgen".

Todas las ventajas de YCloud del Escenario 1 aplican: cero markup, bandeja compartida, AI Agent, integración oficial con n8n, gestión de plantillas y campañas.

### Desventajas

**Throughput reducido a 5 MPS** según documentación de YCloud (otras fuentes citan 20 MPS). Esto limita las campañas masivas: enviar 10,000 mensajes tomaría entre 8 y 33 minutos versus 2 minutos en modo API puro. Las **listas de difusión** de la app se vuelven solo lectura (debe usar la API para envíos masivos). Los **grupos de WhatsApp** no se sincronizan con la API. Los **mensajes que desaparecen** y **medios de ver-una-vez** no funcionan. La **insignia azul** no se transfiere entre app y API.

Se debe **abrir la app al menos cada 14 días** o la conexión se pierde. Los **dispositivos companion** (WhatsApp para Windows y WearOS) no sincronizan con la API. No es compatible con **Marketing Messages Lite API**. Si el número estuvo previamente en API y se desconectó, se debe esperar **1-2 meses** antes de activar coexistencia.

### Manejo desde celular

**Completamente funcional.** El cliente puede:
- Abrir WhatsApp Business App y ver todas las conversaciones
- Responder manualmente a cualquier chat (respuestas gratuitas)
- Ver mensajes enviados por el bot/API
- Usar Status/Estados de WhatsApp
- Hacer y recibir llamadas de voz y video
- Usar la cámara y funciones nativas de la app
- Intervenir cuando el bot no sabe qué hacer (el agente humano puede tomar el chat desde la app o desde la bandeja de YCloud)

**Lo que NO puede hacer desde el celular:** Enviar plantillas de marketing masivas (solo vía API), usar listas de difusión (son read-only), ver analíticas de campañas, gestionar configuración del bot. El celular funciona como un canal de atención manual complementario al sistema automatizado.

### Qué debe hacer el cliente dentro de Meta

El proceso es **más simple** que el Escenario 1 porque no requiere eliminar la cuenta de WhatsApp existente.

**Preparación:** WhatsApp Business App actualizada a versión **2.24.17 o superior**. Cuenta de Facebook activa. Business Portfolio creado o existente. El número debe haber usado la WhatsApp Business App activamente al menos 7 días.

**Paso a paso:**
1. Actualizar WhatsApp Business App a la última versión
2. Abrir YCloud → seleccionar "WhatsApp Business App Coexistence"
3. Iniciar sesión con Facebook (admin del Business Portfolio)
4. Ingresar el número de teléfono con código de país
5. Escanear código QR desde WhatsApp Business App → Dispositivos vinculados
6. Autorizar sincronización de historial (opcional pero recomendado)
7. Esperar 4-6 horas para sincronización completa

**¿Qué parte hace la agencia?** La agencia puede guiar al cliente por videollamada (toma 5 minutos). El cliente solo necesita tener el celular en mano para escanear el QR. La agencia se encarga de toda la configuración posterior en YCloud (bots, bandeja, plantillas, webhooks, n8n).

### Paso a paso operacional completo para agencia

**Fase comercial:** Vender como "automatización inteligente sin perder tu WhatsApp". Este es el pitch ideal para clientes pequeños y medianos en LATAM. Preguntas clave: ¿Usas WhatsApp Business App actualmente? (debe ser sí). ¿Hace cuánto? (mínimo 7 días). ¿Estás en un país soportado? (Argentina sí). ¿Tu número estuvo alguna vez conectado a una API de WhatsApp? (si sí, esperar 1-2 meses).

**Señales de que conviene coexistencia:** El dueño atiende personalmente, la secretaria usa el celular todo el día, el cliente dice "no quiero perder mi WhatsApp", el negocio tiene pocos empleados, no necesita campañas masivas de miles de mensajes por minuto.

**Fase de onboarding:** Verificar versión de WhatsApp Business App (≥2.24.17). Verificar que el número no estuvo en API recientemente. Verificar que el Business Portfolio existe y tiene admin. Pedir al cliente que tenga el celular cargado y con conexión estable para el escaneo de QR.

**Fase técnica:** Crear cuenta YCloud. Ejecutar flujo de coexistencia (5 min). Esperar sincronización (4-6h). Configurar webhooks hacia n8n. Crear y aprobar plantillas. Configurar bot/flujos. Configurar bandeja con agentes. Probar envío desde API y verificar que aparece en la app del celular. Probar envío desde la app del celular y verificar que aparece en la bandeja de YCloud. Probar el flujo completo bot→humano.

**Fase de entrega:** Verificar doble sincronización (app↔API). Advertir al cliente que debe abrir la app cada 14 días. Explicar que las listas de difusión ya no funcionan desde la app. Capacitar en el uso de la bandeja de YCloud para cuando no esté en el celular. Documentar el proceso de reconexión si la coexistencia se desconecta.

---

## Análisis profundo: Escenario 3 — ManyChat + n8n con coexistencia

### Explicación general del modelo

ManyChat actúa como **plataforma de automatización visual** (no es BSP, usa Cloud API como capa). n8n funciona como **motor de automatización backend** conectado vía webhooks. El modo coexistencia permite mantener la WhatsApp Business App activa. ManyChat maneja los flujos conversacionales, la bandeja de chat humano y las campañas. n8n procesa lógica compleja: consultas a CRM, IA conversacional avanzada, integraciones con bases de datos, Google Sheets, APIs externas.

**Flujo técnico:** Mensaje entrante → Meta Cloud API → ManyChat → Si flujo simple: ManyChat responde directamente. Si lógica compleja: ManyChat envía External Request a n8n → n8n procesa (IA, CRM, etc.) → n8n responde a ManyChat vía API → ManyChat envía respuesta al usuario. Paralelamente, el mensaje aparece en la WhatsApp Business App del celular.

### Viabilidad real: LIMITADA

**La coexistencia en ManyChat está en BETA** y tiene **restricciones geográficas severas**. No está disponible en: Unión Europea, Reino Unido, India, Japón, Nigeria, Corea del Sur, Rusia, Sudáfrica, Filipinas, Australia, Turquía. **Para Argentina y la mayoría de LATAM, sí está disponible**, pero al ser beta puede tener inestabilidad.

### Ventajas

**El flow builder visual de ManyChat es el mejor del mercado** para usuarios no técnicos. Permite crear automatizaciones sofisticadas con drag-and-drop sin escribir código. La combinación con n8n desbloquea **automatización ilimitada**: IA conversacional con OpenAI/Anthropic, integración con cualquier CRM, workflows complejos multi-paso, consultas a bases de datos.

ManyChat es **el líder en automatización multicanal Instagram + WhatsApp + Messenger**, lo que lo hace ideal para agencias que trabajan funnels de marketing digital. Los AI Steps permiten respuestas inteligentes dentro de los flujos. El Live Chat inbox permite handoff a humanos.

Con coexistencia, el cliente mantiene su celular operativo y las respuestas desde la app son gratuitas.

### Desventajas

**La coexistencia está en beta:** La estabilidad no está garantizada. Puede haber bugs, desconexiones, o que Meta retire la funcionalidad para ciertos países. El historial previo de la Business App **no se transfiere** a ManyChat (solo se pueden importar contactos de los últimos 1, 90 o 180 días). La edición y revocación de mensajes se deshabilita en la Business App.

**Costos escalables:** ManyChat cobra por contactos ($15/500 contactos, escalando rápidamente) MÁS los fees de WhatsApp de Meta. AI add-on cuesta $29/mes extra. Inbox Pro $99/mes extra. Un cliente con 5,000 contactos y todas las features puede pagar **$200+/mes solo en ManyChat** antes de sumar los costos de Meta y n8n.

**Cada cliente necesita una cuenta ManyChat separada** — no hay dashboard unificado multi-cliente. No hay white-labeling. La agencia no puede usar su propio Business Manager; debe usar el del cliente. El External Request (necesario para n8n) **solo está disponible en plan Pro** (no en free ni trial).

**Problemas técnicos reportados con n8n:** La integración funciona en modo test pero falla con triggers reales. Problemas de formato con saltos de línea (`\n`). Sin nodo nativo de ManyChat en n8n — todo vía HTTP Request.

### Manejo desde celular

**Funcional pero con limitaciones beta.** El cliente puede responder desde la app, pero la sincronización entre ManyChat y la app puede no ser perfecta. Los mensajes del bot de ManyChat aparecen en la app. Las respuestas desde la app se ven en ManyChat (vía Messaging Echoes). Existe la app móvil de ManyChat como alternativa para que agentes respondan desde el teléfono (diferente de la app nativa de WhatsApp).

**Ventanas de 24 horas separadas:** Una conversación abierta en la Business App puede no estar abierta en ManyChat y viceversa. Esto puede generar confusión operativa.

### Qué debe hacer el cliente dentro de Meta

Igual que los escenarios anteriores: Business Portfolio, Facebook activo, verificación eventual. ManyChat exige usar **el Business Manager del cliente** (no el de la agencia — las solicitudes se rechazan si se usa la cuenta de la agencia).

**Adicional para coexistencia:** WhatsApp Business App versión 2.24.5+, actividad previa en la app según requerimientos de Meta, estar en un país soportado.

### Paso a paso operacional para agencia

**Fase comercial:** Vender como "sistema de automatización inteligente con Instagram + WhatsApp + IA". Ideal para negocios que ya usan Instagram y quieren capturar leads vía DM→WhatsApp. Preguntar: ¿Usas Instagram para tu negocio? ¿Necesitas capturar leads de redes sociales? ¿Cuántos contactos tienes? (crucial para estimar costos). ¿Tu país soporta coexistencia en ManyChat? (verificar lista).

**Fase técnica:** Crear cuenta ManyChat Pro. Conectar WhatsApp vía Embedded Signup con opción coexistencia. Configurar flujos en ManyChat. Crear webhook en n8n para recibir External Requests de ManyChat. Configurar la lógica de IA/CRM en n8n. Configurar el callback de n8n hacia la API de ManyChat. Probar flujo completo. Configurar Live Chat para handoff. Cargar wallet de ManyChat para fees de WhatsApp.

**Riesgos a comunicar al cliente:** La coexistencia es beta y puede cambiar. Los costos pueden escalar con la cantidad de contactos. La integración ManyChat↔n8n requiere mantenimiento técnico continuo.

---

## Análisis profundo: Escenario 4 — ManyChat + n8n sin coexistencia

### Explicación general del modelo

Igual que el Escenario 3, pero sin coexistencia. El número se **transfiere completamente** a ManyChat y la WhatsApp Business App deja de funcionar. Es el modo estándar y más estable de ManyChat para WhatsApp. Throughput completo de **80 MPS**.

### Ventajas respecto al Escenario 3

**Mayor estabilidad** (sin los riesgos beta de coexistencia). **Throughput completo** de 80 MPS para campañas masivas. Compatibilidad con **Marketing Messages Lite API**. Sin la complejidad de sincronización dual. Sin el riesgo de desconexión por no abrir la app cada 14 días.

Todas las ventajas de ManyChat aplican: flow builder visual, AI Steps, multicanal Instagram+WhatsApp+Messenger, Live Chat, External Request→n8n.

### Desventajas

**El cliente pierde completamente el celular.** Todo el historial de chat previo se pierde irreversiblemente. Las listas de contactos, difusión, mensajes de voz, llamadas y grupos se pierden. El cliente solo puede interactuar vía la bandeja de ManyChat (web o app ManyChat).

Los mismos problemas de costos escalables, cuentas separadas por cliente y falta de white-labeling del Escenario 3 aplican. La dependencia de ManyChat como plataforma es total — si ManyChat tiene un outage o cambia sus políticas, no hay forma de operar.

### Manejo desde celular

**No es posible con WhatsApp.** El cliente puede usar la **app móvil de ManyChat** para responder desde el teléfono, pero es una experiencia diferente a WhatsApp: interfaz diferente, notificaciones diferentes, y el cliente debe aprender una herramienta nueva. Para el dueño de un negocio pequeño acostumbrado a WhatsApp, esto representa una curva de aprendizaje significativa.

### Cuándo elegir este escenario sobre el 3

Cuando el cliente no necesita usar el celular para WhatsApp. Cuando se necesitan campañas masivas de alto volumen. Cuando se quiere máxima estabilidad sin riesgos de beta. Cuando el foco principal es marketing digital multicanal y no atención manual.

---

## Análisis profundo: Escenario 5 — API oficial de Meta + Chatwoot (sin coexistencia)

### Explicación general del modelo

La Cloud API de Meta se conecta **directamente** a Chatwoot como bandeja de agentes, **sin BSP intermediario**. Chatwoot (open-source, licencia MIT) se puede auto-hostear o usar en la nube. n8n se conecta vía webhooks de Chatwoot para automatización avanzada. No hay ningún intermediario entre el negocio y Meta.

**Flujo técnico:** Mensaje entrante → Meta Cloud API → Webhook directo a Chatwoot → Chatwoot muestra en bandeja. Si hay bot: Chatwoot envía webhook a n8n → n8n procesa → n8n responde vía API de Chatwoot → Chatwoot envía vía Cloud API → Meta entrega al usuario. El número se registra directamente en Meta Developer Portal.

**Roles:** Meta = infraestructura de mensajería y cobro. Chatwoot = bandeja de agentes, gestión de conversaciones, contact management. n8n = automatización, IA, integraciones. No hay BSP — la agencia se conecta directamente a la Graph API de Meta.

### Ventajas

**Cero costos de BSP.** Solo se pagan las tarifas de Meta por mensaje y la infraestructura de hosting. Un servidor VPS de **$10-50/mes** puede correr Chatwoot y n8n para múltiples clientes. El margen para la agencia es **máximo** porque no hay intermediarios cobrando subscripción ni markup.

**Control total de datos.** Con self-hosting, todos los datos de conversaciones, contactos y automatizaciones están en el servidor de la agencia. Cumplimiento total con regulaciones de privacidad. Sin limitaciones de retención de datos (a diferencia de SaaS con límites de 30 días a 3 años).

**Chatwoot como bandeja multi-canal** unifica WhatsApp, email, live chat web, Facebook Messenger, Instagram, Telegram, Twitter y más en una sola interfaz. Soporte para múltiples inboxes (múltiples números de WhatsApp para diferentes clientes). Asignación automática de agentes con round-robin. Automation rules, macros, canned responses, labels, equipos.

**La Agent Bot API de Chatwoot** permite un patrón elegante de handoff: las conversaciones nuevas entran en estado "pending" (atendidas por bot), y cuando requieren intervención humana, se cambian a "open" (un agente las toma). El agente puede devolver al bot cambiando a "pending".

**Integración profunda con n8n** via webhooks nativos de Chatwoot más nodos comunitarios disponibles en npm. Templates pre-construidos en n8n.io para Chatwoot + WhatsApp + IA.

### Desventajas

**La complejidad técnica es significativamente mayor.** El setup manual requiere: crear App en Meta Developer Portal, crear System User, generar tokens permanentes con permisos específicos (`whatsapp_business_manage_events`, `whatsapp_business_management`, `whatsapp_business_messaging`), configurar webhooks manualmente, gestionar SSL/TLS, y mantener la infraestructura.

**Chatwoot tiene bugs documentados con WhatsApp.** Problemas reportados incluyen: mensajes de plantilla con headers de imagen que fallan silenciosamente, encuestas CSAT enviadas fuera de la ventana de 24 horas, mensajes entrantes perdidos o con retraso de 2-5 horas, token de acceso que expira requiriendo reautorización, nombres de contacto no resueltos en plantillas.

**Requiere conocimientos de DevOps** para self-hosting: Linux, Docker, PostgreSQL, Redis, nginx, SSL, backups, monitoreo, actualizaciones. Si Chatwoot se cae o el servidor tiene problemas, la agencia es responsable al 100%.

**No hay soporte comercial** en la edición Community (solo foros). Los planes de soporte premium cuestan $19-99/agente/mes, lo que reduce la ventaja de costos.

**Las plantillas de WhatsApp deben crearse en el Business Manager de Meta** (no se pueden crear desde Chatwoot). El manejo de la ventana de 24 horas tiene bugs conocidos.

### Manejo desde celular

**No es posible.** Al registrar el número directamente en la Cloud API sin coexistencia, la WhatsApp Business App queda deshabilitada. El cliente solo puede interactuar vía Chatwoot web o la app móvil de Chatwoot (si está disponible). La experiencia móvil de Chatwoot no se compara con la nativa de WhatsApp.

### Qué debe hacer el cliente dentro de Meta

Este escenario es el que **más requiere del lado de Meta:**

1. Crear cuenta en developers.facebook.com
2. Crear una App tipo "Business"
3. Agregar el producto "WhatsApp" a la App
4. Ir a business.facebook.com → crear Business Portfolio
5. Crear System User con rol Admin
6. Asignar la App al System User con Full Control
7. Generar token permanente con los 3 permisos de WhatsApp
8. Agregar y verificar número de teléfono
9. Configurar webhook callback URL apuntando a Chatwoot
10. Suscribirse al campo "messages" del webhook
11. Completar verificación de negocio (para escalar límites)

**En la práctica, el 90% de esto lo hace la agencia.** El cliente solo necesita dar acceso de admin al Business Portfolio y tener el número disponible para verificación OTP.

**Alternativa simplificada:** Chatwoot soporta **Embedded Signup** (requiere configuración adicional en self-hosted con variables de entorno `WHATSAPP_APP_ID`, `WHATSAPP_CONFIGURATION_ID`, `WHATSAPP_APP_SECRET`), lo cual automatiza varios de estos pasos.

### Paso a paso operacional para agencia

**Fase comercial:** Vender como "plataforma de atención al cliente con IA, datos propios y sin costos de licencia mensuales". Ideal para agencias que quieren máximo margen y control. Detectar si el cliente tiene equipo técnico mínimo o si la agencia absorberá todo el soporte técnico.

**Fase técnica:** Levantar servidor (VPS, Docker). Instalar Chatwoot + PostgreSQL + Redis + Sidekiq. Configurar dominio y SSL. Crear App en Meta Developer Portal. Configurar credenciales. Registrar número. Configurar webhook en Meta apuntando a Chatwoot. Instalar n8n (mismo servidor o separado). Configurar webhooks de Chatwoot hacia n8n. Crear flujos de bot en n8n. Configurar Agent Bot en Chatwoot. Crear plantillas en Meta Business Manager. Probar envío y recepción. Probar handoff bot→humano. Configurar backups automáticos.

**Fase de entrega:** Documentar infraestructura, accesos, procesos de backup y restauración. Establecer monitoreo de uptime. Definir SLA de mantenimiento. Capacitar al equipo del cliente en Chatwoot. Advertir sobre la necesidad de mantener el servidor actualizado.

---

## Análisis profundo: Escenario 6 — API oficial de Meta + Chatwoot con coexistencia

### Explicación general del modelo

Combina la arquitectura del Escenario 5 (API directa + Chatwoot) con el modo coexistencia de Meta. El número permanece activo en WhatsApp Business App y simultáneamente conectado a Chatwoot vía Cloud API. Es el escenario técnicamente **más complejo** de los 6.

Chatwoot incorporó soporte de coexistencia en su **roadmap v4.6.0** (GitHub Issue #11700), basándose en la funcionalidad de Embedded Signup para usuarios de Business App existentes.

### Ventajas

Combina las **tres fortalezas principales**: control total de datos (self-hosting), cero costos de BSP, y el cliente mantiene su celular. El agente humano puede responder tanto desde la app como desde Chatwoot. El bot de n8n opera vía Chatwoot mientras el dueño del negocio sigue usando su teléfono normalmente.

Para agencias técnicamente fuertes, ofrece el **máximo margen de ganancia** con la máxima funcionalidad: automatización avanzada con IA, bandeja multi-agente, historial completo, y el cliente feliz porque no pierde su celular.

### Desventajas

**Este es el escenario de mayor riesgo operativo.** Se ha documentado un **bug Severidad 1** en Chatwoot (GitHub Issue #12469, septiembre 2025) donde la sincronización de coexistencia "destruyó" el negocio de un usuario: la WhatsApp Business App dejó de funcionar completamente durante la sincronización. Cita textual: *"Esto ha destruido mi negocio porque nuestras ventas son exclusivamente a través de WhatsApp."*

Otros problemas documentados incluyen: inbox de Chatwoot mostrando "desconectado" a pesar de que el número aparece conectado en WhatsApp Manager (por webhooks faltantes), mensajes entrantes perdidos o retrasados 2-5 horas en instalaciones self-hosted, problemas de estabilidad de conexión en modo coexistencia.

**La complejidad de setup es la más alta** de todos los escenarios: requiere self-hosting de Chatwoot, configuración de Embedded Signup con variables de entorno especiales, gestión de tokens de Meta, webhook manual, ADEMÁS de toda la configuración de coexistencia (QR, sincronización). Si algo falla, hay múltiples puntos de falla posibles y la depuración es compleja.

**El throughput está limitado a 5-20 MPS** por la coexistencia. Los mismos bugs de Chatwoot con WhatsApp del Escenario 5 aplican, amplificados por la complejidad adicional de la sincronización dual.

### Manejo desde celular

**Funcional con riesgos.** Cuando funciona bien, el cliente puede responder desde la app y los mensajes se sincronizan con Chatwoot. Pero los bugs documentados de sincronización hacen que este sea el escenario menos confiable para el uso móvil.

### Recomendación sobre este escenario

**Usar con extrema precaución.** Solo recomendable para agencias con fuerte capacidad técnica de DevOps que puedan diagnosticar y resolver problemas rápidamente. Para la mayoría de agencias, si necesitan coexistencia + Chatwoot, es más seguro esperar a que Chatwoot estabilice esta funcionalidad (verificar releases posteriores a v4.6.0) o usar un BSP comercial como YCloud con Chatwoot solo como bandeja secundaria.

---

## Comparación de complejidad por escenario

| Métrica | 1. YCloud API | 2. YCloud Coex | 3. ManyChat+n8n Coex | 4. ManyChat+n8n API | 5. Chatwoot API | 6. Chatwoot Coex |
|---|---|---|---|---|---|---|
| Dificultad implementación | Baja | Baja | Alta | Media | Alta | Muy Alta |
| Dificultad mantenimiento | Muy Baja | Baja | Media | Media | Alta | Muy Alta |
| Riesgo operativo | Bajo | Medio | Alto | Medio | Medio | Muy Alto |
| Dependencia de Meta | Media | Media | Media | Media | Alta | Alta |
| Dependencia terceros | Media (YCloud) | Media (YCloud) | Alta (ManyChat) | Alta (ManyChat) | Baja | Baja |
| Curva aprendizaje | Baja | Baja | Media | Media | Alta | Muy Alta |
| Facilidad soporte agencia | Alta | Alta | Media | Media | Baja | Muy Baja |
| Facilidad uso cliente | Alta | Muy Alta | Media | Baja | Media | Media |

---

## Comparación de costos estimados (USD/mes por cliente)

| Componente | 1. YCloud API | 2. YCloud Coex | 3. ManyChat+n8n Coex | 4. ManyChat+n8n API | 5. Chatwoot API | 6. Chatwoot Coex |
|---|---|---|---|---|---|---|
| Plataforma/BSP | $0-89 | $0-89 | $15-128+ | $15-128+ | $0-20 (hosting) | $0-20 (hosting) |
| n8n (si aplica) | $0-50 | $0-50 | $0-50 | $0-50 | $0-50 | $0-50 |
| Meta mensajes (500 conv) | ~$10 | ~$10 | ~$10 | ~$10 | ~$10 | ~$10 |
| **Total mensual mínimo** | **$10** | **$10** | **$25** | **$25** | **$10** | **$10** |
| **Total mensual típico** | **$50-100** | **$50-100** | **$100-250** | **$100-250** | **$30-80** | **$30-80** |
| Margen agencia (cobrando $400) | 75-88% | 75-88% | 38-75% | 38-75% | 80-93% | 80-93% |
| Vendible a cliente pequeño | ✅ Sí | ✅ Sí | ⚠️ Caro | ⚠️ Caro | ⚠️ Complejo | ❌ Muy complejo |
| Vendible a cliente mediano | ✅ Sí | ✅ Sí | ✅ Sí | ✅ Sí | ✅ Sí (con soporte) | ⚠️ Arriesgado |

**Nota sobre margen:** Agencias en Argentina/LATAM típicamente cobran **$300-800/mes** por servicio de automatización de WhatsApp. Los escenarios con Chatwoot self-hosted ofrecen el mayor margen bruto, pero requieren mayor inversión de tiempo en mantenimiento (costo oculto de horas de DevOps).

---

## Compatibilidad con automatización avanzada

| Capacidad | 1. YCloud API | 2. YCloud Coex | 3. ManyChat+n8n Coex | 4. ManyChat+n8n API | 5. Chatwoot API | 6. Chatwoot Coex |
|---|---|---|---|---|---|---|
| IA conversacional | ✅ Bueno | ✅ Bueno | ✅ Excelente | ✅ Excelente | ✅ Excelente | ✅ Excelente |
| Flujos con n8n | ✅ Oficial | ✅ Oficial | ✅ Via webhooks | ✅ Via webhooks | ✅ Via webhooks | ✅ Via webhooks |
| Integración CRM | ✅ Bueno | ✅ Bueno | ✅ Bueno | ✅ Bueno | ✅ Excelente (control total) | ✅ Excelente |
| Derivación a humano | ✅ Nativo | ✅ Nativo | ✅ Live Chat | ✅ Live Chat | ✅ Agent Bot API | ✅ Agent Bot API |
| Multicanal WhatsApp+IG | ⚠️ Limitado | ⚠️ Limitado | ✅ Excelente | ✅ Excelente | ✅ Bueno | ✅ Bueno |
| Ecommerce (TiendaNube) | ⚠️ Via webhook | ⚠️ Via webhook | ⚠️ Via n8n | ⚠️ Via n8n | ✅ Via n8n (flexible) | ✅ Via n8n |
| Toma de turnos/reservas | ✅ Via Journey | ✅ Via Journey | ✅ Via n8n | ✅ Via n8n | ✅ Via n8n | ✅ Via n8n |
| Replicar múltiples clientes | ✅ Fácil ($5/canal) | ✅ Fácil | ❌ Cuentas separadas | ❌ Cuentas separadas | ✅ Multi-inbox | ✅ Multi-inbox |

**Para agencias que quieren replicar en múltiples clientes,** los escenarios con Chatwoot y YCloud son superiores. Chatwoot permite múltiples inboxes en una sola instalación. YCloud permite agregar canales a $5/mes. ManyChat requiere una cuenta completamente separada por cliente, lo que multiplica el trabajo administrativo.

---

## Riesgos reales y limitaciones que suenan bien en teoría pero fallan en práctica

### La coexistencia no es magia

En teoría, coexistencia significa "lo mejor de ambos mundos". En la práctica, **el throughput reducido a 5-20 MPS** hace que campañas masivas sean lentas. Los mensajes no siempre se sincronizan instantáneamente — puede haber retrasos de segundos a minutos. Si el usuario no abre la app en 14 días, la conexión se rompe silenciosamente y los mensajes del bot dejan de llegar al celular. Las listas de difusión quedan inutilizadas y los grupos no se sincronizan.

### Chatwoot self-hosted suena económico pero tiene costos ocultos

El software es gratis, pero el costo real es el **tiempo de ingeniería**. Actualizaciones que rompen integraciones, bugs de WhatsApp que requieren debugging en logs de Rails/Sidekiq, certificados SSL que expiran, PostgreSQL que necesita vacuum, Redis que se llena. Una agencia sin DevOps dedicado puede pasar más horas manteniendo Chatwoot que atendiendo clientes.

### ManyChat parece simple pero escala caro

Un cliente con 1,000 contactos paga $15/mes de ManyChat. Con 10,000 contactos, paga más de $100/mes. Sumando AI ($29), Inbox Pro ($99), y fees de WhatsApp de Meta, un cliente mediano puede costar **$300+/mes solo en software**, dejando casi nulo el margen para la agencia.

### La API directa de Meta sin BSP suena independiente pero es frágil

Sin BSP, no hay soporte intermedio. Si Meta rechaza plantillas, cambia webhooks, o modifica la API, la agencia debe resolver sola. Los tokens de acceso pueden expirar. Los webhooks pueden fallar silenciosamente. No hay dashboard para ver el estado de la cuenta — todo es vía API o el Developer Portal.

### Problemas cuando el número ya estuvo en otro sistema

Si un número estuvo registrado en la API con otro BSP, **debe ser desvinculado y esperar un período de enfriamiento** (días a semanas) antes de poder registrarlo en un nuevo proveedor. Si estuvo en API y se quiere activar coexistencia, se debe esperar **1-2 meses**. Si el cliente cambió de BSP recientemente, las credit lines de coexistencia no migran. Este es uno de los problemas más frecuentes en la práctica y genera fricciones significativas en el onboarding.

### La prohibición de chatbots de propósito general

Desde octubre 2025, Meta prohíbe bots conectados directamente a modelos como ChatGPT sin contexto de negocio específico. Los bots deben estar enfocados en procesos concretos (soporte, ventas, reservas) y **deben ofrecer escalación a agente humano**. Agencias que venden "tu asistente de IA que responde todo" corren riesgo de que Meta restrinja la cuenta.

---

## Tabla final de recomendación por tipo de cliente

| Tipo de cliente | Escenario recomendado | Alternativa | Evitar |
|---|---|---|---|
| **Pequeño, quiere seguir usando celular** | **2. YCloud Coexistencia** | 3. ManyChat Coex (si LATAM) | 5 y 6 (demasiado complejo) |
| **Pequeño, no necesita celular** | **1. YCloud API** | 4. ManyChat API (si multicanal) | 5 y 6 |
| **Mediano, automatización fuerte + celular** | **2. YCloud Coexistencia** + n8n | 6. Chatwoot Coex (si hay DevOps) | 3 (beta inestable) |
| **Mediano, automatización fuerte sin celular** | **5. Chatwoot + API directa** + n8n | 1. YCloud API | 4 (caro a escala) |
| **Agencia que quiere escalar múltiples clientes** | **5. Chatwoot + API directa** (multi-inbox) | 1. YCloud API ($5/canal) | 3 y 4 (cuentas separadas) |
| **Funnels de marketing IG→WhatsApp** | **4. ManyChat + n8n sin coex** | 3. ManyChat Coex (si viable) | 5 y 6 (sin flow builder visual) |
| **Máximo margen de agencia** | **5. Chatwoot + API directa** | 1. YCloud Free | 3 y 4 (ManyChat come margen) |
| **Mínima complejidad operativa** | **2. YCloud Coexistencia** | 1. YCloud API | 5 y 6 (requieren DevOps) |
| **Depender menos de terceros** | **5. Chatwoot + API directa** | 6. Chatwoot Coex | 1-4 (dependen de BSP/SaaS) |
| **Servicio híbrido bot + humano** | **2. YCloud Coex** (simplicidad) o **5. Chatwoot API** (control) | Ambos son buenos | 3 (beta + complejo) |

---

## Conclusión estratégica

La elección del escenario correcto depende de **tres variables fundamentales**: si el cliente necesita mantener el celular (coexistencia), el nivel técnico de la agencia (SaaS vs self-hosting), y si el negocio prioriza marketing multicanal o atención al cliente.

**Para la mayoría de agencias en Argentina/LATAM que recién empiezan**, el camino óptimo es comenzar con **YCloud con coexistencia** (Escenario 2). Ofrece la curva de aprendizaje más baja, setup en minutos, cero markup de mensajes, y mantiene feliz al cliente porque no pierde su celular. A medida que la agencia crece y desarrolla capacidad técnica, puede migrar clientes más grandes a **Chatwoot + API directa** (Escenario 5) para maximizar márgenes.

**ManyChat tiene sentido únicamente** cuando el core del negocio del cliente es marketing digital en Instagram + WhatsApp y necesita el flow builder visual para funnels complejos. Para atención al cliente pura o automatización con IA, ManyChat es innecesariamente caro y limitante.

**La coexistencia debe usarse** cuando el cliente es un negocio pequeño-mediano donde el dueño o un empleado clave atiende personalmente por WhatsApp y no quiere renunciar a eso. **Debe evitarse** cuando se necesitan campañas masivas de alto throughput, cuando el cliente está en un país no soportado, o cuando la estabilidad es crítica (aplicaciones médicas, financieras, logísticas con alto volumen).

**Evitar coexistencia con Chatwoot self-hosted** hasta que se estabilicen los bugs documentados. Los BSPs comerciales como YCloud tienen implementaciones de coexistencia más maduras y con soporte.

---

## Checklist operativo para agencia

**Antes de cerrar con cualquier cliente:**
- Confirmar si el número está actualmente en WhatsApp Business App, WhatsApp personal, o sin WhatsApp
- Verificar si el número estuvo alguna vez conectado a una API o BSP (preguntar directamente)
- Determinar si el cliente necesita seguir usando el celular (define si usar coexistencia)
- Verificar que el cliente tiene página de Facebook activa
- Verificar que el cliente tiene sitio web con HTTPS
- Preguntar si el cliente tiene Business Manager/Portfolio de Meta (y si tiene admin access)
- Estimar volumen mensual de conversaciones para calcular costos de Meta
- Definir si necesita multicanal (Instagram, Messenger) o solo WhatsApp

**Antes de empezar el setup técnico:**
- Obtener acceso de admin al Business Portfolio del cliente (nunca usar el de la agencia)
- Verificar que el email corporativo coincide con el dominio del sitio web
- Preparar documentación legal del negocio para verificación de Meta
- Si coexistencia: verificar versión de WhatsApp Business App (≥2.24.17) y que el número tiene 7+ días de actividad
- Si API sin coexistencia: advertir al cliente que perderá el acceso desde el celular y el historial
- Preparar plantillas de mensaje (bienvenida, seguimiento, utilidad) para enviar a aprobación de Meta

**Antes de entregar al cliente:**
- Probar envío y recepción de mensajes (entrantes y salientes)
- Probar envío de plantillas aprobadas fuera de la ventana de 24 horas
- Probar handoff de bot a humano y de humano a bot
- Si coexistencia: verificar sincronización celular ↔ plataforma (enviar desde app, verificar en bandeja, y viceversa)
- Documentar todos los accesos (Meta, BSP, Chatwoot, n8n, servidor)
- Capacitar al cliente en la bandeja de agentes
- Explicar reglas de ventana de 24 horas y de plantillas
- Explicar el sistema de calidad de Meta y cómo evitar restricciones
- Entregar documento con "qué puede hacer el cliente" vs "qué debe hacer la agencia"
- Configurar alertas de monitoreo (uptime del servidor si es self-hosted, webhooks activos, calidad del número)

---

## Errores comunes que toda agencia debe evitar

**Usar el Business Manager de la agencia en lugar del cliente.** Meta exige que el Business Portfolio sea propiedad del negocio que envía los mensajes. Usar la cuenta de la agencia puede causar rechazo durante el Embedded Signup o restricciones posteriores de la cuenta.

**No verificar el historial del número antes del onboarding.** Si el número estuvo conectado a otro BSP o API, puede haber un período de enfriamiento de semanas. Descubrir esto a mitad del setup genera retrasos y frustración del cliente.

**Prometer "respuestas ilimitadas con IA" sin mencionar las políticas de Meta.** Desde octubre 2025, Meta prohíbe chatbots de propósito general. Todo bot debe tener un contexto de negocio específico y ofrecer escalación a humano. Vender un "asistente IA que responde todo" sin estas restricciones puede terminar en la suspensión de la cuenta.

**No calcular correctamente los costos de Meta para el cliente.** En Argentina, un mensaje de marketing cuesta **USD 0.071**. Enviar 1,000 mensajes de marketing = USD 71. Si el cliente espera pagar $15/mes de ManyChat y la agencia no advierte sobre estos costos adicionales, habrá conflicto.

**Activar coexistencia sin verificar la versión de la app y la actividad del número.** Si la app no está actualizada o el número tiene menos de 7 días de uso, la activación fallará. Siempre verificar antes de agendar la sesión de setup.

**Ignorar la ventana de 14 días en coexistencia.** Si el cliente no abre WhatsApp Business App en 14 días, la conexión se pierde silenciosamente. Configurar un recordatorio automático para el cliente.

**No crear plantillas antes de necesitarlas.** Las plantillas requieren aprobación de Meta (horas a días). Si el bot necesita enviar un mensaje fuera de la ventana de 24 horas y no hay plantilla aprobada, no puede enviar nada. Tener siempre al menos 3-5 plantillas aprobadas de reserva.

**Subestimar el mantenimiento de Chatwoot self-hosted.** Las actualizaciones de Chatwoot pueden romper integraciones. PostgreSQL necesita mantenimiento. Los certificados SSL expiran. Sin un plan de mantenimiento proactivo, el sistema se degradará y fallará en el peor momento.

**No documentar el proceso de reconexión.** Cuando la coexistencia se desconecta, cuando un token expira, o cuando un webhook falla, el equipo debe saber exactamente qué hacer. Documentar cada procedimiento de recuperación y entrenarlo al equipo.

**Vender ManyChat a clientes con muchos contactos sin calcular el escalamiento.** ManyChat cobra por contacto: 500 contactos = $15/mes, pero 10,000 = $100+, y con los add-ons puede llegar a $300+/mes. Para clientes de alto volumen, YCloud o Chatwoot son mucho más económicos.