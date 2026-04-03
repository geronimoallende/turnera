# Patrones de calendario médico profesional: guía de diseño para una turnera argentina

**La mejor turnera médica combina el side panel deslizante de Jane App, el sistema de columnas por doctor de Doctolib, y la integración WhatsApp que exige el mercado argentino.** Tras analizar las 6 plataformas líderes internacionales y los 5 competidores argentinos principales, el patrón dominante es claro: un timegrid con columnas por doctor en la vista de día, un side panel derecho para booking/detalles, background events para disponibilidad, y status visual mediante colores de bloque + íconos complementarios. Con FullCalendar free tier, la vista multi-doctor se logra mediante **múltiples instancias sincronizadas** — un workaround robusto que evita la licencia premium de $480/dev/año. Las plataformas argentinas presentan brechas enormes en UX respecto a las internacionales: ninguna ofrece drag-and-drop, vista multi-doctor overlay, ni workflow visual de estados.

---

## Cómo resuelven el calendario las 6 plataformas líderes

### Doctolib: el estándar europeo

Doctolib Pro (`pro.doctolib.fr`) usa un layout de **tres zonas**: sidebar izquierdo colapsable, barra superior, y área central de timegrid. El sidebar contiene un mini-calendar para navegación rápida, checkboxes por agenda/doctor (activar/desactivar), filtros de estado, filtros de motivo de consulta, y un botón "Prendre un RDV" que salta al próximo slot disponible. El calendario ofrece **4 vistas**: día (columnas por doctor), semana (configurable: separadas o fusionadas), lista (tabla con columnas reordenables), y mes (resumen numérico de citas por día, no grilla detallada).

La vista multi-doctor se activa con la opción **"Séparation des agendas en vue semaine"**: cuando está en "Oui", cada doctor recibe su propia columna. Se pueden agrupar por orden alfabético, especialidad, o ubicación de consultorio. Con **5+ agendas**, aparece el botón "Filtrer les présents" que muestra solo doctores con horario definido ese día.

Al hacer click en un **slot vacío**, se abre un formulario overlay para crear turno: selección de tipo de consulta, duración, búsqueda de paciente (por nombre, apellido o fecha de nacimiento), y opción de crear paciente nuevo inline. Al hacer click en un **turno existente**, se abre la "fiche de rendez-vous" (ficha de turno) con acciones: modificar, mover, cancelar, duplicar, cambiar estado, e iniciar videoconsulta. El hover sobre un turno muestra un frame de detalle a la izquierda con **número de celular**, indicador de paciente nuevo, y notas.

El sistema visual de estados es sofisticado: los bloques están **coloreados por motivo de consulta** (cada motivo tiene un color asignado). El estado "En sala de espera" agrega un **patrón rayado (hatched)**. Las ausencias muestran el bloque **tachado (barré)**. El overbooking se muestra con **turnos lado a lado** dentro del mismo slot. Doctolib soporta **drag-and-drop** completo con diálogo de confirmación y notificación automática al paciente. También ofrece **blur de nombres de pacientes** para pantallas compartidas.

El componente open-source `doctolib/calendar-1` en GitHub resultó ser solo un fork de `rc-calendar` — un **date picker**, no el grid de scheduling. La grilla profesional es propietaria, construida sobre su design system "Oxygen" (25+ componentes, 70,000+ inserciones/semana).

### Jane App: el patrón side panel que hay que copiar

Jane App define el estándar de UX para practice management norteamericano. Su elemento diferenciador es el **right-side sliding panel** que se desliza desde la derecha al hacer click en cualquier slot o turno. El sidebar izquierdo lista los practitioners organizados por disciplina, con un dropdown de ubicación arriba y filtros de disciplina. Al hacer hover sobre un nombre aparece un botón "+" para agregar esa columna al calendario.

La vista multi-doctor se activa con el botón **"Staff Today"**: muestra una columna por cada practitioner que tiene turnos, shift, o break ese día. En week view, las columnas pasan a ser días para un solo practitioner. La información de shifts se muestra como **fondo celeste claro** (available) vs **blanco** (fuera de horario). Los breaks aparecen como bloques etiquetados dentro del shift ("Lunch", "Admin time"), arrastrables como turnos.

El **booking flow** es elegante: click en slot vacío → panel derecho se desliza con campo de búsqueda de paciente (autocomplete), dropdown de tratamiento, campo de notas, y botón "Book Appointment". El calendario mantiene visible el slot seleccionado (highlight) mientras el panel está abierto. Para **turnos existentes**, el panel muestra: nombre del paciente (link al perfil), botones "Arrived" y "No Show" prominentes arriba, info de booking con ícono de edición, botones Move/Copy/Cancel, historial, balance pendiente, y label "First Visit" si aplica.

El **drag-and-drop** es completo: arrastrar dentro de la misma semana muestra un diálogo "Confirm" o "Confirm and Notify". Para mover a otra semana, el botón "Move" del panel activa un **banner naranja** arriba de la pantalla indicando qué turno se está moviendo; el usuario navega a la nueva fecha y clickea. La **tecla "D"** activa el modo double-booking: los turnos existentes se comprimen a la izquierda de la columna, dejando espacio a la derecha para bookings adicionales.

Los estados se comunican mediante **color del bloque completo**: verde claro (arrived, no pagó), verde oscuro (arrived + pagó), rojizo (no show), negro (wait list cue). Un **Accessibility Mode** agrega patrones visuales sobre los colores para usuarios con daltonismo.

### Cliniko: configurabilidad pixel-level

Cliniko ofrece control granular del calendario: **slot height en pixels exactos** (15px, 30px, 40px), slot size en minutos, y rango horario configurable. La vista de 1 día muestra **una columna por practitioner activo**; el **"Smart 1 Day View"** oculta automáticamente los que no trabajan ese día. Ofrece 5 opciones de vista: 1 día, 3 días, work week, 6 días, 7 días.

El booking flow usa un **popup/modal que aparece en la posición del click** (no side panel), con campos de paciente (autocomplete), tipo de cita, notas, y configuración de repetición. El sistema de **íconos pequeños** en las esquinas del bloque es único: persona con camisa azul (arrived), camisa roja (didn't arrive), globo (booking online), cámara (telehealth), tick verde (reminder enviado), ícono de factura (pagado/no pagado), nota (draft/final). Esto permite comunicar **múltiples dimensiones simultáneamente** pero requiere inspección más cercana que el approach de colores de Jane.

### SimplyBook.me: 6 vistas incluyendo timeline

SimplyBook.me destaca por tener **6 modos de vista**: Service Providers (columna por provider), Services (columna por servicio), Timeline (providers como filas, tiempo horizontal — ideal para 5+ doctores), Day, Week, y Month. La vista "by service" muestra "Consulta", "Control", "Procedimiento" como columnas separadas — útil para tracking de demanda pero **poco práctico para scheduling diario** en clínicas médicas donde un doctor maneja múltiples servicios. El admin booking usa popup en espacio libre o drag-to-select con formulario. Cada provider tiene color propio visible en calendario, dashboard, y reportes.

---

## El mercado argentino: brechas enormes en UX de calendario

**Ninguna plataforma argentina ofrece vista multi-doctor overlay, drag-and-drop, ni workflow visual de estados.** Esta es la oportunidad competitiva más clara.

**DrApp** es el líder de mercado (2,000+ centros, 1M+ turnos/mes) pero su calendario es una **agenda per-professional sin overlay**: cada doctor ve su propia agenda por separado. La interfaz es funcional pero técnica, sin la elegancia de Doctolib o Jane. WhatsApp automático es un **costo adicional** sobre la suscripción base de $16,499 ARS/profesional/mes.

**Calu** se posiciona como "tu agenda, tu WhatsApp y tus pacientes en un solo lugar" — 5,000+ profesionales, pricing por tiers con **mensajes WhatsApp escalonados** (50→200→1,000→ilimitados). Tiene vistas diaria y semanal con click-to-assign, pero **sin multi-doctor overlay**. Incluye receta electrónica, CRM, y gestión financiera con MercadoPago.

**Turnito** es el más liviano: freemium (3 agendas gratis, 100 reservas/mes), sync con Google Calendar, y foco en reducción de no-shows via cobro de seña con MercadoPago. Calendario básico sin features clínicos.

**MedTurnos** es pequeño pero notable por soportar explícitamente **sobreturnos** con reglas automáticas — un concepto clave del mercado argentino donde las secretarias frecuentemente necesitan "exprimir" un paciente extra. **Hola René resultó NO ser un software de scheduling** sino un producto de prepaga/telemedicina de consumidor. **Medilink** es chileno (Healthatom), con 3 vistas de calendario y drag-and-drop, pero sin localización argentina (no MercadoPago, no obras sociales).

Los patrones comunes del mercado argentino son: **WhatsApp como canal primario** (reminders reducen no-shows 80%+), **MercadoPago para seña/depósito**, pricing en ARS, integración con obras sociales/prepagas, y receta electrónica conforme al Ministerio de Salud.

---

## FullCalendar free tier: cómo lograr todo sin pagar premium

### Vista multi-doctor sin el plugin Resource

El workaround recomendado es **múltiples instancias de FullCalendar lado a lado** en un contenedor CSS flex. Cada instancia muestra solo los turnos de un doctor, con su propio `businessHours`. La sincronización de navegación se logra con el callback `datesSet` en la primera instancia, que llama `gotoDate()` en las demás. Solo la primera instancia muestra `headerToolbar`; las otras usan `headerToolbar={false}`. Esto funciona bien para **3-5 doctores**; con más, se recomienda un dropdown/tab filter que muestre un doctor a la vez, con opción de comparar 2-3 columnas.

El approach de custom view vía `createPlugin()` es teóricamente posible pero **impráctico**: requiere reimplementar todo el rendering del timegrid, slot positioning, drag-and-drop, y event interaction desde cero. El approach de filtro por dropdown es el más simple: un solo `<FullCalendar>` con `events` filtrados por `doctorId`.

### Mostrar slots disponibles

Usar **background events** (`display: 'background'`) con color verde claro (#c8e6c9) para horarios disponibles y gris/rojo claro para breaks. La propiedad `display: 'inverse-background'` colorea todo EXCEPTO los rangos especificados, útil para marcar "fuera de horario" en gris. Combinar con `businessHours` para el sombreado automático de horas no laborales, y `selectConstraint="businessHours"` para impedir que el usuario seleccione fuera de horario.

### Click en slot vacío → booking

Usar el callback **`select`** (no `dateClick`) porque provee start Y end time, soporta `selectMirror` para feedback visual, y maneja duraciones variables. Configurar `unselectAuto={false}` para mantener el highlight del slot mientras el side panel está abierto, y `selectOverlap={false}` para impedir doble booking accidental. El flujo: `select` → setState con datos del slot → abrir side panel → formulario de booking → POST al API → `calendarApi.refetchEvents()` → `calendarApi.unselect()` → cerrar panel.

### Performance para scheduling médico

FullCalendar maneja **cientos de eventos** sin problemas. Con ~50 turnos/doctor/día y 10 doctores, estamos en ~500 eventos/día — **dentro del rango óptimo**. Las recomendaciones: usar JSON event sources (URL, no array) para que FullCalendar maneje el caching con `lazyFetching`, memoizar todos los callbacks con `useCallback`, usar `useMemo` para arrays de eventos, y evitar cambios frecuentes de props que disparan re-renders completos.

---

## Wireframes descriptivos del layout ideal

### Vista de día (day view) — pantalla principal para secretarias

**Header (64px altura, fondo blanco, border-bottom gris claro):**
De izquierda a derecha: logo/nombre de la clínica (clickeable → dashboard), separador vertical, botón "← Anterior" + fecha actual en negrita ("Lunes 30 de Marzo, 2026") + botón "Siguiente →", botón "Hoy" (pill outline azul), separador, toggle de vistas: "Día | Semana | Mes" (pill buttons, activo = fondo azul texto blanco), separador, dropdown "Dr. González ▾" (selector de doctor individual cuando no se usa multi-column), botón "🔍 Buscar paciente" (abre search modal), botón "+ Nuevo turno" (azul sólido, abre side panel directamente), avatar del usuario → dropdown con settings/logout.

**Sidebar izquierdo (240px ancho, fondo gris muy claro #f8f9fa, border-right):**
- Mini-calendar (month picker) arriba — fecha seleccionada resaltada en azul, hoy con punto, días con turnos con dot debajo del número
- Sección "Profesionales" con título + checkbox "Seleccionar todos": lista de doctores con checkbox, avatar circular (32px) con iniciales, nombre, y color indicator (barra de 3px a la izquierda del nombre). Cada doctor tiene un color asignado (azul, rojo, verde, naranja, etc.)
- Sección "Filtros" colapsable: checkboxes para estados (Confirmado, Pendiente, En espera, Atendido, Ausente) y para tipo de consulta (Consulta general, Control, Urgencia, etc.)
- Footer del sidebar: link "⚙️ Configurar horarios"

**Área principal del calendario (flex: 1, fondo blanco):**
- Sub-header con nombres de doctores seleccionados: columna por doctor (ej: "Dr. González" | "Dra. Pérez" | "Dr. Ramírez"), cada nombre centrado en su columna, con avatar circular (24px) y color de fondo tenue del doctor
- Timegrid vertical: eje de tiempo a la izquierda (columna de 60px), labels cada 1 hora en gris ("08:00", "09:00"...), líneas horizontales principales cada hora (gris medio #e0e0e0), líneas secundarias cada 15 min (gris muy claro #f0f0f0)
- **Slots disponibles**: fondo blanco limpio dentro de `businessHours`. **Fuera de horario**: fondo gris claro con opacidad 30% (#d7d7d7, 0.3). **Breaks/almuerzo**: background event con patrón de líneas diagonales grises + label "Almuerzo" centrado en gris
- **Now indicator**: línea horizontal roja (#f44336) con punto rojo a la izquierda, cruzando todas las columnas
- Scroll vertical natural; al cargar, auto-scroll a la hora actual (o a `scrollTime="08:00"`)

**Bloque de turno individual (dentro de la columna del doctor):**
- Altura proporcional a la duración (15 min = ~40px con `slotDuration="00:15:00"`)
- Border-left de 4px en el color del estado: **azul (#1976d2)** = confirmado, **amarillo (#ff9800)** = pendiente de confirmar, **verde (#4caf50)** = paciente llegó, **verde oscuro (#2e7d32)** = atendido, **rojo (#f44336)** = ausente, **púrpura (#9c27b0)** = urgencia/emergencia
- Fondo: blanco con transparencia del color del doctor (opacity 0.08) para distinguir columnas
- Contenido del bloque (de arriba a abajo): **hora en negrita** ("09:15") + duración en gris ("30 min"), **nombre del paciente** en negrita ("María García"), tipo de consulta en texto pequeño gris ("Consulta general"), y en la esquina superior derecha: íconos pequeños (📱 si tiene teléfono para WhatsApp rápido, 🔄 si fue reprogramado, ⭐ si es primera vez)
- Hover: sombra sutil + cursor pointer. Click abre el side panel derecho

**Slot vacío clickeable:**
- Al hacer hover sobre un slot vacío dentro de businessHours: fondo azul muy tenue (rgba(25, 118, 210, 0.05)) + cursor pointer + tooltip "Click para agendar"
- Al hacer `select` (click+drag): `selectMirror` muestra un bloque fantasma azul semitransparente con la duración seleccionada

**Side panel derecho (400px ancho, position fixed, right: 0, sombra izquierda):**
- Slide-in animation (transform translateX, 300ms ease)
- Header del panel: botón "✕ Cerrar" arriba a la derecha, título "Nuevo turno" o "Turno de María García"
- **Para nuevo turno**: campo "Buscar paciente" con autocomplete (nombre, apellido, DNI), botón "+ Nuevo paciente" debajo, selector de doctor (pre-llenado con la columna clickeada), selector de tipo de consulta (dropdown), fecha+hora (pre-llenados desde el slot seleccionado, editables), duración (dropdown: 15, 20, 30, 45, 60 min), campo de notas (textarea), checkbox "Enviar confirmación por WhatsApp", botón "Guardar turno" (azul sólido, full width) + botón "Cancelar" (outline)
- **Para turno existente**: datos del paciente arriba (nombre, teléfono con ícono 📱 clickeable que abre `wa.me/`, DNI, obra social/prepaga), tipo de consulta, hora, duración. **Botones de acción prominentes**: "✅ Llegó" (verde), "❌ Ausente" (rojo), "📋 Atendido" (azul). Botones secundarios: "📅 Reprogramar" (inicia modo move), "📋 Duplicar", "🗑️ Cancelar turno". Historial de cambios al final. **El teléfono del paciente SÍ debe ser visible** — en Argentina, el contacto rápido por WhatsApp es esencial para confirmar turnos

### Vista de semana (week view) — para doctores individuales

Misma estructura de header y sidebar. El área principal muestra **7 columnas** (Lun-Dom, o Lun-Vie si se oculta fin de semana) para **un solo doctor** (seleccionado via dropdown o sidebar). Los bloques de turno son más comprimidos: solo muestran **hora + nombre del paciente** (sin tipo de consulta por falta de espacio). El border-left de color de estado se mantiene. Los slots vacíos dentro de businessHours siguen siendo clickeables. Esta vista es la preferida por los **doctores** para ver su semana completa de un vistazo.

### Vista multi-doctor (day view con columnas) — para secretarias

Usa el patrón de **múltiples instancias de FullCalendar** en flex container. Cada columna tiene un header con avatar + nombre del doctor sobre fondo del color del doctor. Solo la primera columna muestra labels de hora a la izquierda. Las demás columnas muestran el timegrid sin labels de hora pero con las mismas líneas horizontales alineadas. Navigation controls solo en la primera instancia; las demás se sincronizan via `datesSet`. Con **3-5 doctores visibles**, cada columna ocupa flex: 1 del espacio disponible. Con **6+ doctores**, agregar scroll horizontal o un selector de subset ("Mostrar 4 de 8" con flechas).

---

## Decisiones clave de diseño: recomendación específica para cada una

### Multi-doctor: columnas vs dropdown

**Recomendación: ambos, context-dependent.** Day view para secretarias: **columnas lado a lado** (multi-instance FullCalendar) con los doctores seleccionados via checkboxes del sidebar. Week view: **dropdown filter** mostrando un doctor a la vez (no caben 7 días × N doctores). El user research de Doctolib y Jane confirma que las secretarias necesitan ver múltiples doctores simultáneamente en la vista diaria para hacer "Tetris" con los turnos, mientras que los doctores solo necesitan su propia agenda.

### Vista default: day view

**Recomendación: Day view** como default para rol secretaria, Week view como default para rol doctor. Doctolib, Jane, y Cliniko coinciden: la secretaria opera día a día, moviendo pacientes entre doctores del día. El doctor planifica su semana. El toggle debe ser prominente y recordar la última selección por usuario.

### Booking flow: side panel

**Recomendación: side panel deslizante desde la derecha, 380-420px de ancho.** Jane App demostró que este patrón es superior a modals (no bloquea la vista del calendario) y a inline forms (más espacio para campos). El panel debe mantener el calendario visible y scrolleable detrás, con el slot seleccionado highlighted. El side panel debe contener: búsqueda de paciente con autocomplete, selector de doctor (pre-llenado), tipo de consulta, fecha/hora (pre-llenados, editables), duración, notas, checkbox de notificación WhatsApp, y botones guardar/cancelar.

### Detalle del turno: side panel (el mismo)

**Recomendación: reutilizar el mismo side panel derecho** con contenido contextual. Click en turno existente → el panel muestra datos del paciente, info del turno, botones de estado ("Llegó", "Ausente", "Atendido"), y acciones (Reprogramar, Duplicar, Cancelar). **No navegar a otra página** — la secretaria necesita volver al calendario inmediatamente. Si se necesita ver el historial clínico completo, un link "Ver ficha completa →" abre en nueva pestaña.

### Información visible en cada bloque de turno

**Recomendación para day view (columna ~200px):** hora en bold ("09:15"), nombre del paciente en bold ("María García"), tipo de consulta en gris pequeño ("Consulta"), íconos de estado en esquina superior derecha. **Para week view (columna ~100px):** solo hora + apellido del paciente ("09:15 García"). El `eventContent` callback de FullCalendar permite renderizar JSX custom con esta jerarquía. La duración se comunica visualmente via la altura del bloque, no necesita texto explícito.

### Slots disponibles vs no disponibles

**Recomendación:** slots disponibles = **fondo blanco limpio**. Slots no disponibles (fuera de businessHours) = **fondo gris con opacity 0.3** via `--fc-non-business-color`. Breaks/almuerzo = **background event** con patrón diagonal gris + label centrado. Cliniko y Doctolib coinciden en este approach: lo disponible es "limpio/vacío", lo no disponible es "manchado/gris".

### Turnos de emergencia/urgencia

**Recomendación: border-left púrpura (#9c27b0) + badge "🚨 URG" en la esquina superior izquierda** del bloque, con fondo púrpura muy tenue. Visualmente debe "saltar" del calendario. Si hay un turno de emergencia, el bloque también debería tener un borde animado sutil (pulse CSS) durante los primeros 30 minutos.

### Overbooking / sobreturnos

**Recomendación: bloques lado a lado** dentro del mismo slot, como hace Doctolib (`slotEventOverlap={false}` en FullCalendar). Cada turno ocupa la mitad del ancho de la columna cuando hay 2, un tercio cuando hay 3. Agregar un **badge numérico** ("2x" o "3x") sobre el slot para indicar overbooking. Para el mercado argentino donde los sobreturnos son cultura, no hay que impedir crearlos — solo hacer visible cuántos hay en paralelo.

### Teléfono del paciente en el calendario

**Recomendación: SÍ, pero solo en el side panel, no en el bloque del calendario.** El bloque ya está apretado de info. En el side panel de detalle, el teléfono debe ser prominente con un **ícono de WhatsApp clickeable** que abra `https://wa.me/54XXXXXXXXXX?text=Hola%20{nombre},%20le%20recordamos%20su%20turno...`. Esto es crítico para el mercado argentino donde el 90%+ de la comunicación clínica-paciente es por WhatsApp.

### Turnos cancelados y reprogramados

**Recomendación: ocultos por default, visibles con toggle.** Seguir el patrón de Jane App: un checkbox "Mostrar cancelados" en los filtros del sidebar. Cuando se muestran, usar **opacidad reducida (0.4)** + texto tachado + border-left rojo. Los reprogramados se muestran con un ícono 🔄 en la esquina pero como turnos normales en su nueva ubicación. En el slot original, si el toggle está activo, mostrar un bloque fantasma gris con "Reprogramado → [nueva fecha]".

---

## Decision matrix: qué hace cada plataforma

| Decisión | Doctolib | Jane App | Cliniko | SimplyBook | DrApp (AR) | Calu (AR) | **Recomendación** |
|---|---|---|---|---|---|---|---|
| **Multi-doctor display** | Columna por doctor + checkboxes en sidebar | Columna por doctor ("Staff Today") + sidebar de selección | Columna por doctor en 1-day view + Smart filter | 6 vistas incl. timeline horizontal | Agenda separada por doctor | Agenda separada | **Columnas en day view, dropdown en week view** |
| **Vista default** | Semana (configurable) | Día (Staff Today) | 1 día | Providers view | Día | Día | **Día para secretarias, Semana para doctores** |
| **Booking flow** | Overlay/panel sobre calendario | Side panel derecho deslizante | Popup/modal en posición del click | Popup en espacio libre | Formulario separado | Click-to-assign | **Side panel derecho deslizante (400px)** |
| **Detalle de turno** | Ficha overlay con acciones | Side panel derecho (mismo) | Popup/overlay con acciones | Popup con detalles | Pantalla separada | Vista de detalle | **Side panel derecho reutilizado** |
| **Status visual** | Color por motivo + patrón hatched (espera) + tachado (ausente) | Color de bloque completo (verde=llegó, rojo=no show) | Íconos pequeños en esquinas del bloque | Color por status en workflow | Filtro por estado | Básico | **Border-left color por status + íconos complementarios** |
| **Click slot vacío** | Formulario overlay | Side panel desliza a derecha | Popup en posición del click | Popup formulario | Formulario página | Click-to-assign | **Side panel con select callback** |
| **Drag-and-drop** | ✅ Con confirmación + notificación | ✅ "Confirm" o "Confirm and Notify" | ✅ Con confirmación | ✅ | ❌ | ❌ | **✅ eventDrop + diálogo confirmación** |
| **Overbooking visual** | Lado a lado en mismo slot | Tecla "D" split column | Manual, overlap permitido | No documentado | Soporta sobreturnos | No documentado | **Lado a lado (slotEventOverlap=false) + badge "2x"** |
| **Disponibilidad** | Blanco=abierto, gris rayado=cerrado | Celeste=shift, blanco=fuera | Blanco=disponible, gris=no disponible | Color por provider | No visual | No visual | **Blanco=disponible, gris 30%=no disponible, diagonal=break** |
| **Info en bloque** | Hora, paciente, motivo, íconos (doctolib logo, cancelación, etc.) | Hora, paciente, tratamiento, "First Visit" | Hora, paciente, tipo, íconos múltiples (arrived, paid, note, telehealth) | Básico | Hora, paciente | Hora, paciente | **Hora bold, nombre bold, tipo gris, íconos de status** |
| **Cancelados** | Tachados + visibles | Ocultos con toggle | Ocultos por default | No especificado | Filtro por estado | No especificado | **Ocultos por default, toggle en sidebar** |
| **Privacy/blur** | ✅ Toggle blur nombres | ✅ Shift+P privacy mode | ✅ Toggle ocultar nombres | No | No | No | **✅ Toggle en header** |
| **WhatsApp** | No (mercado europeo) | No (mercado norteamericano) | No (mercado AU/UK) | No nativo | Semi-automático (costo extra) | Central, tiered messages | **Ícono WA clickeable en side panel + reminders automáticos** |
| **Mini-calendar sidebar** | ✅ | ❌ (no documentado) | ✅ (date picker con mini-cal) | No en admin | No documentado | No documentado | **✅ En sidebar izquierdo arriba** |

---

## Arquitectura técnica recomendada con FullCalendar

La configuración óptima para el tier gratuito combina los siguientes elementos técnicos:

**Para day view multi-doctor:** renderizar N instancias de `<FullCalendar>` en un `display: flex` container, cada una con `plugins={[timeGridPlugin, interactionPlugin]}`, `initialView="timeGridDay"`, y `events` filtrados por `doctorId`. Solo la primera instancia tiene `headerToolbar`; las demás usan `headerToolbar={false}`. Sincronizar navegación con `datesSet` en la primera instancia llamando `gotoDate()` en las demás (usar ref por instancia y un guard booleano para evitar loops infinitos de render).

**Para disponibilidad:** usar `display: 'background'` events con color verde muy claro para horarios disponibles, y `display: 'inverse-background'` con gris para marcar todo fuera de horario. Combinar con `businessHours` per-instance (cada doctor tiene sus propios horarios) y `selectConstraint="businessHours"`.

**Para booking:** `selectable={true}`, `selectMirror={true}`, `unselectAuto={false}`. El callback `select` recibe `{start, end, startStr, endStr}` → setState → abrir side panel → formulario → POST → `refetchEvents()` → `unselect()`. Usar `selectOverlap={false}` para impedir booking sobre turnos existentes.

**Para custom rendering de bloques:** `eventContent` retorna JSX con status dot (span 8px circular), hora en bold, nombre del paciente, tipo de consulta en gris, y badge de primera vez si aplica. No usar hooks dentro de `eventContent` (limitación documentada en GitHub issue #7819).

**Para drag-and-drop:** `editable={true}`, `snapDuration="00:15:00"`, `eventConstraint="businessHours"`. El callback `eventDrop` muestra confirmación → PATCH al API → si falla, `info.revert()`. Agregar opción "Notificar al paciente por WhatsApp" en el diálogo de confirmación.

**Para performance:** usar JSON event source (`events={{ url: '/api/appointments', extraParams: { doctorId } }}`) para que FullCalendar maneje caching con `lazyFetching={true}`. Memoizar todos los callbacks con `useCallback` y arrays con `useMemo`. Con ~500 eventos/día (50/doctor × 10 doctores), el rendimiento es óptimo — los problemas empiezan a partir de 5,000+ eventos visibles simultáneamente.

**CSS variables clave a customizar:**
`--fc-border-color: #e0e0e0`, `--fc-today-bg-color: #fff8e1`, `--fc-now-indicator-color: #f44336`, `--fc-non-business-color: rgba(215, 215, 215, 0.3)`. Slot height ajustable via `.fc .fc-timegrid-slot { height: 2.5em; }`.

---

## La ventaja competitiva contra DrApp y Calu

El producto que resulte de implementar estas decisiones tendrá **tres ventajas estructurales** sobre los competidores argentinos: primero, la vista multi-doctor con columnas lado a lado que ningún competidor local ofrece, permitiendo a las secretarias hacer "Tetris visual" con los turnos de varios doctores simultáneamente. Segundo, drag-and-drop para reprogramación instantánea — una expectativa básica de UX en 2026 que DrApp y Calu no resolvieron. Tercero, el side panel pattern que mantiene el contexto del calendario mientras se opera sobre turnos individuales, eliminando la navegación entre páginas que caracteriza a las plataformas argentinas actuales.

La integración WhatsApp no es diferenciador (todos la ofrecen) sino table stakes: el ícono clickeable en el side panel con template pre-armado y los reminders automáticos son el mínimo esperado. El verdadero diferenciador está en la **fluidez de la interacción con el calendario** — y ahí, los patrones de Doctolib y Jane App implementados sobre FullCalendar free tier ponen al producto a nivel internacional con costo de desarrollo mínimo.