# Patrones de diseño en Dashboard, Reportes y Notificaciones para SaaS de turnos médicos

Los productos de agendamiento médico más exitosos del mundo comparten un patrón dominante: **el calendario es la pantalla principal**, no un dashboard separado. Sin embargo, los productos más sofisticados (DrChrono, Jane App, Zocdoc) están evolucionando hacia dashboards con KPIs superpuestos al calendario, integrando métricas de rendimiento directamente en la vista operativa diaria. Esta investigación analiza en profundidad los patrones de UI/UX de más de 20 productos —incluyendo competidores argentinos— para definir las mejores prácticas en cada área y cerrar con recomendaciones concretas para Turnera.

---

## 1. Dashboard y pantalla de inicio: el calendario manda, pero los KPIs ganan terreno

### El calendario como página principal es el estándar de la industria

La mayoría de los productos médicos aterrizan directamente en el calendario al iniciar sesión. **Acuity Scheduling, Cliniko, Jane App, Doctolib, AgendaPro, Setmore** y casi todos los competidores argentinos (Docturno, Medicline, Turnera.com.ar) usan el calendario como homepage. La lógica es clara: la secretaria necesita ver los turnos del día inmediatamente, sin clics adicionales.

Sin embargo, existen tres modelos diferenciados:

**Modelo 1 — Calendario puro como home (mayoría).** Acuity Scheduling muestra la vista semanal con bloques de turnos coloreados por tipo. Cliniko muestra el calendario con vistas de 1, 3, 5 o 7 días con múltiples profesionales lado a lado. Setmore abre en vista de agenda (lista cronológica) en móvil y calendario en escritorio. Los competidores argentinos (Docturno, Medicline, MiTurno) adoptan este modelo casi universalmente.

**Modelo 2 — Dashboard separado con KPIs (minoría sofisticada).** SimplyBook.me tiene un dashboard como primera pestaña con gráficos de rendimiento, estadísticas de reservas, conteo de visitantes y estado de suscripción; el calendario está en una pestaña separada. DrChrono ofrece un dashboard configurable como página de inicio (activable en Account Settings) con **widgets de turnos del día, tareas pendientes, mensajes sin leer, estado de claims de seguros, balance pendiente de pacientes y pagos a 30/60/90/120 días**. Se auto-refresca cada 3 minutos.

**Modelo 3 — Híbrido calendario + dashboard overlay (Jane App).** Jane App implementa el patrón más innovador: el "Day Sheet" (calendario) es la homepage, pero un toggle en la esquina superior derecha superpone un panel de métricas sobre la agenda. Este panel muestra **cantidad de pacientes (nuevos vs. recurrentes), total de visitas, porcentaje de utilización del profesional, total facturado, total cobrado, estado de notas clínicas (firmadas/borrador/sin iniciar) y top 10 pacientes por ingresos**. Las métricas financieras pueden habilitarse o deshabilitarse por usuario.

### KPIs y estadísticas que muestran los dashboards

Los KPIs varían significativamente según el nivel de sofisticación del producto. Los productos más básicos (Acuity, Setmore free) no muestran métricas en la home. Los más avanzados despliegan entre **4 y 8 métricas clave**:

**DrChrono** muestra la mayor densidad de información: turnos del día con seguimiento de estado, tareas pendientes editables in-line, mensajes sin leer, claims por estado (en progreso vs. por revisar), balance total pendiente de pacientes, planes de pago activos y morosos. **Zocdoc** muestra en su Performance Dashboard: total de reservas, turnos completados, gasto total, costo promedio por reserva, desglose por fuente de reserva (marketplace, Google, website, resultados patrocinados) con comparación contra período anterior. **Setmore** muestra en su dashboard semanal: ingreso confirmado, ingreso proyectado, total estimado y conteo de turnos de la semana. **AgendaPro** ofrece ingresos diarios en tiempo real desglosados por método de pago, reportes de comisiones y alertas de stock bajo de insumos.

### Cómo se muestran los turnos del día

Los patrones predominantes para visualizar "los turnos de hoy" son:

- **Vista de calendario día/semana con bloques coloreados** (Acuity, Cliniko, Doctolib, AgendaPro): Grilla temporal con bloques de color que representan cada turno, coloreados por tipo de servicio, profesional o estado.
- **Lista/agenda cronológica** (Setmore móvil, Calendly): Lista vertical ordenada por hora con información resumida de cada turno.
- **Day Sheet estructurado** (Jane App): Vista diaria tipo planilla con todos los profesionales y sus turnos, donde hacer clic abre directamente las notas clínicas.
- **Dashboard de turnos tipo tabla** (DrChrono): Tabla interactiva con estado editable inline, filtrable por estado/consultorio/fecha, con timeline expandible que muestra timestamps exactos de cada cambio de estado.

### Alertas y acciones rápidas en el dashboard

**DrChrono** tiene el sistema de alertas más completo: flags de paciente que aparecen como modales pop-up al abrir el turno o la ficha (requieren confirmación "OK" para cerrar, registran log de auditoría), alertas de turnos duplicados, íconos de candado en notas clínicas bloqueadas, y alertas de claims vencidos. **Cliniko** muestra alertas en tiempo real de llegadas, cancelaciones y confirmaciones, con notas de turno persistentes que aparecen como advertencias en cada turno del paciente. **SimplyBook.me** usa notificaciones color-coded en la barra superior: amarillo para novedades, rojo para mensajes, verde para notificaciones generales, más turnos pendientes de aprobación resaltados en el calendario.

Las acciones rápidas convergentes en todos los productos incluyen: **reservar turno nuevo** (clic en slot vacío), **cambiar estado inline** (confirmar, cancelar, marcar ausencia), **arrastrar y soltar para reprogramar**, **abrir ficha del paciente** desde el turno, y **enviar recordatorio**. Jane App permite iniciar teleconsulta con un botón "Begin" directamente desde el turno. Cliniko ofrece re-reserva en un clic desde la pantalla del turno.

---

## 2. Notificaciones y alertas: la industria está sorprendentemente subdesarrollada

### El icono de campana no existe en scheduling médico

Un hallazgo inesperado de esta investigación: **ninguno de los productos analizados usa el patrón clásico SaaS de ícono de campana con dropdown**. Esto representa una oportunidad clara de diferenciación. La mayoría de los productos dependen del email como canal principal de notificación al staff, relegando las notificaciones in-app a un rol secundario o inexistente.

**Zocdoc tiene el sistema in-app más sofisticado**: un Inbox dedicado con badge rojo que muestra el conteo de items pendientes, tags de colores por tipo ("New booking", "Cancellation", "Reschedule", "Intake submission"), filtros por categoría en sidebar izquierdo, y un workflow de confirmación donde los turnos mantienen el tag "New booking" hasta que el staff hace clic en "Confirm patient can be seen". Después de confirmar, el sistema muestra "You're all caught up!" como estado vacío. Zocdoc también tiene un "Alerter" — una aplicación de escritorio separada que muestra pop-ups del sistema operativo para nuevas reservas.

**Setmore ofrece un Activity Stream** — un feed en tiempo real de todas las acciones recientes (turnos nuevos, reprogramados, pagos, reembolsos, nuevos contactos) accesible como página dedicada en Settings > More > Activity. No es un dropdown flotante sino una página separada.

**Jane App usa un badge numérico** junto al nombre del usuario en la esquina superior derecha, que alerta sobre tareas vencidas o que vencen en las próximas 36 horas. Al hacer clic se despliega "My Tasks". También muestra bloques negros de "Wait List" cuando se cancela un turno, haciéndolo visualmente prominente.

### Canales de notificación al staff

El email domina como canal principal en todos los productos. Las notificaciones por email se activan ante: **nuevo turno** (siempre), **cancelación**, **reprogramación**, **recordatorios** y, menos frecuentemente, **resúmenes diarios/semanales** (Acuity, Cliniko, SimplyBook.me). Las push notifications móviles están disponibles en los productos con apps nativas (Calendly, Doctolib Pro, SimplyBook.me, Setmore, AgendaPro). **Notablemente, ningún producto usa Web Push API del navegador** — los que ofrecen alertas de escritorio lo hacen mediante apps nativas (Setmore desktop app, Zocdoc Alerter).

Un patrón interesante es el **delay de 3-5 minutos** que implementan Jane App y Cliniko antes de enviar notificaciones, evitando ruido por correcciones rápidas y consolidando múltiples cambios en un solo email.

### Comunicación de urgencia

**Zocdoc** tiene el modelo de urgencia más fuerte: badge rojo con conteo, tags persistentes hasta confirmar, presión temporal de confirmar en 2 horas (los que confirman rápido pueden aceptar turnos mismos-día en 1 hora en lugar de 2). **DrChrono** usa modales de alerta de paciente que bloquean la interfaz hasta reconocimiento. **AgendaPro** implementa doble confirmación por WhatsApp — si no hay respuesta al primer mensaje, envía un segundo automáticamente. **Cliniko** permite filtrar notificaciones por ventana temporal (ej: "solo notificar cambios en turnos de los próximos 5 días"), reduciendo ruido y priorizando lo inminente.

La industria tiene **un vacío significativo en alertas proactivas**: pocos productos resaltan automáticamente "turnos sin confirmar para mañana" o "pacientes con historial de ausencias". Esto es otra oportunidad de diferenciación para Turnera.

---

## 3. Gestión de recordatorios WhatsApp/SMS: el diferenciador del mercado argentino

### Estados de entrega de WhatsApp Business API

La API de WhatsApp Business (Cloud API, que usa YCloud) proporciona **5 estados via webhooks**: `sent` (un tick gris ✓ — aceptado por servidores de WhatsApp), `delivered` (doble tick gris ✓✓ — llegó al dispositivo), `read` (doble tick azul ✓✓ — el destinatario abrió el chat, solo si tiene confirmación de lectura activada), `failed` (error con código de motivo) y `deleted` (el destinatario borró el mensaje). Las transiciones son monotónicas: sent → delivered → read, y si se recibe `read` se puede inferir `delivered` aunque no haya llegado ese webhook explícitamente.

### Cómo los productos muestran el estado de recordatorios

**AgendaPro** tiene la implementación más completa entre los productos latinoamericanos: dentro de cada turno existe una pestaña "Recordatorios" que muestra una tabla con el tipo de recordatorio (WhatsApp/Email/SMS) y si fue enviado. La "Vista Resumen" muestra el total de recordatorios enviados en un período. En el menú principal hay una sección "Recordatorios" dedicada que muestra: créditos de WhatsApp contratados y restantes, fecha de vencimiento del pack, **ingresos confirmados vía recordatorios automáticos**, lista de clientes que NO recibieron recordatorio (para corrección de datos), y **porcentaje de turnos confirmados vs. total de mensajes enviados**.

**Confirmafy** usa 3 estados visuales claros directamente en el calendario: ⏳ "Hemos enviado el mensaje y estamos esperando respuesta" → ✅ "Tu cliente ha confirmado el turno" → ❌ "Tu cliente ha cancelado". Actualiza automáticamente Google Calendar según la respuesta.

**Docturno** (Buenos Aires) implementa un sistema color-coded en la agenda y afirma ser "la única agenda online en LATAM con integración oficial de WhatsApp, garantizando la entrega de cada notificación". Envía recordatorios a las 24h y 3h antes del turno.

**Medicline.com.ar** incluye tracking de apertura de emails y recordatorios WhatsApp con "entregabilidad del 100%", usando código de colores para estados de turnos visible a simple vista.

**Turnera.com.ar** muestra 3 estados por turno tras el recordatorio WhatsApp: paciente confirma directo desde WhatsApp → si cancela desde el mensaje, se libera el turno al instante → calendario se actualiza automáticamente.

### El centro de comunicaciones y su diseño

El patrón emergente para gestionar recordatorios se estructura en **tres niveles**:

**Nivel 1 — Por turno**: Dentro del detalle del turno, una pestaña o sección que muestra todos los mensajes enviados para ese turno específico con timestamp y estado. AgendaPro y Wati implementan esto.

**Nivel 2 — Por paciente**: Historial de comunicaciones a través de todos los turnos. GReminders crea "un trail de auditoría completo de todas las comunicaciones con el cliente, incluyendo cuándo se enviaron recordatorios, si fueron entregados, y si los clientes confirmaron, reprogramaron o cancelaron."

**Nivel 3 — Dashboard global**: Métricas agregadas (enviados, entregados, confirmados, fallidos) con filtros por período. AgendaPro es la mejor referencia con su sección "Recordatorios" en el menú principal. YCloud ofrece analytics de campaña con métricas de sent/delivered/read/clicked/replied, un Inbox con logs de conversación y tags, y análisis de datos a nivel de cuenta.

### Disparo manual de recordatorios

**Jane App** permite enviar notificaciones manualmente desde el perfil del paciente con un botón "Email" y la opción de agregar un mensaje personalizado. También mantiene una lista de "Phone Reminders Due" — pacientes que necesitan llamada telefónica, con botón para marcar "Llamado". **Confirmafy** ofrece una opción de "solo recordatorio" donde el usuario edita el mensaje, selecciona día/hora, y envía manualmente. **AgendaPro** permite ambos flujos: automático (24/48h antes) y manual, con validación inteligente — si el turno ya fue confirmado antes de que se ejecute el recordatorio automático, el WhatsApp NO se envía, ahorrando créditos.

### Respuestas de pacientes y botones interactivos

El patrón estándar usa **Quick Reply buttons** en los mensajes de plantilla de WhatsApp: "Confirmar" / "Cancelar" / "Reagendar". Los productos más avanzados (Wati con n8n) implementan switch nodes que detectan respuestas y rutean: `confirm` → marca turno como confirmado en base de datos, `cancel` → actualiza estado a cancelado y alerta a la clínica, `reschedule` → inicia flujo automatizado de selección de nuevo horario, `myappointment` → envía historial completo al paciente. La mayoría de los productos argentinos implementan el modelo simplificado de 3 estados: **Pendiente → Confirmado ✅ → Cancelado ❌**, con un estado adicional de "Sin respuesta" que flagea para seguimiento manual.

### Configuración de plantillas de recordatorio

**Cliniko** tiene el patrón más sofisticado de "template-then-link": se crean plantillas de mensaje por separado (Settings → Appointment Reminders) y luego se vinculan a tipos de turno mediante dropdowns selectores. Cada tipo de turno tiene selectores para: email de confirmación, email de recordatorio, SMS de recordatorio, email de seguimiento, SMS de seguimiento. **SimplyBook.me** soporta variables como `[client_name]`, `[event]`, `[date_start]`, `[time_start]`, con un editor HTML drag-and-drop para emails. **Zoho Bookings** requiere crear plantillas primero en Meta Business Suite y luego seleccionarlas dentro de la plataforma, con campos dinámicos para nombre del turno, fecha/hora, link de videollamada, y botones de acción personalizados.

Los elementos comunes en toda plantilla de recordatorio médico son: **nombre del paciente** (variable dinámica), **fecha y hora del turno**, **nombre del profesional**, **dirección/ubicación** (a veces con link de Google Maps), **botones de acción** (Confirmar/Cancelar/Reagendar), **instrucciones de preparación** (ayuno, documentación, protocolo) y **branding de la clínica** (logo vía WhatsApp Business Profile).

---

## 4. Reportes y analytics: de tablas básicas a dashboards inteligentes

### Tipos de reportes que ofrece la industria

Los reportes se organizan en **6 categorías principales** con diferente nivel de sofisticación según el producto:

**Reportes de turnos y asistencia**: Cliniko ofrece un reporte dedicado de "Cancellations and No-Shows" que trackea inasistencias con período de aviso y tarifas de cancelación. AgendaPro muestra "Reservas por hora por día" identificando horas pico y valle. Los productos argentinos como Emprenet/Blipdoc proveen el desglose clásico: **Turnos Pedidos vs. Atendidos vs. Ausentes vs. Cancelados**.

**Reportes de ingresos/facturación**: Acuity muestra desglose de ingresos por procesador de pagos y efectivo en formato tabular. Cliniko tiene la mayor flexibilidad con toggle entre base devengada y base caja, reportes por profesional o por práctica, con formato optimizado para impresión. DrChrono integra un Live Claims Feed con estado de claims en tiempo real dividido en "Claims in Progress" y "Claims to Review".

**Reportes de utilización del profesional**: Jane App calcula **utilización % = tiempo agendado / (duración del turno - tiempo de descanso)**, visible en el dashboard overlay. AgendaPro muestra "ocupación estimada" por profesional como porcentaje. Cliniko trackea rendimiento por profesional con gráficos individuales de turnos totales, cancelaciones, pacientes nuevos y tasa de re-reserva.

**Reportes de obra social/seguro**: Los productos argentinos priorizan esta categoría. Emprenet/Blipdoc ofrece "Listado de Presentes por Obra Social/Prepaga" y "Resumen de Pacientes por Profesional/Obra Social". Geclisa incluye "Convenios con Financiadores" y liquidación por obra social. Zocdoc muestra patient mix por plan de seguro (Aetna PPO, Cigna, United Healthcare, Medicare).

**Reportes de marketing y fuente de reservas**: Zocdoc lidera con su gráfico de "Booking Source Over Time" — stacked area chart mostrando contribución de marketplace, Google Business Profile, botón de reserva web y resultados patrocinados. Calendly ofrece "Popular Times" como heatmap y leaderboard de top performers.

**Análisis de ausentismo (no-shows)**: Las mejores prácticas de visualización incluyen: **gráficos de barra por día de la semana** (lunes tiene más ausencias que viernes), **barras agrupadas comparando tasa de DNA entre profesionales**, **líneas de tendencia correlacionando tiempo de anticipación de reserva con tasa de ausencia** (mayor tiempo = mayor ausentismo), y **treemaps para distribución geográfica** de ausentismo. Cliniko trackea "Did Not Arrives" como métrica explícita dentro del rendimiento por profesional.

### Tipos de visualización predominantes

Los patrones de visualización más usados siguen una jerarquía consistente:

**KPI Cards** (fila superior): 3-5 métricas principales como números grandes con indicadores de tendencia (flechas arriba/abajo, sparklines, comparación con período anterior). Zocdoc muestra Total Bookings, Completed Appointments y Spend con comparación porcentual. Setmore muestra Confirmed Revenue, Projected Revenue y Total Estimated.

**Gráficos de línea**: Para tendencias temporales — volumen de turnos y facturación a lo largo del tiempo con granularidad diaria/semanal/mensual. Calendly los usa para eventos completados, Cliniko para ingresos por período.

**Gráficos de barra**: Para comparaciones — turnos por profesional, ingresos por servicio, ausencias por día de la semana. AgendaPro los usa extensamente en sus reportes por local, servicio y prestador.

**Heatmaps**: Para utilización del profesional a través de franjas horarias (filas = profesionales, columnas = horas/días; gradiente verde → naranja → rojo). Calendly tiene "Popular Times" con este patrón. Es el gold standard para visualizar "¿a qué hora está más ocupado cada doctor?"

**Pie/Donut charts**: Para distribución de obra social/seguro, desglose de fuentes de reserva, distribución de estados de turno. Zocdoc los usa para patient mix.

**Tablas con filtros**: Para datos detallados — listas de pacientes, historial de transacciones, estado de claims. Siempre con columnas ordenables, búsqueda y capacidad de exportación.

### Filtros y selectores de fecha

El patrón universal incluye: **dos campos de fecha (desde/hasta)**, botones de selección rápida (**7d, 30d, 90d, YTD**), dropdown de períodos predefinidos (esta semana, este mes, este año), y un **toggle de comparación con período anterior**. AgendaPro agrega un diferenciador: toggle entre "fecha de creación" y "fecha de realización" del turno, que permite analizar cuándo se reservaron los turnos vs. cuándo se atendieron. DrChrono permite guardar filtros personalizados como presets reutilizables.

### Opciones de exportación

CSV es el formato universal (disponible en Calendly, Acuity, DrChrono, AgendaPro, Jane App, SimplyBook.me). Excel/.XLS está en Setmore, SimplyBook.me y Emprenet. PDF vía impresión está en Cliniko y Jane App. Cliniko tiene un botón "Print" dedicado en reportes de ingresos que genera diálogo de impresión (guardable como PDF). Los productos argentinos (Emprenet) priorizan impresión directa para liquidaciones de obra social.

---

## 5. Páginas de configuración: sidebar izquierdo con herencia por entidad

### Arquitecturas de navegación de settings

**El patrón dominante es sidebar izquierdo con categorías jerárquicas.** Cliniko organiza bajo "Settings" con links categorizados: General Settings, Business Information, Users & Practitioners, Appointment Types, Appointment Reminders, Online Bookings. SimplyBook.me tiene sidebar izquierdo con: Dashboard, Calendar, Manage, Reports, Custom Features, Settings (que a su vez contiene Main Configuration, Design, Company Info, Opening Hours, Notification Templates, Widgets).

**El panel de dos columnas (lista de categorías + panel de detalle)** es el patrón más escalable para settings complejos, usado por Calendly Admin Center y recomendado por investigaciones de UX. La columna izquierda muestra "buckets" de configuración categorizados; al hacer clic en uno, el panel derecho muestra los controles detallados.

**DrChrono usa tabs horizontales** dentro de Provider Settings: Profile, General, Medical Billing, View, Security, Usage. Bajo General se agrupan: Calendar Settings, Appointment Settings, Clinical Notes, Patient Vitals, Communications. Las pestañas funcionan bien cuando hay 6-7 categorías o menos.

**SimplyBook.me introduce un patrón único de "marketplace de features"**: las funcionalidades opcionales se presentan como cards/tiles que pueden activarse/desactivarse con toggles, cada una con un link "Settings" para configuración. Es modular — cada negocio activa solo lo que necesita.

### Configuración de horarios y políticas

Los horarios de atención se configuran **por ubicación** (Cliniko: Settings → Business Information → seleccionar ubicación, cada una con horario independiente por día) y **por profesional** (SimplyBook.me: Manage → Service Providers → "Customize time settings for this provider"). Jane App usa un sistema de "Shifts" donde cada profesional configura turnos recurrentes con plantillas. Los feriados y excepciones se manejan como "Special Days" en SimplyBook.me o como bloqueos directos en el calendario en Jane App y Cliniko.

Las políticas de cancelación y reglas de reserva incluyen: **tiempo mínimo de anticipación** para reservar (ej: 2 horas antes), **tiempo máximo de anticipación** (ej: 60 días), **buffer entre turnos**, **restricción de cancelación** (ej: no cancelar menos de 24h antes), **política de prepago** (Jane App ofrece: prepago total, depósito, tarjeta en archivo, o sin pago). Acuity agrega funciones de "Look Busy" y "Minimize Gaps" que controlan cómo se muestra la disponibilidad para optimizar la agenda.

### Configuración de recordatorios/notificaciones

El estándar de la industria es un **sistema de triple toque**: confirmación inmediata al reservar (email), recordatorio 24h antes (email/SMS/WhatsApp), y recordatorio opcional 1-2h antes (SMS/WhatsApp). Cliniko tiene la arquitectura más flexible: plantillas se crean por separado, cada una con nombre, período de envío (hasta 9 días antes), hora específica, toggle "skip weekends". Luego se vinculan a tipos de turno con dropdowns. Hay toggle por ubicación, override por paciente (None/Email only/SMS only/SMS & Email), y configuración separada para notificaciones al profesional.

**Los toggles por canal** (Email: On/Off, SMS: On/Off, WhatsApp: On/Off) se implementan a tres niveles: global/ubicación, por tipo de turno, y por preferencia de paciente (override individual). AgendaPro agrega un toggle de "Reservas editables" (permitir reprogramar desde WhatsApp) y "Reservas cancelables" (permitir cancelar desde WhatsApp), con políticas de horas mínimas antes del turno para cambios y número máximo de ediciones.

### Gestión de usuarios y roles

Los productos médicos usan **roles predefinidos con nombres claros** en lugar de matrices de permisos totalmente personalizables. Cliniko tiene 6 roles: Scheduler (solo carga turnos), Receptionist (turnos + datos básicos de pacientes + comunicaciones), Power Receptionist (+ facturas/pagos + settings + reportes), Practitioner (acceso clínico + su propia agenda), Bookkeeper (solo datos financieros), Administrator (acceso total excepto suscripción). Jane App ofrece roles jerárquicos (No Access → Practitioner → Practitioner/Front Desk → Administrative/All Billing → Full Access → Account Owner) con toggles individuales por usuario: View Charts Shared by Other Staff, Manage Shifts, Access Billing.

**AgendaPro** para el mercado argentino implementa 3 roles primarios: Admin/Owner (acceso total), Recepcionista (reservas y edición en ubicación específica, todos los calendarios de esa sede), Prestador (su propia agenda y pacientes). DrChrono tiene un modelo jerárquico de herencia: User-level → Role-level → Practice-level → DrChrono defaults.

### Multi-sede y herencia de configuración

El patrón universal trata cada **ubicación como entidad de configuración independiente con defaults heredados** del nivel global. Cliniko permite agregar múltiples sedes con nombre, dirección, teléfono, logo, toggle de booking online y toggle de recordatorios por separado. Jane App vincula staff a sedes específicas; el rol Practitioner/Front Desk solo puede gestionar turnos en su(s) sede(s) asignada(s). AgendaPro permite agregar locales con "Agregar Local", cada uno con sus propios prestadores, servicios y horarios; las cuentas de recepcionista se scope a ubicaciones específicas.

---

## 6. Responsividad móvil: agenda-lista como default, apps nativas para notificaciones

### Tres estrategias móviles en la industria

**Apps nativas iOS + Android para admin** (Calendly, Doctolib Pro, DrChrono solo iOS, Setmore, AgendaPro, SimplyBook.me): Mejor push notifications, potencial offline, integración con hardware (cámara, NFC, biometría). El trade-off es mantener paridad de features con la web.

**Web responsive sin app nativa** (Cliniko, Acuity principalmente, Jane App para profesionales): Codebase único, siempre actualizado, todas las features disponibles. Cliniko explícitamente abandonó apps separadas en favor de diseño responsive, argumentando que es más mantenible y a prueba de futuro. Cliniko aumentó el font-size de 14px a 16px para accesibilidad móvil y colapsa progresivamente columnas (4→3→2→1) según el ancho de pantalla.

**Modelo dual de apps** (Doctolib): El gold standard para scheduling médico. **Doctolib tiene dos apps nativas separadas**: Doctolib (para pacientes, 80M+ usuarios) y Doctolib Pro (para profesionales y secretarias, 150,000+ profesionales). La app Pro fue "diseñada y desarrollada en colaboración con miles de médicos y secretarias". Ambos roles usan la misma app Pro con diferente énfasis funcional.

### El calendario en el teléfono

La vista de agenda/lista es el default móvil más común. **Setmore** abre en vista de agenda cronológica y ofrece switchear a Day, Week, Team (hasta 10 profesionales lado a lado, swipeable). **Calendly** muestra una lista de meetings ordenada cronológicamente, sin grilla de calendario en absoluto. **DrChrono** en iPad muestra la grilla completa de calendario. **Cliniko** intenta mostrar la grilla responsive incluso en mobile, con colapso progresivo de columnas.

Los patrones de UX móvil específicos incluyen: **navegación por tabs en la parte inferior** (Calendly: Home/Meetings/Contacts; DrChrono: tab bar unificado), **gestos de swipe** para navegar entre días/semanas, **botón flotante (+)** para crear turno rápido (Setmore, SimplyBook.me), **código QR** para compartir link de reserva en persona (Calendly, Setmore), y **modo privacidad** que oculta nombres de pacientes (Jane App — útil para uso móvil en lugares públicos).

### Diferenciación doctor vs. secretaria en móvil

El mercado argentino **explícitamente diferencia estos roles**. Mis Turnos Móvil (de Argensoft/SITA) tiene: app de escritorio para secretarias/admin, app móvil separada específicamente para médicos (con acceso a agenda, ficha clínica, historia digital, videoconsultas), y app/portal web para pacientes. AgendaPro menciona "App disponible para médicos" con capacidades específicas (agenda 24/7, asignar/cancelar turnos, acceso a info de pacientes, historia clínica digital, videoconsultas).

Los features **comúnmente omitidos en móvil** en toda la industria son: configuración compleja de settings (universal), reportes y analytics avanzados (requieren pantalla grande), construcción de plantillas/formularios, gestión detallada de facturación, configuración de integraciones, operaciones masivas, historial financiero detallado.

---

## Recomendaciones concretas de Dashboard y Reportes para Turnera

### Arquitectura de la pantalla de inicio

Turnera debe implementar el **modelo híbrido de Jane App adaptado al contexto argentino**: el calendario/agenda como homepage con un panel de KPIs colapsable en la parte superior. Al iniciar sesión, la secretaria ve inmediatamente los turnos del día. Un toggle visible (ícono de gráfico o botón "Métricas") en la barra superior despliega/colapsa un panel de estadísticas del día.

**Layout recomendado del home**:

La pantalla se divide en dos zonas. **Zona superior colapsable** (panel de métricas del día): una fila de 4-5 KPI cards con los números del día — Turnos hoy (con desglose confirmados/pendientes/cancelados), Tasa de confirmación del día (porcentaje con indicador verde/amarillo/rojo), Ausencias del mes (con comparación vs. mes anterior), Recordatorios enviados hoy (con tasa de lectura WhatsApp), e Ingresos estimados del día (sumando valores de turnos confirmados). Cada card muestra el número grande, un subtítulo descriptivo y una flecha o micro-sparkline de tendencia.

**Zona principal** (calendario): Vista de día con lista cronológica de turnos, cada turno como una "card" horizontal que muestra hora, nombre del paciente, profesional, obra social/prepaga, tipo de consulta, y **estado de confirmación como badge de color** (verde = confirmado vía WhatsApp ✅, amarillo = recordatorio enviado/pendiente ⏳, rojo = cancelado ❌, gris = sin recordatorio enviado). Al hacer clic/tap en un turno se abre un panel lateral o modal con detalle completo del turno, historial de mensajes WhatsApp enviados, botón de "Enviar recordatorio manual", botón de "Llamar paciente" (click-to-call), y opción de cambiar estado.

**Alertas proactivas** en la parte superior del calendario (tipo banner dismissible): "3 turnos sin confirmar para mañana", "Paciente Juan Pérez tiene 3 ausencias en los últimos 6 meses" (al abrir su turno), "Turno duplicado detectado: Dr. García tiene 2 turnos a las 10:00". Estas alertas deben ser de color amarillo/naranja con ícono de advertencia.

**Acciones rápidas**: Botón prominente "+ Nuevo turno", acceso directo a "Recordatorios pendientes" con badge de conteo, y acceso a "Turnos de mañana sin confirmar".

### Sistema de notificaciones

Turnera debe ser **el primer producto de scheduling médico argentino con un centro de notificaciones in-app tipo Zocdoc**, aprovechando el vacío existente en la industria.

Implementar un **ícono de campana en la barra de navegación superior** con badge rojo mostrando conteo de items no leídos. Al hacer clic, se despliega un dropdown con las últimas notificaciones agrupadas por tipo: Nuevas reservas (azul), Cancelaciones (rojo), Confirmaciones vía WhatsApp (verde), Recordatorios fallidos (naranja). Cada notificación muestra timestamp relativo ("hace 5 min"), nombre del paciente, profesional, y acción rápida contextual ("Confirmar" / "Ver turno" / "Reenviar recordatorio").

Los eventos que disparan notificaciones deben incluir: nueva reserva online, cancelación por paciente vía WhatsApp, confirmación por paciente vía WhatsApp, recordatorio WhatsApp no entregado (failed), paciente con historial de ausencias que tiene turno próximo, doble reserva detectada, y turnos de mañana sin confirmar (alerta diaria a las 18:00).

Implementar **notificaciones push del navegador** (Web Push API) como diferenciador — ningún competidor las usa. Activables con un prompt no-intrusivo tipo "¿Querés recibir alertas cuando un paciente confirme o cancele?". También implementar un **resumen diario por email** a las 7:00 AM con la agenda del día, turnos pendientes de confirmación, y recordatorios programados.

### UI de gestión de recordatorios WhatsApp

El módulo de recordatorios WhatsApp de Turnera, integrado con YCloud, debe tener **tres niveles de visibilidad**:

**Nivel 1 — En el turno**: Cada turno en el calendario muestra un ícono de estado de WhatsApp junto al nombre del paciente. Los íconos siguen la convención de WhatsApp: ✓ gris (enviado), ✓✓ gris (entregado), ✓✓ azul (leído), ✅ verde (confirmado por paciente), ❌ rojo (cancelado por paciente), ⚠️ naranja (falló el envío). Al abrir el detalle del turno, una pestaña "Mensajes" muestra el timeline completo de comunicaciones WhatsApp con el paciente para ese turno, con timestamps y estados. Un botón "Enviar recordatorio" permite disparar manualmente un mensaje de plantilla. Un botón "Abrir chat" abre la conversación completa (usando el Inbox de YCloud o integrando el widget de conversación).

**Nivel 2 — Centro de comunicaciones**: Una sección dedicada "Recordatorios" en la navegación principal que muestra un dashboard con: créditos de WhatsApp disponibles (YCloud wallet balance), mensajes enviados hoy/esta semana/este mes, **tasa de entrega** (delivered/sent), **tasa de lectura** (read/delivered), **tasa de confirmación** (confirmed/sent), lista de mensajes fallidos para reintento, y lista de pacientes sin número de WhatsApp válido (para corrección de datos). Incluir una tabla filtratable de todos los recordatorios enviados con columnas: Fecha, Paciente, Profesional, Turno, Estado (Enviado/Entregado/Leído/Confirmado/Cancelado/Fallido/Sin respuesta), Acción (Reenviar).

**Nivel 3 — Configuración de plantillas**: En Settings → Recordatorios, ofrecer configuración de: timing de recordatorio automático (selector numérico: "24 horas antes" y "2 horas antes"), plantillas de mensaje con variables dinámicas ({nombre_paciente}, {nombre_profesional}, {fecha_turno}, {hora_turno}, {direccion}, {instrucciones_preparacion}), preview del mensaje tal como se verá en WhatsApp, botones de Quick Reply configurables (por defecto: "✅ Confirmar" / "❌ Cancelar" / "📅 Cambiar horario"), toggle de doble recordatorio (enviar segundo si no hay respuesta en X horas), y toggle por canal (WhatsApp habilitado por defecto, email como fallback).

### Reportes y analytics

Los reportes de Turnera deben organizarse en **5 dashboards temáticos**, accesibles desde una sección "Reportes" en la navegación principal:

**Dashboard 1 — Resumen general** (landing de reportes): Fila superior con 5 KPI cards — Total turnos (período seleccionado), Tasa de asistencia (%), Tasa de ausencia (%), Ingresos estimados ($), Pacientes nuevos. Debajo, dos gráficos: **gráfico de línea** de turnos por día/semana/mes con línea de tendencia (eje X = tiempo, eje Y = cantidad, con toggle entre turnos totales/confirmados/ausentes), y **gráfico de barras apiladas** de distribución de estados (Atendidos/Ausentes/Cancelados/Reprogramados) por semana.

**Dashboard 2 — Análisis de ausencias**: **Gráfico de barras horizontal** mostrando tasa de ausencia por día de la semana (para identificar que "los lunes tienen 25% de ausencias vs. 8% los jueves"). **Gráfico de barras agrupadas** comparando tasa de ausencia por profesional. **Tabla** de pacientes con más ausencias (nombre, cantidad de ausencias, cantidad total de turnos, porcentaje, último turno). **Gráfico de línea** correlacionando anticipación de reserva con tasa de ausencia. Filtros: rango de fechas, profesional, obra social, tipo de consulta.

**Dashboard 3 — Utilización por profesional**: **Heatmap semanal** (filas = profesionales, columnas = franjas horarias; gradiente blanco → azul claro → azul intenso según ocupación) para visualizar a simple vista qué médicos están sub/sobre-utilizados. **Barras horizontales con porcentaje** tipo progress bar (ej: "Dr. García — 85% esta semana ████████░░"). **Tabla detallada** con columnas: Profesional, Turnos disponibles, Turnos agendados, Ocupación %, Ausencias, Ingresos estimados.

**Dashboard 4 — Obra social/prepaga**: **Gráfico de donut/pie** mostrando distribución de turnos por obra social/prepaga (top 10 + "Otras"). **Tabla** con columnas: Obra Social, Turnos atendidos, Turnos ausentes, Tasa de ausencia, Ingresos estimados. Filtros por profesional y período. Este reporte es crítico para el mercado argentino y ningún producto internacional lo ofrece adecuadamente.

**Dashboard 5 — Rendimiento de WhatsApp**: **Funnel chart** o barras de embudo mostrando: Recordatorios programados → Enviados → Entregados → Leídos → Respondidos → Confirmados. **Tasa de conversión** en cada paso. **Comparación mensual** de tasa de confirmación vía WhatsApp. **ROI de recordatorios**: turnos salvados de ausencia gracias a la confirmación previa (estimación basada en tasa histórica de ausencia sin recordatorio vs. con recordatorio).

**Filtros globales para todos los reportes**: Selector de rango de fechas con presets (Hoy, Esta semana, Este mes, Últimos 3 meses, Este año, Personalizado) + botones de comparación con período anterior. Filtro por profesional (dropdown multi-select). Filtro por sede (para multi-sede). Filtro por obra social. **Exportación**: botón con opciones CSV, Excel, PDF, e Imprimir — siempre visible en la esquina superior derecha de cada dashboard.

Las librerías de gráficos recomendadas para implementación con React/Next.js son **Recharts** (la más popular, con buen soporte para responsive) o **Nivo** (más visual, mejor para heatmaps). Para tablas con filtros y exportación, **TanStack Table** (ex React Table).

### Configuración y settings

Usar **sidebar izquierdo con categorías agrupadas** como patrón de navegación principal para Settings. Las categorías recomendadas son:

- **Consultorio**: Datos del consultorio, direcciones de sedes, horarios de atención por día (configuración por sede), feriados y días excepcionales, política de cancelación, reglas de reserva online (anticipación mínima/máxima, buffer entre turnos).
- **Profesionales**: Lista de médicos con foto, especialidad, obras sociales que atiende, horarios individuales, duración de turno por defecto, tipos de consulta que ofrece.
- **Recordatorios**: Configuración de timing (cuántas horas antes), plantillas de mensaje WhatsApp, toggle de doble recordatorio, email como fallback, créditos de WhatsApp (balance YCloud), historial de uso.
- **Usuarios y permisos**: 3 roles predefinidos — Administrador (acceso total), Secretaria (agenda + turnos + comunicaciones en su sede), Profesional (su propia agenda + fichas de pacientes). Toggle individual de "Ver datos financieros" aplicable a cualquier rol.
- **Integraciones**: Estado de conexión WhatsApp Business API (YCloud), configuración de Mercado Pago para cobro de seña/prepago, Google Calendar sync.
- **Obra social**: Listado de obras sociales/prepagas configuradas, valores por prestación, requisitos de autorización.

### Experiencia móvil

Turnera debe implementar una **web app responsive (no app nativa inicialmente)** siguiendo el modelo de Cliniko, con "Agregar a pantalla de inicio" para simular experiencia nativa. La razón: menor costo de desarrollo, feature parity inmediata, actualizaciones instantáneas. Agregar **Web Push API** para notificaciones en el navegador (diferenciador que ningún competidor tiene).

En móvil, el calendario debe defaultear a **vista de agenda/lista** (como Setmore) mostrando los turnos del día en cards verticales con badge de estado WhatsApp. Un botón flotante "+" para crear turno rápido. Swipe lateral para cambiar de día. Los reportes deben ser accesibles pero simplificados — mostrar KPI cards y un gráfico principal por dashboard, con link a "Ver reporte completo en escritorio". La configuración de settings debe ser exclusivamente desktop.

En una segunda fase, considerar una **app nativa para médicos** (como Mis Turnos Móvil de Argensoft) que permita al profesional ver su agenda del día, confirmar llegada de pacientes, acceder a ficha rápida del paciente, y recibir push notifications de cambios en su agenda. La app de la secretaria es la web responsive; la app del médico es nativa y minimalista.

### Resumen de decisiones técnicas clave

Turnera debe construirse sobre estas decisiones concretas: **calendario como homepage con panel de KPIs colapsable** (modelo Jane App), **centro de notificaciones in-app con campana y badge** (modelo Zocdoc, primer producto argentino en implementarlo), **gestión de WhatsApp en 3 niveles** (turno individual → centro de comunicaciones → configuración de plantillas), **5 dashboards de reportes** con heatmap de utilización, análisis de ausencias por día/profesional/paciente, y funnel de rendimiento de WhatsApp, **roles predefinidos** de Admin/Secretaria/Profesional con sidebar izquierdo en settings, y **web responsive con Web Push** como estrategia móvil inicial. La integración con YCloud debe exponer los 5 estados de webhook (sent/delivered/read/failed/deleted) directamente en la UI del turno usando la iconografía familiar de WhatsApp, creando una experiencia que cualquier secretaria argentina entiende intuitivamente.