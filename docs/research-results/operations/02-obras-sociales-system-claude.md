# Sistema de obras sociales argentino: guía completa para construir una turnera SaaS

**Argentina opera uno de los sistemas de salud más fragmentados del mundo, con más de 300 financiadores distintos, cada uno con reglas propias de autorización, coseguros y facturación.** Para un desarrollador construyendo una turnera, esto significa que el manejo de obra social no es un "campo de texto libre" sino un dominio de negocio complejo que define la viabilidad del producto. Este informe documenta cada aspecto del sistema desde la perspectiva operativa de la secretaria administrativa de una clínica, con datos específicos de campos, portales reales, flujos paso a paso y una propuesta de modelo de datos para un MVP.

---

## 1. El mapa de financiadores: quiénes pagan y cuántos son

El sistema de salud argentino se divide en tres subsectores superpuestos. Según el Censo 2022 (INDEC), el **60,9% de la población** tiene cobertura de obra social, prepaga o PAMI; el resto depende del sistema público.

| Tipo de financiador | Cantidad de entidades | Beneficiarios aprox. | % típico en una clínica urbana |
|---|---|---|---|
| **Obras sociales sindicales (OSN)** | ~292 registradas en la SSS | ~14 millones | 25-35% |
| **Obras sociales provinciales (OSP)** | 24 (una por jurisdicción) | ~7 millones | 10-20% (varía por zona) |
| **PAMI (INSSJP)** | 1 | ~5,3 millones | 15-25% |
| **Prepagas** (OSDE, Swiss Medical, Galeno, Medifé, Omint, Sancor Salud, Medicus) | ~50 relevantes | ~6,3 millones | 20-30% |
| **Incluir Salud / programas estatales** | Variable | Cientos de miles | 2-5% |
| **Particular (sin cobertura)** | N/A | Variable | 3-8% |

**Una clínica mediana urbana típicamente trabaja con 20 a 40 financiadores distintos de forma regular**, aunque puede tener convenios con muchos más. Sin embargo, el **80% del volumen de pacientes se concentra en 5-10 entidades principales**: PAMI, la OS provincial local (por ejemplo, IOMA en Buenos Aires), OSECAC (comercio), y 3-4 prepagas grandes (OSDE, Swiss Medical, Galeno). Las ~290 OS sindicales restantes tienen una distribución muy desigual: las top 10 concentran más del 50% de los beneficiarios, mientras que muchas OS pequeñas tienen menos de 500 afiliados.

### Diferencia práctica entre obra social y prepaga para la clínica

Desde la perspectiva administrativa, la distinción importa en cinco dimensiones clave:

**Aranceles y tiempos de pago**: las prepagas generalmente pagan más por prestación y en plazos más cortos (**30-45 días** vs. **60-90 días** de las OS sindicales). Las OS sindicales pequeñas pueden demorar **90-120+ días**.

**Planes y coseguros**: las prepagas manejan múltiples planes con diferente cobertura (OSDE 210, 310, 410, 510). Los planes altos suelen tener coseguro cero en consultas. Las OS sindicales típicamente tienen un plan base PMO con coseguros obligatorios.

**Autorizaciones**: las prepagas tienden a tener portales digitales más ágiles y permiten acceso directo a especialistas en planes altos. Muchas OS sindicales requieren derivación del médico de cabecera y autorizaciones manuales (teléfono, email).

**Facturación**: cada financiador tiene su propio formato de presentación, nomenclador de referencia y reglas de documentación respaldatoria. No existe un sistema unificado nacional.

**Sistemas digitales**: las prepagas grandes (OSDE, Swiss Medical, Galeno, Medifé) tienen portales de prestadores funcionales. Muchas OS sindicales aún operan con fax, email o presentación física en el círculo médico local.

### El rol de las gerenciadoras

Un concepto crítico para el desarrollador: muchas OS sindicales delegan la administración de sus prestaciones a **gerenciadoras** — empresas intermediarias como RAS, Conexión Salud, EnSalud, ROISA o Well Being. La clínica no factura a la OS directamente sino a la gerenciadora. La credencial del paciente puede mostrar el nombre de la gerenciadora en lugar de la OS. El sistema debe contemplar esta capa intermedia.

---

## 2. El flujo de autorización: cuándo, cómo y con qué datos

### Qué prácticas requieren autorización previa

La regla general es: **consulta médica simple en consultorio NO requiere autorización**; casi todo lo demás sí, en mayor o menor grado.

**Siempre requieren autorización previa:**
- Internaciones y cirugías (ambulatorias e internadas)
- Estudios de alta complejidad: tomografía computada (TAC), resonancia magnética (RMN), medicina nuclear, hemodinamia
- Endoscopías (todas las especialidades)
- Densitometría ósea, mamografía, angiografía
- Cardiología avanzada: ergometría, ecocardiograma, Holter
- Neurología: EEG, EMG
- Todas las prácticas de oftalmología
- Sesiones de salud mental (psicología/psiquiatría) — se autorizan en bloques (típicamente 2 meses iniciales, luego renovación cada 4 meses)
- Rehabilitación: kinesiología, fonoaudiología
- Hemoterapia

**Típicamente NO requieren autorización:**
- Consultas médicas de consultorio con prestador de cartilla
- Emergencias/urgencias (se regulariza dentro de las 48 hs posteriores)
- Laboratorio básico (hasta cierto umbral de complejidad)
- Radiología simple (Rx convencional)
- Estudios del Plan Materno Infantil

**Dato técnico importante**: existe un umbral informal basado en el código del Nomenclador Nacional — prácticas por debajo del **código ~1200** generalmente no requieren autorización; por encima del **código ~2000** la requieren casi siempre. Pero esto varía por OS.

### Cómo solicita la secretaria la autorización

| Canal | Uso actual | OS que lo usan |
|---|---|---|
| **Portal web de prestadores** | Dominante en prepagas grandes | OSDE (Extranet), Swiss Medical (portal prestadores), Medifé (nuevo sistema desde feb 2025), Galeno (webapp liquidación) |
| **App del prestador** | Creciente | Swiss Medical (app prestadores con validación y escaneo QR), Galeno (App Galeno) |
| **Teléfono (0810/0800)** | Aún muy común, especialmente para OS sindicales | OSDE: 0810-666-6733, Galeno: 0810-222-7828, PAMI: 0800-222-2210 |
| **Email con orden escaneada** | Frecuente en OS medianas | Muchas OS sindicales, OSPJN (autorizaciones@ospjn.gov.ar), IOSFA |
| **WhatsApp** | Adoptado post-COVID, especialmente en provincias | PAMI: +54 9 11 4199-1265, algunas OS provinciales |
| **Fax** | Residual, casi extinto | Algunas mutuales pequeñas, OS provinciales del interior |
| **Presencial en delegación de la OS** | Cada vez menos común | Para autorizaciones complejas de cualquier OS |

### Tiempos de autorización

- **Automática/instantánea**: sistemas de validación en línea (OS conectadas con el prestador en tiempo real)
- **24-48 horas hábiles**: solicitudes estándar por portal/email (OSPJN confirma dentro de 48 hs)
- **3-5 días hábiles**: procedimientos que requieren revisión por auditoría médica
- **Semanas**: cirugías de alta complejidad, prácticas no nomencladas, tratamientos oncológicos costosos
- **Emergencias**: no requieren autorización previa; se regulariza post-facto en 48 hs hábiles

### Datos requeridos para una solicitud de autorización

Este es el set de campos que el sistema debe capturar:

- **DNI del paciente**
- **Número de afiliado** (credencial) y **plan**
- **Barra de parentesco** (titular, cónyuge "E", hijo "H" con numeración)
- **Código de práctica** del Nomenclador Nacional o descripción
- **Diagnóstico** preferentemente en **código CIE-10** (o DSM-5 para salud mental)
- **Datos del médico prescriptor**: nombre completo, matrícula (nacional y/o provincial), especialidad, firma y sello
- **Fecha de la prescripción** (las órdenes vencen a los **30 días**)
- **Para cirugías**: fecha, institución, materiales/implantes (en nombres genéricos)
- **Para procedimientos complejos**: resumen de historia clínica adjunto
- **Firma del paciente** en la orden

### Si la autorización es denegada

El paciente puede: apelar ante la OS, presentar reclamo ante la **Superintendencia de Servicios de Salud (SSSalud)**, solicitar un **amparo judicial**, o pagar la prestación como **particular**. La clínica puede atenderlo bajo cualquier modalidad.

---

## 3. Coseguros: montos reales, reglas y el impacto de la liberalización 2024

### El cambio de paradigma: Resolución 1926/2024

Hasta junio de 2024, la SSSalud fijaba topes máximos para coseguros (por ejemplo, ~$2.019 para generalista, ~$3.786 para especialista en marzo 2024). La **Resolución 1926/2024** eliminó estos topes, permitiendo que cada OS fije libremente sus coseguros. Esto multiplicó los montos y generó gran disparidad entre entidades.

### Valores reales de coseguro: ejemplo OSECAC (marzo 2026)

OSECAC (Empleados de Comercio, ~2 millones de beneficiarios) publicó estos valores vigentes al 26/03/2026:

| Prestación | Coseguro (ARS) |
|---|---|
| Consulta generalista/familia | $11.300 |
| Consulta especialista | $18.050 |
| Consulta virtual generalista | $12.300 |
| Consulta virtual especialista | $19.800 |
| Imágenes simples (eco, Rx) | $5.500 |
| Imágenes mediana complejidad | $11.350 |
| Imágenes alta complejidad (RMN, TAC) | $27.150 |
| Laboratorio hasta 6 determinaciones | $5.600 |
| Sesión salud mental (1-30) | $10.050 |
| Odontología general | $10.700 |
| Emergencia domiciliaria diurna | $27.950 |

### Prestaciones exentas de coseguro (coseguro cero obligatorio)

Por normativa, **nunca se cobra coseguro** por: oncología, discapacidad (Ley 24.901), Plan Materno Infantil (embarazo + hijo hasta 1 año), HIV/SIDA/hepatitis, trasplantes, programas preventivos (PAP, mamografía screening), emergencias, diabetes, enfermería, internaciones y cirugías.

### Cuándo y cómo se cobra el coseguro

**Se cobra al momento de recibir la prestación, nunca antes.** En la práctica, la secretaria lo cobra al check-in (cuando el paciente presenta la credencial) o al finalizar la consulta. La clínica emite un comprobante fiscal por el monto del coseguro.

**¿Cómo sabe la secretaria el monto?** Combina varias fuentes:
- **Tablas publicadas** por cada OS en su sitio web (como el ejemplo de OSECAC)
- **Portal de prestadores** de la OS que muestra el monto al validar al afiliado
- **Software médico** que importa aranceles del nomenclador (LandaMed, por ejemplo)
- **Consulta telefónica** a la OS para casos dudosos
- **Memoria** para las OS frecuentes — las secretarias experimentadas memorizan los valores de sus 5-10 OS principales

### Planes y su impacto en coseguros: el caso OSDE

OSDE tiene planes **210, 310, 410, 450, 510**. Los planes estándar (210-510) históricamente **no cobran coseguro en consultas con prestadores de cartilla**. La diferencia entre planes se da en amplitud de cartilla (qué sanatorios/profesionales incluyen), niveles de reintegro y beneficios adicionales. Solo el plan contingencia 6030 incluye copagos en prestaciones ambulatorias. Las cuotas mensuales (marzo 2026, 1 persona de 30 años) van desde ~$245.000 (plan 210) hasta ~$1.044.000 (plan 510).

### El "plus médico" o "bono complementario"

Desde octubre 2024, más de 40 asociaciones médicas implementaron un **honorario mínimo ético** cobrado directamente al paciente, por encima de lo que paga la OS/prepaga. Inicialmente $6.000 por consulta. **Es distinto del coseguro**: el coseguro va a la OS, el plus va al médico. La legalidad es disputada. Para la secretaria, implica explicar al paciente que puede tener que pagar **dos montos separados**. El sistema debería contemplar este campo.

### Doble cobertura

En Argentina **no existe un sistema formal de coordinación de beneficios** como en Estados Unidos. El Decreto 292/95 prohíbe afiliación simultánea a más de una OS, pero en la práctica existen excepciones (pluriempleo, monotributo + empleo, jubilado que sigue trabajando, empleado provincial + nacional). La solución estándar es la **unificación de aportes** en una sola OS. **No se puede facturar la misma prestación a dos OS.** La secretaria debe preguntar si el paciente tiene otra cobertura.

---

## 4. Facturación: el ciclo mensual que define el flujo de caja

### El flujo completo paso a paso

**1. Durante la atención**: el médico completa la orden médica con diagnóstico, códigos de práctica, firma, sello. El paciente firma la orden (conformidad del afiliado) con nombre, aclaración y DNI. **Cualquier dato faltante = débito garantizado.**

**2. Registro inmediato**: la secretaria ingresa la prestación en el sistema: datos del paciente, OS, plan, código(s) de nomenclador, fecha, coseguro cobrado, número de autorización.

**3. Acumulación mensual**: las prestaciones se agrupan por OS durante el mes.

**4. Cierre y liquidación (típicamente el 26 del mes)**: se compila la **liquidación** — el lote de todas las prestaciones para cada OS en el período. Se hace **prefacturación** (revisión interna de documentación completa).

**5. Factura fiscal (AFIP/ARCA)**: se genera la factura electrónica con CAE. **Punto crítico**: los afiliados obligatorios están **exentos de IVA**, los voluntarios tributan **10,5% de IVA** — deben facturarse por separado.

**6. Presentación**: la factura + documentación respaldatoria (planilla de prestaciones, órdenes médicas originales, autorizaciones) se envía a la OS, gerenciadora o círculo médico. Cada OS tiene su formato y canal.

**7. Auditoría de la OS**: la OS revisa la presentación y aplica **débitos** (deducciones) por errores.

**8. Pago**: la OS deposita el monto aceptado.

### El Nomenclador: la columna vertebral del sistema

El **Nomenclador Nacional de Prestaciones Médicas** es el catálogo estandarizado de códigos que clasifica y valoriza cada servicio médico. Cada prestación tiene un código único usado para autorizaciones, facturación y cobertura.

| Nomenclador | Ámbito | Autoridad |
|---|---|---|
| **Nomenclador Nacional (NN)** | Consultas, internaciones, cirugías, imágenes | Ministerio de Salud / SSSalud |
| **Nomenclador Bioquímico Único (NBU)** | Laboratorio/bioquímica | CUBRA |
| **Nomenclador PAMI (NC)** | Todo PAMI — sistema de módulos | INSSJP |
| **Nomencladores provinciales** | Empleados provinciales | Cada provincia (ej: Mendoza Ley 9535 con UAM/UQM) |
| **Nomenclador de discapacidad** | Prestaciones Ley 24.901 | Ministerio de Salud |

El nomenclador determina: qué es la práctica, su precio base, si requiere autorización, si está cubierta por PMO y la fórmula arancelaria (código × valor unidad según convenio).

### Tiempos de pago reales

| Financiador | Plazo típico de pago |
|---|---|
| Prepagas grandes (OSDE, Swiss Medical) | **30-45 días** |
| OS sindicales grandes (OSECAC) | **60-90 días** |
| OS sindicales pequeñas | **90-120+ días** |
| PAMI | **60-90 días nominales**, pero en crisis pueden ser meses |
| OS provinciales (IOMA, etc.) | **60-120 días**, variable |
| Incluir Salud | **90-120+ días**, crisis de deuda recurrente |

### Débitos: la pesadilla administrativa

Los **débitos** son deducciones que aplica la OS al auditar la facturación. Representan dinero que la clínica ya contaba como ingreso pero no cobrará. Las **causas más comunes**:

- Falta de firma del paciente, aclaración o DNI en la orden
- Falta de firma y sello del médico
- Falta de diagnóstico en la orden
- Cambio de color de tinta dentro de la misma orden
- Fechas de orden fuera del período facturado
- Número de autorización faltante o inválido
- Paciente no encontrado en el padrón de la OS
- Credencial vencida
- Superación de frecuencia permitida (ej: >2 consultas del mismo paciente en 30 días sin historia clínica)
- Coseguro no cobrado o mal informado
- Plan incorrecto

Ante un débito, el prestador tiene **15 días** para solicitar **auditoría compartida** (reunión conjunta con la OS). Las órdenes corregidas pueden refacturarse en el período siguiente. El sistema debe rastrear débitos, motivos y estado de refacturación.

### No existe un sistema unificado de facturación

**Cada OS tiene su propio canal de presentación.** Este es el dato más importante para el desarrollador: no hay un "gateway" centralizado. Algunas OS usan portales web propios, otras reciben presentación física en sobres rotulados, otras operan a través de círculos médicos/federaciones como intermediarios (Evweb es la plataforma tecnológica que potencia muchos de estos). PAMI tiene su propio SII. Las prepagas tienen sus extranets. El sistema debe poder generar distintos formatos de salida según la OS.

---

## 5. PAMI: el gigante con reglas propias

PAMI (INSSJP) es la **obra social más grande de Latinoamérica** con **5,3 millones de beneficiarios**. Representa entre el **15% y 25%** de los pacientes de una clínica urbana típica, y puede llegar al **30-40%** en zonas con demografía envejecida o en especialidades como cardiología, oftalmología y geriatría.

### Diferencias operativas fundamentales de PAMI

**Nomenclador propio**: el "Nomenclador Común del INSSJP" tiene códigos, valores y estructura distintos al Nomenclador Nacional. Organizado en **módulos** numerados (Módulo 1 = médico de cabecera, Módulo 6 = especialistas, Módulos 417-558 para especialidades específicas, Módulo 23 = RMN, Módulo 24 = TAC).

**Sistema de capitation**: para atención de Nivel I/II, PAMI paga un **monto capitado mensual** por la población asignada al prestador, no por servicio. La Res. 375/2026 introdujo el "Pago Capitado con Metas por Tasas de Uso".

**Orden Médica Electrónica (OME)**: desde 2022, el médico de cabecera genera órdenes electrónicas a través del sistema OME para prácticas, estudios y derivaciones a especialistas. Las OME tienen validez de **90 días**.

**Multinivel de autorización**: (a) auto-autorizado para prácticas simples, (b) autorización UGL (Unidad de Gestión Local) para complejidad moderada, (c) autorización central para alta complejidad.

**Credencial con QR obligatorio**: PAMI acepta 4 tipos de credencial (digital en app Mi PAMI, plástica, provisoria con QR, provisoria con ticket). Todas se validan por **código QR**. El número de afiliado tiene **14 dígitos**.

### Sistemas digitales de PAMI para prestadores

| Sistema | Función |
|---|---|
| **SII** (Sistema Interactivo de Información) | Portal principal: OP, facturación, nomenclador, padrón |
| **OME** (Orden Médica Electrónica) | Prescripción electrónica por médicos de cabecera |
| **CUP** (Clave Única PAMI) | Autenticación unificada para todos los sistemas |
| **Facturación Unificada** | Carga y seguimiento de facturas |
| **Mis Pagos** | Consulta de órdenes de pago y saldos |
| **Receta Electrónica** | Prescripción de medicamentos |
| **TAD** (Trámites a Distancia) | Presentación de facturación nivel central |

**Flujo de facturación PAMI**: prestaciones transmitidas por el **15 del mes siguiente** → auditoría y conformación de montos → prestador emite factura electrónica vía ARCA que coincida con montos PAMI → carga en SII → estados: PENDIENTE DE CARGA → PENDIENTE → RECIBIDO → PAGADO.

---

## 6. Lo que hace la secretaria en cada momento del recorrido del paciente

### Al asignar el turno

La secretaria debe recopilar como mínimo:

- **Nombre y apellido** del paciente
- **DNI**
- **Nombre de la obra social/prepaga** (selección de lista, no texto libre)
- **Plan/nivel** (ej: OSDE 310, OSECAC PMO)
- **Número de afiliado** (credencial)
- **Tipo de práctica solicitada** (consulta, estudio específico)
- **Si la práctica requiere autorización** para esa OS específica → alertar al paciente para que la gestione
- **Teléfono/email** para recordatorios

**Validación ideal (si el sistema lo permite)**: verificar el estado del afiliado en el padrón de la SSSalud (por CUIL/DNI) para confirmar que la cobertura está activa.

### Al check-in (llegada del paciente)

1. **Verificar credencial**: revisar vigencia, verificar identidad con DNI
2. **Validar padrón**: confirmar estado activo en el sistema de la OS (portal, SSSalud, o CODEM de ANSES)
3. **Confirmar autorización**: si la práctica la requiere, verificar que existe y registrar el número
4. **Cobrar coseguro**: informar el monto, cobrar, emitir comprobante fiscal
5. **Documentación**: entregar la orden/bono/cupón al paciente para que la presente al médico; asegurarse de que el paciente firmará la orden durante la consulta

### Durante la consulta

- Asegurar que la orden médica esté disponible para que el médico la complete
- Si el médico solicita prácticas adicionales, coordinar nuevas autorizaciones
- **Obtener la conformidad del afiliado** en la orden: firma, nombre impreso y DNI del paciente **durante** la consulta (no después — causa frecuente de débito)

### Después de la consulta

- Registrar la prestación completa en el sistema con todos los campos
- Verificar que la orden tiene todos los datos completos (firma y sello del médico, diagnóstico, firma del paciente)
- Archivar la orden física organizándola por OS en sobres/bolsas rotuladas para la presentación mensual
- Si hay órdenes de períodos anteriores debitadas y corregibles, prepararlas para refacturación

### Cierre de mes (la semana más intensa)

1. **Agrupar prestaciones por OS y plan** (facturando por separado afiliados obligatorios vs. voluntarios por tratamiento de IVA distinto)
2. **Preparar planilla de prestaciones** (resumen detallado por OS)
3. **Ejecutar liquidación** en el sistema: verificar precios contra convenio vigente, descontar coseguros cobrados
4. **Generar factura electrónica** vía ARCA con CAE
5. **Compilar paquete de presentación**: factura + preliquidación + órdenes originales + autorizaciones + informes médicos donde corresponda
6. **Entregar a cada OS** por su canal específico (portal, círculo médico, gerenciadora, correo)
7. **Archivar copias** hasta liquidación y pago final
8. **Fecha límite típica: día 26 del mes** — perder el cierre desplaza la facturación un mes completo

---

## 7. Software existente en Argentina: qué hacen y qué les falta

### Clasificación del mercado por nivel de integración con OS

**Nivel 1 — Solo agenda (sin manejo de OS)**: Turnito, AgendaPro, MedTurnos. Son plataformas genéricas multi-industria. La OS es, como mucho, un campo de texto. Precio: ~$5.000-12.000 ARS/mes.

**Nivel 2 — Agenda + HCE básica**: DigiDoc, PlexoMedica, DrApp/Wiri Salud. Muestran qué OS acepta el médico en su perfil web. DrApp/Wiri pivotó a marketplace que **evita intencionalmente** el sistema de OS (modelo pago directo del paciente). No hay facturación a OS.

**Nivel 3 — Agenda + HCE + Facturación + OS**: MedicAI, Medicloud, SaludTotal. Tienen módulo de liquidación de OS e integración ARCA para factura electrónica. Registran prestaciones por OS para conciliación. MedicAI usa encriptación AES-256, FHIR export, IA clínica (SENTINEL). Precio: ~$25.000+ ARS/mes.

**Legacy comprehensivo — Desktop + OS completo**: LandaMed y Emprenet. Son los más completos en manejo de OS. LandaMed soporta formatos de facturación específicos para PAMI, OSDE, Medifé, Swiss Medical, Galeno, Omint y otros. Emprenet tiene parametrización ilimitada de OS/planes, alerta al reservar turno si el médico no trabaja con esa OS, validación automática de afiliado. Pero son **sistemas legacy**, instalados en desktop, con UX datada.

**Infraestructura de facturación** (no turneras): Evweb es la plataforma SaaS que usan los **círculos médicos y federaciones** de todo el país para procesar la facturación de médicos individuales a las OS. Procesó más de 50.000 millones de pesos y 7 millones de prácticas en 2022. Esto revela que muchos médicos del interior **no facturan directamente** a las OS sino a través de sus círculos médicos.

### Portales de OS para prestadores: el estado del arte

| OS/Prepaga | Portal prestadores | Funciones clave |
|---|---|---|
| **OSDE** | extranet.osde.com.ar | Auto-emisión de autorizaciones, validación de afiliados, cuenta corriente, turnos online para pacientes OSDE, **HL7 FHIR para receta electrónica** |
| **Swiss Medical** | swissmedical.ospoce.com.ar | Validación de afiliados, escaneo de credencial QR, informar prestaciones, censos de internación |
| **Medifé** | web.medife.com.ar/prestadores | Autorizaciones online (nuevo desde feb 2025), pagos, datos bancarios via plataforma "Nexo" |
| **Galeno** | webapp.galeno.com.ar/prestadores-liq-web | Liquidación, autorizaciones telefónicas diferenciadas por plan, sistema POS para registrar prestaciones |
| **PAMI** | prestadores.pami.org.ar (CUP/SII/OME) | Sistema completo propio: OME, SII, facturación unificada, padrón, nomenclador |

**Hallazgo crítico: ninguna OS o prepaga en Argentina ofrece una API pública para integración de terceros** para autorización, facturación o verificación de elegibilidad. La única excepción parcial es OSDE con HL7 FHIR limitado a receta electrónica. Todo lo demás son portales web propietarios y cerrados.

### La brecha entre lo que existe y lo que la secretaria necesita

| Necesidad real de la secretaria | Lo que ofrece el software actual | Brecha |
|---|---|---|
| Saber al instante si la OS del paciente está activa | Campo de texto o dropdown de OS | Sin verificación en tiempo real contra padrones |
| Conocer el coseguro exacto para OS + plan + práctica | Ingreso manual del monto | Sin cálculo automático |
| Saber si la práctica requiere autorización para esta OS | Consulta manual de instructivos impresos | Sin motor de reglas por OS |
| Solicitar autorización desde un solo lugar | Ir a cada portal de OS por separado | Sin flujo unificado |
| Trackear estado de autorizaciones | Planillas Excel o papel | Sin gestión de ciclo de vida |
| Preparar facturación mensual por OS | LandaMed/Emprenet lo hacen parcialmente | Automatización limitada en plataformas cloud |
| Gestionar débitos y refacturación | 100% manual | Casi ningún software lo maneja |
| Manejar 20-30 OS con reglas distintas simultáneamente | Hojas de ayuda memoria | Sin base de datos centralizada de reglas por OS |

---

## 8. Evaluación de viabilidad y modelo de datos para el MVP

### Qué incluir en cada fase

**MVP (Fase 1) — Agenda con inteligencia de OS:**

El diferenciador mínimo viable no es la agenda (commodity) sino el **manejo inteligente de obra social al reservar el turno**. El MVP debe:
- Almacenar OS, plan y número de afiliado del paciente
- Tener una **base de datos precargada** de las ~50 OS/prepagas más comunes con sus planes
- Alertar si el profesional no trabaja con esa OS
- Mostrar si la práctica requiere autorización para esa OS (tabla de reglas básica)
- Registrar el coseguro esperado al momento del turno
- Marcar el estado de autorización (pendiente / autorizada / denegada)
- Emitir recordatorio al paciente mencionando la autorización pendiente si aplica

**Fase 2 — Facturación y liquidación:**
- Registro completo de prestaciones realizadas con todos los campos de facturación
- Generación de liquidación mensual agrupada por OS
- Integración con ARCA para factura electrónica con CAE
- Gestión de nomenclador (al menos NN básico + nomenclador PAMI)
- Tracking de débitos y flujo de refacturación
- Separación automática de facturación IVA exento vs. gravado

**Fase 3 — Inteligencia avanzada y bridges a portales:**
- Motor de reglas completo por OS (requisitos de documentación, formatos, deadlines)
- Quick-links a portales de cada OS con datos pre-rellenados
- Calculadora automática de coseguro por OS + plan + código de práctica
- Verificación de padrón SSSalud integrada (web scraping del padrón público)
- Dashboard de cuentas por cobrar por OS con aging y alertas
- API para contabilidad externa

### La oportunidad competitiva real

**La base de datos de reglas por OS es el moat.** Ningún competidor actual tiene una base de datos mantenida y completa de todas las reglas de cada OS — planes, coseguros, requisitos de autorización, formatos de facturación, deadlines. Construir y mantener esta base de datos es difícil (requiere investigación manual continua, parsing de resoluciones, feedback de usuarios), pero una vez construida, genera un efecto de red: cada clínica que usa el sistema retroalimenta la precisión de los datos. Esto es prácticamente imposible de replicar rápidamente por un competidor.

### Modelo de datos detallado

A continuación, las tablas y campos necesarios para soportar el dominio completo:

**Tabla `obras_sociales`** (financiadores)

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID | PK |
| `nombre` | VARCHAR(200) | Nombre oficial (ej: "OSECAC", "OSDE", "PAMI") |
| `nombre_display` | VARCHAR(200) | Nombre como lo conoce la secretaria (ej: "Comercio") |
| `tipo` | ENUM | `sindical`, `provincial`, `prepaga`, `pami`, `estatal`, `otra` |
| `rnos_codigo` | VARCHAR(10) | Código RNOS asignado por la SSSalud (nullable) |
| `cuit` | VARCHAR(13) | CUIT de la entidad |
| `gerenciadora_id` | FK → obras_sociales | Si usa gerenciadora, referencia a ella (nullable) |
| `portal_prestadores_url` | VARCHAR(500) | URL del portal de prestadores |
| `telefono_autorizaciones` | VARCHAR(50) | Teléfono para solicitar autorizaciones |
| `email_autorizaciones` | VARCHAR(200) | Email para autorizaciones (nullable) |
| `dia_cierre_facturacion` | INT | Día del mes para cierre de facturación (ej: 26) |
| `plazo_pago_dias` | INT | Plazo típico de pago en días |
| `nomenclador_tipo` | ENUM | `nacional`, `pami`, `provincial`, `propio` |
| `requiere_derivacion_cabecera` | BOOLEAN | Si requiere derivación de médico de cabecera para especialistas |
| `activo` | BOOLEAN | Si la clínica trabaja con esta OS actualmente |
| `notas_facturacion` | TEXT | Notas específicas de facturación (formato, canal, etc.) |

**Tabla `planes`** (niveles de cobertura dentro de cada OS)

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID | PK |
| `obra_social_id` | FK → obras_sociales | |
| `codigo` | VARCHAR(20) | Código del plan (ej: "210", "310", "PMO", "ORO") |
| `nombre` | VARCHAR(100) | Nombre del plan |
| `es_afiliado_voluntario` | BOOLEAN | Para determinar tratamiento de IVA en facturación |
| `permite_acceso_directo_especialista` | BOOLEAN | Si permite ir directo a especialista sin derivación |
| `activo` | BOOLEAN | |

**Tabla `pacientes`**

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID | PK |
| `nombre` | VARCHAR(100) | |
| `apellido` | VARCHAR(100) | |
| `dni` | VARCHAR(10) | Documento Nacional de Identidad |
| `cuil` | VARCHAR(13) | Para verificación en padrón SSSalud |
| `fecha_nacimiento` | DATE | |
| `sexo` | ENUM | |
| `telefono` | VARCHAR(20) | |
| `email` | VARCHAR(200) | |
| `obra_social_id` | FK → obras_sociales | OS principal |
| `plan_id` | FK → planes | Plan dentro de la OS |
| `numero_afiliado` | VARCHAR(20) | Número de credencial (14 dígitos para PAMI) |
| `parentesco` | ENUM | `titular`, `conyuge`, `hijo`, `otro` |
| `obra_social_secundaria_id` | FK → obras_sociales | Doble cobertura (nullable) |
| `plan_secundario_id` | FK → planes | (nullable) |
| `numero_afiliado_secundario` | VARCHAR(20) | (nullable) |
| `es_particular` | BOOLEAN | Sin cobertura, paga de bolsillo |

**Tabla `profesionales`**

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID | PK |
| `nombre` | VARCHAR(100) | |
| `apellido` | VARCHAR(100) | |
| `matricula_nacional` | VARCHAR(20) | |
| `matricula_provincial` | VARCHAR(20) | |
| `especialidad` | VARCHAR(100) | |
| `cuit` | VARCHAR(13) | |

**Tabla `profesional_obras_sociales`** (qué OS acepta cada profesional)

| Campo | Tipo | Descripción |
|---|---|---|
| `profesional_id` | FK → profesionales | |
| `obra_social_id` | FK → obras_sociales | |
| `activo` | BOOLEAN | |

**Tabla `nomenclador_codigos`** (catálogo de prestaciones)

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID | PK |
| `nomenclador_tipo` | ENUM | `nacional`, `nbu`, `pami`, `provincial` |
| `codigo` | VARCHAR(20) | Código de la práctica |
| `descripcion` | VARCHAR(500) | Nombre de la práctica |
| `capitulo` | VARCHAR(100) | Sección/capítulo del nomenclador |
| `especialidad` | VARCHAR(100) | Especialidad asociada |
| `requiere_autorizacion_default` | BOOLEAN | Si generalmente requiere autorización |
| `complejidad` | ENUM | `baja`, `media`, `alta` |
| `modulo_pami` | VARCHAR(10) | Número de módulo PAMI (nullable, solo para tipo pami) |

**Tabla `coseguros`** (montos de coseguro por OS + plan + tipo de práctica)

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID | PK |
| `obra_social_id` | FK → obras_sociales | |
| `plan_id` | FK → planes | (nullable = aplica a todos los planes) |
| `categoria_prestacion` | ENUM | `consulta_generalista`, `consulta_especialista`, `imagen_simple`, `imagen_compleja`, `laboratorio_basico`, `laboratorio_complejo`, `salud_mental`, `kinesiologia`, `odontologia`, `emergencia`, `cirugia` |
| `monto` | DECIMAL(12,2) | Monto en ARS |
| `es_porcentaje` | BOOLEAN | TRUE si es porcentaje, FALSE si es monto fijo |
| `vigente_desde` | DATE | Fecha de inicio de vigencia |
| `vigente_hasta` | DATE | (nullable = vigente hasta nuevo valor) |
| `exento` | BOOLEAN | TRUE si está exento de coseguro (oncología, PMI, etc.) |

**Tabla `turnos`** (citas médicas)

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID | PK |
| `paciente_id` | FK → pacientes | |
| `profesional_id` | FK → profesionales | |
| `fecha_hora` | TIMESTAMP | |
| `duracion_minutos` | INT | |
| `obra_social_id` | FK → obras_sociales | OS usada para esta consulta |
| `plan_id` | FK → planes | |
| `tipo_prestacion` | VARCHAR(100) | |
| `nomenclador_codigo_id` | FK → nomenclador_codigos | (nullable) |
| `requiere_autorizacion` | BOOLEAN | Calculado según OS + práctica |
| `autorizacion_id` | FK → autorizaciones | (nullable) |
| `coseguro_esperado` | DECIMAL(12,2) | Monto calculado al reservar |
| `coseguro_cobrado` | DECIMAL(12,2) | Monto efectivamente cobrado |
| `plus_medico_cobrado` | DECIMAL(12,2) | Bono complementario del médico (nullable) |
| `estado` | ENUM | `reservado`, `confirmado`, `en_sala_espera`, `en_atencion`, `atendido`, `cancelado`, `ausente` |
| `es_particular` | BOOLEAN | Sin OS, pago directo |
| `notas` | TEXT | |

**Tabla `autorizaciones`**

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID | PK |
| `paciente_id` | FK → pacientes | |
| `obra_social_id` | FK → obras_sociales | |
| `plan_id` | FK → planes | |
| `nomenclador_codigo_id` | FK → nomenclador_codigos | Práctica a autorizar |
| `diagnostico_cie10` | VARCHAR(10) | Código CIE-10 |
| `diagnostico_texto` | VARCHAR(500) | Diagnóstico en texto libre |
| `profesional_prescriptor_id` | FK → profesionales | Médico que prescribe |
| `profesional_efector_id` | FK → profesionales | Médico que realizará la práctica |
| `numero_autorizacion` | VARCHAR(50) | Número asignado por la OS |
| `fecha_solicitud` | TIMESTAMP | |
| `fecha_autorizacion` | TIMESTAMP | (nullable) |
| `fecha_vencimiento` | DATE | Típicamente 30 días post-orden, 90 días OME PAMI |
| `estado` | ENUM | `pendiente`, `autorizada`, `denegada`, `vencida` |
| `canal_solicitud` | ENUM | `portal_web`, `telefono`, `email`, `whatsapp`, `presencial`, `automatica` |
| `motivo_denegacion` | TEXT | (nullable) |
| `es_renovacion` | BOOLEAN | Para tratamientos continuos (salud mental, kinesiología) |
| `autorizacion_padre_id` | FK → autorizaciones | Referencia a autorización anterior si es renovación |

**Tabla `prestaciones_realizadas`** (registro para facturación)

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID | PK |
| `turno_id` | FK → turnos | |
| `paciente_id` | FK → pacientes | |
| `profesional_id` | FK → profesionales | |
| `obra_social_id` | FK → obras_sociales | |
| `plan_id` | FK → planes | |
| `nomenclador_codigo_id` | FK → nomenclador_codigos | |
| `fecha_prestacion` | DATE | |
| `diagnostico_cie10` | VARCHAR(10) | |
| `numero_autorizacion` | VARCHAR(50) | |
| `coseguro_cobrado` | DECIMAL(12,2) | |
| `monto_a_facturar_os` | DECIMAL(12,2) | Según convenio/nomenclador |
| `liquidacion_id` | FK → liquidaciones | (nullable hasta asignación a lote) |
| `estado` | ENUM | `registrada`, `prefacturada`, `facturada`, `presentada`, `pagada`, `debitada`, `refacturada` |
| `motivo_debito` | TEXT | (nullable) |
| `documentacion_completa` | BOOLEAN | Validación pre-facturación |
| `es_afiliado_voluntario` | BOOLEAN | Para separación de IVA |

**Tabla `liquidaciones`** (lotes de facturación mensual)

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID | PK |
| `obra_social_id` | FK → obras_sociales | |
| `plan_id` | FK → planes | |
| `periodo` | VARCHAR(7) | Formato "YYYY-MM" |
| `fecha_cierre` | DATE | Fecha de cierre del lote |
| `fecha_presentacion` | DATE | Fecha de envío a la OS |
| `monto_total` | DECIMAL(14,2) | |
| `monto_coseguros` | DECIMAL(14,2) | Total de coseguros descontados |
| `monto_neto_facturado` | DECIMAL(14,2) | Monto total - coseguros |
| `numero_factura_arca` | VARCHAR(30) | Número de factura electrónica ARCA |
| `cae` | VARCHAR(20) | Código de Autorización Electrónico |
| `tipo_factura` | ENUM | `A`, `B`, `C` |
| `iva_condicion` | ENUM | `exento`, `gravado_105` |
| `estado` | ENUM | `borrador`, `prefacturada`, `facturada`, `presentada`, `en_auditoria`, `liquidada`, `pagada_parcial`, `pagada_total` |
| `monto_debitado` | DECIMAL(14,2) | Total de débitos aplicados |
| `monto_cobrado` | DECIMAL(14,2) | Monto efectivamente recibido |
| `fecha_pago` | DATE | (nullable) |

**Tabla `reglas_autorizacion_os`** (motor de reglas por OS — Fase 2/3)

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID | PK |
| `obra_social_id` | FK → obras_sociales | |
| `plan_id` | FK → planes | (nullable = todos los planes) |
| `nomenclador_codigo_id` | FK → nomenclador_codigos | (nullable si aplica por categoría) |
| `categoria_prestacion` | ENUM | (nullable si aplica por código específico) |
| `requiere_autorizacion` | BOOLEAN | |
| `canal_preferido` | ENUM | `portal_web`, `telefono`, `email`, `whatsapp` |
| `tiempo_estimado_horas` | INT | Tiempo esperado de respuesta |
| `notas` | TEXT | Instrucciones específicas |

### Recomendaciones estratégicas para el stack

**Almacenar coseguros por OS/plan/categoría en la base de datos: sí, absolutamente.** Los coseguros cambian frecuentemente (post-liberalización, cada OS los actualiza cuando quiere), pero para la experiencia de usuario son críticos. La secretaria necesita ver el monto al asignar el turno. Implementar con vigencias temporales (fecha desde/hasta) y un mecanismo de actualización manual asistido (la clínica actualiza cuando la OS publica nuevos valores, con la posibilidad futura de crowd-sourcing entre clínicas clientes).

**El nomenclador debe ser una tabla maestra mantenida centralmente** y distribuida a todas las instancias. El NN y el NBU son relativamente estables en estructura; los valores varían por convenio. El nomenclador PAMI cambia más frecuentemente y debe trackearse por separado.

**La verificación de padrón SSSalud es un quick win para Fase 1**: el padrón público es consultable por CUIL/DNI en sssalud.gob.ar. Un scraping periódico o consulta en tiempo real agregaría valor inmediato sin necesitar API oficial.

---

## Conclusión: el mapa de ruta hacia una turnera que realmente resuelve el problema

El sistema de obras sociales argentino es extraordinariamente fragmentado — **~300 financiadores, cada uno con su nomenclador, sus reglas de autorización, sus montos de coseguro, su portal propio y su formato de facturación**. Esta complejidad es precisamente la oportunidad. Las turneras existentes de Nivel 1-2 ignoran el problema; las de Nivel 3 lo abordan parcialmente; los sistemas legacy lo resuelven pero con UX obsoleta.

La clave estratégica es construir el **"knowledge graph" de obras sociales argentinas** — la base de datos viva que mapea OS → planes → coseguros → reglas de autorización → requisitos de facturación. Este asset no existe en ningún competidor actual y es la barrera de entrada más fuerte posible. En el MVP, se manifiesta como un dropdown inteligente que, al seleccionar OS + plan + tipo de práctica, muestra automáticamente el coseguro, indica si requiere autorización y alerta si el profesional no trabaja con esa OS. Es un salto cualitativo respecto al campo de texto libre que usan las turneras actuales.

Tres insights no obvios emergen de la investigación: primero, muchos médicos del interior facturan a través de **círculos médicos** (con Evweb como plataforma), no directamente a las OS — el sistema debe contemplar este intermediario. Segundo, la **liberalización de coseguros de 2024** creó un mercado donde los montos cambian con alta frecuencia y sin estandarización — una oportunidad para quien pueda mantener esos datos actualizados via crowd-sourcing entre clínicas. Tercero, la ausencia total de APIs públicas en las OS significa que la integración profunda (autorización automática, verificación de padrón en línea) solo será posible vía web scraping o cuando la **Red Nacional de Salud Digital** (basada en HL7 FHIR) madure — posicionarse temprano para esa interoperabilidad es una ventaja de primer movimiento.