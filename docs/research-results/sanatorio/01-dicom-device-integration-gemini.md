# Integración de Protocolos DICOM y Conectividad de Dispositivos Médicos en Entornos Clínicos

La modernización de la infraestructura tecnológica en instituciones de salud, particularmente la transición desde sistemas heredados hacia arquitecturas web modernas basadas en plataformas como Next.js y bases de datos en la nube como Supabase, exige una comprensión arquitectónica profunda de los estándares de interoperabilidad biomédica. El ecosistema clínico se caracteriza por una profunda fragmentación de protocolos, donde convergen estándares de vanguardia basados en API REST con protocolos de comunicación serial diseñados hace más de cinco décadas. El presente informe técnico desglosa exhaustivamente los fundamentos del estándar DICOM, la topología física de las conexiones clínicas, la integración de dispositivos no imagenológicos y establece una hoja de ruta arquitectónica para el reemplazo de infraestructuras obsoletas (como implementaciones defectuosas de Philips Vue PACS) en el contexto de un sistema integral de gestión hospitalaria.

## Análisis de los Fundamentos del Protocolo DICOM

El estándar DICOM (Digital Imaging and Communications in Medicine) representa el pilar universal sobre el cual descansa la informática de imágenes médicas a nivel mundial.^1^ Publicado en su versión 3.0 en 1993 tras el trabajo conjunto del American College of Radiology (ACR) y la National Electrical Manufacturers Association (NEMA), el protocolo fue diseñado para resolver un problema crítico: la dependencia tecnológica de proveedores (vendor lock-in).^3^ Antes de DICOM, cada fabricante de tomógrafos o ecógrafos utilizaba formatos de archivo y conexiones físicas patentadas, lo que hacía tecnológicamente inviable que un escáner de una marca enviara imágenes a una estación de diagnóstico de otra marca.^3^ El estándar DICOM proporciona un conjunto exhaustivo de especificaciones que dictan cómo deben formatearse los datos, cómo deben comunicarse los dispositivos a través de redes y cómo deben gestionarse los flujos de trabajo clínicos.^6^

El núcleo de la semántica de DICOM se basa en el Modelo de Información DICOM, una abstracción orientada a objetos que mapea la realidad clínica en entidades jerárquicas estrictas. Este modelo de datos se divide en cuatro niveles fundamentales de Entidades de Información (Information Entities o IE) que garantizan la trazabilidad absoluta de cualquier estudio médico.^6^ En la cúspide de la jerarquía se encuentra el Paciente (Patient), identificado de manera unívoca dentro de la institución mediante atributos clave como el ID del Paciente y su nombre.^7^ Descendiendo en la jerarquía, el paciente posee Estudios (Studies), que representan actos médicos específicos realizados por una orden clínica, identificados globalmente mediante un identificador único denominado *Study Instance UID*.^7^ Cada estudio contiene Series, que agrupan imágenes adquiridas por el mismo equipo bajo un mismo protocolo o configuración espacial, identificadas por un *Series Instance UID*.^8^ Finalmente, la Serie se compone de Instancias (Instances u Objetos SOP), que representan la mínima unidad de información, típicamente una imagen individual, un reporte estructurado o una forma de onda, cada una con su propio *SOP Instance UID*.^7^

La comunicación y el procesamiento de estos objetos se basan en el concepto fundamental de Clases SOP (Service-Object Pair). Una Clase SOP es el resultado de la unión teórica entre una Definición de Objeto de Información (IOD, por ejemplo, el modelo de datos de una imagen de Ultrasonido) y un Grupo de Elementos de Servicio de Mensajería DICOM (DIMSE, por ejemplo, el comando de almacenamiento C-STORE).^9^ Las Clases SOP determinan las capacidades funcionales de un dispositivo; por ejemplo, si un ecógrafo desea enviar imágenes a un servidor, ambas máquinas deben soportar y negociar exitosamente la Clase SOP específica denominada \"Ultrasound Image Storage\" (cuyo Identificador Único o UID es 1.2.840.10008.5.1.4.1.1.6.1).^11^

El formato de archivo DICOM, comúnmente reconocido por la extensión .dcm, es una estructura de datos que difiere drásticamente de formatos de consumo general como JPEG o PNG. La principal distinción radica en que DICOM encapsula indisolublemente los metadatos clínicos (encabezado) y los datos binarios (píxeles de la imagen) en un único contenedor de flujo de bytes.^2^ Esto asegura que una imagen nunca pueda separarse accidentalmente de la información del paciente al que pertenece, una característica vital para la seguridad médica y la prevención de mala praxis.^13^ La anatomía de un archivo DICOM comienza con un preámbulo de 128 bytes, típicamente rellenado con ceros, que históricamente permitía a los visores de imágenes convencionales saltar la cabecera e intentar leer los datos subyacentes.^14^ A este preámbulo le sigue un prefijo obligatorio de 4 bytes que contiene los caracteres ASCII \"DICM\", lo que certifica la validez del archivo.^14^ A partir de este punto, el archivo está compuesto por una lista secuencial de Elementos de Datos (Data Elements). Cada elemento está estructurado mediante una Etiqueta (Tag) compuesta por un Grupo y un Elemento en formato hexadecimal, seguido de una Representación de Valor (VR) que indica el tipo de dato (por ejemplo, cadena de texto, fecha, entero largo), la longitud del dato y, finalmente, el valor real.^13^ El último elemento del archivo es invariablemente el Tag (7FE0,0010), que aloja el volcado binario de los datos de píxeles, pudiendo estar estos sin comprimir o sometidos a algoritmos de compresión estandarizados como JPEG 2000, JPEG Lossless o codificación Run-Length Encoding (RLE).^13^

A nivel de conectividad de red, los dispositivos DICOM interactúan mediante un protocolo altamente formalizado que opera históricamente sobre el protocolo de transporte TCP/IP.^1^ El ciclo de vida de una comunicación de red se divide en dos fases críticas. La primera fase es el Establecimiento de la Asociación, gestionada por una entidad de software denominada Association Control Service Element (ACSE).^6^ En esta fase, el dispositivo que inicia la conexión (Service Class User o SCU) contacta al servidor receptor (Service Class Provider o SCP) y le propone una lista de acciones que desea realizar.^17^ Esta propuesta incluye los *Application Entity Titles* (AE Titles, que son nombres lógicos configurados en cada equipo para identificarse en la red), las Clases SOP que se desean utilizar y las Sintaxis de Transferencia (Transfer Syntaxes).^17^ Las Sintaxis de Transferencia definen si los datos viajarán comprimidos, no comprimidos, y en qué orden de bytes (Little Endian o Big Endian). El servidor evalúa esta propuesta y acepta o rechaza cada contexto de presentación basándose en sus capacidades técnicas y configuración de seguridad.^18^ Una vez que la asociación ha sido establecida y negociada, se inicia la segunda fase, donde los dispositivos utilizan el protocolo DIMSE (DICOM Message Service Element) para intercambiar mensajes.^20^ DIMSE define las reglas de codificación de los comandos y se clasifica en servicios compuestos (DIMSE-C) utilizados para la transferencia y consulta de imágenes, y servicios normalizados (DIMSE-N) utilizados para notificaciones de estado y gestión de impresión o flujos de trabajo.^17^

## Interacciones Estratégicas de los Servicios DICOM

Para diseñar un sistema que reemplace una infraestructura PACS e interactúe fluidamente con ecógrafos, tomógrafos o resonadores, es indispensable dominar los servicios DIMSE que rigen el ciclo de vida de un estudio radiológico. La ingeniería de un sistema de gestión clínica debe orquestar estas operaciones con precisión milimétrica.

El comando **C-STORE** representa la operación más elemental y crucial del protocolo, actuando como el mecanismo principal para empujar (Push) imágenes desde un dispositivo de adquisición hacia un archivo central.^21^ Cuando un médico finaliza una ecografía, el equipo inicia una asociación con el servidor PACS y emite comandos C-STORE de forma iterativa, transmitiendo cada instancia de imagen (SOP Instance) junto con sus metadatos.^22^ El servidor recibe el flujo binario, lo decodifica, lo almacena físicamente en disco y responde con un mensaje de estado (Success o Failure).^24^ Este modelo implica que el servidor debe estar constantemente a la escucha en un puerto TCP determinado (típicamente el 104 o 11112).^17^

Para acceder a las imágenes previamente almacenadas, el ecosistema confía en el servicio **C-FIND**. Este comando funciona bajo una lógica semántica extremadamente similar a una consulta SQL en bases de datos relacionales.^22^ La aplicación cliente envía un conjunto de datos DICOM estructurado donde los campos completados actúan como filtros de búsqueda (la cláusula WHERE, por ejemplo, especificando un rango de fechas o un *Patient ID* específico), mientras que los campos que se envían vacíos indican la información que se desea recuperar (la cláusula SELECT).^22^ El servidor PACS responde enviando un conjunto de datos por cada coincidencia encontrada, iterando hasta que se agotan los resultados y se envía un mensaje de finalización.^22^

La recuperación del material binario de las imágenes recae sobre las operaciones **C-MOVE** y **C-GET**, cuya distinción arquitectónica es la fuente de numerosos desafíos de ingeniería de redes.^25^ El comando C-MOVE es contraintuitivo desde la perspectiva de la web moderna: el cliente instruye al PACS para que mueva una serie de imágenes hacia un *AE Title* de destino.^21^ El aspecto crítico es que el PACS no devuelve las imágenes a través de la conexión por la que recibió la instrucción C-MOVE; en su lugar, actúa como cliente e intenta abrir una nueva conexión TCP independiente hacia la dirección IP asociada a ese *AE Title* destino, utilizando comandos C-STORE para el envío.^21^ Esta arquitectura falla estrepitosamente si el destino se encuentra detrás de un enrutador con NAT (Network Address Translation), si posee una IP dinámica (DHCP), o si los firewalls bloquean las conexiones entrantes.^22^ Por el contrario, el comando C-GET soluciona este dilema mediante un modelo de extracción estricta (Pull).^26^ Al emitir un C-GET, el servidor PACS transmite las imágenes solicitadas utilizando exactamente la misma asociación TCP bidireccional que el cliente estableció inicialmente, evadiendo completamente los bloqueos de firewall entrantes y eliminando la necesidad de configurar la IP del cliente en las tablas de enrutamiento del servidor PACS.^22^

A nivel de flujo de trabajo administrativo, la implementación de la **Modality Worklist (MWL)** es el punto de convergencia más crítico entre el sistema de turnos (HIS/RIS) y los equipos médicos físicos.^27^ Históricamente, los técnicos radiólogos debían transcribir manualmente los datos demográficos de cada paciente utilizando el teclado del ecógrafo.^27^ Este proceso propenso a errores generaba nombres mal escritos, números de identificación incorrectos y estudios huérfanos que requerían costosas reconciliaciones en el PACS.^27^ MWL elimina esta falencia operativa convirtiendo al ecógrafo en un cliente que consulta la agenda de turnos mediante comandos C-FIND.^27^ El modelo de datos de MWL es complejo y jerárquico, basándose en la distinción entre un Procedimiento Solicitado (Requested Procedure), que contiene los datos del paciente y la orden clínica, y un Paso de Procedimiento Programado (Scheduled Procedure Step o SPS), que contiene los atributos operativos como el *AE Title* de la modalidad específica que realizará el estudio y la fecha y hora asignadas.^27^ Cuando el operador selecciona al paciente en la pantalla del equipo, los metadatos se adhieren automáticamente a las imágenes DICOM que se generarán.^27^ El parámetro más valioso transmitido por MWL es el *Study Instance UID*, generado previamente por el sistema de gestión. Su inclusión garantiza que, si el paciente se somete a procedimientos en múltiples dispositivos diferentes para una misma orden médica, todas las imágenes converjan de forma determinista bajo un único estudio unificado en el PACS.^30^

El ciclo de vida de un estudio requiere mecanismos de notificación y seguridad provistos por **MPPS (Modality Performed Procedure Step)** y **Storage Commitment**. MPPS opera como el motor de cambio de estado del flujo de trabajo.^13^ Cuando el operador inicia el escaneo, la modalidad envía al sistema central un comando N-CREATE indicando que el estudio está IN PROGRESS.^31^ Al finalizar, envía un comando N-SET con el estado COMPLETED o DISCONTINUED, adjuntando métricas vitales como la duración de la exposición, cantidad de dosis radiológica y número de imágenes adquiridas.^13^ Este servicio es la llave para la automatización de la facturación y la liberación del estado del turno en el software clínico.^13^ Por su parte, Storage Commitment aborda la preservación de la evidencia.^33^ Los discos duros internos de las modalidades tienen capacidad limitada. Tras enviar los datos mediante C-STORE, la modalidad no puede simplemente borrar sus archivos locales sin la certeza de que el PACS los ha replicado de forma segura.^33^ En consecuencia, la modalidad emite un comando N-ACTION solicitando un compromiso de almacenamiento.^33^ El PACS inspecciona sus arreglos de discos y bases de datos, y responde de forma asíncrona mediante un comando N-EVENT-REPORT certificando que los identificadores de instancia proporcionados se encuentran respaldados.^34^ Solo entonces, el software del ecógrafo elimina los archivos locales.^33^

A continuación, se detalla un diagrama de flujo arquitectónico que ejemplifica la interacción exacta de estos servicios en un escenario de ultrasonido integrado en tiempo real:

]Ecógrafo / Modalidad\]

\| \| \|

1.  Médico agenda ecografía en la web \| \|

\| \| \|

2\. Inserción en Base de Datos (HL7 ORM) \| \|

\|\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--\>\| \|

\| 3. Genera Registro SPS (Worklist) \|

\| \| \|

\| \|\<\-\-\-- 4. Petición MWL (C-FIND RQ) \|

\| \| \|

\| \| \|

\| \|\-\-\--\> 5. Respuesta (C-FIND RSP) \--\|

\| \| \|

\| \| \|

\| \|\<\-\-\-- 6. Inicio de Estudio \-\-\-\-\-\--\|

\| \| (MPPS N-CREATE: IN PROGRESS)\|

\| \| \|

\| \| ]Adquisición de Imágenes\] \|

\| \| \|

\| \|\<\-\-\-- 7. Envío Imágenes (C-STORE)-\|

\| \|\-\-\--\> 8. Confirmación (C-STORE RSP)

\| \| \|

\| \|\<\-\-\-- 9. Solicita Storage Commit -\|

\| \| (N-ACTION) \|

\| \| \|

\| \|\-\-\--\> 10. Certificación de Guardado

\| \| (N-EVENT-REPORT) \|

\| \| \|

\| \|\<\-\-\-- 11. Fin de Estudio \-\-\-\-\-\-\-\--\|

\| \| (MPPS N-SET: COMPLETED) \|

12\. Notificación Webhooks a Turnera \| \|

\|\<\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--\| \|

## Topología de Conectividad Física en Instituciones Médicas

El análisis del espectro de comunicaciones en clínicas de países con infraestructuras heterogéneas, como Argentina, revela una fricción arquitectónica notable entre los protocolos de capa de aplicación (OSI Capa 7) y los medios de transmisión físicos (OSI Capa 1). Aunque el estándar DICOM contemporáneo asume y estandariza la comunicación sobre redes Ethernet locales (LAN) basadas en el paradigma TCP/IP ^36^, los ingenieros se enfrentan sistemáticamente a equipamiento heredado.

El enigma del ecógrafo conectado mediante un cable de tipo telefónico (RJ11) hacia un puerto de pared es un remanente clásico de la comunicación en serie heredada.^37^ Antes de la ubicuidad de los adaptadores de red Ethernet integrados en las placas base, la conectividad industrial y médica dependía casi exclusivamente de la especificación EIA/TIA RS-232, introducida en la década de 1960.^37^ Este estándar define la transmisión de datos binarios en serie mediante la alteración de voltajes (típicamente entre -15V y +15V) en un esquema asíncrono punto a punto.^39^

Aunque el conector RS-232 canónico es el voluminoso DE-9 (D-Sub de 9 pines) o el DB-25, la industria médica y de automatización adoptó rápidamente conectores modulares como el RJ11 o RJ45 por sus ventajas en densidad, coste y facilidad de despliegue en conductos de pared.^41^ En un mapeo típico de RS-232 sobre un receptáculo RJ11 de 4 o 6 pines, se utiliza un pin para el Transmisor de Datos (TxD), otro para el Receptor de Datos (RxD) y un tercero para la Tierra de Señal (Signal Ground o GND), conformando el cableado de módem nulo elemental que descarta las líneas de control de hardware adicionales.^42^

Para integrar este dispositivo serial al ecosistema de red LAN que un servidor PACS requiere, la arquitectura obliga al uso de un hardware intermediario denominado Servidor de Dispositivos Serial-a-Ethernet (comúnmente provisto por fabricantes industriales como Moxa, Digi o Perle).^45^ Estas pequeñas unidades capturan la señalización analógica oscilante del cable RJ11 a través de un receptor UART, decodifican los bits de datos respetando los baudios estrictos (baud rate, paridad, bits de parada) configurados en el hardware médico, y encapsulan dichos bits directamente en tramas TCP/IP retransmitidas sobre el cable Ethernet hacia la red del sanatorio.^48^ Esto otorga una dirección IP lógica y moderna a un dispositivo que físicamente carece de una tarjeta de red (NIC), permitiéndole interactuar con servicios DICOM contemporáneos.

En este marco de interconexión, la herramienta legal y técnica más importante del arquitecto es el DICOM Conformance Statement (DCS).^6^ El hecho de que dos dispositivos estén etiquetados como \"Compatibles con DICOM\" no garantiza en lo absoluto su interoperabilidad debido a la inmensa opcionalidad del estándar.^51^ El DCS es un manifiesto obligatorio emitido por el fabricante del equipo que declara textualmente qué roles (SCU o SCP), qué Clases SOP (ej. Image Storage, Modality Worklist) y qué Sintaxis de Transferencia (ej. Little Endian implícito frente a compresiones JPEG algorítmicas) soporta el dispositivo.^51^ Analizar el DCS del ecógrafo frente al DCS del servidor PACS es el paso preliminar e ineludible para diagnosticar por qué un equipo rechaza sistemáticamente el establecimiento de asociaciones.

## Volumetría de Datos y Requerimientos de Almacenamiento Clínico

La arquitectura de bases de datos para un sistema de reemplazo de PACS requiere la formulación de proyecciones matemáticas rigurosas sobre el volumen de almacenamiento generado por las modalidades de diagnóstico.^53^ El tamaño de los objetos DICOM es una variable multivariada que depende de la resolución matricial de los sensores detectores, la profundidad de los bits por píxel (rango dinámico radiométrico) y el conteo de fotogramas o cortes.^54^

A continuación, se detalla un análisis volumétrico estándar basado en información clínica sin compresión:

  ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Modalidad de Adquisición**        **Matriz de Resolución Típica**   **Profundidad Cromática (Bits por Píxel)**   **Peso Aproximado por Instancia (Imagen)**   **Imágenes por Estudio**        **Peso Aproximado por Estudio Completo**
  ----------------------------------- --------------------------------- -------------------------------------------- -------------------------------------------- ------------------------------- ------------------------------------------
  **Ultrasonido (US)**                512 × 512 píxeles                 8 bits o 24 bits (Doppler Color)             \~0.26 MB a 0.44 MB ^54^                     20 a 240 imágenes               **5 MB - 60 MB**

  **Radiografía Digital (CR / DX)**   2048 × 2048 a 3520 × 4280         12 a 16 bits                                 18 MB a 30 MB ^54^                           2 a 5 exposiciones              **36 MB - 150 MB**

  **Resonancia Magnética (MRI)**      256 × 256 píxeles                 12 a 16 bits                                 \~0.13 MB ^54^                               60 a 3000 secuencias            **10 MB - 400 MB**

  **Tomografía Computarizada (CT)**   512 × 512 píxeles                 12 a 16 bits                                 \~0.52 MB ^54^                               40 a 3000 cortes tomográficos   **20 MB - 1.5 GB**
  ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Para dimensionar los servidores de un sanatorio mediano en Argentina, se debe proyectar el rendimiento diario de los servicios. Si consideramos un flujo operativo constante que atiende 100 estudios ecográficos diarios (estimación de 30 MB por estudio), 50 exámenes de radiografía digital (60 MB por estudio), 20 tomografías computarizadas (500 MB de promedio considerando protocolos multifásicos) y 10 resonancias magnéticas (200 MB de promedio), la huella de datos se calcula de la siguiente manera ^59^:

- US: 100 × 30 MB = 3 GB

- DX: 50 × 60 MB = 3 GB

- CT: 20 × 500 MB = 10 GB

- MRI: 10 × 200 MB = 2 GB

- **Generación Diaria Total:** \~18 Gigabytes.^59^

Calculando sobre un calendario de 250 días laborables anuales, el sanatorio generará aproximadamente **4.5 Terabytes de datos anuales** en estado primario (sin compresión y sin contar con redundancia para backups). La retención legal de expedientes médicos, que en muchas jurisdicciones se exige por un mínimo de 5 a 10 años, dispara esta métrica a **más de 22.5 TB acumulados en un quinquenio**.^60^

A nivel de ingeniería, esto prohíbe el almacenamiento monolítico en servidores de base de datos tradicionales. La solución arquitectónica exige la implementación de redes de almacenamiento por niveles jerárquicos (Tiered Storage). Las imágenes recientes y de pacientes internados (0 a 12 meses) deben ubicarse en arreglos locales de estado sólido (NVMe) para satisfacer la latencia casi nula exigida por la interpretación diagnóstica urgente (Short-term storage).^61^ Los datos históricos deben migrarse automatizadamente hacia almacenamientos de objetos en la nube de alta durabilidad y bajo coste, como S3 Glacier, que toleran latencias de recuperación de varios minutos a cambio de mitigar drásticamente los gastos de infraestructura (Long-term storage).^61^

## Intersección entre DICOM y la Web Moderna

El protocolo DIMSE, la columna vertebral de la mensajería DICOM descrita anteriormente, está íntimamente ligado a la apertura de sockets TCP en bruto y el mantenimiento de estados de conexión asíncronos prolongados. Los navegadores web y los marcos modernos de desarrollo frontend, como Next.js, están limitados funcionalmente por el protocolo HTTP y la carencia de acceso directo a sockets TCP de capa de red; por consiguiente, un navegador no puede comunicarse nativamente con un servidor PACS convencional empleando comandos C-FIND o C-MOVE.

Para tender un puente sobre este abismo, el Comité DICOM introdujo **DICOMweb**, una adaptación arquitectónica que envuelve los servicios críticos de imagen médica dentro de los paradigmas contemporáneos de interfaces RESTful.^62^ DICOMweb estandariza el intercambio de datos mediante peticiones HTTP estándar utilizando JSON o XML para los metadatos y representaciones binarias multipart (Multipart/Related) para los píxeles masivos.^62^ Sus componentes primarios mapean las funciones DIMSE heredadas ^62^:

- **QIDO-RS (Query based on ID for DICOM Objects):** El equivalente REST al comando C-FIND.^62^ Un cliente Next.js puede ejecutar una simple solicitud GET a la ruta \.../studies?PatientID=123 y recibir una matriz JSON ligera con toda la información necesaria para poblar una tabla de listado de estudios en la interfaz gráfica del médico.^65^

- **WADO-RS (Web Access to DICOM Objects):** El equivalente moderno al comando de recuperación C-GET/C-MOVE.^62^ Su ventaja fundamental sobre el paradigma legacy radica en la fragmentación. A través de rutas como GET\.../studies/{study}/rendered, una aplicación web puede descargar los metadatos al instante y luego solicitar de forma dinámica únicamente los frames o rangos de bytes binarios que el usuario tiene visibles en su pantalla de visualización (Streaming asíncrono). Esto elimina el tiempo de inactividad por descarga total.^63^

- **STOW-RS (Store Over the Web):** Reemplaza funcionalmente a C-STORE, facilitando la subida de archivos DICOM mediante solicitudes POST generadas por herramientas de interoperabilidad web.^62^

Dado que los equipos médicos (como el ecógrafo de la clínica) solo hablan el dialecto antiguo de sockets TCP (DIMSE), y el frontend Next.js solo entiende REST (DICOMweb), es un requisito innegociable la existencia de una capa de **Middleware** (Proxy de Traducción) en el centro de la topología de red.^62^

Uno de los middlewares de código abierto más adoptados y maduros globalmente es **Orthanc**.^66^ Orthanc actúa como un servidor PACS bilingüe. Hacia la red local del sanatorio (LAN), levanta servicios DIMSE que escuchan comandos C-STORE emitidos por las modalidades y almacenan los datos estructuradamente en disco.^25^ Simultáneamente, mediante un sistema de plugins integrados, expone un servidor DICOMweb completo. Next.js interactúa exclusivamente con las API RESTful de Orthanc, que traduce bidireccionalmente las solicitudes HTTP hacia la base de datos interna.^35^

En la frontera de la capa de presentación se posiciona **OHIF Viewer** (Open Health Imaging Foundation), un proyecto web de código abierto diseñado para integrarse estrechamente con arquitecturas DICOMweb (como Orthanc o dcm4chee).^69^ OHIF está escrito nativamente en React, lo que lo hace mecánicamente afín al ecosistema Next.js.^71^ Su sofisticación técnica radica en delegar el procesamiento masivo de texturas DICOM a **Cornerstone.js** ^70^, una biblioteca de renderizado que captura los binarios devueltos por WADO-RS, los envía a hilos en segundo plano del navegador (Web Workers) para decodificar compresiones JPEG 2000 o Lossless, y finalmente inyecta los resultados en un elemento \<canvas\> acelerado por hardware gráfico mediante WebGL, permitiendo reconstrucciones 3D y manipulación fluida de contraste médico sin requerir servidores locales de alto rendimiento en el terminal del cliente.^70^ Para integrarlo, el desarrollo en Next.js típicamente requiere embeber el visor precompilado mediante un elemento iframe por razones de aislamiento del ciclo de vida y estabilidad de dependencias, o como librería importando \@ohif/ui pasando la URL de Orthanc mediante el objeto de configuración window.config y gestionando la autenticación de proxy reverso a través de API Routes de Next.^69^

## Conectividad Compleja de Dispositivos No Imagenológicos

A diferencia del alto grado de homogenización que DICOM impuso sobre las imágenes médicas, el estrato de la patología clínica y la telemetría vital sufre de una severa multiplicidad de estándares incompatibles entre sí.^75^

### Analizadores Clínicos de Laboratorio

La integración de hardware preanalítico y analizadores de inmunología o hematología a un Sistema de Información de Laboratorio (LIS) se desenvuelve históricamente sobre protocolos textuales.^76^ La conectividad en este segmento obedece a dos estándares predominantes ^78^:

1.  **Estándares ASTM (LIS2-A2):** Predominantes en el mercado de dispositivos intermedios y de legado, la Asociación Americana para Pruebas y Materiales definió las especificaciones E1381 y E1394.^79^ Esta comunicación es notablemente primitiva y está basada fuertemente en topologías RS-232, donde la conexión utiliza caracteres de control ASCII crudos.^79^ El protocolo exige un procedimiento de apretón de manos continuo (Handshake); la máquina envía una solicitud de cesión de canal (código ENQ), espera que el servidor envíe reconocimiento (ACK), y recién entonces transmite bloques estructurados de registros de cabecera, paciente y resultados limitados en longitud, sellando el paquete con códigos de suma de comprobación e indicadores de finalización de texto.^79^ Un desarrollador que interactúe con este protocolo requiere software intermedio con módulos analizadores sintácticos (parsers) dedicados.^79^

2.  **HL7 (Health Level 7) versión 2.x:** La arquitectura moderna para equipos de alto rendimiento reemplazó el formato ASTM con la robustez estructurada del estándar HL7 v2.^76^ Un dispositivo de laboratorio comunica resultados automáticos emitiendo mensajes bajo el tipo de evento **ORU\^R01** (Observation Result Unsolicited).^83^ El contenido está rígidamente estructurado en segmentos delimitados por caracteres de barra vertical (\|). La información arranca con el segmento MSH (Message Header) definiendo la fecha y la aplicación de origen, seguido de los segmentos PID (Patient Identification) y OBR (Observation Request), para finalizar con bloques OBX (Observation Result) individuales, conteniendo el código de la prueba (típicamente mapeado bajo ontologías LOINC), el valor numérico, las unidades de medida, los rangos de referencia y la bandera de alerta (Normal, Alto, Bajo).^83^

El patrón de comunicación moderno dicta un flujo bidireccional mediante la arquitectura \"Host-Query\".^77^ En lugar de preconfigurar el analizador manualmente, el operador inserta un tubo de ensayo con un código de barras. El escáner de la máquina lee la etiqueta, emite una consulta de red hacia el LIS, obtiene instrucciones exactas sobre los ensayos requeridos para esa muestra específica, los ejecuta automatizadamente y reenvía los resultados mediante una transmisión tipo Push (ORU\^R01) al motor de integración clínica.^77^

### Electrocardiografía y Formatos de Onda

El transporte de trazados cardíacos enfrenta una lucha histórica de formatos. Los electrocardiógrafos heredados utilizaron ampliamente la especificación **SCP-ECG** (Standard Communications Protocol for Computer-Assisted Electrocardiography).^86^ El SCP-ECG está diseñado estructuralmente con eficiencia binaria para almacenar trazos continuos, pero posee la gran desventaja de requerir conversores adicionales al no ser soportado nativamente por la gran mayoría de los sistemas de archivos institucionales o PACS.^75^ Alternativas como **HL7 aECG** (Annotated ECG), que utilizan el estándar XML, ofrecen una gran legibilidad humana, pero resultan computacionalmente prohibitivos por generar volúmenes de tamaño de archivo ridículamente pesados frente a los registros binarios.^75^ Por tales razones, la ingeniería clínica actual propicia el uso de **DICOM Waveform**.^75^ Bajo este paradigma, la serie temporal eléctrica (con todos sus canales múltiples superpuestos) se empaqueta algorítmicamente en un objeto DICOM estándar como si fuese una imagen más, compartiendo el contexto del paciente y las rutas de conectividad DIMSE y PACS ya implementadas para el resto de la institución.^86^

### Monitores de Signos Vitales y la Norma IEEE 11073

El problema de ingeniería más insondable del escenario hospitalario radica en la integración en tiempo real de los monitores instalados a pie de cama y las unidades de cuidado intensivo. La telemetría ininterrumpida de oxímetría de pulso, presión arterial continua y alarmas paramétricas recae bajo la gigantesca familia de normativas **ISO/IEEE 11073**.^90^ Este conjunto de especificaciones modela arquitecturas orientadas a servicios (Service-oriented Device Connectivity o SDC).^90^

A diferencia del flujo transaccional y asíncrono de un sistema PACS de radiología o de un analizador de laboratorio (donde se recibe un bloque de resultados tras quince minutos de proceso), los monitores IEEE de signos vitales transmiten flujos binarios puros e incesantes de forma síncrona.^93^ Requieren mecanismos complejos de descubrimiento mutuo automatizado en red local (BICEPS) ^96^, emparejamiento con el servidor mediante el principio Productor/Consumidor de métricas, y cifrado de seguridad bajo perfiles MDWPS o gRPC.^90^ Un sistema de gestión web Next.js no tiene la capacidad subyacente para sostener una suscripción de streaming continua de miles de parámetros por segundo y traducirlos.^95^ La captura de telemetría requiere la instalación obligatoria de servidores concentradores (Gateways o Middleware), operando en lenguajes de bajo nivel, configurados para demultiplexar las señales IEEE 11073 en intervalos temporales específicos, agregarlos bajo esquemas semánticos observacionales como HL7 FHIR (Fast Healthcare Interoperability Resources) mediante el paradigma \"Devices on FHIR\" (DoF) y publicarlos de modo legible hacia los servicios web a través de eventos o WebSockets.^95^

## Evaluación de Viabilidad Arquitectónica y Hoja de Ruta (MVP)

A la luz de los requerimientos para el desarrollo y reemplazo del ecosistema PACS (Philips Vue) por parte de un equipo de desarrollo minimizado (o desarrollador individual) que construye sobre tecnologías modernas (Next.js y Supabase), se debe trazar un análisis estricto de viabilidad técnica. Las implementaciones clínicas ostentan niveles masivos de sobrecarga burocrática y complejidad binaria que pueden estancar cualquier línea de tiempo. La regla inquebrantable de viabilidad en este dominio radica en el concepto de \"Construir los flujos de negocio integrados y relegar las capas de red clínica e interoperabilidad hacia herramientas consolidadas de código abierto\".^68^

Escribir demonios TCP/IP personalizados en Node.js que respondan a los complejos apretones de mano DIMSE, gestionen asociaciones, sintaxis de transferencia y decodificación de píxeles para reemplazar el Philips Vue es un antipatrón arquitectónico que resultaría en meses de ingeniería fallida.^101^ El **Producto Mínimo Viable (MVP - El 20% del esfuerzo que rinde el 80% del valor)** debe focalizarse exclusivamente en la orquestación a través de middleware.

### Planificación y Topología Tecnológica

1.  **Core del Reemplazo PACS (Delegación Absoluta):** La columna vertebral para anular el PACS de Philips será el despliegue local de **Orthanc** en la red de la institución.^66^ Enjaulado bajo Docker y vinculado a bases de datos relacionales persistentes como PostgreSQL, Orthanc absorberá silenciosamente las ráfagas C-STORE entrantes provenientes de los ecógrafos.^25^

2.  **Core del Diagnóstico Visual (Integración Web):** Se desechará cualquier intento de construir visores clínicos propios. **OHIF Viewer** se desplegará para consumir directamente los servicios RESTful DICOMweb exponidos por Orthanc.^70^ El ecosistema Supabase/Next.js de gestión actuará únicamente como el motor que organiza los turnos, redirigiendo al radiólogo hacia las URLs del visor embebido o de forma contextual mediante iFrames pasando un token de sesión y el respectivo *Study Instance UID* que extraen el estudio en segundos desde Orthanc a través del protocolo asíncrono WADO-RS.^74^

3.  **Flujo de la Modality Worklist (Impacto Operativo Máximo):** Esta es la meta crucial del desarrollo de backend. Para emular el comportamiento de la solución antigua y ahorrar valiosos minutos del tiempo del ecografista, el código Next.js debe interceptar las admisiones de turnos creadas en Supabase e inyectarlas dinámicamente como registros Scheduled Procedure Step en el módulo de Worklist de Orthanc (o un módulo dedicado en Python) usando llamadas HTTP POST u ORM de HL7.^30^ El ecógrafo operará con su lógica inalterable mediante consultas C-FIND locales al puerto 104 y automáticamente tendrá la información del paciente incrustada en las imágenes.^27^

4.  **Aislamiento y Hardware Serial Heredado:** Para manejar el ecógrafo anticuado del sanatorio operando bajo cables telefónicos RJ11 sobre lógicas RS-232, se procederá invariablemente a la compra comercial de un conversor de red (Moxa Nport o tecnología homóloga de Servidor Serial a Ethernet).^45^ Esta pasarela encapsulará transparentemente las tramas de la señal asíncrona hacia la red de la clínica, evitando modificaciones sobre la placa lógica del equipo médico, conectándolo al hub DICOM central.

### Criterios de Exclusión Temprana para el MVP

Dada la composición limitada del equipo técnico, deben diferirse componentes que añadan alta latencia de integración. En la **Fase 1**, todos los motores de integración orientados a máquinas de laboratorio que empleen ASTM E1381/E1394 o mensajería ORU HL7 v2.x deben retrasarse.^76^ Requerirían del levantamiento adicional y aprendizaje complejo de infraestructuras mediadoras especializadas como Mirth Connect para efectuar la serialización de registros contra la API de la clínica.^82^

De manera más radical, la integración de flujos de **monitoreo biomédico en tiempo real en pie de cama mediante el protocolo IEEE 11073 (SDC)** debe descartarse absoluta e innegociablemente de las fases iniciales y medias del desarrollo.^90^ Esta interconexión somete a la plataforma web a un influjo constante de series temporales continuas y acarrea regulaciones de seguridad y sincronización (NTP/QoS) que escapan al dominio natural de una plataforma de turnos e informes.^95^

En síntesis, la arquitectura ganadora es aquella que explota tecnologías de software libre altamente especializadas en las capas inferiores de la clínica (Orthanc para la ingesta DICOM local/DICOMweb y OHIF para renderizado diagnóstico) y relega el desarrollo de la lógica empresarial, la interfaz de usuario de agenda, y la experiencia del portal del paciente a tecnologías modernas como Next.js y Supabase en la capa superior del marco de infraestructura sanitaria.

#### Works cited

1.  DICOM - Wikipedia, accessed March 30, 2026, [[https://en.wikipedia.org/wiki/DICOM]{.underline}](https://en.wikipedia.org/wiki/DICOM)

2.  Understanding DICOM: What Is The DICOM File Format? - Radsource, accessed March 30, 2026, [[https://radsource.us/understanding-dicom-what-is-the-dicom-file-format/]{.underline}](https://radsource.us/understanding-dicom-what-is-the-dicom-file-format/)

3.  Thirty Years of the DICOM Standard - PMC, accessed March 30, 2026, [[https://pmc.ncbi.nlm.nih.gov/articles/PMC10610864/]{.underline}](https://pmc.ncbi.nlm.nih.gov/articles/PMC10610864/)

4.  Thirty Years of the DICOM Standard - MDPI, accessed March 30, 2026, [[https://www.mdpi.com/2379-139X/9/5/145]{.underline}](https://www.mdpi.com/2379-139X/9/5/145)

5.  DICOM: Practical Guide to Medical Imaging Systems, accessed March 30, 2026, [[https://rtmedical.com.br/dicom-practical-imaging-guide/]{.underline}](https://rtmedical.com.br/dicom-practical-imaging-guide/)

6.  Understanding and Using DICOM, the Data Interchange Standard for Biomedical Imaging, accessed March 30, 2026, [[https://pmc.ncbi.nlm.nih.gov/articles/PMC61235/]{.underline}](https://pmc.ncbi.nlm.nih.gov/articles/PMC61235/)

7.  C.6 SOP Class Definitions - DICOM, accessed March 30, 2026, [[https://dicom.nema.org/dicom/2013/output/chtml/part04/sect_C.6.html]{.underline}](https://dicom.nema.org/dicom/2013/output/chtml/part04/sect_C.6.html)

8.  Digital Imaging and Communications in Medicine (DICOM) Supplement 23: Structured Reporting Storage SOP Classes, accessed March 30, 2026, [[https://www.dicomstandard.org/News-dir/ftsup/docs/sups/sup23.pdf]{.underline}](https://www.dicomstandard.org/News-dir/ftsup/docs/sups/sup23.pdf)

9.  About DICOM SOPs, accessed March 30, 2026, [[https://www.dicomlibrary.com/dicom/sop/]{.underline}](https://www.dicomlibrary.com/dicom/sop/)

10. Composite Commands - Society for Imaging Informatics in Medicine, accessed March 30, 2026, [[https://siim.org/otpedia/composite-commands/]{.underline}](https://siim.org/otpedia/composite-commands/)

11. B.5 Standard SOP Classes - DICOM, accessed March 30, 2026, [[https://dicom.nema.org/medical/dicom/current/output/chtml/part04/sect_b.5.html]{.underline}](https://dicom.nema.org/medical/dicom/current/output/chtml/part04/sect_b.5.html)

12. B.5 Standard SOP Classes - DICOM, accessed March 30, 2026, [[https://dicom.nema.org/dicom/2013/output/chtml/part04/sect_B.5.html]{.underline}](https://dicom.nema.org/dicom/2013/output/chtml/part04/sect_B.5.html)

13. Key Concepts - DICOM, accessed March 30, 2026, [[https://www.dicomstandard.org/concepts]{.underline}](https://www.dicomstandard.org/concepts)

14. 7 DICOM File Format, accessed March 30, 2026, [[https://dicom.nema.org/medical/dicom/current/output/chtml/part10/chapter_7.html]{.underline}](https://dicom.nema.org/medical/dicom/current/output/chtml/part10/chapter_7.html)

15. Overview: Basic DICOM File Structure \| An Overview of the DICOM File Format \| DICOM C API Help - LEADTOOLS, accessed March 30, 2026, [[https://www.leadtools.com/help/sdk/v20/dicom/api/overview-basic-dicom-file-structure.html]{.underline}](https://www.leadtools.com/help/sdk/v20/dicom/api/overview-basic-dicom-file-structure.html)

16. Digital Imaging and Communications in Medicine (DICOM) Supplement 44: Clarification of network addressing and the retirement of, accessed March 30, 2026, [[https://www.dicomstandard.org/News-dir/ftsup/docs/sups/sup44.pdf]{.underline}](https://www.dicomstandard.org/News-dir/ftsup/docs/sups/sup44.pdf)

17. What is DICOM (Digital Imaging Communications in Medicine)? - ExtraHop, accessed March 30, 2026, [[https://www.extrahop.com/blog/introduction-to-dicom-protocol]{.underline}](https://www.extrahop.com/blog/introduction-to-dicom-protocol)

18. D Association Negotiation (Normative) - DICOM, accessed March 30, 2026, [[https://dicom.nema.org/MEDICAL/dicom/2017a/output/chtml/part07/chapter_D.html]{.underline}](https://dicom.nema.org/MEDICAL/dicom/2017a/output/chtml/part07/chapter_D.html)

19. DICOM Introduction, Data Formats, and Protocol On-Demand, accessed March 30, 2026, [[https://siim.org/learning/dicom-introduction-data-formats-and-protocol/]{.underline}](https://siim.org/learning/dicom-introduction-data-formats-and-protocol/)

20. PS3.7 - DICOM - NEMA, accessed March 30, 2026, [[https://dicom.nema.org/medical/dicom/current/output/html/part07.html]{.underline}](https://dicom.nema.org/medical/dicom/current/output/html/part07.html)

21. C.4.2 C-MOVE Operation - DICOM, accessed March 30, 2026, [[https://dicom.nema.org/medical/dicom/current/output/chtml/part04/sect_c.4.2.html]{.underline}](https://dicom.nema.org/medical/dicom/current/output/chtml/part04/sect_c.4.2.html)

22. Basic DICOM Operations - Medical Connections, accessed March 30, 2026, [[https://www.medicalconnections.co.uk/kb/Basic-DICOM-Operations]{.underline}](https://www.medicalconnections.co.uk/kb/Basic-DICOM-Operations)

23. Healthcare\'s anatomy: the DICOM protocol - Gatewatcher, accessed March 30, 2026, [[https://www.gatewatcher.com/en/lab/healthcares-anatomy-le-protocole-dicom/]{.underline}](https://www.gatewatcher.com/en/lab/healthcares-anatomy-le-protocole-dicom/)

24. DICOM CONFORMANCE STATEMENT FOR TOSHIBA DIGITAL MAMMOGRAPHY SYSTEM MODEL MGU-1000D, accessed March 30, 2026, [[https://www.medical.canon/Interoperability/dicom/miixr0014eae.pdf]{.underline}](https://www.medical.canon/Interoperability/dicom/miixr0014eae.pdf)

25. Understanding DICOM with Orthanc, accessed March 30, 2026, [[https://orthanc.uclouvain.be/book/dicom-guide.html]{.underline}](https://orthanc.uclouvain.be/book/dicom-guide.html)

26. C-MOVE vs. C-GET: Unpacking DICOM\'s Data Retrieval Commands \| PostDICOM, accessed March 30, 2026, [[https://www.postdicom.com/en/blog/what-is-the-difference-between-cmove-and-cget-in-dicom]{.underline}](https://www.postdicom.com/en/blog/what-is-the-difference-between-cmove-and-cget-in-dicom)

27. DICOM Modality Worklist, accessed March 30, 2026, [[https://dicomiseasy.blogspot.com/2012/04/dicom-modality-worklist.html]{.underline}](https://dicomiseasy.blogspot.com/2012/04/dicom-modality-worklist.html)

28. Modality Worklist \| DMWL - Society for Imaging Informatics in Medicine, accessed March 30, 2026, [[https://siim.org/otpedia/modality-worklist-dmwl/]{.underline}](https://siim.org/otpedia/modality-worklist-dmwl/)

29. K.6 SOP Class Definitions - DICOM, accessed March 30, 2026, [[https://dicom.nema.org/medical/dicom/2025d/output/chtml/part04/sect_K.6.html]{.underline}](https://dicom.nema.org/medical/dicom/2025d/output/chtml/part04/sect_K.6.html)

30. Understanding DICOM Modality Worklist (DMWL): Enhancing Radiology Workflow Efficiency, accessed March 30, 2026, [[https://dcmsys.com/project/understanding-dicom-modality-worklist-dmwl-enhancing-radiology-workflow-efficiency/]{.underline}](https://dcmsys.com/project/understanding-dicom-modality-worklist-dmwl-enhancing-radiology-workflow-efficiency/)

31. Benefits of the DICOM Modality Performed Procedure Step - PMC - NIH, accessed March 30, 2026, [[https://pmc.ncbi.nlm.nih.gov/articles/PMC3046723/]{.underline}](https://pmc.ncbi.nlm.nih.gov/articles/PMC3046723/)

32. C.4 Networking - DICOM, accessed March 30, 2026, [[ftp://dicom.nema.org/MEDICAL/Dicom/2015a/output/chtml/part02/sect_C.4.html]{.underline}](ftp://dicom.nema.org/MEDICAL/Dicom/2015a/output/chtml/part02/sect_C.4.html)

33. Storage Commitment - DICOM is Easy, accessed March 30, 2026, [[https://dicomiseasy.blogspot.com/2012/06/storage-commitment.html]{.underline}](https://dicomiseasy.blogspot.com/2012/06/storage-commitment.html)

34. DICOM Storage Commitment - Society for Imaging Informatics in Medicine, accessed March 30, 2026, [[https://siim.org/otpedia/dicom-storage-commitment/]{.underline}](https://siim.org/otpedia/dicom-storage-commitment/)

35. DICOM storage commitment --- Orthanc Book documentation, accessed March 30, 2026, [[https://orthanc.uclouvain.be/book/users/storage-commitment.html]{.underline}](https://orthanc.uclouvain.be/book/users/storage-commitment.html)

36. Ethernet Vs. Serial: Which Is Best For Your Hospital? - Translogic, accessed March 30, 2026, [[https://www.translogic.com/en/thought-center/translogic-blog/ethernet-vs-serial-which-is-better-for-your-hospital]{.underline}](https://www.translogic.com/en/thought-center/translogic-blog/ethernet-vs-serial-which-is-better-for-your-hospital)

37. Understanding RS-232: The Legacy Serial Communication Standard Still in Use Today, accessed March 30, 2026, [[https://www.coolgear.com/uncategorized-posts/understanding-rs-232-the-legacy-serial-communication-standard-still-in-use-today.html]{.underline}](https://www.coolgear.com/uncategorized-posts/understanding-rs-232-the-legacy-serial-communication-standard-still-in-use-today.html)

38. RS-232 Explained: Working Principle, Pinout, Cables & Applications - YouTube, accessed March 30, 2026, [[https://www.youtube.com/watch?v=-VOeBvyjGpw]{.underline}](https://www.youtube.com/watch?v=-VOeBvyjGpw)

39. RS232 Pinout and Specifications Guide - Eltima, accessed March 30, 2026, [[https://www.eltima.com/articles/serial-port-pinout-guide/]{.underline}](https://www.eltima.com/articles/serial-port-pinout-guide/)

40. Fundamentals of RS-232 Serial Communications \| Analog Devices, accessed March 30, 2026, [[https://www.analog.com/en/resources/technical-articles/fundamentals-of-rs232-serial-communications.html]{.underline}](https://www.analog.com/en/resources/technical-articles/fundamentals-of-rs232-serial-communications.html)

41. RJ11 to RS232 Wiring and Pinout Guide \| PDF \| Computers - Scribd, accessed March 30, 2026, [[https://www.scribd.com/doc/76829147/RJ-11-to-rs232]{.underline}](https://www.scribd.com/doc/76829147/RJ-11-to-rs232)

42. Unitronics PLC - RJ11 serial port for RS232 and RS485 - Lammert Bies, accessed March 30, 2026, [[https://www.lammertbies.nl/comm/cable/unitronics-rj11]{.underline}](https://www.lammertbies.nl/comm/cable/unitronics-rj11)

43. RJ11 to RS232 Connector Pinout Guide \| PDF \| Science & Mathematics \| Computers - Scribd, accessed March 30, 2026, [[https://www.scribd.com/doc/182546084/RJ11-Connector-for-RS232-Communication-pdf]{.underline}](https://www.scribd.com/doc/182546084/RJ11-Connector-for-RS232-Communication-pdf)

44. Finding RS-232 pinout on an RJ11 connector : r/AskElectronics - Reddit, accessed March 30, 2026, [[https://www.reddit.com/r/AskElectronics/comments/1aoq2bf/finding_rs232_pinout_on_an_rj11_connector/]{.underline}](https://www.reddit.com/r/AskElectronics/comments/1aoq2bf/finding_rs232_pinout_on_an_rj11_connector/)

45. NPort 5000 Series User\'s Manual - Moxa, accessed March 30, 2026, [[https://www.moxa.com/Moxa/media/PDIM/S100000213/moxa-nport-ia5000-series-manual-v4.0.pdf]{.underline}](https://www.moxa.com/Moxa/media/PDIM/S100000213/moxa-nport-ia5000-series-manual-v4.0.pdf)

46. The Medical Environment and the Case for Device Management - Perle Systems, accessed March 30, 2026, [[https://www.perle.com/applications_solutions/healthcare/medical_device_management.shtml]{.underline}](https://www.perle.com/applications_solutions/healthcare/medical_device_management.shtml)

47. Digi International Launches Medical-Grade Serial Server: Digi Connect EZ 4 WS, accessed March 30, 2026, [[https://www.digi.com/company/press-releases/2025/digi-launches-medical-grade-serial-server]{.underline}](https://www.digi.com/company/press-releases/2025/digi-launches-medical-grade-serial-server)

48. How to Configure Moxa Box (serial-to-ethernet converter) - MachineMetrics, accessed March 30, 2026, [[https://support.machinemetrics.com/hc/en-us/articles/360050773673-How-to-Configure-Moxa-Box-serial-to-ethernet-converter]{.underline}](https://support.machinemetrics.com/hc/en-us/articles/360050773673-How-to-Configure-Moxa-Box-serial-to-ethernet-converter)

49. RS232 to Ethernet Converter - Serial Device Server, accessed March 30, 2026, [[https://www.usconverters.com/rs232-serial-ethernet-device-server]{.underline}](https://www.usconverters.com/rs232-serial-ethernet-device-server)

50. DICOM Conformance Statement - GE Healthcare, accessed March 30, 2026, [[https://www.gehealthcare.com/-/jssmedia/75914047b3f047fb848f68acd5b7935f.pdf?la=en-us]{.underline}](https://www.gehealthcare.com/-/jssmedia/75914047b3f047fb848f68acd5b7935f.pdf?la=en-us)

51. What is a DICOM Conformance Statement? - Innolitics, accessed March 30, 2026, [[https://innolitics.com/articles/dicom-conformance-statement/]{.underline}](https://innolitics.com/articles/dicom-conformance-statement/)

52. DICOM Conformance Statements - Society for Imaging Informatics in Medicine, accessed March 30, 2026, [[https://siim.org/otpedia/dicom-conformance-statements/]{.underline}](https://siim.org/otpedia/dicom-conformance-statements/)

53. How Many DICOM Images Are Created Daily \| Global Stats - Collective Minds, accessed March 30, 2026, [[https://collectiveminds.health/articles/how-many-dicom-images-are-created-per-day-understanding-medical-imaging-volume]{.underline}](https://collectiveminds.health/articles/how-many-dicom-images-are-created-per-day-understanding-medical-imaging-volume)

54. About DICOM most common features of study, accessed March 30, 2026, [[https://www.dicomlibrary.com/dicom/study-structure/]{.underline}](https://www.dicomlibrary.com/dicom/study-structure/)

55. Imaging Data 101 - UCSF Radiology, accessed March 30, 2026, [[https://radiology.ucsf.edu/research/core-services/imaging-data-101]{.underline}](https://radiology.ucsf.edu/research/core-services/imaging-data-101)

56. General Imaging Characteristics, accessed March 30, 2026, [[https://medicalimaging.sciencecalculators.org/general-imaging-characteristics/]{.underline}](https://medicalimaging.sciencecalculators.org/general-imaging-characteristics/)

57. Storage media for computers in radiology - PMC - NIH, accessed March 30, 2026, [[https://pmc.ncbi.nlm.nih.gov/articles/PMC2747448/]{.underline}](https://pmc.ncbi.nlm.nih.gov/articles/PMC2747448/)

58. The Current Role of Image Compression Standards in Medical Imaging - PMC, accessed March 30, 2026, [[https://pmc.ncbi.nlm.nih.gov/articles/PMC8525863/]{.underline}](https://pmc.ncbi.nlm.nih.gov/articles/PMC8525863/)

59. PACS Storage Calculator - DICOM Library, accessed March 30, 2026, [[https://www.dicomlibrary.com/dicom/pacs-storage-calculator/]{.underline}](https://www.dicomlibrary.com/dicom/pacs-storage-calculator/)

60. Why radiology needs defined image storage guidelines, accessed March 30, 2026, [[https://radiologybusiness.com/topics/healthcare-management/leadership/why-radiology-needs-defined-image-storage-guidelines]{.underline}](https://radiologybusiness.com/topics/healthcare-management/leadership/why-radiology-needs-defined-image-storage-guidelines)

61. The retention duration of digital images in picture archiving and communication systems - PMC, accessed March 30, 2026, [[https://pmc.ncbi.nlm.nih.gov/articles/PMC10958697/]{.underline}](https://pmc.ncbi.nlm.nih.gov/articles/PMC10958697/)

62. DICOMweb™, accessed March 30, 2026, [[https://www.dicomstandard.org/using/dicomweb]{.underline}](https://www.dicomstandard.org/using/dicomweb)

63. DICOMweb™: Background and Application of the Web Standard for Medical Imaging - PMC, accessed March 30, 2026, [[https://pmc.ncbi.nlm.nih.gov/articles/PMC5959831/]{.underline}](https://pmc.ncbi.nlm.nih.gov/articles/PMC5959831/)

64. DICOMwebTM, accessed March 30, 2026, [[https://www.dicomstandard.org/docs/librariesprovider2/dicomdocuments/wp-cotent/uploads/2018/10/day1_s12-solomon-dicomweb.pdf?sfvrsn=23babc87_2]{.underline}](https://www.dicomstandard.org/docs/librariesprovider2/dicomdocuments/wp-cotent/uploads/2018/10/day1_s12-solomon-dicomweb.pdf?sfvrsn=23babc87_2)

65. DICOMweb Resources, accessed March 30, 2026, [[https://www.dicomstandard.org/using/dicomweb/restful-structure]{.underline}](https://www.dicomstandard.org/using/dicomweb/restful-structure)

66. orthanc-server/orthanc-setup-samples: Sample Orthanc deployments and scripts - GitHub, accessed March 30, 2026, [[https://github.com/orthanc-server/orthanc-setup-samples]{.underline}](https://github.com/orthanc-server/orthanc-setup-samples)

67. DICOMweb plugin --- Orthanc Book documentation, accessed March 30, 2026, [[https://orthanc.uclouvain.be/book/plugins/dicomweb.html]{.underline}](https://orthanc.uclouvain.be/book/plugins/dicomweb.html)

68. Assessing Available Open-Source PACS Options - PMC - NIH, accessed March 30, 2026, [[https://pmc.ncbi.nlm.nih.gov/articles/PMC10584756/]{.underline}](https://pmc.ncbi.nlm.nih.gov/articles/PMC10584756/)

69. DICOMweb - OHIF docs, accessed March 30, 2026, [[https://docs.ohif.org/configuration/datasources/dicom-web/]{.underline}](https://docs.ohif.org/configuration/datasources/dicom-web/)

70. OHIF: Introduction, accessed March 30, 2026, [[https://docs.ohif.org/]{.underline}](https://docs.ohif.org/)

71. OHIF Architecture, accessed March 30, 2026, [[https://docs.ohif.org/development/architecture/]{.underline}](https://docs.ohif.org/development/architecture/)

72. Architecture - OHIF, accessed March 30, 2026, [[https://v2.docs.ohif.org/Architecture/]{.underline}](https://v2.docs.ohif.org/Architecture/)

73. Using Proxy (before Middleware) in Next.js: a modern layer - DEV Community, accessed March 30, 2026, [[https://dev.to/u11d/using-proxy-before-middleware-in-nextjs-a-modern-layer-1iik]{.underline}](https://dev.to/u11d/using-proxy-before-middleware-in-nextjs-a-modern-layer-1iik)

74. Deployment Overview \| OHIF, accessed March 30, 2026, [[https://docs.ohif.org/3.11/deployment/]{.underline}](https://docs.ohif.org/3.11/deployment/)

75. A review of ECG storage formats - PubMed, accessed March 30, 2026, [[https://pubmed.ncbi.nlm.nih.gov/21775198/]{.underline}](https://pubmed.ncbi.nlm.nih.gov/21775198/)

76. LIS/HL7 Integration for Analyzers: Mapping, Validation & Pitfalls - Diamond Diagnostics, accessed March 30, 2026, [[https://www.diamonddiagnostics.com/blog/lishl7-integration-for-analyzers-mapping-validation-pitfalls]{.underline}](https://www.diamonddiagnostics.com/blog/lishl7-integration-for-analyzers-mapping-validation-pitfalls)

77. LIS software: the key to interfaces and connectivity \| CGM, accessed March 30, 2026, [[https://www.cgm.com/usa_en/articles/articles/lab/lis-software-the-key-to-interfaces-and-connectivity.html]{.underline}](https://www.cgm.com/usa_en/articles/articles/lab/lis-software-the-key-to-interfaces-and-connectivity.html)

78. Difference Between HL7 and ASTM for Healthcare Interoperability - Prolis LIS Software, accessed March 30, 2026, [[https://www.prolisphere.com/difference-between-hl7-and-astm/]{.underline}](https://www.prolisphere.com/difference-between-hl7-and-astm/)

79. Introduction to ASTM \| Routing ASTM Documents in Productions \| HealthShare Health Connect 2026.1, accessed March 30, 2026, [[https://docs.intersystems.com/healthconnectlatest/csp/docbook/DocBook.UI.Page.cls?KEY=EAST_intro]{.underline}](https://docs.intersystems.com/healthconnectlatest/csp/docbook/DocBook.UI.Page.cls?KEY=EAST_intro)

80. GeneXpert® LIS Interface Protocol Specification - CEPHEID, accessed March 30, 2026, [[https://infomine.cepheid.com/sites/default/files/2021-10/LIS%20Protocol%20Specification%20302-2261%2C%20Rev.%20C.pdf]{.underline}](https://infomine.cepheid.com/sites/default/files/2021-10/LIS%20Protocol%20Specification%20302-2261%2C%20Rev.%20C.pdf)

81. LIS Integration Guide - APHL, accessed March 30, 2026, [[https://www.aphl.org/aboutAPHL/publications/Documents/GH-LIS-Integration-Guide.pdf]{.underline}](https://www.aphl.org/aboutAPHL/publications/Documents/GH-LIS-Integration-Guide.pdf)

82. ASTM E1381: A Comprehensive Guide - Meditecs, accessed March 30, 2026, [[https://www.meditecs.com/kb/astm-e1381-guide/]{.underline}](https://www.meditecs.com/kb/astm-e1381-guide/)

83. Version 2 (V2) - Health Data Standards and Terminologies: A Tutorial - NIH, accessed March 30, 2026, [[https://www.nlm.nih.gov/oet/ed/healthdatastandards/03-300.html]{.underline}](https://www.nlm.nih.gov/oet/ed/healthdatastandards/03-300.html)

84. HL7 - ORU Message - iNTERFACEWARE, accessed March 30, 2026, [[https://www.interfaceware.com/hl7-oru]{.underline}](https://www.interfaceware.com/hl7-oru)

85. Extending ASTM fiunctionality - Functional - SENAITE Community, accessed March 30, 2026, [[https://community.senaite.org/t/extending-astm-fiunctionality/1237]{.underline}](https://community.senaite.org/t/extending-astm-fiunctionality/1237)

86. C.7 Harmonization With SCP-ECG - DICOM Standard, accessed March 30, 2026, [[ftp://dicom.nema.org/MEDICAL/dicom/2016c/output/chtml/part17/sect_C.7.html]{.underline}](ftp://dicom.nema.org/MEDICAL/dicom/2016c/output/chtml/part17/sect_C.7.html)

87. C.7 Harmonization With SCP-ECG - DICOM, accessed March 30, 2026, [[https://dicom.nema.org/medical/Dicom/2023c/output/chtml/part17/sect_C.7.html]{.underline}](https://dicom.nema.org/medical/Dicom/2023c/output/chtml/part17/sect_C.7.html)

88. The History and Challenges of SCP-ECG: The Standard Communication Protocol for Computer-Assisted Electrocardiography - MDPI, accessed March 30, 2026, [[https://www.mdpi.com/2673-3846/2/3/31]{.underline}](https://www.mdpi.com/2673-3846/2/3/31)

89. ECG Standards and Formats for Interoperability between mHealth and Healthcare Information Systems: A Scoping Review - PMC, accessed March 30, 2026, [[https://pmc.ncbi.nlm.nih.gov/articles/PMC9565220/]{.underline}](https://pmc.ncbi.nlm.nih.gov/articles/PMC9565220/)

90. IEEE 11073 SDC Stack and Integration Kit - Vector, accessed March 30, 2026, [[https://www.vector.com/int/en/products/products-a-z/embedded-software/ieee11073sdc/]{.underline}](https://www.vector.com/int/en/products/products-a-z/embedded-software/ieee11073sdc/)

91. 2019, Health informatics---Point-of-care medical device communication---Part 10101: Nomenclature - IEEE Xplore, accessed March 30, 2026, [[https://ieeexplore.ieee.org/iel7/8863788/8863789/08863790.pdf]{.underline}](https://ieeexplore.ieee.org/iel7/8863788/8863789/08863790.pdf)

92. Wireless standard-compliant e-health solution for elderly people with multiuser identification, accessed March 30, 2026, [[https://pmc.ncbi.nlm.nih.gov/articles/PMC10126905/]{.underline}](https://pmc.ncbi.nlm.nih.gov/articles/PMC10126905/)

93. ISO/IEEE 11073 - Wikipedia, accessed March 30, 2026, [[https://en.wikipedia.org/wiki/ISO/IEEE_11073]{.underline}](https://en.wikipedia.org/wiki/ISO/IEEE_11073)

94. Implementation of ISO/IEEE 11073 PHD SpO2 and ECG Device Specializations over Bluetooth HDP following Health Care Profile for Smart Living - PMC, accessed March 30, 2026, [[https://pmc.ncbi.nlm.nih.gov/articles/PMC9371174/]{.underline}](https://pmc.ncbi.nlm.nih.gov/articles/PMC9371174/)

95. HL7 FHIR-Based Open-Source Framework for Real-Time Biomedical Signal Acquisition and IoMT Interoperability - MDPI, accessed March 30, 2026, [[https://www.mdpi.com/2076-3417/15/23/12803]{.underline}](https://www.mdpi.com/2076-3417/15/23/12803)

96. IHE Patient Care Devices (PCD) White Paper Service-oriented Device Point-of-Care Interoperability (SDPi) Revision 1.1 - IHE International, accessed March 30, 2026, [[https://www.ihe.net/uploadedFiles/Documents/PCD/IHE_PCD_WP_SDPi_Rev1-1_Pub_2019-11-01.pdf]{.underline}](https://www.ihe.net/uploadedFiles/Documents/PCD/IHE_PCD_WP_SDPi_Rev1-1_Pub_2019-11-01.pdf)

97. Guidance „Conformity Assessment of medical devices that contain an interoperable IEEE 11073 SDC interface and apply for CE mar - HL7 Confluence, accessed March 30, 2026, [[https://confluence.hl7.org/download/attachments/274268342/20240802_Guidance%20for%20Medical%20Devices%20with%20IEEE%2011073%20SDC%20Interface%20_final.pdf?api=v2]{.underline}](https://confluence.hl7.org/download/attachments/274268342/20240802_Guidance%20for%20Medical%20Devices%20with%20IEEE%2011073%20SDC%20Interface%20_final.pdf?api=v2)

98. IEEE Std 11073-10700-2022, Health Informatics---Device Interoperability---Part 10700: Point-of-Care Medical Device Communication - IEEE Xplore, accessed March 30, 2026, [[https://ieeexplore.ieee.org/iel7/10253647/10253648/10253649.pdf]{.underline}](https://ieeexplore.ieee.org/iel7/10253647/10253648/10253649.pdf)

99. Medical Device EHR Integration: Complete Implementation Guide, accessed March 30, 2026, [[https://topflightapps.com/ideas/integrate-medical-device-with-ehr/]{.underline}](https://topflightapps.com/ideas/integrate-medical-device-with-ehr/)

100. Mapping of medical device data from ISO/IEEE 11073-10207 to HL7 FHIR - Journals Overview \| Publisso, accessed March 30, 2026, [[https://journals.publisso.de/en/journals/mibe/volume17/mibe000222]{.underline}](https://journals.publisso.de/en/journals/mibe/volume17/mibe000222)

101. I\'m building a simple, open PACS alternative for low-resource hospitals. What\'s the #1 thing that bugs you about your current system? : r/PACSAdmin - Reddit, accessed March 30, 2026, [[https://www.reddit.com/r/PACSAdmin/comments/1jv0965/im_building_a_simple_open_pacs_alternative_for/]{.underline}](https://www.reddit.com/r/PACSAdmin/comments/1jv0965/im_building_a_simple_open_pacs_alternative_for/)

102. Using OHIF Viewer in a NextJS Application - Support - Open Health Imaging Foundation, accessed March 30, 2026, [[https://community.ohif.org/t/using-ohif-viewer-in-a-nextjs-application/1073]{.underline}](https://community.ohif.org/t/using-ohif-viewer-in-a-nextjs-application/1073)

103. About DICOMcloud, accessed March 30, 2026, [[http://dicomcloud.com/docs/dicomcloud/about/]{.underline}](http://dicomcloud.com/docs/dicomcloud/about/)

104. Sample DICOM Modality Worklist Production - InterSystems Documentation, accessed March 30, 2026, [[https://docs.intersystems.com/latest/csp/docbook/DocBook.UI.Page.cls?KEY=EDICOM_worklist_production]{.underline}](https://docs.intersystems.com/latest/csp/docbook/DocBook.UI.Page.cls?KEY=EDICOM_worklist_production)

105. python-astm - Google Code, accessed March 30, 2026, [[https://code.google.com/archive/p/python-astm]{.underline}](https://code.google.com/archive/p/python-astm)

106. Comparison and Analysis of ISO/IEEE 11073, IHE PCD-01, and HL7 FHIR Messages for Personal Health Devices - PubMed, accessed March 30, 2026, [[https://pubmed.ncbi.nlm.nih.gov/29503752/]{.underline}](https://pubmed.ncbi.nlm.nih.gov/29503752/)

107. IEEE 11073-10701-2022 - IEEE SA, accessed March 30, 2026, [[https://standards.ieee.org/ieee/11073-10701/7538/]{.underline}](https://standards.ieee.org/ieee/11073-10701/7538/)
