# Reemplazar Philips Vue PACS con open-source: guía completa para un solo desarrollador

**Orthanc + OHIF Viewer + Supabase es la combinación ganadora para este sanatorio.** Un desarrollador solo puede desplegar un PACS open-source funcional en producción en 1-2 semanas, reemplazando un Philips Vue PACS roto, con un stack Docker que ya tiene despliegues reales en hospitales de Malasia, Ecuador, Bélgica y otros países. No se necesita HL7 ni FHIR para arrancar. La regulación argentina (Ley 26.529) exige 10 años de retención y seguridad, pero no exige software comercial. El riesgo principal no es técnico: es el *bus factor* de un solo desarrollador manteniendo infraestructura médica crítica.

---

## Qué es un RIS, qué es un PACS, y por qué importa la diferencia

Un **RIS (Radiology Information System)** es el sistema administrativo de un servicio de radiología. Maneja texto: órdenes, turnos, seguimiento de estado, informes, facturación. Un **PACS (Picture Archiving and Communication System)** maneja píxeles: recibe, almacena, y permite visualizar imágenes médicas DICOM. Son complementarios, no intercambiables.

**El ciclo de vida completo de un estudio radiológico** conecta ambos sistemas:

```
1. ORDEN:       Médico solicita estudio → RIS asigna Accession Number
2. WORKLIST:    RIS genera entrada en Modality Worklist → Modalidad consulta vía DICOM C-FIND
3. ADQUISICIÓN: Técnico realiza estudio → Modalidad embebe datos del paciente en headers DICOM
4. ALMACENAMIENTO: Modalidad envía imágenes al PACS vía DICOM C-STORE
5. INTERPRETACIÓN: Radiólogo abre estudio en visor PACS
6. INFORME:     Radiólogo dicta hallazgos → informe se asocia al estudio en el RIS
7. ENTREGA:     RIS distribuye informe al médico solicitante → se dispara facturación
```

La comunicación entre RIS y PACS usa **tres protocolos clave**: DICOM (para imágenes y worklists), HL7 v2 (para órdenes y resultados entre sistemas hospitalarios), y FHIR (la alternativa REST moderna a HL7, no necesaria para clínicas standalone). El puente más importante es la **Modality Worklist (MWL)**: sin ella, el técnico tipea manualmente los datos del paciente en la consola del equipo, generando errores que rompen toda la cadena de trazabilidad.

| Aspecto | RIS | PACS |
|---------|-----|------|
| Dominio | Flujo de trabajo administrativo | Gestión de imágenes clínicas |
| Datos | Texto (demografía, órdenes, informes) | Píxeles (imágenes DICOM) |
| Protocolo primario | HL7 (ORM/ORU) | DICOM (C-STORE, C-FIND, C-MOVE) |
| Usuarios principales | Recepción, técnicos, facturación | Radiólogos, cirujanos |

**Para este proyecto, Supabase actúa como RIS y Orthanc como PACS.** Next.js es la interfaz que unifica ambos mundos.

---

## Arquitectura PACS: cómo fluyen las imágenes desde el equipo hasta el radiólogo

### Los cuatro componentes de un PACS

Todo PACS tiene: **modalidades** (los equipos que producen imágenes), un **servidor de archivo** (recibe y almacena DICOM), una **base de datos** (indexa metadatos para búsqueda rápida), y un **visor** (donde el radiólogo interpreta). En configuraciones enterprise existe un gateway de adquisición que valida datos antes del archivo, pero en una clínica chica, Orthanc cumple todos estos roles simultáneamente.

El flujo técnico es: la modalidad abre una **asociación DICOM** (conexión TCP) con el PACS, negocia AE Titles, SOP Classes y Transfer Syntaxes, y envía cada imagen como un **C-STORE request**. Cada imagen DICOM es un archivo que contiene metadatos (nombre del paciente, fecha, modalidad, parámetros de adquisición) y datos de píxeles, todo en un único formato binario identificado por tags como `(0010,0010)` = Patient Name.

### Almacenamiento: cuánto espacio necesita una clínica

| Modalidad | Tamaño por estudio (sin comprimir) | Comprimido lossless | Imágenes por estudio |
|-----------|-------------------------------------|---------------------|---------------------|
| Rx (CR/DR) | 10–30 MB | 5–15 MB | 1–5 |
| TC | 50–500 MB (hasta 1+ GB en angio-TC) | 25–200 MB | 100–3.000+ cortes |
| RM | 30–200 MB | 15–100 MB | 150–1.000+ |
| Ecografía | 5–50 MB | 3–30 MB | 20–200 frames |

**Para un sanatorio con ~20 estudios/día** (mix de Rx, eco, algo de TC/RM): **~1-3 GB/día → ~0.5-1 TB/año**. Con retención de 5 años online: 3-5 TB. Un disco de 10 TB da margen cómodo. La ley argentina exige **10 años de retención**, así que se necesita un plan de almacenamiento a largo plazo (nearline/cold storage).

### Disaster recovery

La regla de oro es **3-2-1**: 3 copias de datos, en 2 medios diferentes, con 1 copia off-site. Para Orthanc:

- **RAID-1 o RAID-5** en el servidor principal (protege contra fallo de disco)
- **Backup automático nocturno** de PostgreSQL (pg_dump + WAL archiving) y rsync/rclone del almacenamiento DICOM a un NAS secundario
- **Copia off-site**: segundo Orthanc que recibe auto-forwarding vía Lua, o almacenamiento cloud S3 (Orthanc tiene plugin nativo para AWS S3, Azure Blob, Google Cloud Storage)

---

## Servidores PACS open-source: la comparación que importa

### Orthanc — el elegido (⭐ recomendado para este caso)

**Orthanc** es un servidor DICOM open-source escrito en C++, desarrollado desde 2011 por Sébastien Jodogne (UCLouvain, Bélgica). Es el estándar de facto para PACS open-source en clínicas pequeñas y medianas.

**Arquitectura**: binario standalone que embebe DCMTK, con un sistema de plugins extensible. Por defecto usa SQLite, pero en producción se usa **PostgreSQL** (plugin v10.0, diciembre 2025). Almacenamiento en filesystem, opcionalmente en cloud (S3/Azure/GCS). REST API con **258+ endpoints** documentados vía OpenAPI. La imagen Docker `orthancteam/orthanc` incluye todos los plugins necesarios.

**Capacidades DICOM**: C-STORE, C-FIND, C-MOVE, C-GET, C-ECHO (SCP y SCU). Worklists vía plugin nuevo con REST API propia. DICOMweb (WADO-RS, STOW-RS, QIDO-RS) vía plugin. Transcodificación vía GDCM. TLS nativo.

**Despliegues reales verificados**: Hospital de Taiping (Malasia) con **100.000+ estudios, 2.8 TB**, funcionando 24/7 desde ~2017. Clínica en Ecuador (2025) con CR, DX, CT, MR, US en producción con OHIF. Rhode Island Hospital (USA) con ~6 TB en investigación. **65+ TB y 340.000+ estudios** reportados en la documentación oficial.

**Versión actual**: Orthanc 1.12.10, PostgreSQL plugin 10.0, DICOMweb 1.19, OHIF plugin 1.8 (embebe OHIF v3.12.0).

```
Docker mínimo:
docker run -p 4242:4242 -p 8042:8042 orthancteam/orthanc
```

**¿Lo elegiría?** **SÍ, sin dudas.** Es la opción correcta para este caso.

| Pro | Contra |
|-----|--------|
| Setup trivial con Docker | Sin HL7 nativo (no lo necesitás para standalone) |
| REST API excelente, ideal para Next.js | SQLite no sirve en producción (usar PostgreSQL) |
| Comunidad activa (Discourse, respuestas rápidas) | No es enterprise-grade para hospitales con millones de estudios |
| Plugin de Worklist con REST API | Gestión de usuarios básica (necesita plugin de autorización) |
| DICOMweb nativo para OHIF | Financiamiento vía Open Collective frágil (75% de un solo donante) |
| Probado en producción real en clínicas | |
| Soporte comercial disponible (Orthanc Team) | |

### dcm4chee — el gigante enterprise (no recomendado para un solo dev)

**dcm4chee** es un PACS Java enterprise-grade sobre WildFly (JBoss) + PostgreSQL + OpenLDAP + Keycloak. Versión actual: **5.34.3** (2025-2026). Mantenido por J4Care GmbH.

Es el PACS open-source más completo: **HL7 nativo** (ADT, ORM, ORU), worklist nativo, perfiles IHE completos (XDS/XDS-I), multi-tenancy, VNA. Usado en sistemas con **450+ TB de datos y 4.000+ nodos DICOM** (Emory Healthcare, 715 scanners en 12 sitios).

**¿Lo elegiría?** **NO para este caso.** La curva de aprendizaje es brutal para un solo desarrollador: requiere dominar Java EE, WildFly, LDAP, Keycloak, y la configuración de dispositivos via LDAP. Un miembro de la comunidad lo describió como *"a little like a monster with tons of features to configure"*. Otro dijo: *"not fun to setup correctly"*.

**Cuándo SÍ elegir dcm4chee**: hospital grande con equipo de IT dedicado, necesidad de HL7 nativo, integración con HIS/EHR compleja, multi-tenancy, cumplimiento IHE estricto.

### Dicoogle — interesante pero insuficiente

Dicoogle es un PACS Java basado en indexación Lucene (búsqueda full-text sobre cualquier tag DICOM). Muy fácil de instalar (`java -jar dicoogle.jar`). Desarrollado por la Universidad de Aveiro (Portugal). Probado con **22 millones de imágenes**.

**¿Lo elegiría?** **NO.** Falta soporte HL7, worklist limitado, DICOMweb básico, comunidad pequeña. Es excelente para investigación y búsqueda avanzada de metadatos, pero no como PACS clínico primario.

### Conquest DICOM — legacy funcional

Servidor DICOM en C/C++ con Lua scripting, versión 1.5.0f (agosto 2025). Muy fácil en Windows, liviano, con soporte DICOMweb básico (funciona con OHIF). Mantenido por un solo desarrollador (Marcel van Herk).

**¿Lo elegiría?** **NO como primario.** Bus factor = 1, comunidad mínima, no enterprise-grade. Podría funcionar como cache o servidor secundario.

### Tabla comparativa final

| Criterio | **Orthanc** ⭐ | dcm4chee | Dicoogle | Conquest |
|----------|:---:|:---:|:---:|:---:|
| Facilidad de setup | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| REST API | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| DICOMweb | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐ |
| HL7 nativo | ❌ | ⭐⭐⭐⭐⭐ | ❌ | ⭐ |
| Comunidad | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐⭐ |
| Para un solo dev | ⭐⭐⭐⭐⭐ | ⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| Escala enterprise | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| Docker | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐ |
| Producción probada | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐ |

**Horos** (macOS) y **3D Slicer** no son PACS servers — son visores/herramientas de investigación. **Weasis** es un visor Java alternativo a OHIF. Ninguno reemplaza un servidor PACS.

---

## OHIF Viewer: el visor web zero-footprint que completa el stack

**OHIF (Open Health Imaging Foundation) Viewer** es una aplicación web React que corre enteramente en el navegador — sin instalación en el cliente. Desarrollado por Massachusetts General Hospital (MGH) con financiamiento NIH, licencia MIT. Versión actual: **v3.12.0** (febrero 2025).

### Qué puede hacer OHIF

OHIF renderiza imágenes usando **Cornerstone3D** (motor WebGL/GPU con WebAssembly para decodificación). Soporta CT, MR, US, Rx, mamografía, PET, RT, microscopia, video DICOM. Herramientas de medición (longitud, ángulo, ROI), anotaciones que persisten como DICOM SR, reconstrucción multiplanar (MPR), rendering 3D, fusión PET/CT, y segmentación con AI local (v3.10+).

**Cornerstone.js vs OHIF**: Cornerstone3D es la *librería* de bajo nivel para renderizar imágenes médicas. OHIF es la *aplicación completa* construida sobre Cornerstone3D. Si necesitás un visor completo, usá OHIF. Si necesitás un componente custom embebido, usá Cornerstone3D directamente.

### Cómo conectar OHIF a Orthanc

OHIF se conecta a Orthanc vía **DICOMweb** (QIDO-RS para buscar estudios, WADO-RS para recuperar imágenes). La configuración es un archivo JavaScript:

```javascript
// app-config.js para OHIF
window.config = {
  dataSources: [{
    namespace: '@ohif/extension-default.dataSourcesModule.dicomweb',
    sourceName: 'dicomweb',
    configuration: {
      friendlyName: 'Orthanc',
      qidoRoot: '/dicom-web',
      wadoRoot: '/dicom-web',
      wadoUriRoot: '/wado',
      qidoSupportsIncludeField: false,
      imageRendering: 'wadors',
      thumbnailRendering: 'wadors',
    },
  }],
};
```

**Hay dos caminos para integrar OHIF con Orthanc:**

1. **Plugin OHIF de Orthanc (v1.8)** — el más simple. Embebe OHIF v3.12.0 directamente dentro de Orthanc, accesible en `http://orthanc:8042/ohif/`. No necesitás un contenedor OHIF separado. Ideal para arrancar rápido.
2. **OHIF como contenedor independiente** — más flexible para customización. Docker image `ohif/app`, configurado para apuntar a los endpoints DICOMweb de Orthanc via Nginx reverse proxy.

### Cómo embeber OHIF en Next.js

La forma más confiable es **iframe**: deployar OHIF como PWA estática y embeber con `<iframe src="/ohif/viewer/{StudyInstanceUID}" />`. OHIF depende del objeto `window`, así que **SSR no funciona** — cualquier integración directa en Next.js debe usar `next/dynamic` con `ssr: false`. La comunicación entre la app padre y el iframe se hace via `postMessage`.

---

## Patrones de integración: Next.js ↔ Supabase ↔ Orthanc ↔ Modalidades

### Arquitectura recomendada

```
┌─────────────────────────────────────────────────────────────────┐
│                        RED CLÍNICA (LAN)                        │
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │    TC    │  │    RM    │  │    Rx    │  │   Eco    │       │
│  │ AET:CT1  │  │ AET:MR1  │  │ AET:CR1  │  │ AET:US1  │       │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘       │
│       │              │              │              │              │
│       └──────────────┴──────────────┴──────────────┘              │
│                          DICOM C-STORE                            │
│                              │                                    │
│                    ┌─────────▼──────────┐                        │
│                    │      ORTHANC       │                        │
│                    │  Puerto DICOM:4242 │                        │
│                    │  Puerto HTTP:8042  │                        │
│                    │  + PostgreSQL      │                        │
│                    │  + DICOMweb plugin │                        │
│                    │  + Python plugin   │                        │
│                    │  + Worklist plugin │                        │
│                    │  + OHIF plugin     │                        │
│                    │  + GDCM plugin     │                        │
│                    └──────┬──────┬──────┘                        │
│                           │      │                                │
│              webhook      │      │  DICOMweb (WADO-RS/QIDO-RS)   │
│          (OnStableStudy)  │      │                                │
│                           │      │                                │
│                    ┌──────▼──────▼──────┐                        │
│                    │   NGINX (reverse   │                        │
│                    │      proxy)        │                        │
│                    │  - SSL/TLS         │                        │
│                    │  - Auth headers    │                        │
│                    │  - CORS            │                        │
│                    └──────┬──────┬──────┘                        │
│                           │      │                                │
│              ┌────────────▼┐    ┌▼──────────────┐               │
│              │  NEXT.JS    │    │  OHIF VIEWER   │               │
│              │  App + API  │    │  (iframe o     │               │
│              │  Routes     │    │   standalone)  │               │
│              └──────┬──────┘    └────────────────┘               │
│                     │                                             │
│              ┌──────▼──────┐                                     │
│              │  SUPABASE   │                                     │
│              │ (PostgreSQL)│                                     │
│              │  + Auth     │                                     │
│              │  + Realtime │                                     │
│              │  RIS data:  │                                     │
│              │  - patients │                                     │
│              │  - orders   │                                     │
│              │  - studies  │                                     │
│              │  - reports  │                                     │
│              │  - billing  │                                     │
│              └─────────────┘                                     │
└─────────────────────────────────────────────────────────────────┘
```

### Dónde encaja cada pieza

**Supabase (PostgreSQL) es el RIS.** Almacena todo el texto: pacientes, órdenes, turnos, asignaciones, informes, facturación. Orthanc es el PACS: almacena y sirve imágenes DICOM. **Son dos PostgreSQL separados** — uno para Supabase y otro para el índice de Orthanc. No mezclarlos.

**Next.js actúa como proxy y orquestador.** Orthanc NO se expone directamente a internet. Next.js valida la autenticación via Supabase Auth, verifica permisos (¿este radiólogo tiene asignado este estudio?), y luego proxea las requests a Orthanc con Basic Auth interno.

### Sincronización entre Orthanc y Supabase

Cuando llega un estudio nuevo a Orthanc, la app necesita saberlo. Hay tres mecanismos:

**1. Webhook via Python plugin (recomendado)**:
```python
import orthanc, json, requests

def on_change(changeType, level, resourceId):
    if changeType == orthanc.ChangeType.STABLE_STUDY:
        study = json.loads(orthanc.RestApiGet(f'/studies/{resourceId}'))
        requests.post('http://nextjs-app:3000/api/webhooks/new-study', json={
            'orthanc_id': resourceId,
            'study_uid': study['MainDicomTags']['StudyInstanceUID'],
            'patient_id': study['PatientMainDicomTags']['PatientID'],
            'accession': study['MainDicomTags'].get('AccessionNumber', ''),
            'modality': study['MainDicomTags'].get('ModalitiesInStudy', ''),
        })

orthanc.RegisterOnChangeCallback(on_change)
```

**2. Polling del Changes API** (backup):
```typescript
const res = await fetch(`http://orthanc:8042/changes?since=${lastSeq}&type=StableStudy`);
```

**3. Supabase Realtime** para notificaciones push al frontend cuando se inserta un nuevo estudio en la tabla `studies`.

### Flujo completo de un estudio nuevo

```
1. Técnico realiza estudio → Modalidad envía DICOM C-STORE a Orthanc
2. Orthanc recibe todas las instancias, espera StableAge (60s)
3. OnStableStudy dispara → Python plugin hace POST a Next.js API
4. Next.js /api/webhooks/new-study:
   a. Upsert paciente en Supabase (por PatientID)
   b. Crear registro de estudio en Supabase (con orthanc_id, StudyInstanceUID)
   c. Matchear con orden existente (por AccessionNumber)
   d. Auto-asignar a radiólogo (por modalidad, round-robin, o manual)
   e. Notificación en tiempo real via Supabase Realtime
5. Radiólogo ve notificación en la app
6. Click "Abrir estudio" → Next.js genera URL del visor
7. OHIF carga imágenes via DICOMweb proxeado por Nginx
8. Radiólogo informa → informe guardado en Supabase
9. Estado del estudio actualizado → facturación disparada
```

### DICOM routing: cómo rutear estudios al radiólogo correcto

Orthanc permite routing automático via **Lua scripts** o **Python plugin**. Cada modalidad se identifica por su **AE Title** (identificador de hasta 16 caracteres). El callback `OnStableStudy` permite decidir qué hacer con cada estudio:

```lua
function OnStableStudy(studyId, tags, metadata)
  local modality = tags["ModalitiesInStudy"]
  if modality == "CT" then
    -- Notificar a especialista en TC
    HttpPost("http://app:3000/api/assign", '{"study":"' .. studyId .. '","to":"dr_perez"}')
  elseif modality == "US" then
    HttpPost("http://app:3000/api/assign", '{"study":"' .. studyId .. '","to":"dr_garcia"}')
  end
end
```

Para este sanatorio, **la lógica de asignación debería vivir en Next.js/Supabase**, no en Lua. Orthanc solo notifica; la app decide quién interpreta basándose en reglas de negocio (modalidad, médico derivante, guardia del día, carga de trabajo).

### Worklist: la pieza clave para conectar RIS y PACS

El nuevo **Worklist plugin de Orthanc** (reemplaza al viejo ModalityWorklists) tiene REST API propia para crear y gestionar entradas de worklist. El flujo:

```
1. Recepcionista crea orden en la app (Supabase)
2. Next.js API llama REST API de Orthanc → crea worklist entry
3. Técnico en la modalidad consulta worklist (DICOM C-FIND a Orthanc)
4. Técnico selecciona paciente → datos se auto-completan en el equipo
5. Estudio se realiza → imágenes llegan a Orthanc con datos correctos
6. Plugin borra worklist entry automáticamente (DeleteWorklistsOnStableStudy: true)
```

Esto **elimina errores de tipeo** en la consola del equipo — la causa #1 de problemas de trazabilidad en radiología.

---

## HL7 y FHIR: ¿los necesitás o no?

### HL7 v2: el estándar legacy que domina hospitales

HL7 v2 es un protocolo de mensajería pipe-delimited (`|`) para intercambiar datos clínicos entre sistemas hospitalarios. Mensajes clave: **ORM^O01** (nueva orden), **ORU^R01** (resultado/informe), **ADT^A01** (admisión). Se transporta sobre TCP via MLLP. Sigue siendo el estándar dominante en >99% de los sistemas hospitalarios del mundo.

### FHIR: la alternativa REST moderna

FHIR usa HTTP/JSON, Resources (Patient, ImagingStudy, DiagnosticReport, ServiceRequest), y es mucho más amigable para desarrolladores web. El resource **ImagingStudy** conecta FHIR con DICOM incluyendo Study/Series/Instance UIDs. DICOMweb (WADO-RS, STOW-RS, QIDO-RS) es la API REST para acceder a imágenes DICOM.

### Veredicto para este sanatorio

**No necesitás HL7 ni FHIR para arrancar.** Un sistema standalone de clínica necesita solo DICOM para la comunicación con modalidades. HL7 se necesitaría si el sanatorio se integra con un sistema hospitalario externo (HIS/EHR). FHIR se necesitaría para portales de pacientes o intercambio de datos inter-institucional.

**Cuándo agregar HL7/FHIR más adelante**: si necesitás integrar con obras sociales que exigen intercambio electrónico, si el sanatorio crece a multi-site, o si la normativa argentina lo requiere (la Ley 27.706 de Historia Clínica Electrónica Federal está en implementación progresiva). Herramientas: **Mirth Connect** (motor de integración HL7 open-source) y **HAPI FHIR** (servidor/librería FHIR en Java, puede ponerse como fachada sobre Supabase).

---

## Migración desde Philips Vue PACS: plan paso a paso

### Por qué Philips Vue PACS falla (y no es raro)

Philips IntelliSpace/Vue PACS tiene vulnerabilidades de seguridad documentadas por CISA (CVSS hasta 10.0), quejas recurrentes de usuarios sobre usabilidad y soporte vendor, y costos de licenciamiento altos. Las reviews de KLAS incluyen: *"I probably wouldn't buy IntelliSpace PACS again"* y *"Philips' executive engagement with our organization is awful"*.

### Estrategia de migración en 5 fases

**Fase 1: Deploy Orthanc en paralelo (Semana 1-2)**
- Instalar Orthanc con PostgreSQL en hardware nuevo (puede ser el mismo servidor donde corre Next.js/Supabase si tiene recursos suficientes)
- Registrar Orthanc como destino DICOM en Philips PACS (AET, IP, puerto)
- Verificar conectividad con C-ECHO

**Fase 2: Dual-sending desde modalidades (Semana 3+)**
- Configurar cada modalidad para enviar a AMBOS PACS simultáneamente (la mayoría soporta múltiples destinos DICOM)
- Nuevos estudios llegan a ambos sistemas. Philips sigue siendo el sistema clínico primario
- Valida que Orthanc recibe correctamente todos los tipos de modalidad

**Fase 3: Migración histórica en background (Semanas 3-12+)**
- Ejecutar scripts de C-MOVE en horarios off-peak (noches/fines de semana) para traer estudios históricos de Philips a Orthanc
- Throttlear la migración para no impactar el rendimiento clínico de Philips
- Herramientas: **PyOrthanc** para automatizar C-FIND + C-MOVE, o el script `ImportDicomFiles.py` si hay acceso al filesystem

**Fase 4: Cutover (Fecha objetivo)**
- Verificar que todos los datos históricos están migrados
- Cambiar modalidades para enviar SOLO a Orthanc
- Mantener Philips en modo read-only por 2-4 semanas como fallback

**Fase 5: Decommission Philips**
- Verificar que no faltan estudios
- Descomisionar formalmente

### Verificación de integridad post-migración

Orthanc expone `/statistics` (conteo de pacientes, estudios, series, instancias). Comparar contra el inventario del PACS de origen. Usar la REST API para verificar spot-checks de metadata DICOM. Orthanc preserva **todos los tags** incluyendo tags privados de Philips — no modifica los archivos DICOM al recibirlos.

**Advertencia clave**: Philips puede throttlear el bandwidth durante C-MOVE para proteger su sistema. Negociar esto con el representante de Philips antes de empezar.

---

## Evaluación de viabilidad honesta: ¿puede un solo dev hacer esto?

### La respuesta corta: SÍ, pero con ojos abiertos

**Evidencia más fuerte**: Dr. Kim-Ann Git en el Hospital de Taiping (Malasia, 608 camas) desplegó Orthanc como PACS completo **sin presupuesto**, como esfuerzo prácticamente individual. Para 2019: **100.000+ estudios, 2.8 TB, 15.000-20.000 estudios visualizados por mes**. Se replicó en 5+ sitios en Malasia. Una instancia Orthanc de monitoreo de dosis CT corrió **24/7 ininterrumpida desde abril 2015**.

En Ecuador (2025), un usuario reportó en el foro de Orthanc que opera un PACS completo en producción con Orthanc + PostgreSQL + OHIF + frontend custom, manejando CR, DX, CT, MR y US.

### Los 6 riesgos reales

**1. Bus factor = 1.** Si te pasa algo, ¿quién mantiene el PACS? Documentar obsesivamente. Entrenar al menos a una persona del sanatorio en operaciones básicas (reiniciar servicios, verificar backups).

**2. DICOM es un estándar complejo.** Vas a pasar semanas debuggeando transfer syntaxes, quirks de vendors (Philips, GE, Siemens tienen comportamientos propietarios), y configuración de red. Habilitar el **plugin GDCM** desde el día 1 para soporte amplio de transfer syntaxes.

**3. Vendors de equipos cobran por conexiones.** La experiencia malaya reportó que vendors cobraron **$1.600-$6.000 USD por punto de conexión** solo para configurar AET/IP/puerto. Negociar con el sanatorio y tener poder de compra listo.

**4. Backup es difícil de hacer bien.** Incluso el deployment malayo — manejado por un doctor competente — flaggeó backup como su mayor desafío sin resolver. Necesitás una estrategia automatizada, testeada y monitoreada desde el día 1.

**5. No hay precedente público argentino.** Podés estar pioneering esto en el contexto regulatorio local. Considerar una consulta breve con un abogado de informática médica.

**6. Sostenibilidad del proyecto Orthanc.** El financiamiento via Open Collective perdió su principal donante (75% del total). El software es lo suficientemente maduro como para que no sea una crisis inmediata, pero es un factor a largo plazo.

### Regulación argentina: qué dice la ley

**Ley 26.529** (Derechos del Paciente): **10 años de retención mínima** para registros clínicos. Los registros digitales son válidos si aseguran integridad, autenticidad, inalterabilidad, durabilidad y recuperabilidad. Acceso restringido con claves de identificación. El paciente es dueño de su historia clínica.

**Ley 25.326** (Protección de Datos Personales): Los datos de salud son **datos sensibles**. Medidas técnicas y organizativas de seguridad obligatorias. Sin transferencia transfronteriza a países sin protección adecuada (relevante si considerás cloud).

**Resolución 610/2004** (Normas de Servicio de Radiología): Exige programas de control de calidad y personal capacitado, pero **no exige software comercial específico**.

**Conclusión regulatoria**: No hay impedimento legal para usar PACS open-source en Argentina. Los requisitos son sobre resultados (integridad, seguridad, retención) no sobre medios.

### Qué puede manejar Supabase como RIS vs qué necesita software especializado

| Función | ¿Supabase + custom app? | ¿Software especializado? |
|---------|:---:|:---:|
| Registro de pacientes | ✅ Ideal | No necesario |
| Gestión de órdenes | ✅ Ideal | No necesario |
| Scheduling/Turnos | ✅ Ideal | No necesario |
| Tracking de estado | ✅ Ideal | No necesario |
| Informes radiológicos (texto libre) | ✅ Ideal | No necesario |
| Facturación/Obras sociales | ✅ Custom | No necesario |
| Modality Worklist | ⚠️ Requiere bridge | Orthanc Worklist plugin |
| Almacenamiento DICOM | ❌ | Orthanc |
| Visualización de imágenes | ❌ | OHIF Viewer |
| DICOM Structured Reports | ⚠️ Complejo | pydicom/dcmtk si se necesita |
| HL7/FHIR integración | ⚠️ Futuro | Mirth Connect / HAPI FHIR |

---

## Roadmap priorizado: qué construir primero

### Fase 1 — EMERGENCIA: que fluyan las imágenes (Semana 1-2)

Esta fase **reemplaza al Philips Vue roto**. Es el mínimo absoluto.

1. Deploy Docker Compose: Orthanc + PostgreSQL + Nginx
2. Habilitar plugins: DICOMweb, GDCM, OHIF (el built-in), Python
3. Configurar UNA modalidad (la más usada, probablemente Rx)
4. Verificar: C-Echo → C-Store → ver estudio en OHIF
5. Configurar basic auth en Orthanc

**Docker Compose mínimo viable:**
```yaml
services:
  orthanc:
    image: orthancteam/orthanc
    ports:
      - "4242:4242"
      - "8042:8042"
    volumes:
      - orthanc-storage:/var/lib/orthanc/db
      - ./orthanc.json:/etc/orthanc/orthanc.json:ro
      - ./python-scripts:/etc/orthanc/python:ro
    environment:
      ORTHANC__POSTGRESQL__ENABLE_INDEX: "true"
      ORTHANC__POSTGRESQL__HOST: "postgres"
      ORTHANC__POSTGRESQL__DATABASE: "orthanc"
      ORTHANC__DICOM_WEB__ENABLE: "true"
      ORTHANC__OHIF__ENABLED: "true"
      ORTHANC__AUTHENTICATION_ENABLED: "true"
      ORTHANC__REGISTERED_USERS: '{"admin":"password-seguro"}'
    depends_on: [postgres]
    restart: always

  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: orthanc
      POSTGRES_USER: orthanc
      POSTGRES_PASSWORD: orthanc-db-password
    volumes:
      - pg-data:/var/lib/postgresql/data
    restart: always

  nginx:
    image: nginx:alpine
    ports:
      - "443:443"
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf:ro
    depends_on: [orthanc]
    restart: always

volumes:
  orthanc-storage:
  pg-data:
```

### Fase 2 — ESTABILIZAR: producción real (Semana 3-4)

1. Conectar todas las modalidades restantes (CT, MR, US)
2. Configurar transcodificación para transfer syntaxes problemáticos
3. Implementar backups automatizados (pg_dump + rsync nocturno)
4. Configurar RAID en storage
5. Monitorear espacio en disco (alertas cuando baje del 20%)
6. Documentar todo: diagrama de red, tabla de AE Titles, procedimientos de backup

### Fase 3 — RIS BÁSICO: flujo de trabajo clínico (Mes 2-3)

1. Registro de pacientes en Supabase
2. Entry de órdenes de estudio
3. Integración con Orthanc Worklist plugin (puente REST)
4. Webhook de estudio nuevo → auto-registro en Supabase
5. Asignación de estudios a radiólogos
6. Scheduling básico

### Fase 4 — INFORMES: el producto completo (Mes 3-4)

1. Interface de informes radiológicos vinculada a estudios
2. Templates por modalidad/procedimiento
3. Workflow de estado (borrador → preliminar → final → firmado)
4. Generación de PDF para distribución
5. Integrar OHIF embebido en la app via iframe

### Fase 5 — FACTURACIÓN Y OPERACIONES (Mes 4-6)

1. Integración con obras sociales y prepagas argentinas
2. Estadísticas y dashboards
3. Audit trail completo
4. Migración histórica del Philips Vue (en background desde Fase 2)

### Fase 6 — HARDENING (Continuo)

1. Hot/cold storage tiering (SSD para recientes, HDD/NAS para archivo)
2. Backup off-site (segundo Orthanc o S3)
3. HTTPS/TLS completo
4. Gestión de roles granular
5. Documentación de compliance para regulación argentina

---

## Conclusión: la decisión pragmática

**La combinación Orthanc + OHIF + Next.js + Supabase es la elección correcta para este sanatorio.** No es la opción con cero riesgo — esa no existe cuando un solo desarrollador maneja infraestructura médica crítica. Pero es la opción que maximiza la probabilidad de éxito dado las restricciones reales: un Philips Vue PACS roto que necesita reemplazo urgente, presupuesto limitado, y un desarrollador competente.

Lo que hace viable este proyecto no es que sea fácil, sino que **el caso de uso encaja exactamente** en el sweet spot de Orthanc: clínica pequeña-mediana, deployment single-site, equipo técnico mínimo. Los deployments en Malasia, Ecuador y Bélgica prueban que funciona. La regulación argentina lo permite. Y un Docker Compose te separa de un PACS funcional en una tarde.

Los tres factores que determinarán el éxito o fracaso son: **disciplina en backups** (el dato que se pierde no se recupera), **documentación obsesiva** (para cuando no estés disponible), y **expectativas calibradas** con el sanatorio (esto es un maratón de 6-12 meses, no un sprint de 2 semanas). La Fase 1 resuelve la urgencia. Todo lo demás se construye incrementalmente sobre esa base.