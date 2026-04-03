# Portal de pacientes para clínicas argentinas: guía completa de implementación

Un portal de pacientes que reemplace la entrega de estudios por WhatsApp es **técnicamente viable, legalmente necesario y económicamente accesible** para una clínica como el Sanatorio de UPCN. El MVP —login con OTP, listado de estudios y descarga de PDFs— se puede construir en **3-4 semanas con un desarrollador senior** usando Supabase + Next.js, a un costo operativo de **~USD 100-200/mes** para 500-2000 pacientes. La clave del éxito no es la tecnología sino la estrategia de adopción: WhatsApp como canal de notificación (90%+ de penetración en Argentina), registro asistido en el mostrador del sanatorio, y un flujo de autenticación sin contraseñas que funcione para pacientes mayores de 40 años. El Hospital Italiano de Buenos Aires —con 700.000 usuarios registrados y 20.000 accesos diarios— demuestra que la adopción masiva es posible en el contexto argentino, aunque tomó años de desarrollo progresivo.

---

## 1. Qué ofrecen los mejores portales de pacientes del mundo

### Referentes internacionales

**Epic MyChart** domina el mercado estadounidense con el **37,7% de los hospitales de agudos** y una puntuación de 90,1 en Best in KLAS 2024 (séptimo año consecutivo). Sus funciones principales incluyen visualización de resultados de laboratorio con gráficos de tendencias, turnos, mensajería segura, recetas, facturación, teleconsulta y acceso delegado para familiares. El dato más relevante para UPCN: **el 87% de los pacientes adopta el portal cuando el médico lo recomienda**, versus el 57% cuando no lo hace. MyChart apunta a un nivel de lectura de cuarto grado y ofrece 12 idiomas. El **57% de los pacientes accede desde el celular**.

**Cerner (Oracle Health)** ofrece funciones similares pero con menor adopción reportada y una experiencia móvil menos pulida. **athenahealth** se destaca en consultorios independientes con diseño mobile-first, check-in previo a la consulta y IA para respuestas automáticas a consultas de pacientes. Todos estos portales comparten un patrón: **la visualización de resultados de laboratorio es la función #1 que impulsa la adopción** (utilizada por el 95,9% de los usuarios activos).

### El referente argentino: Hospital Italiano de Buenos Aires

El Portal del Paciente del Hospital Italiano es **el portal clínico más avanzado de América Latina**, con más de **700.000 usuarios registrados**, una tasa de uso anual superior al 60% y más de 20.000 accesos diarios. A diferencia de los portales de prepagas (OSDE, Swiss Medical, Galeno) que son fundamentalmente administrativos — credenciales digitales, autorizaciones, cartilla de prestadores — el Hospital Italiano ofrece un portal clínico completo:

- **Estudios**: visualización, descarga, compartir e incluso subir estudios externos (PDFs, imágenes, videos) que se integran al historial
- **Controles**: registro de peso, presión, glucemia con gráficos temporales
- **Medicamentos**: ver prescripciones, solicitar renovaciones, comprar medicación de la farmacia del hospital
- **Teleconsulta**: sincrónica (video) y asincrónica (teledermatología por formulario)
- **Compartir portal**: invitaciones de acceso por 30/60/90 días a familiares, con historial y revocación

La autenticación usa número de documento + contraseña, con registro inicial obligatorio desde PC. La app móvil tiene más de 146.000 descargas. Este es el benchmark regional para el Sanatorio de UPCN.

### Referentes brasileños y regionales

En Brasil, **Hospital Albert Einstein** ("Meu Einstein") ofrece acceso rápido a resultados, comparación temporal, importación de exámenes externos y guardia virtual 24/7, con **94% de satisfacción**. **Fleury**, la mayor red de laboratorios, permite login con CPF + email, descarga de PDFs, visualización de imágenes radiológicas y gestión de múltiples personas en una sola cuenta. Chile avanza con **Hospital Digital** del Ministerio de Salud, accesible mediante ClaveÚnica (identidad digital nacional), con más de un millón de consultas anuales.

### Opciones open source

| Plataforma | Portal de paciente | Soporte PDF | Madurez | Recomendación |
|------------|-------------------|-------------|---------|---------------|
| **OpenEMR** | ✅ Integrado | ✅ Sí | Alta | Mejor opción open-source para clínicas |
| **Bahmni** | 🔄 En desarrollo | 🔄 Planificado | Media | Prometedor pero no listo |
| **OpenMRS** | ❌ No tiene | ❌ Requiere desarrollo | Alta (backend) | Para programas de salud pública |
| **GNU Health** | ❌ No tiene | ❌ Requiere desarrollo | Media | Enfocado en epidemiología |

**OpenEMR** es la opción open-source más madura: incluye portal de pacientes con registro por email, visualización de documentos y resultados, mensajería segura, turnos online, pagos, firma de documentos y soporte multilingüe (34 idiomas). Sin embargo, está construido en PHP/MySQL, lo cual no se integra con el stack Supabase + Node.js de UPCN. **Ninguna plataforma open-source existente se adapta de manera eficiente a Supabase**, haciendo que construir desde cero sea más rápido para el alcance del MVP.

### Funciones que los pacientes realmente usan

Las funciones más utilizadas, en orden de importancia:

1. **Resultados de laboratorio e imágenes** — la "killer feature" indiscutible
2. **Gestión de turnos** — conveniencia directa
3. **Mensajería segura** con el equipo médico
4. **Lista de medicamentos** y solicitud de recetas
5. **Pago de facturas**

Las funciones menos utilizadas a pesar de estar disponibles: contenido educativo genérico, ingreso manual de datos de salud (signos vitales), notas personales, descarga de registros en formato CCD/CCR, acceso delegado formal (solo 0,4% de registro de proxies a pesar de su importancia) e integración con wearables.

---

## 2. Autenticación pensada para pacientes mayores de 40 años

### Métodos de autenticación en portales reales

Los portales argentinos actuales usan combinaciones variadas. **OSDE** permite login con usuario/contraseña y también con Google, Apple o Facebook; usa un "triple candado" de MFA y credenciales digitales con tokens rotativos de 3 dígitos cada 300 segundos. **Hospital Italiano** requiere documento + contraseña con registro inicial desde PC. **Swiss Medical** usa DNI para registro y usuario/contraseña para acceso.

A nivel gubernamental, **Mi Argentina / RENAPER** ofrece un Sistema de Identidad Digital (SID) con validación biométrica facial contra la base de datos de RENAPER. Tiene 3 niveles de cuenta; el nivel 3 (biométrico) habilita acceso a datos sensibles de salud. El SDK de RENAPER está técnicamente disponible para aplicaciones de terceros, aunque su uso actual se limita a servicios gubernamentales.

### La autenticación más simple y segura para pacientes no tecnológicos

La investigación es contundente: **la autenticación de dos factores es la barrera de usabilidad #1 para adultos mayores**. Los pacientes piden explícitamente métodos más simples. Las mejores opciones para el Sanatorio de UPCN, ordenadas de más simple a más compleja:

1. **OTP por SMS/WhatsApp** (recomendado para MVP): el paciente ingresa su número de teléfono, recibe un código de 6 dígitos, lo ingresa. Carga cognitiva mínima, no requiere recordar contraseñas.
2. **Magic link por email**: el paciente ingresa su email, recibe un enlace, hace click. Igual de simple pero requiere acceso a email.
3. **Biometría en móvil** (Face ID/Touch ID): elimina completamente la memorización. Ideal como capa de conveniencia después del primer login.
4. **DNI + fecha de nacimiento + OTP**: verificación de identidad basada en conocimiento + segundo factor. Más seguro, ligeramente más complejo.

**Recomendación para UPCN**: OTP por WhatsApp como método primario (el paciente ya viene de WhatsApp → click en link → ingresa código recibido por SMS). Magic link por email como fallback. Evitar usuario/contraseña tradicional.

### Links de un solo uso: ¿son viables y seguros?

Sí, son viables con las salvaguardas correctas. Los magic links son maduros en 2026, con soporte nativo en Supabase, SuperTokens, Auth0 y otros. La implementación segura requiere: tokens criptográficos de ≥256 bits, almacenar solo el hash del token, expiración de **10-15 minutos**, uso único (invalidar inmediatamente al primer acceso), HTTPS obligatorio, rate-limiting (3 intentos/día por cuenta), y opcionalmente una verificación secundaria (fecha de nacimiento) después del click.

Para datos de salud, un magic link solo constituye un único factor de autenticación (la bandeja de email = identidad). **Se recomienda complementar con una señal secundaria** como ingreso de fecha de nacimiento o últimos dígitos del DNI para acceder a datos sensibles.

### Acceso familiar y pediátrico

El acceso delegado es crítico para el contexto de UPCN, donde pacientes mayores frecuentemente necesitan que "mi hija vea mis resultados". Las mejores prácticas incluyen:

- **Credenciales separadas para cada delegado** (nunca compartir contraseñas)
- **Control granular**: qué información puede ver el delegado
- **Revocación en cualquier momento** por el paciente
- **Auditoría completa** de todas las acciones del delegado
- **Auto-expiración** configurable

Legalmente en Argentina, la **Ley 26.529 Art. 4** establece que la información de salud solo puede proporcionarse a terceros con autorización del paciente o por orden judicial. La Ley 25.326 requiere consentimiento previo, expreso e informado para transferir datos sensibles.

Para menores, **OSDE** otorga credenciales propias a partir de los 13 años. **Mi Argentina** permite a padres con nivel 3 asociar hijos menores de 18 mediante DNI del menor, verificado por RENAPER. La **Ley 26.529 Art. 2(e)** reconoce el derecho de niños y adolescentes a participar en decisiones sobre sus terapias médicas.

### Recuperación de credenciales

Para pacientes no tecnológicos, las opciones más efectivas son: recuperación por SMS al teléfono registrado (la más simple), magic link por email, recuperación presencial en el sanatorio con DNI (modelo OSDE), y línea telefónica de soporte con verificación de identidad.

---

## 3. Cómo mostrar estudios médicos en PDF y resultados de laboratorio

### Visualización de PDFs en el navegador

La mejor práctica es ofrecer **ambas opciones: visualización inline y descarga**. La visualización inline permite revisión rápida sin salir del portal; la descarga permite guardar, imprimir y compartir. Para el MVP, un simple `<iframe src={signedUrl}>` funciona como solución mínima. Para una experiencia más robusta, especialmente en móvil:

**PDF.js (Mozilla)** es la librería recomendada: licencia Apache 2.0, renderizado completo en Canvas HTML5, selección de texto, búsqueda, zoom/rotación, navegación por páginas. Disponible como `pdfjs-dist` vía npm. En React, se usa `react-pdf` como wrapper. En Vue, `vue-pdf`.

Para dispositivos móviles (donde llegarán la mayoría de los pacientes desde WhatsApp), la renderización nativa de PDFs en `<iframe>` es inconsistente. Se recomienda usar PDF.js con renderizado página-por-página, permitiendo pinch-to-zoom y navegación por swipe. Como fallback, incluir siempre un botón prominente de "Descargar PDF".

**Consideraciones de accesibilidad**: los PDFs de equipos médicos son frecuentemente imágenes escaneadas (no texto seleccionable), lo cual es una barrera para lectores de pantalla. Cuando sea posible, proveer un resumen en texto plano o HTML junto al PDF.

### Presentación de resultados de laboratorio

Cuando el sanatorio evolucione más allá de PDFs hacia resultados estructurados, la investigación muestra que la presentación óptima incluye:

- **Tabla con rangos normales**: columnas para nombre del test, valor, rango de referencia, unidades y flag (alto/bajo/normal)
- **Sistema semáforo de colores**: verde (normal), amarillo (límite), rojo (anormal). Un estudio del portal Saltro en Holanda demostró mejora significativa en la comprensión de los pacientes
- **Gráficos de tendencia**: líneas temporales con bandas de rango normal sombreadas, especialmente valiosos para pacientes crónicos (HbA1c, colesterol, glucemia)
- **Explicaciones en lenguaje simple**: no-técnico, a nivel de lectura básico. Mount Sinai redujo las llamadas relacionadas con resultados de laboratorio en un **68%** al agregar explicaciones contextuales generadas por NLP
- **Indicadores visuales de rango**: barras tipo velocímetro que muestran dónde cae el valor del paciente dentro del rango de referencia

### DICOM para el futuro (sin PACS actual)

Dado que UPCN almacena estudios como PDFs sin sistema PACS/DICOM, la transición futura sería gradual:

**Paso 1 — Sin PACS**: Usar **DWV (DICOM Web Viewer)**, un visor liviano que carga imágenes DICOM desde URLs sin necesitar servidor PACS. Fue integrado exitosamente en la plataforma de telemedicina nacional de India (eSanjeevani) sin servidor PACS. Soporta window/level, zoom, mediciones, scroll multiframe.

**Paso 2 — PACS liviano**: Implementar **Orthanc**, un mini-PACS open-source (GPL-3.0) que es liviano, fácil de instalar, con API REST y soporte DICOMweb. Ideal para clínicas pequeñas/medianas. Costo: ~USD 50-200/mes en la nube.

**Paso 3 — Visor completo**: Integrar **OHIF Viewer**, el estándar de oro para visualización DICOM web. Open-source, desarrollado por Massachusetts General Hospital. Soporta 2D/3D, MPR, segmentación, mediciones. Se conecta con cualquier archivo compatible con DICOMweb.

**Costo estimado**: el software es gratuito; la infraestructura para Orthanc en la nube es ~USD 50-200/mes dependiendo del almacenamiento. Las imágenes médicas son grandes (un estudio de TC = 100-500 MB).

---

## 4. Compartir resultados con otros médicos de forma segura

### Mecanismos de compartición

Los pacientes frecuentemente necesitan compartir resultados con otros profesionales. Los mecanismos recomendados, de más simple a más sofisticado:

**Links temporales con token**: generar una URL única con token criptográfico, expiración configurable (24 horas por defecto), uso limitado (máximo 5 accesos). El paciente copia el link y lo envía por WhatsApp, email o cualquier medio al médico destinatario. Patient Access (UK) usa este modelo con códigos de acceso adicionales y contador de visualizaciones.

**Códigos QR dinámicos**: codifican una URL hacia la página de compartición temporal del portal (no los datos en sí, que serían demasiado grandes). TMD Cloud (Alemania) implementa QR con disponibilidad de 90 días, limpieza automática GDPR y 2FA. Útil para compartir durante una consulta presencial.

**Exportación a PDF/email**: generar PDF desde datos estructurados y enviarlo. Preferiblemente, enviar notificación con link al portal (evita PHI en email).

### Implementación técnica segura

Los componentes clave para compartición segura incluyen: tokens JWT o UUID en URLs, expiración configurable (1 hora para emergencias, 24 horas estándar, hasta 90 días), opción de uso único, protección con PIN/código de acceso compartido por canal separado, binding al primer dispositivo que abre el link, auditoría completa de accesos, y revocación inmediata por el paciente en cualquier momento.

### Interoperabilidad FHIR en Argentina

Argentina ha adoptado oficialmente **FHIR R4** como estándar nacional de interoperabilidad (Resolución 680/2018). La **Red Nacional de Salud Digital** usa REST + FHIR para todos los servicios web. Argentina fue **el primer país en publicar perfiles FHIR nacionales completos** cubriendo historia clínica compartida, intercambio de información, prescripción electrónica y referencia/contrarreferencia.

Los recursos FHIR relevantes para el portal de UPCN son:
- **DocumentReference**: ideal para almacenar/recuperar PDFs de estudios (el caso actual de UPCN)
- **DiagnosticReport**: para reportes estructurados (futuro)
- **Observation**: para resultados individuales de laboratorio (futuro)

La plataforma **HSI (Historia de Salud Integrada)**, desarrollada por Lamansys con el Ministerio de Salud, conecta **1.800+ instituciones** con 6 millones de pacientes y 35 millones de documentos clínicos. El objetivo para 2026 es un resumen clínico portable en el celular del paciente. Este es el ecosistema hacia donde UPCN eventualmente podría integrarse.

---

## 5. WhatsApp como motor de notificación y adopción

### Por qué WhatsApp es el canal obligatorio para Argentina

WhatsApp tiene **90-93% de penetración** entre usuarios de internet en Argentina. Los argentinos pasan un promedio de **29 horas/mes** en WhatsApp — 11 horas más que el promedio global. WhatsApp reemplazó efectivamente al SMS en América Latina. Tiene una tasa de apertura del **98%** (vs. 21,5% para email) y click-through del **45-60%** (vs. 29% para SMS).

El caso de **Salud Digna** en México es un referente directo: enviaron **2 millones de resultados de COVID-19** y **5,1 millones de confirmaciones de turnos** vía WhatsApp. El 89% de las interacciones no requirió agente humano.

### Estrategia de notificación multi-canal

La estrategia recomendada es cascading multi-canal:

1. **Primario (WhatsApp)**: template de utilidad con link al portal — mayor engagement en Argentina
2. **Secundario (SMS)**: fallback para pacientes sin WhatsApp
3. **Terciario (Email)**: para pacientes que lo prefieren o como documentación adicional
4. **Último recurso (Llamada telefónica o papel)**: para pacientes que no responden digitalmente

Permitir al paciente **elegir su canal preferido** mediante un centro de preferencias simple.

### Costos de WhatsApp Business API

Desde julio 2025, Meta cobra por mensaje (antes por conversación). Para Argentina:

| Tipo de mensaje | Costo por mensaje (USD) |
|----------------|------------------------|
| Utilidad (notificación de estudio) | $0,026 |
| Autenticación (OTP) | $0,026 |
| Marketing | $0,062 |
| Servicio (respuestas del paciente en ventana 24h) | GRATIS |

Para 500 pacientes × 2 notificaciones/mes = **USD 26/mes**. Para 2.000 pacientes = **USD 104/mes**. Más la suscripción del BSP (Business Solution Provider): ~USD 50-100/mes.

### Tasas de adopción realistas

| Métrica | Tasa | Fuente |
|---------|------|--------|
| Adopción promedio general (meta-análisis) | 52% | Revisión sistemática, 40 estudios |
| Adopción real sin promoción activa | 23% | Mismo meta-análisis |
| Adopción en experimentos controlados | 71% | Mismo meta-análisis |
| Pacientes 65+ vs. menores de 65 | OR 0,48 (52% menos probable) | PMC |
| Hospital Italiano (Argentina) | 700.000 usuarios, 60%+ uso anual | Datos del hospital |
| Hospital Posadas (Argentina, sin promoción) | ~4.000 usuarios desde 2021 | Datos públicos |

**Expectativa realista para UPCN**: **20-30% de adopción en el primer año** sin esfuerzo agresivo; potencialmente **50-65%** con equipo dedicado, registro asistido en mostrador y recomendación activa de los médicos. Un **15-30% de pacientes nunca adoptará** el portal — se debe mantener un canal alternativo permanente.

### Estrategia de transición progresiva desde WhatsApp

**Fase 1 (Coexistencia)**: continuar enviando resultados por WhatsApp Y agregar link al portal. "Tus resultados están listos. Podés verlos acá: [link portal]. También podés verlos cuando quieras en nuestro portal."

**Fase 2 (Notificación + Portal)**: solo notificación por WhatsApp, resultados disponibles únicamente en el portal. "Tu estudio de laboratorio ya está disponible. Ingresá para verlo: [link portal]."

**Fase 3 (Portal-first)**: el portal es el canal primario. WhatsApp solo como alerta.

**Nunca eliminar WhatsApp completamente**: mantener como canal de notificación y para pacientes que necesitan soporte híbrido.

### Estrategias específicas para pacientes mayores

Las barreras principales para pacientes 50+ son: alfabetización digital limitada, falta de necesidad percibida, preocupaciones de confianza sobre sistemas electrónicos, preferencia por comunicación presencial (64% en un estudio), y problemas de visión/destreza.

Las intervenciones más efectivas son:

- **Registro asistido en mostrador**: la intervención de mayor ROI. Personal dedicado que ayuda al paciente con el primer login durante su visita al sanatorio
- **"Embajadores digitales"**: personal del sanatorio entrenado para dar instrucción personalizada uno a uno
- **Acceso delegado fácil**: permitir que familiares accedan en nombre del paciente mayor
- **Interfaz simplificada**: fuentes grandes, navegación clara, mínimos pasos
- **Guías impresas**: instrucciones paso a paso con capturas de pantalla en letra grande
- **Tutoriales por WhatsApp**: enviar instrucciones paso a paso con screenshots por el mismo canal que ya usan diariamente

---

## 6. Marco legal argentino: qué exige la ley

### Tres leyes fundamentales

**Ley 25.326 (Protección de Datos Personales, 2000)**: clasifica los datos de salud como **"datos sensibles"** (Art. 2). Requiere consentimiento previo, libre, expreso e informado para el tratamiento, y **consentimiento expreso y por escrito** para datos sensibles (Art. 5). El responsable del tratamiento debe adoptar medidas técnicas y organizativas necesarias para garantizar la seguridad y confidencialidad, con **"mayor esmero de seguridad, confidencialidad, restricciones de acceso, uso y circulación"** para datos sensibles (Art. 9). La transferencia a terceros requiere consentimiento expreso (Art. 11). La transferencia internacional está prohibida a países sin protección adecuada (Art. 12). Es **obligatorio registrar las bases de datos** ante la AAIP.

**Ley 26.529 (Derechos del Paciente, 2009)**: establece que la historia clínica puede ser digital siempre que se garantice **integridad, autenticidad, inalterabilidad, durabilidad y recuperabilidad** (Art. 13). El paciente es **titular** de la historia clínica y debe recibir copia autenticada en **48 horas** (Art. 14). La retención mínima es de **10 años** desde la última anotación (Art. 18). El acceso legítimo corresponde al paciente, representantes legales, apoderados y, en caso de fallecimiento, sucesores (Art. 19).

**Ley 27.706 (Historia Clínica Electrónica Federal, 2023)**: crea el sistema unificado de registros clínicos electrónicos interoperables. Define tres niveles de acceso (consulta, consulta+actualización, consulta+actualización+modificación). Exige **trazabilidad** de todas las acciones (Art. 7e), **auditabilidad** (Art. 6f), mecanismos de autenticación garantizados, firma digital o electrónica (Ley 25.506), y recuperación de archivos.

### Requisitos de seguridad obligatorios

La **Resolución AAIP 47/2018** establece las medidas de seguridad recomendadas para datos personales. Para datos sensibles (salud), exige niveles superiores de control de acceso, destrucción segura, detección/respuesta a incidentes, y controles técnicos diversos.

| Requisito | Base legal | Implementación recomendada |
|-----------|------------|---------------------------|
| Cifrado en tránsito | Ley 25.326 Art. 9 + Res. 47/2018 | TLS 1.2 o 1.3 |
| Cifrado en reposo | Ley 25.326 Art. 9 + Res. 47/2018 | AES-256 |
| Auditoría de accesos | Ley 27.706 Art. 7(e) | Log de quién, cuándo, qué dato |
| Retención mínima | Ley 26.529 Art. 18 | **10 años** desde última anotación |
| Consentimiento informado | Ley 25.326 Art. 5-6 | Escrito para datos sensibles |
| Registro de base de datos | Ley 25.326 | Ante la AAIP (obligatorio) |
| Firma digital/electrónica | Ley 25.506 + Ley 27.706 | Para documentos clínicos |

### Residencia de datos: ¿obligatorio hosticar en Argentina?

**No existe requisito explícito de localización de datos de salud** bajo la Ley 25.326. Sin embargo, la transferencia internacional está prohibida a países sin "protección adecuada". Los países con protección adecuada incluyen la UE/EEE. Supabase ofrece hosting en regiones que pueden cumplir este requisito. **La recomendación práctica es hosticar en Argentina o en un país con protección adecuada reconocida** para minimizar riesgo regulatorio. Si se usan proveedores cloud con regiones en Sudamérica (AWS São Paulo, por ejemplo), se debe complementar con cláusulas contractuales estándar.

### Equivalencia con HIPAA

Argentina no tiene un equivalente único de HIPAA. La cobertura se logra mediante la combinación de leyes:

| HIPAA | Equivalente argentino |
|-------|----------------------|
| Privacy Rule | Ley 25.326 + Ley 26.529 Art. 2 |
| Security Rule | Ley 25.326 Art. 9 + Res. AAIP 47/2018 + Ley 27.706 Art. 7 |
| Breach Notification | No existe obligación actual (Convention 108+ lo incluirá) |
| Patient Access | Ley 26.529 Art. 14 (copia en 48h) |
| Enforcement | AAIP (multas, clausura de BD) + Arts. 117 bis y 157 bis del Código Penal |

---

## 7. Evaluación de viabilidad como producto

### ¿Es realista como Fase 5 después del sistema de turnos?

**Sí, es altamente viable**. El sistema de turnos ya tiene datos de pacientes (DNI, teléfono, email) y la infraestructura Supabase. El portal de pacientes es una extensión natural. El MVP es simple: 4 pantallas (login, verificación OTP, listado de estudios, detalle/descarga PDF).

### Construir desde cero vs. adaptar open source

**Construir desde cero es más rápido para este alcance**. Ningún portal open-source existente está construido sobre Supabase. OpenEMR tiene portal pero es PHP/MySQL. Medplum es excelente para FHIR pero extremadamente complejo para un portal de descarga de PDFs. El MVP tiene solo 4 pantallas — construirlo con Next.js + Supabase toma aproximadamente lo mismo que aprender y adaptar un sistema existente.

### ¿App separada o integrada en la turnera?

**Recomendación: subdominio separado, mismo proyecto Supabase.** Portal en `portal.clinica.com` (Next.js en Vercel), turnera en `turnos.clinica.com` (app existente). Misma base de datos Supabase compartida, con RLS separando los datos. Las razones: roles de usuario diferentes (paciente vs. admin), flujos de auth diferentes, deployment más simple, mantenimiento más fácil.

### Costos operativos mensuales estimados

| Componente | 500 pacientes | 1.000 pacientes | 2.000 pacientes |
|------------|--------------|-----------------|-----------------|
| Supabase Pro | USD 25 | USD 25 | USD 25 |
| WhatsApp notificaciones | USD 26 | USD 52 | USD 104 |
| WhatsApp BSP | USD 50 | USD 50 | USD 50 |
| SMS OTP (si se usa) | USD 47 | USD 93 | USD 187 |
| Hosting (Vercel) | USD 0 | USD 0 | USD 20 |
| **Total (OTP por WhatsApp)** | **~USD 101/mes** | **~USD 127/mes** | **~USD 199/mes** |
| **Total (OTP por SMS)** | **~USD 148/mes** | **~USD 220/mes** | **~USD 386/mes** |

**Optimización de costos**: usar OTP por WhatsApp en vez de SMS ahorra ~72% (USD 0,026 vs. USD 0,094 por mensaje). Empezar con Supabase Pro (USD 25/mes). Usar tier gratuito de Vercel para hosting. Usar magic links por email cuando sea posible (gratuito vía Supabase).

**Almacenamiento de PDFs**: un estudio médico promedio pesa 2-5 MB. Para 2.000 pacientes × 10 estudios/año × 3 MB = ~60 GB/año. El plan Pro de Supabase incluye 100 GB, suficiente para los primeros 1-2 años.

---

## 8. Flujo completo del usuario

### Camino exitoso (happy path)

```
1. LA CLÍNICA SUBE UN ESTUDIO
   → El sistema almacena el PDF en Supabase Storage
   → Crea registro en tabla `studies`
   → Envía WhatsApp al paciente:
     "Hola Juan! Tu estudio de laboratorio ya está disponible.
      Ingresá al portal: https://portal.sanatorio-upcn.com/auth?ref=abc123"

2. EL PACIENTE ABRE EL LINK (desde WhatsApp en su celular)
   → Llega a la página de login del portal
   → Ingresa su número de teléfono (pre-rellenado si es posible)

3. VERIFICACIÓN DE IDENTIDAD
   → El sistema envía OTP de 6 dígitos por SMS
   → El paciente ingresa el código
   → Verificado → sesión creada → redirigido al listado

4. LISTADO DE ESTUDIOS
   → Ve todos sus estudios disponibles, más recientes primero
   → Cada tarjeta muestra: tipo de estudio, fecha, ícono de estado

5. VER ESTUDIO
   → Abre visor PDF inline (en celular) O
   → Descarga el PDF al dispositivo

6. COMPARTIR CON OTRO MÉDICO (opcional)
   → Toca botón "Compartir"
   → Elige expiración (24h, 48h, 7 días)
   → Se genera link copiable + opcionalmente código QR
   → Lo envía por WhatsApp al médico

7. CIERRE DE SESIÓN
   → Sesión destruida → redirigido al login
```

### Estados de error y caminos alternativos

| Estado | Manejo |
|--------|--------|
| OTP expirado | "Código expirado" + botón "Reenviar código" |
| Máximos intentos de OTP | Bloqueo por 5 minutos + contacto de soporte |
| Magic link expirado | "Este link ya venció" + botón "Enviar nuevo link" |
| Sin estudios disponibles | "Todavía no tenés estudios disponibles" |
| Error al cargar PDF | "Error al cargar. Probá descargarlo" + botón de descarga |
| Link compartido expirado | "Este link ya expiró. Pedile al paciente uno nuevo" |
| Error de red | Botón reintentar + mensaje offline |
| Sesión expirada | Redirect a login con "Tu sesión expiró, ingresá de nuevo" |
| Paciente no registrado | "No encontramos una cuenta con este número. Consultá en el sanatorio" |
| Teléfono cambiado | Flujo de recuperación presencial en el sanatorio |

---

## 9. Portal Mínimo Viable: especificación técnica

### Arquitectura

```
[WhatsApp] ←→ [BSP (Twilio/360dialog)] ←→ [Supabase Edge Functions]
                                                    ↓
[Celular del paciente] → [Next.js en Vercel] ←→ [Supabase]
                              ↓                      ├── Auth (OTP/Magic Link)
                          4 pantallas:               ├── Database (PostgreSQL + RLS)
                          - /login                   ├── Storage (PDFs privados)
                          - /verify                  └── Edge Functions
                          - /studies
                          - /studies/[id]
```

### Stack tecnológico

| Capa | Tecnología | Justificación |
|------|-----------|---------------|
| Frontend | Next.js 15 + Tailwind CSS + shadcn/ui | Mejor integración con Supabase, SSR, deploy gratuito en Vercel |
| Backend | Supabase (PostgreSQL + Auth + Storage + Edge Functions) | Ya está en el stack actual |
| Visor PDF | `react-pdf` (wrapper de PDF.js) o `<iframe>` para MVP | Open-source, maduro |
| Notificaciones | WhatsApp Business API vía Twilio o 360dialog | 90%+ penetración en Argentina |
| Deploy | Vercel (free tier) | Integración nativa con Next.js |

### Esquema de base de datos

```sql
-- PACIENTES (extiende auth.users)
CREATE TABLE patients (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  dni VARCHAR(20) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  birth_date DATE NOT NULL,
  clinic_id UUID REFERENCES clinics(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ESTUDIOS
CREATE TABLE studies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id),
  study_type VARCHAR(100) NOT NULL, -- 'laboratorio','radiografia','ecografia'
  study_date DATE NOT NULL,
  description TEXT,
  file_path TEXT NOT NULL,          -- ruta en Supabase Storage
  file_size_bytes BIGINT,
  status VARCHAR(20) DEFAULT 'available'
    CHECK (status IN ('processing','available','archived')),
  uploaded_by UUID REFERENCES auth.users(id),
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  clinic_id UUID REFERENCES clinics(id)
);

-- LOG DE AUDITORÍA DE ACCESOS
CREATE TABLE study_access_log (
  id BIGSERIAL PRIMARY KEY,
  study_id UUID NOT NULL REFERENCES studies(id),
  accessed_by UUID REFERENCES auth.users(id),
  access_type VARCHAR(20) NOT NULL
    CHECK (access_type IN ('view','download','share')),
  ip_address INET,
  user_agent TEXT,
  accessed_at TIMESTAMPTZ DEFAULT NOW()
);

-- LINKS DE COMPARTICIÓN
CREATE TABLE share_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  study_id UUID NOT NULL REFERENCES studies(id),
  created_by UUID NOT NULL REFERENCES patients(id),
  token VARCHAR(64) UNIQUE NOT NULL
    DEFAULT encode(gen_random_bytes(32), 'hex'),
  recipient_name VARCHAR(200),
  expires_at TIMESTAMPTZ NOT NULL,
  max_access_count INT DEFAULT 5,
  access_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- NOTIFICACIONES
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id),
  study_id UUID REFERENCES studies(id),
  channel VARCHAR(20) NOT NULL
    CHECK (channel IN ('whatsapp','email','sms','push')),
  status VARCHAR(20) DEFAULT 'pending'
    CHECK (status IN ('pending','sent','delivered','failed','read')),
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ACCESO FAMILIAR (delegados)
CREATE TABLE family_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id),
  delegate_id UUID NOT NULL REFERENCES patients(id),
  relationship VARCHAR(50),
  access_level VARCHAR(20) DEFAULT 'read',
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  UNIQUE(patient_id, delegate_id)
);

-- CLÍNICAS (multi-tenant)
CREATE TABLE clinics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(100) UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ÍNDICES
CREATE INDEX idx_studies_patient ON studies(patient_id);
CREATE INDEX idx_studies_clinic ON studies(clinic_id);
CREATE INDEX idx_access_log_study ON study_access_log(study_id);
CREATE INDEX idx_share_token ON share_links(token);
CREATE INDEX idx_notifications_patient ON notifications(patient_id);
CREATE INDEX idx_patients_dni ON patients(dni);

-- RLS: pacientes solo ven sus propios estudios (+ delegados)
ALTER TABLE studies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_or_delegated_studies" ON studies
  FOR SELECT TO authenticated
  USING (
    patient_id = auth.uid()
    OR patient_id IN (
      SELECT patient_id FROM family_access
      WHERE delegate_id = auth.uid() AND is_active = true
    )
  );
```

### Endpoints de API

**Autenticación:**
- `POST /auth/login/otp` — enviar OTP por SMS/WhatsApp
- `POST /auth/verify` — verificar código OTP
- `POST /auth/login/magic-link` — enviar magic link por email
- `GET /auth/callback` — manejar redirect del magic link
- `POST /auth/logout` — cerrar sesión

**Estudios:**
- `GET /api/studies` — listar estudios del paciente (paginado)
- `GET /api/studies/:id` — obtener metadata del estudio
- `GET /api/studies/:id/download` — obtener signed URL para descarga
- `GET /api/studies/:id/view` — obtener signed URL para visualización inline

**Compartición:**
- `POST /api/studies/:id/share` — crear link de compartición
- `GET /api/shared/:token` — acceder a estudio compartido (público, sin auth)
- `DELETE /api/share-links/:id` — revocar link
- `GET /api/share-links` — listar links activos

**Webhooks:**
- `POST /webhooks/study-uploaded` — trigger cuando la clínica sube un nuevo estudio
- `POST /webhooks/whatsapp-status` — callback de estado de entrega de WhatsApp

### Componentes frontend

1. **Página de Login** (`/login`): input de teléfono, botón "Enviar código", link a "Ingresar con email"
2. **Página de Verificación** (`/verify`): 6 inputs para dígitos del OTP, timer de reenvío, botón "Verificar"
3. **Listado de Estudios** (`/studies`): tarjetas o tabla con tipo, fecha y estado. Filtro por tipo. Ordenado por fecha descendente
4. **Detalle del Estudio** (`/studies/[id]`): visor PDF inline + botones "Descargar" y "Compartir". Modal de compartición con selector de expiración
5. **Navegación**: bottom nav en móvil (Estudios, Perfil), sidebar en desktop
6. **Estados vacíos/error**: componentes reutilizables para "sin estudios", "sesión expirada", "error de carga"

### Tiempos estimados de desarrollo

| Fase | Alcance | Tiempo |
|------|---------|--------|
| Setup backend | Proyecto Supabase, schema, RLS, storage | 2-3 días |
| Flujo de auth | OTP/magic link, middleware, sesiones | 3-4 días |
| API de estudios | Endpoints CRUD, signed URLs | 2-3 días |
| Frontend (4 pantallas) | Login, OTP, listado, detalle+PDF | 5-7 días |
| Integración WhatsApp | Webhook de notificación, template | 2-3 días |
| Testing y pulido | Responsivo, estados de error, accesibilidad | 3-4 días |
| **Total MVP** | | **~3-4 semanas** (1 dev senior) |

Para un equipo menos experimentado: **5-6 semanas**. Este estimado asume un desarrollador full-stack familiarizado con Next.js y Supabase.

### Costos mensuales del MVP en producción

| Componente | Costo mensual (USD) |
|------------|-------------------|
| Supabase Pro | 25 |
| WhatsApp BSP + mensajes (500 pac.) | 76 |
| Vercel Free Tier | 0 |
| Dominio .com.ar | ~1 (USD 12/año) |
| SSL | 0 (incluido) |
| **Total** | **~USD 102/mes** |

---

## Conclusión: recomendaciones prácticas para el Sanatorio de UPCN

El portal de pacientes no es un proyecto ambicioso de transformación digital — es una mejora incremental y concreta sobre el flujo actual de WhatsApp, con un costo operativo inferior a USD 200/mes y un desarrollo de 3-4 semanas. La decisión técnica más importante es **no construir de más**: el MVP de 4 pantallas (login → OTP → listado → PDF) cubre el 90% de la necesidad real.

La decisión estratégica más importante es **invertir en adopción, no en funcionalidades**. El Hospital Italiano tardó años en alcanzar 700.000 usuarios. UPCN debe comenzar con registro asistido en mostrador, recomendación activa por parte de los médicos, y un período de coexistencia con WhatsApp. La meta realista para el primer año es **30-40% de adopción** con esfuerzo moderado, sabiendo que un 15-30% de pacientes nunca migrará al portal digital.

Tres insights clave que la investigación revela y que no son evidentes a primera vista. Primero, **la autenticación sin contraseña no es un lujo sino una necesidad**: para pacientes mayores de 40, cada paso adicional en el login es una barrera de adopción. OTP por WhatsApp es la opción óptima para Argentina. Segundo, **la compartición de estudios es una función subestimada**: los pacientes constantemente necesitan mostrar resultados a otros médicos, y un sistema de links temporales con QR es un diferenciador real frente a enviar PDFs por WhatsApp. Tercero, **la ley argentina ya exige auditoría completa**: la Ley 27.706 requiere trazabilidad de todos los accesos a información clínica, lo cual convierte al log de auditoría de un "nice to have" en un requisito legal desde el día uno.