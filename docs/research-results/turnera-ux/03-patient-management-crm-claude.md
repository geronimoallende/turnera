# Gestión de pacientes en software de turnos médicos: análisis UX exhaustivo

Los sistemas de gestión de turnos médicos más avanzados comparten un patrón claro: **el paciente es el eje central de toda la experiencia**, no el turno. Productos como Epic, athenahealth, DrChrono y Jane App demuestran que las mejores prácticas de UX integran búsqueda instantánea, perfiles ricos con alertas visibles, creación inline durante la reserva, y un historial unificado de comunicaciones. Para el mercado argentino, donde el DNI es identificador universal, WhatsApp domina la comunicación, y las obras sociales/prepagas agregan complejidad única, Turnera tiene la oportunidad de construir una experiencia de secretaría médica que ningún producto local ha logrado completamente.

Este informe analiza **más de 20 productos reales** — desde plataformas enterprise como Epic y athenahealth hasta soluciones argentinas como ClickSalud, Medicloud y MEDICLINE — extrayendo patrones UX concretos en las 7 áreas investigadas.

---

## 1. Búsqueda de pacientes: el campo global accesible desde cualquier pantalla es el estándar de oro

La búsqueda de pacientes es la operación más frecuente de una secretaria médica. Los productos líderes convergen en un patrón claro: **una barra de búsqueda global persistente**, visible desde cualquier pantalla de la aplicación.

**DrChrono** implementa lo que llama "Hotspot Search": una barra en la **esquina superior derecha de toda página**, que permite buscar pacientes por nombre sin importar dónde esté el usuario. Si no encuentra resultados, muestra un enlace directo "Add New Patient". Además, recuerda los **últimos 5 pacientes** consultados en las últimas 24 horas. **NexHealth** coloca su barra de búsqueda global en la esquina superior izquierda, y al hacer clic en cualquier nombre de paciente — en Home, Pagos, Formularios o Agenda — se despliega un panel lateral con el perfil completo. **athenahealth** recomienda implementar un debounce en el autocompletado (detectar que el usuario dejó de escribir antes de ejecutar la búsqueda), un patrón técnico que mejora la performance sin sacrificar la sensación de inmediatez.

Los campos de búsqueda varían significativamente. **Clinicminds** permite buscar por "casi cualquier parámetro": apellido, nombre, fecha de nacimiento, teléfono, email y número de seguridad social. **Jane App** soporta nombre, teléfono y fecha de nacimiento. **Acuity Scheduling** busca por nombre, teléfono y email. **Tebra** permite buscar ingresando las primeras 2-3 letras del nombre o la fecha de nacimiento completa, con resultados que se auto-completan mientras se escribe, mostrando hasta **20 resultados por página** con indicador de estado activo/inactivo.

En cuanto a **detección de duplicados**, Epic es el referente absoluto con su Enterprise Master Patient Index (EMPI), que utiliza algoritmos de matching **determinístico y probabilístico** para manejar errores de escritura, variaciones de nombre y convenciones culturales. **Jane App** ofrece un reporte de "Duplicados Potenciales" basado en nombres, fechas de nacimiento y número de salud. **SimplyBook.me** tiene un botón explícito "Merge clients" en la lista de pacientes. **athenahealth** provee un endpoint API específico (`enhancedbestmatch`) con lógica superior de matching que recomiendan ejecutar **antes de cada creación** de paciente.

En el contexto argentino, **MEDICLINE** utiliza un enfoque innovador: el paciente se identifica enviando su **DNI por WhatsApp** al chatbot, que lo reconoce instantáneamente. Este patrón aprovecha la unicidad del DNI como clave de deduplicación natural.

---

## 2. El perfil del paciente oscila entre panel lateral rápido y ficha completa en página dedicada

Los productos más maduros implementan un sistema de **dos niveles de detalle**: una vista rápida (panel lateral o popup) para consultas durante la agenda, y una página completa para gestión administrativa profunda.

**NexHealth** ejemplifica el mejor patrón de vista rápida: al hacer clic en cualquier nombre de paciente, se despliega un **panel deslizante lateral** (slide-out) que muestra en la parte superior el estado de verificación de seguro, formularios pendientes, próximos turnos y pagos debidos. En la parte inferior, tres pestañas organizan la información: **Historial** (feed cronológico de todas las acciones), **Mensajes** (conversación bidireccional por texto) y **Turnos** (pasados y futuros). Un menú desplegable "Acciones" en la esquina superior derecha permite enviar formularios, solicitar pagos, editar información y gestionar preferencias de comunicación.

**Jane App** implementa un "Patient Profile Dashboard" con una **barra de métricas en vivo** en la parte superior: Total de Reservas, Próximos Turnos, Reclamos Pendientes, Saldo Privado Pendiente, Crédito y Balance. Cada métrica es clicable y navega a la sección correspondiente. El perfil se organiza en pestañas: Perfil Principal, Configuración, Turnos (filtrable por rango de fechas, estado, ubicación, profesional y estado de facturación), Charts (registros clínicos con entradas fijadas y alertas médicas) y Facturación (pólizas, compras, pagos).

**Clinicminds** usa una estructura de **pestañas clínicas**: Consulta → Examen Físico → Historia Médica → Consentimientos → Tratamientos → Dibujos → Fotos → Facturas. Enfatiza una "vista 360°" que incluye turnos, cancelaciones, ausencias, registros de tratamiento, fotos, formularios firmados y facturas en un solo lugar.

**DrChrono** organiza la página de demografía del paciente en **cuatro pestañas**: Demografía, Seguros, Autorizaciones y Flags del Paciente. Una navegación lateral izquierda da acceso a Elegibilidad, Notas Clínicas, Comunicaciones y Documentos. El encabezado del paciente es personalizable.

**Epic** implementa el estándar enterprise con un **banner persistente** del paciente que muestra identificadores clave (nombre, fecha de nacimiento, MRN y FYI flags) visible en **todas las pantallas y módulos**. Su "Appointment Desk" centraliza turnos programados/pasados, solicitudes y actividades de registro.

Para la **organización del historial de turnos**, la mayoría usa tablas filtrables (Jane App, Tebra) o feeds cronológicos (NexHealth, Doctoralia). **Medilink** (Healthatom) destaca por mostrar turnos y tratamientos "cronológicamente para una toma de decisiones informada a lo largo del tiempo", con una línea temporal visual. **Healthie** permite a los administradores **configurar qué componentes aparecen y en qué orden** en el perfil del paciente — el máximo de flexibilidad.

En cuanto a **notas y etiquetas**, Jane App implementa notas "Starred" (con estrella naranja) que persisten en todos los turnos futuros del paciente y aparecen como un ícono de burbuja de diálogo en los bloques de turno del calendario. **SimplyBook.me** ofrece tags con colores personalizados y nombres configurables, administrables desde una página central.

---

## 3. Creación de pacientes durante la reserva: el flujo inline con campos mínimos es imprescindible

El patrón UX más eficiente para la secretaria es la **creación inline** — poder registrar un nuevo paciente sin salir del flujo de reserva de turno.

**SimplePractice** ofrece el flujo más limpio: al hacer clic en un slot vacío del calendario, se abre un menú "Nuevo Turno" donde se puede **seleccionar un paciente existente O crear uno nuevo** directamente. Después de crear el paciente, el sistema solicita automáticamente enviar formularios de intake (consentimientos, historia clínica). **DrChrono** toma un camino similar: si la búsqueda en el Hotspot no encuentra resultados, aparece inmediatamente un enlace "Add New Patient" que permite crear la ficha sin cambiar de contexto. **Jane App** permite lo mismo desde el calendario: al seleccionar un slot vacío, si la búsqueda no retorna resultados, ofrece "Add a new patient".

**Tebra** implementa un flujo particularmente inteligente con su botón **"Save & Schedule"**: después de crear un registro de paciente con los campos mínimos (nombre, apellido, fecha de nacimiento), este botón abre inmediatamente la interfaz de agenda para programar el turno. También ofrece "Save & Add Policy" (crear y agregar seguro) y "Save & Add Case" (crear y agregar caso), permitiendo a la secretaria elegir el siguiente paso lógico.

Los **campos mínimos** varían: nombre y email es el estándar en plataformas de booking general (Acuity, SimplyBook.me), mientras que las plataformas médicas agregan fecha de nacimiento como requisito (Jane App, SimplePractice, Tebra). **NexHealth** recomienda explícitamente el patrón "buscar primero, crear si no existe" en su API para evitar duplicados.

Para **completar el perfil después**, los productos usan varios mecanismos: Jane App envía emails de bienvenida solicitando configurar cuenta y completar formularios de intake. **AgendaPro** y **Doctoralia** envían cuestionarios previos a la visita. **Tebra** genera formularios digitales de intake enviados antes de la consulta. **NexHealth** envía formularios personalizados automáticamente según el tipo de turno, estado del paciente o código de procedimiento — las respuestas mapean directamente a los campos del perfil, eliminando doble carga de datos.

En Argentina, **ClickSalud** implementa "Recepción Express" — un flujo de check-in rápido que complementa la creación inicial con datos mínimos. **Argensoft** tiene una app dedicada para secretarias (SITA) separada de la app del médico, optimizada para este flujo de creación rápida.

---

## 4. Gestión de obras sociales y prepagas: el desafío más complejo y menos resuelto del mercado argentino

La gestión de seguros médicos es donde los productos internacionales y argentinos divergen más dramáticamente. Los sistemas norteamericanos manejan insurance plans con verificación electrónica en tiempo real; los argentinos enfrentan un ecosistema fragmentado de **cientos de obras sociales**, cada una con sus propias reglas de autorización, nomencladores y coseguros.

**Epic** y **athenahealth** representan el estado del arte en verificación de seguros. athenahealth usa **OCR con inteligencia artificial** para leer tarjetas de seguro fotografiadas y auto-completar campos. Su verificación de elegibilidad en tiempo real muestra cobertura activa, beneficios, montos de copago y deducible, y marca automáticamente cuando se requiere autorización previa. Epic va más allá: sus **árboles de decisión** leen datos del seguro del paciente y **filtran automáticamente** proveedores y ubicaciones que no aceptan ese plan, eliminando errores de agenda.

**DrChrono** tiene una pestaña dedicada de Seguros dentro del perfil del paciente, soportando seguro primario, secundario y terciario. Su verificación de elegibilidad en tiempo real (RTE) se puede ejecutar desde el chart del paciente **o directamente desde la ventana del turno**. La pestaña de Autorizaciones centraliza el tracking de autorizaciones con alertas de vencimiento.

**Jane App** implementa políticas de seguro por paciente con campos para aseguradora, nombre de póliza, número de reclamo, números de grupo/plan, códigos de facturación predeterminados, fecha de vencimiento y **máximo de tratamientos** — el sistema cuenta visitas facturadas bajo cada póliza y notifica cuando se alcanza el límite.

En el ecosistema argentino, **ClickSalud** tiene la implementación más madura: nomencladores por obra social (OSDE, Swiss Medical, Galeno, etc.), convenios por plan (cada OS tiene múltiples planes con diferente cobertura), **importación de aranceles por Excel** con validación automática, y generación automática de facturas. **Emprenet/Blipdoc** ofrece un módulo completo de auditoría de obras sociales con nomenclador nacional de prestaciones médicas y liquidación de honorarios.

A nivel enterprise, sistemas como **Gecros** y **GESTOS** (diseñados para las propias obras sociales) manejan: padrón de afiliados con integración AFIP, emisión de órdenes de consulta/prácticas/recetarios con o sin recibo de coseguro, y cobro de coseguro vía Mercado Pago. La **Superintendencia de Servicios de Salud (SSSalud)** provee una consulta pública de padrón por DNI o CUIL que cualquier sistema puede consumir para verificar la afiliación de un paciente.

Los datos típicos de la credencial que debe almacenar un sistema argentino incluyen: **número de afiliado** (ID único de la OS), **plan** (ej. OSDE 210, 310, 410, 510), **código de obra social** (ej. Galeno = 819), **condición** (titular vs. familiar) y **DNI** como referencia cruzada obligatoria. El coseguro varía por obra social, plan y tipo de prestación, y algunos productos como GESTOS lo manejan como ítem separado que puede desacoplarse de la factura principal.

---

## 5. Alertas y listas negras: tres niveles de severidad visual es el patrón más efectivo

Los mejores sistemas de alerta sobre pacientes problemáticos comparten una arquitectura de **severidad graduada** con indicadores visuales prominentes en múltiples puntos del flujo de trabajo.

**Clinicminds** implementa el sistema más claro con **tres niveles visuales**: una barra **amarilla** de "Atención" para información que los profesionales deben conocer, una barra **roja** de "Advertencia" para información crítica, y una etiqueta **"No Bienvenido"** que directamente **impide programar nuevos turnos**. Además, ofrece badges configurables (rojo y naranja) vinculados a respuestas de cuestionarios médicos que disparan notificaciones por email a los profesionales antes de los turnos.

**DrChrono** usa "Patient Flags" como notas digitales adhesivas con una función crítica: el checkbox **"Alert Flag"**. Cuando está activado, aparece una **ventana popup de alerta** cada vez que se intenta programar un turno para ese paciente, abrir su chart, o seleccionar su turno en el calendario. Cada aparición se registra en un **log de auditoría** con timestamps y usuario. Los flags también aparecen como íconos en los bloques de turnos del calendario.

**Epic** tiene el sistema más robusto a nivel enterprise: **FYI Flags** en el banner persistente del paciente (visible en todos los módulos), incluyendo "Disruptive Behavior Patient Chart Advisory" que aparece durante el check-in con recomendaciones de acción, "Patient Safety Flag" para riesgo de violencia, e "Identity Theft FYI Flag" que requiere verificación adicional de identidad. Los flags son gestionados por un **comité multidisciplinario** (Seguridad, Gestión de Riesgo, Psiquiatría, Trabajo Social) y se revisan cada seis meses.

**SimplyBook.me** y **Acuity Scheduling** ofrecen mecanismos más simples pero efectivos: botones explícitos de **"Bloquear/Desbloquear"** cliente. En SimplyBook.me, un cliente bloqueado no puede reservar **y no recibe comunicaciones promocionales**. Acuity permite banear clientes específicos del booking online.

**Jane App** usa un enfoque basado en notas: las notas "Starred" (con estrella) persisten en **todos los turnos futuros** del paciente y son visibles como ícono de burbuja en el calendario, funcionando como advertencia permanente.

En el mercado argentino, el patrón dominante es más preventivo que punitivo: **auto-cancelación de turnos** si el paciente no confirma (ClickSalud), requerimiento de **seña/depósito vía Mercado Pago** (Turnito, varios), y **estados de turno con código de colores** en la agenda (confirmado, pendiente, ausente). Pocos productos locales implementan un sistema formal de blacklist.

---

## 6. CRM médico: las etiquetas de color, el tracking de referidos y el análisis de frecuencia son las funciones más valiosas

Las funcionalidades CRM en software médico siguen siendo un área de diferenciación donde pocos productos alcanzan profundidad real, especialmente en el segmento de pequeñas y medianas clínicas.

**SimplyBook.me** tiene el sistema de **tags más completo** entre las plataformas de scheduling: etiquetas con colores y nombres personalizados, múltiples tags por paciente, una página central de administración de tags donde se pueden ver todos los pacientes por tag, clonar, renombrar, cambiar colores, eliminar y **fusionar tags similares**. Se pueden usar para clasificar niveles ("Plata", "Oro", "Platino"), preferencias de profesional/servicio/horario, opt-in de marketing, y segmentos de campaña. La limitación es que solo permite filtrar por un tag a la vez.

**Jane App** destaca en **tracking de referidos**: un campo de fuente de referencia configurable en el perfil del paciente, con dropdown editable en configuración (los pacientes lo seleccionan durante el booking online, con opción "Otro" para texto libre). El **Reporte de Referidos** muestra cantidad de pacientes e ingresos por fuente de referencia, filtrable por profesional. También ofrece un "Top Patients Report" mostrando los **100 pacientes principales** por cantidad de reservas con columnas de Reservas, Asistencias e Ingresos por Tratamiento.

**Epic Cheers** es el único módulo CRM enterprise verdadero entre los productos analizados: insights profundos sobre poblaciones atendidas, preparación proactiva de necesidades del paciente, mensajería targetizada vía MyChart, y herramientas de engagement competitivo. Su **Fast Pass** automatiza la oferta de turnos a pacientes en lista de espera — WakeMed reportó **75,000 visitas adicionales anuales** usando esta función.

**Solutionreach** implementa una función de **"Refer-a-Friend"** con botones en emails, textos, newsletters y encuestas. También permite segmentar pacientes por criterios específicos (edad, código de procedimiento, género) para comunicaciones grupales, y tiene un sistema de **recall automático** que identifica pacientes con turnos vencidos.

En cuanto a **tracking financiero**, athenahealth y Tebra ofrecen las vistas más completas: el Workflow Dashboard de athenahealth muestra pagos pendientes, seguros no verificados y elegibilidad inactiva como excepciones para la recepción. Jane App muestra "Private Outstanding" y "Credit" directamente en el dashboard del perfil del paciente.

**Acuity Scheduling** aporta un dato interesante para análisis de frecuencia: su exportación de clientes incluye una columna **"Days since last appointment"** — un campo simple pero útil para identificar pacientes que no vuelven.

**AgendaPro** implementa "Rebound Marketing": un sistema que identifica al **20% de clientes que genera el 80% de ingresos**, segmenta por comportamiento, frecuencia y valor histórico, y envía campañas automatizadas de reactivación por WhatsApp, SMS y email.

En Argentina, **Medesk** ofrece un módulo de CRM Médico dedicado con tags de pacientes y seguimiento del journey desde primer contacto hasta tratamiento. **Gendu** incluye "segmentación de clientes" como función core. La mayoría de los productos locales, sin embargo, carecen de clasificación VIP/regular/nuevo como función nativa.

---

## 7. Historial de comunicaciones: la conversación bidireccional integrada al perfil del paciente marca la diferencia

El historial de comunicaciones por paciente es una de las funcionalidades donde la brecha entre productos es más evidente. Los mejores integran **toda la comunicación en un feed unificado** dentro del perfil; los más básicos solo envían recordatorios automáticos sin registro visible.

**NexHealth** tiene la implementación más elegante: su pestaña "Messages" dentro del panel deslizante del paciente muestra una conversación que se describe como **"hilos de email: ves el nombre del paciente en una burbuja y se abre un largo historial de mensajes, incluyendo mensajes automatizados"**. Soporta **texting bidireccional** — los pacientes responden con preguntas y las respuestas aparecen directamente en NexHealth, todo con cumplimiento HIPAA. Los mensajes automatizados (recordatorios, recalls, solicitudes de pago) y manuales aparecen en el mismo historial.

**Clinicminds** ofrece un botón "Communication log" dentro del perfil del paciente que muestra una **lista cronológica de todos los emails y SMS enviados**, con la posibilidad de hacer clic en cada mensaje para ver el contenido detallado. Soporta más de 40 tipos de mensajes automatizados.

**DrChrono** tiene una pestaña "Communication" en el chart del paciente que muestra mensajes del portal OnPatient, recordatorios enviados y logs de llamadas telefónicas. Desde la misma pestaña se pueden enviar nuevos mensajes con adjuntos de hasta 100MB.

**Solutionreach** implementa "SR Conversations" con **priorización de mensajes**: cada mensaje entrante puede ser marcado con flag y priorizado para decidir cuáles requieren respuesta más rápida. Los mensajes se sincronizan automáticamente con la base de pacientes — los pacientes existentes no necesitan identificarse en cada conversación.

**Jane App** mantiene un "Communications Log" dedicado en los perfiles de pacientes mostrando un registro cronológico de emails y SMS enviados, complementado por su función de "Jane Messaging" para chat seguro bidireccional.

**Acuity Scheduling** ofrece un enfoque granular por turno: cada cita tiene un **changelog cronológico** que muestra todas las notificaciones enviadas (confirmaciones, recordatorios, follow-ups, reprogramaciones) con timestamps e IPs. Es menos útil para ver la historia completa del paciente pero excelente para auditar comunicaciones de un turno específico.

En el ecosistema argentino, la realidad es que **WhatsApp domina completamente** con tasas de apertura superiores al **90%** (vs. mucho menor para email y SMS). El flujo típico de recordatorios es: confirmación inmediata al reservar + recordatorio a 48 horas + recordatorio a 24 horas. Productos como **DocTurno** reportan 100% de tasa de entrega con WhatsApp Business API oficial. Los costos de META son relevantes: aproximadamente **$5 USD/mes** por encima de las 1,000 conversaciones gratuitas. Muchas secretarias argentinas históricamente usaban su WhatsApp personal para recordar turnos manualmente — los testimonios de usuarios mencionan que "antes me llevaba horas, ahora es automático".

Un hallazgo relevante: **ningún producto investigado muestra un historial completo de conversaciones de WhatsApp dentro del perfil del paciente** de manera nativa. Los sistemas envían mensajes por WhatsApp pero no integran las respuestas del paciente en un log unificado dentro de la plataforma — esta es una oportunidad significativa.

---

## Recomendaciones de UX de pacientes para Turnera: diseño centrado en la secretaria argentina

Basándose en el análisis de más de 20 productos y las particularidades del mercado argentino, estas son las decisiones de diseño concretas recomendadas para Turnera.

### Búsqueda de pacientes

Implementar una **barra de búsqueda global persistente** (estilo DrChrono Hotspot) visible en toda pantalla — calendario, lista de turnos, perfil de paciente. La búsqueda debe indexar **DNI** (campo primario, único en Argentina), **nombre/apellido** (con matching parcial y tolerancia a tildes), **teléfono celular** (formato argentino: +54 9 11 XXXX-XXXX) y **número de afiliado** de obra social. El DNI debe ser la clave de deduplicación primaria — si una secretaria ingresa un DNI existente, el sistema debe mostrar inmediatamente el paciente encontrado con opción de "¿Es este paciente?". Mostrar los **últimos 5-8 pacientes consultados** debajo de la barra como acceso rápido (patrón DrChrono). Los resultados de búsqueda deben mostrarse como tarjetas compactas con: nombre, DNI, obra social/prepaga, y un indicador de estado (activo, blacklist, deuda pendiente) — máximo **8 resultados** visibles antes de scroll.

### Perfil del paciente en dos niveles

Implementar el modelo **panel lateral + página completa** (patrón NexHealth). Al hacer clic en un paciente desde el calendario o la búsqueda, se abre un panel deslizante lateral derecho con: encabezado mostrando nombre, DNI, obra social y plan, indicadores de clasificación CRM (nuevo/regular/VIP/referido con badge de color), **alertas visibles** (blacklist en rojo, deuda en amarillo, muchas ausencias en naranja), y tres pestañas: Turnos (próximos + historial), Notas/Tags, y Comunicaciones (historial de WhatsApp/email). Un botón "Ver perfil completo" lleva a la página dedicada con secciones scrolleables: Datos Personales (nombre, DNI, fecha de nacimiento, teléfono, email, dirección), Obra Social/Prepaga (nombre de OS, número de afiliado, plan, titular/familiar, fecha de vencimiento credencial), Historial de Turnos (tabla filtrable por fecha, profesional, especialidad, estado), Notas y Tags, Historial de Pagos/Coseguros, e Historial de Comunicaciones.

### Creación inline durante la reserva

Cuando la secretaria hace clic en un slot vacío del calendario, el flujo debe ser: (1) barra de búsqueda de paciente, (2) si no existe → botón prominente **"+ Nuevo Paciente"** que despliega un formulario inline con campos mínimos obligatorios: **nombre, apellido, DNI y teléfono celular**. Estos cuatro campos son suficientes para reservar — el DNI permite deduplicación y la celular permite enviar el recordatorio por WhatsApp. Campos opcionales visibles pero no requeridos: email, fecha de nacimiento, obra social. Después de guardar, el sistema debe mostrar un **badge "Perfil incompleto"** en el paciente hasta que se completen obra social y fecha de nacimiento, con un link directo para completar. Implementar el patrón Tebra de acciones encadenadas: "Guardar y Agendar", "Guardar y Agregar Obra Social".

### Gestión de obras sociales y prepagas

Diseñar el módulo de obra social con **tres entidades separadas**: (1) un catálogo configurable por clínica de obras sociales aceptadas con sus planes y aranceles, (2) la cobertura del paciente (OS, plan, número de afiliado, condición titular/familiar, foto de credencial), y (3) el estado de autorización por turno/prestación. Permitir **subir foto de la credencial** desde el celular (patrón athenahealth). Incluir un campo de **coseguro esperado** calculado según OS + plan + tipo de prestación, visible al momento de agendar el turno para que la secretaria informe al paciente. Considerar integración futura con la **API pública de SSSalud** para validar afiliación por DNI. Almacenar el histórico de obras sociales del paciente (pacientes cambian de OS frecuentemente en Argentina). En el calendario, mostrar un **indicador visual** del tipo de cobertura (particular, OS, prepaga) con un ícono o color en el bloque del turno.

### Sistema de alertas y blacklist con tres niveles

Implementar el modelo Clinicminds de **tres niveles de severidad**: (1) **Nota informativa** (ícono azul) — información útil como "prefiere turno a la mañana" o "viene con su madre", visible en el panel lateral del paciente. (2) **Advertencia** (badge amarillo/naranja) — paciente con historial de ausencias (mostrar contador: "3 ausencias en últimos 6 meses") o deuda pendiente de coseguro, visible en el panel lateral y como **popup al intentar agendar** (patrón DrChrono Alert Flag). (3) **Blacklist** (badge rojo) — paciente bloqueado, el sistema **impide agendar nuevos turnos** (patrón Clinicminds "Not Welcome") y muestra el motivo. El **contador de ausencias** debe actualizarse automáticamente. Definir un umbral configurable por clínica (ej. 3 ausencias en 90 días) que dispare una sugerencia automática de "Considerar agregar a lista de advertencia". En el calendario, los turnos de pacientes con advertencia o blacklist deben tener un **indicador visual en el bloque** (borde rojo o ícono de alerta).

### CRM: clasificación, tags y tracking de referidos

Implementar **clasificación CRM predefinida** con cuatro categorías: Nuevo (primera visita, badge verde), Regular (paciente recurrente, sin badge especial), VIP (badge dorado, configurable por la clínica), y Referido (badge azul, con campo "Referido por" que acepta nombre de otro paciente o fuente externa). Las categorías deben mostrarse como **badges de color** en el panel lateral y en los bloques del calendario. Agregar un sistema de **tags libres con colores** (patrón SimplyBook.me) para clasificaciones propias de cada clínica: "diabético", "requiere más tiempo", "familiar del Dr. García", etc. Los tags deben ser filtrables en la lista de pacientes. Implementar métricas automáticas visibles en el perfil: **"Última visita: hace X días"** y **"X visitas en los últimos 12 meses"** (patrón Acuity "Days since last appointment" + patrón Jane App "Top Patients"). Para tracking financiero, mostrar **saldo pendiente de coseguros** en el perfil y en el panel lateral, con indicador visual cuando hay deuda.

### Historial de comunicaciones centrado en WhatsApp

Dado que WhatsApp es el canal dominante en Argentina (>90% de apertura, 67% de pacientes lo prefieren sobre llamadas), diseñar el historial de comunicaciones como un **feed tipo chat** dentro del perfil del paciente. Mostrar cronológicamente: recordatorios automáticos enviados (con estado de entrega: enviado, recibido, leído), confirmaciones/cancelaciones del paciente, mensajes manuales enviados por la secretaria, y emails enviados. Cada entrada debe mostrar canal (WhatsApp/email), fecha/hora y estado. Desde el perfil, incluir botones de acción directa: **"Enviar Recordatorio"** (dispara el template de recordatorio por WhatsApp), **"Enviar Mensaje"** (abre composer para WhatsApp manual), y **"Enviar por Email"**. En la vista de detalle de turno, mostrar un resumen de comunicaciones relacionadas con ese turno específico (patrón Acuity changelog). Implementar **templates de mensajes de WhatsApp** configurables por la clínica: recordatorio, confirmación, cancelación, solicitud de reprogramación, aviso de deuda, mensaje de bienvenida para nuevos pacientes. La oportunidad diferencial de Turnera es ser el primer producto argentino que **integre el historial de respuestas** de WhatsApp dentro del perfil del paciente, no solo los envíos.

### Principios transversales de diseño

El usuario principal es la **secretaria médica**, no el doctor. Cada decisión de diseño debe optimizar para su flujo de trabajo: atender teléfono/WhatsApp mientras agenda turnos, verificar cobertura mientras atiende al paciente en recepción, y facturar a obras sociales al final del día. El **calendario es la home** (consenso universal entre todos los productos analizados), con código de colores por estado del turno (confirmado, pendiente, ausente, cancelado — patrón universal) y por tipo de cobertura. Usar el **DNI como clave primaria** del paciente en toda la base de datos, con unicidad estricta por clínica. Cada clínica tiene su tabla de pacientes propia — si un paciente va a dos clínicas que usan Turnera, son dos registros independientes (modelo clinic-owned). Asegurar que el 100% de la interfaz use terminología argentina: "turno" (no "cita"), "obra social" y "prepaga" (no "seguro"), "coseguro" (no "copago"), "DNI" (no "ID"), "celular" (no "móvil"), "secretaria" (no "recepcionista"). Precios siempre en pesos argentinos con integración Mercado Pago nativa.