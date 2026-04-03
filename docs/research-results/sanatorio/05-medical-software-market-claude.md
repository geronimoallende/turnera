# Mercado de software médico en Argentina: análisis integral para AlthemGroup

**Ningún competidor argentino ofrece hoy una plataforma verdaderamente integrada que combine turnos, PACS nativo, facturación a obras sociales, dictado por IA y portal del paciente.** Esa brecha es la oportunidad central de AlthemGroup. El mercado argentino de SaaS en salud creció de USD 123 millones en 2021 y se proyecta a **USD 489 millones para 2028** (CAGR 21,7%), impulsado por la receta electrónica obligatoria (Ley 27.553, ampliada a todas las órdenes médicas desde julio 2025) y la Estrategia Nacional de Salud Digital 2025-2030. Argentina cuenta con **3.174 hospitales, clínicas y sanatorios con internación** (1.740 privados), y la adopción de historia clínica electrónica ronda apenas el **17%**. En Córdoba provincia se estiman 80-120 clínicas/sanatorios privados: un mercado inicial alcanzable y con competencia tecnológica limitada respecto a Buenos Aires.

---

## 1. Sistemas HIS, RIS y PACS desplegados en Argentina

El ecosistema actual es **fragmentado y dominado por soluciones parciales**. Los grandes fabricantes internacionales (Philips, GE, Siemens) tienen presencia en equipamiento de imagen, pero sus sistemas PACS enterprise se concentran en hospitales de alta complejidad. Los proveedores locales cubren gestión administrativa pero raramente integran imagenología.

**Presencias internacionales confirmadas.** Agfa HealthCare tiene la instalación más documentada: un proyecto RIS/PACS de ~140 puestos en el **Hospital Garrahan** (Buenos Aires), incluyendo estaciones de diagnóstico y reconocimiento de voz Nuance. Esaote/SUITESTENSA opera a través de **Tecnoimagen S.A.** como distribuidor local, con certificado ANMAT para su RIS/PACS (Clase IIa). Philips (vía la adquisición de Carestream en 2019) tiene presencia probable, ya que Carestream Vue PACS fue nombrado "Best in KLAS" para LATAM en 2015-2016, pero no se confirmaron clientes argentinos específicos. Siemens Healthineers vende equipamiento de imagen a través de BioSud pero sin instalaciones PACS confirmadas. **IMEXHS** (Colombia), con su plataforma Aquila+ cloud-native desplegada en 500+ instituciones en 18 países, es un competidor regional emergente.

**Proveedores locales clave.** El caso más notable es el **Hospital Italiano de Buenos Aires**, que desarrolló su propio HIS/HCE desde 1998 con un equipo de ~200 profesionales de informática en salud: **228 millones de documentos clínicos digitalizados**, estándares HL7/FHIR y reconocimiento de HIMSS. Es el referente inalcanzable pero demuestra la demanda. En el segmento comercial, los principales son:

- **Geclisa/Macena (Córdoba)**: 30+ años, 200+ clientes, software integral hospitalario (turnos, HCE, internación, facturación, farmacia, contabilidad). Competidor directo principal en Córdoba.
- **Informe Médico**: Proveedor especializado de PACS/RIS con presencia en Córdoba (Hospital Italiano de Córdoba, Clínica Reina Fabiola). Fue hackeado en 2025 exponiendo **665.128 archivos de estudios médicos** de 30 clínicas.
- **MedTech/GDC**: 20+ años, 30+ instituciones, 100% cloud, facturación completa a obras sociales (PAMI, IOMA).
- **Integrando Salud**: Plataforma escalable aprobada por ReNaPDiS, con HL7 FHIR y SNOMED CT.
- **SiSalud RIS (Confluencia IT)**: El **único sistema argentino encontrado con integración explícita con PACS**, diseñado para centros de diagnóstico por imagen.

**Open-source.** No se confirmaron implementaciones productivas de Orthanc, dcm4chee u OpenMRS en instituciones argentinas. La Universidad de La Plata desarrolló un proyecto académico de PACS Cloud usando dcm4chee + OHIF Viewer en Docker, pero sin despliegue en producción.

> ⚠️ **Para investigación manual**: Confirmar clientes específicos de Philips Vue PACS y IMEXHS Aquila+ en Argentina mediante contacto directo con distribuidores.

---

## 2. Sistemas de turnos y gestión clínica: un mercado atomizado

El ecosistema de turneras argentinas se divide en tres capas: plataformas ligeras para consultorios individuales, sistemas de gestión integral para clínicas/sanatorios, y soluciones enterprise hospitalarias. La integración con WhatsApp y Mercado Pago es prácticamente obligatoria.

**El jugador dominante.** **Grupo Cormos** (fusión de DrApp + iTurnos + Docturno + adquisiciones de Meducar, ConsultorioMovil, Receto y Wiri Salud) invirtió **USD 10 millones** y reclama **más del 50% del mercado** de consultorios ambulatorios privados: 25.000 profesionales, 6.000 centros, 20+ millones de turnos/año. Su facturación 2025 ronda USD 2 millones con proyección de USD 3,5 millones para 2026. Sin embargo, **no ofrecen PACS, facturación avanzada a obras sociales, internación ni quirófanos**, lo que los descalifica para sanatorios complejos.

**Plataformas integrales para sanatorios.** Geclisa (Córdoba, 200+ clientes) es el incumbent más fuerte en el interior. MedTech/GDC (La Plata, 30+ instituciones) compite en el segmento de clínicas con facturación completa a PAMI, IOMA y otras obras sociales. **Argensoft** (Córdoba, 300+ centros, presencia en Argentina, Uruguay, Chile y España) ofrece una suite con app para pacientes y médicos. Ninguno de estos integra PACS nativamente.

**Dato clave sobre pricing.** Los precios van desde gratuito (Medicloud, Gendu, Emprenet para un médico) hasta modelos enterprise por cotización. Medicloud cobra $14.400-$22.400 ARS/mes; su bot de WhatsApp con IA cuesta **$150.000 ARS/mes adicionales**. Doctoralia cobra ~$25.000 ARS/mes solo por visibilidad y turnos. ClickSalud (nuevo, ~150 profesionales) destaca por ofrecer facturación a OSDE, Swiss Medical y Galeno con IA en WhatsApp.

---

## 3. Los dolores que los médicos y secretarias no toleran más

La investigación reveló cinco categorías de frustración que representan oportunidades directas para AlthemGroup.

**Facturación a obras sociales: el dolor más agudo.** Cada una de las cientos de obras sociales tiene requisitos diferentes de documentación, formatos propios de órdenes, reglas de autorización distintas y nomencladores con valores y actualizaciones asincrónicos. El Colegio de Bioquímicos de Tucumán documenta decenas de causales de débito: falta firma, error en carga de afiliado, código duplicado, orden vencida. **Cada error = pérdida de ingreso directa**. Ningún sistema resuelve esto completamente; las plataformas que más se acercan (Geclisa, MedTech) lo hacen con tecnología legacy.

**Fragmentación e interoperabilidad inexistente.** El sistema sanitario argentino tiene **nueve posibles orígenes de información** (tres subsectores × tres jurisdicciones). Un estudio CONICET/UBA con 43 médicos del AMBA encontró que los profesionales critican la HCE como "modelo extrapolado de países desarrollados que no responde a necesidades sanitarias de Argentina". Los consultorios pequeños y medianos usan 3-5 sistemas desconectados (agenda, HCE, facturación, WhatsApp, Excel), y la transferencia manual de datos es la norma.

**Interfaces anticuadas y rigidez.** Programas populares como Axon y Ofimedic "no permiten modificar la historia clínica, lo cual limita mucho la adaptación a la realidad diaria de cada profesional". La mayoría fue desarrollada con interfaces tipo Windows Forms de hace 15-20 años. Los médicos con más experiencia ven la tecnología como una carga, no como una ayuda.

**Ciberseguridad deficiente.** El hackeo a Informe Médico en 2025 expuso más de medio millón de estudios médicos de 30 clínicas (Hospital Británico, Sanatorio Anchorena). Los ataques cibernéticos al sector salud aumentaron **55%**. La regulación argentina de ciberseguridad no articula efectivamente la seguridad de la información con la protección de datos personales.

**El ausentismo destruye ingresos.** El "no-show" de pacientes es el pain point #1 que publicitan todas las plataformas de turnos. Las soluciones que funcionan: recordatorios por WhatsApp (canal dominante en Argentina), cobro anticipado vía Mercado Pago, y auto-cancelación inteligente. Medicloud reporta reducción de ausentismo del 40%.

---

## 4. Marco regulatorio: qué necesita AlthemGroup para operar legalmente

La buena noticia para AlthemGroup es que **un sistema de gestión clínica (HIS/turnos/HCE/facturación) generalmente NO requiere registro ANMAT**. La situación del PACS es más compleja.

**Regulación ANMAT actualizada.** La Disposición **ANMAT 64/2025** (enero 2025) reemplazó la histórica 2318/2002 e incorporó el nuevo Reglamento Técnico MERCOSUR. El software está explícitamente incluido en la definición de "producto médico", pero la Disposición 9688/2019 (Art. 26) excluye expresamente los **"programas informáticos para usos generales administrativos utilizados en el marco de la asistencia sanitaria"**. Esto significa:

- **Turnos, facturación, HCE documental, portal del paciente → NO requieren registro ANMAT**
- **PACS puro (almacenamiento y transmisión de imágenes) → zona gris**, probablemente no
- **PACS con herramientas de medición, diagnóstico o IA clínica → SÍ requiere registro ANMAT** (Clase II o superior)
- **Módulos de IA diagnóstica → SÍ, clasificados como SaMD** según marco IMDRF

ANMAT publicó una guía específica para SaMD/MLMD (en consulta pública) que adopta IEC 62304, ISO 14971 e ISO 13485. El proceso de registro toma **12-18 meses** y no se puede comercializar antes de obtener la autorización. No existe fast-track formal.

**Obligaciones ineludibles, independientemente de ANMAT:**

- **Ley 25.326** (Protección de Datos Personales): los datos de salud son **datos sensibles**. Requiere consentimiento informado, medidas de seguridad, confidencialidad, e inscripción de bases de datos ante la AAIP. La transferencia internacional está restringida a países con nivel adecuado de protección o con cláusulas contractuales aprobadas.
- **Ley 26.529** (Derechos del Paciente): la HCE informatizada es legal pero debe garantizar integridad, autenticidad, inalterabilidad y conservación mínima de **10 años**.
- **Ley 27.553** (Receta Electrónica): obligatoria desde enero 2025, ampliada a **todas las órdenes médicas desde julio 2025**. Requiere registro en **ReNaPDiS** (Registro Nacional de Plataformas Digitales de Salud).
- **Ley 10.590 de Córdoba**: crea el Sistema Provincial de Historia Clínica Electrónica Única, aplicable a instituciones públicas y privadas.
- **Estándares recomendados**: HL7 FHIR R4, SNOMED CT (edición argentina), CIE-10/11, DICOM para imágenes.

> ⚠️ **Acción inmediata requerida**: Registrarse en ReNaPDiS es **obligatorio** para emitir recetas y órdenes electrónicas. Consultar formalmente a ANMAT sobre la clasificación del componente PACS (consultas@anmat.gob.ar). Contratar asesoría legal para protección de datos.

---

## 5. Investigación de precios: cuánto paga el mercado argentino

### PACS

| Segmento | Modelo | Rango de precio estimado |
|----------|--------|--------------------------|
| PACS enterprise on-premise (Agfa, Esaote) | Licencia + mantenimiento | USD 100.000-500.000+ (paquete con equipamiento) |
| PACS on-premise para práctica pequeña (~1.000 estudios/mes) | Licencia + TCO 5 años | ~USD 40.000 total |
| Cloud PACS internacional (AdvaPACS, PostDICOM, Medicai) | Pay-per-study + infraestructura | USD 200-800/mes según volumen |
| PACS open-source (Orthanc/dcm4chee) implementado | Consultoría + hardware + soporte | USD 11.000-33.000 primer año |
| Mantenimiento PACS on-premise | Anual | 15-20% del precio del software |

### Software de gestión clínica/HIS

| Segmento | Modelo | Rango |
|----------|--------|-------|
| Consultorio individual | SaaS mensual | Gratis - USD 25/mes |
| Policonsultorio/centro médico | SaaS mensual | USD 50-150/mes |
| Clínica pequeña (10-30 camas) completa | SaaS mensual | USD 300-800/mes |
| HIS enterprise (Geclisa, Integrando Salud) | Cotización personalizada | USD 500-2.000/mes + implementación USD 5.000-30.000 |

### Turnos/Turnera

| Plataforma | Precio |
|------------|--------|
| Turnera.com.ar | Gratis + $270 ARS por 100 recordatorios WhatsApp |
| Gendu | $0-$9.900 ARS/mes |
| Medicloud | $0-$22.400 ARS/mes (bot WhatsApp: +$150.000 ARS/mes) |
| Doctoralia | ~$25.000 ARS/mes |
| TurnosEnLinea | USD 40/año dominio + USD 5/mes WhatsApp |

**Presupuesto IT realista de un sanatorio pequeño.** Con ingresos anuales estimados de USD 500.000-2.000.000 y un 2-3% destinado a IT, el presupuesto total ronda **USD 10.000-60.000/año**. De esto, el gasto en software se estima en **USD 3.600-14.400/año** (USD 300-1.200/mes). Un sanatorio pequeño **no puede pagar más de USD 20.000-25.000/año en software**. El modelo SaaS mensual en pesos argentinos es la preferencia clara del mercado.

> ⚠️ **Datos no encontrados**: Precios específicos de Geclisa, Informe Médico, Argensoft e Integrando Salud. Requieren cotización directa simulando ser un prospecto.

---

## 6. Matriz competitiva: funcionalidad × competidor

| Funcionalidad | Geclisa (Córdoba) | Grupo Cormos (DrApp+) | MedTech GDC | Integrando Salud | SiSalud RIS | Informe Médico | IMEXHS Aquila+ | **AlthemGroup (propuesta)** |
|---|---|---|---|---|---|---|---|---|
| **Turnos online** | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| **HCE completa** | ✅ | ✅ básica | ✅ | ✅ (FHIR) | Informes | ❌ | ❌ | ✅ |
| **PACS nativo** | ❌ (terceros) | ❌ | ❌ | ❌ | ✅ integra | ✅ | ✅ cloud | **✅** |
| **Facturación OS completa** | ✅ | ❌ | ✅ | ✅ (módulo) | ✅ | ❌ | ❌ | **✅** |
| **Dictado IA español** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | **✅** |
| **Portal paciente** | Básico | Crontu (nuevo) | ✅ | ✅ (app) | ❌ | Portal imágenes | ❌ | **✅** |
| **Receta electrónica** | ❌ | ✅ (Receto) | ✅ | ✅ | ❌ | ❌ | ❌ | **✅** |
| **WhatsApp nativo** | ❌ | Recordatorios | Recordatorios | ❌ | ❌ | ❌ | ❌ | **✅ (bot IA)** |
| **Internación/quirófanos** | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | **✅** |
| **100% Cloud** | Ambos | ✅ | ✅ | ✅ | ✅ | Ambos | ✅ | **✅** |
| **HL7 FHIR** | ❌ | ❌ | ❌ | ✅ | JSON | ❌ | ❌ | **✅** |
| **Precio en ARS** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ (USD) | **✅** |
| **Presencia en Córdoba** | ✅ fuerte | ✅ | Limitada | Nacional | Nacional | ✅ (Hosp. Italiano Cba) | ❌ | **✅** |

**Lectura clave de la matriz:** Ningún competidor llena todas las columnas. Geclisa es el más completo pero carece de PACS nativo, dictado IA y cloud moderno. Grupo Cormos domina turnos pero no sirve para sanatorios. Informe Médico e IMEXHS son fuertes en PACS pero no en gestión clínica. **La propuesta integrada de AlthemGroup no tiene equivalente directo en el mercado argentino.**

---

## 7. Los catalizadores que hacen urgente este momento

Tres fuerzas convergen para crear una ventana de oportunidad excepcional.

**Receta electrónica obligatoria.** La Resolución 2214/2025 exige que **todas las prescripciones y órdenes médicas** sean digitales a través de plataformas registradas en ReNaPDiS desde julio 2025. Cada clínica y sanatorio sin plataforma digital aprobada **necesita una ahora**. Este es el mayor catalizador del mercado en los últimos 20 años.

**Estrategia Nacional de Salud Digital 2025-2030.** Presentada con apoyo del BID, establece la interoperabilidad HL7 FHIR como estándar nacional, mide un Índice de Madurez Digital por jurisdicción, y despliega el programa IMPULSA con 5.000 millones de pesos en inversión y 5.189 computadoras distribuidas a jurisdicciones.

**Vulnerabilidad post-hackeo.** El ataque a Informe Médico (2025) que expuso 665.000+ estudios médicos generó conciencia sobre ciberseguridad en el sector. Un sistema cloud con encriptación robusta y cumplimiento normativo es ahora un argumento de venta, no solo un diferenciador.

---

## 8. Estrategia go-to-market recomendada para AlthemGroup

### Posicionamiento

*"La primera plataforma integrada de gestión clínica con PACS nativo, IA de dictado y portal del paciente, diseñada para sanatorios y clínicas de Argentina."*

### Ejecución por fases

**Fase 1 (meses 1-6): Cabeza de playa en Córdoba.** Implementar en el sanatorio piloto el módulo de **turnos + PACS cloud ligero** (basado en Orthanc + OHIF Viewer como base open-source) + portal básico del paciente. Pricing agresivo: freemium para turnos, fee por estudio almacenado en cloud. Objetivo: caso de éxito demostrable.

**Fase 2 (meses 6-12): Expansión modular.** Agregar facturación a obras sociales (empezar con APROSS, OSDE, Swiss Medical — las más comunes en Córdoba), receta electrónica (registro en ReNaPDiS obligatorio), y dictado por IA en español argentino como diferenciador premium.

**Fase 3 (meses 12-24): Escala regional.** HCE completa con internación y quirófanos. Expandir a 5-10 clínicas en Córdoba y ciudades cercanas (Rosario, Mendoza). Luego Buenos Aires.

### Canales de adquisición prioritarios

El **boca a boca médico-a-médico** es el canal #1 en Argentina, especialmente en el interior. Un director médico satisfecho en Córdoba vale más que cualquier campaña digital. Adicionalmente: alianzas con distribuidores de equipamiento de imagen (cuando un sanatorio compra un tomógrafo nuevo, necesita PACS), presencia en el Forum Salud Digital Argentina y congresos de la SAR, y alianzas con colegios médicos provinciales que comunican cambios regulatorios a sus matriculados.

### Pricing sugerido

- **Tier gratuito**: Turnos básicos + portal paciente limitado (competir con Medicloud/Receto)
- **Tier Profesional (USD 50-100/mes por médico)**: HCE + facturación + receta electrónica
- **Tier Premium (USD 200-500/mes por institución)**: PACS cloud + dictado IA + facturación avanzada + portal completo
- **PACS**: Cobro por estudio almacenado (modelo escalable)
- **Primeros 3 clientes**: Pricing preferencial o gratuito a cambio de testimonial

Cobrar siempre en **pesos argentinos**. Es una ventaja competitiva real frente a software dolarizado en un contexto de volatilidad cambiaria.

---

## 9. Riesgos que AlthemGroup debe mitigar

**Grupo Cormos podría expandirse hacia sanatorios.** Con USD 10 millones de inversión y adquisiciones agresivas, podrían agregar módulos de internación y PACS. Pero su ADN es consultorio ambulatorio, no complejidad hospitalaria; la expansión tomaría tiempo.

**Geclisa/Macena tiene 30 años de relaciones en Córdoba.** El lock-in no es solo tecnológico sino personal. La estrategia no debe ser atacar a Geclisa frontalmente sino capturar clínicas que Geclisa no atiende bien: las que necesitan PACS integrado, las que demandan modernidad, las que están migrando a digital por primera vez.

**La volatilidad económica argentina** afecta la capacidad de pago y genera incertidumbre. Cobrar en pesos pero tener costos cloud en dólares requiere gestión de margen cuidadosa. Considerar un modelo de pricing indexado o con ajuste trimestral.

**La facturación a obras sociales es técnicamente complejísima.** Es la mayor barrera de entrada pero también el mayor lock-in una vez lograda. **Contratar personal con experiencia real en facturación médica argentina** es más importante que cualquier decisión técnica.

---

## Resumen de oportunidad de mercado

| Dimensión | Dato |
|-----------|------|
| Establecimientos con internación (Argentina) | 3.174 (1.740 privados) |
| Clínicas/sanatorios privados estimados en Córdoba | 80-120 |
| Centros de diagnóstico por imágenes estimados (nacional) | 1.500-2.500 |
| Mercado SaaS salud Argentina 2021 | USD 123,3 millones |
| Proyección 2028 | USD 488,8 millones (CAGR 21,7%) |
| Mercado PACS/VNA LATAM 2024 | USD 350 millones |
| Adopción actual de HCE en Argentina | ~17% |
| Presupuesto IT anual de sanatorio pequeño | USD 10.000-60.000 |
| Gasto máximo realista en software | USD 20.000-25.000/año |

**La oportunidad es real y el timing es óptimo.** La receta electrónica obligatoria fuerza la digitalización de miles de instituciones. La brecha entre lo que existe (sistemas fragmentados, legacy, sin PACS integrado) y lo que necesitan (una plataforma unificada, moderna, accesible en pesos) es amplia. AlthemGroup no necesita ganar todo el mercado: capturar **50 sanatorios/clínicas pequeñas a USD 500/mes promedio** ya representa un negocio de **USD 300.000/año** recurrente, con potencial de escalar a cientos de instituciones.

La clave no es construir el sistema más completo del día uno. Es entrar con **turnos + PACS cloud + portal del paciente** como cabeza de playa, demostrar valor en el sanatorio piloto de Córdoba, y escalar modularmente agregando facturación, receta electrónica y dictado IA. El mercado está esperando una solución que una las piezas. AlthemGroup puede ser quien la construya.