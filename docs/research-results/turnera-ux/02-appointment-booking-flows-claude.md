# Flujos UX de gestión de turnos médicos: análisis completo para Turnera

**Los mejores sistemas de turnos médicos priorizan un diseño centrado en la secretaria, con reserva en 3 clics, estados con código de colores y WhatsApp como canal principal.** Jane App, Cliniko y DrChrono lideran globalmente en flujos clínicos, mientras que en Argentina los productos más relevantes son ClickSalud y Docturno/Cormos, que incorporan búsqueda por DNI, gestión de obras sociales con nomencladores, sobreturnos y Mercado Pago. Ningún producto del mercado resuelve las 8 áreas de forma completa: todos tienen brechas significativas en al menos 2-3 áreas. Turnera tiene la oportunidad de construir el producto más completo del mercado argentino combinando las mejores prácticas internacionales con las necesidades locales específicas.

---

## 1. Flujo de creación de turno nuevo por la secretaria

El patrón dominante en todos los productos médicos especializados es **"clic en calendario → panel lateral/pop-up → completar campos → guardar"**. Este enfoque supera ampliamente a los formularios independientes porque el contexto temporal y del profesional ya está implícito en el clic.

**Jane App** logra la reserva en **3-4 clics**: clic en slot disponible → buscar paciente → seleccionar tipo de tratamiento → "Book Appointment". **Cliniko** es igualmente minimalista: clic en calendario → nombre del paciente (autocompletado) + tipo de turno → "Create appointment". Ambos requieren solo 2 campos explícitos más el clic inicial. **Doctolib** ofrece 4 métodos distintos: tarjeta pequeña (clic rápido), tarjeta completa (hospitales), botón "Buscar turno" (busca disponibilidad entre profesionales), y turno inmediato (walk-in). **DrChrono** agrega complejidad médica útil: consultorio, códigos de facturación ICD-10/CPT, y estados personalizados configurables.

**La búsqueda de pacientes** varía significativamente. Jane App busca por nombre preferido, teléfono, email; Doctolib agrega fecha de nacimiento y apellido de soltera; Cliniko solo por nombre con autocompletado. **En Argentina, la búsqueda por DNI es obligatoria** — Docturno/Cormos lo implementa explícitamente: "Nuestro buscador te mostrará el paciente que buscás tan solo indicando el apellido, el DNI o el dato que tengas."

**Creación inline de paciente nuevo** es crítica. Doctolib lo resuelve mejor: al crear un paciente nuevo, **preserva todos los datos del turno ya ingresados** (fecha, hora, tipo) mientras se completa la ficha del paciente. DrChrono usa un checkbox "New Patient" dentro de la misma ventana. En cambio, Practice Better exige crear el paciente por separado antes de agendar, generando fricción innecesaria. Jane App requiere agregar el paciente como cliente primero, lo cual interrumpe el flujo.

**Selección de profesional + horario**: en todos los productos con calendario por columnas (Jane, Cliniko, DrChrono, Doctolib), el profesional queda implícito al hacer clic en su columna. Doctolib se diferencia con su botón **"Buscar turno"** que encuentra disponibilidad entre múltiples profesionales automáticamente — lo más cercano a "agendar con el Dr. Martínez en algún momento la semana que viene". Jane App tiene una **lupa** que resalta slots disponibles en naranja para un profesional seleccionado.

**Ningún producto soporta reserva flexible por lenguaje natural** ("algún momento la semana que viene"). Las aproximaciones más cercanas son la búsqueda de Doctolib entre profesionales y las listas de espera de Jane/Cliniko que matchean preferencias con aperturas.

**Campos mínimos para reservar**: Cliniko y Jane App exigen solo paciente + tipo de turno (2 campos + clic en calendario). Zocdoc, en el extremo opuesto, requiere nombre completo, fecha de nacimiento, sexo, teléfono, email, dirección y datos de seguro médico.

| Criterio | Mejor | Peor |
|----------|-------|------|
| Menor cantidad de clics | Jane App (3-4), Cliniko (3) | Calendly (workaround), Zocdoc (no diseñado para esto) |
| Búsqueda de pacientes | Doctolib (nombre, email, tel, DOB, apellido soltera) | Calendly (solo email) |
| Creación inline de paciente | Doctolib (preserva contexto del turno) | Practice Better (requiere crear aparte) |
| Reserva flexible/fuzzy | Doctolib ("Buscar turno" entre profesionales) | La mayoría requiere slot específico |

---

## 2. Vista de detalle del turno existente

Al hacer clic en un turno existente, **DrChrono ofrece la vista más completa**: una ventana multi-pestaña con pestaña de turno (paciente, profesional, consultorio, tipo, estado, notas), pestaña de facturación (códigos ICD-10, CPT/HCPCS), y pestaña de formularios/consentimientos. El estado se cambia desde un dropdown con **estados personalizados ilimitados**, cada uno con nombre, abreviatura y color propio.

**Jane App** despliega un panel lateral con botones de acción directa ("Arrived", "No Show", "Late Cancellation"), código de colores (**verde claro** = llegó + no pagó, **verde oscuro** = llegó + pagó, **rojizo** = no-show), y una sección "History & Status" que muestra quién creó la reserva, cambios de estado, recordatorios enviados y notificaciones. **Cliniko** muestra un pop-up con nombre, tipo de turno, hora, nota, y botones "Arrived" / "Did not arrive", más un ícono de nota cuando existe.

**El audit trail (historial de cambios)** es una funcionalidad crítica que pocos productos implementan bien. **Cliniko** tiene el mejor paper trail: "View log" muestra todos los cambios, quién los hizo y cuándo, desde la creación hasta cualquier modificación. **Jane App** registra creación, cambios de estado, recordatorios y notificaciones. **Acuity Scheduling** sorprende con un changelog detallado que incluye timestamps, información del usuario e IPs. DrChrono agrega tracking de duración en cada estado a través de su Appointments Dashboard. **SimplyBook.me, Practice Better y Calendly carecen de audit trail significativo por turno.**

**Las notas clínicas** se manejan de forma muy diferente según el producto. DrChrono integra notas clínicas completas con form builder, bloqueo de notas firmadas y firma de supervisión. Cliniko ofrece treatment notes con templates que incluyen body charts, checkboxes y secciones personalizables, con estados "Draft" y "Final" (final = bloqueado permanentemente). Practice Better tiene notas ricas con AI Charting Assistant. **La distinción clave es entre notas administrativas (visibles para la secretaria) y notas clínicas (solo para el profesional)** — Cliniko las separa explícitamente con "Medical alerts" privados y "Extra Information" visible para todo el staff.

**El estado de pago** se muestra de formas variadas. En Jane App, marcar "Arrived" **crea automáticamente una factura**, y el color del turno indica el estado de pago. Cliniko permite agregar pago directamente desde el pop-up del turno con auto-poblado de datos de facturación. DrChrono vincula la facturación al turno con códigos personalizables.

---

## 3. Transiciones de estado y check-in del paciente

**DrChrono es el único producto con un flujo de estados multi-paso completo y nativo**: Confirmed → Arrived → Checked In → In Session → Complete, más estados personalizados ilimitados. Su **Appointments Dashboard** muestra todos los turnos del día con estado actual, filtrable por estado/consultorio/fecha, y al expandir cada turno se ve el **desglose temporal de cada cambio de estado** (cuánto tiempo estuvo en cada estado). Esto permite medir tiempos de espera reales.

**SimplyBook.me** ofrece la segunda mejor solución con estados totalmente personalizables (nombre, descripción, color): "Client has arrived" → "Service in Progress" → "Client has paid and left". Requiere activar el Custom Feature correspondiente. **Jane App y Cliniko operan con un modelo binario** (Booked → Arrived / No Show) sin estados intermedios de "en consulta" o "completado".

**El check-in del paciente** tiene tres paradigmas:

**Check-in manual por secretaria**: Cliniko usa un botón "Arrived" en el pop-up del turno — al hacer clic, **suena un "ding" de audio en la computadora del profesional**. Jane App funciona igual pero con notificación visual. SimplyBook.me cambia el estado desde el calendario. En el ecosistema argentino, los productos como Docturno usan botones "Atender" y "Ausente" directamente en la agenda, donde "Atender" redirige al profesional a la historia clínica del paciente.

**Auto check-in por el paciente**: Jane App tiene **check-in por QR** — cartelería con código QR en sala de espera → paciente escanea → selecciona turno → check-in. El turno cambia a verde claro con timestamp, pero **la secretaria debe igual hacer clic en "Arrive"** para generar la factura. DrChrono ofrece **check-in por iPad kiosk** y portal del paciente (OnPatient), ambos actualizan el estado automáticamente.

**Marcado de inicio/fin de consulta por el profesional**: Solo DrChrono tiene botones nativos — cambiar a "In Session" y luego a "Complete" desde el dropdown o Dashboard. En Cliniko, el inicio implícito ocurre al abrir la treatment note; el fin al guardarla como "Final". Jane App funciona similar con chart entries.

**El manejo de no-show es manual en todos los productos sin excepción.** Ninguno ofrece marcado automático después de X horas. Los métodos son: botón "No Show" (Jane App, Calendly), botón "Did not arrive" (Cliniko), dropdown de estado (DrChrono), menú de 3 puntos (Practice Better). La prevención varía: recordatorios (todos), depósitos (SimplyBook.me, Practice Better), workflows de reconfirmación (Calendly, Zocdoc), y bloqueo de pacientes reincidentes (Doctolib). **ClickSalud innova con auto-cancelación**: si el paciente no confirma dentro de las 48h previas al turno, el turno se libera automáticamente y se notifica al staff.

---

## 4. Cancelación y reprogramación requieren políticas configurables

**Jane App lidera en gestión de cancelaciones** con un sistema altamente configurable: motivos de cancelación personalizables (Settings → Language → Admin Site: Cancellation Reasons), período de cancelación tardía (24h a 7 días), tarifas configurables (monto fijo, porcentaje del precio del tratamiento, o precio completo), y generación automática de factura por cancelación tardía. Los turnos cancelados aparecen **en gris** en el calendario con visibilidad toggleable desde el ícono de engranaje.

**La reprogramación tiene dos paradigmas fundamentales**: modificar el turno existente vs. crear uno nuevo. Jane App usa "Move" (modifica el existente, arrastra a nuevo horario) y "Copy" (crea uno nuevo). Cliniko modifica el existente con clic en "Reschedule". DrChrono también modifica el existente. **Para Turnera, la recomendación es modificar el existente pero conservar un registro del horario original** en el audit trail, ya que crear un turno nuevo pierde la trazabilidad.

**La visualización de turnos cancelados en el calendario** difiere notablemente. Jane App los muestra en gris (toggleable). DrChrono los muestra atenuados/dimmed con opción de ocultarlos completamente. **Cliniko los elimina del calendario** — solo quedan en el perfil del paciente y en reportes — lo cual es problemático porque la secretaria pierde visibilidad. Acuity y Calendly también los ocultan.

**La cancelación masiva de turnos futuros** es soportada por Jane App (desde la ventana de Recurring Appointments), DrChrono ("Edit all future appointments" → Delete), Practice Better ("Cancel series"), y Acuity (selección múltiple + "Cancel Selected"). **Cliniko permite cancelar pacientes de series recurrentes en bulk.** ConsultSmart, el software argentino tradicional, ofrece una funcionalidad crítica no encontrada en productos internacionales: **cambio masivo de profesional** — reasignar todos los turnos de un doctor a otro con notificación automática por WhatsApp/email a todos los pacientes afectados.

**Las tarifas de cancelación** están mejor implementadas en Jane App (override de monto fijo, porcentaje, o precio completo; cobro a tarjeta en archivo o cobro en próxima visita) y Practice Better (fee fijo o porcentaje de la sesión; cobro automático a tarjeta al marcar no-show). **Calendly explícitamente no puede hacer cumplir restricciones temporales** — su política de cancelación es solo informativa.

| Aspecto | Mejor producto | Peor producto |
|---------|---------------|---------------|
| Motivos de cancelación | Jane App (lista configurable + reportes) | Calendly (opcional, sin tracking) |
| Tarifas automáticas | Jane App (3 tipos de fee + auto-factura) | Calendly, Zocdoc (sin tarifas) |
| Visualización en calendario | Jane App (gris, toggleable) | Cliniko (desaparece del calendario) |
| Cancelación masiva | DrChrono (Edit All Future → Delete) | Calendly (individual solamente) |
| Política configurable | Practice Better (por servicio, 1h-7 días) | Calendly (informativa, no ejecutable) |

---

## 5. Turnos recurrentes: una brecha sorprendente en el mercado

**La mayoría de los productos argentinos no soportan turnos recurrentes**, lo que representa una oportunidad clara para Turnera. A nivel internacional, los patrones son:

**Cliniko ofrece la mejor implementación básica**: diario (cada N días), semanal (cada N semanas), quincenal, y mensual (misma fecha). **DrChrono agrega el mejor manejo de instancias individuales**: al editar un turno recurrente aparece "Edit this appointment only" vs. "Edit all future appointments", el modelo más intuitivo encontrado. Sus turnos recurrentes son "virtuales" — las instancias futuras no se guardan como turnos independientes hasta 7 días antes o hasta que se acceden, optimizando el rendimiento.

**Practice Better permite editar instancias individuales** (marcadas como "Edited") sin afectar la serie, pero si se modifica el horario de la serie, **todas las instancias futuras se eliminan y recrean**, incluyendo las editadas — un comportamiento potencialmente destructivo. **SimplyBook.me tiene el mejor manejo de conflictos** con tres modos configurables: "Not Allow" (bloquea si alguna fecha no está disponible), "Book Only Available" (salta fechas no disponibles), y "Add Appointments" (agrega fechas de reemplazo).

**Calendly no tiene turnos recurrentes** — una ausencia sorprendente que genera frustración constante en sus foros, especialmente de terapeutas y coaches. Zocdoc tampoco los soporta. **Acuity Scheduling permite que los pacientes elijan frecuencia durante la reserva online** (semanal, quincenal, mensual) — el único producto con booking recurrente del lado del paciente.

---

## 6. Lista de espera: Jane App define el estándar de oro

**Jane App tiene el sistema de lista de espera más sofisticado del mercado.** Cuando un turno se cancela, elimina o mueve, el sistema escanea automáticamente la lista de espera y coloca un **bloque negro ("Wait List cue")** en el calendario. Las notificaciones se envían automáticamente (SMS y/o email según preferencia del paciente) o manualmente. Los pacientes reciben un link para ver las aperturas y reservar con un clic (first-come-first-served). Incluye **buffer de administración** (15 min si quedan menos de 24h, 2h si quedan más de 24h), **período de acceso exclusivo** (configurable) antes de que el slot se abra al público, y los pacientes pueden auto-agregarse desde "My Account → Add a Waitlist Request".

**Doctoralia implementa un modelo de cascada** particularmente relevante para Argentina: cuando se cancela un turno ≥48h antes, el sistema envía SMS a hasta **10 pacientes en lista de espera secuencialmente** — si el primero no acepta, notifica al siguiente, y así sucesivamente. Este modelo maximiza la tasa de llenado sin requerir intervención manual.

**Cliniko tiene lista de espera manual** — sin notificaciones automáticas, la secretaria debe contactar a los pacientes manualmente. Pero permite seleccionar pacientes de la lista directamente durante la creación del turno ("Select from wait list"). **SimplyBook.me** envía emails automáticos pero solo se activa **a nivel de día completo**, no por slot individual.

**Acuity Scheduling, Calendly, DrChrono y Practice Better carecen de lista de espera** — una brecha significativa. La solución sugerida por Acuity es crear un calendario separado llamado "Waitlist" con disponibilidad superpuesta, un workaround frágil.

---

## 7. Sobreturnos y pacientes sin turno: una necesidad argentina

**El sobreturno es un concepto profundamente argentino** que no tiene equivalente directo en los productos internacionales. Cuando todos los slots están llenos, la secretaria agrega un turno extra para casos urgentes, aceptando que los tiempos de espera serán mayores. **Docturno/Cormos y ConsultSmart lo soportan nativamente** como tipo de turno específico con etiquetas visuales ("Sobreturno", "Urgente", "Primera visita"). **DigiDoc** va más allá: "Si tenés baches en el consultorio, la agenda los muestra como turnos virtuales de demanda espontánea."

A nivel internacional, las aproximaciones más cercanas son:

**SimplyBook.me** tiene el mejor soporte para walk-ins con su **módulo POS (Point of Sale)** diseñado específicamente para pacientes sin turno: la secretaria crea el turno y procesa el pago inmediatamente. El "Any Employee Selector" asigna al siguiente profesional disponible. **DrChrono** permite **sobreponer turnos** (overlapping appointments configurable), donde múltiples pacientes pueden reservar el mismo horario — útil para consultorios que manejan demanda espontánea. Se puede configurar un límite (ej: 3 pacientes por slot).

**Jane App y Cliniko no tienen botón de walk-in dedicado** — la secretaria simplemente crea un turno manual haciendo clic en cualquier slot, lo cual funciona pero carece de diferenciación visual. **Acuity, Calendly y Practice Better no tienen funcionalidad de walk-in.**

Para Turnera, es esencial implementar el sobreturno como tipo de turno de primera clase con: indicador visual distinto en el calendario (etiqueta o color diferenciado), capacidad de agendar fuera de la grilla normal de horarios, tracking separado en reportes para medir la frecuencia de demanda espontánea, y notificación al profesional de que se agregó un sobreturno.

---

## 8. Vista de lista y herramientas de gestión masiva

**Jane App ofrece la vista de lista más completa**: Reports → Appointments muestra nombre del paciente, ubicación, tratamiento, fecha del turno, fecha de reserva, estado y estado del chart. Los filtros incluyen ubicación, profesional, estado del chart (firmado/borrador/sin chart), estado del turno (Booked, Cancelled, Arrived, No Show, First Visit, Rescheduled, Checked In), y rango de fechas. Exporta a Excel/CSV.

**DrChrono complementa con su Appointments Dashboard**, que muestra todos los turnos del día con estado actual y permite cambiar estados inline. Al expandir cada turno se ve la **línea temporal completa de cambios de estado con timestamps y duración en cada estado** — invaluable para medir eficiencia operativa.

**SimplyBook.me es el único producto con acciones masivas reales desde la vista de lista**: selección múltiple por checkbox + "Cancel selected" para cancelación masiva, y exportación con **selección de columnas** (elegir qué campos exportar). **Cliniko** ofrece dos exports diferenciados: "Appointment Calendar" (datos del turno) y "Attendees" (datos del paciente incluyendo recordatorios enviados y fecha de creación).

Los **filtros estándar** encontrados a través de los productos son: rango de fechas, profesional, estado, tipo de turno, y ubicación/sede. Los filtros más avanzados incluyen: fuente de reserva (Zocdoc), estado de pago (DrChrono, Practice Better), estado de documentación clínica (Jane App), y paciente específico (DrChrono).

**Las acciones masivas son el área más débil** en general. Fuera de SimplyBook.me, las acciones masivas se limitan a exportación. **ConsultSmart (Argentina) ofrece un diferenciador clave**: cambio masivo de profesional con notificación automática a todos los pacientes afectados — una funcionalidad que ningún producto internacional implementa.

**Las listas imprimibles son una necesidad argentina** confirmada por los productos locales. Docturno exporta listas diarias a PDF/Excel en dos formatos: lista para el médico y lista para recepción. ConsultSmart también genera listas imprimibles. Esta funcionalidad puede parecer anticuada pero sigue siendo esencial en consultorios argentinos donde el profesional prefiere una hoja impresa al lado del teclado.

---

## Flujos específicos de WhatsApp y tracking multicanal

**WhatsApp es el canal dominante en Argentina** y su integración define la competitividad de cualquier sistema de turnos. Existen dos niveles de integración:

**Nivel 1 — Notificaciones**: recordatorios de turnos, confirmaciones, actualizaciones. Es el mínimo viable. AgendaPro, Doctoralia, MEDICLINE y la mayoría de productos argentinos operan en este nivel. El flujo estándar es: 48h antes → recordatorio con botones "Confirmar" / "Cancelar" → 24h antes → segundo recordatorio.

**Nivel 2 — Booking conversacional**: el paciente inicia y completa la reserva completa vía WhatsApp. ClickSalud lidera este segmento en Argentina con un **asistente AI 24/7** que permite booking, modificación y cancelación por lenguaje natural. Docturno/Cormos ofrece un chatbot de WhatsApp con **API oficial de WhatsApp Business** (afirma ser el único en LATAM con integración oficial). Medicloud tiene bot de WhatsApp AI como add-on costoso (~$150,000 ARS/mes).

**ClickSalud implementa el flujo de confirmación más sofisticado**: al reservar → email + WhatsApp con datos del médico y ubicación en Google Maps → a las 72h → recordatorio + "confirmá dentro de 48h o se cancela automáticamente" → a las 48h → alerta final con botón de confirmación directo → **si no confirma, el turno se libera automáticamente** y se notifica al staff.

**El tracking de fuente del turno** está mejor implementado en Zocdoc con un dashboard que desglosa reservas por: Marketplace, Google Business Profile, botón web y resultados patrocinados, con gráficos de "booking source over time" y breakdown de pacientes nuevos vs. existentes por canal. Para Turnera, cada turno debe tener un campo `source` (web/phone/whatsapp/chatbot/walk_in) visible en la vista de detalle y filtrable en la vista de lista, con dashboard de análisis por canal incluyendo: volumen por canal, tasa de no-show por canal, pacientes nuevos vs. existentes por canal, y horarios de mayor booking por canal.

---

## Flujos recomendados para Turnera

### 1. Flujo de creación de turno nuevo

**Patrón recomendado: Clic en calendario → Panel lateral → 3 campos → Guardar**

El flujo principal inicia con clic en un slot del calendario (modelo Jane App/Cliniko). Al hacer clic se abre un panel lateral derecho con:

- **Campo de búsqueda de paciente** (primer campo, con foco automático): buscar por **DNI, apellido, nombre, teléfono o email**. Autocompletado instantáneo. Si no existe, mostrar botón **"+ Nuevo paciente"** que expanda un formulario inline (modelo Doctolib) sin perder los datos del turno ya seleccionados. Campos mínimos del paciente nuevo: nombre, apellido, DNI, teléfono.
- **Tipo de consulta/prestación** (dropdown): filtra automáticamente según el profesional seleccionado.
- **Obra social/prepaga** (dropdown): se pre-llena si el paciente ya tiene una registrada. Opciones: "Particular" para pacientes sin cobertura.
- **Modalidad** (toggle): Presencial / Virtual. Default: presencial.
- **Motivo** (campo de texto opcional): breve descripción.
- **Notas internas** (campo de texto opcional): visibles solo para staff.
- **Fuente** (auto-detectada o seleccionable): web/teléfono/whatsapp/chatbot/walk-in.

**Campos mínimos para reservar**: Paciente + tipo de consulta (2 campos + clic en calendario). Todo lo demás es opcional. **Botón principal**: "Crear turno" (azul, prominente). Sin diálogo de confirmación — acción directa como Jane App y Cliniko. **Botón secundario**: "Crear turno + Crear otro" para agendar múltiples turnos seguidos.

**Funcionalidad adicional**: Botón **"Buscar disponibilidad"** (modelo Doctolib) para encontrar el próximo slot disponible con un profesional específico o en una especialidad. Soporte para **sobreturno**: botón "Agregar sobreturno" visible cuando todos los slots están ocupados, que crea un turno con etiqueta visual diferenciada (badge naranja "Sobreturno").

### 2. Vista de detalle del turno

**Patrón recomendado: Panel lateral completo con secciones colapsables**

Al hacer clic en un turno existente en el calendario, abrir panel lateral con:

- **Encabezado**: Nombre del paciente (link al perfil), badge de estado con color (Agendado=azul, Confirmado=verde, En espera=amarillo, En consulta=naranja, Completado=gris, No-show=rojo, Cancelado=gris tachado). **Botones de acción rápida** prominentes según el estado actual: Confirmar / Llegó / No vino / Cancelar.
- **Sección Datos del turno**: Profesional, fecha, hora, duración, tipo de consulta, modalidad, obra social, fuente.
- **Sección Notas** (colapsable): Notas administrativas (visibles para secretaria y profesional) + Notas clínicas (solo profesional, bloqueadas tras firma).
- **Sección Pago** (colapsable): Estado de pago (Pendiente/Pagado/Parcial), monto, método de pago, botón "Registrar pago".
- **Sección Historial** (colapsable): Timeline cronológico tipo audit trail mostrando cada evento: "Creado por [Secretaria] el [fecha] a las [hora]", "Confirmado vía WhatsApp el [fecha]", "Paciente llegó — marcado por [Secretaria]", "Consulta iniciada por [Dr. X]", etc. Modelo inspirado en Jane App + Cliniko.

**Estado editable desde la vista de detalle**: Dropdown o botones de acción que muestran solo las transiciones válidas desde el estado actual (no todas las opciones).

### 3. Transiciones de estado

**Patrón recomendado: Flujo lineal con botones contextuales**

Implementar el flujo completo: **Agendado → Confirmado → Llegó → En consulta → Completado**, más estados terminales: No-show, Cancelado (paciente), Cancelado (profesional), Reprogramado.

- **Agendado → Confirmado**: Se activa automáticamente cuando el paciente responde "Confirmar" vía WhatsApp, o manualmente por la secretaria con botón "Confirmar" en el turno.
- **Confirmado → Llegó**: Botón **"Llegó"** prominente en la vista del turno y en la vista de lista del día (modelo Cliniko con botón en pop-up). Al marcar "Llegó", **enviar notificación sonora y visual al profesional** (modelo Cliniko: audio ding). El turno cambia a color amarillo en el calendario.
- **Llegó → En consulta**: El profesional hace clic en **"Iniciar consulta"** desde su panel. El turno cambia a naranja. Se registra timestamp de inicio.
- **En consulta → Completado**: El profesional hace clic en **"Finalizar consulta"**. El turno cambia a gris/completado. Se registra timestamp de fin. Duración real calculada automáticamente.
- **No-show**: Botón **"No vino"** disponible a partir de los 15 minutos posteriores al horario del turno. **No automático** — la secretaria debe confirmar manualmente, pero el sistema puede mostrar una alerta visual (parpadeo o highlight) en turnos que superen los 15 min sin check-in. Opción de registrar cobro de no-show.
- **Auto-cancelación por no confirmación** (modelo ClickSalud): Si el paciente no confirma dentro de las 48h previas, mostrar alerta a la secretaria con opción de cancelar y liberar el slot automáticamente. Configurable por el consultorio.

**Dashboard de estados del día** (modelo DrChrono): Vista tipo semáforo mostrando todos los turnos del día con estado actual, tiempo en cada estado, y acciones rápidas. Esencial para la secretaria que gestiona el flujo del consultorio.

### 4. Cancelación y reprogramación

**Cancelación**:
- **Quién puede cancelar**: Secretaria (desde el sistema), paciente (vía WhatsApp o web), profesional (desde el sistema).
- **Motivo obligatorio**: Dropdown con motivos configurables + campo de texto libre "Otro motivo" (modelo Jane App). Los motivos no se comparten con el paciente.
- **Tarifa de cancelación**: Configurable por tipo de consulta — sin tarifa, monto fijo, o porcentaje del precio. Aplicable cuando la cancelación ocurre dentro del período de cancelación tardía (configurable: 24h, 48h, 72h). Generación automática de factura o débito a tarjeta registrada.
- **Visualización**: Turnos cancelados **visibles en el calendario en gris con texto tachado** (modelo Jane App). Toggle en configuración para mostrar/ocultar cancelados. Visible siempre en el perfil del paciente y en reportes.

**Reprogramación**:
- **Modificar el turno existente** (no crear uno nuevo): Botón "Reprogramar" abre selector de nueva fecha/hora. El turno conserva su ID, y el historial registra "Reprogramado de [fecha original] a [fecha nueva] por [usuario]". La fecha original se preserva en el audit trail.
- **Drag & drop** en el calendario para reprogramación rápida (modelo Jane App).

**Acciones masivas**: Implementar "Cancelar todos los turnos futuros de este paciente" y **"Reasignar turnos de un profesional a otro"** con notificación automática por WhatsApp a todos los pacientes afectados (modelo ConsultSmart). Esta funcionalidad es crítica para vacaciones, licencias y emergencias médicas.

### 5. Turnos recurrentes

**Patrón recomendado**: Al crear un turno, checkbox **"Repetir"** que despliega opciones:

- **Frecuencia**: Semanal, cada 2 semanas, cada 3 semanas, mensual (misma fecha), cada N días (personalizable).
- **Días de la semana**: Checkboxes para seleccionar días (si la frecuencia es semanal).
- **Fin de serie**: Por fecha de fin, por cantidad de repeticiones, o sin fin.
- **Manejo de conflictos** (modelo SimplyBook.me): "No crear si hay conflicto" / "Crear solo los disponibles" / "Crear todos y marcar conflictos". Default: crear solo los disponibles.
- **Edición individual vs. serie** (modelo DrChrono): Al editar un turno recurrente, preguntar "¿Editar solo este turno?" / "¿Editar este y todos los futuros?" / "¿Editar toda la serie?".
- **Cancelación de serie**: Botón "Cancelar serie" que muestra lista de turnos futuros con opción de seleccionar cuáles cancelar (modelo Practice Better, mejorado).

### 6. Lista de espera

**Patrón recomendado: Cascada automática estilo Doctoralia + cues visuales estilo Jane App**

- **Agregar a lista de espera**: Desde el perfil del paciente o desde un botón global "Lista de espera", registrar: paciente, profesional preferido (opcional), días/horarios preferidos, urgencia (normal/urgente), notas.
- **Detección automática**: Cuando un turno se cancela o reprograma, el sistema escanea la lista de espera buscando matches por profesional, día de la semana y franja horaria.
- **Notificación en cascada** (modelo Doctoralia): Enviar WhatsApp al primer paciente elegible. Si no responde en 2 horas, enviar al siguiente. Hasta **5 intentos secuenciales**. El mensaje incluye botón de reserva directa.
- **Indicador visual en calendario** (modelo Jane App): Bloque visual diferenciado en el slot liberado mostrando "Slot disponible — N pacientes en espera". Clic para ver lista y reservar directamente.
- **Panel de lista de espera**: Accesible desde la barra lateral, mostrando todos los pacientes en espera con filtros por profesional, urgencia y antigüedad.

### 7. Sobreturnos y walk-ins

**Patrón recomendado: Sobreturno como ciudadano de primera clase**

- **Botón "Sobreturno"** visible en la barra de acciones del calendario cuando todos los slots están ocupados. Permite crear un turno sin slot definido: se asocia al profesional y a un rango horario ("mañana" o "tarde") sin hora exacta.
- **Badge visual**: Los sobreturnos aparecen en el calendario con indicador naranja "ST" y se listan debajo del último turno regular del período.
- **Botón "Walk-in"** (o "Demanda espontánea"): Acceso rápido desde la barra superior. Crea un turno inmediato con hora = ahora, estado = "Llegó", fuente = "walk_in". Campos mínimos: paciente + profesional. Pensado para pacientes que llegan sin turno.
- **Source tracking**: Los sobreturnos y walk-ins se registran automáticamente con fuente correspondiente para análisis de demanda no programada.

### 8. Vista de lista de turnos

**Patrón recomendado: Tabla filtrable con acciones masivas**

**Columnas por defecto**: Fecha/hora, paciente (nombre + DNI), profesional, tipo de consulta, obra social, estado (badge con color), estado de pago, fuente, duración.

**Filtros** (barra superior): Rango de fechas (con presets: hoy, esta semana, este mes), profesional (dropdown multiselect), estado del turno (checkboxes), obra social, modalidad (presencial/virtual), fuente del turno, paciente (búsqueda).

**Acciones masivas** (con selección por checkbox): Confirmar seleccionados, cancelar seleccionados (con motivo obligatorio), enviar recordatorio por WhatsApp a seleccionados, exportar seleccionados a Excel/PDF.

**Vistas preconfiguradas**: "Turnos de hoy" (default para secretaria), "Pendientes de confirmar", "No-shows del mes", "Turnos por obra social" (para liquidación).

**Exportación**: Dos formatos de lista imprimible (modelo Docturno) — **lista para recepción** (todos los turnos del día con teléfono y obra social) y **lista para el profesional** (turnos con motivo de consulta y notas clínicas relevantes). Export a Excel con selección de columnas (modelo SimplyBook.me).

**Dashboard de análisis** (modelo Zocdoc Performance): Gráficos de turnos por fuente a lo largo del tiempo, tasa de ocupación de agenda, tasa de no-show por profesional/obra social/canal, pacientes nuevos vs. recurrentes por canal, tiempo promedio en cada estado (espera, consulta).

---

## Conclusión: las tres decisiones arquitectónicas que definirán a Turnera

**Primera: diseñar para la secretaria, no para el paciente.** El 80% de las interacciones del sistema serán de la secretaria. Jane App y Cliniko demuestran que optimizar para la recepción (3 clics para reservar, botones de acción rápida, atajos de teclado, drag & drop, listas imprimibles) genera más adopción que interfaces genéricas. La secretaria argentina además necesita: búsqueda por DNI, sobreturnos, cambio masivo de profesional, y listas imprimibles — funcionalidades que ningún producto internacional ofrece en conjunto.

**Segunda: implementar el flujo de confirmación por WhatsApp con auto-cancelación.** El modelo de ClickSalud (72h→48h→cancelación automática) es el más avanzado del mercado argentino. Combinado con la cascada de lista de espera de Doctoralia (notificar secuencialmente hasta 5-10 pacientes), Turnera puede minimizar slots vacíos de forma que ningún competidor argentino actual logra completamente. La integración con la API oficial de WhatsApp Business es imprescindible, no un nice-to-have.

**Tercera: construir el flujo de estados como un pipeline visible con métricas.** DrChrono es el único producto que mide cuánto tiempo pasa un paciente en cada estado. Para un consultorio argentino, saber que el tiempo promedio entre "Llegó" y "En consulta" es de 45 minutos es información accionable que ningún competidor local proporciona. Este dashboard de estados en tiempo real, con alertas de no-shows potenciales y métricas de eficiencia, posicionaría a Turnera como el primer sistema argentino de gestión de consultorio verdaderamente data-driven.