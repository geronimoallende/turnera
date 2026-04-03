# Guía completa de onboarding y migración para una turnera médica en Argentina

**El éxito de una turnera SaaS no se define en el producto sino en las primeras cuatro semanas de uso.** El 75% de los usuarios abandonan un software nuevo en la primera semana si no reciben un onboarding efectivo, y en el contexto argentino —donde el 80% de los centros de salud todavía usan registros en papel— la barrera no es tecnológica sino humana. Esta guía cubre desde cómo capturar datos de un cuaderno de turnos hasta cómo escalar el onboarding cuando AlthemGroup pase de 5 a 50 clínicas. Cada sección está pensada para el ecosistema argentino: obras sociales, prepagas, PAMI, DNI, WhatsApp como canal dominante y Mercado Pago como medio de cobro. Al final se incluyen oportunidades concretas de expansión a LATAM.

---

## 1. Cómo gestionan sus datos hoy los consultorios argentinos

### El consultorio con papel: cuadernos, fichas y agendas físicas

Cerca del **80% de los centros de salud argentinos todavía trabajan con registros en papel**. Un consultorio chico típico tiene tres elementos: una *agenda de turnos* (planificador diario o semanal donde la secretaria escribe nombre, teléfono y horario del paciente), *fichas de pacientes* (tarjetas de cartón organizadas alfabéticamente en un fichero con nombre, DNI, obra social, número de afiliado y notas clínicas), y las *historias clínicas en papel* archivadas en carpetas que por ley deben conservarse un mínimo de **10 años** (Ley 26.529).

Los problemas son predecibles pero severos: letra ilegible, pérdida de fichas, imposibilidad de acceso remoto, cero estadísticas sobre ausentismo o demografía de pacientes, y un riesgo constante de extravío o deterioro. El dato más importante para la migración es que **la información está dispersa y no normalizada**: un mismo paciente puede aparecer en la agenda con "María García", en la ficha como "GARCIA, MARIA" y en el cuaderno de la secretaria como "la señora que viene los martes".

### El consultorio con Excel: un paso intermedio con límites claros

Los consultorios que dieron un primer paso digital suelen usar planillas con dos hojas: una de turnos (fecha, hora, nombre del paciente, teléfono, obra social, motivo, estado asistió/no asistió, observaciones) y una base de datos de pacientes (apellido y nombre, DNI, fecha de nacimiento, teléfono, celular, email, obra social, número de afiliado, plan, dirección). Las más sofisticadas incluyen BUSCARV para cruzar datos y macros para vista de calendario.

Los límites del Excel son estructurales: **no permite acceso remoto** (salvo que usen Google Sheets, que es raro), no tiene backups automáticos, no valida datos (cualquier formato entra en cualquier campo), no envía recordatorios, y sobre todo no permite acceso simultáneo. Un dato clave para la migración: la calidad de los datos en Excel varía enormemente. Algunos consultorios tienen bases razonablemente limpias; otros tienen duplicados masivos, campos vacíos y formatos inconsistentes.

### El consultorio con software existente: un mercado fragmentado

El ecosistema de software de turnos en Argentina incluye más de 20 soluciones activas. Los principales competidores son **Turnito** (freemium, fuerte en cobro anticipado con Mercado Pago), **Medicloud** (el más completo en funcionalidad clínica, con receta electrónica), **Gendu** (el más económico, desde $5.900 ARS/mes), **Doctoralia** (marketplace con directorio de pacientes, pricing premium), **AgendaPro** (suite integral pero con precios en dólares, originaria de Chile) y **Argensoft** (enterprise, +300 centros). La mayoría **no ofrece exportación prominente de datos** — algunos como XREX permiten exportar a Excel y PDF, DigiDoc genera PDFs descargables, y Gestión Salud trabaja con archivos PDF/XLSX/DOCX. Esta falta de portabilidad es una oportunidad competitiva.

### El conocimiento tácito: lo que vive en la cabeza de la secretaria

Este es el dato más valioso y el más difícil de capturar. La secretaria médica típica de un consultorio argentino lleva en su cabeza: **preferencias de pacientes** ("Doña María solo viene a la mañana", "el señor González necesita el último turno porque trabaja hasta las 5"), **quirks del médico** ("el Dr. Rodríguez siempre arranca 20 minutos tarde, agendá en consecuencia", "la Dra. López no atiende PAMI los viernes"), **gestión de sobreturnos** (qué médicos toleran pacientes extra y en qué horarios), **particularidades de obras sociales** (cuáles necesitan autorización previa, cuáles piden orden de consulta), **confiabilidad de pacientes** (quiénes son ausentistas crónicos, dato que nunca se registra formalmente), **contactos informales** (números de teléfono guardados solo en el WhatsApp personal de la secretaria), y **reglas de scheduling implícitas** ("no agendar paciente PAMI nuevo después de las 11 porque el trámite es más largo").

**Recomendación para AlthemGroup:** durante el onboarding presencial de cada clínica, dedicar al menos 30 minutos a una entrevista estructurada con la secretaria para capturar estas reglas. Documentarlas como "reglas de negocio" del consultorio y configurarlas en el sistema (duración de turnos por tipo, horarios bloqueados, reglas de sobreturnos).

---

## 2. Estrategias de migración de datos para clínicas argentinas

### Datos mínimos viables para empezar

No todos los campos son iguales. Para arrancar una turnera, el set mínimo es:

- **Apellido y Nombre** (obligatorio)
- **DNI** (obligatorio — es el identificador primario del sistema de salud argentino)
- **Teléfono celular** (obligatorio — para recordatorios por WhatsApp)
- **Obra social / Prepaga** (importante — define facturación y cobertura)
- **Número de afiliado** (importante — formato variable según cada obra social)
- **Plan** (deseable — determina copagos y cobertura)
- **Email** (deseable — muchos pacientes mayores no lo tienen)
- **Fecha de nacimiento** (deseable — útil para validaciones y demografía)

El **CUIL** (11 dígitos: XX-XXXXXXXX-X, donde los 8 del medio son el DNI) es cada vez más relevante, especialmente para PAMI y algunas obras sociales. Los pacientes de PAMI requieren además el **número de afiliación PAMI de 14 dígitos**.

### Normalización del DNI: un problema argentino específico

El DNI argentino tiene **7 u 8 dígitos** y se escribe de múltiples formas en la práctica: "20.345.678" (con puntos como separador de miles), "20345678" (sin separadores), "20-345678" (con guión), "DNI 20345678" (con prefijo), y en pacientes mayores pueden aparecer referencias a la Libreta Cívica (LC) o Libreta de Enrolamiento (LE). **La regla de normalización es simple: almacenar siempre como número entero sin puntos ni guiones, y formatear para mostrar con puntos.** Implementar una función de limpieza que elimine puntos, guiones, espacios y prefijos ("DNI", "LC", "LE") al momento de importar.

Los números de teléfono son otro dolor de cabeza: pueden aparecer como "+54 9 11 1234-5678", "011 15 1234-5678", "1512345678", o sin código de área. Normalizar al formato internacional E.164 (+549XXXXXXXXXX para celulares argentinos) es indispensable para que funcionen los recordatorios por WhatsApp.

### Datos sucios: duplicados, registros incompletos, formatos inconsistentes

La investigación confirma que la **falta de un padrón unificado de pacientes genera múltiples registros independientes** según número de documento, afiliado, nombre o fecha de nacimiento. Un estudio en Buenos Aires (2019-2020) documentó este problema como estructural. Las estrategias de limpieza son:

**Deduplicación:** usar fuzzy matching sobre nombre + DNI. Si dos registros comparten DNI, son la misma persona. Si comparten nombre similar (Levenshtein distance < 3) y mismo teléfono, probablemente también. Presentar las coincidencias a la secretaria para confirmación humana antes de mergear.

**Normalización de nombres:** convertir todo a Title Case, manejar tildes y caracteres especiales (García vs GARCIA vs Garcia), separar apellido de nombre de forma consistente. Los nombres compuestos son comunes en Argentina ("María del Carmen", "Juan José") — no truncar.

**Campos vacíos:** no bloquear la importación por campos faltantes. Mejor importar con lo que hay y marcar registros incompletos para completar gradualmente. Una clínica con 1.000 pacientes no va a completar todos los emails antes de arrancar.

### ¿Importar historial de turnos o empezar de cero?

**Recomendación: importar solo los turnos futuros agendados y empezar el historial desde cero.** El historial de turnos pasados tiene valor estadístico limitado para una clínica chica, y el esfuerzo de migración es desproporcionado. Lo que sí tiene valor es importar la **base de pacientes completa** para que el sistema no arranque vacío — un sistema vacío se siente peor que el cuaderno viejo. Cargar los turnos ya agendados para las próximas 2-4 semanas es imprescindible para que la transición sea transparente para los pacientes.

### Importación técnica a Supabase

Supabase (PostgreSQL) ofrece varias opciones para importar CSVs: la **importación desde el Dashboard** (Table Editor → Import Data from CSV, límite 100MB — más que suficiente para clínicas chicas), el **comando COPY** vía SQL (no disponible directamente en Supabase hosted por falta de acceso superusuario), o **scripts programáticos** usando el SDK de Supabase para insertar en lotes. Para las primeras 5 clínicas, la ruta más práctica es:

1. Obtener los datos del consultorio (Excel, foto del cuaderno, contactos de WhatsApp)
2. Limpiarlos con un script en Python/pandas o Node.js
3. Generar un CSV limpio con las columnas del schema
4. Importar vía Dashboard o un script con el cliente de Supabase
5. Validar post-importación: contar filas, verificar registros al azar con la secretaria

**Tiempo estimado:** para una clínica con 500-2.000 pacientes, la preparación y limpieza de datos toma **1-3 días** y la importación técnica **2-4 horas**. El cuello de botella es obtener los datos del sistema viejo, no cargarlos en el nuevo.

---

## 3. El período de funcionamiento en paralelo

### Usar ambos sistemas simultáneamente es inevitable, pero debe ser corto

Para clínicas chicas con 1-5 médicos haciendo gestión de turnos (no historia clínica completa), **2 a 4 semanas de funcionamiento en paralelo es el punto ideal**. Menos de 2 semanas no da suficiente confianza; más de 4 genera fatiga insostenible por la doble carga de trabajo. La estrategia es migrar funciones progresivamente: primero la base de pacientes (no crítico, construye familiaridad), después los turnos nuevos (se crean en ambos sistemas), y finalmente solo en el sistema nuevo.

Los problemas más comunes durante el paralelo son predecibles: **"tengo que cargar todo dos veces"** (la queja #1 que genera resentimiento), **inconsistencias** entre sistemas cuando uno se actualiza y el otro no, **reversión bajo presión** (cuando suena el teléfono y hay un paciente esperando, la secretaria vuelve al cuaderno por reflejo), y **adopción selectiva** donde el staff inconscientemente favorece el sistema viejo.

### Criterios de corte: cuándo apagar el sistema viejo

El corte es seguro cuando se cumplen **todas** estas condiciones: el 100% de los turnos nuevos se están creando en el sistema nuevo, el staff puede realizar las tareas básicas sin ayuda (crear turno, reprogramar, cancelar, buscar paciente), no hay discrepancias de datos entre sistemas hace al menos una semana, y el dueño o administrador de la clínica da el visto bueno explícito. **No cortar un lunes** (día de mayor volumen). Idealmente, cortar un miércoles o jueves para tener dos días hábiles de margen antes del fin de semana.

### Criterios de aborto: cuándo volver atrás

Volver al sistema viejo si: se están **perdiendo turnos o generando sobreturnos** por problemas del sistema, el staff **no logra completar tareas básicas después de 2 semanas** de capacitación, el sistema tiene **caídas frecuentes en horario laboral**, o hay **problemas de integridad de datos** (registros incorrectos o faltantes). Mantener los datos del sistema viejo accesibles durante **al menos 90 días** después del corte como red de seguridad.

---

## 4. Capacitación del personal médico en clínicas argentinas

### La secretaria es la usuaria clave — y necesita 2 semanas mínimo

La secretaria médica realiza el **90%+ de las interacciones diarias** con cualquier sistema de turnos. Investigaciones sobre implementación de software en consultorios médicos estiman **2 semanas para competencia básica** y **4-6 semanas para confianza plena**. La productividad cae un **40-50% en las primeras 2 semanas** — las tareas toman el doble de tiempo. Para la semana 3-4 se recupera al 70-80%, y entre la semana 5 y 8 se alcanza o supera el nivel anterior. **Es fundamental comunicar esto de antemano**: "las primeras dos semanas van a ser más lentas, es normal, para la tercera semana ya va a ser más rápido que antes".

### Formato de capacitación: presencial + WhatsApp + videos cortos

Los formatos que funcionan para personal administrativo de clínicas argentinas, en orden de efectividad:

- **Capacitación en el puesto de trabajo (el más efectivo):** el fundador se sienta al lado de la secretaria durante turnos reales, guiando paso a paso. Usar datos reales del consultorio, no demos.
- **Videos cortos de 2-3 minutos por tarea:** grabaciones de pantalla para "cómo crear un turno", "cómo buscar un paciente", "cómo cancelar y reprogramar". Reproducibles cuando se olvidan. Enviar por WhatsApp.
- **Soporte por WhatsApp en tiempo real:** un grupo de WhatsApp con el staff de la clínica y el soporte de AlthemGroup para preguntas de "¿cómo hago para…?" durante horario laboral. Este es el canal natural en Argentina.
- **Tarjeta de referencia rápida:** una hoja A4 impresa (sí, impresa) con las 5 tareas más comunes y sus pasos. Para tener al lado de la computadora.

Lo que **no funciona**: sesiones largas tipo aula, manuales genéricos extensos, capacitación semanas antes del go-live (la curva de olvido elimina el 90% en un mes si no se practica), y enfoques genéricos que no distinguen roles.

### Los momentos de "no puedo hacer esto"

Los puntos de frustración más comunes con software nuevo de turnos son: **"no encuentro al paciente"** (la búsqueda no coincide por tildes, mayúsculas o variaciones del nombre — la búsqueda debe ser tolerante a errores), **"es más lento que el cuaderno"** (tipear vs. escribir a mano en las primeras 2 semanas), **"suena el teléfono y no me sale"** (presión de atención en tiempo real), **"borré algo sin querer"** (miedo a romper cosas — implementar undo y confirmar acciones destructivas), y **"el doctor necesita ver la agenda YA y no la puedo mostrar"** (escenarios críticos de tiempo).

### Médicos vs. secretarias vs. dueños: necesidades distintas

**Médicos:** necesitan capacitación mínima — 30 minutos para ver su agenda, quizás confirmar asistencia. Su preocupación es "¿esto me va a hacer más lento?". Mostrarles la vista de solo lectura de su agenda diaria. **Secretarias:** son las power users, necesitan el 80% de la capacitación. Foco en creación, búsqueda, reprogramación y manejo del teléfono mientras usan el sistema. **Dueños/administradores:** necesitan entender configuración, reportes y métricas. Son el **factor #1 de éxito**: la investigación confirma unánimemente que sin el empuje activo del dueño, la adopción fracasa. El dueño debe usar el sistema visiblemente (aunque sea solo para consultar la agenda) y comprometerse a no volver atrás cuando la semana 2 se ponga difícil.

---

## 5. Retención en el primer mes y prevención de churn

### Por qué una clínica abandona un sistema nuevo en 30 días

Las causas principales de abandono temprano son: **no ver valor rápido** (clientes que no logran valor significativo en 30 días rara vez sobreviven 90), **complejidad excesiva** (sobrecarga de features que abruma al SMB), **el problema "Excel era más fácil"** (los hábitos viejos pesan más bajo presión), **resistencia del staff** (la secretaria que se niega a adoptar o sabotea volviendo al método anterior), **migración pobre** (arrancar con un sistema vacío se siente peor que el cuaderno lleno), y **sensibilidad presupuestaria** (en Argentina, cada peso cuenta y cuando aprieta el bolsillo lo primero que cortan es software).

### Cómo superar el "Excel era más fácil"

Cinco tácticas concretas: **pre-cargar datos antes del go-live** (que el sistema tenga pacientes y turnos desde el día 1), **mostrar victorias inmediatas** (el primer recordatorio de WhatsApp enviado automáticamente, la primera agenda diaria impresa con formato profesional), **hacer que la tarea más frecuente sea objetivamente más rápida** (buscar paciente y crear turno debe ser más rápido que buscar en el cuaderno en máximo 2 semanas), **no intentar reemplazar todo de golpe** (empezar solo con turnos, agregar features gradualmente), y **celebrar hitos** ("esta semana agendaron 50 turnos por el sistema, ¡genial!").

### Cadencia de soporte: semana a semana

**Semana 1 — Soporte intensivo ("white glove"):** Día 1: setup presencial, importación de datos, capacitación inicial (2-3 horas). Días 2-3: check-in por WhatsApp (15 minutos), "¿cómo les fue? ¿algún problema?". Día 5: sesión de revisión (30 minutos), corregir flujos problemáticos. Disponibilidad completa por WhatsApp en horario de la clínica.

**Semana 2 — Monitoreo activo:** Día 8: check-in proactivo, "¿cómo fue la primera semana completa?". Días 10-12: revisar datos de uso, abordar problemas de workflow. Día 14: reunión de revisión (30 minutos), "¿qué funciona? ¿qué frustra?".

**Semana 3 — Independencia guiada:** Un check-in a mitad de semana. Revisar métricas de activación. Introducir funcionalidades secundarias si el flujo core está sólido. Pasar de soporte proactivo a reactivo.

**Semana 4 — Validación y handoff:** Revisión final: ¿son autosuficientes? Confirmar que se puede retirar el sistema paralelo. Compartir resumen de uso y logros. Transicionar a cadencia de soporte regular (menos frecuente).

### Métricas de activación para una turnera

La **métrica de activación primaria** (el "momento aha") es: **primer turno real creado y atendido por un paciente a través del sistema.** Las métricas de seguimiento clave para los primeros 30 días son:

| Métrica | Objetivo | Señal de riesgo |
|---------|----------|-----------------|
| Pacientes cargados | 50+ en la primera semana | <20 indica migración incompleta |
| Turnos creados | 20+/semana por médico | <5/semana para clínica activa |
| Logins diarios | Todos los días hábiles | >2 días sin login = alerta |
| Recordatorios enviados | Creciente | 0 = feature no activada |
| Turnos reprogramados vía sistema | Cualquiera | 0 = siguen usando el viejo método |
| Consultas de soporte | Decreciente semana a semana | Creciente = problemas no resueltos |

**Señales de churn inminente:** sin login por 2+ días hábiles, menos de 5 turnos creados en una semana, preguntas básicas de "¿cómo hago X?" después de la semana 2, o el dueño de la clínica que nunca se logueó.

---

## 6. Procesos de onboarding escalables

### De white-glove a self-service: una transición gradual

**Primeros 5-10 clientes (ahora):** onboarding high-touch para cada cliente. Documentar todo: qué preguntan, dónde se traban, qué los entusiasma. Después de cada onboarding, hacer una retrospectiva: "¿qué puedo templatizar?". Crear un checklist en Google Docs/Notion para cada cliente.

**Clientes 10-50:** estandarizar el checklist de onboarding a partir de patrones observados. Grabar videos cortos (Loom o similar) para tareas comunes. Crear templates de email para cada etapa (bienvenida, día 3, semana 1, semana 2, semana 4). Armar una guía de "Primeros pasos" en español.

**Clientes 50+:** wizard de setup in-app guiado. Base de conocimiento con videos buscables. Secuencias de email automatizadas por signup. Tooltips in-app para acciones de primera vez. Mix de self-service + soporte humano disponible.

Un caso de referencia relevante es **Next Fit** (SaaS brasileño de gestión de gimnasios): empezaron con 100% onboarding por videollamada y al implementar guías in-app self-service **redujeron las videollamadas un 80% y los tickets de soporte un 50%**.

### Templates por tipo de consultorio

Crear configuraciones pre-armadas para los tipos más comunes de consultorio acelera el setup y reduce errores:

- **Consultorio de medicina general:** turnos de 20 minutos, agenda de lunes a viernes 8-20hs, múltiples obras sociales
- **Consultorio odontológico:** turnos de 30-60 minutos según práctica, agenda flexible, materiales e insumos
- **Consultorio pediátrico:** turnos de 15-20 minutos, picos estacionales (época escolar), múltiples pacientes por familia
- **Consultorio de salud mental (psicología/psiquiatría):** turnos de 50 minutos, recurrencia semanal, sensibilidad de privacidad
- **Clínica de kinesiología/fisioterapia:** turnos de 30-45 minutos, sesiones recurrentes, múltiples terapeutas
- **Consultorio de especialidades (dermatología, cardiología, etc.):** turnos variables, derivaciones entre especialistas

Cada template incluye duraciones de turno por defecto, horarios típicos, campos de datos relevantes a la especialidad, y configuración de recordatorios.

### Automatizaciones de onboarding para construir

En orden de prioridad: **email de bienvenida** con próximos pasos claros (importar pacientes → configurar agenda → crear primer turno), **wizard de setup** paso a paso in-app (agregar médicos → definir horarios → importar pacientes → crear primer turno), **datos de ejemplo** (clínica demo con pacientes ficticios para explorar sin riesgo), **checklist de progreso visual** ("¡70% completado!"), **emails automáticos de check-in** en días 3, 7, 14 y 30, y **tooltips in-app** para el primer uso de cada feature.

---

## 7. Qué hacen los competidores argentinos para el onboarding

### Panorama competitivo de onboarding

El análisis de competidores revela que **la migración de datos es el punto más débil de casi todos los competidores argentinos**. La mayoría están diseñados para empezar de cero, no para importar datos existentes.

**Turnito y Gendu** apuestan a self-service puro — "registrate y empezá en 5 minutos". No ofrecen migración ni capacitación específica. Funcionan para profesionales tech-savvy pero dejan afuera a clínicas con menos habilidad digital.

**Medicloud** es el más explícito en ofrecer asistencia de migración: "te asistimos en la creación de tu cuenta, configuración de agenda, importación de datos y más". También ofrece migrar datos desde plataformas anteriores. Es el benchmark a superar en este aspecto.

**Doctoralia** promete "excelente onboarding y soporte al cliente incluido — te guiamos en cada paso, desde importar tus contactos hasta usar todas las funciones". Sin embargo, las reseñas en Capterra mencionan problemas de seguimiento post-venta y dificultad para cancelar suscripciones.

**AgendaPro** tiene la "Academia AgendaPro" con tutoriales y demos, pero su enfoque es más autoservicio con soporte disponible. Sus precios en dólares son una barrera significativa en Argentina.

**Argensoft** (enterprise) incluye migración de datos como paso formal de su onboarding, con capacitación completa, pero apunta a instituciones medianas y grandes con pricing custom.

**Geblix** reporta una tasa de adopción exitosa del 96% con implementación personalizada, pero no publica detalles de su proceso ni precios.

### La oportunidad para AlthemGroup

Existe una brecha clara entre las soluciones self-service puras (Turnito, Gendu) que no asisten en la migración, y las enterprise (Argensoft) que son costosas y complejas. **Un onboarding white-glove con migración incluida, a precio de SaaS chico, es un diferenciador competitivo real** en el mercado argentino actual. Ningún competidor combina estas tres cosas: asistencia personalizada de migración + capacitación presencial + precio accesible en pesos.

### Quejas comunes sobre el onboarding de competidores

Las quejas recurrentes en reseñas y foros incluyen: **volatilidad de precios** (especialmente los que cobran en USD o suben frecuentemente), **costo prohibitivo de WhatsApp** (Medicloud cobra ~$150.000 ARS/mes extra por el bot de WhatsApp), **funcionalidad clínica limitada** en las soluciones simples, **lock-in de datos** (MedicAI específicamente critica a competidores por dificultar la exportación de datos, argumentando "tus datos son tuyos por ley"), **apps móviles de baja calidad** (Doctoralia recibe críticas frecuentes por su app), y **soporte post-venta deficiente**.

---

## 8. Evaluación de viabilidad y recomendaciones para AlthemGroup

### Estrategia para las primeras 5 clínicas: todo presencial, todo manual

Para los primeros 5 clientes, el fundador es el equipo de onboarding. Cada clínica recibe atención personalizada durante 4 semanas. El costo en tiempo es alto (~15-20 horas por clínica en el primer mes) pero el aprendizaje es invaluable. Estos no son solo clientes — son socios de desarrollo de producto. Cada interacción genera datos para escalar después.

**Distribución de esfuerzo por clínica:** pre-onboarding y discovery (2 horas), preparación y limpieza de datos (4-8 horas), setup del sistema y carga de datos (2-3 horas), capacitación presencial (2-3 horas), soporte semana 1 (3-5 horas), soporte semanas 2-4 (2-3 horas). **Total: 15-24 horas por clínica en el primer mes.**

### Cuándo construir herramientas de self-service

- **Clientes 1-10:** todo manual. El fundador hace la migración, la capacitación y el soporte.
- **Clientes 10-20:** construir el importador de CSV con limpieza básica, grabar los 5-10 videos tutoriales más pedidos, crear templates de email automatizados.
- **Clientes 20-50:** construir el wizard de setup in-app, base de conocimiento completa, templates por especialidad.
- **Clientes 50+:** onboarding self-service completo con soporte humano disponible on demand.

### Timeline realista de onboarding por clínica

| Fase | Duración | Actividades |
|------|----------|-------------|
| Semana 0 (pre-onboarding) | 3-5 días | Discovery call, recolección de datos, limpieza e importación, configuración del sistema |
| Semana 1 (go-live) | 5 días | Capacitación presencial, go-live con sistema paralelo, soporte diario por WhatsApp |
| Semana 2 | 5 días | Monitoreo activo, corrección de workflows, check-ins cada 2-3 días |
| Semana 3 | 5 días | Independencia guiada, introducción de features secundarios, 1 check-in |
| Semana 4 | 5 días | Validación final, retiro del sistema paralelo, transición a soporte regular |

**Duración total: 4-5 semanas desde firma de contrato hasta operación completa autónoma.**

### Pricing del onboarding: ¿cobrar o incluir?

**Recomendación para las primeras 5-20 clínicas: incluir el onboarding en la suscripción.** Razones: reduce la barrera de entrada (crítico en Argentina donde cada gasto se evalúa con lupa), genera goodwill y referencias boca a boca, y el valor del aprendizaje para mejorar el producto supera ampliamente el costo del tiempo invertido. **A partir de 20+ clínicas**, considerar un modelo con setup gratuito básico (self-service) y onboarding premium pago (migración asistida + capacitación presencial). Los competidores que cobran setup fee por separado enfrentan mayor fricción de conversión.

**Pricing en ARS es imprescindible.** Los competidores exitosos (Turnito, Gendu, Medicloud) cobran en pesos. AgendaPro con precios en USD recibe quejas constantes. Considerar un modelo freemium (plan gratis limitado + planes pagos desde ~$10.000-15.000 ARS/mes) alineado con el mercado actual.

### MVP de onboarding: lo mínimo viable

Para arrancar con las primeras 5 clínicas, el onboarding mínimo viable requiere: un **checklist de setup manual** (Google Doc/Notion), un **script de limpieza de datos** (Python o Node.js para normalizar DNI, teléfonos, nombres), la capacidad de **importar CSV a Supabase** (vía Dashboard o script), un **grupo de WhatsApp por clínica** como canal de soporte, **5 videos cortos** grabados con la pantalla (crear turno, buscar paciente, reprogramar, cancelar, ver agenda del día), y una **tarjeta de referencia rápida impresa** (1 página A4 con las tareas más comunes).

---

## Checklist de onboarding para clínicas

### Desde contrato firmado hasta operación completa

**Fase 1: Pre-onboarding (Semana 0, días 1-3)**

- [ ] Agendar call/reunión de discovery con el dueño y la secretaria de la clínica
- [ ] Identificar el sistema actual (papel, Excel, software) y obtener acceso a los datos
- [ ] Relevar cantidad de médicos, especialidades, horarios de atención
- [ ] Capturar reglas de negocio tácitas (entrevista con la secretaria: preferencias de médicos, reglas de sobreturnos, particularidades de obras sociales)
- [ ] Recolectar la base de datos de pacientes (Excel, fotos del cuaderno, exportación del software actual)
- [ ] Obtener lista de obras sociales y prepagas que acepta la clínica

**Fase 2: Preparación del sistema (Semana 0, días 3-5)**

- [ ] Limpiar y normalizar datos de pacientes (DNIs, teléfonos, nombres, obras sociales)
- [ ] Deduplicar registros (fuzzy matching por DNI + nombre)
- [ ] Importar base de pacientes a Supabase
- [ ] Configurar médicos y sus especialidades en el sistema
- [ ] Configurar horarios de atención por médico (días, franjas horarias, duración de turnos)
- [ ] Configurar obras sociales y prepagas que acepta cada médico
- [ ] Cargar turnos ya agendados para las próximas 2-4 semanas
- [ ] Configurar templates de recordatorios por WhatsApp
- [ ] Validar datos importados con la secretaria (spot-check de 10-20 registros)

**Fase 3: Capacitación (Semana 1, día 1)**

- [ ] Sesión presencial de capacitación con la secretaria (2-3 horas)
- [ ] Practicar flujo completo: buscar paciente → crear turno → reprogramar → cancelar
- [ ] Practicar el escenario "suena el teléfono y tengo que agendar un turno"
- [ ] Capacitación breve al médico principal (30 minutos: ver agenda, marcar asistencia)
- [ ] Entregar tarjeta de referencia rápida impresa
- [ ] Enviar videos tutoriales por WhatsApp al grupo de la clínica
- [ ] Confirmar que la secretaria puede hacer las 5 tareas básicas sin ayuda

**Fase 4: Go-live con paralelo (Semana 1, días 2-5)**

- [ ] Activar el sistema en producción con datos reales
- [ ] Mantener sistema viejo activo en paralelo
- [ ] Check-in diario por WhatsApp (5-15 minutos)
- [ ] Resolver problemas en tiempo real
- [ ] Verificar que los recordatorios de WhatsApp están saliendo correctamente

**Fase 5: Estabilización (Semanas 2-3)**

- [ ] Check-in cada 2-3 días (semana 2), luego semanal (semana 3)
- [ ] Revisar métricas de activación (turnos creados, logins, recordatorios enviados)
- [ ] Abordar el "dip de productividad" — reforzar que es normal y temporal
- [ ] Introducir features secundarios si el flujo core está sólido
- [ ] Recopilar feedback formal: "¿qué funciona? ¿qué frustra? ¿qué falta?"

**Fase 6: Corte y autonomía (Semana 4)**

- [ ] Verificar criterios de corte (100% turnos en sistema nuevo, staff autónomo, sin discrepancias)
- [ ] Retirar sistema paralelo (mantener datos accesibles 90 días)
- [ ] Reunión de cierre con dueño: compartir métricas de uso, celebrar logros
- [ ] Encuesta NPS: "¿Qué tan probable es que nos recomiendes a otro consultorio?"
- [ ] Transicionar a soporte regular (WhatsApp disponible, check-in mensual)
- [ ] Documentar lecciones aprendidas para el próximo onboarding

---

## Timeline visual: semana 0 a semana 4

```
SEMANA 0 — PREPARACIÓN
├── Día 1-2: Discovery + recolección de datos
├── Día 3-4: Limpieza, normalización, importación
└── Día 5:   Configuración del sistema + validación con secretaria

SEMANA 1 — GO-LIVE
├── Día 1:   Capacitación presencial (2-3hs) + go-live
├── Día 2-3: Check-in diario WhatsApp + resolución de problemas
├── Día 4:   Verificar recordatorios automáticos funcionando
└── Día 5:   Mini-revisión: ¿puede la secretaria operar sola?
              Productividad: ~50-60% del nivel normal

SEMANA 2 — MONITOREO ACTIVO
├── Día 8:   Check-in proactivo: "¿cómo fue la primera semana completa?"
├── Día 10:  Revisar datos de uso, abordar problemas de workflow
└── Día 14:  Reunión de revisión (30 min): ajustes finos
              Productividad: ~70-80% del nivel normal

SEMANA 3 — INDEPENDENCIA GUIADA
├── Check-in a mitad de semana
├── Revisar métricas de activación
├── Introducir features secundarios si corresponde
└── Pasar de soporte proactivo a reactivo
              Productividad: ~85-90% del nivel normal

SEMANA 4 — VALIDACIÓN Y CORTE
├── Verificar criterios de corte
├── Retirar sistema paralelo
├── Reunión de cierre + NPS
└── Transicionar a soporte regular
              Productividad: ~95-100% del nivel normal
```

---

## Playbook para las primeras 5 clínicas de AlthemGroup

### Filosofía: estos 5 clientes son co-creadores, no solo usuarios

Las primeras 5 clínicas no son clientes comunes. Son el laboratorio donde se va a descubrir qué funciona realmente en el terreno. Cada interacción es una oportunidad de aprendizaje que vale más que meses de desarrollo especulativo. El fundador debe estar presente, observar, preguntar y documentar obsesivamente.

### Selección estratégica del mix de clínicas

Idealmente, las primeras 5 clínicas deberían cubrir los tres perfiles de migración para maximizar el aprendizaje:

- **2 clínicas paper-based:** validan el flujo de digitalización desde cero. Son las más difíciles pero las que más aprenden del producto. Buscar consultorios donde el dueño esté motivado por modernizarse.
- **2 clínicas Excel-based:** validan el importador de datos y la migración semi-automática. Tienen datos existentes pero sucios.
- **1 clínica con software existente:** valida la migración desde competidor. Permite entender qué ofrece la competencia y dónde falla.

### Protocolo por clínica

**Antes de arrancar (día -7 a -1):**
Reunión presencial con el dueño y la secretaria. Objetivos: entender el flujo actual minuto a minuto (sentarse a observar un turno completo de atención), obtener acceso a los datos, identificar el dolor más agudo (¿ausentismo? ¿desorganización? ¿no poder ver la agenda desde el celular?), y pactar expectativas ("las primeras 2 semanas van a ser más lentas, en la tercera ya mejora").

**Setup (día 0):**
El fundador hace todo: limpia datos, importa pacientes, configura médicos y horarios, carga turnos existentes. La clínica no tiene que hacer nada técnico. El sistema debe estar listo y poblado con datos reales antes de la primera sesión de capacitación.

**Go-live (día 1):**
Capacitación presencial. No enseñar todo — solo las 5 tareas críticas: buscar paciente, crear turno, reprogramar turno, cancelar turno, ver agenda del día. Practicar con datos reales. Dejar la tarjeta impresa. Crear el grupo de WhatsApp.

**Semana 1:** presencia activa. Check-in diario. Resolver problemas en el momento. Si algo no funciona, arreglarlo esa noche y avisar al día siguiente.

**Semana 2-3:** ir soltando gradualmente. Check-ins menos frecuentes. Empezar a documentar los patrones que se repiten entre clínicas.

**Semana 4:** cierre formal. Métricas, feedback, NPS. Pedir referido: "¿Conocés algún colega que esté peleando con los turnos?"

### Qué documentar de cada clínica

Mantener un **diario de onboarding** por clínica con: tiempo invertido en cada paso, preguntas frecuentes de la secretaria (se convierten en FAQ y contenido de ayuda), puntos de fricción del producto (se convierten en mejoras), momentos de entusiasmo ("¡mirá, el paciente recibió el recordatorio solo!" — se convierten en copy de marketing), datos cuantitativos (turnos creados por semana, tasa de uso, tiempo promedio de una operación), y resistencias encontradas y cómo se resolvieron.

**Después de las 5 clínicas**, revisar los 5 diarios y extraer: el checklist estandarizado definitivo, los 10 videos tutoriales que realmente se necesitan, las configuraciones default que funcionan para cada tipo de consultorio, el pitch de venta más efectivo (basado en los dolores reales que encontraste), y el timeline realista (no el optimista).

### Métricas de éxito del playbook

El playbook funciona si después de 5 clínicas se logra: **5/5 clínicas operando autónomamente** al final del mes 1, **NPS promedio > 8** (sobre 10), un **tiempo de onboarding que se reduce de la clínica 1 a la 5** (efecto aprendizaje), al menos **2 referidos orgánicos** (boca a boca), y un **checklist de onboarding estandarizado** listo para usar con los clientes 6-20.

---

## Oportunidades de expansión a LATAM

### El mercado es grande y está creciendo rápido

El mercado de SaaS de salud en Latinoamérica representa aproximadamente **USD $1.460 millones en 2024** y crece al **26% anual**, el vertical más rápido de todo el SaaS en la región. El mercado total de salud digital en LATAM se proyecta a **USD $66.400 millones para 2033**. Argentina representa ~8% del mercado SaaS de LATAM, con 76 empresas SaaS y USD $542,5 millones en ingresos combinados.

### Secuencia recomendada de expansión

**Paso 1 — Uruguay (meses 6-12):** el movimiento más fácil. Las mutualistas uruguayas son funcionalmente equivalentes a las obras sociales argentinas, la cercanía cultural es total, y la adaptación técnica es mínima (cédula de identidad en vez de DNI, pesos uruguayos). El mercado es chico (~3,5 millones de habitantes) pero valida la capacidad multi-país con riesgo mínimo.

**Paso 2 — Chile y Colombia (meses 12-24):** Chile es el país más digitalizado de LATAM en salud, con un sistema dual FONASA/ISAPRE similar conceptualmente al de Argentina. Colombia tiene 52 millones de habitantes y un sistema EPS/IPS que genera demanda estructural de herramientas digitales para clínicas. AgendaPro (chilena) ya validó ambos mercados.

**Paso 3 — México (meses 18-36):** el mercado más grande de LATAM hispanohablante (~130 millones de habitantes, 20% del mercado SaaS de LATAM). Requiere mayor inversión (oficina local, equipo de ventas) pero es donde está el crecimiento real. Doctoralia genera el 16,4% de sus ingresos globales en México.

### Adaptaciones necesarias por país

Cada país requiere tres tipos de localización: **técnica** (formato de documento de identidad, sistema de seguros/cobertura, facturación electrónica, pasarelas de pago locales), **terminológica** ("turno" en Argentina = "cita" en la mayoría de LATAM = "hora" en Chile), y **regulatoria** (requisitos de historia clínica digital, protección de datos, receta electrónica).

La lección de AgendaPro (fundada en Chile en 2013, hoy en 17 mercados con USD $35 millones de Serie B) es que la **localización profunda** de cada mercado —integraciones con autoridades fiscales locales, métodos de pago locales, comisiones y estructuras de precios locales— es lo que diferencia a quien escala de quien fracasa.

### Ventaja argentina

Las empresas argentinas de SaaS tienen un track record probado de expansión regional. Tiendanube (e-commerce) pasó de Buenos Aires a ser una empresa de USD $3.100 millones de valuación en 5 países. Ualá (fintech) se expandió a México y Colombia. El patrón es consistente: **probar el modelo en Argentina con bajo capital, demostrar tracción, y expandir con la ventaja de talento técnico fuerte y costos operativos competitivos**. La clave es construir desde el día 1 una arquitectura que soporte multi-país (multi-tenant con configuración por país de documentos, seguros, moneda y terminología) para que agregar cada nuevo país sea progresivamente más barato.

---

## Conclusión

El onboarding de clínicas médicas argentinas a un sistema de turnos digital no es un problema tecnológico — es un problema humano. La secretaria que lleva 15 años manejando un cuaderno necesita sentir que el sistema nuevo le hace la vida más fácil, no más difícil, y eso no sucede hasta la tercera semana como mínimo. La ventaja competitiva de AlthemGroup en este momento no es el producto sino la capacidad de estar presencialmente en cada consultorio, entender los flujos reales, y construir confianza uno a uno.

Tres insights que deberían guiar las decisiones inmediatas: primero, **nunca entregar un sistema vacío** — la pre-carga de datos de pacientes y turnos existentes es lo que marca la diferencia entre adopción y abandono. Segundo, **WhatsApp es el sistema nervioso** de la operación — tanto para comunicarse con pacientes (recordatorios) como con la clínica (soporte), cualquier inversión en integración de WhatsApp tiene retorno inmediato. Tercero, **los primeros 5 clientes son el verdadero MVP** — el producto real se va a descubrir en la interacción con estos consultorios, no en un roadmap teórico.

La oportunidad es real y está cuantificada: un mercado de salud digital de LATAM creciendo al 20% anual, competidores que no resuelven bien la migración ni el onboarding, y un marco regulatorio argentino (Ley 27.706) que empuja activamente hacia la digitalización de historias clínicas. AlthemGroup tiene la ventaja de empezar chico, aprender rápido, y escalar con procesos que ya fueron probados en el terreno.