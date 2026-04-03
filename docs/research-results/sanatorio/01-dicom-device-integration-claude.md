# Guía técnica completa: integración de dispositivos médicos con software web

**Orthanc + OHIF reemplazan un PACS Philips Vue roto en 2-4 semanas por menos de USD 3.500 en hardware.** Para un desarrollador construyendo un sistema de gestión de sanatorio en Argentina con Next.js + Supabase, la estrategia ganadora no es construir un PACS desde cero sino orquestar componentes open-source maduros. DICOM es un estándar enormemente complejo (más de 4.100 páginas), pero el 80% del valor práctico se obtiene dominando apenas el 20% del protocolo: C-STORE para recibir imágenes, la API REST de Orthanc para metadatos, y OHIF para visualización web. Este documento cubre desde los fundamentos del protocolo hasta un plan de acción priorizado semana por semana.

---

## 1. Fundamentos del protocolo DICOM: el idioma universal de la imagen médica

### Qué es DICOM y qué problema resuelve

DICOM (Digital Imaging and Communications in Medicine) es el estándar internacional (ISO 12052:2017) que define tanto el **formato de archivo** como el **protocolo de red** para imágenes médicas. Antes de DICOM, cada fabricante — Philips, Siemens, GE — usaba formatos propietarios incompatibles: un tomógrafo de una marca no podía enviar imágenes a un PACS de otra. DICOM eliminó esa torre de Babel.

El estándar nació en 1983 como una iniciativa del American College of Radiology (ACR) y NEMA. La versión 1.0 (1985) definía una conexión punto a punto por cable dedicado. La revolución llegó con **DICOM 3.0 en 1993**, que introdujo soporte TCP/IP, un modelo orientado a objetos, y el formato de archivo actual. Hoy el estándar tiene **~22 partes y más de 4.100 páginas**, mantenido por el DICOM Standards Committee con actualizaciones continuas.

Los tres pilares que lo hacen indispensable son: calidad diagnóstica excepcional (soporte de hasta **65.536 niveles de escala de grises** versus 256 en JPEG), codificación completa de metadatos clínicos (más de **2.000 atributos estandarizados**), y declaraciones formales de conformidad que permiten verificar interoperabilidad antes de comprar un equipo.

### El modelo de datos: Patient → Study → Series → Instance

DICOM organiza toda la información en una jerarquía de cuatro niveles:

```
PATIENT (Paciente) ─── Patient ID (0010,0020)
  └── STUDY (Estudio) ─── Study Instance UID (0020,000D)
        └── SERIES (Serie) ─── Series Instance UID (0020,000E)
              └── INSTANCE (Instancia/Imagen) ─── SOP Instance UID (0008,0018)
```

Un **paciente** tiene uno o más **estudios** (un estudio = un examen completo, por ejemplo "CT de tórax del 15/03/2026"). Cada estudio contiene una o más **series** (en MRI: secuencia T1, T2, FLAIR). Cada serie contiene una o más **instancias** — cada instancia es un archivo .dcm individual, un corte o frame.

Cada tipo de objeto se identifica con un **SOP Class UID** único. Algunos ejemplos concretos:

- CT Image Storage: `1.2.840.10008.5.1.4.1.1.2`
- MR Image Storage: `1.2.840.10008.5.1.4.1.1.4`
- US Image Storage: `1.2.840.10008.5.1.4.1.1.6.1`
- Modality Worklist: `1.2.840.10008.5.1.4.31`

### Anatomía de un archivo .dcm

Un archivo DICOM tiene esta estructura interna:

```
[128 bytes Preámbulo]     ← puede estar vacío (0x00)
[4 bytes "DICM"]          ← identifica el archivo como DICOM
[File Meta Information]   ← SIEMPRE en Explicit VR Little Endian
  (0002,0010) Transfer Syntax UID  ← CLAVE: define codificación del resto
[Data Set]                ← codificado según el Transfer Syntax
  Atributos de paciente, estudio, serie, imagen...
  (7FE0,0010) Pixel Data ← datos binarios de la imagen
```

Cada elemento de datos tiene un **Tag** (grupo,elemento), un **Value Representation** (tipo de dato: AE, DA, PN, UI, etc. — 27 tipos en total), longitud, y valor. Las **Transfer Syntaxes** más importantes son:

| Transfer Syntax | Uso |
|---|---|
| Implicit VR Little Endian | Default obligatorio en toda implementación |
| Explicit VR Little Endian | El más usado en la práctica |
| JPEG Lossless | Sin pérdida, compresión ~2:1 |
| JPEG 2000 Lossless | Mejor ratio de compresión sin pérdida |
| JPEG 2000 Lossy | Con pérdida, descompresión progresiva |

### Protocolo de red: cómo dos dispositivos se hablan

DICOM opera sobre TCP/IP con puertos estándar: **puerto 104** (well-known, requiere privilegios root) y **puerto 11112** (registered, recomendado para uso general). Cada dispositivo se identifica con tres datos: **AE Title** (identificador alfanumérico de hasta 16 caracteres), **dirección IP** y **puerto TCP**.

Los roles son SCU (Service Class User = cliente) y SCP (Service Class Provider = servidor). Un dispositivo puede cambiar de rol según la operación.

**Ejemplo concreto paso a paso** — un tomógrafo (AE="CT_SCAN", IP=192.168.1.10) envía imágenes al PACS (AE="PACS_MAIN", IP=192.168.1.50:11112):

```
1. CT abre conexión TCP a 192.168.1.50:11112
2. CT → A-ASSOCIATE-RQ
     (Calling AE: CT_SCAN, Called AE: PACS_MAIN,
      Presentation Context: CT Image Storage +
      Transfer Syntaxes [Implicit VR LE, Explicit VR LE])
3. PACS → A-ASSOCIATE-AC (acepta Explicit VR LE)
4. CT → C-ECHO-RQ → PACS responde C-ECHO-RSP (Status 0x0000 = OK)
5. Por cada imagen:
     CT → C-STORE-RQ + Dataset
     PACS → C-STORE-RSP (Status 0x0000)
6. CT → A-RELEASE-RQ → PACS → A-RELEASE-RP
7. Conexión TCP cerrada
```

La **negociación de asociación** (paso 2-3) es donde se acuerda qué SOP Classes y Transfer Syntaxes se van a usar. Si no hay coincidencia, la conexión se rechaza. Este es el punto donde fallan la mayoría de las integraciones en la práctica.

---

## 2. Servicios DICOM esenciales: C-STORE, C-FIND, C-MOVE, MWL, MPPS

### C-STORE: el push de imágenes del equipo al servidor

C-STORE es el servicio más fundamental — es el mecanismo por el cual las modalidades (CT, ecógrafo, rayos X) envían imágenes al PACS. Funciona como modelo **push**: el equipo empuja cada imagen al servidor.

El flujo es directo: se establece la asociación, y por cada imagen el SCU envía un C-STORE-RQ con el dataset completo (metadatos + píxeles). El SCP responde con Status 0x0000 si la recibió correctamente. **Punto crítico:** C-STORE confirma *recepción* pero NO garantiza almacenamiento permanente seguro — para eso existe Storage Commitment.

### C-FIND: buscar estudios en el PACS

C-FIND permite consultar la base de datos del PACS, similar a un SELECT con WHERE en SQL. Se definen **query levels** (Patient, Study, Series, Image) y **matching keys** con soporte de wildcard ("GAR*"), rangos de fecha ("20260101-20260330"), y coincidencia exacta. El SCP responde con múltiples C-FIND-RSP (uno por resultado, Status Pending 0xFF00) y un RSP final con Status Success 0x0000.

### C-MOVE vs C-GET: recuperar imágenes

**C-MOVE** (usado en el 99% de los casos) funciona así: el SCU le dice al PACS "enviá estas imágenes al AE Title X". El PACS abre una **nueva asociación** como C-STORE SCU hacia el destino. Requiere que el PACS tenga una tabla de AE Title → IP:Puerto del destino. Soporta enviar a un tercer dispositivo.

**C-GET** devuelve las imágenes en la misma asociación (sin abrir una nueva), lo que evita problemas de firewall, pero está poco implementado en PACS comerciales y no soporta envío a terceros.

### Modality Worklist: el sistema le dice al equipo quién es el paciente

MWL es quizás el servicio más importante para la experiencia del usuario clínico. Permite que los equipos de imagen consulten datos del paciente y detalles del estudio **antes de realizar el examen**, eliminando la entrada manual de datos.

**Ejemplo completo: un médico ordena una ecografía abdominal**

```
PASO 1 — ORDEN MÉDICA:
  El médico ordena "Ecografía abdominal" para María García (ID: 12345678)

PASO 2 — SISTEMA CREA ENTRADA EN WORKLIST:
  El HIS/RIS registra: Patient Name, ID, Accession Number,
  Scheduled AE Title: US_SALA3, Modality: US,
  Scheduled Date/Time: 20260330/1430

PASO 3 — TÉCNICO EN EL ECÓGRAFO:
  El técnico selecciona "Consultar Worklist" en el ecógrafo

PASO 4 — ECÓGRAFO CONSULTA MWL (C-FIND):
  Ecógrafo (SCU) → RIS/MWL Server (SCP):
  C-FIND-RQ con criterios:
    Scheduled Station AE Title: "US_SALA3"
    Scheduled Date: "20260330"
    Modality: "US"

PASO 5 — RESPUESTA DEL MWL SERVER:
  C-FIND-RSP con datos:
    Patient Name: GARCIA^MARIA
    Patient ID: 12345678
    Accession Number: ACC-2026-4521
    Study Description: Ecografía abdominal
    Study Instance UID: 1.2.826.0.1.3680043...

PASO 6 — TÉCNICO SELECCIONA PACIENTE:
  Ve "GARCIA, MARIA — Ecografía abdominal" en pantalla
  Los datos se auto-populan en TODAS las imágenes generadas

PASO 7 — ADQUISICIÓN + ENVÍO:
  El técnico realiza la ecografía. Las imágenes heredan
  automáticamente Patient Name, ID, Study UID, Accession Number.
  Se envían al PACS via C-STORE con metadatos consistentes.
```

**MWL funciona solo como pull** — la modalidad consulta al SCP por polling. No hay mecanismo para que el servidor envíe datos proactivamente.

### MPPS: el equipo reporta "estudio completado"

MPPS (Modality Performed Procedure Step) es el complemento de MWL. Usa dos comandos: **N-CREATE** (cuando el técnico inicia el estudio, status "IN PROGRESS") y **N-SET** (cuando termina, status "COMPLETED" o "DISCONTINUED" si se abortó). Informa al RIS qué se hizo realmente versus lo planificado, cuántas imágenes se generaron, quién fue el técnico, y la dosis de radiación si aplica. Esto permite al RIS actualizar el estado del estudio y disparar el flujo de informe radiológico.

### Storage Commitment: la garantía de almacenamiento seguro

Después de enviar imágenes con C-STORE (que solo confirma recepción), la modalidad puede pedir al PACS via **N-ACTION** que confirme almacenamiento seguro de un conjunto de instancias. El PACS verifica internamente (puede tomar desde milisegundos hasta horas) y responde con **N-EVENT-REPORT**. Recién después de esta confirmación, la modalidad puede borrar sus copias locales con seguridad.

---

## 3. Conectividad física: de cables dedicados a Ethernet moderna

### Las tres eras de la conexión DICOM

| Era | Año | Conexión | Detalle |
|---|---|---|---|
| ACR-NEMA 1.0 | 1985 | Punto a punto | Hardware dedicado, sin red |
| ACR-NEMA 2.0 | 1988 | Cable EIA-485 | 2 pares dedicados, necesitaba NIU para red |
| DICOM 3.0 | 1993+ | **TCP/IP (Ethernet)** | Estándar actual, red LAN/WAN |

Hoy, **todo equipo DICOM moderno se conecta por Ethernet (cable RJ-45, Cat5e/Cat6)** a la red local de la clínica. Se usa TCP/IP estándar, típicamente a 1 Gbps. Para enlaces troncales o entre edificios se usa fibra óptica.

### El misterio del "cable telefónico" RJ11

El conector RJ11 **no es un estándar DICOM** de ninguna versión. Sin embargo, algunos equipos antiguos (ecógrafos, electrocardiógrafos) tenían puertos RS-232 serial con conector físico RJ11 — el fabricante usaba el conector telefónico por ser más pequeño que un DB-9, aprovechando el cableado telefónico existente en edificios. **No se debe conectar a una línea telefónica** — porta señales RS-232 seriales. Existen cables comerciales "DB9 a RJ11" para este propósito.

### Configuración típica de red DICOM en una clínica

La mejor práctica es segmentar la red en VLANs:

```
INTERNET (VPN/TLS)
        │
   [Firewall Principal]
        │
   [Switch Core L3] ─── [Servidor PACS (Orthanc)]
    /    |    \                │
VLAN 10  VLAN 20  VLAN 30  [NAS Storage]
Modalid. PACS Srv  Viewers
  │        │         │
[CT]    [Backup]  [Estaciones radiología]
[MRI]             [Consultorios web]
[US]
[DR/CR]
```

Cada equipo DICOM se configura con tres parámetros: **AE Title** (ej: "CT_SIEMENS_01"), **IP fija** (nunca DHCP dinámico para modalidades) y **puerto TCP**. En el PACS se registra el AE Title, IP y puerto de cada equipo. El primer test siempre es un **C-ECHO** (ping DICOM) para verificar conectividad bidireccional.

### El Conformance Statement: leerlo antes de comprar

El **DICOM Conformance Statement** es un documento técnico obligatorio que todo fabricante debe proveer. Lista exactamente qué SOP Classes soporta, en qué roles (SCU/SCP), con qué Transfer Syntaxes, y qué servicios DIMSE implementa. **Dos equipos "DICOM conformant" pueden no comunicarse** si no comparten las mismas SOP Classes o Transfer Syntaxes. Antes de comprar cualquier equipo, se deben comparar los Conformance Statements del equipo nuevo y del PACS existente. Un equipo sin Conformance Statement es una señal de alarma.

---

## 4. Cuánto pesan las imágenes: tamaños por modalidad y cálculo de almacenamiento

### Tabla de referencia por modalidad

| Modalidad | Tamaño típico/estudio | Imágenes/estudio | Notas |
|---|---|---|---|
| **Ecografía** | 30-80 MB | 20-100 imágenes + clips video | Clips de 30s ≈ 5 MB; 3D/4D genera más |
| **Radiografía (CR/DR)** | 10-40 MB | 1-4 vistas | Una placa de tórax ≈ 30 MB sin comprimir |
| **Tomografía (CT)** | 150-500 MB | 100-3.000+ cortes | CT con contraste duplica/triplica volumen |
| **Resonancia (MRI)** | 150-400 MB | 150-2.000+ imágenes | 5-15 secuencias por estudio |
| **Mamografía (FFDM)** | 50-120 MB | 4 vistas estándar | Resolución 3328×4096 a 14 bits |
| **Tomosíntesis (DBT)** | 450 MB - 3 GB | 25 proyecciones/vista + reconstrucciones | 10-20× mayor que FFDM 2D |

**CT consume aproximadamente el 50% del almacenamiento total** de un departamento de radiología, seguido por mamografía (~15%), CR (~15%) y MRI (~15%).

### Cálculo para una clínica mediana argentina

Asumiendo 300 días laborables/año con el siguiente volumen:

| Modalidad | Volumen | Estudios/año | Tamaño típico | Total anual |
|---|---|---|---|---|
| Ecografía | 25/día | 7.500 | 50 MB | 375 GB |
| Radiografía | 30/día | 9.000 | 20 MB | 180 GB |
| CT | 15/semana | 750 | 300 MB | 225 GB |
| MRI | 10/semana | 500 | 250 MB | 125 GB |
| Mamografía FFDM | 12/día | 3.000 | 80 MB | 240 GB |
| **Total sin comprimir** | | **20.750** | | **~1,15 TB** |
| **Con compresión lossless (2.5:1)** | | | | **~450 GB** |

Para 5 años con overhead de sistema, RAID y crecimiento anual del 10-15%, se recomienda provisionar **~4 TB** de almacenamiento. Con tomosíntesis mamaria, subir a **~7 TB**. El costo de discos enterprise (NAS/SAN) oscila entre **USD 200-500 por TB**.

---

## 5. DICOM en la web: DICOMweb, OHIF y Orthanc como columna vertebral

### DICOMweb: DICOM habla HTTP

DICOMweb (DICOM PS3.18) es la familia de servicios RESTful que permite trabajar con objetos DICOM sobre HTTP estándar. Son tres servicios clave:

- **QIDO-RS** (Query): `GET /studies?PatientName=Garcia*&StudyDate=20260301-` → JSON con lista de estudios (equivalente a C-FIND)
- **WADO-RS** (Retrieve): `GET /studies/{UID}/series/{UID}/instances/{UID}` → archivo DICOM binario, metadata JSON, o imagen renderizada JPEG/PNG (equivalente a C-MOVE/C-GET)
- **STOW-RS** (Store): `POST /studies` con body `multipart/related` conteniendo objetos DICOM → almacena imágenes (equivalente a C-STORE)

La diferencia fundamental: DICOM DIMSE usa un protocolo binario propietario sobre TCP que requiere negociación de asociación y bibliotecas especializadas. DICOMweb usa **HTTP/HTTPS estándar** que cualquier cliente HTTP puede consumir, con JSON, paginación, y compatibilidad nativa con proxies, CDNs y load balancers.

### Next.js NO puede hablar con equipos DICOM directamente

Una aplicación Next.js necesita un **servidor DICOM intermedio** (middleware) porque los equipos médicos hablan protocolo DIMSE binario sobre TCP, no HTTP. La arquitectura correcta es:

```
┌──────────────────────────────────────────────────────┐
│              RED HOSPITALARIA (VLAN)                   │
│                                                       │
│  CT ──┐                                               │
│  MRI ─┤ DIMSE C-STORE    ┌───────────────────┐       │
│  US ──┼────────────────►  │  ORTHANC SERVER   │       │
│  DR ──┘  (puerto 4242)   │  DICOM DIMSE SCP  │       │
│                          │  REST API (:8042)  │       │
│                          │  Plugin DICOMweb   │       │
│                          └────────┬──────────┘       │
└───────────────────────────────────┼──────────────────┘
                                    │ DICOMweb (HTTPS)
                                    │ QIDO-RS / WADO-RS
                                    ▼
┌───────────────────────────────────────────────────────┐
│              APLICACIÓN WEB                            │
│                                                       │
│  ┌─────────────────────────────────────────────┐      │
│  │           NEXT.JS APPLICATION                │      │
│  │  API Routes:                                 │      │
│  │  /api/studies → proxy a Orthanc QIDO-RS      │      │
│  │  /api/webhooks/orthanc → nuevo estudio       │      │
│  │                                              │      │
│  │  Frontend React:                             │      │
│  │  - Lista de estudios (datos de Supabase)     │      │
│  │  - OHIF Viewer (iframe con DICOMweb)         │      │
│  └──────────────┬──────────────────────────────┘      │
│                 │                                     │
│  ┌──────────────▼──────────────────────────────┐      │
│  │           SUPABASE                           │      │
│  │  PostgreSQL: metadatos, pacientes, turnos    │      │
│  │  Auth: usuarios, roles, SSO                  │      │
│  │  RLS: control acceso por doctor/institución  │      │
│  │  Realtime: notificaciones nuevos estudios    │      │
│  │  Storage: PDFs, reportes, capturas           │      │
│  └──────────────────────────────────────────────┘      │
└───────────────────────────────────────────────────────┘
```

**Supabase almacena metadatos de la aplicación** (pacientes, turnos, asignaciones, reportes, permisos) en PostgreSQL con RLS. Los **archivos DICOM binarios viven en Orthanc**. Next.js los une: consulta Supabase para la lógica de negocio y Orthanc para las imágenes.

### OHIF Viewer: visor web DICOM zero-footprint

OHIF es el visor web de imágenes médicas open-source más popular (licencia MIT, 4.000+ stars en GitHub). Es una Progressive Web App construida en React sobre **Cornerstone3D** con renderizado GPU (WebGL) y decodificación multi-hilo (WebAssembly).

Capacidades: visualización 2D/3D, MPR, MIP, herramientas de medición (longitud, ángulo, área elíptica), anotaciones, segmentación, fusión PET/CT, hanging protocols configurables, y soporte de prácticamente todas las modalidades (CT, MRI, US, mamografía, PET, microscopía WSI).

**Integración con Next.js** — la estrategia más recomendada por el equipo OHIF es via **iframe**:

```javascript
// En Next.js: construir OHIF, copiar a public/ohif/
<iframe
  src={`/ohif/viewer?StudyInstanceUIDs=${studyUID}`}
  style={{ width: '100%', height: '100vh' }}
/>
// Comunicación bidireccional via window.postMessage()
```

OHIF se configura para consumir DICOMweb del Orthanc local:

```javascript
// Configuración OHIF → Orthanc
dataSources: [{
  namespace: '@ohif/extension-default.dataSourcesModule.dicomweb',
  configuration: {
    friendlyName: 'Orthanc',
    qidoRoot: 'http://localhost:8042/dicom-web',
    wadoRoot: 'http://localhost:8042/dicom-web',
    wadoUriRoot: 'http://localhost:8042/wado',
  }
}]
```

### Orthanc: el PACS open-source ideal para equipos chicos

Orthanc es un servidor DICOM ligero, independiente y open-source (GPLv3) escrito en C++ por la Universidad Católica de Lovaina. Funciona desde una Raspberry Pi hasta infraestructura cloud. Su API REST tiene **258+ endpoints** documentados con OpenAPI.

Capacidades DICOM DIMSE: C-STORE, C-FIND, C-MOVE, C-GET, C-ECHO como SCP y SCU. Plugins esenciales: **DICOMweb** (AGPL) para WADO-RS/QIDO-RS/STOW-RS, **PostgreSQL** para reemplazar SQLite en producción, **OHIF** para visor web integrado, y scripts Python/Lua para automatización.

**¿Cuándo elegir dcm4chee en vez de Orthanc?** Solo en hospitales grandes con departamento IT dedicado que necesiten HL7 nativo, multi-tenancy, y compliance IHE completa. dcm4chee tiene una curva de aprendizaje reportada de **1 semana versus medio día para Orthanc**, y requiere un stack Java/Wildfly/LDAP/Keycloak pesado. Para un sanatorio chico en Argentina, **Orthanc es la elección correcta sin dudas**.

---

## 6. Dispositivos NO-imaging: laboratorio, ECG y monitores

### Analizadores de laboratorio: ASTM y HL7 en la trinchera

Los analizadores de sangre, orina y bioquímica usan un ecosistema de protocolos completamente diferente a DICOM. La comunicación típica tiene dos capas:

**Capa de transporte (ASTM E1381 / LIS01-A2):** Protocolo half-duplex asíncrono que define frames con STX, número de frame, texto (máximo 240 caracteres), ETX/ETB, checksum de 2 bytes, CR y LF. Soporta RS-232 serial y TCP/IP.

**Capa de contenido (ASTM E1394 / LIS02-A2):** Define registros con campos separados por pipe (`|`). Un mensaje típico tiene Header (H), Patient (P), Order (O), Result (R) y Terminator (L):

```
H|\^&|||OCD^VISION^5.13.1|||||||P|LIS2-A|20260330142633
P|1|PID123456||||Garcia^Maria||19850315|F
O|1|SID305||GLUC|N|20260330142136|||||||||SANGRE
R|1|GLUC|95|mg/dL|70-110|N||R||Auto||20260330142229
L|1|N
```

**HL7 v2.x** opera en la capa superior: mensajes ORM (órdenes del HIS al LIS) y ORU (resultados del LIS al HIS). La diferencia clave es que **ASTM es el protocolo directo entre analizador y LIS**, mientras que **HL7 es el protocolo entre LIS y HIS/EMR**.

Los dos modos de comunicación son **Host Query** (bidireccional: el LIS envía la orden al analizador, el analizador devuelve resultados asociados) y **Broadcast** (push: el analizador procesa y transmite resultados sin orden previa). El modo broadcast es más simple pero requiere reconciliación manual.

**Marcas comunes en Argentina:** Wiener Lab (Rosario, la mayor empresa de diagnóstico in vitro de Latinoamérica), Roche, Siemens Healthineers, Abbott, Sysmex, Mindray. La mayoría de analizadores instalados aún usan **RS-232 serial** con configuración 9600/8N1.

**¿Se puede conectar un analizador directamente a un software web?** Técnicamente sí, pero se desaconseja fuertemente para producción. Se necesitaría un servicio backend Node.js leyendo el puerto serial (librería `serialport`) y parseando frames ASTM a JSON. Para producción seria, usar un **middleware como Mirth Connect** (open-source) con extensión ASTM, o el software **COYALab Interfaces** (empresa argentina de Santa Fe, primera certificada TÜV en el país para software de laboratorio).

### Electrocardiógrafos: el caos de formatos

A diferencia de las imágenes donde DICOM es universal, **en ECG no existe un formato único dominante** — se han identificado 39 formatos digitales diferentes. Los estándares principales son SCP-ECG (europeo, muy comprimido), DICOM ECG Waveform (integrable con PACS), HL7 aECG (preferido por FDA para ensayos clínicos), y formatos propietarios de cada fabricante.

En clínicas argentinas económicas predominan **Edan y Contec**. Los modelos económicos (Contec ECG300G, Edan SE-301) solo exportan PDF o formatos propietarios vía USB. La salida estándar DICOM o SCP-ECG es una **opción de compra adicional** disponible solo en gama media-alta. La integración más realista en Argentina es: exportar PDF → guardar en carpeta de red → adjuntar al HIS como archivo. Para integración DICOM nativa se necesitan equipos premium (Nihon Kohden, GE, Philips) con Ethernet.

### Monitores de pacientes: un mundo propietario

Los monitores de cabecera generan dos tipos de datos: **waveforms continuos** (ECG a 250-500 muestras/segundo, pletismografía a 100 Hz — alto volumen) y **signos vitales discretos** (FC, PA, SpO2, temperatura — bajo volumen). La mayoría de las integraciones con HIS/EMR solo transmiten **datos numéricos discretos** vía HL7; los waveforms se manejan dentro del ecosistema propietario del fabricante.

El estándar IEEE 11073 SDC busca unificar este panorama con servicios web y descubrimiento automático de dispositivos, pero está en adopción muy temprana. **En Argentina, prácticamente ningún hospital lo implementa.** La integración real requiere un gateway/middleware especializado (Capsule Technologies, Bernoulli) que traduzca protocolos propietarios a HL7 ORU.

### RS-232 serial: el protocolo que no muere

Muchos equipos en clínicas argentinas tienen 10-20 años y funcionan perfectamente con RS-232. No se reemplazan porque cuestan USD 30.000-100.000+, porque RS-232 es robusto y determinista, y porque cambiar hardware requiere nueva certificación ANMAT.

Para convertir RS-232 a red: **serial device servers Moxa NPort** (estándar de la industria para laboratorios médicos) convierten RS-232 a Ethernet TCP/IP con encriptación SSL. El NPort 6000 soporta hasta 32 dispositivos seriales en una misma IP. Desde Node.js, la librería `serialport` (v13+, MIT, 5.200+ proyectos dependientes en npm) permite leer puertos seriales:

```javascript
const { SerialPort } = require('serialport');
const port = new SerialPort({
  path: '/dev/ttyUSB0',  // o 'COM3' en Windows
  baudRate: 9600, dataBits: 8, parity: 'none', stopBits: 1
});
port.on('data', (data) => {
  // Parsear frame ASTM → JSON → enviar a API REST
});
```

### Tabla resumen de todos los dispositivos NO-imaging

| Dispositivo | Protocolo | Conexión | Patrón | Complejidad | ¿Middleware? |
|---|---|---|---|---|---|
| Analizador bioquímica | ASTM/LIS2-A2, HL7 | RS-232, Ethernet | Bidireccional / Push | **Alta** | **Sí** |
| Analizador hematología | ASTM, HL7 | RS-232, Ethernet | Bidireccional / Push | **Alta** | **Sí** |
| ECG económico | Propietario, PDF | USB, tarjeta SD | Pull manual | Baja | No |
| ECG gama media-alta | SCP-ECG, DICOM | Ethernet, USB | Push / Pull | Media-Alta | Recomendado |
| Monitor de paciente | IEEE 11073 (emergente), HL7, propietario | Ethernet, WiFi | Streaming push | **Alta** | **Sí (gateway)** |
| Oxímetro stand-alone | IEEE 11073 PHD, propietario | USB, Bluetooth | Push periódico | Media | Depende |

---

## 7. La verdad sobre la viabilidad: qué puede hacer un equipo chico y qué no

### Lo construible versus lo que requiere vendors

Un desarrollador solo o equipo de 2-3 personas con Next.js + Supabase **puede construir** la capa de orquestación y UI: gestión de pacientes, turnos/agenda, historia clínica básica, portal de pacientes, dashboard administrativo, e integración con APIs externas. **No debería intentar construir** un PACS desde cero, un visor DICOM con herramientas de medición, integración directa con analizadores de laboratorio sin middleware, ni un motor de facturación completo a obras sociales argentinas.

La facturación a obras sociales merece una advertencia especial: **PAMI tiene su propio Sistema Interactivo de Información** con Orden de Prestación Electrónica y circuito multinivel de autorización; **IOMA tiene su propio portal** con facturación diferenciada por tipo afiliatorio; y cada obra social tiene su propio nomenclador, sistemas y tiempos de pago. El índice de incobrabilidad puede superar el 20%. Para un MVP, registrar prestaciones y generar documentación para facturar manualmente.

### Regulaciones ANMAT que importan

La **Disposición ANMAT 9688/2019** define que el software autónomo (SaMD) que se encuadra como producto médico debe estar inscripto. Sin embargo, **software administrativo** (turnos, facturación, gestión de pacientes) **no necesita registro**. Un visor DICOM que se usa para diagnóstico primario sí necesitaría registro; un visor de referencia/consulta probablemente no. Para el MVP, enfocarse en funcionalidades administrativas que no requieren registro. El PACS server Orthanc es open-source y no se comercializa como producto médico propio. Consultar con asesor regulatorio si se comercializa el sistema como producto.

### La integración DICOM mínima viable: el 20% que da el 80%

```
Paso 1 → Instalar Orthanc (Docker)                      [1-2 días]
Paso 2 → Configurar modalidades C-STORE a Orthanc       [1-2 días/modalidad]
Paso 3 → Desplegar OHIF Viewer (plugin Orthanc)         [2-3 días]
Paso 4 → Conectar Orthanc REST API con Next.js          [1-2 semanas]
```

Con estos 4 pasos se obtiene: almacenamiento DICOM, recepción de imágenes de todas las modalidades, visualización web desde cualquier navegador, y búsqueda de estudios. **Esto es suficiente para reemplazar un Philips Vue PACS básico roto.**

Lo que se pierde versus un PACS comercial (y que un sanatorio chico probablemente no necesita): visualización 3D avanzada con matching volumétrico, hanging protocols sofisticados, herramientas de gestión de lesiones, soporte 24/7 del fabricante, HL7 nativo con HIS/RIS, streaming progresivo optimizado, y certificación regulatoria como dispositivo médico. Para la operación diaria de un sanatorio chico, **estas son funcionalidades "nice-to-have"**.

### Plan de acción semana por semana

**🔴 SEMANA 1-2 — EMERGENCIA (restaurar capacidad de almacenamiento):**

- **Día 1-2:** Instalar Orthanc en Docker sobre Ubuntu Server en PC/servidor existente. Configurar `orthanc.json` con AE Title "ORTHANC", puerto DICOM 4242, puerto HTTP 8042. Habilitar plugin DICOMweb.
- **Día 3-5:** Contactar técnicos de cada modalidad (CT, RX, ecógrafo). En cada equipo configurar: AE Title destino = "ORTHANC", IP del servidor, puerto 4242. Testear C-ECHO y C-STORE.
- **Día 6-10:** Instalar plugin OHIF de Orthanc. Configurar nginx como reverse proxy. Testear visualización desde navegadores de consultorios.
- **Día 10-14:** Validación con radiólogos. Verificar que las imágenes se ven correctamente. Capacitación básica al personal.

**🟡 MES 1-3 — ESTABILIZACIÓN:**

- Semana 3-4: Backup automático, NAS con RAID, scripts nocturnos
- Mes 2: Integración básica con Next.js — listar estudios por paciente, deep links desde historia clínica a OHIF
- Mes 2-3: Plugin PostgreSQL para Orthanc (reemplazar SQLite), monitoreo de salud del servidor

**🟢 MES 4+ — MEJORAS POST-MVP:**

- Migración de datos históricos del Philips Vue (via C-MOVE si el storage es accesible)
- Hanging protocols personalizados en OHIF
- Reporting integrado con dictado IA (Whisper API)
- Worklists DICOM para automatizar flujo radiológico
- Portal de pacientes con acceso a imágenes

**⛔ DIFERIR INDEFINIDAMENTE:** Facturación automatizada a obras sociales, integración directa con analizadores de laboratorio, monitores de pacientes en tiempo real.

### Presupuesto total para el MVP

**Hardware:**

| Componente | Especificación | Costo (USD) |
|---|---|---|
| Servidor | Intel i5/Xeon, 16GB RAM, SSD 256GB | $800-1.500 |
| NAS 4-bay | 4×4TB RAID 5 (~12TB útil) | $800-1.200 |
| UPS 1500VA | Para servidor + NAS | $200-400 |
| Red | Switch gigabit, cableado Cat6 | $200-400 |
| **Total hardware** | | **$2.000-3.500** |

**Software: USD $0** — Orthanc (GPLv3), OHIF (MIT), Ubuntu Server, Docker, PostgreSQL, Next.js (MIT), Supabase (Apache 2.0 self-hosted o ~$25/mes cloud).

**Tiempo:** 6-10 semanas para un PACS funcional completo. La inversión total de **~USD 2.000-3.500 + 3-4 meses de trabajo** se compara con un PACS comercial de **USD 50.000-200.000+** con mantenimiento anual del 15-20%.

### Empresas en Argentina que pueden ayudar

Si se necesita soporte profesional: **Pixeon** (Brasil/Argentina, uno de los mayores de LATAM), **VisualMedica** (PACS/RIS en la nube con IA), **TRC Salud** (Doctoris RIS/PACS), **NUBIX** (PACS cloud en español), **COYALab** (Santa Fe, software LIS + interfaces con analizadores). La comunidad de Orthanc en discourse.orthanc-server.org tiene usuarios activos en LATAM. El soporte comercial oficial de Orthanc lo provee **Osimis S.A.** (Bélgica).

---

## Conclusión: pragmatismo sobre perfeccionismo

La integración de dispositivos médicos con software web es un campo de complejidad asimétrica: **DICOM para imágenes es maduro y bien servido por herramientas open-source**, mientras que los dispositivos no-imaging (laboratorio, ECG, monitores) siguen fragmentados entre protocolos propietarios y legacy serial. Para un desarrollador en Argentina construyendo un sistema de gestión de sanatorio, la estrategia más inteligente es **no reinventar la rueda**: Orthanc como PACS, OHIF como visor, Supabase como base de datos de aplicación, y Next.js como orquestador.

El dato que cambia la ecuación es este: **el stack completo open-source cuesta menos de USD 3.500 en hardware y funciona.** No es un juguete — Orthanc ha sido probado con más de 7 TB de estudios, y OHIF ha servido como base para visores con aprobación FDA. El camino correcto es desplegar primero, estabilizar segundo, y sofisticar tercero. Modality Worklist, MPPS, Storage Commitment, y las integraciones de laboratorio pueden esperar. Lo que no puede esperar es que los médicos vuelvan a ver imágenes en pantalla, y eso se logra en dos semanas.

⚠️ **Items que requieren testing práctico o investigación con el vendor específico:**
- Configuración exacta de AE Title/IP/puerto en cada modalidad instalada (varía por fabricante y modelo)
- Verificación de Conformance Statement de cada equipo contra las SOP Classes que Orthanc soporta
- Test de C-ECHO y C-STORE real con cada modalidad antes de declarar operatividad
- Evaluación del estado del storage del Philips Vue para determinar viabilidad de migración de datos históricos
- Consulta con el representante de Philips sobre posibilidad de C-MOVE masivo del Vue a Orthanc
- Verificación con asesor regulatorio ANMAT sobre clasificación del sistema si se comercializa
- Pruebas de conectividad serial (RS-232/RJ11) con cualquier equipo legacy específico del sanatorio
- Evaluación de ancho de banda real de la red interna del sanatorio para transferencia de estudios CT/MRI grandes