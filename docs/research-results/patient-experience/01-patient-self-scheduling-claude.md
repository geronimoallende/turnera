# Cómo reservan turnos médicos los argentinos: guía para construir una turnera

**El teléfono sigue siendo el canal dominante para sacar turnos médicos en Argentina, pero WhatsApp está cerrando la brecha rápidamente.** Para una turnera orientada a clínicas argentinas, la combinación secretaria + chatbot WhatsApp cubre al **85-90% del mercado real hoy**. Un portal web de autoagendamiento agrega valor diferencial pero no es urgente para el MVP. Los datos muestran que aproximadamente **70% de los turnos se siguen sacando por canales no digitales** (teléfono y presencial), mientras que la reserva digital crece aceleradamente post-pandemia, con empresas como Cormos procesando **18 millones de turnos digitales al año** y apuntando a capturar el 30% del total nacional para 2025. Argentina tiene una penetración de WhatsApp del **93% entre usuarios de internet** y lidera el mundo en tiempo de uso mensual (**31,4 horas/mes por usuario**), lo que convierte a este canal en el eje estratégico de cualquier sistema de turnos.

---

## Así sacan turnos los argentinos hoy: el teléfono resiste, WhatsApp avanza

No existe una encuesta nacional única que desglose con exactitud los canales de reserva de turnos médicos. Sin embargo, cruzando datos de Cormos (la mayor healthtech argentina de turnos, nacida de la fusión de DrApp, iTurnos y Docturno), del Gobierno de la Ciudad de Buenos Aires, del Ministerio de Salud y de plataformas como Doctoralia, se puede estimar la siguiente distribución:

**Teléfono: ~40-50% de todos los turnos.** Sigue siendo el canal principal, especialmente en hospitales públicos (donde la línea 147 de CABA es el eje del sistema), obras sociales medianas/chicas, y para pacientes mayores de 60 años. Las clínicas pequeñas del interior del país dependen casi exclusivamente del teléfono. **Presencial: ~15-25%**, concentrado en centros de atención primaria (CeSACs), hospitales públicos con demanda espontánea, y pueblos chicos donde la cultura es ir directo al centro de salud. **WhatsApp: ~10-15%**, en franco crecimiento. Es canal oficial en hospitales nacionales (Hospital Posadas), gobiernos provinciales (San Juan con su bot CiDi, Vicente López con "Vicente"), y CABA a través del chatbot Boti. Muchas clínicas privadas lo usan de forma semi-manual: el paciente manda mensaje y una secretaria responde en horario hábil. **Portal web o app: ~15-20%**, concentrado en prepagas grandes (OSDE, Swiss Medical, Galeno, Medifé) y en plataformas marketplace como Doctoralia (110.000+ profesionales registrados en Argentina). OSDE reporta **más de 3 millones de turnos online y 700.000 videoconsultas** desde el lanzamiento de su Consultorio Digital, con **4.543 prestadores con agendas digitales**. **App de obra social: ~5-10%**, muy variable según la prepaga. Las grandes tienen apps funcionales; las obras sociales sindicales chicas no tienen nada digital.

### Variaciones demográficas y geográficas

La brecha más marcada no es por edad sino por **tipo de cobertura y tamaño de ciudad**. En CABA, donde hay **16,5 médicos cada 1.000 habitantes** y toda la infraestructura digital del gobierno porteño, la reserva online es significativamente más accesible. En Santiago del Estero o Formosa, con apenas **1,8-1,9 médicos cada 1.000 habitantes**, el turno se saca presencialmente o por teléfono. Las prepagas privadas son el sector más digitalizado: todas las grandes ofrecen apps con turnos. El sector público va segundo, con avances notables en CABA y Provincia de Buenos Aires (que lanzó una turnera web para **70+ hospitales en 40 municipios**). Las obras sociales sindicales quedan últimas.

Por grupo etario, los datos de INDEC Q4 2024 muestran que el **97,8% de los argentinos de 18-29 años usa celular** y el **96,7% usa internet**, versus un **74,7-80% de uso de celular** y **59-70% de internet** entre mayores de 65 años. La diferencia de **10,9 puntos porcentuales** entre uso de celular e internet en mayores indica que muchos tienen WhatsApp pero luchan con apps más complejas. Según la encuesta de FUNDAR/CEPE de 2025, el **63,9% de la Gen Z** ya adopta herramientas de IA, versus solo **29% de los Baby Boomers**.

---

## WhatsApp es el canal estrella y ya no hay vuelta atrás

Argentina no es simplemente un país que "usa mucho WhatsApp": es **el país donde más tiempo pasan los usuarios en WhatsApp del mundo entero**, con **31,4 horas mensuales por usuario**. La penetración alcanza al **93% de los usuarios de internet** (alrededor de 40 millones de personas), y muchos planes de datos móviles incluyen WhatsApp gratis. Para la salud, esto tiene implicancias enormes.

### Cómo usan WhatsApp hoy para pedir turnos

El patrón dominante es **texto libre**: el paciente manda "Hola, quiero sacar un turno con el Dr. García para la semana que viene" y espera respuesta de una secretaria. Algunos centros más organizados, como el Sanatorio Argentino de San Juan, piden que en el primer mensaje incluyan nombre completo, DNI, obra social, especialidad y horario preferido. **Los audios son un problema real**: los pacientes tienden a mandar notas de voz, pero las clínicas los prohíben activamente. El Hospital Posadas dice explícitamente "No envíes audios, recibimos sólo mensajes de texto" y el Hospital de Crespo (Entre Ríos) lo replica. Esto es una señal importante para el diseño de un chatbot: hay que anticipar y redirigir intentos de audio.

Los chatbots estructurados están creciendo rápido. El caso más emblemático es **Boti**, el chatbot del Gobierno de CABA, que procesa **11 millones de conversaciones por mes** (99% por WhatsApp) y permite sacar turnos en hospitales públicos y CeSACs. En el sector privado, soluciones como **Merlín** (de Kunan), **MEDICLINE** y el bot "Güemi" del Sanatorio Güemes ofrecen flujos estructurados donde el paciente se identifica con DNI, elige especialidad y horario, y recibe confirmación automática.

### Expectativas de tiempo de respuesta

Este dato es crítico: **el 65% de los consumidores espera respuesta en menos de 5 minutos** al contactar por WhatsApp (datos de HubSpot/Zendesk 2025). **Solo el 4% considera aceptable esperar más de una hora.** La satisfacción cae significativamente después de los 15 minutos. En el contexto clínico argentino, donde las secretarias manejan WhatsApp de forma manual durante horario laboral, esto genera una brecha enorme entre expectativa y realidad. Un chatbot que responda instantáneamente las 24 horas resuelve este gap.

### Chatbot vs. humano: la línea de frustración

La investigación muestra que los pacientes aceptan chatbots para **tareas administrativas** (sacar turno, cancelar, consultar horarios) pero no para decisiones clínicas. El **89,1% de los usuarios** en un estudio de Oxford Academic/JAMIA usaron chatbots de salud primariamente para tareas administrativas. La frustración aparece en puntos específicos: después de **2-3 respuestas fallidas** del bot (el bot no entiende), cuando hay **pérdida de contexto** (el paciente dice "¿y el martes?" y el bot no recuerda de qué hablaban), ante **flujos rígidos de menú** que no se adaptan a lo que el paciente necesita, y cuando no hay **opción clara de hablar con un humano**. La buena práctica implementada por Merlín (Kunan) es permitir la derivación a un operador humano "tanto si el paciente lo solicita como si se define desde la lógica del hospital." Un dato clave: **el 67% de las interacciones con bots FAQ en salud terminan necesitando escalamiento humano** (Neuwark 2026), aunque los bots conversacionales modernos con IA logran **80%+ de resolución sin humano**.

---

## Los portales web de autoagendamiento que ya existen en Argentina

El ecosistema argentino de turneras incluye tres modelos: **marketplaces centralizados** (Doctoralia, Top Doctors), **SaaS con página de reserva por médico/clínica** (Medicloud, Turnera.com.ar, Turnito, DrApp, Gendu), y **portales institucionales** (OSDE, Swiss Medical, BA Ciudad, BA Provincia).

### Doctoralia: el marketplace más grande

Con **110.000+ profesionales registrados** y más de **1 millón de usuarios mensuales** en Argentina, Doctoralia es la plataforma de descubrimiento y reserva más grande. Su portal permite buscar por especialidad, filtrar por obra social, ver perfiles con fotos y opiniones de pacientes, elegir entre turno presencial o teleconsulta, y reservar en el momento si el médico tiene agenda digital activa. **Requiere registro** (gratuito) para reservar; no permite booking como invitado.

### Las turneras SaaS argentinas

**Medicloud** ofrece a cada médico una página de reserva personalizada, integración con Mercado Pago, prescripciones electrónicas y un bot de WhatsApp opcional (~$150.000 ARS/mes extra). **Turnito** se diferencia con un enfoque de **"sin app, sin cuenta"**: el paciente reserva desde un link web sin descargar nada ni registrarse, y puede pagar seña por Mercado Pago. **Turnera.com.ar** usa un modelo freemium donde la agenda es gratis y se cobra por créditos de recordatorios WhatsApp ($350 ARS cada uno). **Gendu** agrega emails automatizados a pacientes inactivos e invitaciones a dejar reseñas en Google. **MisTurnosMóvil** (de Argensoft) ofrece una solución white-label donde cada institución puede personalizar colores, logo y tipografía, con app para iOS, Android y web.

### Funciones más demandadas por pacientes

Según el análisis de marketing y reseñas de estas plataformas, los pacientes priorizan: **disponibilidad 24/7** (poder reservar a las 11pm sin llamar), **mínima fricción** (sin descargar app ni registrarse), **filtro por obra social/prepaga**, **disponibilidad en tiempo real** (ver slots abiertos, no mandar solicitud y esperar), **cancelación/reprogramación fácil**, y **opiniones de otros pacientes** sobre el médico.

### Las quejas más comunes

Los pacientes se quejan de **poca disponibilidad** online (pocos turnos publicados, especialmente para especialistas), **errores de sistema** en portales gubernamentales (errores 500/401 en la verificación de identidad de la Provincia de Buenos Aires), **registros complejos** que piden múltiples credenciales (DNI + número de trámite + clave ANSES/AFIP), **saturación inmediata** cuando se abren turnos (similar a comprar entradas para un recital), y **notificaciones duplicadas** cuando la clínica usa Doctoralia y su propio sistema simultáneamente.

---

## Las apps de obras sociales: un ecosistema fragmentado e imposible de integrar hoy

Todas las prepagas grandes tienen apps con algún nivel de reserva de turnos, pero **la integración con sistemas externos de clínicas es prácticamente inexistente**.

### OSDE: la integración más ambiciosa

OSDE (la prepaga más grande, ~2,2 millones de afiliados, ~31% del mercado privado) tiene el sistema más avanzado. Su "Cartilla Inteligente" permite buscar prestadores por geolocalización, especialidad o nombre, y reservar turnos con los **4.543+ prestadores que activaron su agenda digital**. OSDE creó una infraestructura de scheduling donde los prestadores se inscriben y publican su disponibilidad. El sistema permite agendar pacientes de otras coberturas también, funcionando como turnera standalone. Ha realizado más de **3 millones de reservas online** y **700.000+ videoconsultas**.

### Swiss Medical y Galeno: solo centros propios

Swiss Medical ofrece reserva online exclusivamente en sus **centros propios** (Sanatorio Los Arcos, Agote, Anchorena, Clínica Olivos). Para prestadores externos de la cartilla, redirige al teléfono. Galeno funciona igual con su cadena Trinidad (6 sedes). Ambos tienen funciones de "Guardia Ágil/Inteligente" para reservar lugar en la guardia.

### El problema de la doble agenda

Para prestadores externos, la realidad es que la prepaga y la clínica manejan **sistemas paralelos sin integración**. El paciente busca en la app de OSDE, encuentra un médico, llama al teléfono del consultorio, y saca el turno manualmente. No hay flujo de datos entre sistemas. **No existen APIs públicas estandarizadas** de ninguna prepaga para integrar turnos. HL7 Argentina (liderado por Hospital Italiano) trabaja con estándares FHIR, pero se usa para verificación de elegibilidad y recetas electrónicas, **no para interoperabilidad de agendas**. La integración se hace caso por caso: OSDE permitió conectarse a "Integrando Salud" como plataforma tercera, pero es la excepción.

### Implicancia para tu turnera

**No intentes integrarte con apps de obras sociales en el MVP.** No hay APIs, no hay estándares, y cada prepaga tiene un sistema propietario diferente. Lo más pragmático es: aceptar pacientes de cualquier obra social, manejar la verificación de cobertura como proceso separado (manual o con validación de credencial digital/QR), y eventualmente explorar la inscripción en el sistema de turnos de OSDE (por su escala de 2,2M afiliados). Para futuro, seguir los desarrollos de HSI (Historia de Salud Integrada del Ministerio de Salud) y ReNaPDiS, que apuntan a crear interoperabilidad en el sector público.

---

## La brecha generacional: tres perfiles de paciente con tres necesidades distintas

### Pacientes jóvenes (18-30): esperan una experiencia digital nativa

Con **97,8% de uso de celular** y **96,7% de internet** (INDEC Q4 2024), este grupo está hiperconectado. El **63,9% ya usa herramientas de IA** (FUNDAR 2025). Pre-pandemia, el usuario promedio de telemedicina en Argentina tenía ~30 años. Estos pacientes esperan poder sacar turno desde el celular a cualquier hora, recibir confirmación por WhatsApp, tener teleconsulta como opción, y no tener que llamar por teléfono. Para tu turnera: este grupo adoptará sin fricción tanto el chatbot de WhatsApp como un portal web, y será el primero en usarlo.

### Pacientes de mediana edad (30-60): cómodos pero pragmáticos

El **96,2% usa celular** con adopción fuerte de internet. Son los usuarios principales de las apps de prepagas y de plataformas como Doctoralia. Fueron el grueso de los **132.142 usuarios de teleconsulta** en el estudio de Medifé. Están cómodos con tecnología pero también acostumbrados al teléfono. Para este grupo, WhatsApp es el canal perfecto: ya lo conocen, no requiere aprender nada nuevo, y pueden interactuar cuando les conviene. El portal web es un complemento útil, especialmente si permite filtrar por obra social y ver disponibilidad real.

### Pacientes mayores (60+): el desafío real

La brecha digital es concreta: **solo 59-70% usa internet** y hay un gap de **10,9 puntos porcentuales** entre quienes tienen celular y quienes usan internet. Sin embargo, la pandemia rompió barreras importantes: el estudio del BID con datos de "Llamando al Doctor" mostró que **pacientes de 65+ y con condiciones preexistentes impulsaron el crecimiento de teleconsultas** durante COVID, sugiriendo un cambio potencialmente permanente. PAMI (5+ millones de afiliados) ha invertido fuerte en su app Mi PAMI con diseño de "usabilidad universal", pero mantiene robustos canales alternativos: líneas telefónicas gratuitas, oficinas presenciales (UGLs), y la posibilidad de que **familiares autorizados colaboren en la gestión digital**. Para tu turnera: este grupo necesita que el sistema soporte reserva por secretaria (teléfono) como canal primario, con WhatsApp como canal secundario (muchos mayores ya lo usan para comunicarse con familiares). El familiar que ayuda al adulto mayor es un usuario clave: poder reservar turno para un familiar desde el chatbot o la web es una función importante.

---

## Preferencias de comunicación: WhatsApp gana en todo

**Confirmaciones de turno:** WhatsApp es el canal preferido y más efectivo. Las plataformas argentinas reportan **tasas de apertura superiores al 90%** para mensajes de WhatsApp versus **21,5% para email**. Todas las turneras argentinas relevantes (Medicline, DocTurno, Turnera.com.ar, Medicloud, Manosimple) usan WhatsApp como canal principal de confirmación. El email funciona como respaldo formal.

**Recordatorios:** El estándar en Argentina es un recordatorio por WhatsApp **24-48 horas antes** del turno, con opción de confirmar o cancelar desde el mismo mensaje. PAMI envía un segundo recordatorio **2 horas antes**. Medicloud reporta **40% de reducción en ausentismo** con recordatorios WhatsApp; MedicAI reporta **20-30% menos ausentismo** en consultorios con reserva online. Considerando que **1 de cada 3 pacientes falta a su turno** en Argentina (dato de Geblix sobre muestra de 500.000 casos), los recordatorios son la función con mayor ROI inmediato para una turnera.

**Resultados de estudios:** Las plataformas más avanzadas (MisTurnosMóvil, Hospital Italiano, apps de prepagas) ofrecen descarga de resultados desde el portal. Es una función valorada pero secundaria para una turnera de turnos.

**Historial de turnos y calificación post-visita:** PAMI incluye historial en su app. Gendu automatiza invitaciones a dejar reseñas en Google. Son funciones de valor agregado para roadmap posterior, no para MVP.

---

## Qué construir ahora versus después: recomendación estratégica

### Para el MVP: WhatsApp + secretaria es suficiente, y es lo correcto

Los datos son claros. El **85-90% del mercado argentino de turnos** se mueve entre teléfono, presencial y WhatsApp. Tu combinación de **reserva por secretaria (vía calendario) + chatbot WhatsApp** cubre estos canales. Un portal web de autoagendamiento para pacientes NO es necesario para el MVP, por tres razones: la adopción esperada sería del **15-25% de los turnos** en el mejor caso (y probablemente menos inicialmente), la inversión en UX de autoservicio es significativa para un retorno marginal en esta etapa, y **WhatsApp puede cumplir la mayoría de las funciones** que haría un portal web (ver disponibilidad, elegir horario, confirmar turno) con menor fricción y mayor adopción.

### Lo que sí debe tener el MVP

- **Chatbot WhatsApp con flujo estructurado:** Identificación por DNI, selección de especialidad, vista de horarios disponibles, confirmación de turno, y opción clara de "Hablar con una persona" para derivar a secretaria humana
- **Recordatorios automáticos por WhatsApp:** 24-48 horas antes, con botón de confirmar/cancelar. Esta es la función con mayor impacto inmediato en reducir el ausentismo del **33%** actual
- **Gestión de audios:** El chatbot debe manejar el envío de audios con un mensaje claro pidiendo texto, ya que los pacientes intentarán mandar notas de voz
- **Reserva por secretaria:** Interfaz de calendario simple para que la secretaria agende turnos de pacientes que llaman o vienen presencialmente
- **Multi-canal unificado:** Que un turno sacado por WhatsApp y uno sacado por secretaria se vean en la misma agenda, sin duplicaciones

### Cuándo agregar portal web de autoagendamiento (Mes 6-9)

Construir la página de reserva web cuando ya tengas clínicas activas y datos reales de uso. En ese momento, el mínimo viable del portal necesita: selección de especialidad/médico, vista de calendario con slots disponibles, ingreso de datos básicos (nombre, DNI, teléfono, obra social), confirmación con mensaje de WhatsApp automático, y **no requerir creación de cuenta** (el modelo de Turnito, que permite reservar sin cuenta ni app, es un diferenciador competitivo real en el mercado argentino). El portal **debería ser branded por clínica** (cada clínica con su URL/subdominio y su logo), siguiendo el modelo de Medicloud, DrApp y MisTurnosMóvil, ya que las clínicas valoran tener su propia identidad versus aparecer en un marketplace genérico.

### Roadmap sugerido de features orientados al paciente

**Mes 1-3 (MVP):** Chatbot WhatsApp para sacar/cancelar turnos + recordatorios automáticos + gestión de agenda por secretaria. **Mes 4-6:** Confirmación de asistencia desde WhatsApp + métricas de ausentismo + lista de espera automática (cuando alguien cancela, el sistema ofrece el slot al siguiente). **Mes 6-9:** Portal web de reserva para pacientes (branded por clínica, sin registro obligatorio) + reserva para familiares. **Mes 9-12:** Integración con Mercado Pago para cobro de seña (ataca directamente el problema del 33% de ausentismo) + calificación post-visita + historial de turnos del paciente. **Mes 12+:** Explorar integración con el sistema de turnos de OSDE (por su escala de 2,2M afiliados) + teleconsulta + descarga de resultados.

### La tasa de adopción esperada realista

Un portal web de reserva en una clínica argentina puede esperar que **10-20% de los turnos totales** vengan del portal en los primeros 6 meses, subiendo a **20-30%** en el primer año si la clínica lo promueve activamente. La experiencia de Cormos (18M turnos digitales sobre ~60M totales nacionales, es decir ~30%) marca un techo optimista a nivel macro. Para una clínica individual, la adopción dependerá fuertemente del perfil de pacientes: prepagas en CABA tendrán adopción más alta; obras sociales en el interior, más baja.

---

## Conclusión: WhatsApp primero, web después, integración nunca (por ahora)

La evidencia apunta a una realidad clara del mercado argentino de salud: **WhatsApp no es un canal más, es EL canal**. Con 93% de penetración, 31,4 horas de uso mensual, y una infraestructura cultural donde tanto un joven de 25 como un adulto mayor de 70 saben mandar un mensaje, el chatbot de WhatsApp es el puente más corto entre el paciente y el turno. La reserva por secretaria sigue siendo indispensable para pacientes que llaman (especialmente mayores de 60 y usuarios de hospitales públicos/obras sociales chicas), pero el volumen está migrando gradualmente hacia lo digital.

La inversión en un portal web de autoservicio tiene sentido estratégico pero no es urgente. Los datos muestran que incluso las plataformas más establecidas (Doctoralia con 110.000 médicos, OSDE con 4.543 agendas digitales) coexisten con un sistema donde **la mayoría de los turnos aún se sacan por teléfono**. El mercado argentino no está listo para una experiencia 100% self-service, pero tampoco es puramente analógico. La oportunidad está en ocupar el espacio intermedio: un chatbot inteligente que se sienta como hablar con una secretaria eficiente, disponible las 24 horas, y que reduzca el ausentismo del 33% con recordatorios automatizados. Eso solo ya justifica el producto.