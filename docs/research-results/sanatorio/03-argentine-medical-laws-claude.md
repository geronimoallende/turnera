# Marco legal argentino para sistemas de gestión de datos médicos digitales

**Un sanatorio en Córdoba que use Supabase/AWS São Paulo puede operar legalmente, pero necesita cumplir requisitos específicos de protección de datos sensibles, transferencia internacional y firma electrónica.** El marco legal argentino no prohíbe el almacenamiento en la nube ni exige servidores en territorio nacional, pero al estar los datos en Brasil —país no reconocido como "adecuado" por la AAIP— se requieren cláusulas contractuales tipo y consentimiento informado del paciente. La buena noticia para Althem Group es que las principales instituciones de salud argentinas ya operan con cloud internacional, y la tendencia normativa favorece la digitalización. Sin embargo, hay áreas ambiguas donde la asesoría legal especializada es imprescindible, especialmente en transferencia internacional de datos y módulos con inteligencia artificial.

---

## 1. Los datos médicos son "datos sensibles" y eso cambia todo

La **Ley 25.326 de Protección de Datos Personales** clasifica inequívocamente la información de salud como **datos sensibles** (Art. 2°). Esto significa que diagnósticos, historias clínicas, resultados de laboratorio, imágenes médicas, prescripciones y cualquier dato vinculado a la salud física o mental de un paciente tienen protección reforzada.

El **Art. 7° prohíbe como regla general** la formación de archivos que almacenen datos sensibles. Sin embargo, el **Art. 8° establece la excepción clave**: los establecimientos sanitarios públicos o privados y los profesionales de la salud pueden recolectar y tratar datos de salud de sus pacientes, "respetando los principios del secreto profesional." Esta es la base legal que habilita al sanatorio a operar el sistema.

**El consentimiento** para el tratamiento de datos personales debe ser libre, expreso e informado, y constar por escrito o medio equivalente (Art. 5°). Si bien el Art. 8° exime parcialmente a establecimientos sanitarios del consentimiento especial para datos sensibles, **la doctrina y la AAIP recomiendan obtener consentimiento expreso y por escrito** como buena práctica, especialmente cuando los datos se almacenarán en la nube o se compartirán por canales digitales. El **Art. 6° obliga a informar** al paciente la finalidad del tratamiento, los destinatarios de los datos y sus derechos de acceso, rectificación y supresión.

En cuanto a **penalidades**, el Art. 31 establece sanciones administrativas que van desde apercibimiento hasta **multas de $1.000 a $100.000** y clausura de la base de datos (montos actualizados por Res. AAIP 244/2022). La **Res. AAIP 240/2022 y Res. 126/2024** clasifican infracciones en leves (no inscribir bases), graves (no implementar seguridad adecuada) y muy graves (tratar datos sensibles sin consentimiento). Además existen **sanciones penales**: el Art. 117 bis del Código Penal prevé prisión de 1 mes a 2 años por insertar datos falsos, y el Art. 157 bis, prisión de 1 mes a 2 años por acceso ilegítimo a bancos de datos.

**Sobre notificación de brechas**: la ley vigente **no establece obligación expresa** de notificar incidentes de seguridad. Sin embargo, la AAIP recomienda notificar dentro de **72 horas** y ha sancionado a empresas (caso Cencosud, multa de $290.000) por no comunicar data breaches a los afectados. El proyecto de reforma de la ley incluiría esta obligación formalmente.

---

## 2. Historia clínica digital: qué exige la Ley 26.529 y cómo cumplirlo

La Ley 26.529 de Derechos del Paciente define la historia clínica como "documento obligatorio cronológico, foliado y completo" (Art. 12) y establece que **el paciente es su titular** (Art. 14). A solicitud del paciente, la institución debe entregar **copia autenticada en un plazo máximo de 48 horas** (Art. 14). Ante negativa o demora, el paciente puede ejercer acción de hábeas data.

El **Art. 13 habilita expresamente la historia clínica informatizada**, bajo cinco requisitos: **integridad, autenticidad, inalterabilidad, perdurabilidad y recuperabilidad**. Exige además accesos restringidos con claves de identificación, medios no reescribibles de almacenamiento y control de modificación de campos. La **Ley 27.706** (2023) creó el Programa Federal de Informatización y Digitalización de Historias Clínicas, y su **Decreto 393/2023** reglamentó que la HCE constituye "documentación auténtica" en los términos de la Ley 25.506, agregando como requisitos explícitos la **trazabilidad** y la **marca temporal**.

**Nota importante**: la "Resolución 1995/2000" que se menciona frecuentemente en el ámbito de historia clínica es en realidad normativa colombiana, no argentina. En Argentina, los campos obligatorios surgen del Art. 15 de la Ley 26.529 (modificado por Ley 26.812) y del Decreto 1089/2012:

- Fecha de inicio de confección
- Datos del paciente: nombre, apellido, DNI/pasaporte, sexo, edad, teléfono, dirección
- Datos del núcleo familiar
- Datos del profesional interviniente y especialidad
- Antecedentes genéticos, fisiológicos y patológicos
- Todo acto médico: prescripciones, diagnóstico, pronóstico, procedimiento, evolución, ingresos y altas
- Consentimientos informados, hojas de indicaciones, planillas de enfermería, protocolos quirúrgicos, estudios realizados

El **período de retención mínimo es de 10 años** desde la última actuación registrada (Art. 18). El responsable de la custodia es la institución asistencial, y el incumplimiento constituye **falta grave** según el Art. 21. Para pacientes menores de edad, la doctrina recomienda conservar hasta que cumplan al menos 28 años (18 + 10), dado que la prescripción no corre contra incapaces.

**Sobre firma digital vs. electrónica**: la Ley 25.506 distingue entre firma digital (con certificado de certificador licenciado, presunción de autoría e integridad) y firma electrónica (sin certificado licenciado, carga probatoria invertida). El **Decreto 393/2023, Art. 8° permite ambas** para la HCE. La firma electrónica robusta (usuario + contraseña con autenticación multifactor y audit trail) es jurídicamente suficiente como mínimo, aunque para actos críticos como consentimientos informados escritos se recomienda firma digital vía certificadores habilitados como firmar.gob.ar o certificadores privados licenciados (Encode, Digilogix, entre otros).

---

## 3. AWS São Paulo es legal, pero Brasil no es país "adecuado"

Este es probablemente el **riesgo regulatorio más significativo del proyecto**. El Art. 12 de la Ley 25.326 prohíbe la transferencia de datos personales a países que no proporcionen niveles de protección adecuados. La AAIP mantiene una lista de países reconocidos como "adecuados" (Disp. DNPDP 60-E/2016, Res. AAIP 34/2019) que incluye a los estados miembros de la UE/EEE, Reino Unido, Suiza, Canadá (sector privado), Uruguay, Israel y otros. **Brasil no figura en esta lista**, pese a contar con la LGPD (Ley 13.709/2018).

Sin embargo, **no existe un requisito de localización de datos en territorio argentino**. La ley no exige servidores en Argentina. El almacenamiento en AWS São Paulo constituye una transferencia internacional de datos que puede legalizarse mediante tres mecanismos:

- **Cláusulas contractuales tipo** aprobadas por la Disp. 60-E/2016 (Anexo II) o la Res. AAIP 198/2023 (cláusulas RIPD). Esta es la vía más robusta y recomendada.
- **Consentimiento expreso del titular** informando específicamente el destino internacional de los datos.
- La **excepción del Art. 12.2(b)** para datos médicos necesarios para el tratamiento del paciente, aunque su alcance es limitado y no está pensada para hosting en cloud comercial.

En la práctica, **las principales instituciones de salud argentinas ya usan cloud internacional**: Swiss Medical Group opera con AWS, Medifé utiliza Google Cloud incluyendo historias clínicas, y el Hospital Italiano integra servicios cloud. La Red Nacional de Salud Digital del Ministerio de Salud también es nativa en la nube. Esto confirma que no existe prohibición práctica, pero requiere cumplir los mecanismos legales descritos.

**Acción concreta para Althem Group**: suscribir con Supabase/AWS un contrato que incorpore las cláusulas contractuales tipo de la Disposición 60-E/2016 o las cláusulas RIPD de la Resolución 198/2023, identificando al sanatorio como "exportador" y a AWS como "importador" de datos, con obligaciones de seguridad, derecho de auditoría, y jurisdicción argentina. Si el contrato difiere del modelo estándar, debe presentarse ante la AAIP dentro de los **30 días corridos** de su firma.

---

## 4. Receta electrónica, telemedicina y entrega digital de resultados

La **Ley 27.553** (2020) habilitó la prescripción electrónica y la teleasistencia en todo el territorio nacional. Fue reglamentada por el **Decreto 98/2023**, que creó la Licencia Sanitaria Federal y estableció 7 requisitos de validez para recetas electrónicas: identificador único (CUIR), contenido según Ley 17.132, vigencia, integridad e inalterabilidad, seguridad y confidencialidad, interoperabilidad e identificación de medicamentos. La **Res. 1959/2024** creó el Registro Nacional de Plataformas Digitales Sanitarias (ReNaPDiS), y la **Res. 2214/2025** amplió la prescripción electrónica para incluir estudios complementarios, prácticas y procedimientos.

**Córdoba adhirió** a la Ley 27.553 y oficializó la receta electrónica obligatoria a partir del 1 de enero de 2025. Esto es directamente relevante para el sanatorio.

Respecto a la **entrega digital de resultados médicos**, la Ley 27.553 no la regula explícitamente, pero múltiples normas la favorecen: el Art. 13 de la Ley 27.553 prevé constancias al paciente "por vía informatizada," el Art. 14 de la Ley 26.529 reconoce el derecho del paciente a obtener copia (sin restringir al formato papel), y el Art. 16 incluye estudios y prácticas como parte de la HC. No existe prohibición. Lo que aplica es la obligación de proteger datos sensibles y garantizar confidencialidad.

**Sobre WhatsApp**: no hay prohibición expresa, pero los riesgos legales son significativos. Meta/WhatsApp comparte datos con empresas del grupo (la AAIP investigó en 2021), la institución pierde control sobre los datos, y no hay cifrado gestionado por la institución sanitaria. La recomendación es usar WhatsApp **exclusivamente para notificaciones sin datos sensibles** ("Sus resultados están disponibles, ingrese al portal") y nunca para enviar contenido clínico.

**El portal de pacientes con autenticación es la opción de menor riesgo legal.** Instituciones argentinas como Hospital Posadas, Sanatorio Güemes, Sanatorio Argentino e IACA Laboratorios ya operan portales web con usuario/contraseña. Un patrón común es excluir del portal web resultados ultra-sensibles (VIH, genéticos, psiquiátricos), requiriendo retiro presencial para estos. Se recomienda implementar **autenticación de doble factor** (2FA), HTTPS obligatorio, logs de acceso auditables y consentimiento explícito al momento del registro del paciente.

Para **recordatorios de turnos** por WhatsApp o SMS, el contenido no debe incluir datos sensibles. Un mensaje como "Tiene turno el 15/04 a las 10:00 en [institución]" es aceptable; "Turno de oncología para control de quimioterapia" no lo es. La base legal puede encuadrarse en la excepción del Art. 5.2(d) de la Ley 25.326 (datos derivados de relación contractual/profesional), pero la mejor práctica es incluir cláusula de consentimiento al momento de la admisión.

---

## 5. Imágenes médicas DICOM: sin regulación específica pero con reglas generales claras

**No existe regulación argentina específica sobre el estándar DICOM, sistemas PACS, ni almacenamiento en nube de imágenes médicas.** El estándar DICOM es de uso libre y adoptado por la industria sin incorporación formal en normativa sanitaria local. Esto simplifica la situación para Althem Group.

Las imágenes médicas son inequívocamente parte de la historia clínica según el **Art. 16 de la Ley 26.529** ("estudios y prácticas realizadas"). Por lo tanto, **aplican las mismas reglas de retención de 10 años mínimo**, los mismos requisitos de integridad y seguridad del Art. 13, y la misma protección de datos sensibles de la Ley 25.326. No hay requisitos regulados de resolución mínima o calidad para el almacenamiento digital.

Respecto a **ANMAT y software médico**: la Disposición ANMAT 9688/2019 (Art. 26) establece que los programas informáticos autónomos que cumplen la definición de producto médico (SaMD) deben registrarse, pero **excluye expresamente "los programas informáticos para usos generales administrativos utilizados en el marco de la asistencia sanitaria."** Un sistema de gestión de sanatorio con turnos, facturación, HCE y visualización PACS básica es software administrativo y **no requiere registro ANMAT**. Sin embargo, si el sistema incorpora funciones de **diagnóstico asistido por IA o procesamiento de imágenes para apoyo a decisiones clínicas**, entraría en la categoría de SaMD y sí requeriría registro. ANMAT tiene en consulta pública una Guía para SaMD/MLMD que establecerá los criterios definitivos.

En la práctica, los centros argentinos usan sistemas PACS comerciales (VisualMedica, Tecnoimagen, TeleRad) y migran crecientemente a PACS en la nube. El Hospital Privado Universitario de Córdoba desarrolló TIPs, un sistema de registro clínico electrónico que se comercializó a otras instituciones. En el sector público, se usa la Historia de Salud Integrada (HSI) del Ministerio de Salud, que es software libre con estándares HL7 FHIR y SNOMED CT.

---

## 6. Córdoba tiene regulación propia que agrega obligaciones

La **Ley Provincial 10.590** (2018) creó el Sistema Provincial de Historia Clínica Electrónica Única (HCEU), una de las normativas más avanzadas del país. Puntos clave para el sanatorio:

El **Art. 4° aplica a todas las instituciones públicas o privadas** que presten atención sanitaria en Córdoba. La Autoridad de Aplicación (Ministerio de Salud provincial) determinará la forma y tiempos para que los registros privados se compatibilicen con la HCEU. Esto significa que el sistema de Althem Group deberá eventualmente ser **interoperable con el sistema provincial**. El Art. 5° establece principios de accesibilidad, confidencialidad y firma digital/electrónica conforme a la Ley Nacional 25.506 y la Ley Provincial 9401.

El gobierno provincial ya implementa SiSalud en hospitales públicos (Hospital de Córdoba, de Niños, Pediátrico, Materno Neonatal) y la Municipalidad de Córdoba adhirió al sistema. Aunque los tiempos y requisitos técnicos específicos para el sector privado aún no están plenamente definidos, **el sistema de Althem debe diseñarse con interoperabilidad desde el inicio** (HL7 FHIR, SNOMED CT) para estar preparado.

Córdoba no tiene ley provincial de protección de datos personales propia que supere la ley nacional 25.326. La Ley 10.590 refuerza confidencialidad y remite a la legislación nacional. No se encontraron lineamientos específicos del Colegio Médico de Córdoba sobre HCE publicados, ni jurisprudencia provincial sobre datos médicos digitales. **La habilitación de sanatorios** (Ley 9133, Dirección General de Regulación Sanitaria) se centra en infraestructura física y recursos humanos; no hay requisitos específicos sobre sistemas informáticos en la normativa de habilitación vigente.

---

## 7. Registro obligatorio ante la AAIP antes de operar

Todo archivo de datos personales privado debe inscribirse en el Registro Nacional de Bases de Datos (RNBD) de la AAIP **con carácter previo a su puesta en marcha** (Art. 3° y 21° de la Ley 25.326, Disp. 2/2005). El trámite se realiza por **Trámites a Distancia (TAD)** con clave fiscal AFIP nivel 2+, es gratuito y sin vencimiento, pero debe actualizarse ante cambios. Se debe declarar: nombre del responsable, características y finalidad del archivo, naturaleza de los datos, forma de recolección, destino, medidas de seguridad y tiempo de conservación.

El sanatorio deberá inscribir como mínimo la base de datos de pacientes (con datos sensibles de salud) y la base de datos de empleados. La falta de inscripción es infracción leve según la Res. 240/2022, pero se convierte en agravante ante inspecciones o incidentes.

---

## 8. Evaluación de viabilidad por fase del proyecto

**Fase 1 — Turnera con datos de paciente y recordatorios WhatsApp:**
El compliance mínimo es relativamente accesible. Se necesita inscripción de la base en RNBD, consentimiento informado básico para tratamiento de datos personales (no necesariamente datos sensibles si solo se manejan datos de contacto y turnos), cláusulas contractuales con Supabase/AWS para transferencia internacional, y asegurar que los recordatorios por WhatsApp no incluyan datos sensibles. **Es la fase de menor riesgo regulatorio** y puede implementarse con un formulario de consentimiento bien redactado y la inscripción ante la AAIP.

**Fase 2 — Historias clínicas digitales:**
Salto cualitativo en compliance. Se ingresa al terreno de datos sensibles con protección reforzada. Se requiere: firma electrónica robusta para profesionales (usuario individual + contraseña + logs inmutables), audit trail de todas las modificaciones (Ley 27.706), garantía de retención de 10 años, entrega de copia al paciente en 48 horas, y refuerzo del consentimiento informado que ahora debe cubrir datos de salud y almacenamiento en la nube. **Se recomienda asesoría legal para redactar el consentimiento y validar la arquitectura de seguridad.**

**Fase 3 — Imágenes médicas (PACS/DICOM):**
Compliance adicional moderado. Las imágenes se rigen por las mismas reglas de la HC (retención 10 años, integridad, seguridad). Si el módulo solo almacena y visualiza imágenes, no requiere registro ANMAT. El desafío principal es técnico (volumen de almacenamiento y costos en AWS para garantizar perdurabilidad por 10 años) más que legal. Asegurar que las imágenes mantengan su resolución original y que el sistema garantice recuperabilidad.

**Fase 4 — Dictado por IA y reportes médicos:**
**Esta es la fase de mayor riesgo regulatorio.** Si la IA asiste en el diagnóstico o procesa imágenes médicas para apoyo a decisiones clínicas, el módulo podría clasificarse como Software como Producto Médico (SaMD) bajo la Disposición ANMAT 9688/2019, requiriendo registro ante ANMAT. Si la IA solo transcribe dictado sin interpretar contenido clínico (speech-to-text puro), probablemente quede excluida. **Esta distinción requiere consulta con abogado especializado en regulación sanitaria y posiblemente consulta formal a ANMAT.**

**¿Es realista sin asesoría legal?** Para la Fase 1 (turnera), sí. Las obligaciones son claras y hay modelos disponibles. Para las Fases 2 y 3, es recomendable pero no estrictamente indispensable si se sigue la normativa cuidadosamente. Para la Fase 4 con IA, **la asesoría legal especializada es imprescindible**.

---

## Checklist práctico de compliance mínimo viable

**Antes de cualquier deploy (obligatorio para todas las fases):**

1. ☐ Inscribir la base de datos de pacientes en el RNBD de la AAIP vía TAD (gratuito, previo a operación)
2. ☐ Suscribir cláusulas contractuales tipo (Disp. 60-E/2016 o Res. 198/2023) con Supabase/AWS para transferencia internacional a Brasil
3. ☐ Redactar formulario de consentimiento informado del paciente que cubra: finalidad del tratamiento de datos, almacenamiento en servidores fuera de Argentina, canales de comunicación digital (WhatsApp, email, portal), derechos de acceso, rectificación y supresión
4. ☐ Implementar HTTPS/TLS para todo el tráfico, cifrado en reposo en la base de datos
5. ☐ Implementar control de acceso basado en roles (RBAC) con claves individuales por usuario
6. ☐ Elaborar documento de medidas de seguridad conforme Res. AAIP 47/2018
7. ☐ Establecer protocolo de respuesta a incidentes de seguridad (notificación en 72 horas)

**Adicional para historias clínicas digitales (Fase 2):**

8. ☐ Implementar firma electrónica robusta: autenticación individual de profesionales, con log de cada acción
9. ☐ Audit trail inmutable: toda modificación registra fecha, hora, usuario, campo modificado, valor anterior y nuevo
10. ☐ Marca temporal (timestamp) en cada registro clínico
11. ☐ Garantizar retención mínima de 10 años con recuperabilidad
12. ☐ Funcionalidad de exportación/copia autenticada de HC para entrega al paciente en 48 horas
13. ☐ Campos obligatorios según Art. 15 Ley 26.529 y Decreto 1089/2012
14. ☐ HC única por paciente por establecimiento con clave uniforme (Art. 17)

**Adicional para imágenes médicas DICOM (Fase 3):**

15. ☐ Almacenamiento que preserve resolución original de imágenes
16. ☐ Retención de 10 años para todas las imágenes (como parte de la HC)
17. ☐ Plan de costos de almacenamiento a 10 años en AWS

**Adicional para IA y dictado (Fase 4):**

18. ☐ **Consultar abogado especializado**: determinar si el módulo de IA es SaMD (requiere registro ANMAT) o software administrativo
19. ☐ Si es SaMD: iniciar proceso de registro ante ANMAT (Disposición 9688/2019)
20. ☐ Documentar que la IA no toma decisiones clínicas autónomas (si aplica)

**Preparación para interoperabilidad (mediano plazo):**

21. ☐ Diseñar la arquitectura con estándares HL7 FHIR y SNOMED CT desde el inicio
22. ☐ Monitorear requerimientos del sistema HCEU de Córdoba (Ley 10.590) para compatibilización con sector privado
23. ☐ Preparar para el Resumen Digital de Atención (RDA) del Ministerio de Salud nacional

---

## Dónde la ley es clara vs. dónde consultar un abogado

**La ley es clara en:**
- Los datos médicos son datos sensibles (Art. 2 Ley 25.326) — sin ambigüedad
- La HCE es legal (Art. 13 Ley 26.529) — sin ambigüedad
- La retención mínima es 10 años (Art. 18 Ley 26.529) — sin ambigüedad
- La inscripción ante la AAIP es obligatoria (Art. 21 Ley 25.326) — sin ambigüedad
- El paciente tiene derecho a copia en 48 horas (Art. 14 Ley 26.529) — sin ambigüedad
- La firma electrónica es válida para HCE (Decreto 393/2023 Art. 8) — sin ambigüedad
- Las imágenes son parte de la HC (Art. 16 Ley 26.529) — sin ambigüedad
- Brasil no es país "adecuado" para transferencia de datos (Disp. 60-E/2016) — sin ambigüedad

**Es ambiguo o interpretable:**
- Si las cláusulas contractuales estándar de AWS/Supabase cumplen los requisitos de la Disposición 60-E/2016 o si necesitan adaptación — **consultar abogado**
- El alcance exacto de la excepción del Art. 8 de la Ley 25.326 para establecimientos sanitarios respecto al consentimiento — **consultar abogado para redacción del consentimiento**
- Si un visor PACS con funciones avanzadas o procesamiento de imágenes requiere registro ANMAT — **consultar abogado y potencialmente ANMAT**
- Si la IA de dictado médico es SaMD — **consultar abogado especializado en regulación sanitaria**
- Los tiempos y requisitos técnicos para compatibilización con la HCEU de Córdoba para el sector privado — **monitorear normativa provincial**
- Si enviar resultados por email cifrado (no WhatsApp) cumple las obligaciones de seguridad del Art. 9 — **zona gris, preferir portal**

## Conclusión

El proyecto de Althem Group es **jurídicamente viable** en todas sus fases. Argentina no impone barreras insalvables para sistemas de salud digital en la nube; la tendencia normativa —Ley 27.706, Decreto 393/2023, Res. 2214/2025— impulsa activamente la digitalización. El punto de mayor fricción legal es la transferencia internacional de datos a Brasil, resoluble mediante cláusulas contractuales tipo y consentimiento informado. La estrategia más prudente es un **deploy incremental**: comenzar con la turnera (compliance mínimo), avanzar a HCE (compliance intermedio), incorporar PACS (compliance técnico) y finalmente IA (compliance avanzado con asesoría legal). Para las dos primeras fases, un desarrollador informado puede cumplir la normativa sin abogado dedicado. A partir de la incorporación de IA diagnóstica, la asesoría legal especializada en regulación sanitaria y datos personales deja de ser opcional.