# Arquitectura de Integración Médica y Protocolos de Dispositivos No Imagenológicos para Entornos Clínicos

## 1. Motores de Integración en Salud: El Patrón Middleware

El ecosistema tecnológico de una institución de salud se caracteriza por una profunda fragmentación. Los sistemas de información clínica (EHR), los sistemas de información de laboratorio (LIS), los sistemas de radiología (RIS/PACS), las plataformas de facturación y los dispositivos médicos de punto de atención operan históricamente como silos independientes. Estos sistemas emplean diversos estándares, protocolos de transporte y formatos de serialización.^1^

La estrategia arquitectónica inicial en muchas instituciones fue la integración punto a punto (Point-to-Point), donde cada sistema se conecta directamente con otro.^2^ A medida que la complejidad institucional crece, este modelo escala geométricamente hacia una topología frágil e inauditable, donde la adición de un nuevo sistema requiere modificaciones en múltiples plataformas preexistentes.^3^ Para resolver esta deuda técnica, la industria adoptó el patrón de arquitectura *Hub-and-Spoke* mediante el uso de un Motor de Integración (Integration Engine) o Middleware.^2^

Un motor de integración actúa como un bus de servicio empresarial (ESB) especializado en salud.^4^ Su función principal es recibir mensajes desde los sistemas emisores, validar su contenido estructural, transformar los formatos de datos (por ejemplo, convertir un mensaje HL7v2 heredado a una estructura FHIR), enrutar la información basándose en reglas lógicas predefinidas y entregarla a los sistemas receptores utilizando el protocolo de transporte adecuado.^5^ Este patrón arquitectónico desacopla a los productores de información de los consumidores, permitiendo que si el sistema de facturación cambia, solo se deba actualizar un canal en el middleware, preservando la inmutabilidad del código en el sistema de historia clínica.

### Evaluación de Tecnologías Middleware

El mercado de integración en salud ofrece diversas soluciones, que varían desde proyectos de código abierto hasta plataformas empresariales de misión crítica.

  ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Motor de Integración**          **Licenciamiento / Modelo**                               **Enfoque Principal**                          **Fortalezas Arquitectónicas**                                                                        **Limitaciones Críticas**
  --------------------------------- --------------------------------------------------------- ---------------------------------------------- ----------------------------------------------------------------------------------------------------- -----------------------------------------------------------------------------------------------------
  **Mirth Connect (NextGen)**       Históricamente Open Source, actualmente Propietario ^7^   Enrutamiento y transformación multiprotocolo   Arquitectura de canales flexible, scripting en JavaScript (Rhino), amplia adopción global ^2^         Versiones nuevas cerradas a pago, carencia de control de versiones nativo para pipelines ^9^

  **HAPI FHIR**                     Open Source (Java) ^11^                                   Repositorio de datos y servidor RESTful FHIR   Cumplimiento estricto de HL7 FHIR, validación semántica, operaciones avanzadas de terminología ^12^   No es un enrutador; no gestiona conexiones TCP/MLLP heredadas, alto consumo de memoria ^13^

  **Rhapsody (Corepoint)**          Comercial (SaaS / On-Premise) ^5^                         Interoperabilidad a gran escala, HIEs          Interfaz visual de arrastrar y soltar, observabilidad profunda, despliegue hiper-rápido ^5^           Costo de licenciamiento empresarial elevado, menor flexibilidad para reglas de código puras ^5^

  **InterSystems Health Connect**   Comercial (SaaS / On-Premise) ^16^                        Procesamiento transaccional de alto volumen    Base de datos subyacente masivamente escalable (IRIS), soporte nativo FHIR ^16^                       Curva de aprendizaje extremadamente pronunciada, alta dependencia de consultoría especializada ^15^
  ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

**Mirth Connect (NextGen Connect)** Mirth Connect ha sido la solución de integración más implementada a nivel global en la capa media del sector salud.^2^ Desarrollado en Java, su arquitectura interna está estrictamente orientada a \"canales\".^4^ Cada canal consta de un conector de origen (Source Connector), una cadena de filtros y transformadores que ejecutan lógica en JavaScript, y uno o múltiples conectores de destino (Destination Connectors).^8^ Mirth es agnóstico en cuanto a estándares, soportando nativamente HL7v2, FHIR, DICOM, XML, JSON y conexiones a bases de datos relacionales mediante JDBC.^1^ Internamente, Mirth utiliza un componente llamado VMRouter para enrutar mensajes entre canales sin tocar la red física, permitiendo arquitecturas complejas de encadenamiento (Chaining).^17^

Es imperativo considerar un cambio reciente en el ecosistema: a partir de la versión 4.6 (efectiva en la transición 2025/2026), NextGen Healthcare ha transicionado Mirth Connect a un modelo comercial y propietario.^1^ Las versiones anteriores (como la 4.5.2) continúan bajo la licencia Mozilla Public License 2.0, pero dejarán de recibir parches de seguridad oficiales.^7^ Como contramedida comunitaria, iniciativas como *Open Integration Engine* buscan mantener un fork de código abierto basado en las versiones previas de Mirth, proporcionando una alternativa viable para mantener la gratuidad en proyectos emergentes.^19^

**Servidores HAPI FHIR** HAPI FHIR no compite directamente con Mirth Connect, sino que lo complementa. Mientras Mirth es un enrutador de mensajes en tránsito, un servidor HAPI FHIR actúa como un repositorio de persistencia de datos clínicos normalizados en reposo.^14^ Proporciona operaciones CRUD a través de una API RESTful que cumple estrictamente con el estándar FHIR de HL7.^20^ Sin embargo, HAPI FHIR no posee la capacidad nativa de mantener puertos TCP abiertos para escuchar comunicaciones seriales heredadas de analizadores de laboratorio; requiere un intermediario.^6^

### Arquitectura Conceptual del Ecosistema Clínico

Para conectar una aplicación web moderna (Next.js + Supabase) con la infraestructura de hardware y software de un sanatorio, el diagrama arquitectónico debe separar las preocupaciones de red y los protocolos de aplicación. La aplicación web jamás debe intentar comunicarse a bajo nivel con el hardware.

] Capa Middleware \] ] Capa de Aplicación Cloud \]

+\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--+

\| Analizadores Laboratorio \|\-\-\--(RS232 / TCP/IP)\-\-\--+

\| (Protocolo ASTM/LIS2-A2) \| \|

+\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--+ \|

v

+\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--+ +\-\-\-\-\-\-\-\-\-\-\-\--+ +\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--+

\| Sistema PACS Radiología \| \| MOTOR DE \| \| Backend Next.js / API \|

\| (DICOM / Mensajes HL7v2) \|\-\-\-\--(TCP/MLLP)\--\| INTEGRACIÓN \|\-\-\-\-\--(HTTP/S)\-\-\-\--\| (Lógica de Negocio y \|

+\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--+ \| (Ej. Mirth \| (JSON/FHIR) \| Autenticación) \|

\| Connect / \| +\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--+

+\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--+ \| Open Int. \| \|

\| Electrocardiógrafos \| \| Engine) \| v

\| (XML / DICOM / PDF FTP) \|\-\-\-\-\--(FTP/SMB)\--\| \| +\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--+

+\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--+ +\-\-\-\-\-\-\-\-\-\-\-\--+ \| Base de Datos Relacional \|

\^ \| (Supabase / PostgreSQL \|

+\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--+ \| \| con columnas JSONB) \|

\| Monitores de Pacientes \| \| +\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--+

\| (IEEE 11073 / HL7 ORU) \|\-\-\-\--(TCP/IP)\-\-\-\-\-\-\-\-\-\--+

+\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--+

En este modelo asíncrono, el Motor de Integración mantiene puertos de escucha (Listeners) activos permanentemente dentro de la red de área local (LAN) del sanatorio. Al recibir telemetría binaria o texto delimitado, lo analiza, extrae el identificador del paciente, transforma el contenido a una carga útil (payload) JSON estructurada y limpia, y la empuja (Push) hacia los endpoints REST seguros de la aplicación Next.js.^6^

### ¿Realmente Necesito Esto? (Evaluación para Sanatorio UPCN)

**Sí, desde el día uno.** Para un desarrollador solitario, intentar programar manejadores de sockets TCP persistentes, implementar la recuperación de caídas de red y parsear expresiones regulares complejas de protocolos de 1980 directamente dentro de un framework *serverless* como Next.js es un antipatrón arquitectónico que resultará en un fracaso sistémico.^2^ El middleware asume todo el trabajo pesado de conectividad física, permitiendo que la aplicación web opere puramente en el paradigma que conoce: consumiendo y emitiendo JSON sobre HTTP. Desplegar una instancia on-premise de Mirth Connect (o su variante Open Source) en un servidor local del sanatorio es el mecanismo mínimo indispensable para unificar el flujo de datos.

## 2. Integración de Equipamiento de Laboratorio (LIS)

La integración con el laboratorio de análisis clínicos representa uno de los vectores más críticos para la digitalización hospitalaria. El volumen de datos discretos generados es monumental, y los errores derivados de la transcripción manual de resultados analíticos conllevan riesgos graves para la seguridad del paciente.

### Protocolo ASTM / LIS2-A2

La gran mayoría de los autoanalizadores (química clínica, hematología, endocrinología, gases en sangre) no poseen interfaces RESTful ni utilizan formatos modernos como JSON. Operan bajo un conjunto estricto de estándares legados creados por la *American Society for Testing and Materials* (ASTM), específicamente las normas ASTM E1381 (que rige la capa física y de enlace) y ASTM E1394 (que rige el formato lógico de los datos).^22^ En la actualidad, el *Clinical and Laboratory Standards Institute* (CLSI) es la entidad custodia de estos estándares, habiéndolos rebautizado y modernizado como LIS1-A y LIS2-A2 respectivamente.^24^

El protocolo LIS2-A2 define las convenciones estructurales para la transferencia bidireccional de peticiones de pruebas (órdenes) y resultados entre instrumentos analíticos e información de sistemas.^24^ Funcionalmente, se asemeja al intercambio de registros tabulares con campos delimitados por caracteres especiales, pero con una jerarquía relacional estricta.^26^ Los mensajes fluyen en tramas controladas mediante caracteres de la tabla ASCII (ENQ para solicitar la línea, ACK para acusar recibo de la trama, EOT para finalizar la transmisión).

La jerarquía de los registros lógicos en LIS2-A2 se estructura de la siguiente manera:

- **H (Header Record):** Inicia la transmisión, estableciendo la sesión lógica y proporcionando metadatos sobre el instrumento emisor (marca, modelo, versión de software).

- **P (Patient Record):** Contiene la demografía fundamental del paciente (ID único, nombre completo, fecha de nacimiento, sexo).^26^

- **O (Order Record):** Subordinado al registro P, define las pruebas específicas solicitadas para una muestra biológica particular, identificada por un código de barras o número de acceso (Accession Number).^26^

- **R (Result Record):** Subordinado al registro O, contiene los valores analíticos individuales devueltos por la máquina, las unidades de medida, los rangos de referencia poblacionales y las banderas (flags) de anormalidad.^26^

- **C (Comment Record):** Notas adicionales sobre el procesamiento o la integridad de la muestra clínica.

- **L (Terminator Record):** Finaliza la sesión lógica de transmisión.^26^

### Flujo Unidireccional vs. Bidireccional

La integración de laboratorio puede arquitectarse en dos niveles progresivos de complejidad:

1.  **Flujo Unidireccional (Receive-Only o Broadcast):** Representa el nivel básico de automatización. El técnico de laboratorio introduce manualmente los datos demográficos del paciente y las pruebas requeridas en el panel táctil del analizador. Una vez que la máquina procesa el suero o la sangre, transmite automáticamente el bloque de resultados (Registros H-P-O-R-L) a través del puerto de red. El motor de integración los recibe, extrae los valores analíticos, los asocia con el paciente mediante su DNI o ID, y los inyecta en la base de datos de la historia clínica electrónica.^27^

2.  **Flujo Bidireccional (Send and Receive / Query Mode):** Representa el nivel avanzado. El proceso comienza cuando el médico prescribe una analítica en la aplicación web clínica. Esta orden es procesada por el middleware y enviada proactivamente hacia la lista de trabajo pendiente (Worklist) del analizador. Posteriormente, cuando el técnico inserta el tubo de ensayo en la máquina y esta lee el código de barras (Accession #), el analizador consulta internamente su Worklist o envía una petición de consulta (Query) al middleware, reconoce la muestra, ejecuta mecánicamente únicamente las pruebas solicitadas, y devuelve los resultados a la historia clínica cerrando el ciclo.^27^

### Conectividad Física: Superando la Brecha del Hardware

Las máquinas de laboratorio suelen estar confinadas en áreas estériles, mientras que los servidores residen en centros de cómputos o entornos virtualizados. Un porcentaje significativo de analizadores, incluso modelos contemporáneos, siguen dependiendo de puertos seriales RS-232 físicos para la comunicación externa.^28^

Dado que los servidores modernos carecen de interfaces seriales nativas y las aplicaciones en la nube no pueden acceder a hardware local, es imperativo convertir esta señal eléctrica analógica en paquetes enrutables TCP/IP.^28^ Para lograr esto, la industria utiliza \"Servidores de Dispositivos Seriales\" (Serial-to-Ethernet Device Servers). Mientras que existen alternativas genéricas de bajo costo, la evidencia del sector demuestra que estas son propensas a interrupciones térmicas y desbordamientos de búfer (buffer overflows) que resultan en la pérdida irrecuperable de resultados clínicos.^30^ Se recomienda enfáticamente el uso de hardware de grado industrial, siendo la serie **MOXA NPort 5110** el estándar de oro.^28^ Estos dispositivos convierten la trama serial en una conexión de red TCP cruda de manera estable.^28^ Una vez en la red local, el motor Mirth Connect establece un conector tipo \"TCP Listener\" configurado hacia la dirección IP del MOXA para recibir el flujo de datos.^19^

### Analizadores Comunes en Clínicas Argentinas

En el entorno sanitario de Argentina, particularmente en instituciones de complejidad media y alta en provincias como Córdoba, existe un oligopolio de marcas tecnológicas cuyas integraciones están bien documentadas:

- **Mindray:** Fabricante chino de inmensa penetración debido a su relación costo-beneficio. Equipos como el BC-5150 o BC-5800 (contadores hematológicos) y BS-380 (autoanalizadores de química clínica) son el estándar en laboratorios de sanatorios.^32^

- **Roche Diagnostics:** Dominante en procesamientos de alto rendimiento. Las plataformas modulares de la familia Cobas (ej. Cobas 8000) son habituales en grandes laboratorios centrales.^35^

- **Abbott Laboratories:** Equipos de la familia Architect y sistemas Alinity, reconocidos por su desempeño Six Sigma en química clínica e inmunoensayos.^37^

- **Sysmex:** Proveedor japonés líder indiscutido en la línea de análisis hematológico (Serie XN).^33^

La práctica totalidad de estos instrumentos ofrecen salidas estandarizadas ASTM/LIS2-A2 o soporte para HL7v2 sobre protocolos de red, facilitando su integración con Mirth Connect.^39^ Es importante destacar que el estándar LIS2-A2, concebido hace décadas, transfiere datos en texto plano sin cifrado (cleartext), lo que plantea vulnerabilidades de ciberseguridad (ej. ataques de inundación TCP, intercepción) en redes no segmentadas, por lo que la comunicación debe ocurrir estrictamente dentro de una VLAN hospitalaria aislada.^41^

### LIS vs. RIS: ¿Necesito Construir un LIS?

A diferencia de un RIS (Radiology Information System), que se centra primordialmente en la logística, el agendamiento y el flujo de pacientes alrededor de máquinas de alto costo, un **LIS (Laboratory Information System)** es un software profundamente analítico y metrológico. Un LIS maduro gestiona el control de calidad interno y externo (incluyendo el cálculo estadístico de gráficos de Levey-Jennings y reglas de Westgard), el inventario y caducidad de reactivos químicos, la logística de derivación de muestras biológicas a laboratorios de mayor complejidad, y posee algoritmos complejos para la validación automática de resultados (auto-verification) basados en deltas históricos del paciente.^39^

**¿Realmente Necesito Esto? (Evaluación para Sanatorio UPCN)**

**No, no intente construir un LIS completo.** Para un desarrollador solitario o un equipo pequeño, replicar las funciones metrológicas y legales de un LIS comercial es un riesgo de ingeniería inasumible en etapas tempranas. La estrategia mínima viable (MVP) consiste en omitir la construcción de los módulos de control de calidad. Permita que los bioquímicos del sanatorio continúen utilizando el software nativo de gestión (middleware de laboratorio) que proveen las marcas de las máquinas. Su aplicación web construida en Next.js debe actuar simplemente como un nodo final pasivo: configure Mirth Connect para escuchar las tramas unidireccionales de los resultados ya validados técnica y biológicamente por el profesional humano, extraiga los datos, conviértalos a JSON y muéstrelos ordenadamente en la historia clínica del paciente. Solo se debe considerar la arquitectura bidireccional (envío de órdenes desde Next.js a la máquina) cuando el sanatorio logre madurez operativa para imprimir y etiquetar rutinariamente códigos de barras en cada tubo de muestra de sangre.^27^

## 3. Integración de Máquinas de Electrocardiografía (ECG)

Mientras que la rama de la radiología e imágenes médicas logró unificar su ecosistema de interoperabilidad bajo el estándar universal DICOM, la cardiología, y específicamente el dominio de la electrocardiografía de reposo y esfuerzo, ha sufrido históricamente de una profunda falta de estandarización para el almacenamiento de ondas.^42^ El resultado es un panorama de formatos heterogéneos que dificulta la integración fluida en sistemas web modernos.

### Formatos de Salida de Datos

Las máquinas de ECG (electrocardiógrafos) exportan los registros de la actividad eléctrica del corazón en una variedad de formatos técnicos incompatibles entre sí ^42^:

1.  **DICOM-ECG (Suplemento 30):** Es teóricamente el formato óptimo para infraestructuras unificadas. Definido en el año 2000, permite encapsular las formas de onda eléctricas (Waveforms) como objetos persistentes dentro de la misma infraestructura de almacenamiento del PACS radiológico (Picture Archiving and Communication System).^45^ Su ventaja principal es la consolidación del almacenamiento.^42^ Sin embargo, su adopción práctica en clínicas medianas es escasa; salvo en equipos de alta gama, pocos electrocardiógrafos generan nativamente DICOM-ECG sin el uso de pasarelas de conversión externas (\"Osborne Boxes\").^42^

2.  **SCP-ECG (Standard Communications Protocol for Computer-Assisted Electrocardiography - EN 1064 / ISO 11073):** Es el protocolo europeo estándar. Fue diseñado en los años 90 para transmitir información por redes de muy bajo ancho de banda.^46^ Para lograr archivos minúsculos, emplea algoritmos de compresión binaria extremadamente complejos, incluyendo compresión bimodal, codificación Huffman y cálculo de diferencias de primer y segundo orden para codificar el \"latido mediano\" representativo.^46^ Escribir un decodificador desde cero en JavaScript para leer este formato binario en una aplicación web es un esfuerzo de ingeniería masivo y propenso a errores.^48^

3.  **Formatos XML Propietarios:** Fabricantes como Philips y Schiller optaron por exportar la información clínica (demografía, mediciones algorítmicas y arreglos de vectores de voltaje de las 12 derivaciones) utilizando la sintaxis XML.^47^ Posteriormente, se estandarizó en formatos como HL7 aECG.^44^ Aunque son legibles por humanos y sistemas (text-based), su estructura varía significativamente según el fabricante, requiriendo el desarrollo de analizadores (parsers) semánticos a medida.^50^

4.  **Formatos Estáticos de Presentación (PDF / JPEG / TIFF):** La inmensa mayoría de los electrocardiógrafos de uso común incluyen una funcionalidad para \"imprimir\" digitalmente el reporte visual de las ondas sobre la clásica cuadrícula milimetrada, guardándolo como un archivo PDF estático y transmitiéndolo a un servidor FTP o carpeta compartida en la red local (SMB).^42^

### Almacenamiento y Visualización Web: Desafíos Técnicos

Integrar formas de onda interactivas en una aplicación web moderna basada en React/Next.js requiere extraer los datos vectoriales puros (los arreglos de voltajes en milivoltios respecto al tiempo en milisegundos) a partir de archivos SCP-ECG o XML.^43^ Una vez obtenidos, se deben utilizar librerías de alto rendimiento basadas en HTML5 Canvas o WebGL para renderizar las líneas de los complejos PQRST sobre una cuadrícula milimetrada simulada generada por CSS.^52^

Este enfoque presenta un riesgo clínico severo: si la librería web falla en el cálculo de la relación de aspecto, el espaciado de calibración estándar (25 mm/s de velocidad de papel y 10 mm/mV de amplitud) se distorsiona.^46^ Un médico cardiólogo diagnosticando hipertrofia ventricular o isquemia basándose en un gráfico renderizado incorrectamente en el navegador podría emitir un diagnóstico erróneo con implicaciones médico-legales significativas.^46^

**¿Realmente Necesito Esto? (Evaluación para Sanatorio UPCN)**

**No para los datos crudos, sí para los informes.** Construir un visor de vectores de ECG basado en la web e intentar decodificar binarios SCP-ECG es una trampa de productividad que consumirá meses de desarrollo sin aportar un retorno de inversión proporcional para un solo sanatorio.

La integración mínima viable y más segura consiste en apoyarse en el formato PDF estático. Configure las máquinas de ECG del sanatorio para exportar automáticamente los informes PDF hacia un servidor FTP interno. Mirth Connect debe configurarse con un conector tipo \"File Reader\" que escanee continuamente este directorio. Al detectar un archivo nuevo, el motor utiliza expresiones regulares sobre el nombre del archivo para identificar el ID del paciente o la fecha, codifica el PDF a formato Base64, y realiza una petición POST hacia el backend de Next.js, almacenando el documento en Supabase. El cardiólogo consultará la historia clínica web y visualizará el PDF original inmutable generado por la máquina certificada, garantizando un 100% de fidelidad diagnóstica y reduciendo drásticamente la fricción tecnológica.

## 4. Integración de Monitoreo de Pacientes

El ámbito del monitoreo de pacientes es el sector más exigente respecto a la integración clínica, abarcando una vasta topología de dispositivos al lado de la cama: monitores multiparamétricos de signos vitales, oxímetros de pulso, bombas de infusión controladas y ventiladores mecánicos.^55^ A diferencia de los laboratorios o los ECGs, donde la información se produce en eventos discretos puntuales (se procesa una muestra y finaliza), el monitoreo se caracteriza por la generación de flujos de datos ininterrumpidos y dependientes del tiempo.

### El Estándar ISO/IEEE 11073 (X73)

La fragmentación y los protocolos cerrados de los fabricantes en las unidades de cuidados críticos impulsaron el desarrollo de la familia de estándares **ISO/IEEE 11073 (Personal Health Data / Point-of-Care Medical Device Communication)**.^55^ Este extenso corpus normativo tiene como objetivo resolver la interoperabilidad *plug-and-play* y la representación semántica unívoca de los datos vitales.^57^

La arquitectura profunda del estándar IEEE 11073 opera bajo un principio asimétrico de comunicación \"Agente/Administrador\" (Agent/Manager).^57^ El dispositivo médico conectado al paciente (el monitor de cabecera) actúa como el *Agente* responsable de recolectar las variables fisiológicas. El sistema informático central (el servidor de recolección de datos o middleware) funciona como el *Administrador*.^57^

El núcleo del estándar es el Modelo de Información de Dominio (Domain Information Model - DIM).^57^ Este modelo estructura de manera jerárquica y orientada a objetos todas las observaciones posibles. Utiliza la clase Medical Device System (MDS) para describir el estado operativo del aparato, la clase Numeric para reportar valores absolutos calculados (como la frecuencia cardíaca o la temperatura), y la clase Real Time Sampled Array (RT-SA) para transportar los vectores continuos que conforman las ondas fisiológicas (como el trazado pletismográfico o la capnografía).^58^

### Flujo de Datos: Tiempo Real vs. Lecturas Periódicas

En la topología de red clínica, el mecanismo de transmisión dicta la complejidad de la infraestructura requerida:

1.  **Flujos Continuos en Tiempo Real (Real-Time Streams):** Implementados primordialmente en Unidades de Cuidados Intensivos (UCI) y quirófanos. Los dispositivos generan flujos continuos e ininterrumpidos, procesando miles de muestras vectoriales por segundo y requiriendo latencias imperceptibles para resolver alarmas clínicas críticas (asistolias, fibrilación ventricular).^59^ Esta sincronización milimétrica (a menudo soportada por NTP o PTP) es fundamental para coordinar acciones terapéuticas inmediatas.^62^

2.  **Lecturas Periódicas o Episódicas (Spot-Checks):** Utilizadas en las salas de internación general (Wards). En este flujo de trabajo, los profesionales de enfermería toman mediciones discretas de la presión arterial, saturación de oxígeno y temperatura en intervalos protocolizados (cada 4 o 6 horas). Los monitores rodantes acumulan esta información en su memoria interna (Store-and-Forward) y la transmiten en ráfagas o paquetes pequeños hacia el servidor de red, sin requerir procesamiento en tiempo real.^63^

### Relevancia para un Sanatorio vs. la Realidad del Desarrollo

Abordar la integración de telemetría de cuidados críticos es un desafío de ingeniería monumental. Las Unidades de Cuidados Intensivos modernas sufren de \"fatiga de alarmas\" (Alarm Fatigue), una condición donde la cacofonía constante de advertencias acústicas (a menudo falsos positivos o alarmas sin relevancia clínica) lleva al personal a desensibilizarse e ignorar notificaciones críticas, resultando en daños graves comprobados para los pacientes.^56^ Intentar mitigar esto construyendo un sistema distribuido de alertas basado en streaming TCP/IP requiere arquitecturas altamente resilientes y tolerantes a fallos (Message Queuing, Kafka, Brokers de eventos) que superan el patrón Hub-and-Spoke de un motor tradicional.^3^

Aún más crítico es el aspecto regulatorio. Interceptar, analizar y enrutar datos de soporte vital en tiempo real clasifica inmediatamente al software desarrollado como un *Dispositivo Médico (Software as a Medical Device - SaMD)*. Esto exige certificaciones rigurosas de entes reguladores de salud (como ANMAT en Argentina o FDA en EE. UU.) y expone a la empresa desarrolladora a responsabilidades civiles y penales severas ante la caída de un servidor.^65^

**¿Realmente Necesito Esto? (Evaluación para Sanatorio UPCN)**

**No para la UCI, sí para el piso (y de forma diferida).** Para un desarrollador solitario, adentrarse en la integración en tiempo real de unidades de cuidados intensivos es un riesgo desproporcionado que podría paralizar el proyecto. El enfoque mínimo viable para la gestión integral del sanatorio consiste en obviar la UCI en las primeras fases tecnológicas.

Concéntrese en la internación general. La integración viable radica en adquirir monitores de signos vitales tipo \"Spot-Check\" compatibles con red wifi, los cuales se sincronizan con un software de central de monitoreo comercial provisto por el fabricante. Mirth Connect se limitará a establecer un puerto de escucha (Listener) donde el servidor central de la marca emitirá pasivamente mensajes de resumen en formato HL7 ORU tras cada ronda de enfermería. Estos mensajes intermitentes y asíncronos contendrán los valores puntuales validados por el enfermero (presión, frecuencia, saturación), los cuales se parsearán y anexarán a la hoja de evolución diaria del paciente en Supabase. Si no existe presupuesto para monitores de red, la carga manual de constantes vitales a través de la aplicación web en tablets por parte del personal de enfermería sigue siendo la estrategia más robusta y sensata para la Fase 1.

## 5. Inmersión Profunda en HL7v2: La Realidad Práctica

A pesar de la evolución paradigmática de las tecnologías de la información hacia interfaces web (REST, GraphQL) y formatos estructurados anidados (JSON, XML), el estándar **Health Level Seven Version 2 (HL7v2)** sigue siendo \"el caballo de batalla\" de la automatización clínica. Reportes de la industria estiman que más del 95% de las organizaciones de atención médica en Estados Unidos, y una abrumadora mayoría de los hospitales a nivel mundial, dependen cotidianamente de HL7v2 para su orquestación interna.^69^ Cualquier intento de integración hospitalaria exige dominar su estructura de manera absoluta.

### Anatomía y Estructura del Mensaje

A diferencia de los formatos web modernos, HL7v2 fue diseñado en la década de 1980 bajo severas limitaciones de ancho de banda y capacidad de cómputo. En consecuencia, es un protocolo puramente posicional basado en texto plano delimitado, optimizado para minimizar la transmisión de caracteres redundantes.^70^

Un mensaje de HL7v2 está compuesto por múltiples líneas o bloques funcionales denominados **Segmentos**, cada uno encapsulando una categoría específica de información clínica o administrativa.^71^ Cada segmento comienza obligatoriamente con un código alfanumérico de tres letras (ej., PID, MSH) y termina con un retorno de carro (Carriage Return - CR).

Dentro de cada segmento, la información se divide en **Campos** separados típicamente por el carácter de barra vertical o tubería (\|). Si un campo contiene múltiples datos lógicos internos, se subdivide en **Componentes** separados por un acento circunflejo (\^). Para datos que deben repetirse en el mismo campo (como una lista de números telefónicos), se utiliza la virgulilla (\~) como delimitador de repetición.^69^

*Ejemplo anatómico de un segmento de identidad demográfica:* PID\|1\|\|12345678\^\^\^HOSP\^MR\|\|DOE\^JOHN\^\^\^\^\|\|19800101\|M\|\|\|123 Main St\^\^Somewhere\^CA\^90210 ^69^

### Tipos de Mensajes y Segmentos Críticos

El ecosistema HL7v2 funciona mediante una arquitectura orientada a eventos (\"Trigger Events\"). Cada transacción física en el flujo del hospital dispara una notificación de texto predefinida hacia la red.^73^ Los segmentos y tipos de mensajes indispensables a integrar son:

**Segmentos Fundamentales:**

- **MSH (Message Header):** Es inexcusablemente el primer segmento de todo mensaje. Contiene los metadatos vitales de la transacción: aplicación emisora, aplicación receptora, estampa de tiempo (timestamp), el tipo exacto del mensaje y la versión del estándar HL7 utilizada.^72^

- **PID (Patient Identification):** Agrupa la demografía dura del individuo: identificadores únicos universales e internos de la clínica, nombre completo, fecha de nacimiento estructurada y sexo biológico.^72^

- **PV1 (Patient Visit):** Detalla el contexto temporal y espacial del episodio asistencial (Encounter). Incluye la clase de paciente (ambulatorio, urgencia, internado), su ubicación física (pabellón, habitación, cama) y los profesionales tratantes asignados.^72^

- **OBR (Observation Request):** Actúa como el encabezado para el registro de una orden de servicio diagnóstico clínico (una radiografía o un panel de laboratorio).^74^

- **OBX (Observation Result):** Aporta el resultado atómico derivado de una prueba. Especifica la métrica analizada, su valor cuantitativo o cualitativo, las unidades, y los umbrales de referencia y pánico.^74^

**Flujos de Trabajo mediante Tipos de Mensajes:**

- **ADT (Admit, Discharge, Transfer):** La columna vertebral administrativa. Gobierna el flujo de ubicación del individuo.

  - ADT\^A01: El paciente ingresa e inicia un período de internación.

  - ADT\^A02: Traslado físico del paciente (ej., de internación general a terapia intermedia).

  - ADT\^A03: Alta médica y salida administrativa de la institución.

  - ADT\^A04: Registro inicial ambulatorio (turnos de consultorio externo).

  - ADT\^A08: Actualización de información demográfica sin cambio de ubicación.^70^

- **ORM (Order Message):** Transmite información bidireccional sobre la solicitud de prestaciones. Cuando un facultativo prescribe un análisis en la aplicación Next.js, el middleware empaqueta la solicitud y dispara un evento ORM\^O01 hacia el sistema de laboratorio o el LIS para generar la etiqueta del tubo.^75^

- **ORU (Observation Result):** Es el vehículo a través del cual la clínica recibe los hallazgos médicos. Los resultados validados de hematología, así como las lecturas de los monitores de signos vitales, llegan como mensajes ORU\^R01 no solicitados o periódicos.^74^

- **SIU (Scheduling Information Unsolicited):** Sincroniza la agenda de recursos limitados. El evento SIU\^S12 avisa a las modalidades de radiología (resonador magnético) que se ha concretado una nueva reserva de turno, facilitando la programación del día.^74^

### Transporte: El Protocolo MLLP (Minimal Lower Layer Protocol)

HL7v2 define exclusivamente la sintaxis del texto; no prescribe cómo transportarlo. Dado que protocolos superiores como HTTP introducen demoras y sobrecargas (headers) indeseables para redes internas de alta frecuencia, la industria estandarizó el uso de **MLLP** sobre sesiones TCP/IP nativas y persistentes.^79^

Dado que los sockets TCP representan un flujo de bytes continuo sin delimitación natural (stream), MLLP encapsula la secuencia de texto HL7 entre bloques de caracteres hexadecimales no imprimibles (Bloques de Encuadre o Framing Blocks). El mensaje se inicia invariablemente con el byte vertical tab \<VT\> (0x0B) y concluye con una secuencia dual de fin de archivo y retorno de carro \<FS\>\<CR\> (0x1C y 0x0D).^79^ Este enmarcado permite a los servidores identificar matemáticamente dónde empieza y termina cada bloque de texto, previniendo la fragmentación o colisión de mensajes concurrentes en el puerto.

### El Rol Crítico de Mirth Connect en la Transformación

Escribir analizadores semánticos (parsers) robustos de HL7 en aplicaciones Node.js (Next.js) para extraer datos posicionales está sujeto a altos márgenes de error por excepciones imprevistas. Aquí es donde la potencia de Mirth Connect (o un motor equivalente) resulta irreemplazable.

Mirth gestiona componentes \"Listeners\" que mantienen abiertos puertos de red MLLP dedicados, asumiendo la responsabilidad concurrente de recibir las tramas, desenmarcar los bytes especiales (0x0B, 0x1C) y generar automáticamente los acuses de recibo lógicos (Mensajes HL7 ACK) exigidos por los dispositivos heredados para confirmar la transacción.^6^

Una vez capturado el texto, Mirth aplica internamente un análisis léxico, transformando la estructura rígida de tuberías de HL7v2 en un árbol DOM virtual (representado visualmente como XML o internamente accesible como JSON).^6^ A partir de allí, el ingeniero de integración utiliza scripts ligeros basados en JavaScript para interactuar lógicamente con los datos (por ejemplo, extraer el nombre evaluando msg.toString()), conformando dinámicamente un objeto JSON limpio que, finalmente, Mirth emite hacia el ecosistema de la nube de Supabase utilizando una petición POST estándar a la API.^83^

**¿Realmente Necesito Esto? (Evaluación para Sanatorio UPCN)**

**Absolutamente sí. Es la piedra angular de su ecosistema.** El flujo de datos demográficos y de eventos (ADT) debe ser impecable. Como desarrollador único, la arquitectura debe establecer que su aplicación web (la plataforma de gestión de turnos e internación) funja como la \"Única Fuente de Verdad\" (Single Source of Truth) demográfica.

Cuando el área de admisiones registre a un nuevo paciente en la interfaz de Next.js y lo almacene en Supabase, la base de datos disparará un webhook (evento HTTP) hacia el servidor local que aloja a Mirth Connect. Este motor traducirá instantáneamente el evento en un mensaje de texto ADT\^A04 o ADT\^A01, y lo emitirá vía MLLP TCP hacia la red privada del sanatorio, inyectándolo en el sistema PACS de los radiólogos y en el middleware de los bioquímicos. Esto asegura que todo el complejo institucional opere con identificadores consistentes, evitando duplicidades y permitiendo que, cuando el paciente llegue a hacerse su tomografía, el radiólogo ya disponga de todos sus datos sin necesidad de transcribirlos. Intentar evadir HL7v2 buscando APIs REST modernas en los escáneres físicos del sanatorio es ilusorio en el panorama tecnológico argentino contemporáneo.

## 6. FHIR: La Alternativa Moderna y el Diseño de Bases de Datos

Fast Healthcare Interoperability Resources (FHIR), desarrollado bajo el alero de Health Level Seven International (HL7), representa una disrupción estructural frente a los sistemas legados. A diferencia del paradigma de HL7v2---basado en documentos de texto cerrados y rígidos emitidos a través de sockets TCP---, FHIR adopta íntegramente las convenciones de la web moderna, modelando la atención sanitaria mediante entidades lógicas discretas (Recursos) manipulables a través de una Interfaz de Programación de Aplicaciones (API) con arquitectura RESTful y representaciones directas en JSON o XML.^11^

### Recursos Conceptuales Relevantes y Arquitectura RESTful

El esquema FHIR promueve la composición (composability); construir escenarios clínicos complejos mediante el encadenamiento relacional de recursos elementales.^85^ En la arquitectura lógica del sanatorio, el dominio de la base de datos debería gravitar sobre los siguientes recursos núcleo:

- **Patient:** Consolida los atributos demográficos y de identidad, absorbiendo los dominios de contacto, afiliación y nacimientos.^86^

- **Encounter:** Modela un episodio discreto de atención entre el sujeto y el sistema de salud. Funciona como el pivote relacional para vincular eventos asilados dentro del contexto de una internación prolongada, una consulta de guardia médica o una visita ambulatoria programada.^86^

- **DiagnosticReport:** Representa un documento unificador resultante de una orden clínica. Reúne informes radiológicos narrativos, paneles completos de determinaciones bioquímicas o hallazgos cardiológicos (EKG).^87^

- **Observation:** El recurso de mayor granularidad. Modela hechos atómicos: un valor numérico de glucosa en sangre extraído de un analizador, un ritmo cardíaco de un monitor, o la presencia semicuantitativa de bacterias en orina.^88^

- **ServiceRequest:** Sistematiza las órdenes prescriptivas, constituyendo el punto de partida (la indicación médica) para procedimientos intervencionistas o pruebas de laboratorio.^89^

La semántica REST de FHIR permite operaciones estandarizadas (CRUD). Una petición HTTP GET /Patient?family=Smith a un servidor FHIR busca unívocamente, y una orden HTTP POST /Observation inserta registros clínicos con códigos de estado HTTP predecibles.^20^

### Convivencia de Estándares e Implementación en Argentina

Pretender reemplazar instantáneamente HL7v2 por FHIR en las entrañas de hardware físico del sanatorio es inviable en la presente década.^7^ La topología imperante es de naturaleza híbrida: los dispositivos biomédicos internos conversan en dialectos HL7v2 o LIS2-A2 confinados en las redes de área local, mientras que un Motor de Integración transforma los datos salientes, permitiendo que la capa de aplicación superior (y la interoperabilidad hacia el exterior con obras sociales y el Estado) fluya estrictamente en FHIR.^5^

A nivel gubernamental, la República Argentina se encuentra en un proceso de transición estratégica. Desde la sanción de la Resolución 115/2019 de la Dirección Nacional de Sistemas de Información en Salud (DNSIS), se oficializó la creación de la Red Nacional de Interoperabilidad en Salud (RNDS), instituyendo a FHIR (en sus versiones R4/R4B) como el pilar técnico obligatorio para el intercambio federal.^90^ En colaboración con la organización HL7 Argentina, se han publicado Guías Nacionales de Implementación que normalizan los perfiles núcleo (Base Core), diccionarios de terminología y vocabularios SNOMED CT aplicados a recetas electrónicas (e-Prescriptions), directorios de proveedores y federación de pacientes (PIX).^90^ Adoptar estas guías tempranamente confiere al sistema del sanatorio una ventaja competitiva masiva para futuras homologaciones frente a obras sociales (APROSS/PAMI) y auditorías provinciales.^91^

### Arquitectura de Persistencia: Supabase (PostgreSQL) vs. Servidores HAPI FHIR

Un dilema crítico en el diseño de software para FHIR reside en el modelo de base de datos. Un recurso FHIR en JSON se asemeja a un objeto anidado sumamente variable, plagado de arrays infinitos e hiperflexibilidad (dada por el uso del patrón *Extensions* del estándar).^93^ Construir una base de datos relacional tradicional y estrictamente estructurada en filas y columnas (Normalized Tables) para persistir estos datos deviene rápidamente en el ineficiente antipatrón *Entity-Attribute-Value (EAV)*, pulverizando el rendimiento de lectura y complicando el esquema.^93^

Ante esto, muchos ecosistemas empresariales despliegan Servidores HAPI FHIR de código abierto (en Java) que actúan como \"cajas negras\".^11^ Estos servidores gestionan su propia base de datos (mediante Hibernate ORM), abstraen el almacenamiento y brindan operaciones complejas de búsqueda (FHIR Search Parameter API) \"fuera de la caja\" (out-of-the-box).^93^ Sin embargo, esta decisión arquitectónica exige el mantenimiento paralelo de una máquina virtual Java pesada, eleva los costos operativos de infraestructura (consumo altísimo de RAM), y fractura la homogeneidad del desarrollo.^13^

En contraste, Supabase---la plataforma backend como servicio subyacente basada en PostgreSQL---ofrece nativamente el tipo de dato avanzado jsonb.^94^ Las columnas jsonb almacenan el árbol JSON en un formato binario descompuesto, habilitando indexación profunda mediante algoritmos Generalized Inverted Index (GIN).^93^ Esto significa que es factible almacenar un Recurso FHIR completo en una única celda de la base de datos sin sacrificar la capacidad de buscar, filtrar e intersectar nodos del JSON con velocidades de consulta excepcionales.^93^

**¿Realmente Necesito Esto? (Evaluación para Sanatorio UPCN)**

**Sí a la semántica FHIR, No al Servidor HAPI.** Como desarrollador individual aprovechando la arquitectura Serverless de Next.js, instalar y gobernar un servidor monolítico en Java (HAPI FHIR) desviará drásticamente los esfuerzos, incrementando los costos en la nube e impidiendo agilidad.^13^

La estrategia óptima es diseñar el esquema de la base de datos relacional en Supabase inspirándose intrínsecamente en los modelos de datos de FHIR.^98^ Usted no necesita utilizar FHIR estricto para almacenar la información de forma interna, sino para representarla y exponerla.^98^ Implemente un modelo donde su base de datos resguarde las variables duras en columnas relacionales de rápido acceso, mientras delega las propiedades médicas altamente flexibles y listas anidadas a columnas jsonb indexadas (ej. la tabla paciente cuenta con DNI e ID primario normalizado, pero un campo fhir_extensions_jsonb para la metadata auxiliar clínica). Cuando sea necesario cumplir con normativas de interoperabilidad e interactuar con la RNDS del gobierno argentino o remitir una Epicrisis, una capa de servicios en el backend de su aplicación Next.js simplemente empaquetará las tablas relacionales en la representación canónica estandarizada JSON requerida por la API externa en demanda.^98^

## 7. Evaluación de Viabilidad, Riesgos Arquitectónicos y Hoja de Ruta

Abordar la construcción en solitario de un ecosistema clínico integral---cubriendo flujos demográficos (turneras), procesos financieros (facturación), captura de hallazgos por inteligencia artificial (dictado clínico), y portales interactivos de pacientes---representa de por sí un reto colosal en gestión de productos de software. Añadir a esta meta el desarrollo de la capa de comunicación de bajo nivel para interceptar y analizar la telemetría binaria de cientos de dispositivos físicos (hardware) aumenta exponencialmente la superficie de fallos.

El mayor riesgo del emprendimiento es caer en el \"Sobrediseño Temprano\" (Over-engineering) y la \"Visión Holística Integradora Absoluta\", paralizando implementaciones con valor de retorno inmediato por el intento perfeccionista de unificar aparatos biomédicos de baja criticidad en la nube.^2^

### Evaluación Definitiva de Componentes Tecnológicos

1.  **Motor de Integración Middleware (Mirth Connect / OIE): Innegociable.** La aplicación basada en Next.js carece de los mecanismos subyacentes seguros y confiables para gestionar aperturas de puertos de red continuos y procesar dialectos posicionales de la década de 1980.^21^ Instalar un middleware centralizado *on-premise* en los servidores locales del Sanatorio UPCN es un pre-requisito obligatorio para aislar la complejidad física de su código alojado en la nube.^2^

2.  **Inmersión en HL7v2: Innegociable.** Por obsoleto que parezca ante las tecnologías contemporáneas, el 100% del software corporativo de diagnóstico en Argentina (PACS, RIS e interfaces para laboratorios comerciales) exige ser alimentado demográficamente mediante mensajes tipo ADT sobre TCP/IP (MLLP).^69^ Ignorarlo supondrá transcribir de nuevo en cada sistema el identificador (DNI) de los pacientes, destruyendo el propósito integral.

3.  **Adopción de Modelo FHIR (Supabase): Altamente Recomendado.** Proveerá la agilidad conceptual que demanda el software moderno. Indexar los recursos modulares en PostgreSQL (JSONB) blindará el código contra refactorizaciones futuras requeridas por el Ministerio de Salud.^90^ No es necesario desplegar un Servidor HAPI de Java a menos que lo imponga una norma inminente.^13^

4.  **Integración Directa LIS-A2 (Laboratorio Unidireccional): Viable.** La captura asíncrona y unidireccional de resultados estructurados (utilizando conversores MOXA TCP/IP) ofrece un gran avance en tiempos de respuesta al paciente con mínima injerencia legal o algorítmica sobre los controles de calidad del laboratorio.

5.  **Telemetría de Unidades Críticas (Alarmas UCI): Excluir Inmediatamente.** Construir el bus de datos en tiempo real para camas de terapia intensiva introduce responsabilidades legales y penalizaciones sobre dispositivos de soporte vital (Software as a Medical Device) que exceden dramáticamente las fronteras de un MVP para gestión administrativa.

6.  **Descodificación Matemática de Vectores ECG: Excluir Inmediatamente.** Dedicar recursos a la construcción de visores gráficos Canvas/WebGL precisos milimétricamente en Next.js consumirá semanas de investigación y programación, con severos riesgos diagnósticos si las proporciones de visualización son erróneas. Opte pragmáticamente por el rescate automatizado de los informes clínicos exportados en formato PDF por las máquinas e inyéctelos como anexos en Supabase.^42^

### Hoja de Ruta Táctica en Fases (Phased Integration Roadmap)

Dado su perfil de desarrollador solitario, la estrategia técnica radica en una escalada progresiva e iterativa, acoplando cada componente nuevo de infraestructura en el momento exacto en el cual el retorno de inversión (ROI) operativo para el sanatorio sea demostrable.

- **Fase 1: Fundaciones en FHIR y Plataforma Core**

  - Arquitectura basada en API de Supabase y Next.js.

  - Diseño de la base de datos híbrida (Relacional/JSONB) basada conceptualmente en los recursos Patient, Encounter y ServiceRequest del estándar FHIR.

  - Desarrollo funcional robusto del sistema ambulatorio, módulo de agendamiento y facturación administrativa (Turnera integral), consolidando la \"Fuente Única de Verdad\" de la demografía del individuo.

- **Fase 2: Despliegue del \"Pegamento\" (Middleware) e Integración PACS**

  - Aprovisionamiento local en servidor Linux del sanatorio del motor Mirth Connect (o versión comunitaria Open Integration Engine).

  - Programación de eventos Webhook asincrónicos desde la base de Supabase para disparar una petición POST al middleware ante cada alta y modificación demográfica.

  - Mirth Connect transformará estos eventos en un documento de texto delimitado HL7 ADT\^A04 o ADT\^A01, diseminándolos vía MLLP hacia el servidor RIS/PACS preexistente. Al lograrlo, se elimina la doble digitación de pacientes en radiología.

- **Fase 3: Captura Clínica Unidireccional (Laboratorio Básico)**

  - Intervención física en los laboratorios centrales del sanatorio: Acople de autoanalizadores de hematología y química de rutina a convertidores de puertos RS-232 a Ethernet Industrial (TCP).

  - Establecimiento de Listeners de red en el motor Mirth para la interceptación pasiva del tráfico de las tramas ASTM LIS2-A2 enviadas post-validación técnica.

  - Transformación, mediante expresiones regulares y JavaScript en Mirth, de la trama LIS2 a objetos JSON limpios empujados directamente al backend web para constituirse como recursos DiagnosticReport de acceso instantáneo.

- **Fase 4: Consolidación de Anexos Estáticos (Cardiología y ECG)**

  - Homogeneización de los flujos de las máquinas de ECG rodantes para automatizar la exportación en el formato de destino PDF estático sobre un recurso compartido local (SMB/FTP).

  - Creación del \"File Reader Channel\" en Mirth Connect. El motor detecta, decodifica el archivo binario a Base64, deduce los datos del paciente mediante regex sobre el identificador de archivo, e indexa el PDF final en la historia clínica.

  - El módulo de IA para transcripción y dictado médico se beneficia al tener todo el informe estructurado del panel clínico.

- **Fase 5: Extrapolación de Integración Bidireccional y Portal Remoto**

  - Cierre de la iteración de la base de datos permitiendo la solicitud electrónica (CPOE) de órdenes clínicas desde el escritorio médico de la aplicación.

  - Inyección bidireccional (vía middleware a formato LIS2 o HL7 ORM) de perfiles de exámenes hacia la *Worklist* de las máquinas de laboratorio analíticas automatizando la preanalítica de códigos de barra de tubos biológicos.

  - Liberación pública (con credenciales unívocas FHIR-compliant) de la interfaz externa del portal de pacientes web garantizando resguardo clínico.

La integración biomédica no se domina forzando estándares disonantes a asimilarse. Se domina encapsulando la entropía técnica inherente del hardware físico tras la robusta barrera lógica de un motor de integración Middleware. Esta abstracción metodológica liberará sus capacidades de código como desarrollador en la nube, asegurando que su plataforma de Sanatorio se proyecte de manera estable, unificada y auditable frente al complejo entorno futuro de salud de Argentina.

#### Works cited

1.  Mirth Connect Use Cases 2026: Healthcare Integration for Organizations, Vendors & Startups, accessed March 30, 2026, [[https://kpitechservices.com/blogs/mirth-integration-use-cases-in-healthcare]{.underline}](https://kpitechservices.com/blogs/mirth-integration-use-cases-in-healthcare)

2.  How to Choose the Right Healthcare Integration Platform: The Engineering Decision Framework - Nirmitee.io, accessed March 30, 2026, [[https://nirmitee.io/blog/how-to-choose-the-right-healthcare-integration-platform/]{.underline}](https://nirmitee.io/blog/how-to-choose-the-right-healthcare-integration-platform/)

3.  Data Integration Architecture Patterns for Healthcare Enterprises - Vorro, accessed March 30, 2026, [[https://vorro.net/data-integration-architecture-patterns-for-healthcare-enterprises/]{.underline}](https://vorro.net/data-integration-architecture-patterns-for-healthcare-enterprises/)

4.  Mirth Connect Explained: Architecture & HL7 Standards - IntuitionLabs, accessed March 30, 2026, [[https://intuitionlabs.ai/articles/mirth-connect-architecture-integration-engine-guide]{.underline}](https://intuitionlabs.ai/articles/mirth-connect-architecture-integration-engine-guide)

5.  Top Interface Engines for Healthcare: Streamlining Data Integration - Clarity Ventures, accessed March 30, 2026, [[https://www.clarity-ventures.com/hipaa-ecommerce/healthcare-integration-engine]{.underline}](https://www.clarity-ventures.com/hipaa-ecommerce/healthcare-integration-engine)

6.  Healthcare Integration Architecture with Mirth Connect and Apache Kafka - Nirmitee.io, accessed March 30, 2026, [[https://nirmitee.io/blog/healthcare-integration-architecture-with-mirth-and-kafka/]{.underline}](https://nirmitee.io/blog/healthcare-integration-architecture-with-mirth-and-kafka/)

7.  HL7 Integration: Alternatives to Mirth Connect - Dicom Systems, accessed March 30, 2026, [[https://dcmsys.com/project/hl7-integration-alternatives-to-mirth-connect/]{.underline}](https://dcmsys.com/project/hl7-integration-alternatives-to-mirth-connect/)

8.  My journey on how to use the Mirth Connect Channel to transfer Healthcare data, accessed March 30, 2026, [[https://vaashinisakthivel.medium.com/my-journey-on-how-to-use-the-mirth-connect-channel-to-transfer-healthcare-data-8552a22079f1]{.underline}](https://vaashinisakthivel.medium.com/my-journey-on-how-to-use-the-mirth-connect-channel-to-transfer-healthcare-data-8552a22079f1)

9.  Rhapsody vs. Mirth Connect, accessed March 30, 2026, [[https://rhapsody.health/compare-rhapsody-mirth/]{.underline}](https://rhapsody.health/compare-rhapsody-mirth/)

10. Rhapsody vs Mirth Connect: What Healthcare Teams Need to Know in 2025, accessed March 30, 2026, [[https://rhapsody.health/blog/rhapsody-vs-mirth-connect-what-healthcare-teams-need-to-know-in-2025/]{.underline}](https://rhapsody.health/blog/rhapsody-vs-mirth-connect-what-healthcare-teams-need-to-know-in-2025/)

11. Top Open Source FHIR Tools and Libraries in 2025 - ClinDCast, accessed March 30, 2026, [[https://www.clindcast.com/top-open-source-fhir-tools-and-libraries-in-2025/]{.underline}](https://www.clindcast.com/top-open-source-fhir-tools-and-libraries-in-2025/)

12. Best FHIR Servers for Healthcare Interoperability in 2025 - CrossOr in Ajax, accessed March 30, 2026, [[https://www.ajax-cross-origin.com/best-fhir-servers-for-healthcare-interoperability-in-2025/]{.underline}](https://www.ajax-cross-origin.com/best-fhir-servers-for-healthcare-interoperability-in-2025/)

13. 9 Best FHIR Server Solutions on the Market : r/Servers_on_FHIR - Reddit, accessed March 30, 2026, [[https://www.reddit.com/r/Servers_on_FHIR/comments/1lxa7cy/9_best_fhir_server_solutions_on_the_market/]{.underline}](https://www.reddit.com/r/Servers_on_FHIR/comments/1lxa7cy/9_best_fhir_server_solutions_on_the_market/)

14. Learning HL7 FHIR Using the HAPI FHIR Server and Its Use in Medical Imaging with the SIIM Dataset - PMC, accessed March 30, 2026, [[https://pmc.ncbi.nlm.nih.gov/articles/PMC5959839/]{.underline}](https://pmc.ncbi.nlm.nih.gov/articles/PMC5959839/)

15. Rhapsody vs. InterSystems, accessed March 30, 2026, [[https://rhapsody.health/compare-rhapsody-intersystems/]{.underline}](https://rhapsody.health/compare-rhapsody-intersystems/)

16. InterSystems Health Connect vs Rhapsody, accessed March 30, 2026, [[https://www.intersystems.com/lp/intersystems-health-connect-vs-rhapsody/]{.underline}](https://www.intersystems.com/lp/intersystems-health-connect-vs-rhapsody/)

17. Mirth® Connect 3.4 User Guide, accessed March 30, 2026, [[https://www.adldata.org/download/Manuals/Mirth_Connect_3.4_Users_Guide.pdf]{.underline}](https://www.adldata.org/download/Manuals/Mirth_Connect_3.4_Users_Guide.pdf)

18. Mirth Connect Explained: Architecture & HL7 Standards \| IntuitionLabs, accessed March 30, 2026, [[https://intuitionlabs.ai/pdfs/mirth-connect-explained-architecture-hl7-standards.pdf]{.underline}](https://intuitionlabs.ai/pdfs/mirth-connect-explained-architecture-hl7-standards.pdf)

19. SagaHealthcareIT/open-integration-engine - GitHub, accessed March 30, 2026, [[https://github.com/SagaHealthcareIT/open-integration-engine]{.underline}](https://github.com/SagaHealthcareIT/open-integration-engine)

20. Building a FHIR-Powered Clinical Portal: The HealthPlus Patient Management Application, accessed March 30, 2026, [[https://www.clinicalaiinsider.com/blog/healthplus-patient-management-fhir-app/]{.underline}](https://www.clinicalaiinsider.com/blog/healthplus-patient-management-fhir-app/)

21. HL7v2 v1.2.0, accessed March 30, 2026, [[https://hexdocs.pm/hl7v2/1.2.0]{.underline}](https://hexdocs.pm/hl7v2/1.2.0)

22. Sofia 2 LIS Interface Specification - Quidel CONNECT - QuidelOrtho, accessed March 30, 2026, [[https://connectme.quidel.com/files/TB20299905EN00.pdf]{.underline}](https://connectme.quidel.com/files/TB20299905EN00.pdf)

23. The Sofia 2 LIS Interface Specification - Quidel CONNECT - QuidelOrtho, accessed March 30, 2026, [[https://connectme.quidel.com/files/TB20299904EN00.pdf]{.underline}](https://connectme.quidel.com/files/TB20299904EN00.pdf)

24. LIS02 \| Specification for Transferring Information Between Clinical Laboratory Instruments and Information Systems - CLSI, accessed March 30, 2026, [[https://clsi.org/shop/standards/lis02/]{.underline}](https://clsi.org/shop/standards/lis02/)

25. LIS2-A2 Specification for Transferring Information Between Clinical Laboratory Instruments and Information Systems; Approved - dokumen.pub, accessed March 30, 2026, [[https://dokumen.pub/download/nccls-clsi-lis-lis02-a2-specification-for-transferring-information-between-clinical-laboratory-instruments-and-information-systems-approved-standard-second-edition-latest-version-of-astm-e1394-2.html]{.underline}](https://dokumen.pub/download/nccls-clsi-lis-lis02-a2-specification-for-transferring-information-between-clinical-laboratory-instruments-and-information-systems-approved-standard-second-edition-latest-version-of-astm-e1394-2.html)

26. FirepHOx LIS2 Protocol Overview \| PDF \| Patient \| Specification (Technical Standard), accessed March 30, 2026, [[https://www.scribd.com/document/474347995/Prime-ASTM-Interface-LIS2-Protocol-V3-0-1]{.underline}](https://www.scribd.com/document/474347995/Prime-ASTM-Interface-LIS2-Protocol-V3-0-1)

27. roy-harmon/UniversaLIS: UniversaLIS is a laboratory information system (LIS) for ASTM/CLSI-compliant clinical laboratory analyzers using serial and TCP connections. - GitHub, accessed March 30, 2026, [[https://github.com/roy-harmon/UniversaLIS]{.underline}](https://github.com/roy-harmon/UniversaLIS)

28. Moxa NPort 5110 Serial Device Server: RS-232 to Ethernet Converter for Industrial Networks - IPC2U Worldwide, accessed March 30, 2026, [[https://ipc2u.com/articles/product-reviews/moxa-nport-5110-serial-device-server-rs-232-to-ethernet-converter-for-industrial-networks/]{.underline}](https://ipc2u.com/articles/product-reviews/moxa-nport-5110-serial-device-server-rs-232-to-ethernet-converter-for-industrial-networks/)

29. Output Format for Host Connection - HORIBA Medical :: File Sending System, accessed March 30, 2026, [[https://toolkits.horiba-abx.com/documentation/download.php?id=79992&low=1]{.underline}](https://toolkits.horiba-abx.com/documentation/download.php?id=79992&low=1)

30. What\'s the most reliable Serial to IP converter? - Networking - Benchmark Forum, accessed March 30, 2026, [[https://forum.benchmarkreviews.com/t/whats-the-most-reliable-serial-to-ip-converter/2206]{.underline}](https://forum.benchmarkreviews.com/t/whats-the-most-reliable-serial-to-ip-converter/2206)

31. Serial to IP Converter TOP list - Choose the best one - Serial over Ethernet, accessed March 30, 2026, [[https://www.serial-over-ethernet.com/serial-over-ip/best-serial-to-ip-converter/]{.underline}](https://www.serial-over-ethernet.com/serial-over-ip/best-serial-to-ip-converter/)

32. Equipamiento - Laboratorio Raña, accessed March 30, 2026, [[https://xn\--laboratorioraa-2nb.com.ar/equipos-de-alta-gama/]{.underline}](https://xn--laboratorioraa-2nb.com.ar/equipos-de-alta-gama/)

33. Analytical comparison between two hematological analyzer systems: Mindray BC‐5180 vs Sysmex XN‐1000 - PMC, accessed March 30, 2026, [[https://pmc.ncbi.nlm.nih.gov/articles/PMC6805265/]{.underline}](https://pmc.ncbi.nlm.nih.gov/articles/PMC6805265/)

34. Sysmex Corporation (Japan) and Danaher Corporation (US) are Leading Players in the Hematology Analyzers and Reagents Market - MarketsandMarkets, accessed March 30, 2026, [[https://www.marketsandmarkets.com/ResearchInsight/hematology-analyzers-reagent-market.asp]{.underline}](https://www.marketsandmarkets.com/ResearchInsight/hematology-analyzers-reagent-market.asp)

35. Argentina Laboratory Supplies Research Reports and Market Analysis - Mordor Intelligence, accessed March 30, 2026, [[https://www.mordorintelligence.com/market-analysis/laboratory-supplies/argentina]{.underline}](https://www.mordorintelligence.com/market-analysis/laboratory-supplies/argentina)

36. Top Selling Medical Laboratory Analyzers 2025: A Comprehensive Guide, accessed March 30, 2026, [[https://www.diamonddiagnostics.com/blog/top-selling-medical-laboratory-analyzers-2025-a-comprehensive-guide]{.underline}](https://www.diamonddiagnostics.com/blog/top-selling-medical-laboratory-analyzers-2025-a-comprehensive-guide)

37. Clinical Chemistry \| Core Laboratory at Abbott, accessed March 30, 2026, [[https://www.corelaboratory.abbott/int/en/offerings/category/clinical-chemistry.html]{.underline}](https://www.corelaboratory.abbott/int/en/offerings/category/clinical-chemistry.html)

38. Rapid Diagnostics \| Abbott Point of Care, accessed March 30, 2026, [[https://www.globalpointofcare.abbott/us/en/index.html]{.underline}](https://www.globalpointofcare.abbott/us/en/index.html)

39. LIS Integration Guide - APHL, accessed March 30, 2026, [[https://www.aphl.org/aboutAPHL/publications/Documents/GH-LIS-Integration-Guide.pdf]{.underline}](https://www.aphl.org/aboutAPHL/publications/Documents/GH-LIS-Integration-Guide.pdf)

40. Meet the Top Five Vendors in the U.S. Clinical Immunoassay Analyzer Market, accessed March 30, 2026, [[https://www.blockscientific.com/meet-top-five-vendors-u-s-clinical-immunoassay-analyzer-market]{.underline}](https://www.blockscientific.com/meet-top-five-vendors-u-s-clinical-immunoassay-analyzer-market)

41. LIS2 Communication and Stability Issues - SoftwareCPR, accessed March 30, 2026, [[https://www.softwarecpr.com/2020/10/lis2-communication-and-stability-issues/]{.underline}](https://www.softwarecpr.com/2020/10/lis2-communication-and-stability-issues/)

42. Connecting ECG Management Systems \| DAIC - Diagnostic and Interventional Cardiology, accessed March 30, 2026, [[https://www.dicardiology.com/article/connecting-ecg-management-systems]{.underline}](https://www.dicardiology.com/article/connecting-ecg-management-systems)

43. Archiving and exchange of digital ECGs: A review of existing data formats - Amps LLC, accessed March 30, 2026, [[https://amps-llc.com/uploads/2019-11-8/PIIS0022073618304072.pdf]{.underline}](https://amps-llc.com/uploads/2019-11-8/PIIS0022073618304072.pdf)

44. A Review on Digital ECG Formats and the Relationships Between Them, accessed March 30, 2026, [[http://diec.unizar.es/\~imr/personal/docs/paper12IEEETITB1.pdf]{.underline}](http://diec.unizar.es/~imr/personal/docs/paper12IEEETITB1.pdf)

45. Innovation and Advantage of the DICOM ECG Standard for Viewing, Interchange and Permanent Archiving of the Diagnostic Electrocar - Computing in Cardiology, accessed March 30, 2026, [[https://cinc.org/archives/2007/pdf/0633.pdf]{.underline}](https://cinc.org/archives/2007/pdf/0633.pdf)

46. (PDF) An open source ECG toolkit with DICOM - ResearchGate, accessed March 30, 2026, [[https://www.researchgate.net/publication/224370908_An_open_source_ECG_toolkit_with_DICOM]{.underline}](https://www.researchgate.net/publication/224370908_An_open_source_ECG_toolkit_with_DICOM)

47. US20090299771A1 - Dicom-based 12-lead ecg gateway and browser under the clinically-used information system - Google Patents, accessed March 30, 2026, [[https://patents.google.com/patent/US20090299771A1/en]{.underline}](https://patents.google.com/patent/US20090299771A1/en)

48. The History and Challenges of SCP-ECG: The Standard Communication Protocol for Computer-Assisted Electrocardiography - MDPI, accessed March 30, 2026, [[https://www.mdpi.com/2673-3846/2/3/31]{.underline}](https://www.mdpi.com/2673-3846/2/3/31)

49. Python library for read/write different ECG formats (MIT, SCP-ECG, HL7 aECG), accessed March 30, 2026, [[https://stackoverflow.com/questions/60190852/python-library-for-read-write-different-ecg-formats-mit-scp-ecg-hl7-aecg]{.underline}](https://stackoverflow.com/questions/60190852/python-library-for-read-write-different-ecg-formats-mit-scp-ecg-hl7-aecg)

50. A review of ECG storage formats - PubMed, accessed March 30, 2026, [[https://pubmed.ncbi.nlm.nih.gov/21775198/]{.underline}](https://pubmed.ncbi.nlm.nih.gov/21775198/)

51. ECG Standards and Formats for Interoperability between mHealth and Healthcare Information Systems: A Scoping Review - PMC, accessed March 30, 2026, [[https://pmc.ncbi.nlm.nih.gov/articles/PMC9565220/]{.underline}](https://pmc.ncbi.nlm.nih.gov/articles/PMC9565220/)

52. Akitha-Chanupama/ECG_Visualizer: 12-Lead ECG Viewer is a single-page React web application that renders clinical-grade 12-lead electrocardiogram waveforms side-by-side on a responsive grid. Built with React. · GitHub, accessed March 30, 2026, [[https://github.com/Akitha-Chanupama/ECG_Visualizer]{.underline}](https://github.com/Akitha-Chanupama/ECG_Visualizer)

53. Drawing PQRST ECG Waveform on Grid Paper using React and Chart.js - Stack Overflow, accessed March 30, 2026, [[https://stackoverflow.com/questions/77690811/drawing-pqrst-ecg-waveform-on-grid-paper-using-react-and-chart-js]{.underline}](https://stackoverflow.com/questions/77690811/drawing-pqrst-ecg-waveform-on-grid-paper-using-react-and-chart-js)

54. GitHub - upsidedownlabs/Rpeak: AI enabled ECG based heart analysis tool for everyone!, accessed March 30, 2026, [[https://github.com/upsidedownlabs/Rpeak]{.underline}](https://github.com/upsidedownlabs/Rpeak)

55. ISO/IEEE 11073 Personal Health Data Standards - Wikipedia, accessed March 30, 2026, [[https://en.wikipedia.org/wiki/ISO/IEEE_11073_Personal_Health_Data_Standards]{.underline}](https://en.wikipedia.org/wiki/ISO/IEEE_11073_Personal_Health_Data_Standards)

56. Interoperability in Intensive Care, accessed March 30, 2026, [[https://www.draeger.com/Content/Documents/Content/medical-device-interoperability-in-intensive-care-br-9109950-en-master-2104-02.pdf]{.underline}](https://www.draeger.com/Content/Documents/Content/medical-device-interoperability-in-intensive-care-br-9109950-en-master-2104-02.pdf)

57. ISO/IEEE 11073 - Wikipedia, accessed March 30, 2026, [[https://en.wikipedia.org/wiki/ISO/IEEE_11073]{.underline}](https://en.wikipedia.org/wiki/ISO/IEEE_11073)

58. Remote Cards of Patient-The Personal Health Devices Standard-ISO/IEEE 11073-20601, accessed March 30, 2026, [[https://healthmanagement.org/c/it/issuearticle/remote-cards-of-patient-the-personal-health-devices-standard-iso-ieee-11073-20601]{.underline}](https://healthmanagement.org/c/it/issuearticle/remote-cards-of-patient-the-personal-health-devices-standard-iso-ieee-11073-20601)

59. Building the silent ICU of the future: Philips to demonstrate a collaborative approach to interoperability at #HIMSS24, accessed March 30, 2026, [[https://www.usa.philips.com/a-w/about/news/archive/standard/news/articles/2024/building-the-silent-icu-of-the-future-philips-to-demonstrate-a-collaborative-approach-to-interoperability-at-himss24.html]{.underline}](https://www.usa.philips.com/a-w/about/news/archive/standard/news/articles/2024/building-the-silent-icu-of-the-future-philips-to-demonstrate-a-collaborative-approach-to-interoperability-at-himss24.html)

60. Interoperable End-to-End Remote Patient Monitoring Platform Based on IEEE 11073 PHD and ZigBee Health Care Profile, accessed March 30, 2026, [[https://ieeexplore.ieee.org/iel7/10/8340950/08003476.pdf]{.underline}](https://ieeexplore.ieee.org/iel7/10/8340950/08003476.pdf)

61. New IEEE 11073 Standards for interoperable, networked Point-of-Care Medical Devices, accessed March 30, 2026, [[https://www.researchgate.net/publication/283500494_New_IEEE_11073_Standards_for_interoperable_networked_Point-of-Care_Medical_Devices]{.underline}](https://www.researchgate.net/publication/283500494_New_IEEE_11073_Standards_for_interoperable_networked_Point-of-Care_Medical_Devices)

62. IHE Patient Care Devices (PCD) White Paper Service-oriented Device Point-of-Care Interoperability (SDPi) Revision 1.1 - IHE International, accessed March 30, 2026, [[https://www.ihe.net/uploadedFiles/Documents/PCD/IHE_PCD_WP_SDPi_Rev1-1_Pub_2019-11-01.pdf]{.underline}](https://www.ihe.net/uploadedFiles/Documents/PCD/IHE_PCD_WP_SDPi_Rev1-1_Pub_2019-11-01.pdf)

63. IEEE 11073 Standards Address Remote Monitoring Market \| Biomedical Instrumentation & Technology - AAMI Array, accessed March 30, 2026, [[https://array.aami.org/doi/full/10.2345/0899-8205-44.4.339]{.underline}](https://array.aami.org/doi/full/10.2345/0899-8205-44.4.339)

64. ISO/IEEE 11073-20601:2010(E), Health informatics --- Personal health device communication - IEEE Xplore, accessed March 30, 2026, [[https://ieeexplore.ieee.org/iel5/5703193/5703194/05703195.pdf]{.underline}](https://ieeexplore.ieee.org/iel5/5703193/5703194/05703195.pdf)

65. (PDF) Silent ICU based on IEEE 11073 SDC - ResearchGate, accessed March 30, 2026, [[https://www.researchgate.net/publication/374081591_Silent_ICU_based_on_IEEE_11073_SDC]{.underline}](https://www.researchgate.net/publication/374081591_Silent_ICU_based_on_IEEE_11073_SDC)

66. Designing Scalable Healthcare Integration Architectures - Qatalys, accessed March 30, 2026, [[https://qatalys.com/blog/healthcare-integration-architecture-scalability/]{.underline}](https://qatalys.com/blog/healthcare-integration-architecture-scalability/)

67. Interoperable healthcare ecosystems through middleware integration: Enabling connected care with cloud-native architecture and i, accessed March 30, 2026, [[https://wjaets.com/sites/default/files/fulltext_pdf/WJAETS-2025-0821.pdf]{.underline}](https://wjaets.com/sites/default/files/fulltext_pdf/WJAETS-2025-0821.pdf)

68. Exploration of Health Level Seven Fast Healthcare Interoperability Resources for Use in Study Data Created From Real-World Data Sources for Submission to the Food and Drug Administration; Establishment of a Public Docket; Request for Comments - Federal Register, accessed March 30, 2026, [[https://www.federalregister.gov/documents/2025/04/23/2025-06967/exploration-of-health-level-seven-fast-healthcare-interoperability-resources-for-use-in-study-data]{.underline}](https://www.federalregister.gov/documents/2025/04/23/2025-06967/exploration-of-health-level-seven-fast-healthcare-interoperability-resources-for-use-in-study-data)

69. Version 2 (V2) - Health Data Standards and Terminologies: A Tutorial - NIH, accessed March 30, 2026, [[https://www.nlm.nih.gov/oet/ed/healthdatastandards/03-300.html]{.underline}](https://www.nlm.nih.gov/oet/ed/healthdatastandards/03-300.html)

70. A Breakdown of Common HL7 Message Types in Healthcare --- Examples Included - Ritten, accessed March 30, 2026, [[https://www.ritten.io/post/hl7-message-types]{.underline}](https://www.ritten.io/post/hl7-message-types)

71. What is HL7 and Its Importance to Healthcare \| Radsource, accessed March 30, 2026, [[https://radsource.us/what-is-hl7-in-healthcare/]{.underline}](https://radsource.us/what-is-hl7-in-healthcare/)

72. HL7 Resource: Understanding the HL7 Message Structure - iNTERFACEWARE, accessed March 30, 2026, [[https://www.interfaceware.com/hl7-message-structure]{.underline}](https://www.interfaceware.com/hl7-message-structure)

73. A Comprehensive Guide to HL7 Message Types \| Surety Systems, accessed March 30, 2026, [[https://www.suretysystems.com/insights/a-comprehensive-guide-to-hl7-message-types/]{.underline}](https://www.suretysystems.com/insights/a-comprehensive-guide-to-hl7-message-types/)

74. HL7 Messages Examples: Decoding HL7 Message Structures - Folio3 Digital Health, accessed March 30, 2026, [[https://digitalhealth.folio3.com/blog/hl7-messages-examples/]{.underline}](https://digitalhealth.folio3.com/blog/hl7-messages-examples/)

75. Top HL7 Message Types: The Essential Guide \| Blog - Itirra, accessed March 30, 2026, [[https://itirra.com/blog/top-hl7-message-types/]{.underline}](https://itirra.com/blog/top-hl7-message-types/)

76. HL7 v2.5.1 Chapter 7, accessed March 30, 2026, [[https://www.hl7.eu/HL7v2x/v251/std251/ch07.html]{.underline}](https://www.hl7.eu/HL7v2x/v251/std251/ch07.html)

77. The Complete Guide to HL7 Message Types and Event Types - Taction Software, accessed March 30, 2026, [[https://www.tactionsoft.com/guide/hl7-message-types-event-types/]{.underline}](https://www.tactionsoft.com/guide/hl7-message-types-event-types/)

78. HL7 - ORU Message - iNTERFACEWARE, accessed March 30, 2026, [[https://www.interfaceware.com/hl7-oru]{.underline}](https://www.interfaceware.com/hl7-oru)

79. HL7 Interface Specification - Visage Imaging, accessed March 30, 2026, [[https://www.visageimaging.com/downloads/Visage7/Visage7_HL7InterfaceSpecification.pdf]{.underline}](https://www.visageimaging.com/downloads/Visage7/Visage7_HL7InterfaceSpecification.pdf)

80. Understanding HL7 Message Types: 2026 Comprehensive Guide - iFax, accessed March 30, 2026, [[https://www.ifaxapp.com/blog/hl7-message-types/]{.underline}](https://www.ifaxapp.com/blog/hl7-message-types/)

81. Understanding Basic HL7 Interfaces for Effective Health Information Exchange - Data InterOps, accessed March 30, 2026, [[https://www.datainterops.com/post/basic-hl7-interfaces]{.underline}](https://www.datainterops.com/post/basic-hl7-interfaces)

82. Creating and managing HL7v2 messages \| Cloud Healthcare API, accessed March 30, 2026, [[https://docs.cloud.google.com/healthcare-api/docs/how-tos/hl7v2-messages]{.underline}](https://docs.cloud.google.com/healthcare-api/docs/how-tos/hl7v2-messages)

83. Comparing Traditional Middleware vs Modern Data Integration Healthcare Platforms - Vorro, accessed March 30, 2026, [[https://vorro.net/comparing-traditional-middleware-vs-modern-data-integration-healthcare-platforms/]{.underline}](https://vorro.net/comparing-traditional-middleware-vs-modern-data-integration-healthcare-platforms/)

84. FHIR Implementation Guide: HL7 V2 to FHIR Migration Strategy - Kanda Software, accessed March 30, 2026, [[https://www.kandasoft.com/blog/fhir-implementation-guide]{.underline}](https://www.kandasoft.com/blog/fhir-implementation-guide)

85. FHIR vs. HL7: Key Differences Explained for Healthcare Interoperability - Rhapsody Health, accessed March 30, 2026, [[https://rhapsody.health/blog/fhir-vs-hl7-explained/]{.underline}](https://rhapsody.health/blog/fhir-vs-hl7-explained/)

86. FHIR Encounter Resource \| Structure, Coding, and Real-World Use Cases, accessed March 30, 2026, [[https://www.interfaceware.com/fhir/resources/encounter]{.underline}](https://www.interfaceware.com/fhir/resources/encounter)

87. DiagnosticReport.Search (Results) - Specifications - Epic on FHIR, accessed March 30, 2026, [[https://fhir.epic.com/Specifications?api=989]{.underline}](https://fhir.epic.com/Specifications?api=989)

88. DiagnosticReport - SATUSEHAT FHIR R4 Implementation Guide, accessed March 30, 2026, [[https://simplifier.net/guide/SATUSEHAT-FHIR-R4-Implementation-Guide/Home/FHIRProfiles/DiagnosticReport.page.md?version=current]{.underline}](https://simplifier.net/guide/SATUSEHAT-FHIR-R4-Implementation-Guide/Home/FHIRProfiles/DiagnosticReport.page.md?version=current)

89. Diagnostics-module - FHIR v6.0.0-ballot4, accessed March 30, 2026, [[https://build.fhir.org/diagnostics-module.html]{.underline}](https://build.fhir.org/diagnostics-module.html)

90. Argentina - SIMPLIFIER.NET, accessed March 30, 2026, [[https://simplifier.net/jurisdictions/ar]{.underline}](https://simplifier.net/jurisdictions/ar)

91. HL7 ARGENTINA REPORT, accessed March 30, 2026, [[https://confluence.hl7.org/download/attachments/65077660/2019_SEP_HL7_ARG_BRIEF.pptx?api=v2]{.underline}](https://confluence.hl7.org/download/attachments/65077660/2019_SEP_HL7_ARG_BRIEF.pptx?api=v2)

92. The State of FHIR in 2025: Growing adoption and evolving maturity - Firely, accessed March 30, 2026, [[https://fire.ly/blog/the-state-of-fhir-in-2025/]{.underline}](https://fire.ly/blog/the-state-of-fhir-in-2025/)

93. There is no right way to store FHIR® \| by Nick Hatt \| fhirbase dojo - Medium, accessed March 30, 2026, [[https://medium.com/fhirbase-dojo/there-is-no-right-way-to-store-fhir-a8cea5444b4d]{.underline}](https://medium.com/fhirbase-dojo/there-is-no-right-way-to-store-fhir-a8cea5444b4d)

94. FHIR standard · supabase · Discussion #14175 - GitHub, accessed March 30, 2026, [[https://github.com/orgs/supabase/discussions/14175]{.underline}](https://github.com/orgs/supabase/discussions/14175)

95. How to Integrate Supabase with Next.js for Serverless Applications - RW Infotech, accessed March 30, 2026, [[https://www.rwit.io/blog/integrate-supabase-with-next-js-for-serverless-applications]{.underline}](https://www.rwit.io/blog/integrate-supabase-with-next-js-for-serverless-applications)

96. Storage - FHIR v6.0.0-ballot4, accessed March 30, 2026, [[https://build.fhir.org/storage.html]{.underline}](https://build.fhir.org/storage.html)

97. The 5 Categories of FHIR Server Provider - Darren Devitt, accessed March 30, 2026, [[https://darrendevitt.com/the-5-categories-of-fhir-server-provider/]{.underline}](https://darrendevitt.com/the-5-categories-of-fhir-server-provider/)

98. HL7-FHIR: Is it better to use RESTful api & json or adapt format to a database? ]closed\], accessed March 30, 2026, [[https://stackoverflow.com/questions/37592522/hl7-fhir-is-it-better-to-use-restful-api-json-or-adapt-format-to-a-database]{.underline}](https://stackoverflow.com/questions/37592522/hl7-fhir-is-it-better-to-use-restful-api-json-or-adapt-format-to-a-database)

99. Building a FHIR-Enabled Patient Portal with Next.js 16 (Step-by-Step Guide) - Medium, accessed March 30, 2026, [[https://medium.com/@paul.adeboye/building-a-fhir-enabled-patient-portal-with-next-js-16-step-by-step-guide-33a90ec142f8]{.underline}](https://medium.com/@paul.adeboye/building-a-fhir-enabled-patient-portal-with-next-js-16-step-by-step-guide-33a90ec142f8)
