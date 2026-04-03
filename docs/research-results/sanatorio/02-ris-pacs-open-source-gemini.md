# Informe Exhaustivo sobre Arquitectura RIS/PACS y Evaluación de Infraestructura de Código Abierto para Entornos Clínicos

## 1. Sistema de Información Radiológica (RIS) y PACS: Arquitectura y Ciclo de Vida

En el ecosistema de la informática médica, la gestión de imágenes y el flujo de trabajo radiológico dependen de la interacción orquestada entre el Sistema de Información Radiológica (RIS) y el Sistema de Archivo y Comunicación de Imágenes (PACS). Aunque operan en conjunto y su integración es imperativa para la eficiencia clínica, sus responsabilidades estructurales, los tipos de datos que manejan y los protocolos subyacentes que utilizan son diametralmente opuestos.^1^

El Sistema de Información Radiológica (RIS) funciona como el motor administrativo y logístico central del departamento de diagnóstico por imágenes.^2^ Su enfoque principal es la gestión del flujo de trabajo clínico, manejando de manera casi exclusiva datos alfanuméricos.^1^ Las funciones centrales de un RIS abarcan la programación de turnos, el registro demográfico de pacientes, el seguimiento del estado de los estudios, la gestión de la disponibilidad de las modalidades, la facturación de las prestaciones y la creación, almacenamiento y distribución de los informes radiológicos finales.^1^

Por el contrario, el PACS es la infraestructura de software y hardware dedicada a la adquisición, almacenamiento a corto y largo plazo, recuperación y visualización de las imágenes médicas.^4^ El PACS maneja grandes volúmenes de datos visuales basados en píxeles, junto con metadatos incrustados que dictan protocolos de adquisición, geometría de la imagen y características técnicas del escaneo.^1^ La principal diferencia conceptual radica en que el RIS gestiona el flujo de trabajo (el contexto clínico y administrativo), mientras que el PACS gestiona el activo digital (la imagen médica y su visualización).^1^

Para comprender la complejidad de esta interacción, es necesario analizar el ciclo de vida completo de un estudio médico. Este ciclo detalla cómo la información transita a través de los sistemas desde la concepción de la necesidad clínica hasta la entrega del diagnóstico.

El ciclo de vida del estudio médico se desarrolla a través de una secuencia estricta de eventos interconectados. Inicialmente, en la etapa de orden, el ciclo comienza cuando un médico referente genera una solicitud clínica desde un sistema externo (HIS o EHR) o directamente en la interfaz del RIS.^7^ A continuación, en la fase de programación, el RIS recibe esta orden, verifica la cobertura del paciente, comprueba las autorizaciones previas y asigna un turno en una modalidad específica, definiendo el espacio temporal y el recurso físico a utilizar. Posteriormente, se genera la lista de trabajo, donde el RIS expone los datos demográficos del paciente y los detalles del estudio a la modalidad de adquisición mediante el protocolo DICOM Modality Worklist (MWL). Este paso es crítico ya que elimina la entrada manual de datos en la consola del equipo, previniendo errores tipográficos que resultarían en discrepancias de identidad del paciente.^6^

Una vez que el paciente se encuentra en la sala, ocurre la fase de adquisición, donde el técnico radiólogo selecciona al paciente de la lista de trabajo y realiza el escaneo; la modalidad genera las imágenes resultantes y las envía al servidor PACS.^5^ Inmediatamente después, en la fase de almacenamiento, el PACS recibe las imágenes, verifica su integridad estructural y las archiva en sus repositorios de corto o largo plazo, notificando opcionalmente al RIS que las imágenes están disponibles para su lectura.^5^ Esto habilita la fase de interpretación, donde el médico radiólogo utiliza un visor DICOM de alta resolución conectado al PACS para analizar las imágenes, evaluando hallazgos y formulando un diagnóstico.^9^ Seguidamente, en la fase de informe, el radiólogo dicta o transcribe sus hallazgos en el RIS (o en un módulo de dictado integrado), el cual almacena el texto del informe y lo vincula lógicamente con el estudio almacenado en el PACS.^1^ Finalmente, en la etapa de entrega y facturación, el RIS distribuye el informe finalizado y firmado al médico referente o al portal del paciente, y simultáneamente activa los flujos de facturación correspondientes hacia las aseguradoras de salud.^4^

  -----------------------------------------------------------------------------------------------------------------------------------------
  **Característica**       **RIS (Radiology Information System)**                 **PACS (Picture Archiving and Communication System)**
  ------------------------ ------------------------------------------------------ ---------------------------------------------------------
  **Dominio Principal**    Flujo de trabajo administrativo y clínico.             Gestión, archivo y visualización de imágenes.

  **Tipos de Datos**       Alfanuméricos (demografía, turnos, texto, códigos).    Visuales (píxeles masivos) y metadatos estructurados.

  **Funciones Core**       Agendamiento, informes, facturación, rastreo.          Adquisición, almacenamiento, renderizado, distribución.

  **Protocolo Estándar**   HL7 (Health Level 7) para interoperabilidad.           DICOM (Digital Imaging and Communications in Medicine).

  **Impacto Operativo**    Optimiza tiempos de espera, ingresos y coordinación.   Maximiza precisión diagnóstica y disponibilidad visual.
  -----------------------------------------------------------------------------------------------------------------------------------------

La comunicación técnica entre el RIS y el PACS se fundamenta en la traducción e integración de dos ecosistemas de estándares distintos. El RIS se comunica primordialmente mediante el estándar HL7, diseñado para la transmisión de datos textuales, órdenes clínicas y eventos administrativos.^10^ El PACS opera de manera nativa bajo el estándar DICOM, el cual define no solo el formato del archivo de imagen, sino el protocolo de red subyacente para la transferencia.^12^ La convergencia ocurre en la capa de integración: el RIS traduce los mensajes de órdenes HL7 (ORM) en una lista de trabajo DICOM (Modality Worklist) que las modalidades consultan.^6^ Del mismo modo, cuando el ciclo concluye, el PACS o el RIS pueden interactuar a través de las API modernas como FHIR (Fast Healthcare Interoperability Resources) para exponer los resultados radiológicos a plataformas de terceros o portales de pacientes, reemplazando gradualmente la mensajería HL7 tradicional por arquitecturas RESTful.^13^

## 2. Análisis Arquitectónico Profundo de Servidores PACS

La arquitectura de un PACS moderno ha evolucionado desde servidores monolíticos ubicados en los sótanos de los hospitales hacia infraestructuras distribuidas, escalables y tolerantes a fallos, diseñadas para manejar la explosión exponencial en el tamaño de los estudios médicos modernos, como las tomografías computarizadas de múltiples cortes y las resonancias magnéticas funcionales.^9^

El núcleo de un PACS se compone de cuatro pilares arquitectónicos fundamentales. La pasarela de adquisición (Acquisition Gateway) actúa como el punto de entrada exclusivo de la red del PACS. Su función principal es recibir las imágenes directamente desde las modalidades mediante el comando DICOM C-STORE.^5^ Esta pasarela realiza tareas críticas en tiempo real: valida la integridad de los metadatos de las cabeceras DICOM, anonimiza datos si es necesario para enrutamiento externo, comprime las imágenes utilizando sintaxis de transferencia autorizadas (como JPEG2000 Lossless) para optimizar el ancho de banda, y enruta los datos hacia los repositorios correspondientes.

El segundo componente es la base de datos o motor de indexación. A diferencia de las creencias comunes, las imágenes médicas en sí mismas rara vez se almacenan dentro de una base de datos relacional.^9^ En su lugar, el PACS utiliza un sistema de gestión de bases de datos relacional (como PostgreSQL, Oracle o MySQL) para mantener un índice exhaustivo de las relaciones jerárquicas del modelo DICOM: Paciente ![](media/image1.png){width="0.2016415135608049in" height="0.23722550306211723in"} Estudio ![](media/image1.png){width="0.2016415135608049in" height="0.23722550306211723in"} Serie ![](media/image1.png){width="0.2016415135608049in" height="0.23722550306211723in"} Instancia. Esta base de datos almacena los metadatos alfanuméricos extraídos de las cabeceras DICOM (como el *StudyInstanceUID* o el *PatientID*), lo que permite que el PACS responda en milisegundos a las consultas de búsqueda (DICOM C-FIND o llamadas RESTful QIDO-RS) sin tener que leer los masivos archivos físicos de imágenes.

El tercer pilar es el archivo (Archive), que representa el sistema de almacenamiento físico o lógico donde residen los objetos DICOM subyacentes (los archivos con extensión .dcm). Finalmente, el visor diagnóstico (Viewer) constituye la capa de presentación. Las arquitecturas modernas han abandonado en gran medida los \"clientes pesados\" instalados localmente a favor de visores de \"huella cero\" (Zero-Footprint Web Viewers) basados en HTML5 y WebGL.^5^ Estos visores solicitan los píxeles bajo demanda a través del protocolo DICOMweb (WADO-RS), permitiendo a los radiólogos visualizar, procesar reconstrucciones multiplanares (MPR) y realizar mediciones desde cualquier navegador web moderno sin descargar el estudio completo a la memoria local.

El flujo de imágenes a través de esta arquitectura es un proceso continuo y altamente regulado. Cuando una modalidad finaliza un estudio, inicia una asociación TCP/IP con la pasarela del PACS y comienza a transmitir cada instancia (imagen) individual.^9^ La pasarela recibe el flujo binario, verifica la sintaxis de transferencia y extrae los metadatos necesarios para insertarlos en la base de datos de índice. Simultáneamente, el archivo en crudo se escribe en el nivel de almacenamiento a corto plazo. Una vez que todas las instancias asociadas a un estudio han sido recibidas y el estudio alcanza un estado estable (Stable Age), el motor de flujo de trabajo del PACS evalúa las reglas de enrutamiento y puede desencadenar la transferencia automática de las imágenes hacia estaciones de trabajo específicas o notificar al RIS sobre la disponibilidad del estudio.^5^

Para manejar de forma rentable y eficiente el inmenso peso de los datos radiológicos, la arquitectura de almacenamiento de un PACS corporativo implementa una estrategia jerárquica o niveles de almacenamiento (Storage Tiering).^15^

  ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Nivel de Almacenamiento**   **Tecnología Subyacente**                 **Uso Clínico Típico**                                                       **Latencia de Recuperación**
  ----------------------------- ----------------------------------------- ---------------------------------------------------------------------------- ----------------------------------
  **Corto Plazo (Online)**      SSDs, Arreglos NVMe en SAN/NAS.           Estudios recientes (0-90 días) y previos solicitados (Prefetching).          Sub-milisegundos a milisegundos.

  **Largo Plazo (Nearline)**    Discos HDD densos, Object Storage (S3).   Estudios históricos de pacientes inactivos. Archivo de retención.            Segundos.

  **Archivo Frío (Offline)**    Cintas LTO magnéticas, AWS Glacier.       Cumplimiento regulatorio y retención legal a largo plazo (ej. \> 10 años).   Minutos a horas.
  ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Las fallas en la infraestructura de imágenes médicas paralizan instantáneamente las operaciones clínicas, por lo que los patrones de recuperación ante desastres (Disaster Recovery - DR) son primordiales.^10^ La estrategia contemporánea de DR se aleja de la simple copia de seguridad en cinta hacia arquitecturas de nube híbrida o clústeres activo-activo. En un escenario híbrido recomendado, el sanatorio mantiene un servidor PACS local de borde (Edge PACS) que proporciona almacenamiento en caché a corto plazo y velocidades Gigabit para el tráfico pesado de las modalidades locales.^15^ De manera asíncrona, este Edge PACS replica cada estudio entrante hacia un repositorio de almacenamiento de objetos inmutable en la nube (por ejemplo, Supabase Storage o AWS S3). En el supuesto de que el sanatorio sufra un evento catastrófico físico, pérdida de energía prolongada o un ataque de *ransomware* destructivo que comprometa la red local, el servicio continúa operando. Los radiólogos y médicos referentes pueden conectarse a una instancia PACS redundante alojada íntegramente en la nube, que accede al almacenamiento de objetos inalterado, permitiendo mantener la continuidad del cuidado al paciente mientras se reconstruye la infraestructura local.^15^

## 3. Evaluación Detallada de Servidores PACS de Código Abierto

Para una iniciativa clínica independiente que busca evadir los altos costos de licencias corporativas y construir una plataforma integrada con tecnologías web modernas, la selección del motor PACS de código abierto es la decisión técnica de mayor impacto. El ecosistema actual presenta diversas opciones, siendo Orthanc, dcm4chee y Dicoogle las plataformas más maduras para despliegues de grado de producción.^18^

### Orthanc

Orthanc se define como un servidor DICOM sumamente ligero, autónomo y diseñado desde sus cimientos para facilitar la interoperabilidad.^20^ A diferencia de las soluciones heredadas, Orthanc fue creado en la era de la web, exponiendo la totalidad de sus funcionalidades a través de una API RESTful nativa, lo que lo convierte en la herramienta predilecta para desarrolladores modernos.^21^

Arquitectónicamente, Orthanc está escrito en C++ puro, lo que garantiza un uso mínimo de memoria y procesamiento.^20^ Por defecto, utiliza SQLite como motor de indexación y el sistema de archivos local para almacenamiento, lo que facilita enormemente su configuración inicial para pruebas.^20^ Sin embargo, su verdadera capacidad empresarial se desbloquea a través de su arquitectura basada en plugins.^22^ A través de estos módulos, Orthanc reemplaza sus subsistemas por defecto: el plugin de PostgreSQL asume la gestión de la base de datos permitiendo escalabilidad y alta concurrencia ^23^, el plugin de AWS S3 o Azure redirige el almacenamiento masivo hacia la nube, y el plugin DICOMweb provee compatibilidad estandarizada (WADO-RS, QIDO-RS, STOW-RS) imprescindible para los visores HTML5 modernos.^22^

Una de las características más disruptivas de Orthanc es su capacidad de integración lógica mediante scripts en Lua o Python.^26^ Esto permite a los desarrolladores interceptar eventos internos (por ejemplo, cuando un estudio alcanza el estado estable) y ejecutar lógicas de negocio complejas, como enrutamiento automático de imágenes, llamadas a APIs externas, o modificaciones al vuelo de etiquetas DICOM.^20^

En términos de preparación para la producción, Orthanc es absolutamente capaz de manejar entornos clínicos dinámicos y escalables, siempre que se configure con los plugins de bases de datos empresariales adecuados.^28^ Sus limitaciones principales radican en que no proporciona de forma nativa interfaces complejas de facturación, ni soporta el protocolo HL7 v2 sin desarrollo adicional a través de sus scripts de Python o middleware externo.^29^ No es una suite de gestión hospitalaria completa; es un motor DICOM especializado.

- **Dictamen: ¿Elegiría esta opción?** **Definitivamente sí.** Para un equipo reducido, o un desarrollador independiente, que integra un ecosistema basado en Node.js, Next.js y Supabase, Orthanc es indiscutiblemente la mejor opción. Su API REST permite que una aplicación web maneje flujos DICOM con simples peticiones HTTP, su sistema de plugins de Python facilita la orquestación, y su contenedorización oficial en Docker simplifica el despliegue al mínimo.^21^

  ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Criterio**                        **Observación sobre Orthanc**
  ----------------------------------- ------------------------------------------------------------------------------------------------------------------------------------------------
  **Pros**                            API REST nativa, extremada ligereza, plugins de Python/Lua, soporte excelente de DICOMweb, comunidad brillante, despliegue simple vía Docker.

  **Contras**                         UI administrativa básica, carece de motor HL7 nativo out-of-the-box, requiere configuración de plugins para escalado empresarial (PostgreSQL).

  **Caso de uso ideal**               Clínicas en expansión, desarrolladores web construyendo ecosistemas personalizados, despliegues multi-sede mediante sincronización en la nube.
  ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

### dcm4chee (dcm4chee-arc-light)

Basado en la robusta biblioteca dcm4che, dcm4chee es el PACS de código abierto con mayor trayectoria y penetración en entornos corporativos y hospitales de alta complejidad.^30^

Su arquitectura actual (dcm4chee-arc-light) es una reescritura moderna fundamentada en la pila de tecnología Java EE, típicamente desplegada sobre servidores de aplicaciones empresariales como WildFly.^29^ Está profundamente arraigado en el cumplimiento estricto de los perfiles de integración de IHE (Integrating the Healthcare Enterprise) y hace un uso exhaustivo de bases de datos relacionales robustas y sistemas de identidad LDAP.

A diferencia de Orthanc, dcm4chee ofrece un conjunto de características masivo e integral desde su instalación. Posee soporte nativo y completo para la recepción e interpretación de mensajería HL7 v2 (recibiendo órdenes y emitiendo resultados sin necesidad de scripts de terceros), una gestión de Modality Worklist (MWL) profundamente integrada y capacidades sofisticadas de partición de datos, retención por reglas de ciclo de vida e interfaces administrativas granulares.^29^ Su preparación para producción es incuestionable; está diseñado para sostener implementaciones en redes hospitalarias académicas procesando cientos de terabytes de datos de imágenes.^15^

Sin embargo, esta potencia tiene un costo drástico en complejidad. La curva de aprendizaje es severamente pronunciada.^29^ La instalación, afinación de memoria de la máquina virtual Java, configuración de colas de mensajes JMS y administración de la seguridad LDAP requieren conocimientos especializados de administración de sistemas Java corporativos, lo cual resulta prohibitivo para equipos pequeños.

- **Dictamen: ¿Elegiría esta opción?** **No, bajo el contexto actual.** Aunque dcm4chee es superior como un reemplazo directo de un PACS corporativo monolítico en un gran hospital, es una herramienta excesivamente pesada (\"overkill\") para un desarrollador independiente construyendo un ecosistema basado en Next.js. El esfuerzo requerido para mantener la pila Java EE eclipsa los beneficios de su motor HL7, especialmente cuando la lógica administrativa recaerá sobre Supabase.^29^

  ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Criterio**                        **Observación sobre dcm4chee**
  ----------------------------------- ----------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Pros**                            Rendimiento y escalabilidad masiva, soporte integral HL7 e IHE nativo, partición de datos empresarial, gestión completa de Worklists sin código adicional.

  **Contras**                         Curva de aprendizaje extremadamente empinada, arquitectura Java/WildFly pesada y difícil de configurar, sobredimensionado para despliegues de clínicas individuales.

  **Caso de uso ideal**               Redes hospitalarias complejas de nivel 3 o superior, donde equipos enteros de TI dedicados administran la interoperabilidad HIS/RIS a gran escala.
  ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

### Dicoogle

Dicoogle representa un enfoque arquitectónico alternativo en el panorama de código abierto. En lugar de depender centralmente de bases de datos relacionales estructuradas, Dicoogle fue pionero al adoptar motores de indexación de texto completo (como Apache Lucene) y bases de datos orientadas a documentos.^32^

Esta elección de diseño le confiere a Dicoogle una capacidad de indexación extremadamente flexible, permitiendo búsquedas de forma libre a través de cualquier etiqueta DICOM, independientemente de si la etiqueta es estándar o propietaria.^33^ Adicionalmente, Dicoogle fomenta el uso de arquitecturas distribuidas *peer-to-peer*, donde múltiples nodos pueden federar sus índices.

- **Dictamen: ¿Elegiría esta opción?** **No.** A pesar de su arquitectura de indexación innovadora, Dicoogle no posee la misma tracción de comunidad comunitaria ni la riqueza documental que caracteriza a Orthanc.^32^ Carece de un soporte de nivel de producción de APIs amigables para la web (como la implementación minuciosa de DICOMweb que posee Orthanc) y su adopción fuera del ámbito académico es limitada, lo que incrementa el riesgo de soporte a largo plazo para un proyecto en solitario.

### Otros Ecosistemas: Horos y 3D Slicer

Es crucial diferenciar entre servidores PACS y estaciones de trabajo de visualización (Thick Clients). Opciones populares como **Horos** (exclusivo para macOS) y **3D Slicer** (multiplataforma) son excepcionales programas de análisis y visualización médica, pero no son infraestructuras de servidor.^34^ Operan descargando la totalidad de los datos del estudio DICOM hacia la memoria RAM de la computadora local para ejecutar algoritmos avanzados de reconstrucción 3D, segmentación o registro de imágenes. No están diseñados para el acceso web concurrente de múltiples usuarios, no ofrecen APIs REST para integraciones modernas, ni actúan como bases de datos centrales de enrutamiento institucional. Pueden conectarse al servidor PACS (por ejemplo, Orthanc) mediante comandos DICOM C-MOVE para obtener estudios para análisis experto, pero no pueden sustituir el rol del archivo central.^9^

## 4. Patrones de Integración: Next.js, Supabase y el Motor DICOM

El desarrollo de un sistema clínico moderno por un único desarrollador exige seleccionar tecnologías que maximicen la productividad y delegar complejidades estructurales a servicios gestionados. El trinomio Next.js (Frontend y API Routes), Supabase (Backend as a Service, Base de datos y Autenticación) y Orthanc (Motor DICOM) constituye un patrón arquitectónico excepcional.^36^

### Integración de Supabase y Orthanc

En este modelo, **Supabase actúa formalmente como el repositorio del sistema RIS**.^36^ Supabase proporciona una base de datos PostgreSQL expuesta de forma segura a través de APIs autogeneradas, manejando con fluidez todo el ciclo de vida de los datos alfanuméricos: registro de pacientes, gestión de agendas y turneras, y el estado del informe radiológico.^38^

El servidor Orthanc requiere su propia base de datos relacional para indexar los metadatos DICOM y lograr un rendimiento óptimo. En lugar de desplegar una base de datos PostgreSQL separada y aislarla, un patrón de integración altamente recomendado es utilizar el plugin de PostgreSQL de Orthanc para conectar el PACS a la misma instancia de base de datos alojada en Supabase.^24^ Al configurar el plugin de Orthanc con un parámetro como schema: \"orthanc_db\", Orthanc aísla todas sus tablas dentro de un esquema distinto al esquema public donde reside la lógica del RIS de Supabase.^24^ Este patrón centraliza las políticas de respaldo (backups) y el mantenimiento de la base de datos, mientras mantiene una separación estricta de dominios de datos.^39^ Mientras tanto, el almacenamiento masivo de los archivos binarios DICOM crudos puede configurarse mediante el plugin de S3 de Orthanc para residir en los *buckets* de Supabase Storage o en un contenedor AWS S3 independiente.^28^

### Autenticación, Autorización y Visualización Segura

Garantizar que solo el personal autorizado o el paciente correspondiente acceda a una imagen médica es un mandato innegociable frente a normativas como la Ley 25.326 de Protección de Datos en Argentina.^40^ El acceso al visor de imágenes requiere un puente de seguridad entre el ecosistema web y el ecosistema DICOM.

La aplicación Next.js gestiona la sesión global utilizando Supabase Auth, el cual emite un JSON Web Token (JWT) tras un inicio de sesión exitoso.^41^ Para visualizar imágenes, el frontend de Next.js típicamente integra el visor de código abierto **OHIF Viewer** (acoplado a través de DICOMweb hacia Orthanc) en un *iframe* o como un componente de React.^42^

El problema surge en que Orthanc desconoce los usuarios de Supabase. La solución radica en la implementación del **Advanced Authorization Plugin** de Orthanc.^44^ Este plugin intercepta toda solicitud entrante hacia las APIs de Orthanc (incluyendo las peticiones del visor OHIF). El flujo opera de la siguiente manera:

1.  El visor OHIF, operando dentro de Next.js, envía una solicitud WADO-RS a Orthanc para descargar un estudio, inyectando el JWT de Supabase en el encabezado HTTP Authorization: Bearer \<token\>.^45^

2.  El plugin de Orthanc detecta el token y, al estar configurado para no validar localmente, suspende la petición y realiza un POST a un *Endpoint* de autorización delegado, que corresponde a una API Route segura dentro de Next.js (ej. /api/auth/orthanc-verify) o una Supabase Edge Function.^46^

3.  Esta API Route de Next.js verifica criptográficamente la validez del JWT usando las claves públicas de Supabase.^48^

4.  Posteriormente, la API consulta la base de datos de Supabase (las políticas RLS y tablas del RIS) para verificar si la identidad atada a ese JWT tiene permisos clínicos para visualizar el StudyInstanceUID que se está solicitando.^49^

5.  La API Route responde a Orthanc con un objeto JSON (ej. { \"granted\": true }). Al recibir autorización explícita, Orthanc libera el recurso y sirve la imagen médica al visor OHIF.^50^ Esta delegación de autoridad mantiene a Orthanc puramente como un motor DICOM y consolida las reglas de acceso en el framework web.

### Lógica de Enrutamiento DICOM (Auto-routing)

En un sanatorio, diversas modalidades de adquisición (Tomógrafos, Resonadores, Ecógrafos) envían imágenes a un servidor PACS unificado. Una función crítica del RIS es el enrutamiento inteligente: derivar el estudio entrante a la estación de trabajo y a la bandeja de entrada del médico radiólogo especialista adecuado (por ejemplo, derivar estudios cerebrales a neuroradiólogos).

Orthanc resuelve esta necesidad de integración clínica sin requerir motores de enrutamiento externos mediante su **Plugin de Python** integrado.^26^ Este plugin permite cargar scripts nativos de Python dentro del núcleo de Orthanc, con acceso directo a la API y a los eventos del ciclo de vida del servidor.^51^

La lógica de enrutamiento se programa interceptando el evento OnChange, específicamente observando el tipo de cambio ChangeType.STABLE_STUDY. Es crítico evaluar los estudios solo cuando están estables (es decir, han pasado un umbral de tiempo, por defecto 60 segundos, sin recibir nuevas instancias) para garantizar que el enrutamiento no se aplique a un estudio a medio transmitir.^52^

Dentro del script de Python, la función orthanc.RestApiGet() se invoca sobre el identificador del estudio para recuperar el conjunto completo de etiquetas DICOM en formato JSON.^52^ El script implementa un motor de reglas que examina los metadatos.^54^ Por ejemplo, extrae la etiqueta Modality (0008, 0060) y la StudyDescription (0008, 1030). Si la lógica detecta que la modalidad es \"MR\" y la descripción contiene la cadena \"CEREBRO\", el sistema reconoce un estudio neuro-radiológico.^20^

Una vez clasificado, el script realiza una solicitud HTTP asíncrona hacia el backend de Supabase (o a una API Route de Next.js) informando el ID del estudio, la modalidad y la descripción, para que Supabase actualice la base de datos RIS y asigne el estudio a la bandeja de entrada clínica del Dr. Especialista. Simultáneamente, el script de Python en Orthanc puede ejecutar orthanc.RestApiPost(\'/modalities/{AET_Destino}/store\',\...) instruyendo al servidor para que transmita una copia DICOM del estudio hacia la estación de trabajo local específica del especialista, utilizando el protocolo C-STORE tradicional.^51^

## 5. Estándares Clínicos: El Rol de HL7 y FHIR

La interoperabilidad en salud se rige por los paradigmas establecidos por *Health Level Seven International*. Comprender la distinción entre sus versiones es fundamental para diseñar integraciones correctas.

### HL7 versión 2 (v2)

HL7 v2 es el estándar heredado que, pese a su antigüedad, impulsa actualmente más del 90% de las comunicaciones internas intrahospitalarias a nivel mundial.^10^ Es un protocolo basado en el envío secuencial de mensajes transaccionales impulsados por eventos (Event-Driven), utilizando una sintaxis críptica de texto plano delimitada por barras verticales (pipes) y sombreritos (\| y \^) y transportada frecuentemente sobre el protocolo de bajo nivel MLLP (Minimal Lower Layer Protocol).^59^

En el contexto radiológico, tres mensajes HL7 v2 componen el núcleo de la sincronización ^59^:

- **ADT (Admit, Discharge, Transfer):** Controla el flujo del paciente. Si recepción actualiza el apellido o domicilio de un paciente en el HIS, se dispara un mensaje ADT que actualiza inmediatamente la base de datos del RIS y el PACS, asegurando la sincronización demográfica institucional.^30^

- **ORM (Order Message):** Transmite la orden de examen. Un mensaje ORM enviado al RIS desencadena la creación de una lista de trabajo (Modality Worklist) en formato DICOM, permitiendo que el tomógrafo sepa qué pacientes debe escanear durante el día sin requerir ingreso manual.^63^

- **ORU (Observation Result):** Comunica los resultados clínicos. Una vez que el radiólogo redacta el informe en el RIS, el sistema empaqueta el texto en un mensaje ORU y lo envía de regreso al Historial Clínico Electrónico (EHR) del hospital para que el médico referente lea el diagnóstico final.^63^

### FHIR (Fast Healthcare Interoperability Resources)

FHIR representa la modernización radical de la interoperabilidad clínica. Diseñado para la era de Internet, FHIR abandona los crípticos mensajes de texto delimitados por barras a favor de interfaces de programación de aplicaciones (APIs) verdaderamente RESTful y estructuras de datos formateadas en JSON o XML.^13^

La arquitectura de FHIR se basa en \"Recursos\" granulares, discretos y direccionables (por ejemplo, el recurso Patient, Observation, ImagingStudy). A diferencia de HL7 v2, que requiere procesar un mensaje gigantesco para actualizar un dato, con FHIR un sistema cliente puede ejecutar una solicitud HTTP GET simple hacia un recurso Patient específico para consultar únicamente su número de teléfono, u obtener metadatos estructurados sobre la ubicación de las imágenes consultando el recurso ImagingStudy.^65^

### Requerimientos para una Clínica Independiente

Para un desarrollador en solitario que construye un sistema RIS desde cero (Next.js + Supabase) acoplado con Orthanc para una sola clínica o sanatorio, **la implementación interna estricta de mensajería HL7 v2 o servidores FHIR puros no es un requisito funcional**.^67^ Como el frontend, el backend administrativo (Supabase) y la interfaz de integración con Orthanc operan bajo el mismo control arquitectónico, la comunicación entre ellos puede (y debe) utilizar consultas de base de datos directas (SQL/PostgREST) y APIs JSON diseñadas a medida, lo cual es exponencialmente más veloz, seguro y libre de fricción técnica que forzar la infraestructura a enrutar mensajes HL7 v2 internamente.^68^

La necesidad de soportar estos estándares surge **exclusivamente al integrar sistemas externos**.^67^ Si el sanatorio en el futuro decide conectar este nuevo RIS con el sistema de Historia Clínica Electrónica de una obra social externa, o reportar epidemiología a la plataforma SISA (Sistema Integrado de Información Sanitaria Argentino) del Ministerio de Salud, la adherencia a los estándares será obligatoria.^69^ Para estos escenarios de integración en los \"bordes\" de la red (Edge Integration), existen herramientas de código abierto formidables. **Mirth Connect (NextGen Connect)** es un motor de integración (Interface Engine) líder que puede escuchar los eventos internos de la base de datos de Supabase y transformarlos al vuelo en mensajes HL7 v2 para despacharlos hacia sistemas heredados.^64^ De manera más moderna, proyectos como **HAPI FHIR** proporcionan implementaciones en Java de servidores FHIR completos para hospedar recursos normalizados ^13^, o bibliotecas en Python como **HL7apy** que permiten a los scripts parsear o generar mensajes HL7 crudos sin la sobrecarga de un motor de integración empresarial completo.^72^

## 6. Estrategias de Migración desde Philips Vue PACS

La migración de datos desde un PACS propietario (como Philips Vue PACS) hacia un nuevo servidor de código abierto, particularmente cuando el sistema origen presenta fallas críticas de funcionamiento, es la fase de mayor riesgo en la transición.^73^ Una migración clínica es imperdonable ante la pérdida de información (Zero Data Loss); la inaccesibilidad a los estudios previos compromete diagnósticos de evolución de patologías oncológicas o crónicas.^17^

Philips Vue PACS opera convencionalmente con una arquitectura donde los metadatos y el flujo de estados residen en una instancia de Oracle Database, mientras que las matrices binarias de píxeles se alojan en directorios de caché de sistemas SAN o NAS acoplados.^75^ La complejidad radica en que los proveedores empresariales a menudo no almacenan los archivos DICOM en el disco utilizando los metadatos o extensiones estándar, sino que ofuscan, comprimen o alteran los identificadores en la capa del sistema de archivos, haciendo inútil una simple copia de archivos mediante el sistema operativo.^76^

Existen tres métodos primarios para extraer y migrar los datos hacia Orthanc, ordenados desde la metodología de mayor nivel hasta la intervención forense:

1.  **Migración DICOM Nativa (C-FIND / C-MOVE):** Si los servicios de red de aplicación (DICOM SCP) de Philips Vue continúan respondiendo a pesar de fallas en su cliente (Vue Client) ^77^, la migración nativa es la estrategia dominante. Se configura el nuevo Orthanc como un destino (AET) autorizado dentro del servidor Philips. Se utilizan utilidades externas (como el módulo movescu de la suite dcmtk o scripts en Python usando pydicom ^78^) para realizar solicitudes de búsqueda (C-FIND) segmentadas por fecha o rangos de *Accession Numbers*. Por cada resultado positivo, se despacha un comando de recuperación (C-MOVE) ordenándole al servidor Philips que transmita de forma activa el estudio hacia la pasarela de Orthanc vía C-STORE.^78^ Orthanc asimila, valida la sintaxis y reindexa los estudios de manera limpia. Esta operación se realiza idealmente en horas de baja demanda clínica y requiere la gestión de reintentos por latencia.^80^

2.  **Exportación Manual de Medios (DICOMDIR):** Si el servidor de bases de datos es inestable y las conexiones de red DICOM expiran por tiempos de espera agotados, pero la interfaz administrativa aún permite la operación parcial de usuarios, se puede ejecutar una exportación secuencial hacia discos externos.^81^ Desde el cliente de Philips Vue, se seleccionan paquetes de estudios y se utiliza la herramienta nativa de grabación de CDs o \"Exportación\" para crear volúmenes estructurados que generen un archivo índice estándar DICOMDIR.^82^ Estos discos o directorios extraíbles se importan luego masivamente hacia Orthanc utilizando herramientas de inyección por lotes (ImportDicom), lo cual sortea los cuellos de botella de la red y previene desconexiones de servicio.^82^

3.  **Extracción Forense de Base de Datos y Almacenamiento (Extracción en Frío):** En el escenario de colapso catastrófico donde los servicios DICOM y de cliente de Philips no inician ^77^, la extracción de red resulta imposible. La intervención requiere acceso directo a la base de datos subyacente (Oracle) para consultar las tablas que mantienen el diccionario de mapeo, cruzando los identificadores de estudio lógicos (StudyInstanceUID) con las rutas absolutas de los archivos ofuscados en la red SAN.^75^ Un script de migración especializado iterará sobre estos registros en frío, leerá los binarios directamente desde el disco duro origen y realizará peticiones HTTP POST inyectando la carga útil del archivo (payload) sobre la API REST /instances de Orthanc, forzando la reconstrucción y reindexación de la imagen fuera del ecosistema propietario.^76^

Para la seguridad operacional, la transición nunca debe ser un corte abrupto de conmutación. Se requiere una ejecución en paralelo (Dual-Run). Durante la transición, las modalidades de la clínica (tomógrafos, ecógrafos) se reconfiguran para despachar las nuevas adquisiciones simultáneamente tanto hacia el nodo de Orthanc como hacia el servidor Philips Vue legado (si aún puede recibir datos). Esta redundancia permite a los médicos evaluar y adaptar sus flujos de trabajo sobre el nuevo visor (OHIF/Orthanc) teniendo el sistema antiguo como respaldo inmediato. Al finalizar el volcado, un proceso automatizado debe realizar la conciliación de bases de datos, comparando estadísticamente recuentos de series y estudios en ambos sistemas para certificar la inexistencia de datos perdidos.^76^

## 7. Arquitectura Recomendada para el Caso de Uso (Sanatorio Argentino)

Para un desarrollador único, el diseño de la arquitectura debe maximizar la robustez, facilitar el soporte y apoyarse fuertemente en servicios en la nube auto-gestionables en componentes críticos. El siguiente diagrama de texto ilustra la topología recomendada para una plataforma web clínica basada en Next.js, apoyada por Supabase, y soportando imágenes médicas mediante Orthanc.

### Diagrama Textual de Arquitectura

# ======================================================================== NUBE (VPS / PaaS)

(Next.js Web App / Vercel)

\| - Turnera y Agendamiento - Componente Visor Médico (OHIF) \|

\| - Facturación (Fase 5) - Portal de Pacientes \|

+\-\-\-\-\-\-\-\-\-\-\-\--+\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--+\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--+

\| (Consultas DB API) \| (Peticiones DICOMweb)

v v (Token JWT Inyectado)

+\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--+ +\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--+

\| BACKEND & BASE DE DATOS (RIS) \| \| MOTOR PACS CORE (Código Abierto) \|

\| (Supabase) \| \| (Orthanc) \|

\| \| \| \|

\| - Autenticación (GoTrue JWT) \|\<\--+ - Plugin Advanced Authorization \|

\| - Base de Datos (PostgreSQL) \|\<\--+ - Plugin PostgreSQL (Índice) \|

\| - Control de Acceso (RLS) \| \| - Plugin S3 (Almacena imágenes) \|

+\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--+ +\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--+

\^ \^

# \| (Lectura/Escritura DB) \| (Transferencia DICOM)

RED LOCAL DEL SANATORIO

========================================================================

\| \|

v v

+\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--+ +\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--+

\| GATEWAY HL7 / SINCRONIZADOR \| \| ENRUTADOR PACS DE BORDE (EDGE) \|

\| (Opcional Fase 5) \| \| (Mini Orthanc Local) \|

\| - Transforma eventos de BD \| \| - Recibe y comprime localmente \|

\| en HL7 para la obra social. \| \| - Reenvío asíncrono a la nube \|

+\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--+ +\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--+

\^

\| (DICOM C-STORE)

+\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--+

\| MODALIDADES MÉDICAS FÍSICAS \|

\| (Tomógrafo, Resonador, Rayos X) \|

+\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--+

### Minimum Viable Architecture (Día 1) y Diferimiento Funcional

En un escenario crítico donde el sistema heredado está fallando, la priorización de características determina el éxito.

**Esencial desde el Día 1 (MVA para reactivar flujo clínico):**

- **Recepción y Seguridad Visual:** El nodo de Orthanc (preferiblemente contenerizado) ejecutándose junto a un repositorio de almacenamiento confiable (Plugin PostgreSQL y almacenamiento en disco). La configuración de las modalidades para enviar imágenes a este nuevo servidor es mandatoria para frenar la dependencia del servidor caído.

- **Visor de Diagnóstico Integrado:** Despliegue de OHIF conectado mediante DICOMweb a Orthanc. Los médicos deben poder abrir un navegador, iniciar sesión (vía Supabase Auth) y visualizar las radiografías urgentes inmediatamente.^29^

- **Sincronización de Base de Datos Base:** El uso de Supabase como backend relacional, protegiendo las tablas con Row Level Security (RLS) básica.^37^

**Elementos Diferibles (Pospuestos para iteraciones de estabilización):**

- *Modality Worklist (MWL):* Permitir que los técnicos ingresen momentáneamente los datos de forma manual o gestionen las agendas por fuera del tubo de adquisición. Implementar un servidor MWL basado en Python que traduzca datos de Supabase hacia los tomógrafos demanda tiempo de pruebas para no interrumpir envíos.^51^

- *Enrutamiento Python Complejo:* Retrasar los algoritmos de enrutamiento basados en IA o palabras clave profundas en Python. Redirigir todas las imágenes a un *pool* unificado inicialmente para validación visual.

- *Facturación Integral y HL7:* Posponer la creación de pasarelas HL7 y conexiones con facturadores externos (Obras sociales) hasta garantizar que ninguna imagen diagnóstica se pierde.^64^

## 8. Evaluación de Viabilidad, Roadmap Priorizado y Riesgos

El modelo propuesto sitúa un ecosistema completo sobre los hombros de un desarrollador único (Solo Developer). Aunque las arquitecturas sin servidor (Serverless) de Supabase y los microservicios Docker de Orthanc democratizan el desarrollo que antaño requería ejércitos corporativos, es fundamental emitir un dictamen de honestidad operativa ante la magnitud del proyecto clínico.^38^

### Análisis de Viabilidad y Riesgos (Solo Developer)

Técnicamente, desplegar y mantener Orthanc interconectado a una plataforma Next.js + Supabase **es plenamente realizable por un solo ingeniero con sólidos conocimientos en arquitecturas backend**.^38^ Orthanc suprime la barrera de entrada al oscuro mundo del protocolo DICOM al abstraerlo tras una simple API REST, lo que permite que un programador Full-Stack maneje estudios radiológicos como si gestionara fotografías en un e-commerce.^21^

Sin embargo, el riesgo **operativo y legal roza lo inaceptable sin protocolos de mitigación extremos**. Las imágenes médicas no son un activo de software tradicional; son elementos diagnósticos críticos. Una interrupción de servicio en el servidor PACS retrasa tratamientos de emergencia médica, intervenciones quirúrgicas o estudios de terapia intensiva.^85^

En la jurisdicción argentina, la *Ley 25.326 de Protección de Datos Personales* clasifica a los registros médicos como datos extremadamente sensibles, imponiendo deberes estrictos de confidencialidad, seguridad criptográfica y garantías contra alteraciones o pérdida de historiales clínicos, con penalidades severas ante filtraciones (breaches) derivadas de fallas de autorización (como un RLS en Supabase mal configurado que permita a un paciente ver placas ajenas) o pérdida irrecuperable por fallas de infraestructura sin redundancia.^40^ El desarrollador no solo codifica la aplicación, sino que, en solitario, funge como el *Data Protection Officer* y Administrador de Sistemas de guardia 24/7.

### Responsabilidades del Ecosistema

Para mitigar la carga técnica de un solo ingeniero, el diseño debe aprovechar al extremo los sistemas en los que se delegan las lógicas:

  ---------------------------------------------------------------------------------------------------------------------------------
  **Subsistema de Responsabilidad**                                                      **Tecnología Especializada Asignada**
  -------------------------------------------------------------------------------------- ------------------------------------------
  **Gestión Demográfica, Roles de Usuarios, Portal del Paciente**                        Supabase (PostgreSQL, GoTrue Auth) ^37^

  **Lógica del Flujo Administrativo, Turnera y Lógica Frontend**                         Next.js (React, API Routes) ^38^

  **Negociación TCP/IP DICOM, Compresión de Imágenes y Almacenamiento Masivo Binario**   Orthanc (C++ Server, Plugin S3) ^20^

  **Renderizado 3D de imágenes médicas (MPR, Windowing) en navegador**                   Visor OHIF (Cliente WebGL DICOMweb) ^42^
  ---------------------------------------------------------------------------------------------------------------------------------

La premisa de seguridad para la soledad del desarrollador recae en la contención: Supabase y Next.js orquestan el negocio, y Orthanc se utiliza como un motor aislado que reacciona de manera predecible y que puede reciclarse de forma instantánea mediante contenedores Docker.

### Roadmap Estratégico Priorizado (Fase 5)

La hoja de ruta sugerida para la Fase 5 del proyecto, orientada a rescatar el entorno disfuncional del cliente y escalar progresivamente las soluciones clínicas, requiere un estricto orden de priorización para evitar fracasos catastróficos:

1.  **Reemplazo del PACS y Estabilización (Fase 5.2 - Inmediata):**

    - La avería del sistema heredado (Philips Vue) representa una hemorragia operativa. La prioridad número uno es desplegar Orthanc, enlazar los equipos de imágenes, conectar el visor OHIF a un panel simple en Next.js, y comenzar a archivar y visualizar los estudios diarios.^43^

    - Iniciar asíncronamente las estrategias de rescate e importación del archivo legajo antiguo para proteger el historial médico vital del sanatorio.^74^

2.  **Flujo de Pacientes y Sincronización RIS (Fase 5.1):**

    - Con las imágenes circulando establemente, modelar en Supabase el ciclo administrativo (admisiones, demografía).

    - Programar los scripts internos de Python dentro de Orthanc para auto-enrutar la carga de trabajo y exponer un servicio de Modality Worklist (MWL), eliminando los cuellos de botella de transcripción manual en la consola de adquisición.^51^

3.  **Portal del Paciente y Distribución (Fase 5.5):**

    - Implementar autorizaciones sofisticadas (Advanced Authorization plugin conectando Orthanc y las políticas RLS de Supabase) para proveer URLs seguras y efímeras.^46^ Esto permitirá a los pacientes y médicos externos iniciar sesión en la aplicación Next.js y acceder a sus propios estudios e informes radiológicos.

4.  **Módulo de Facturación y Liquidación (Fase 5.3):**

    - Acoplar el registro de finalización de informes con el sistema de codificación nomenclador. Desarrollar las interfaces contables que compilen los servicios efectuados y generen liquidaciones para las diversas obras sociales, requiriendo, de ser necesario, interfaces HL7 marginales de exportación.^89^

5.  **Herramientas de Especialistas y Dictado por IA (Fases 5.6 y 5.4):**

    - Estas fases configuran un elemento de lujo operacional que debe acometerse únicamente sobre cimientos estables. Integración de motores de procesamiento de lenguaje natural (NLP) o servicios Whisper/GPT en el frontend para transcribir el audio del radiólogo y generar directamente un texto estructurado en el informe clínico radicado en la base de datos Supabase.^90^

En síntesis, este ecosistema técnico permite orquestar de manera innovadora una infraestructura médica de clase corporativa. Al aislar estrictamente las responsabilidades entre la flexibilidad administrativa de Next.js/Supabase y la robustez estandarizada del núcleo dicom de Orthanc, se obtiene una plataforma de código abierto plenamente funcional que suprime la dependencia de infraestructuras cerradas y arcaicas, siempre y cuando se adopte una postura inquebrantable frente a las políticas de seguridad y disponibilidad continua de datos.

#### Works cited

1.  RIS vs PACS: The Complete 2025 Guide to Radiology Information Systems and Picture Archiving and Communication Systems - Curogram, accessed March 30, 2026, [[https://curogram.com/blog/ris-vs-pacs-radiology-systems-guide]{.underline}](https://curogram.com/blog/ris-vs-pacs-radiology-systems-guide)

2.  What is the difference between PACS, DICOM, RIS & CIS? - Radsource, accessed March 30, 2026, [[https://radsource.us/differences-betwen-pacs-dicom-ris-cis/]{.underline}](https://radsource.us/differences-betwen-pacs-dicom-ris-cis/)

3.  What Is a Radiology Information System (RIS)? - Candelis, accessed March 30, 2026, [[https://www.candelis.com/blog/what-is-ris]{.underline}](https://www.candelis.com/blog/what-is-ris)

4.  RIS and PACS Integration for Better Radiology Performance - Romexsoft, accessed March 30, 2026, [[https://www.romexsoft.com/blog/ris-pacs/]{.underline}](https://www.romexsoft.com/blog/ris-pacs/)

5.  PACS Architecture: How It Works, Key Components, and Architecture Models, accessed March 30, 2026, [[https://blog.medicai.io/en/a-deep-dive-into-how-pacs-architecture-works/]{.underline}](https://blog.medicai.io/en/a-deep-dive-into-how-pacs-architecture-works/)

6.  RIS vs PACS: Key Differences, Workflows, and Which You Need, accessed March 30, 2026, [[https://blog.medicai.io/en/ris-vs-pacs/]{.underline}](https://blog.medicai.io/en/ris-vs-pacs/)

7.  Understanding and Navigating Imaging Workflow Challenges in Healthcare, accessed March 30, 2026, [[https://dcmsys.com/project/enterprise-imaging-workflow-challenges/]{.underline}](https://dcmsys.com/project/enterprise-imaging-workflow-challenges/)

8.  Understanding DICOM Modality Worklist (DMWL): Enhancing Radiology Workflow Efficiency, accessed March 30, 2026, [[https://dcmsys.com/project/understanding-dicom-modality-worklist-dmwl-enhancing-radiology-workflow-efficiency/]{.underline}](https://dcmsys.com/project/understanding-dicom-modality-worklist-dmwl-enhancing-radiology-workflow-efficiency/)

9.  Picture archiving and communication system - Wikipedia, accessed March 30, 2026, [[https://en.wikipedia.org/wiki/Picture_archiving_and_communication_system]{.underline}](https://en.wikipedia.org/wiki/Picture_archiving_and_communication_system)

10. A Review of Core Concepts of Imaging Informatics - PMC, accessed March 30, 2026, [[https://pmc.ncbi.nlm.nih.gov/articles/PMC9864478/]{.underline}](https://pmc.ncbi.nlm.nih.gov/articles/PMC9864478/)

11. PACS and Radiology (RIS) & Hospital Information System (HIS) - Intelerad Medical Systems, accessed March 30, 2026, [[https://www.intelerad.com/en/2022/08/09/how-does-pacs-work-together-with-radiology-information-systems/]{.underline}](https://www.intelerad.com/en/2022/08/09/how-does-pacs-work-together-with-radiology-information-systems/)

12. DICOM vs HL7 - Everything You Need To Know - Radsource, accessed March 30, 2026, [[https://radsource.us/dicom-vs-hl7/]{.underline}](https://radsource.us/dicom-vs-hl7/)

13. HL7 vs FHIR Comparison Guide - ICANotes, accessed March 30, 2026, [[https://www.icanotes.com/2026/01/06/hl7-vs-fhir-comparison-guide/]{.underline}](https://www.icanotes.com/2026/01/06/hl7-vs-fhir-comparison-guide/)

14. Creating a Medical Imaging Workflow Based on FHIR, DICOMweb, and SVG - PMC, accessed March 30, 2026, [[https://pmc.ncbi.nlm.nih.gov/articles/PMC10287854/]{.underline}](https://pmc.ncbi.nlm.nih.gov/articles/PMC10287854/)

15. Design and Implementation of a Cloud PACS Architecture - PMC, accessed March 30, 2026, [[https://pmc.ncbi.nlm.nih.gov/articles/PMC9654824/]{.underline}](https://pmc.ncbi.nlm.nih.gov/articles/PMC9654824/)

16. What Are the 4 Major Components of PACS? - Candelis, accessed March 30, 2026, [[https://www.candelis.com/blog/4-components-of-pacs]{.underline}](https://www.candelis.com/blog/4-components-of-pacs)

17. PACS System Radiology: Complete Implementation & Migration Guide 2026 - RAD365, accessed March 30, 2026, [[https://www.rad365.com/blogs/pacs-implementation-migration-guide]{.underline}](https://www.rad365.com/blogs/pacs-implementation-migration-guide)

18. Assessing Available Open-Source PACS Options - PMC - NIH, accessed March 30, 2026, [[https://pmc.ncbi.nlm.nih.gov/articles/PMC10584756/]{.underline}](https://pmc.ncbi.nlm.nih.gov/articles/PMC10584756/)

19. Assessing Available Open-Source PACS Options - ResearchGate, accessed March 30, 2026, [[https://www.researchgate.net/publication/373333491_Assessing_Available_Open-Source_PACS_Options]{.underline}](https://www.researchgate.net/publication/373333491_Assessing_Available_Open-Source_PACS_Options)

20. The Orthanc Ecosystem for Medical Imaging - PMC - NIH, accessed March 30, 2026, [[https://pmc.ncbi.nlm.nih.gov/articles/PMC5959835/]{.underline}](https://pmc.ncbi.nlm.nih.gov/articles/PMC5959835/)

21. REST API of Orthanc, accessed March 30, 2026, [[https://orthanc.uclouvain.be/book/users/rest.html]{.underline}](https://orthanc.uclouvain.be/book/users/rest.html)

22. Plugins --- Orthanc Book documentation, accessed March 30, 2026, [[https://orthanc.uclouvain.be/book/plugins.html]{.underline}](https://orthanc.uclouvain.be/book/plugins.html)

23. PostgreSQL - Orthanc - DICOM Server, accessed March 30, 2026, [[https://www.orthanc-server.com/static.php?page=postgresql]{.underline}](https://www.orthanc-server.com/static.php?page=postgresql)

24. PostgreSQL plugins --- Orthanc Book documentation, accessed March 30, 2026, [[https://orthanc.uclouvain.be/book/plugins/postgresql.html]{.underline}](https://orthanc.uclouvain.be/book/plugins/postgresql.html)

25. DICOMweb - Orthanc - DICOM Server, accessed March 30, 2026, [[https://www.orthanc-server.com/static.php?page=dicomweb]{.underline}](https://www.orthanc-server.com/static.php?page=dicomweb)

26. Blog - Orthanc - DICOM Server, accessed March 30, 2026, [[https://www.orthanc-server.com/static.php?page=blog]{.underline}](https://www.orthanc-server.com/static.php?page=blog)

27. Server-side scripting with Lua --- Orthanc Book documentation, accessed March 30, 2026, [[https://orthanc.uclouvain.be/book/users/lua.html]{.underline}](https://orthanc.uclouvain.be/book/users/lua.html)

28. hybrid architecture - Google Groups archive - Orthanc Users, accessed March 30, 2026, [[https://discourse.orthanc-server.org/t/hybrid-architecture/3105]{.underline}](https://discourse.orthanc-server.org/t/hybrid-architecture/3105)

29. How does Orthanc compare to dcm4chee? - Google Groups archive, accessed March 30, 2026, [[https://discourse.orthanc-server.org/t/how-does-orthanc-compare-to-dcm4chee/2275]{.underline}](https://discourse.orthanc-server.org/t/how-does-orthanc-compare-to-dcm4chee/2275)

30. Top 10 Best Pacs Medical Imaging Software of 2026 - Gitnux, accessed March 30, 2026, [[https://gitnux.org/best/pacs-medical-imaging-software/]{.underline}](https://gitnux.org/best/pacs-medical-imaging-software/)

31. What is the gaps between Orthanc and DCM4CHEE? - Google Groups, accessed March 30, 2026, [[https://groups.google.com/g/dcm4che/c/gzNlhGbJbHE]{.underline}](https://groups.google.com/g/dcm4che/c/gzNlhGbJbHE)

32. Dicoogle Open Source: The Establishment of a New Paradigm in Medical Imaging - PMC, accessed March 30, 2026, [[https://pmc.ncbi.nlm.nih.gov/articles/PMC9535235/]{.underline}](https://pmc.ncbi.nlm.nih.gov/articles/PMC9535235/)

33. Dicoogle Framework for Medical Imaging Teaching and Research - arXiv, accessed March 30, 2026, [[https://arxiv.org/pdf/1912.00877]{.underline}](https://arxiv.org/pdf/1912.00877)

34. 6 Best Open Source DICOM Annotation Tools - Encord, accessed March 30, 2026, [[https://encord.com/blog/best-open-source-annotation-medical-imaging/]{.underline}](https://encord.com/blog/best-open-source-annotation-medical-imaging/)

35. Top 5 DICOM Viewers : r/Neuroradiology - Reddit, accessed March 30, 2026, [[https://www.reddit.com/r/Neuroradiology/comments/xmd0iy/top_5_dicom_viewers/]{.underline}](https://www.reddit.com/r/Neuroradiology/comments/xmd0iy/top_5_dicom_viewers/)

36. Building a Healthcare App with Next.js and Supabase: A Complete Guide \| Vaibhav Parmar, accessed March 30, 2026, [[https://vaibhav-parmar-portfolio.vercel.app/blog/building-healthcare-app-with-nextjs-supabase]{.underline}](https://vaibhav-parmar-portfolio.vercel.app/blog/building-healthcare-app-with-nextjs-supabase)

37. Architecture \| Supabase Docs, accessed March 30, 2026, [[https://supabase.com/docs/guides/getting-started/architecture]{.underline}](https://supabase.com/docs/guides/getting-started/architecture)

38. Full Stack Development with Next.js and Supabase -- The Complete Guide - freeCodeCamp, accessed March 30, 2026, [[https://www.freecodecamp.org/news/the-complete-guide-to-full-stack-development-with-supabas/]{.underline}](https://www.freecodecamp.org/news/the-complete-guide-to-full-stack-development-with-supabas/)

39. Use Supabase with Next.js, accessed March 30, 2026, [[https://supabase.com/docs/guides/getting-started/quickstarts/nextjs]{.underline}](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)

40. 1 PROTECCION DE LOS DATOS PERSONALES Ley 25.326 Disposiciones Generales. Principios generales relativos a la protección de dato - OAS.org, accessed March 30, 2026, [[https://www.oas.org/juridico/pdfs/arg_ley25326.pdf]{.underline}](https://www.oas.org/juridico/pdfs/arg_ley25326.pdf)

41. Build a User Management App with Next.js \| Supabase Docs, accessed March 30, 2026, [[https://supabase.com/docs/guides/getting-started/tutorials/with-nextjs]{.underline}](https://supabase.com/docs/guides/getting-started/tutorials/with-nextjs)

42. DICOMweb - OHIF docs, accessed March 30, 2026, [[https://docs.ohif.org/configuration/datasources/dicom-web/]{.underline}](https://docs.ohif.org/configuration/datasources/dicom-web/)

43. How to connect OHIF Viewer with Orthanc - Open Health Imaging Foundation, accessed March 30, 2026, [[https://community.ohif.org/t/how-to-connect-ohif-viewer-with-orthanc/1769]{.underline}](https://community.ohif.org/t/how-to-connect-ohif-viewer-with-orthanc/1769)

44. Advanced authorization plugin --- Orthanc Book documentation, accessed March 30, 2026, [[https://orthanc.uclouvain.be/book/plugins/authorization.html]{.underline}](https://orthanc.uclouvain.be/book/plugins/authorization.html)

45. User Account Control - OHIF, accessed March 30, 2026, [[https://v2.docs.ohif.org/deployment/recipes/user-account-control/]{.underline}](https://v2.docs.ohif.org/deployment/recipes/user-account-control/)

46. GitHub - orthanc-team/orthanc-auth-service: Web service to run next to orthanc to handle sharing of studies, accessed March 30, 2026, [[https://github.com/orthanc-team/orthanc-auth-service]{.underline}](https://github.com/orthanc-team/orthanc-auth-service)

47. Advanced authorization plugin --- Orthanc Book documentation, accessed March 30, 2026, [[https://orthanc.uclouvain.be/book/plugins/authorization.html?highlight=checkedlevel]{.underline}](https://orthanc.uclouvain.be/book/plugins/authorization.html?highlight=checkedlevel)

48. JSON Web Token (JWT) \| Supabase Docs, accessed March 30, 2026, [[https://supabase.com/docs/guides/auth/jwts]{.underline}](https://supabase.com/docs/guides/auth/jwts)

49. Fine-grained Access Control for an Online Medical Records Portal with Next.js, Permit.io ReBAC, and Firebase \| by Divineoffishal \| Medium, accessed March 30, 2026, [[https://medium.com/@divineoffishal/fine-grained-access-control-for-an-online-medical-records-portal-with-next-js-c535594123a9]{.underline}](https://medium.com/@divineoffishal/fine-grained-access-control-for-an-online-medical-records-portal-with-next-js-c535594123a9)

50. Question about usage of the Advanced authorization plugin - General - Orthanc Users, accessed March 30, 2026, [[https://discourse.orthanc-server.org/t/question-about-usage-of-the-advanced-authorization-plugin/3445]{.underline}](https://discourse.orthanc-server.org/t/question-about-usage-of-the-advanced-authorization-plugin/3445)

51. Python plugin for Orthanc, accessed March 30, 2026, [[https://orthanc.uclouvain.be/book/plugins/python.html]{.underline}](https://orthanc.uclouvain.be/book/plugins/python.html)

52. Logging all StudyId and StudyUID of all incoming studies to Postgresql db using Orthanc Python plugin, accessed March 30, 2026, [[https://discourse.orthanc-server.org/t/logging-all-studyid-and-studyuid-of-all-incoming-studies-to-postgresql-db-using-orthanc-python-plugin/2991]{.underline}](https://discourse.orthanc-server.org/t/logging-all-studyid-and-studyuid-of-all-incoming-studies-to-postgresql-db-using-orthanc-python-plugin/2991)

53. Auto routing with OnStableStudy - Google Groups, accessed March 30, 2026, [[https://groups.google.com/g/orthanc-users/c/GuFqiZtkwtg/m/PGu2fM5LCAAJ]{.underline}](https://groups.google.com/g/orthanc-users/c/GuFqiZtkwtg/m/PGu2fM5LCAAJ)

54. Collection of Orthanc Plugin scripts written in Python - adding miscellaneous functionality/utility · GitHub, accessed March 30, 2026, [[https://github.com/mohannadhussain/orthanc-plugin-scripts]{.underline}](https://github.com/mohannadhussain/orthanc-plugin-scripts)

55. orthanc-plugin-scripts/orthanc-dicom-router.py at main - GitHub, accessed March 30, 2026, [[https://github.com/mohannadhussain/orthanc-plugin-scripts/blob/main/orthanc-dicom-router.py]{.underline}](https://github.com/mohannadhussain/orthanc-plugin-scripts/blob/main/orthanc-dicom-router.py)

56. Part 1: Python and DICOM: Two easy tools to save time and energy when working with medical images for data analysis \| by Brian Mark Anderson, PhD \| Medium, accessed March 30, 2026, [[https://medium.com/@markba122/part-1-python-and-dicom-two-easy-tools-to-save-time-and-energy-when-working-with-medical-images-b71a3e2e2800]{.underline}](https://medium.com/@markba122/part-1-python-and-dicom-two-easy-tools-to-save-time-and-energy-when-working-with-medical-images-b71a3e2e2800)

57. routing images to another modality - Google Groups archive - Orthanc Users, accessed March 30, 2026, [[https://discourse.orthanc-server.org/t/routing-images-to-another-modality/1854]{.underline}](https://discourse.orthanc-server.org/t/routing-images-to-another-modality/1854)

58. HL7 vs FHIR: Complete Comparison for Healthcare Developers - Taction Software, accessed March 30, 2026, [[https://www.tactionsoft.com/blog/hl7-vs-fhir-complete-comparison-healthcare-developers/]{.underline}](https://www.tactionsoft.com/blog/hl7-vs-fhir-complete-comparison-healthcare-developers/)

59. A Breakdown of Common HL7 Message Types in Healthcare --- Examples Included - Ritten, accessed March 30, 2026, [[https://www.ritten.io/post/hl7-message-types]{.underline}](https://www.ritten.io/post/hl7-message-types)

60. HL7 Messages - Rhapsody Health, accessed March 30, 2026, [[https://rhapsody.health/resources/hl7-messages/]{.underline}](https://rhapsody.health/resources/hl7-messages/)

61. Understanding Basic HL7 Interfaces for Effective Health Information Exchange - Data InterOps, accessed March 30, 2026, [[https://www.datainterops.com/post/basic-hl7-interfaces]{.underline}](https://www.datainterops.com/post/basic-hl7-interfaces)

62. Understanding HL7 Message Types - iNTERFACEWARE, accessed March 30, 2026, [[https://www.interfaceware.com/hl7-message-types]{.underline}](https://www.interfaceware.com/hl7-message-types)

63. ORM vs ORU: HL7 Messaging Guide for Healthcare Integration - Lifepoint Informatics, accessed March 30, 2026, [[https://lifepoint.com/orm-vs-oru-hl7-messaging-guide-for-healthcare-integration/]{.underline}](https://lifepoint.com/orm-vs-oru-hl7-messaging-guide-for-healthcare-integration/)

64. HL7 Integration Guide, Comparing HL7, FHIR, CDA - Emorphis Health, accessed March 30, 2026, [[https://emorphis.health/blogs/hl7-integration-vs-fhir-vs-cda/]{.underline}](https://emorphis.health/blogs/hl7-integration-vs-fhir-vs-cda/)

65. FHIR vs. HL7: Key Differences Explained for Healthcare Interoperability - Rhapsody Health, accessed March 30, 2026, [[https://rhapsody.health/blog/fhir-vs-hl7-explained/]{.underline}](https://rhapsody.health/blog/fhir-vs-hl7-explained/)

66. Comparing HL7 vs FHIR Standards to Enhance Interoperability in Healthcare - SPsoft, accessed March 30, 2026, [[https://spsoft.com/tech-insights/comparing-hl7-vs-fhir/]{.underline}](https://spsoft.com/tech-insights/comparing-hl7-vs-fhir/)

67. HL7 vs FHIR: Key Differences, Use Cases & Benefits - Vorro, accessed March 30, 2026, [[https://vorro.net/healthcare-interoperability-explained-hl7-vs-fhir/]{.underline}](https://vorro.net/healthcare-interoperability-explained-hl7-vs-fhir/)

68. Best node/python library to receive, parse and acknowledge HL7v2 ADT messages? : r/HL7, accessed March 30, 2026, [[https://www.reddit.com/r/HL7/comments/i18x2p/best_nodepython_library_to_receive_parse_and/]{.underline}](https://www.reddit.com/r/HL7/comments/i18x2p/best_nodepython_library_to_receive_parse_and/)

69. Estándares \| Argentina.gob.ar, accessed March 30, 2026, [[https://www.argentina.gob.ar/salud/digital/estandares]{.underline}](https://www.argentina.gob.ar/salud/digital/estandares)

70. Intercambio de datos - Ayuda en línea SISA - Sistema Integrado de Información Sanitaria Argentino, accessed March 30, 2026, [[https://sisa.msal.gov.ar/sisadoc/docs/0102/compo_intercambio.jsp]{.underline}](https://sisa.msal.gov.ar/sisadoc/docs/0102/compo_intercambio.jsp)

71. Mirth Connect Explained: Architecture & HL7 Standards - IntuitionLabs, accessed March 30, 2026, [[https://intuitionlabs.ai/articles/mirth-connect-architecture-integration-engine-guide]{.underline}](https://intuitionlabs.ai/articles/mirth-connect-architecture-integration-engine-guide)

72. crs4/hl7apy: Python library to parse, create and handle HL7 v2 messages. - GitHub, accessed March 30, 2026, [[https://github.com/crs4/hl7apy]{.underline}](https://github.com/crs4/hl7apy)

73. Data migration - Philips, accessed March 30, 2026, [[https://www.philips.com/c-dam/b2bhc/master/landing-pages/carestream/enterprise-imaging-platform/brochures/2019-Philips_Healthcare_Information_Solutions-Data_Migration_Whitepaper-HR.pdf]{.underline}](https://www.philips.com/c-dam/b2bhc/master/landing-pages/carestream/enterprise-imaging-platform/brochures/2019-Philips_Healthcare_Information_Solutions-Data_Migration_Whitepaper-HR.pdf)

74. DICOM data migration for PACS transition: procedure and pitfalls - PubMed, accessed March 30, 2026, [[https://pubmed.ncbi.nlm.nih.gov/25346024/]{.underline}](https://pubmed.ncbi.nlm.nih.gov/25346024/)

75. Philips Vue PACS - VA.gov, accessed March 30, 2026, [[https://www.oit.va.gov/services/trm/ToolPage.aspx?tid=9705]{.underline}](https://www.oit.va.gov/services/trm/ToolPage.aspx?tid=9705)

76. PACS migration steps : r/PACSAdmin - Reddit, accessed March 30, 2026, [[https://www.reddit.com/r/PACSAdmin/comments/1nvvjmq/pacs_migration_steps/]{.underline}](https://www.reddit.com/r/PACSAdmin/comments/1nvvjmq/pacs_migration_steps/)

77. Carestream Vue Pacs client issue : r/PACSAdmin - Reddit, accessed March 30, 2026, [[https://www.reddit.com/r/PACSAdmin/comments/19fitq4/carestream_vue_pacs_client_issue/]{.underline}](https://www.reddit.com/r/PACSAdmin/comments/19fitq4/carestream_vue_pacs_client_issue/)

78. DICOM Image Transfer : r/PACSAdmin - Reddit, accessed March 30, 2026, [[https://www.reddit.com/r/PACSAdmin/comments/16n7302/dicom_image_transfer/]{.underline}](https://www.reddit.com/r/PACSAdmin/comments/16n7302/dicom_image_transfer/)

79. Vue PACS 12.2.8 - Philips, accessed March 30, 2026, [[https://www.documents.philips.com/assets/Conformance%20Statements/20240227/2487af8d70ea49e4853cb12300b0e290.pdf]{.underline}](https://www.documents.philips.com/assets/Conformance%20Statements/20240227/2487af8d70ea49e4853cb12300b0e290.pdf)

80. 10 questions IT managers ask when migrating medical data - Philips, accessed March 30, 2026, [[https://www.documents.philips.com/assets/20231108/84a76f60cbf74ed1b3cab0b401078465.pdf]{.underline}](https://www.documents.philips.com/assets/20231108/84a76f60cbf74ed1b3cab0b401078465.pdf)

81. Help - Is there a way to manually export studies out of one PACS and import it into another?, accessed March 30, 2026, [[https://www.reddit.com/r/PACSAdmin/comments/1gh7bpp/help_is_there_a_way_to_manually_export_studies/]{.underline}](https://www.reddit.com/r/PACSAdmin/comments/1gh7bpp/help_is_there_a_way_to_manually_export_studies/)

82. Vue PACS Client, accessed March 30, 2026, [[https://pacshub.rimarad.com/help/en_US/webHelp/8G7607_OLH_CARESTREAM_Vue_PACS_Client_en.pdf]{.underline}](https://pacshub.rimarad.com/help/en_US/webHelp/8G7607_OLH_CARESTREAM_Vue_PACS_Client_en.pdf)

83. Exporting DICOM Data - InteleViewer, accessed March 30, 2026, [[https://inteleviewer.documentation.intelerad.com/iv-help/PACS-5-4-1-P2/en/Content/Topics/IV_Saving_DICOMData_Exporting.html]{.underline}](https://inteleviewer.documentation.intelerad.com/iv-help/PACS-5-4-1-P2/en/Content/Topics/IV_Saving_DICOMData_Exporting.html)

84. I\'m building a simple, open PACS alternative for low-resource hospitals. What\'s the #1 thing that bugs you about your current system? : r/PACSAdmin - Reddit, accessed March 30, 2026, [[https://www.reddit.com/r/PACSAdmin/comments/1jv0965/im_building_a_simple_open_pacs_alternative_for/]{.underline}](https://www.reddit.com/r/PACSAdmin/comments/1jv0965/im_building_a_simple_open_pacs_alternative_for/)

85. 10 DICOM Troubleshooting Steps: How to fix Send to PACS errors, accessed March 30, 2026, [[https://pacsbootcamp.com/10-dicom-troubleshooting-steps-how-to-fix-send-to-pacs-errors/]{.underline}](https://pacsbootcamp.com/10-dicom-troubleshooting-steps-how-to-fix-send-to-pacs-errors/)

86. TEXTO ACTUALIZADO - LEY 25326 - HABEAS DATA \| Argentina.gob.ar, accessed March 30, 2026, [[https://www.argentina.gob.ar/normativa/nacional/64790/actualizacion]{.underline}](https://www.argentina.gob.ar/normativa/nacional/64790/actualizacion)

87. Health data protection: the challenge of legislative harmonization in Latin America - PMC, accessed March 30, 2026, [[https://pmc.ncbi.nlm.nih.gov/articles/PMC11349313/]{.underline}](https://pmc.ncbi.nlm.nih.gov/articles/PMC11349313/)

88. Next.js for Secure HIPAA-Compliant Healthcare Platforms - Shiv Technolabs, accessed March 30, 2026, [[https://shivlab.com/blog/nextjs-hipaa-compliant-healthcare-platform-development/]{.underline}](https://shivlab.com/blog/nextjs-hipaa-compliant-healthcare-platform-development/)

89. Nomenclador de Prácticas Médicas Febrero 2026 - PAMI, accessed March 30, 2026, [[https://www.pami.org.ar/pdf/manual_nomenclador.pdf?v=7007]{.underline}](https://www.pami.org.ar/pdf/manual_nomenclador.pdf?v=7007)

90. Deployment and Evaluation of Intelligent DICOM Viewers in Low-Resource Settings: Orthanc Plugin for Semi-automated Interpretation of Medical Images \| EMI x Z, accessed March 30, 2026, [[https://emi.org.zm/publications/20]{.underline}](https://emi.org.zm/publications/20)

91. Highdicom: a Python Library for Standardized Encoding of Image Annotations and Machine Learning Model Outputs in Pathology and Radiology - PMC, accessed March 30, 2026, [[https://pmc.ncbi.nlm.nih.gov/articles/PMC9712874/]{.underline}](https://pmc.ncbi.nlm.nih.gov/articles/PMC9712874/)
