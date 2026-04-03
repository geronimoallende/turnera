# Flujos médicos por especialidad en Argentina: guía práctica para construir una turnera inteligente

**La duración, preparación y tipo de consulta varían drásticamente entre especialidades médicas, y ningún sistema de turnos del mercado argentino maneja esto de forma nativa.** Esto representa la oportunidad central para una turnera SaaS diferenciada: configurar automáticamente duración, tipo de turno, instrucciones de preparación y flujo de autorización según la especialidad. La investigación de más de 15 fuentes argentinas —incluyendo estudios de la UdeSA sobre 1.077.201 turnos, encuestas de la Sociedad Argentina de Cardiología, y guías del Ministerio de Salud— revela que mientras una consulta de clínica médica dura 15 minutos, ginecología con PAP/colposcopía necesita 30, y un chequeo de niño sano en pediatría demanda 20-30. El ausentismo promedio en Argentina ronda el **25-30%**, y las herramientas más efectivas para reducirlo —recordatorio WhatsApp, cobro anticipado por MercadoPago, lista de espera automatizada— están implementadas parcialmente en el mercado actual.

---

## 1. Características de cada especialidad: lo que la turnera necesita saber

### Clínica médica (medicina interna / medicina general)

La puerta de entrada al sistema de salud. Un estudio de Buenos Aires (Actis/Outomuro, 2013) confirma que la **duración estándar es 15 minutos**, aunque los profesionales consideran que 20-30 minutos sería lo ideal. La primera consulta puede extenderse a 20-30 minutos. Los motivos más frecuentes incluyen control de salud anual, hipertensión, diabetes, dislipemias, cuadros gripales, certificados médicos y renovación de recetas crónicas. No se realizan procedimientos significativos durante la consulta, más allá de toma de tensión arterial y examen físico básico.

Los estudios que más solicita son laboratorio de rutina (hemograma, glucemia, perfil lipídico, hepatograma, orina completa), radiografía de tórax y ECG. El seguimiento varía: paciente sano cada 12 meses, paciente crónico cada 3-6 meses. El paciente debe traer estudios previos y listado de medicamentos. Es la especialidad que **mayor volumen de derivaciones genera** hacia cardiología, endocrinología, gastroenterología y traumatología.

### Cardiología

El **70% de los cardiólogos argentinos** reporta que se les exige turnos de 10-15 minutos, pero consideran necesarios 20-30. La primera consulta demanda 30 minutos; el seguimiento, 20. Un dato clave: el ECG se realiza frecuentemente en el mismo consultorio o centro, agregando 5-10 minutos al turno. Motivos frecuentes: control de hipertensión, dolor precordial, palpitaciones, evaluación cardiovascular pre-deportiva, seguimiento post-infarto.

Los estudios habituales incluyen ECG (sin preparación, acceso directo), ecocardiograma Doppler (turno separado, ~30 min), ergometría (ropa deportiva, ayuno sólido 2h, duración ~45 min), Holter 24-48h y presurometría MAPA. La ergometría y el ecocardiograma requieren turno separado y equipamiento específico. El paciente **debe traer ECG previos, ecocardiogramas y resultados de laboratorio**. Seguimiento: hipertensión cada 3-6 meses, post-evento agudo cada 1-3 meses, estable cada 6-12 meses.

### Dermatología

Consulta clínica de **10-15 minutos**, pero si incluye procedimiento sube a 20-30 minutos. Es una de las especialidades con **mayor volumen de procedimientos en consultorio**: crioterapia con nitrógeno líquido, electrocoagulación, biopsia punch/incisional, extirpación de lesiones, dermatoscopia digital. Motivos frecuentes: control de lunares, acné, psoriasis, micosis, verrugas, rosácea, lesiones sospechosas, consultas estéticas (botox, ácido hialurónico, peeling).

No requiere preparación especial, aunque se recomienda presentarse sin maquillaje en la zona a evaluar. El estudio principal es la dermatoscopia (en consultorio) y la biopsia de piel (resultado de anatomía patológica en 7-15 días). Control de lunares anual; acné en tratamiento cada 1-2 meses; seguimiento oncológico cutáneo cada 3-6 meses. **Tiene marcada estacionalidad: la demanda sube ~30% en verano** por quemaduras solares, control de lunares y consultas estéticas.

### Traumatología (ortopedia)

Duración típica de **15-20 minutos**, subiendo a 20-30 con infiltración. Primera consulta: 20-30 minutos. Es la especialidad más derivada desde atención primaria (**~17% de todas las derivaciones**). Motivos: lumbalgia, dolor de rodilla, hombro, fracturas, esguinces, tendinopatías, artrosis, seguimiento de prótesis.

Realiza **infiltraciones articulares y periarticulares en consultorio** (corticoides, ácido hialurónico, PRP), retiro de puntos y maniobras de reducción. La colocación de yeso se hace generalmente en sala de yeso separada. Los estudios más solicitados son radiografía (el más frecuente, acceso directo), resonancia magnética (alta complejidad, requiere autorización previa), tomografía y densitometría. **El paciente debe traer obligatoriamente las imágenes ya realizadas** — es imprescindible para la evaluación. Seguimiento post-fractura cada 2-4 semanas; post-quirúrgico a las 2 semanas, 1, 3, 6 meses y 1 año. **Tiene estacionalidad veraniega** por mayor actividad deportiva.

### Ginecología

La consulta con PAP y colposcopía dura **30 minutos**; el chequeo ginecológico integral (PAP + colpo + ecografía TV + eco mamaria) puede llevar **1 hora**. El seguimiento sin procedimiento baja a 15-20 minutos. Es la especialidad con **más procedimientos rutinarios en consultorio**: toma de PAP, colposcopía, test de HPV, colocación/extracción de DIU e implante subdérmico, biopsias de cuello uterino.

**Las instrucciones de preparación son críticas y el sistema DEBE comunicarlas al confirmar el turno:**
- No estar menstruando el día del turno
- No tener relaciones sexuales con penetración 48-72 horas antes
- No colocarse óvulos, cremas ni duchas vaginales 48-72 horas antes
- Ideal: realizar PAP entre los días 10-20 del ciclo menstrual

Estudios habituales: mamografía (a partir de 35-40 años, turno separado), ecografía transvaginal (puede ser mismo día o turno separado), laboratorio hormonal. Control ginecológico anual obligatorio por PMO; embarazo: controles mensuales.

### Pediatría

Las consultas son **más largas que en clínica médica de adultos**. Control de niño sano: 20-30 minutos (incluye examen, evaluación de desarrollo, consejería). Consulta por enfermedad aguda: 15-20 minutos. El cronograma oficial del Ministerio de Salud y la SAP establece **20 controles en los primeros dos años de vida**: 4 en el primer mes, luego mensual hasta los 12 meses, trimestral hasta los 2 años, semestral hasta los 5, y anual hasta la pubertad.

No se realizan procedimientos invasivos en consultorio, pero cada consulta incluye medición de peso, talla, perímetro cefálico y evaluación del desarrollo (PRUNAPE). La vacunación se coordina pero generalmente se aplica en vacunatorio separado. El paciente debe traer **libreta sanitaria y carné de vacunación**. Estudios: pesquisa metabólica neonatal, otoemisiones acústicas, laboratorio por edad. **Tiene el máximo pico estacional en invierno** por bronquiolitis, VSR e influenza, con demanda que se dispara entre mayo y agosto.

### Oftalmología

Turno estándar de **15-20 minutos** que puede extenderse a 30-45 con estudios complementarios. Es una de las especialidades con más prácticas diagnósticas en consultorio: agudeza visual, biomicroscopía con lámpara de hendidura, tonometría, fondo de ojos. Los estudios complementarios que requieren turno separado incluyen OCT, campimetría computarizada, ecografía ocular y paquimetría.

**Dato operativo crítico**: la dilatación pupilar para fondo de ojos requiere 20-30 minutos de espera adicional, y el paciente no podrá conducir durante 3-4 horas post-consulta. El sistema debe advertir esto al confirmar el turno. Control anual para pacientes sanos; cada 3-6 meses para glaucoma y retinopatía diabética. Centros especializados separan agendas en: consulta general, estudios complementarios y procedimientos/cirugía (láser argón, YAG).

### Otorrinolaringología (ORL)

Consulta estándar de **15-20 minutos**, extendiéndose a 30-40 si incluye audiometría. Motivos adultos: hipoacusia, acúfenos, vértigo, sinusitis, desviación de septum, ronquidos/apnea. Motivos pediátricos: otitis recurrentes, amigdalitis, hipertrofia adenoidea. Realiza procedimientos diagnósticos menores en consultorio: otoscopía, lavado de oídos, extracción de tapones de cera, cauterización de epistaxis, fibro-endoscopía nasal.

Los turnos de audiometría suelen darse en **agenda separada** del consultorio ORL. El servicio trabaja frecuentemente en coordinación con fonoaudiología. Para videonistagmografía: ayuno y suspender sedantes/antivertiginosos. Para audiometría: evitar exposición a ruidos fuertes 24h antes.

### Urología

Consulta estándar de **15-20 minutos**; primera consulta con examen completo: 20-30. La consulta más frecuente de prevención es el **control prostático anual** (hombres >50 años): PSA + tacto rectal. Realiza procedimientos en consultorio: tacto rectal, uroflujometría, cambio de sondas, curaciones postquirúrgicas, instilaciones endovesicales.

**Preparaciones importantes para el sistema**: PSA requiere ayuno 8-12h, no eyacular 48h, no andar en bicicleta 48h. Ecografía vesico-prostática: vejiga llena (1 litro de agua 1h antes). Eco transrectal: enema 3h antes. Estudios solicitados: PSA, urocultivo, ecografía renovesical, eco-Doppler testicular, urodinamia.

### Diagnóstico por imagen

**Siempre requiere turno previo** (a diferencia del laboratorio) y **siempre requiere orden médica**. Los tiempos varían enormemente: radiografía simple 5-10 min, ecografía abdominal 15-20 min, resonancia magnética 20-60 min. La anticipación mínima varía: ecografía 24h, radiografía/mamografía 48h, densitometría 72h, **resonancia y tomografía 96h**.

Estudios de baja complejidad (Rx, ecografía, mamografía, ECG) tienen acceso directo sin autorización previa. Estudios de alta complejidad (TAC, RMN, PET-CT, medicina nuclear) **requieren autorización previa de la obra social** que demora 24-72h y necesita resumen de historia clínica. Las preparaciones son específicas por estudio: ecografía abdominal requiere **8h ayuno estricto**, ecografía ginecológica transabdominal requiere **vejiga llena**, TAC con contraste requiere **6-8h ayuno** e informar alergias al yodo, RMN requiere **retirar todo metal** y no usar maquillaje con partículas metálicas.

Resultados: ecografías frecuentemente en el momento, radiografías en 24-48h, TAC/RMN en 24-96h. La entrega es predominantemente digital: portal web del paciente, email con PDF, apps móviles.

### Laboratorio (análisis clínicos)

**Diferencia fundamental: la mayoría de los laboratorios argentinos funcionan sin turno previo** (walk-in), por orden de llegada, en horario de extracción (generalmente 7:00-10:00 hs). Excepciones que sí requieren turno: curva de tolerancia a la glucosa, cortisol (antes de las 9:30 AM), espermograma, estudios micológicos. Existe una **tendencia creciente** hacia laboratorios con turno previo obligatorio para optimizar tiempos.

El flujo es: médico emite orden → paciente gestiona autorización (si la obra social lo requiere; estudios de rutina generalmente no) → paciente se presenta en ayunas con orden original, credencial y DNI → extracción → resultados en **24-72h** para rutina, 5-7 días para cultivos. Los resultados se entregan por portal web, email, app o retiro presencial. Los laboratorios aceptan **múltiples órdenes de distintos médicos** en una sola extracción. La validez de la orden es de **30-60 días** según la obra social.

---

## 2. Tabla comparativa integral por especialidad

| Especialidad | Primera vez (min) | Seguimiento (min) | Procedimiento (min) | Seguimiento típico | Estudios principales | Preparación paciente | Consideraciones especiales |
|---|---|---|---|---|---|---|---|
| **Clínica médica** | 20-30 | 15 | N/A | Sano: anual. Crónico: 3-6 meses | Lab rutina, Rx tórax, ECG | Traer estudios previos | Puerta de entrada; genera derivaciones |
| **Cardiología** | 30 | 20 | ECG: +5-10 | HTA: 3-6 meses. Post-evento: 1-3 meses | ECG, ecocardiograma, ergometría, Holter | Traer ECG/estudios previos | ECG frecuentemente en consultorio |
| **Dermatología** | 15 | 15 | 20-30 (crioterapia, biopsia) | Lunares: anual. Acné: 1-2 meses | Dermatoscopia, biopsia, cultivo micológico | Sin maquillaje en zona | Estacionalidad verano +30% |
| **Traumatología** | 20-30 | 20 | 20-30 (infiltración) | Post-fractura: 2-4 sem. Crónico: 3-6 meses | Rx, RMN, TC, densitometría | Traer imágenes (imprescindible) | Estacionalidad verano; infiltraciones en consultorio |
| **Ginecología** | 30 (PAP+colpo) | 20 | DIU/implante: 30 | Anual (PMO). Embarazo: mensual | PAP, mamografía, eco TV, lab hormonal | Múltiples requisitos (sin menstruación, 48h sin relaciones) | Instrucciones de preparación CRÍTICAS |
| **Pediatría** | 30 | 20 | N/A | 20 controles en primeros 2 años; luego anual | Pesquisa neonatal, lab por edad | Traer libreta/carné vacunas | Estacionalidad invierno; calendario automático de controles |
| **Oftalmología** | 20-30 | 15 | 30-45 (con estudios) | Sano: anual. Glaucoma: 3-6 meses | Agudeza visual, tonometría, OCT, campimetría | Advertir dilatación pupilar (no conducir 3-4h) | Agenda separada consulta vs. estudios vs. procedimiento |
| **ORL** | 20-30 | 15 | 30-40 (con audiometría) | Según patología. Audífonos: 6 meses | Audiometría, impedanciometría, VNG, TC senos | Audiometría: sin ruidos 24h antes | Agenda audiometría separada del consultorio |
| **Urología** | 20-30 | 15-20 | 30-45 (uroflujometría) | Control prostático: anual. Oncológico: 3-6 meses | PSA, urocultivo, eco renovesical, urodinamia | PSA: ayuno, sin eyacular 48h. Eco prostática: vejiga llena | Preparaciones específicas según estudio |
| **Diag. por imagen** | Variable | N/A | 10-90 min según estudio | Según indicación médica | Rx, eco, mamografía, TAC, RMN | Variable por estudio (ayuno, vejiga llena, sin metal) | Siempre con orden médica; alta complejidad requiere autorización previa |
| **Laboratorio** | N/A (walk-in) | N/A | 5-15 (extracción) | Según orden médica | Hemograma, glucemia, perfil lipídico, hormonas | Ayuno 8-12h según análisis | Mayoría sin turno; tendencia hacia turno online opcional |

---

## 3. Patrones de agendamiento que el sistema debe contemplar

### Ausentismo: uno de cada tres pacientes falta

La **tasa promedio de no-show en Argentina es del 25-30%**, según un estudio de la Universidad de San Andrés sobre 1.077.201 turnos. La variable más predictiva es el **tiempo de espera entre reserva y turno**: turnos con menos de 7 días de anticipación tienen 14% de ausentismo; con más de 7 días, sube al 32%. Los pacientes de 25-29 años son los que más faltan (32.7%). Diciembre registra el pico de ausentismo por vacaciones.

Las estrategias probadas en Argentina incluyen: recordatorio WhatsApp 24h antes (reduce 25-40%), cobro anticipado/seña por MercadoPago (reduce 50-70%, Crontu reportó reducciones del 30% al 3%), y lista de espera automatizada para recuperar turnos cancelados. La causa #1 del ausentismo es simplemente el **olvido**, seguida por la alta barrera de cancelación (necesidad de llamar por teléfono) y el costo cero de no presentarse.

### Sobreturnos: una práctica cultural argentina

El sobreturno es un turno adicional más allá de la capacidad programada, y es culturalmente aceptado en el sistema argentino. Especialidades que **habitualmente dan sobreturnos**: clínica médica, pediatría (urgencias del día), endocrinología, reumatología, neurología. Se agendan generalmente solo desde el consultorio (no online) y compensan parcialmente el ausentismo y la escasez de especialistas.

Especialidades que **no pueden dar sobreturnos**: estudios por imágenes (ecografía, TAC, RMN), procedimientos quirúrgicos, endoscopías, y cualquier turno que requiera equipamiento específico con tiempo fijo.

### Estacionalidad clara por especialidad

- **Invierno (mayo-agosto)**: pico máximo en pediatría (bronquiolitis, VSR), neumonología y clínica médica
- **Primavera (septiembre-noviembre)**: alergología/inmunología (+20-25%), ORL (rinitis alérgica), oftalmología (conjuntivitis alérgica)
- **Verano (diciembre-febrero)**: dermatología (+30%), traumatología (lesiones deportivas), gastroenterología (intoxicaciones); simultáneamente, **sube el ausentismo general** por vacaciones
- **Estables todo el año**: cardiología, endocrinología, ginecología, psiquiatría

### Primera vez vs. seguimiento: diferencia de duración real

No existe regulación nacional que exija mayor tiempo para primera consulta, pero en la práctica la diferencia es significativa. La primera consulta incluye admisión (10-15 min), entrevista completa (15-20 min), examen físico (10-25 min) y explicación (10-15 min). El sistema público de CABA exige **orden de derivación del clínico** para primera consulta con especialista; si el paciente ya se atendió en los últimos 18 meses, puede sacar turno directamente. Muchas obras sociales también exigen derivación para primera vez. **El sistema debe distinguir administrativamente estos dos tipos de turno**.

---

## 4. El circuito de estudios: desde la orden hasta la próxima consulta

### Flujo completo en Argentina

El circuito típico sigue esta secuencia: consulta médica (día 0) → el médico emite orden → autorización de la obra social (0-3 días hábiles, solo si es alta complejidad) → turno de laboratorio/imágenes (0-7 días) → realización del estudio → espera de resultados (1-7 días según tipo) → **turno de control con el médico** (7-30 días después). Total estimado: **1 a 6 semanas** desde la primera consulta hasta la revisión de resultados. La Fundación Favaloro confirma: "en una segunda consulta médica se realiza la devolución de los resultados."

### Laboratorio: flujo diferenciado

Los estudios de baja complejidad (rutina) **no requieren autorización previa** — el paciente va directamente al laboratorio con orden, credencial y DNI. Los de alta complejidad (marcadores tumorales especiales, genética) sí requieren auditoría médica que puede demorar 48-72h. La validez de la orden es de 30-60 días. Los resultados se entregan por portal web (tendencia dominante), email, app o retiro presencial, típicamente en 24-72h para rutina.

### Imágenes: siempre con turno y autorización escalonada

Radiografías, ecografías básicas y mamografías tienen **acceso directo** sin autorización. TAC, RMN, angioresonancia y PET-CT requieren **autorización previa** con orden médica + resumen de historia clínica + planilla de alta complejidad. El proceso de autorización demora 24-72h según la obra social. OSDE, Galeno y Swiss Medical gestionan autorización online a través del centro de imágenes; algunas obras sindicales requieren gestión presencial del paciente en delegación.

### Receta electrónica: obligatoria desde 2024

La Ley 27.553 (2020), reglamentada por el Decreto 345/2024 y ampliada por la Resolución 2214/2025, establece la **obligatoriedad de la receta electrónica** para todas las indicaciones médicas: medicamentos, estudios, prácticas y procedimientos. Cada receta tiene un **CUIR (Clave Única de Identificación de Receta)** y cada paciente se identifica por CUIL. Las plataformas deben registrarse en el ReNaPDiS. PAMI fue pionero desde 2020. La receta papel solo se acepta como excepción en zonas sin conectividad.

---

## 5. Lo que el mercado actual no resuelve y la turnera debe resolver

Un análisis de más de 15 sistemas de turnos existentes en Argentina (Argensoft, Medicloud, ConsultSmart, Gendu, Geclisa, LandaMed, entre otros) revela **gaps significativos** que representan oportunidades de diferenciación:

**El gap más grande es la gestión nativa de tipos de turno por especialidad.** Ningún sistema comercial maneja nativamente categorías como "primera vez", "control", "procedimiento" con duraciones, coseguros e instrucciones diferenciadas. Los sistemas actuales resuelven esto con agendas separadas, lo cual es un workaround, no una solución. Otros gaps incluyen: instrucciones de preparación automáticas al paciente según tipo de estudio, lista de espera inteligente con notificación cuando se libera un turno, validación de obra social en tiempo real contra RNOS/SSSalud, workflow de autorización integrado, y gestión de recursos compartidos (ecógrafo, sala de Rx) como entidades limitadas al agendar.

ConsultSmart es el único que ofrece alertas por edad fuera de rango (pediatra que no atiende adultos) y por incompatibilidad médico-obra social, funcionalidades valiosas que deberían ser estándar.

---

## 6. Recomendaciones concretas para el modelo de datos y el flujo de la turnera

### Entidad `especialidad` con configuración rica

Cada especialidad debe tener configurados por defecto: duración de turno base, tipos de turno habilitados, instrucciones generales, si requiere derivación, rango etario del paciente, y si acepta sobreturnos. Estos valores deben ser **defaults que el administrador pueda ajustar** por médico, por sede y por obra social.

### Entidad `tipo_turno` vinculada a especialidad

Cada especialidad debe definir sus tipos de turno con duraciones diferenciadas. Para cardiología: primera vez (30 min), control (20 min), control + ECG (25 min). Para dermatología: consulta (15 min), consulta + procedimiento (30 min). Para ginecología: control anual con PAP (30 min), seguimiento sin procedimiento (20 min), colocación DIU (30 min). Para laboratorio: extracción sin turno (walk-in) o turno opcional de 15 min. El tipo de turno debe incluir campos de `duracion_minutos`, `instrucciones_preparacion`, `requiere_autorizacion_os`, `precio_particular`, `online_habilitado`.

### Instrucciones de preparación automáticas

Al confirmar un turno, el sistema debe enviar automáticamente las instrucciones correspondientes al tipo de turno por WhatsApp/email. Estas instrucciones deben estar pre-cargadas por defecto según la especialidad y tipo de estudio, pero ser editables:

- **Ginecología** (PAP): "No estar menstruando. No tener relaciones 48h antes. No usar óvulos ni cremas 48h antes."
- **Ecografía abdominal**: "Ayuno de 8 horas. Solo puede tomar agua."
- **RMN**: "Retirar TODO objeto metálico. No usar maquillaje. Informar si tiene implantes metálicos, marcapasos o claustrofobia."
- **Oftalmología** (fondo de ojos): "Le dilatarán las pupilas. No podrá conducir durante 3-4 horas."
- **Laboratorio**: "Ayuno de 12 horas para perfil lipídico. No suspender medicación habitual."

### Flujo de estudios integrado

El sistema debe soportar el ciclo completo: consulta → médico genera orden (idealmente receta electrónica con CUIR) → si requiere autorización, marcar estado "pendiente autorización" → una vez autorizado, paciente saca turno de estudio → estudio realizado → resultado disponible → turno de control para devolución. Este workflow debe ser **visible tanto para el paciente como para el médico**, con estados claros y notificaciones automáticas.

### Gestión de sobreturnos controlada

El sistema debe permitir configurar un **máximo de sobreturnos por agenda** (típicamente 2-3 por bloque). Los sobreturnos deben ser habilitables solo desde el perfil administrativo o médico (no desde booking online del paciente). Deben poder activarse o desactivarse por especialidad: habilitados para clínica, pediatría, endocrinología; deshabilitados para imágenes, procedimientos y estudios cardiológicos.

### Motor anti-ausentismo

Implementar tres niveles: (1) **Recordatorio WhatsApp 24h antes** con botones de confirmar/cancelar (reduce 25-40%), (2) **cobro anticipado opcional** por MercadoPago como seña del 30-50% de la consulta particular (reduce 50-70%), (3) **lista de espera con notificación automática** cuando se libera un turno. Adicionalmente, registrar el historial de asistencia del paciente y aplicar semaforización visual (verde/amarillo/rojo) para la secretaria. Pacientes con tasa de ausencia >40% deben recibir contacto telefónico preventivo.

### Multi-cobertura y validación

El modelo debe soportar: paciente con obra social principal + cobertura secundaria (doble cobertura), distinción entre planes cerrados (solo médicos de cartilla) y abiertos, y validación en el momento de agendar de que el profesional atiende la obra social del paciente. El flujo de autorización debe diferenciarse: acceso directo para baja complejidad vs. autorización previa para alta complejidad, con tiempos de anticipación mínimos configurables (96h para RMN, 48h para Rx).

### Recursos compartidos

Para centros con equipamiento de diagnóstico, la agenda del equipo (ecógrafo, tomógrafo, sala de Rx) debe ser un recurso independiente que se cruza con la agenda del profesional. Al agendar un turno de ecografía, el sistema debe verificar simultáneamente: disponibilidad del ecografista + disponibilidad del equipo + disponibilidad del consultorio.

### Estándares de interoperabilidad

Adoptar **SNOMED CT** para diagnósticos y procedimientos, **CIE-10** para codificación, y **HL7-FHIR** para interoperabilidad con el sistema HSI del Ministerio de Salud (usado por +1.800 instituciones públicas, 6M pacientes). Preparar integración con el **ReNaPDiS** para receta electrónica con CUIR. Esto no es opcional a mediano plazo: la tendencia regulatoria argentina apunta claramente hacia la obligatoriedad de estos estándares.

---

## Conclusión: las cinco decisiones de producto más importantes

Primero, **la duración del turno debe ser configurable por especialidad Y por tipo de turno**, no solo por médico. Esto es el diferenciador principal: una ginecología con PAP necesita 30 minutos, un control sin procedimiento necesita 20, y el sistema debe saberlo de antemano con defaults inteligentes que el administrador ajusta.

Segundo, **las instrucciones de preparación deben ser ciudadanos de primera clase en el modelo de datos**, vinculadas al tipo de turno y enviadas automáticamente. Este es el gap más grande del mercado actual y el que más impacto tiene en la experiencia del paciente y en la reducción de turnos perdidos por mala preparación.

Tercero, **el laboratorio requiere un módulo diferenciado** del resto de las especialidades. No funciona con agenda de turnos fija: es mayoritariamente walk-in, maneja múltiples órdenes simultáneas, y su flujo gira alrededor de la orden médica como entidad central.

Cuarto, **el sistema debe modelar el ciclo completo consulta→orden→estudio→resultado→control** como un workflow con estados y notificaciones, no como turnos aislados. Esto es lo que conecta la experiencia del paciente de punta a punta y permite al médico tener visibilidad sobre el avance del circuito diagnóstico.

Quinto, **el anti-ausentismo debe ser un pilar del producto**, no un feature secundario. Con 25-30% de no-show promedio, la combinación de recordatorio WhatsApp + cobro anticipado + lista de espera automatizada es lo que convierte a la turnera en una herramienta de gestión real, no solo un calendario digital. La diferencia entre una clínica con 30% de ausentismo y una con 5% es, literalmente, la viabilidad del negocio.