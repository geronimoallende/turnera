# Middleware médico e integración de dispositivos para un sistema de sanatorio en Argentina

**Un desarrollador solo puede construir un sistema de sanatorio funcional sin ahogarse en middleware, pero solo si elige batallas con precisión quirúrgica.** La clave está en entender que los estándares de integración médica (HL7v2, ASTM, DICOM, FHIR, IEEE 11073) forman un ecosistema de complejidad exponencial, pero que un sanatorio mediano en Córdoba solo necesita un subconjunto pequeño desde el día uno. Este documento analiza cada protocolo, cada tipo de dispositivo y cada estándar con una evaluación honesta de cuándo realmente se necesita, partiendo desde una turnera en Next.js + Supabase hasta un sistema completo de gestión sanatorial. La conclusión es clara: **empezar sin integration engine, modelar datos internamente con estructura FHIR, y agregar Mirth Connect solo cuando aparezca el primer dispositivo HL7v2 real.**

---

## 1. Healthcare integration engines: el cerebro que traduce entre mundos incompatibles

### Por qué existe el patrón middleware

En un sanatorio típico coexisten entre 5 y 15 sistemas: HIS (Historia Clínica Electrónica), LIS (laboratorio), RIS/PACS (imágenes), farmacia, facturación, ECG, monitores de signos vitales, turnos. Cada uno habla un "idioma" diferente. El PACS usa DICOM, el laboratorio habla ASTM o HL7v2, el sistema de facturación necesita formatos específicos por obra social, y las apps modernas esperan REST/JSON.

Sin un motor de integración, conectar 10 sistemas requiere potencialmente **90 interfaces punto-a-punto** (N×N). Con un integration engine como hub central, se reducen a **10 interfaces** (una por sistema). Cada sistema habla solo con el motor, y el motor traduce, enruta, encola y registra. Esto es el patrón hub-and-spoke, y es la razón por la que cada hospital mediano-grande necesita uno.

### Mirth Connect (NextGen Connect): el estándar de facto

Mirth Connect es el motor de integración más desplegado del mundo en salud. Potencia un tercio de los Health Information Exchanges públicos de EE.UU. y está en más de 40 países.

**Cambio crítico de licenciamiento (2025):** Desde la versión 4.6, NextGen transicionó a modelo comercial y propietario. La **versión 4.5.2 es la última open-source** disponible bajo MPL 2.0, completamente gratuita y funcional. Las versiones Enterprise arrancan en ~USD 15,000-20,000/año por servidor. Han surgido forks comunitarios como **Open Integration Engine (OIE)** bajo Linux Foundation y **BridgeLink** (fork empresarial 4.5.4).

La arquitectura se basa en **canales**. Cada canal tiene un conector de origen (TCP/MLLP listener, HTTP listener, database reader, file reader), filtros opcionales, transformadores (editor visual o scripts JavaScript/Java), y uno o más conectores de destino. Soporta HL7v2, FHIR R4, DICOM, X12, XML, JSON, CSV, y prácticamente cualquier formato custom. Se despliega como aplicación Java, disponible en Docker:

```bash
docker run -d -p 8443:8443 nextgenhealthcare/connect:4.5
```

Para conectar Mirth con una app Next.js + Supabase existen tres patrones principales. El más recomendado es **REST API**: Mirth expone HTTP listeners como endpoints, Next.js hace POST/GET, Mirth transforma y enruta. El segundo es **Database Listener**: Mirth se conecta directamente a PostgreSQL/Supabase vía JDBC y hace polling buscando registros nuevos. El tercero es **TCP/MLLP directo** para recibir mensajes HL7v2 de dispositivos legacy.

### HAPI FHIR: almacenamiento y API FHIR

HAPI FHIR es una implementación open-source completa del estándar FHIR en Java, desarrollada por University Health Network (Toronto). A diferencia de Mirth, que transforma y enruta mensajes, **HAPI FHIR almacena y sirve recursos FHIR via REST API**. Es un repositorio de datos clínicos, no un broker de mensajes.

| Aspecto | Mirth Connect | HAPI FHIR |
|---------|--------------|-----------|
| Función | Transformar y enrutar mensajes | Almacenar y servir recursos FHIR |
| Protocolos | HL7v2, FHIR, DICOM, X12, TCP, HTTP | Solo FHIR REST |
| Almacenamiento clínico | No (solo mensajes en tránsito) | Sí, repositorio completo |
| Transformación | Sí, función principal | Limitada a parseo FHIR |

Pueden trabajar juntos: Mirth recibe HL7v2 de un sistema legacy, usa las bibliotecas HAPI FHIR embebidas para construir un Bundle FHIR, y lo envía al servidor HAPI FHIR JPA. Es un patrón común en implementaciones maduras.

### Opciones comerciales: Rhapsody e InterSystems

**Rhapsody** (rhapsody.health) arranca en ~USD 25,000 + soporte anual, y procesa más de mil millones de mensajes/día globalmente. **InterSystems HealthShare Health Connect** es la opción enterprise premium con precios de USD 50,000-150,000+/año. Ambos ofrecen soporte 24/7, certificaciones HIPAA/SOC2, IDEs gráficos superiores, y escalabilidad probada a cientos de millones de transacciones.

**¿Son relevantes para un sanatorio en Córdoba? No.** Los precios son prohibitivos, ninguno tiene presencia directa fuerte en Argentina para clínicas pequeñas, y para 3-5 sistemas a integrar son soluciones excesivas. **Mirth Connect 4.5.2 open-source es más que suficiente.**

### Diagrama conceptual de arquitectura

```
┌──────────────────────────────────────────────────────────────┐
│                    CAPA DE APLICACIÓN                         │
│  ┌────────────────────────────────────────────────────────┐  │
│  │         App Next.js + Supabase/PostgreSQL              │  │
│  │   (HCE, turnos, recetas, informes, portal paciente)    │  │
│  └───────────────────────┬────────────────────────────────┘  │
│                          │ REST API / JDBC / Webhooks         │
│                          ▼                                    │
│  ┌────────────────────────────────────────────────────────┐  │
│  │       🔄 MIRTH CONNECT 4.5.2 (Docker, gratuito)       │  │
│  │                                                        │  │
│  │  Canal 1: ORU ← Laboratorio (ASTM→HL7v2)              │  │
│  │  Canal 2: DICOM ←→ PACS (Orthanc)                     │  │
│  │  Canal 3: ECG ← Electrocardiógrafos                   │  │
│  │  Canal 4: ADT ←→ Registro de pacientes                │  │
│  │  Canal 5: SIU ←→ Turnos                               │  │
│  │  Canal 6: Facturación → Obras Sociales                 │  │
│  └──┬──────┬──────┬──────┬──────┬──────┬─────────────────┘  │
│     │      │      │      │      │      │                     │
│     ▼      ▼      ▼      ▼      ▼      ▼                     │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐                 │
│  │Lab │ │PACS│ │ECG │ │Mon.│ │Farm│ │O.S.│                 │
│  │ASTM│ │DCOM│ │SCP │ │HL7 │ │HL7 │ │API │                 │
│  └────┘ └────┘ └────┘ └────┘ └────┘ └────┘                 │
└──────────────────────────────────────────────────────────────┘
```

> **¿Realmente necesito un integration engine desde el día 1?** No. Mientras tu sistema solo maneje turnos, HCE manual y facturación, no hay mensajes que enrutar. Mirth se justifica cuando aparece el primer dispositivo que envía datos automáticamente (típicamente un analizador de laboratorio).

---

## 2. Integración de equipos de laboratorio: donde ASTM habla y HL7v2 escucha

### El protocolo ASTM/LIS2-A2

ASTM E1381/E1394 (renombrado CLSI LIS01-A2/LIS02-A2) es **el estándar universal para comunicación con analizadores de laboratorio**. Prácticamente el 100% de los analizadores del mundo lo implementan. Define tanto el protocolo de bajo nivel (handshake, framing, checksums) como la estructura del contenido (registros de Header, Patient, Order, Result, Comment, Terminator).

Un mensaje ASTM típico de resultado se ve así:

```
H|\^&|||CobAS^Roche^c501|||||||P|LIS2-A|20260330120000
P|1|PAC-001||DNI-30123456|García^Juan||19800515|M
O|1|MUESTRA-001||^^^GLU|||20260330115500
R|1|^^^GLU|95|mg/dL||N||F||||
R|2|^^^UREA|32|mg/dL||N||F||||
R|3|^^^CREA|0.9|mg/dL||N||F||||
L|1|N
```

La comunicación sigue un handshake estricto ENQ/ACK: el emisor envía `<ENQ>` (0x05), el receptor responde `<ACK>` (0x06), se transmiten frames con checksum, y se cierra con `<EOT>` (0x04). Cada frame tiene un máximo de 240 caracteres (serial) o 64,000 (TCP/IP).

### Flujo bidireccional con analizadores

El flujo tiene tres modos operativos. En **Host Download**, el LIS/HIS envía las órdenes pendientes al analizador (qué tests correr para cada muestra). En **Result Upload**, el analizador completa el análisis y envía resultados de vuelta. En **Host Query**, el analizador escanea el código de barras del tubo y pregunta al LIS "¿qué tests tengo pendientes para esta muestra?". Este último modo es el más elegante y es común en analizadores modernos con lector de código de barras.

### Conexión física: el RS-232 no murió

La realidad es que **el 60-70% del parque de analizadores instalado en Argentina todavía usa RS-232 serial**. Configuración típica: 9600 baud, 8N1, conector DB-9, solo 3 pines (TX, RX, GND). Las PCs modernas no tienen puerto serial, así que se necesitan adaptadores USB-Serial con chips FTDI FT232R o Prolific PL2303 (USD 10-25). Los analizadores más nuevos (Roche Cobas 6000/8000, Mindray BS-800M, Beckman AU series) ofrecen **Ethernet/TCP-IP directo**. Para equipos serial legacy que necesitan conectarse a la red, existen Serial Device Servers como Moxa NPort o Lantronix (USD 100-300).

### Analizadores comunes en sanatorios argentinos

El ecosistema argentino tiene particularidades importantes. **Wiener Lab** (Rosario, Santa Fe) es la empresa argentina dominante en diagnóstico in vitro, la mayor de Latinoamérica, con 60+ años de trayectoria. Sus modelos CM-250 y CB 400i son los caballos de batalla de laboratorios medianos. **Metrolab** (también argentino) ofrece equipos económicos como el 1600 DR. Muchos laboratorios combinan Wiener (química) con **Mindray** (hematología, modelos BC-5800/BC-6800). En instituciones más grandes aparecen **Roche Cobas**, **Beckman Coulter**, y **Siemens**.

| Tipo | Marcas comunes en Argentina | Conectividad típica | Rango USD |
|------|---------------------------|---------------------|-----------|
| Química clínica | Wiener CM-250/CB 400i, Mindray BS-360E, Roche Cobas c311 | RS-232, TCP/IP (modelos nuevos) | 3,000-200,000 |
| Hematología | Mindray BC-5800, Sysmex XN-550, Beckman DxH 560 | RS-232, Ethernet | 8,000-150,000 |
| Coagulación | Wiener, Stago, Siemens BCS | RS-232 | 5,000-50,000 |

### ¿Necesito construir un LIS completo?

**No.** Un LIS completo maneja fase pre-analítica (etiquetado, trazabilidad), analítica (QC Westgard, delta checks), post-analítica (validación bioquímica, informes), y administración (stock de reactivos, facturación). Eso son meses de desarrollo.

La **integración mínima viable** es un receptor unidireccional de resultados: un servidor ASTM sobre TCP/IP (o serial) que escuche, parsee registros H/P/O/R/L, y guarde en PostgreSQL vinculando resultados al paciente/orden existente. Herramientas útiles: `python-astm` o `senaite.astm` (Python/asyncio). **Estimación: 2-4 semanas para recepción unidireccional, 4-8 para bidireccional.** Si el laboratorio necesita un LIS completo, existen opciones locales como **COYALab** (Santa Fe, primera empresa argentina certificada TÜV para software de laboratorio) u **OpenELIS Global** (open-source).

> **¿Realmente necesito integración de laboratorio?** Sí, eventualmente. Es la integración con mayor impacto clínico después de PACS. Pero puede esperar hasta que el sanatorio exprese la necesidad real. Empezar con entrada manual de resultados y evolucionar.

---

## 3. Integración ECG: un mundo fragmentado donde el papel sigue ganando

### Formatos de output: no hay estándar universal

A diferencia de las imágenes médicas (donde DICOM es rey indiscutible), el mundo ECG está **fragmentado en al menos cinco formatos** sin un ganador claro:

- **SCP-ECG** (ISO/IEEE 11073-91064): Formato binario compacto, soportado por ~70% de fabricantes, archivos hasta 40x menores que DICOM. Ideal para bajo ancho de banda.
- **DICOM ECG Waveform** (Supplement 30): Extiende DICOM para almacenar formas de onda. Se integra con PACS existente, pero **muy pocos visores DICOM renderizan waveforms correctamente**.
- **HL7 aECG**: XML basado en HL7v3, preferido por la FDA para ensayos clínicos, pero poco usado en práctica clínica diaria.
- **Formatos propietarios**: GE MUSE XML (el más extendido en hospitales grandes), Philips XML-ECG, Schiller SEMA. **Son la realidad dominante.**
- **PDF**: Muchos equipos económicos solo exportan PDF. Es el peor escenario para integración pero el más común en clínicas pequeñas.

### La realidad argentina con ECG

En la mayoría de los consultorios y sanatorios argentinos de mediana complejidad, **el ECG se imprime en papel térmico y se escanea** (o se le toma foto con el celular). Los equipos conectados digitalmente son minoría. Los equipos económicos como **Contec** (ECG300G, USD 500-1,500) y **Edan** (SE-3, SE-301) dominan el mercado de clínicas chicas, y solo exportan PDF via software propietario USB. En sanatorios medianos aparecen **Schiller** (AT-102 Plus, SCP-ECG, USD 3,000-15,000) y **Cardioline**. Los hospitales grandes tienen **GE MAC** con sistema MUSE o **Philips PageWriter** con IntelliSpace.

### Visualización web de ECG

Si se logra acceder a los datos crudos (arrays de voltaje muestreados a 500-1000 Hz, 12 derivaciones × 10 segundos = ~60,000 muestras), se pueden renderizar en web usando **D3.js** o **Canvas API** con grilla estándar (25 mm/s velocidad, 10 mm/mV sensibilidad, layout 3×4+1). Existen librerías especializadas como `ecg-data-process` (GitHub, open-source con filtrado y detección PQRST) y SciChart.js (comercial, GPU-accelerated). Un ECG completo ocupa solo **50-250 KB** dependiendo del formato.

### Tres niveles de integración ECG

- **Nivel 1** (1-2 semanas): Recibir PDF del ECG y adjuntarlo a la ficha del paciente. Es lo que hace el 90% de las clínicas argentinas.
- **Nivel 2** (4-6 semanas): Si el equipo soporta SCP-ECG o DICOM, usar ECG Toolkit (C#, Apache License) para parsear y visualizar con D3.js/Canvas.
- **Nivel 3** (2-3 meses): Integración DICOM completa con worklist y almacenamiento en mini-PACS (Orthanc).

> **¿Realmente necesito integración de ECG?** Para un sanatorio con Contec/Edan, el Nivel 1 (PDF adjunto) es suficiente. Para sanatorios con Schiller/Philips, el Nivel 2 es alcanzable pero no prioritario. Hay batallas más importantes que pelear primero.

---

## 4. Monitoreo de pacientes: por qué probablemente no lo necesitás todavía

### IEEE 11073: el estándar que casi nadie implementa directamente

IEEE 11073 es una familia de estándares para comunicación de dispositivos médicos que cubre monitores de cabecera, pulsioxímetros, bombas de infusión, ventiladores, termómetros y glucómetros. Define una nomenclatura de ~1,040 páginas de códigos (11073-10101), un perfil de aplicación para dispositivos personales (11073-20601), y especializaciones por tipo de dispositivo (11073-104xx). La versión moderna **SDC** (Service-oriented Device Connectivity) usa web services SOAP/WSDL con TLS para entornos de alta complejidad como UCIs.

En la práctica, **los monitores de cabecera de los grandes fabricantes** (Philips, GE, Mindray, Dräger) hablan sus propios protocolos propietarios o HL7v2, no IEEE 11073 directamente. La norma es más relevante para fabricantes de dispositivos que para integradores de software.

### Streams en tiempo real vs lecturas periódicas

La diferencia entre integración de monitoreo de UCI y lo que necesita un sanatorio es abismal:

| Tipo de dato | Frecuencia | Tamaño/paciente/día | Caso de uso |
|-------------|-----------|---------------------|-------------|
| Waveforms continuos (ECG, presión invasiva) | 125-500 Hz | 500 MB - 2 GB | UCI, investigación |
| Numéricos periódicos (FC, PA, SpO2) | 1/segundo | 10-50 MB | Monitoreo en tiempo real |
| Spot-check manual por enfermería | Cada 1-4 horas | 1-10 KB | Documentación clínica |

Un hospital de 42 camas UCI genera **300 GB/año** de waveforms comprimidos. Para un sanatorio mediano sin UCI dedicada o con una UTI pequeña, los monitores del mismo fabricante ya se comunican entre sí vía su propia central de monitoreo. La necesidad real no es procesar waveforms sino **documentar automáticamente** los signos vitales en la HCE.

### ¿Es relevante para un sanatorio?

Un sanatorio mediano en Córdoba típicamente tiene **5-15 camas de UTI** con monitores multiparamétricos por cama y una central en estación de enfermería, más 50-300 camas de internación general sin monitoreo continuo. La integración de monitoreo se vuelve necesaria cuando se quiere eliminar la transcripción manual, hay auditorías de calidad (ITAES, CENAS), o se implementa un sistema de alerta temprana (Early Warning Score).

### Integración mínima viable: entrada manual optimizada

**Nivel 0 (recomendado como inicio):** Enfermera lee el monitor, ingresa datos en la app, se guardan como Observation. Costo de desarrollo en integración de dispositivos: $0. Funciona con cualquier equipo. **La mayoría de los sanatorios argentinos operan exactamente así hoy.** Campos mínimos: frecuencia cardíaca, presión arterial (sistólica/diastólica), SpO2, frecuencia respiratoria, temperatura, hora.

**Nivel 1 (semi-automático):** Algunos monitores Mindray/Philips exportan datos vía HL7v2 ORU a intervalos. Mirth Connect traduce y escribe en la base de datos. Requiere acuerdo con el fabricante y configuración del engine.

> **¿Realmente necesito integración de monitoreo?** No, a menos que el sanatorio tenga UCI y exija eliminación de transcripción manual. Es la última prioridad de integración para un desarrollador solo. Diseñar la base de datos con estructura FHIR Observation permite escalar cuando sea necesario.

---

## 5. HL7v2: el protocolo feo, viejo e inevitable que mueve el 90% de los hospitales

### Anatomía de un mensaje HL7v2

Un mensaje HL7v2 es texto plano ASCII organizado jerárquicamente: **mensaje → segmentos → campos → componentes → subcomponentes**, separados por delimitadores `|`, `^`, `~`, `\`, `&`. Los segmentos se separan por retorno de carro (0x0D).

**Ejemplo completo anotado de un ORU^R01 (resultado de laboratorio):**

```
MSH|^~\&|LABSYS|LAB|HIS|HOSPITAL|20260330160000||ORU^R01|RES001|P|2.5
PID|1||MRN12345^^^HOSP^MR||GARCIA^MARIA^ELENA||19850215|F
PV1|1|I|MED^301^A
OBR|1|ORD456|FIL789|2951-2^Sodio sérico^LN|||20260330150000|||||||
  |1234^LOPEZ^ROBERTO^DR.|||||||20260330155500|||F
OBX|1|NM|2951-2^Sodio sérico^LN||139|mmol/L|136-145|N|||F
OBX|2|NM|2823-3^Potasio sérico^LN||4.2|mmol/L|3.5-5.0|N|||F
OBX|3|NM|2075-0^Cloruro sérico^LN||101|mmol/L|98-106|N|||F
```

El segmento **OBX** es donde viven los resultados reales. OBX-2 define el tipo de valor (`NM` numérico, `TX` texto, `CE` codificado), OBX-3 el código LOINC del observable, OBX-5 el valor, OBX-6 las unidades, OBX-7 el rango de referencia, OBX-8 los flags de anormalidad (`N` normal, `H` alto, `L` bajo, `HH`/`LL` críticos), y OBX-11 el estado (`F` final, `P` preliminar, `C` corregido).

### Los cuatro tipos de mensaje que importan

**ADT (Admit/Discharge/Transfer)** son los mensajes más frecuentes en cualquier hospital. ADT^A01 notifica una admisión, ADT^A04 un registro ambulatorio, ADT^A08 una actualización de datos, ADT^A03 un alta. Para una turnera, ADT^A04 es el más relevante: cada vez que un paciente se registra para una consulta, se genera este mensaje.

**ORM^O01 (Order Message)** se dispara cuando un médico coloca una orden de laboratorio, imagen o procedimiento. Contiene los segmentos ORC (control de orden) y OBR (detalle de solicitud). ORC-1 indica la acción: `NW` (nueva), `CA` (cancelar), `SC` (cambio de estado).

**ORU^R01 (Observation Result)** es el mensaje que llega cuando un analizador o servicio completa un estudio. Puede contener múltiples grupos OBR (uno por estudio), cada uno con sus propios OBX (resultados individuales). Es el mensaje más importante para integración de laboratorio.

**SIU (Scheduling)** maneja eventos de agenda: SIU^S12 (nueva cita), SIU^S13 (reprogramación), SIU^S14 (modificación), SIU^S15 (cancelación), SIU^S26 (no-show). **Para una turnera, estos son los mensajes más directamente relevantes.** Contienen el segmento SCH con IDs de cita, duración, horario, y estado.

### MLLP: cómo viajan los mensajes

HL7v2 viaja sobre TCP/IP envuelto en el protocolo MLLP (Minimal Lower Layer Protocol). El sobre es simple: **Start Block (0x0B) + mensaje + End Block (0x1C) + Carriage Return (0x0D)**. Cada mensaje requiere un ACK como respuesta con código AA (aceptado), AE (error), o AR (rechazado). **MLLP transmite en texto plano** por defecto — la mayoría de hospitales confía en la seguridad de la red interna (VLANs aisladas) o túneles VPN.

### Procesamiento en Mirth Connect

Mirth parsea HL7v2 internamente a XML y permite referenciar campos con sintaxis como `msg['PID']['PID.5']['PID.5.1']` o el shorthand `$('PID.5.1')`. Un canal típico para recibir resultados de laboratorio y enviarlos a Supabase tendría:

- **Source**: TCP Listener en puerto 6661, modo MLLP, tipo HL7v2
- **Filter**: Solo procesar `ORU^R01`
- **Transformer**: JavaScript que extrae PID (paciente), OBR (orden), OBX[] (resultados) y construye un JSON
- **Destination**: HTTP Sender que hace POST a `https://tuproyecto.supabase.co/rest/v1/lab_results`

**La advertencia honesta sobre complejidad:** Cada vendor implementa HL7v2 diferente. Los campos "opcionales" del estándar significan que nunca se sabe qué vendrá hasta ver datos reales del sistema específico. Los vendors agregan segmentos Z personalizados (ZPD, ZPI). Los caracteres especiales (acentos en español) causan problemas de parsing. Si tu sistema no responde ACK a tiempo, el emisor reenvía y generás duplicados. **No existe "HL7v2 genérico"**: cada interfaz es un acuerdo bilateral que requiere un documento de especificación y varias iteraciones de pruebas.

> **¿Realmente necesito HL7v2?** Sí, eventualmente. Es inevitable si vas a integrar analizadores de laboratorio, monitores, o cualquier sistema legacy. Pero no lo necesitás mientras todo se ingrese manualmente. Cuando llegue el momento, Mirth Connect absorbe la complejidad de HL7v2 para que tu app solo vea JSON/REST.

---

## 6. FHIR: el futuro que ya empezó pero todavía no llegó a los dispositivos

### Resources que un sanatorio necesita

FHIR (Fast Healthcare Interoperability Resources) define recursos JSON/XML con semántica médica estandarizada. Los relevantes para un sanatorio son:

**Patient** contiene demografía e identificadores. En Argentina, el DNI sería el identifier principal con system `http://www.renaper.gob.ar/dni`. **Encounter** representa visitas e internaciones. **Observation** es el recurso más versátil: cubre signos vitales, valores de laboratorio y mediciones de dispositivos, cada uno con código LOINC, valor, unidades y referencia al paciente. **DiagnosticReport** agrupa Observations en informes de laboratorio o imágenes. **ServiceRequest** reemplaza al ORM de HL7v2 para órdenes. **Schedule, Slot y Appointment** modelan exactamente lo que hace una turnera.

Ejemplo de un signo vital como Observation FHIR:

```json
{
  "resourceType": "Observation",
  "status": "final",
  "category": [{"coding": [{"code": "vital-signs"}]}],
  "code": {"coding": [{"system": "http://loinc.org", "code": "8867-4",
    "display": "Heart rate"}]},
  "subject": {"reference": "Patient/paciente-001"},
  "effectiveDateTime": "2026-03-28T16:00:00-03:00",
  "valueQuantity": {"value": 78, "unit": "beats/minute",
    "system": "http://unitsofmeasure.org", "code": "/min"}
}
```

### FHIR vs HL7v2: la realidad de los dispositivos legacy

**¿Puedo usar FHIR como estándar desde el inicio?** Para el modelo de datos interno, **sí**. Para comunicación con dispositivos físicos, **no**. Prácticamente ningún analizador de laboratorio ni monitor de cabecera habla FHIR nativamente en 2026. Los dispositivos siguen hablando ASTM y HL7v2. La solución es el **patrón de puente**: `Dispositivo → HL7v2/ASTM → Mirth Connect → FHIR → Tu app/BD`.

La estrategia óptima para un desarrollador solo es diseñar la base de datos con estructura FHIR desde el inicio (preparando para interoperabilidad futura), pero no intentar exponer una API FHIR completa ni instalar un servidor FHIR dedicado hasta que sea necesario.

### FHIR en Argentina: adopción temprana pero en movimiento

Argentina tiene un marco regulatorio que **adopta FHIR oficialmente**. La Resolución 115/2019 creó la **Red Nacional de Interoperabilidad en Salud** que usa FHIR R4. Existen **Guías de Implementación Core-AR** publicadas en `https://guias.hl7.org.ar/site/index.html` y en Simplifier (`simplifier.net/saluddigital.ar`). El primer documento de intercambio nacional se basa en el IPS (International Patient Summary): diagnósticos, alergias, medicamentos y vacunas.

**HL7 Argentina** es un capítulo afiliado desde 2001, liderado por Diego Kaminker (Deputy Chief Standards Implementation Officer de HL7 Internacional). Dicta cursos certificados en HL7, FHIR y Mirth Connect. El **Hospital Italiano de Buenos Aires** es líder en implementaciones FHIR en el país. El sistema público **HSI** (Historia de Salud Integrada) trabaja hacia la portabilidad de la HCE para 2026. Los estándares adoptados son **FHIR** (interoperabilidad), **SNOMED CT** (terminología clínica, edición argentina gratuita), **CIE-10/11** (clasificación estadística), y **LOINC** (laboratorio).

Los sanatorios privados **no están obligados** a conectarse a la Red Nacional todavía, pero la tendencia regulatoria es clara. Diseñar tu sistema compatible con FHIR hoy es una inversión que se pagará sola.

### FHIR + Supabase: el enfoque híbrido práctico

Se pueden almacenar recursos FHIR directamente en PostgreSQL/Supabase usando **columnas JSONB** con columnas desnormalizadas para búsquedas frecuentes:

```sql
CREATE TABLE fhir_observation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource JSONB NOT NULL,             -- Recurso FHIR completo
  patient_id UUID,                     -- FK desnormalizada
  category TEXT,                       -- 'vital-signs', 'laboratory'
  code_loinc TEXT,                     -- Código LOINC
  effective_date TIMESTAMPTZ,
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_obs_resource ON fhir_observation USING GIN (resource);
CREATE INDEX idx_obs_patient ON fhir_observation (patient_id);
```

Este enfoque híbrido ofrece un solo stack tecnológico (PostgreSQL), RLS de Supabase para control de acceso, Realtime para notificaciones, y datos que **ya están en formato FHIR cuando necesites interoperar**. Lo que se pierde vs un servidor FHIR dedicado es validación automática de recursos, búsqueda FHIR nativa (_include, chaining), Capability Statement, y soporte SMART on FHIR. Cuando llegue el momento de conectarse a la Red Nacional, se puede poner HAPI FHIR o Aidbox **delante** de Supabase como capa de interoperabilidad.

> **¿Realmente necesito FHIR?** No como servidor dedicado, pero sí como modelo de datos. Almacenar datos clínicos con estructura FHIR en Supabase es la decisión más inteligente a largo plazo: usás un modelo probado por décadas de consenso internacional, y cuando necesites interoperar, tus datos ya están listos.

---

## 7. Evaluación de viabilidad: el roadmap honesto para un desarrollador solo

### El contexto real

Estás construyendo una turnera que se expande a sistema de sanatorio, con primer cliente en Córdoba, usando Next.js + Supabase. El mercado argentino de software de salud tiene competidores establecidos: **Geclisa/Macena** (Córdoba, 30+ años, 200+ clientes), **TIPs Salud** (nacido del Hospital Privado de Córdoba), **LandaMed** (Córdoba, ISO/CMMI), entre otros. La diferenciación posible está en ser cloud-native, mobile-first, con UX superior y precios competitivos.

El marco regulatorio argentino exige cumplir con la **Ley 26.529** (HCE: integridad, autenticidad, inalterabilidad, audit trail), la **Ley 25.326** (protección de datos personales, datos de salud son sensibles), la **Ley 27.553** (receta electrónica, plataformas deben registrarse en ReNaPDiS), y la reciente **Ley 27.706** (HCE Nacional, implementación progresiva). **No existe certificación obligatoria tipo FDA** para software administrativo de salud, pero ANMAT puede considerar ciertos software como "producto médico" si están destinados al diagnóstico.

### ¿Necesito un integration engine desde el día 1?

**No.** Mientras tu sistema solo maneje turnos, HCE y facturación con entrada manual, no hay mensajes HL7v2 que enrutar ni dispositivos que integrar. Instalar Mirth Connect el primer día es overengineering que consume tiempo de configuración y mantenimiento sin beneficio inmediato. **El trigger para instalar Mirth es el momento en que un dispositivo físico necesita enviar datos automáticamente a tu sistema** — típicamente un analizador de laboratorio o un PACS.

### ¿Puedo evitar HL7v2 completamente?

**No si vas a integrar dispositivos legacy, que es la inmensa mayoría del parque instalado.** Pero sí podés postergar HL7v2 significativamente. Para DICOM (imágenes), la integración con PACS como Orthanc usa API REST además de DICOM. Para laboratorio, existe ASTM directo. Para ECG, muchos equipos exportan archivos. HL7v2 se vuelve inevitable cuando necesitás un flujo de órdenes bidireccional estandarizado entre tu HIS y múltiples sistemas, o cuando el sanatorio ya tiene sistemas que emiten HL7v2 y esperan que los consumas.

### El riesgo de construir demasiado vs muy poco

**Demasiada infraestructura temprana** significa meses invertidos en Mirth Connect, canales HL7v2, servidor FHIR, interfaces de dispositivos — sin usuarios que los usen. El riesgo es quedarse sin runway (tiempo/dinero) antes de tener un producto que genere valor real. **Muy poca infraestructura** significa que cuando el sanatorio pida "quiero que los resultados de laboratorio aparezcan automáticamente", tu sistema no esté preparado y debas hacer cirugía mayor en la base de datos.

**La solución es modelar bien desde el inicio (estructura FHIR en Supabase) pero no implementar middleware hasta que haya un caso de uso real.** Si tu modelo de datos es sólido, agregar Mirth Connect después es enchufar un traductor entre el mundo externo y tu base de datos bien diseñada.

### Roadmap de integración por fases para un desarrollador solo

**Fase 1 — Turnera + HCE básica (meses 1-4)**
- Sistema de turnos completo (Schedule, Slot, Appointment en estructura FHIR)
- HCE básica: datos demográficos del paciente, antecedentes, notas de consulta
- Modelo de datos en Supabase con JSONB para recursos FHIR
- Entrada manual de todo: signos vitales, resultados, etc.
- Facturación básica a obras sociales (nomenclador)
- **Middleware necesario: ninguno.** Cero integración de dispositivos.
- **Valor entregado: reemplazar la agenda en papel y el sistema de turnos legacy**

**Fase 2 — PACS e imágenes (meses 5-8)**
- Integrar con Orthanc (mini-PACS open-source) para almacenar/visualizar DICOM
- Orthanc tiene API REST nativa — se conecta directamente a Next.js sin Mirth
- Viewer web: OHIF Viewer o Stone of Orthanc (open-source)
- DICOM Worklist para que las modalidades reciban datos del paciente automáticamente
- **Middleware necesario: Orthanc solamente.** No necesitás Mirth para DICOM.
- **Valor entregado: el sanatorio deja de quemar CDs y tiene imágenes accesibles desde cualquier puesto**

**Fase 3 — Laboratorio básico (meses 9-14)**
- Identificar el analizador específico del sanatorio (probablemente Wiener o Mindray)
- Implementar receptor ASTM para recibir resultados (python-astm o custom)
- Si el analizador habla HL7v2 → instalar **Mirth Connect 4.5.2** (Docker)
- Primer canal Mirth: recibir ORU^R01 → transformar → POST a Supabase
- Opcionalmente: enviar work lists al analizador (bidireccional)
- **Middleware necesario: posiblemente Mirth Connect (si el flujo es HL7v2). Alternativa: receptor ASTM directo.**
- **Valor entregado: resultados de laboratorio aparecen automáticamente en la HCE**

**Fase 4 — Flujo de pacientes y órdenes (meses 15-20)**
- Mensajes ADT para registro/alta/transferencia (si hay sistemas externos que los necesiten)
- Órdenes electrónicas (ORM) para laboratorio e imágenes
- SIU para sincronizar turnos con sistemas externos
- Canales adicionales en Mirth Connect para cada flujo
- Receta electrónica (registrarse en ReNaPDiS)
- **Middleware necesario: Mirth Connect con múltiples canales**

**Fase 5 — Portal de pacientes, facturación avanzada, IA (meses 20+)**
- Portal web para que pacientes vean turnos, resultados, imágenes
- Facturación avanzada con integración a obras sociales
- Dictado con IA para informes médicos
- Integración con la Red Nacional de Salud Digital (exponer FHIR)
- En este punto, considerar HAPI FHIR como capa de interoperabilidad
- Monitoreo de signos vitales automatizado (solo si hay UCI con demanda real)

### El middleware mínimo para un sanatorio con imágenes + laboratorio básico

Para un único sanatorio en Córdoba con máquinas de imágenes y laboratorio básico, el stack mínimo viable es:

```
Next.js + Supabase (app principal)
     ↕ REST API
Orthanc (PACS, gratuito, Docker)
     ↕ DICOM
[Tomógrafo, Rayos X, Ecógrafo]

Mirth Connect 4.5.2 (solo si el lab habla HL7v2)
     ↕ TCP/MLLP o ASTM
[Analizador de laboratorio]
```

**Costo total del middleware: $0 en licencias.** Orthanc es open-source (C++), Mirth 4.5.2 es open-source (Java). El único costo es el servidor: una instancia cloud de USD 30-80/mes o un servidor físico en el sanatorio.

## Conclusión: el pragmatismo como estrategia de supervivencia

La lección más importante de esta investigación es que **la integración médica es un problema de décadas de complejidad acumulada, pero un desarrollador solo no necesita resolverlo todo**. Los estándares HL7v2, ASTM, DICOM, IEEE 11073 y FHIR existen porque los hospitales grandes conectan docenas de sistemas de múltiples fabricantes. Un sanatorio mediano con un solo sistema nuevo tiene la ventaja de empezar limpio.

La decisión arquitectónica más valiosa que se puede tomar hoy es **modelar datos internamente con estructura FHIR en Supabase**, sin instalar servidor FHIR dedicado. Esto da un modelo de datos probado internacionalmente, compatibilidad futura con la Red Nacional argentina, y cero overhead de middleware hasta que sea necesario. Cuando aparezca el primer dispositivo que necesite hablar HL7v2 o ASTM, Mirth Connect 4.5.2 en Docker se instala en 30 minutos y actúa como traductor entre el mundo legacy y tu base de datos moderna. Hasta ese momento, cada hora invertida en middleware es una hora robada al producto que realmente necesita el sanatorio: **una turnera que funcione, una HCE que sea rápida, y una facturación que no pierda plata con las obras sociales.**