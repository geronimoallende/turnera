# Anatomía operativa completa de un sanatorio argentino

**Un sanatorio privado argentino es un ecosistema de alta complejidad donde convergen entre 250 y 400 empleados, más de 20 departamentos interdependientes, y un entramado financiero de 300+ obras sociales con reglas de facturación distintas.** Este documento mapea de punta a punta cada departamento, flujo de pacientes, sistema tecnológico y proceso administrativo, orientado al desarrollo de un sistema de gestión sanatorial SaaS que comienza como turnera y se expande progresivamente. El primer cliente objetivo es el entorno operativo vinculado a UPCN en Córdoba, Argentina.

---

## 1. Qué es un sanatorio y cómo se diferencia de una clínica u hospital

En Argentina, el término "sanatorio" designa un **establecimiento privado con internación polivalente de 100 o más camas**, según la clasificación establecida por la Resolución Ministerial 2385/80 y el Decreto 3280/90 de la Provincia de Buenos Aires. La distinción no es meramente coloquial: tiene consecuencias directas en habilitación, dotación mínima de personal y servicios obligatorios.

| Categoría | Denominación | Camas | Guardia 24h | Quirófanos | Financiamiento |
|-----------|-------------|-------|-------------|------------|----------------|
| Hospital público | Hospital | 200+ | Obligatoria | Múltiples | Presupuesto estatal |
| Sanatorio | Sanatorio | 100+ | Obligatoria (mín. 2 médicos/turno) | Mín. 3 por 100 camas | Obras sociales, prepagas, particulares |
| Clínica | Clínica | 15–99 | Sí (puede ser limitada) | 1–2 | Igual que sanatorio |
| Centro médico | Centro médico | Sin internación | Generalmente no | Ninguno o procedimientos menores | Igual que sanatorio |

En la práctica cotidiana argentina, "sanatorio" y "clínica" refieren a instituciones privadas, mientras que "hospital" implica casi siempre una institución pública. La Resolución 900-E/2017 modernizó la nomenclatura oficial hacia categorías genéricas como "Establecimiento de Salud Con Internación General" (ESCIG), pero la terminología tradicional persiste en el uso legal provincial y operativo.

### Tamaño típico de un sanatorio mediano

Un sanatorio polivalente de **120 camas** opera típicamente con:

- **Médicos de planta:** 15–30 especialistas en las áreas básicas (clínica médica, cirugía, pediatría, tocoginecología, anestesiología)
- **Médicos consultantes/visitantes:** 50–100+ especialistas que atienden en días programados
- **Médicos de guardia:** mínimo 2 por turno de 24h, frecuentemente 4–6 para cobertura múltiple
- **Enfermería:** 60–100 personas entre enfermeros profesionales, auxiliares y supervisoras
- **Personal administrativo:** 30–50 personas (admisión, facturación, RRHH, contaduría, turnos)
- **Personal técnico:** 15–30 (técnicos radiólogos, laboratoristas, instrumentadoras, farmacéuticos)
- **Servicios generales:** 20–40 (limpieza, mantenimiento, seguridad, cocina, camilleros)
- **Total general: 250–400 empleados**

El equipamiento de diagnóstico por imágenes incluye como mínimo un equipo de radiología fija + uno portátil (obligatorio por reglamentación), 1–3 ecógrafos, al menos 1 tomógrafo multislice, y mamógrafo si hay servicio de ginecología. La resonancia magnética no es universal en sanatorios medianos y frecuentemente se terceriza.

### Organigrama jerárquico

```
ENTIDAD TITULAR (sociedad, sindicato, fundación)
└── Directorio / Consejo de Administración
    ├── DIRECTOR MÉDICO
    │   ├── Jefe de Guardia/Urgencias
    │   ├── Jefe de Clínica Médica
    │   ├── Jefe de Cirugía
    │   ├── Jefe de Pediatría
    │   ├── Jefe de Tocoginecología
    │   ├── Jefe de UTI
    │   ├── Jefe de Laboratorio
    │   ├── Jefe de Diagnóstico por Imágenes
    │   ├── Jefe de Hemoterapia / Banco de Sangre
    │   ├── Jefe de Anatomía Patológica
    │   ├── Jefe de Farmacia
    │   ├── Jefa de Enfermería
    │   │   ├── Supervisoras de turno
    │   │   ├── Enfermeros profesionales
    │   │   └── Auxiliares de enfermería
    │   ├── Auditor Médico
    │   └── Comités (Infecciones, Ética, Docencia)
    │
    └── DIRECTOR ADMINISTRATIVO
        ├── Jefe de Administración / Contaduría
        ├── Jefe de Facturación
        ├── Jefe de Recursos Humanos
        ├── Jefe de Mantenimiento / Ingeniería Clínica
        ├── Jefe de Servicios Generales
        ├── Jefe de Sistemas / Informática
        └── Asesor Legal
```

### Departamentos completos de un sanatorio polivalente

**Servicios asistenciales:** Guardia 24h, Consultorios Externos, Internación General, UTI, Unidad Coronaria, Neonatología, Quirófano/Centro Quirúrgico, Maternidad, Pediatría. **Servicios de diagnóstico:** Laboratorio de Análisis Clínicos (24h), Diagnóstico por Imágenes, Anatomía Patológica, Cardiología Diagnóstica. **Servicios terapéuticos de apoyo:** Hemoterapia/Banco de Sangre (24h), Farmacia Interna, Kinesiología/Rehabilitación, Nutrición/Dietistas, Anestesiología. **Servicios de apoyo:** Esterilización Central, Instrumentación Quirúrgica, Departamento de Enfermería. **Departamentos administrativos:** Dirección Médica, Dirección Administrativa, Administración General, Facturación, RRHH, Admisión y Egresos, Archivo de Historias Clínicas, Auditoría Médica, Comité de Infecciones, Mantenimiento, Limpieza, Seguridad e Higiene, Lavandería, Cocina, Sistemas/Informática, Atención al Paciente, Asesoría Legal.

### Nota sobre el Sanatorio de UPCN en Córdoba

La investigación exhaustiva revela que **UPCN no posee ni opera un sanatorio propio en Córdoba**. La Red Sanatorio Anchorena (Recoleta, San Martín, Itoiz en Avellaneda, y el nuevo Zárate) está concentrada en el AMBA. En Córdoba, UPCN mantiene una delegación sindical administrativa en La Tablada 347, y los afiliados a la obra social Unión Personal acceden a prestadores contratados de la cartilla local (como Sanatorio Allende del Cerro). No obstante, este análisis operativo aplica plenamente a cualquier sanatorio privado de Córdoba que reciba afiliados de Unión Personal u opere bajo el modelo sanatorial estándar argentino.

---

## 2. Flujo del paciente ambulatorio: de la llamada al alta

El recorrido completo del paciente ambulatorio atraviesa **8 pasos** con múltiples actores y puntos de generación de datos. Este flujo es el núcleo de la operación de consultorios externos y el punto de partida natural para un sistema de gestión.

### Diagrama de flujo textual — Consulta ambulatoria

```
┌──────────────────────────────────────────────────────────────────────┐
│  PACIENTE solicita turno (teléfono/WhatsApp/web/presencial)         │
│  → Secretaria verifica agenda + cobertura obra social/prepaga       │
│  → Se crea REGISTRO DE TURNO (paciente, médico, especialidad,      │
│    fecha/hora, datos OS, Nº afiliado)                               │
└──────────────────────────┬───────────────────────────────────────────┘
                           ▼
┌──────────────────────────────────────────────────────────────────────┐
│  PACIENTE llega al sanatorio (30 min antes)                         │
│  → Presenta DNI + Credencial OS + Orden/Derivación si corresponde  │
│  → Admisión verifica vigencia del afiliado (sistema de validación   │
│    online: Traditum, Apligen, portal de la OS)                      │
│  → Se cobra COPAGO/COSEGURO en caja                                │
│  → Se genera BONO DE CONSULTA (voucher para facturación posterior)  │
└──────────────────────────┬───────────────────────────────────────────┘
                           ▼
┌──────────────────────────────────────────────────────────────────────┐
│  SALA DE ESPERA                                                      │
│  → Paciente espera en sector asignado por especialidad              │
│  → Llamado por pantalla digital o nombre por secretaria del médico  │
└──────────────────────────┬───────────────────────────────────────────┘
                           ▼
┌──────────────────────────────────────────────────────────────────────┐
│  CONSULTA MÉDICA                                                     │
│  → Médico registra en Historia Clínica: motivo de consulta,         │
│    anamnesis, examen físico, diagnóstico (CIE-10), indicaciones     │
│  → Genera: recetas (electrónicas desde 01/01/2025), órdenes de     │
│    estudio, pedido de interconsulta si necesario                    │
│  → Firma y sello (o firma electrónica en sistemas digitales)        │
└──────────────────────────┬───────────────────────────────────────────┘
                           ▼
┌──────────────────────────────────────────────────────────────────────┐
│  POST-CONSULTA                                                       │
│  → Paciente lleva orden de estudio al servicio correspondiente      │
│    (laboratorio, imágenes) o agenda turno separado                  │
│  → Recetas digitales enviadas por WhatsApp/email al paciente        │
│  → Paciente agenda turno de seguimiento por canales habituales      │
│  → Bono de consulta queda en facturación para liquidar a la OS      │
└──────────────────────────────────────────────────────────────────────┘
```

### Datos capturados en cada paso

En la **reserva del turno** se registra: nombre completo, DNI, fecha de nacimiento, domicilio, teléfono, email, obra social/prepaga, número de afiliado, plan, médico solicitado, especialidad, fecha y hora. En la **admisión** se agrega: estado de vigencia del afiliado, tipo y monto de copago, bono de consulta generado. En la **consulta** se produce el registro clínico: motivo, diagnóstico CIE-10, indicaciones, recetas (ahora con Clave Única de Identificación de Receta — CUIR), y órdenes de estudio. En la **post-consulta** se generan pedidos de turno para estudios y controles.

Un dato crítico para el diseño del sistema: **los pacientes de primera vez generalmente no pueden agendar online** porque requieren registro presencial de datos demográficos. Los portales de turnos online solo funcionan para pacientes ya registrados en la base de datos. Esta fricción es un problema que un buen sistema SaaS puede resolver con pre-registro digital.

### Interconsulta dentro del mismo sanatorio

Cuando un médico necesita la opinión de otro especialista, genera un **parte de interconsulta (PIC)** que contiene los datos del paciente, resumen clínico, diagnóstico presuntivo y la pregunta específica al consultor. En la mayoría de los sanatorios, **el paciente debe sacar un nuevo turno** con el especialista consultado — el médico derivante no suele agendar directamente. El paciente se convierte en el "portador" de la información entre servicios, lo cual genera pérdida de contexto clínico. En sistemas electrónicos avanzados (como HSI), existe un módulo de referencia y contrarreferencia digital, pero la adopción es baja en el sector privado.

---

## 3. El flujo de guardia difiere radicalmente del ambulatorio

### Diagrama de flujo textual — Guardia/Urgencias

```
┌──────────────────────────────────────────────────────────────────────┐
│  PACIENTE llega a Guardia (caminando, en auto, ambulancia)          │
│  → NO necesita turno — demanda espontánea                           │
│  → NO necesita autorización previa de la OS para emergencias        │
└──────────────────────────┬───────────────────────────────────────────┘
                           ▼
┌──────────────────────────────────────────────────────────────────────┐
│  TRIAGE (enfermero/a capacitado/a, dentro de los primeros 5 min)    │
│  → Escala de 5 niveles (basada en Manchester/ESI):                  │
│    🔴 Rojo (reanimación) → Inmediata → Shock Room                   │
│    🟠 Naranja (emergencia) → <15 min → Cortinado                    │
│    🟡 Amarillo (urgencia) → <60 min → Cortinado                     │
│    🟢 Verde (menor) → Hasta 3h → Consultorio de guardia             │
│    🔵 Azul (no urgente) → 4h+ → Consultorio de guardia              │
│  → Se registran: motivo, antecedentes, signos vitales, nivel        │
└──────────────────────────┬───────────────────────────────────────────┘
                           ▼
┌──────────────────────────────────────────────────────────────────────┐
│  EVALUACIÓN MÉDICA → Estudios complementarios (lab, imágenes)       │
│  → Tratamiento (medicación, procedimientos, suturas)                │
│  → DECISIÓN:                                                         │
│    ├── ALTA MÉDICA → Recetas + indicaciones → Cobro copago          │
│    ├── INTERNACIÓN → Gestión de cama → Transferencia a piso         │
│    ├── OBSERVACIÓN → Hasta 24h en guardia                            │
│    └── DERIVACIÓN → A centro de mayor complejidad                   │
└──────────────────────────────────────────────────────────────────────┘
```

Las diferencias clave con consultorios externos: **no hay turno previo**, la atención no requiere autorización previa de la obra social, el copago se cobra después de la estabilización, y se utiliza una historia clínica de guardia específica con diferentes códigos de facturación.

---

## 4. Flujo de estudios diagnósticos: del pedido médico al resultado

### Diagrama de flujo textual — Estudios diagnósticos

```
┌──────────────────────────────────────────────────────────────────────┐
│  MÉDICO genera ORDEN DE ESTUDIO (papel o electrónica)               │
│  → Especifica: tipo de estudio, diagnóstico presuntivo, datos OS    │
└──────────────┬──────────────────────────────────────┬───────────────┘
               ▼                                      ▼
   ┌───────────────────────┐            ┌─────────────────────────────┐
   │  LABORATORIO           │            │  DIAGNÓSTICO POR IMÁGENES   │
   │  • Análisis de sangre  │            │  • Rx: sin turno, 8-20h     │
   │    sin turno, 7-8 AM   │            │  • Ecografía: con turno     │
   │  • Muestra tomada en   │            │  • Tomografía: con turno    │
   │    laboratorio o cama   │            │    (requiere lab previo     │
   │  • Procesamiento en LIS│            │    para contraste)          │
   │  • Validación por      │            │  • Técnico toma imagen      │
   │    bioquímico           │            │  • Médico radiólogo informa │
   │  • Rutina: 4-12h       │            │  • Imágenes a PACS/DICOM    │
   │  • Urgente: 30-60 min  │            │  • Rx rutina: 12-24h        │
   │  • Especiales: 24-72h  │            │  • TC rutina: 24-48h        │
   └───────────┬───────────┘            │  • Urgencia: inmediato      │
               │                         └─────────────┬───────────────┘
               ▼                                       ▼
   ┌──────────────────────────────────────────────────────────────────┐
   │  RESULTADOS                                                       │
   │  → Portal online del paciente (acceso con QR o usuario/clave)    │
   │  → Integración con HIS para acceso del médico tratante           │
   │  → Para internados: resultados en la HC del paciente             │
   │  → Informes impresos cuando se solicitan                         │
   └──────────────────────────────────────────────────────────────────┘
```

### Roles clave en el proceso diagnóstico

En el laboratorio, el **bioquímico** (no es médico en Argentina, sino un profesional con título universitario propio) valida los resultados. El sistema LIS gestiona las fases pre-analítica, analítica y post-analítica: recepción de la orden, registro de la muestra con código de barras, interfaz con autoanalizadores, validación y publicación. Los productos LIS más utilizados incluyen **COYALab** (Santa Fe, primera empresa certificada TÜV en Argentina), **Ibis LIS**, **BaxLAB** e **Ingenius AppLab**.

En imágenes, el **técnico radiólogo** captura las imágenes y el **médico radiólogo** las interpreta y produce el informe. Para ecografías, el estudio es realizado e informado por un **ecografista médico especializado**, aunque ciertas subespecialidades (cardiología, obstetricia) realizan sus propios estudios. Los sanatorios modernos operan con sistemas **PACS** (Picture Archiving and Communication System) que almacenan imágenes en formato DICOM, accesibles desde workstations en todo el sanatorio y remotamente. La integración sigue el modelo **HIS ↔ RIS ↔ PACS** comunicándose vía estándares HL7/DICOM.

---

## 5. La internación: desde el ingreso hasta el alta

### Diagrama de flujo textual — Internación

```
┌──────────────────────────────────────────────────────────────────────┐
│  VÍAS DE INGRESO                                                     │
│  ├── Desde GUARDIA: médico de guardia indica internación            │
│  ├── PROGRAMADA: médico tratante agenda desde consultorio           │
│  └── PRE-QUIRÚRGICA: ingreso 2h antes de cirugía programada        │
└──────────────────────────┬───────────────────────────────────────────┘
                           ▼
┌──────────────────────────────────────────────────────────────────────┐
│  ADMISIÓN DE INTERNACIÓN                                             │
│  → Documentación: DNI, credencial OS, pedido médico, autorización  │
│  → Asignación de cama (según cobertura OS y necesidad clínica)     │
│  → Pulsera de identificación                                        │
│  → Traslado a habitación por camilleros                             │
└──────────────────────────┬───────────────────────────────────────────┘
                           ▼
┌──────────────────────────────────────────────────────────────────────┐
│  ESTADÍA                                                             │
│  → Enfermería: signos vitales, medicación (Kardex), balance         │
│    hídrico, registros de enfermería, cuidados                       │
│  → Médicos: pase de sala diario, indicaciones médicas, evolución   │
│  → Interconsultas con especialistas según necesidad                 │
│  → Estudios complementarios: lab, imágenes (pedidos desde piso)    │
│  → Farmacia: dispensación por sistema de unidosis (cajetines 24h)  │
│  → Nutrición: dieta indicada por médico, preparada por cocina      │
└──────────────────────────┬───────────────────────────────────────────┘
                           ▼
┌──────────────────────────────────────────────────────────────────────┐
│  ALTA                                                                │
│  1. ALTA MÉDICA: médico determina condición clínica de egreso      │
│     → Escribe EPICRISIS (diagnósticos, procedimientos, evolución,  │
│       medicación al alta, indicaciones de seguimiento)              │
│  2. ALTA DE ENFERMERÍA: retiro de vías, educación al paciente,     │
│     retiro de pulsera, comunicación a familiares                    │
│  3. ALTA ADMINISTRATIVA: firma de documentación en Administración  │
│     (generalmente 48h post-egreso), conciliación con OS/prepaga,   │
│     copagos adicionales, verificación de cobertura                  │
│  → Habitación liberada para acondicionamiento y próximo ingreso    │
└──────────────────────────────────────────────────────────────────────┘
```

### Gestión de camas

La gestión de camas es centralizada a través de la oficina de **Admisión de Internación**. En la Provincia de Buenos Aires se implementó el **SIGEC** (Sistema de Gestión de Camas) para el sector público. En el privado, se utiliza el módulo de internación del HIS. Las mejores prácticas incluyen: asignación centralizada, planificación nocturna identificando altas esperadas para el día siguiente, flexibilidad entre niveles de cuidado (mínimos, intermedios, intensivos), y mantenimiento de camas disponibles permanentes en guardia. Las camas se asignan según cobertura de obra social (habitación compartida o individual) y criterio clínico de aislamiento.

### Flujo de enfermería

Cada turno (mañana, tarde, noche) inicia con el **pase de turno** donde las enfermeras salientes transmiten el estado de cada paciente. El **Kardex de Enfermería** — una herramienta organizativa central, ya sea en papel o electrónica — contiene diagnósticos, medicación con dosis/vías/horarios, dieta, alergias y plan de cuidados. Enfermería ejecuta las **indicaciones médicas**: administración de medicación, control de signos vitales, balance hídrico, curaciones, manejo de drenajes y prevención de caídas y escaras. Un desarrollo clave en Córdoba documentó la implementación de un **Kardex electrónico** como paso estratégico hacia la HCE completa para internación.

### El quirófano

El flujo pre-quirúrgico estándar incluye: análisis de laboratorio, electrocardiograma, evaluación cardiológica de riesgo quirúrgico (según Consenso Argentino de la SAC), y evaluación pre-anestésica. La **Checklist de Cirugía Segura** (adaptación argentina del checklist OMS, Resolución 28/2012) se aplica en tres momentos: ENTRADA (antes de la inducción anestésica), PAUSA QUIRÚRGICA (post-inducción, pre-incisión), y SALIDA (antes del cierre). La **instrumentadora quirúrgica** fue designada como coordinadora del checklist en Argentina.

---

## 6. Facturación: el corazón financiero del sanatorio

### Cómo sabe facturación qué cobrar

El proceso de facturación sanatorial es **uno de los más complejos del sistema de salud argentino**. El médico no ingresa códigos de facturación. Existe un rol especializado: el **facturista sanatorial**, un administrativo capacitado que traduce la documentación clínica (prescripciones, protocolos quirúrgicos, historias clínicas) en códigos del **Nomenclador Nacional de Prestaciones Médicas**. Los cursos de formación en facturación sanatorial duran 10+ semanas e incluyen interpretación del nomenclador, selección de códigos y normas de auditoría.

### El Nomenclador Nacional de Prestaciones Médicas

Es el catálogo nacional de códigos que clasifica todos los servicios médicos, creado por el ex-INOS y mantenido bajo la Superintendencia de Servicios de Salud. Cada código tiene un prefijo significativo:

- **Prefijos 01-13:** Cirugías por sistema anatómico
- **Prefijos 14-18:** Procedimientos terapéuticos y diagnósticos
- **Prefijo 34:** Radiología
- **Prefijos 35-38:** Otros estudios por imágenes
- **Prefijos 40-41:** Terapia intensiva
- **Prefijo 42:** Consultas médicas
- **Prefijo 43:** Días de internación
- **Prefijo 50:** Medicación anestésica

Cada código tiene dos componentes: **Unidades Galeno** (complejidad del honorario profesional) y **Unidades Gasto** (costo de infraestructura/insumos). Estas unidades se multiplican por un valor monetario acordado en el convenio entre el sanatorio y cada obra social. **Un mismo procedimiento paga distinto según qué obra social o prepaga lo cubra.**

En la práctica coexisten **múltiples nomencladores**: el Nomenclador Nacional (SSS), el Nomenclador PAMI (propio, con códigos y módulos específicos), nomencladores provinciales (APROSS en Córdoba, IOMA en Buenos Aires, IAPOS en Santa Fe), y nomencladores internos de cada prepaga. Esta multiplicidad es una fuente enorme de complejidad operativa.

### Ciclo mensual de facturación a obras sociales

1. **Durante el mes:** Se acumulan todos los servicios prestados a afiliados de cada obra social, con documentación de respaldo (bono de consulta, firma del afiliado, sello médico, autorización)
2. **Cierre mensual (generalmente día 26):** El facturista compila un lote por obra social con todas las prestaciones, códigos, documentación y factura electrónica (CAE vía AFIP)
3. **Presentación:** Envío físico, por portal web de la OS, o a través de intermediarios (Círculos Médicos, Asociaciones Médicas). La plataforma **Evweb** gestiona facturación para 20.000+ profesionales a través de 60+ asociaciones médicas
4. **Auditoría por la OS:** Auditoría administrativa y médica del lote
5. **Liquidación:** La OS emite orden de pago, frecuentemente con **débitos** (deducciones)
6. **Cobro: 90-120 días después de la prestación** en la práctica, pese a que el Decreto 9/93 obliga a pagar en 60 días

### Los débitos: la hemorragia financiera

Los débitos son deducciones que aplica la obra social al auditar los lotes de facturación. Son **extremadamente frecuentes** y representan una pérdida significativa de ingresos. Las causas más comunes incluyen: falta de firma del afiliado, diagnóstico faltante o incorrecto, firma y sello médico ausentes, autorización vencida, afiliado no encontrado en padrón activo, plan incorrecto, errores de codificación, documentos enmendados sin salvar, y facturación duplicada. Los cursos de facturación dedican módulos enteros a "cómo evitar débitos".

### PAMI: el pagador más grande y complejo

PAMI (INSSJP) cubre 5+ millones de beneficiarios y tiene un sistema completamente digitalizado: el **Sistema Interactivo de Información (SII)** donde los prestadores gestionan la facturación, generan órdenes de prestación electrónicas, y cargan facturas. Utiliza un modelo mixto de **cápitas** (pago por cabeza), **módulos** y **pago por prestación**.

### Copagos y coseguros

Distinción importante: las obras sociales usan **coseguros** (porcentaje del costo total), mientras que las prepagas usan **copagos** (monto fijo por servicio). La **Resolución 1926/2024** liberó los coseguros, permitiendo a las obras sociales fijarlos libremente (antes estaban limitados). Están exentas de copago/coseguro: las prestaciones oncológicas, de discapacidad, del Plan Materno Infantil, de prevención, de urgencia/emergencia, y tratamientos de diabetes y VIH.

El desafío financiero estructural del sector es severo: los sanatorios pagan salarios y proveedores mensualmente pero cobran de las obras sociales **3-4 meses después**. Sumada la inflación argentina, el valor real del cobro se erosiona significativamente. ADECRA/CEDIM describen la situación como "terminal" tras "17 años de emergencia sanitaria declarada".

---

## 7. La farmacia interna: dispensación, control y digitalización

La Ley 17.565 (Art. 12) autoriza a clínicas y sanatorios a instalar depósitos de medicamentos exclusivamente para pacientes internados, bajo dirección técnica de un farmacéutico. Los sanatorios medianos y grandes operan farmacias internas completas.

### Sistema de distribución por dosis unitaria (SDMDU)

El estándar de calidad es el **sistema de unidosis**: la farmacia prepara medicamentos individualmente empaquetados y rotulados por paciente para 24 horas, colocados en **cajetines individuales** dentro de **carros nodriza** (típicamente 1 carro por 12-15 camas). Enfermería administra desde los cajetines y devuelve medicamentos no utilizados. El Sanatorio Güemes, por ejemplo, usa reenvasadoras **Blispack** para unidosis y dispensadores automatizados **Pyxis** en terapia intensiva.

### Receta electrónica obligatoria desde el 1 de enero de 2025

El Decreto 345/2024 (reglamentario de la Ley 27.553) estableció que la **receta electrónica es la única modalidad válida** para prescripción de medicamentos desde enero 2025. Las plataformas deben estar registradas en el **ReNaPDiS** (Registro Nacional de Plataformas Digitales Sanitarias). De 173 plataformas inscriptas, 81 fueron aprobadas. La **Resolución 2214/2025** extendió la obligatoriedad a **todas las órdenes médicas** (estudios, procedimientos, dispositivos), no solo medicamentos. Cada receta lleva un **CUIR** (Clave Única de Identificación de Receta) y el paciente se identifica por **CUIL**.

### Estupefacientes y psicotrópicos

El control de sustancias reguladas sigue las Leyes 17.818 y 19.303, bajo supervisión de ANMAT. Los estupefacientes Lista I y II requieren **receta oficial por triplicado** y se adquieren mediante **vales oficiales**. Dentro del sanatorio, se almacenan en **armario bajo llave** con registro de entradas y salidas, y se presentan informes trimestrales al Departamento de Farmacia provincial. El farmacéutico Director Técnico es personalmente responsable del inventario de sustancias controladas.

---

## 8. Mapa de sistemas: qué software toca cada departamento

### Mapa actual típico de un sanatorio mediano argentino

```
┌─────────────────────────────────────────────────────────────────────┐
│                    MAPA DE SISTEMAS - SANATORIO TIPO                │
├─────────────────────┬───────────────────────────────────────────────┤
│  DEPARTAMENTO       │  SISTEMA(S) UTILIZADO(S)                     │
├─────────────────────┼───────────────────────────────────────────────┤
│  Turnos/Agenda      │  Turnera propietaria, WhatsApp informal,     │
│                     │  agenda en papel, o SaaS (DrApp, Meducar,    │
│                     │  SITA/Argensoft, LandaMed)                   │
├─────────────────────┼───────────────────────────────────────────────┤
│  Admisión           │  Módulo del HIS (Geclisa, Alephoo, MHO)     │
│                     │  + validador de OS online (Traditum, Apligen)│
├─────────────────────┼───────────────────────────────────────────────┤
│  Historia Clínica   │  HCE (LandaMed, Alephoo, Integrando Salud,  │
│                     │  Omnia Salud) o papel (aún prevalente)       │
├─────────────────────┼───────────────────────────────────────────────┤
│  Laboratorio        │  LIS (COYALab, Ibis LIS, BaxLAB, Thinksoft  │
│                     │  Lab) + interfaces con autoanalizadores      │
├─────────────────────┼───────────────────────────────────────────────┤
│  Diagnóstico por    │  PACS/RIS (Telerad, Davix, integrado en HIS)│
│  Imágenes           │  + equipos DICOM                             │
├─────────────────────┼───────────────────────────────────────────────┤
│  Farmacia           │  Módulo farmacia del HIS o gestión manual    │
│                     │  + plataforma receta electrónica (ReNaPDiS)  │
├─────────────────────┼───────────────────────────────────────────────┤
│  Enfermería         │  Kardex (papel o electrónico), HCE si existe │
│                     │  Pyxis en UTI (sanatorios grandes)           │
├─────────────────────┼───────────────────────────────────────────────┤
│  Quirófano          │  Planilla de programación (papel/Excel)      │
│                     │  + checklist OMS + módulo quirófano del HIS  │
├─────────────────────┼───────────────────────────────────────────────┤
│  Internación/Camas  │  Módulo internación del HIS o planilla       │
│                     │  manual de camas                             │
├─────────────────────┼───────────────────────────────────────────────┤
│  Facturación        │  Módulo facturación del HIS (Geclisa, Gecros)│
│                     │  + portales de cada OS + AFIP (fact. electr.)│
│                     │  + Evweb (a través de Círculos Médicos)      │
├─────────────────────┼───────────────────────────────────────────────┤
│  Contabilidad/RRHH  │  Tango Gestión (ERP nacional líder) o Xubio │
│                     │  para contabilidad, sueldos, IVA, proveedores│
├─────────────────────┼───────────────────────────────────────────────┤
│  Receta Electrónica │  Plataformas ReNaPDiS: Receto (de DrApp),   │
│                     │  Integrando Salud, Sisalud, integradas con   │
│                     │  Farmalink y vademécum Alfabeta              │
├─────────────────────┼───────────────────────────────────────────────┤
│  Sistemas/IT        │  Infraestructura propia o tercerizada        │
│                     │  2-5 personas de IT en sanatorio mediano     │
│                     │  Presupuesto IT estimado: 1-3% de ingresos  │
└─────────────────────┴───────────────────────────────────────────────┘
```

### Principales proveedores de HIS en el mercado argentino

**Geclisa (Macena, Córdoba):** El incumbente más establecido en Córdoba con 200+ clientes, 30+ años, ISO 9001. Sistema integral on-premise. Fortaleza: completitud funcional. Debilidad: **tecnología legacy, UX anticuada, modelo on-premise costoso**. Es el competidor directo más relevante para un nuevo entrante en Córdoba.

**Alephoo (Buenos Aires, origen UTN):** SaaS cloud-native con HCE, agenda, facturación, farmacia, quirófano, BI, HL7/FHIR, IA. 1.800+ instituciones vía HSI. Expandiéndose a LATAM. Fuerte posicionamiento tecnológico.

**LandaMed (Córdoba):** Software integral para centros médicos y sanatorios. HCE especializada por disciplina, turnos online, integración WhatsApp, HL7/DICOM.

**Cormos (fusión DrApp + iTurnos + Docturno):** Inversión de USD 10M, apuntando al 30% de los turnos médicos de Argentina. 14.000 médicos activos, 18M turnos/año. Orientado a consultorios, no a operación sanatorial completa.

**Integrando Salud:** SaaS cloud con HL7 FHIR, primera plataforma aprobada en ReNaPDiS, IA integrada.

**HSI (Historia de Salud Integrada):** Open-source desarrollado por Lamansys/UNICEN. 1.800+ instituciones, 6M pacientes, 35M documentos clínicos, 82.000 profesionales. Opera en 8 provincias. Usa SNOMED CT. Es el estándar de facto para el sector público.

### El estado real de la digitalización

La adopción es **profundamente desigual**. Hospitales grandes como el Hospital Italiano de Buenos Aires están en la frontera digital. Pero una encuesta de AADAIH reveló que **25% de los expertos en salud reportaron que sus instituciones aún usan procesos manuales** para turnos, HCE y prescripciones. Solo el **27,9% de los pacientes** que cambiaron de médico pudieron llevar su historia clínica electrónica a la nueva institución, revelando una portabilidad casi inexistente. La interoperabilidad HL7 FHIR es aspiracional para la mayoría: **la mayoría de los sistemas en sanatorios privados permanecen en silos**.

El dolor más agudo para las instituciones: **los sistemas fragmentados obligan a la doble carga de datos**, múltiples identificadores de paciente sin un índice maestro nacional, y flujos rotos entre el registro clínico y la facturación que generan débitos evitables.

---

## 9. Marco regulatorio para un sistema de gestión sanatorial

### Las tres leyes fundamentales

**Ley 27.706 (Historia Clínica Digital, 2023):** Crea el Programa Federal de Informatización y Digitalización de HCE. Aplica a todos los establecimientos (públicos, privados, obras sociales). La HCE debe ser un documento digital obligatorio, con marcas temporales, individualizado, respaldado con **firma digital del profesional responsable**. Debe garantizar seguridad, integridad, autenticidad, trazabilidad y disponibilidad. El paciente es titular de sus datos. Implementación progresiva sin fecha límite fija nacional, pero el impulso es sostenido.

**Ley 25.326 (Protección de Datos Personales):** Los datos de salud son **datos sensibles** con el mayor nivel de protección. Obliga a medidas técnicas y organizativas de seguridad, registro de bases de datos ante la Agencia de Acceso a la Información Pública, consentimiento para cesión de datos, y restricciones para transferencias internacionales (crítico para decisiones de hosting cloud — preferentemente en Argentina o países con nivel adecuado de protección).

**Ley 26.529 (Derechos del Paciente):** La HCE informatizada debe conformar con la Ley 25.506 de Firma Digital. Debe usar medios de almacenamiento no reescribibles, control de modificación de campos, y acceso restringido con claves de identificación. El paciente tiene derecho a copia autenticada de su HC dentro de las **48 horas** de solicitarla. La retención mínima es de **10 años**.

### Requisitos prácticos para un sistema SaaS

En la práctica, la mayoría de las instituciones usan **firma electrónica** (login + password con auditoría) en lugar de firma digital PKI, que resulta impráctica para flujos clínicos diarios. La jurisprudencia acepta la firma electrónica si el sistema provee certificado de seguridad y mantiene integridad y trazabilidad. Un sistema SaaS debe implementar:

- Autenticación única por profesional con audit trail completo
- Almacenamiento append-only con versionado (concepto non-rewritable)
- Timestamps automáticos en todas las entradas
- Integración con AFIP para facturación electrónica (CAE)
- Soporte para Nomenclador Nacional de Prestaciones
- Gestión de débitos
- Preparación para integración futura con RENAPER, Red Nacional de Interoperabilidad, y Licencia Sanitaria Federal

### En Córdoba específicamente

La provincia opera bajo la **Ley 9133** que crea el SIPAS (Sistema Integrado Provincial de Atención de la Salud). La habilitación se gestiona a través del **RUGEPRESA** del Ministerio de Salud provincial, ahora digitalizado en la plataforma CiDi. La **Resolución 1226/2025** establece un nuevo marco regulatorio para habilitación, control y fiscalización de establecimientos de salud en Córdoba. La provincia implementó una **Historia Clínica Electrónica Única Provincial (HCEU)** desde 2019 usando tecnología **TIPS** (del Hospital Privado Universitario de Córdoba), estableciendo una expectativa de facto de interoperabilidad para el sector privado.

---

## 10. Evaluación de viabilidad y hoja de ruta modular

### El dolor #1 que un nuevo sistema puede resolver primero

La intersección de **ausentismo en turnos, líneas telefónicas colapsadas, y caos de WhatsApp** es el punto de entrada más claro. Las líneas telefónicas "siempre dan ocupado", los pacientes agendan y no asisten (pérdida directa de ingresos), y la gestión informal por WhatsApp no tiene trazabilidad ni automatización. La capacidad de **cobrar seña vía Mercado Pago al momento de agendar** es identificada consistentemente como la "killer feature" por clínicas argentinas: reduce el ausentismo un **30-40%** y genera un ingreso anticipado.

### La oportunidad de mercado

Argentina tiene aproximadamente **26.985 establecimientos de salud** con 220.910 camas. El sector privado incluye 420+ instituciones representadas solo por ADECRA/CEDIM. En Córdoba, se estiman **150-250+ clínicas y sanatorios privados**. La brecha de mercado es clara: **los SaaS modernos apuntan a consultorios individuales, no a operaciones sanatoriales completas**. No existe un SaaS moderno, cloud-native, diseñado específicamente para sanatorios medianos (20-200 camas). Las soluciones incumbentes como Geclisa son on-premise, legacy, y caras de implementar.

### Hoja de ruta de módulos por fases

**Fase 1 — Turnera/Agenda (Meses 1-3) — MVP**
- Agenda online 24/7 sin descarga de app requerida
- Integración con Mercado Pago para seña/prepago
- Recordatorios automatizados por WhatsApp (API oficial de Meta)
- Gestión multi-profesional de agendas
- Portal básico de autogestión del paciente
- Pre-registro digital de pacientes nuevos (resuelve fricción de primera vez)

**Fase 2 — Gestión de pacientes + HCE básica (Meses 4-8)**
- Registro de pacientes con validación de DNI
- Historia clínica ambulatoria conforme Ley 26.529
- Audit trail y firma electrónica
- Generación de constancias y copias para pacientes
- Reportería básica de actividad

**Fase 3 — Facturación y relación con obras sociales (Meses 6-12)**
- Integración con facturación electrónica AFIP (CAE)
- Reglas de facturación multi-obra social
- Codificación por Nomenclador de Prestaciones
- Gestión de autorizaciones previas
- Tracking de débitos y refacturación
- Reportería financiera y cuentas corrientes por financiador

**Fase 4 — HCE avanzada + Integración lab/imágenes (Meses 12-18)**
- HCE completa conforme Ley 27.706
- Estándares de interoperabilidad HL7 FHIR
- Integración con LIS (resultados de laboratorio)
- Integración con PACS (visualización de imágenes DICOM)
- Módulo de receta electrónica (registro en ReNaPDiS)
- Gestión de interconsultas digitales

**Fase 5 — Internación + Farmacia + Operación completa (Meses 18-24+)**
- Gestión de internación y camas
- Módulo de enfermería (Kardex electrónico, indicaciones, signos vitales)
- Farmacia interna (stock, unidosis, control de estupefacientes)
- Programación quirúrgica
- Checklist de cirugía segura digital
- Dashboard gerencial integral (BI)
- Integración con Red Nacional de Interoperabilidad en Salud

### Construir vs. integrar

**Construir propio:** Turnera (diferenciador central), gestión de pacientes/demografía, flujo clínico/HCE, lógica de facturación específica argentina. **Integrar con sistemas existentes:** AFIP (API facturación electrónica), Mercado Pago (API bien documentada), WhatsApp Business API, sistemas LIS existentes (vía HL7), PACS (vía DICOM), RENAPER (API validación identidad), plataformas bancarias.

### Modelo de precio recomendado

Precio en **pesos argentinos** (ventaja competitiva vs. competidores en dólares), con modelo **freemium**: turnera básica gratis → funcionalidades avanzadas pagas. Tiered por número de profesionales/agendas, módulos habilitados, y volumen de interacciones. Contratos anuales con cláusula de ajuste trimestral por inflación. Rango estimado: **ARS $15.000-80.000/mes por institución** para funcionalidades de rango medio (valores 2026).

### Checklist de compliance regulatorio

- Registrar base de datos ante Agencia de Acceso a la Información Pública (Ley 25.326)
- Implementar audit trails y firma electrónica (Decreto 1089/2012)
- Arquitectura de retención de datos por 10 años
- Capacidad de exportación de datos del paciente (copia en 48h)
- Integración AFIP para facturación electrónica
- Planificar registro en el Registro de Dominios de Interoperabilidad en Salud
- Registrar plataforma en ReNaPDiS si se implementa prescripción electrónica
- Compliance con SSS para funcionalidades de facturación a obras sociales
- Hosting en Argentina o país con nivel adecuado de protección de datos

---

## Conclusión: la ventana estratégica está abierta

El sector sanatorial argentino atraviesa una confluencia de presiones que hacen esta una ventana óptima para un nuevo sistema SaaS: la obligatoriedad de receta electrónica desde 2025, la Ley 27.706 empujando hacia HCE, la crisis financiera del sector que demanda eficiencia operativa, y un mercado incumbente dominado por soluciones legacy on-premise. **No existe hoy un SaaS moderno, cloud-native, diseñado para la escala sanatorial** — los nuevos entrantes apuntan a consultorios pequeños, y los sistemas establecidos como Geclisa cargan décadas de deuda técnica.

La estrategia de empezar por la turnera con Mercado Pago y WhatsApp no solo resuelve el dolor más agudo (ausentismo y líneas colapsadas), sino que establece el punto de entrada al sanatorio desde el cual expandir hacia HCE, facturación e internación. Córdoba ofrece un mercado de lanzamiento ideal: segunda economía de Argentina, ecosistema tecnológico activo, digitalización provincial en marcha, y un competidor incumbente (Geclisa, basada en la misma ciudad) cuya tecnología legacy es vulnerable a una alternativa moderna. El desafío mayor no será técnico sino de adopción: los sanatorios son instituciones conservadoras, y cada obra social agrega una capa de complejidad a la facturación. Pero **quien domine la facturación multi-obra social con una UX moderna habrá construido un moat difícil de replicar**.