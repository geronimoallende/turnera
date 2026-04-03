# Sistema de dictado médico por voz para el Sanatorio UPCN: guía completa de construcción

**Un desarrollador solo puede construir un sistema funcional de dictado médico en español argentino por menos de $55/mes**, usando Groq Whisper + GPT-4o-mini sobre Next.js + Supabase. Esta combinación transcribe 10 minutos de audio en ~2 segundos a $0.008 por consulta — 50-100 veces más barato que soluciones comerciales como Dragon Medical ($470/mes/médico). Ninguna plataforma comercial soporta bien el español argentino médico, lo que convierte la construcción propia en la única opción viable. El MVP puede estar listo en 3-4 semanas, y un sistema completo con informes estructurados por IA, editor de revisión y firma digital en 8-11 semanas.

---

## 1. El panorama STT para español médico argentino: ningún proveedor tiene modelo médico en español

El hallazgo más importante de esta investigación es que **ningún servicio de speech-to-text ofrece un modelo médico pre-entrenado para español**. Los modelos médicos de Google Cloud STT (`medical_dictation`, `medical_conversation`) solo funcionan en inglés americano (en-US). AWS Transcribe Medical: solo inglés. La estrategia obligada es usar un STT general de alta calidad para español + post-procesamiento con LLM para corregir terminología médica.

### Tabla comparativa de servicios STT (marzo 2026)

| Servicio | Precio/min | Costo 10 min | Streaming | Latencia (10 min) | WER español (est.) | Soporte médico | es-AR |
|---|---|---|---|---|---|---|---|
| **Groq Whisper V3** | $0.00185 | $0.0185 | ❌ | ~2 seg | ~5-10% | Solo prompt | ✅ |
| **Groq Whisper Turbo** | $0.000667 | $0.0067 | ❌ | ~3 seg | ~6-12% | Solo prompt | ✅ |
| **GPT-4o Mini Transcribe** | $0.003 | $0.03 | ❌ | 1-2 min | ~5-10% | Solo prompt | ✅ |
| **OpenAI Whisper API** | $0.006 | $0.06 | ❌ | 1-2 min | ~5-10% | Solo prompt | ✅ |
| **Deepgram Nova-3 (es)** | $0.0077 | $0.077 | ✅ | <300ms | ~6-10% | Keyterm prompting | ✅ |
| **Google Cloud STT V2** | $0.016 | $0.16 | ✅ | Tiempo real | ~8-15% | ❌ (solo en-US) | ✅ es-AR |
| **Azure STT Real-time** | $0.0167 | $0.167 | ✅ | Tiempo real | ~8-15% | Modelo custom posible | ✅ es-AR |
| **whisper.cpp (local)** | $0 | $0 | ⚠️ Custom | 1-3 min (M2+) | ~5-10% | Fine-tunable | ✅ |
| **faster-whisper (local)** | $0 | $0 | ⚠️ Custom | 20-50 seg (GPU) | ~5-10% | Fine-tunable | ✅ |

**Groq Whisper Large V3** es el claro ganador en relación costo-velocidad: **$0.00185/min, 299x velocidad real-time** (10 minutos transcritos en ~2 segundos), misma calidad que Whisper de OpenAI pero 3.2 veces más barato. Usa la misma API compatible con OpenAI, por lo que migrar es trivial.

Para **transcripción en tiempo real** (el médico ve texto mientras habla), **Deepgram Nova-3** es la mejor opción con latencia <300ms vía WebSocket y soporte nativo de español con *keyterm prompting* para inyectar vocabulario médico. El costo es razonable (~$0.077 por consulta de 10 minutos).

### Particularidades del español argentino en los modelos

Whisper maneja razonablemente bien las particularidades fonéticas argentinas — **yeísmo rehilado** (pronunciar "ll/y" como /ʃ/), **aspiración de la S** final, **voseo** — porque su dataset de entrenamiento incluye abundante contenido de medios argentinos. Estos rasgos dialectales no son un obstáculo significativo. El problema real son los **términos médicos especializados**, donde el Word Error Rate puede subir de ~5% a ~10-15% sin ajustes.

La estrategia de mitigación es triple: (1) usar el parámetro `prompt` de Whisper para inyectar términos médicos frecuentes como contexto, (2) post-procesar con LLM para corregir errores de terminología, (3) que el médico revise siempre antes de firmar.

### Whisper en Apple Silicon: viable para procesamiento local

| Mac | Modelo Whisper | Tiempo (10 min audio) |
|---|---|---|
| MacBook Air M1 (8 GB) | Medium | ~3 min |
| MacBook Pro M2 Pro (16 GB) | Large-v3 | ~2 min |
| Mac Mini M4 (16 GB) | Large-v3 | ~1.2 min |
| MacBook Pro M4 Pro (24 GB) | Large-v3 | ~50 seg |

Con **whisper.cpp** y aceleración CoreML + Metal, cualquier Mac con Apple Silicon M2+ y 16 GB de RAM corre Whisper Large-v3 cómodamente. Es una opción real para **procesamiento local con privacidad total**, ideal para datos médicos sensibles.

---

## 2. De dictado libre a informe médico estructurado: el pipeline de NLP

El flujo recomendado es: **Audio → STT (Whisper/Groq) → Texto libre → LLM (Claude/GPT) → JSON estructurado → Editor TipTap → Médico revisa y firma**. La clave es el prompt engineering para el LLM.

### Modelos LLM y costos para estructuración

| Modelo | Input/1M tokens | Output/1M tokens | Costo por consulta | Calidad |
|---|---|---|---|---|
| **GPT-4o-mini** | $0.15 | $0.60 | ~$0.001 | Buena para casos simples |
| **Claude Haiku 4.5** | $1.00 | $5.00 | ~$0.009 | Muy buena |
| **Claude Sonnet 4.6** | $3.00 | $15.00 | ~$0.025 | Excelente, mejor para casos complejos |
| **GPT-4o** | $2.50 | $10.00 | ~$0.020 | Excelente |

Una consulta de 10 minutos produce ~1,500 palabras de transcripción (~2,000 tokens de input). Con system prompt + template (~1,000 tokens) y output estructurado (~1,200 tokens), **el costo por consulta con GPT-4o-mini es de $0.001** — prácticamente gratis. Claude Haiku 4.5 con *prompt caching* (90% descuento en cache hits del system prompt) baja a ~$0.005 por consulta.

### Prompt engineering para informes médicos argentinos

El system prompt debe incluir las secciones estándar de la historia clínica argentina, una tabla de expansión de abreviaciones locales, y reglas estrictas contra la alucinación:

**Abreviaciones argentinas críticas para el prompt:**
- HTA → hipertensión arterial | DBT → diabetes | IAM → infarto agudo de miocardio
- ACV → accidente cerebrovascular | EPOC → enfermedad pulmonar obstructiva crónica
- TA → tensión arterial | FC → frecuencia cardíaca | FR → frecuencia respiratoria
- LOTE → lúcido, orientado en tiempo y espacio | RHA+ → ruidos hidroaéreos positivos
- R1 R2 → primer y segundo ruido cardíaco | MV+ → murmullo vesicular positivo

**Mapeo de marcas argentinas a genéricos:** Tafirol → paracetamol, Ibupirac → ibuprofeno, Buscapina → hioscina, Sertal → propinox, Bayaspirina → ácido acetilsalicílico.

La instrucción clave es: **"SOLO incluir información explícitamente mencionada en la transcripción. Si un dato no fue mencionado, marcar como 'No referido'. Marcar con [VERIFICAR] cualquier dato ambiguo."** Un estudio de Nature Digital Medicine 2025 encontró tasas de alucinación de ~1.47% y omisión de ~3.45% en notas clínicas generadas por LLM — manejable con revisión médica obligatoria.

### Recursos de NLP médico en español

El **Barcelona Supercomputing Center (BSC)** mantiene los mejores modelos de NLP biomédico en español bajo la iniciativa Plan-TL: `bsc-bio-ehr-es` (RoBERTa entrenado en >1B tokens de texto clínico español) supera significativamente a BERT multilingüe en tareas de NER clínico. Argentina es miembro de SNOMED International desde 2018, y SNOMED CT tiene edición oficial en español — se puede integrar como capa de estandarización en Fase 2.

---

## 3. Soluciones comerciales: ninguna sirve bien para el mercado argentino

### Panorama de soluciones comerciales

| Solución | Precio/mes/médico | Español argentino | API para integración | Disponible en Argentina |
|---|---|---|---|---|
| Dragon Medical + DAX | $470-520 | ⚠️ Limitado (→inglés) | SDK .NET (enterprise) | ❌ |
| Suki AI | $299-399 | ✅ 80+ idiomas | SDK + APIs | ❌ (solo EEUU) |
| DeepScribe | ~$750 | ❌ Solo inglés | Enterprise only | ❌ |
| Abridge | Enterprise custom | ✅ 28 idiomas | ❌ Sin API pública | ❌ |
| **INVOX Medical** (España) | **~$35** | ⚠️ España, no Argentina | SDK + APIs | ⚠️ Capterra AR |
| **Build propio (Groq+GPT)** | **~$8 API** | **✅ Excelente** | **Nativo Next.js** | **✅** |

**INVOX Medical** es la única solución comercial remotamente viable — española, $35/mes, con SDK e integración HL7/OpenEHR. Sin embargo, las reseñas de usuarios argentinos son reveladoras: *"No entiende bien el español de Argentina"*, *"No reconoce palabras o frases, probablemente por cuestiones de español de Latinoamérica versus España"*. Está optimizado para español castellano, no rioplatense.

**El build propio es claramente superior** para este caso de uso: 50-100x más barato que soluciones premium, nativamente integrado en Next.js + Supabase, totalmente personalizable para terminología y formatos argentinos, y sin competencia directa en el mercado latinoamericano.

### Cuándo deja de tener sentido construir

No intentar: fine-tuning de Whisper desde cero (necesita miles de horas de audio médico etiquetado), self-hosting de LLMs grandes (la calidad de Llama 8B es notablemente inferior a GPT-4o-mini para estructuración médica), ni transcripción streaming en tiempo real para el V1. Sí hacer: usar APIs cloud, iterar con feedback de usuarios, y llegar a producción rápido.

---

## 4. Arquitectura técnica recomendada para Next.js + Supabase

### Flujo de extremo a extremo

```
[Médico toca "Grabar"]
    → [Browser: getUserMedia → MediaRecorder (webm/opus, 32kbps mono)]
    → [UI de grabación: visualización de onda vía Web Audio API]
    → [Médico toca "Detener"]
    → [Upload blob a Supabase Storage (bucket privado)]
    → [POST /api/transcribe → Groq Whisper API (language=es)]
    → [Transcripción en DB → Status: 'transcripto']
    → [POST /api/structure-report → Claude vía Vercel AI SDK (streamObject)]
    → [JSON estructurado renderizado progresivamente en editor TipTap]
    → [Vista lado a lado: transcripción (izq) | informe editor (der)]
    → [Médico edita → auto-save con versionado]
    → [Médico firma → canvas signature + hash SHA-256]
    → [Informe firmado → audit log → PDF exportable]
```

### Decisiones técnicas clave

| Área | Elección | Razón |
|---|---|---|
| STT (batch) | Groq Whisper API | Más barato, más rápido, API compatible OpenAI |
| STT (real-time, fase 2) | Deepgram Nova-3 | WebSocket streaming <300ms, español |
| LLM estructuración | Claude Sonnet vía Vercel AI SDK | Structured outputs, streaming, excelente español |
| Editor de informes | TipTap | Headless, React-native, extensible, MIT |
| Auth | Supabase Auth + MFA | Integrado, seguro |
| Storage audio | Supabase Storage (bucket privado) | RLS, signed URLs |
| Firma digital | react-signature-canvas + SHA-256 | Simple, práctico |
| PDF | @react-pdf/renderer | Informes firmados exportables |

### Configuración óptima de audio

El audio se captura con MediaRecorder a **16kHz, mono, 32kbps opus** — 10 minutos ocupan solo ~2.4 MB (bien bajo el límite de 25 MB de Whisper). Safari no soporta webm, se usa mp4/aac como fallback detectando con `MediaRecorder.isTypeSupported()`. Las opciones `echoCancellation`, `noiseSuppression`, y `autoGainControl` se habilitan para consultorio médico.

### Esquema de base de datos

Las tablas principales: `doctors` (matrícula profesional, especialidad), `patients` (DNI, número de historia clínica), `consultations` (status con máquina de estados: recording → transcribing → structuring → reviewing → signed), `audio_recordings` (path en Storage), `transcripts` (content + segments con timestamps), `reports` (content_html + content_json + structured_data + hash de integridad), `report_versions` (tabla separada, no JSONB, para compliance), y `audit_log` (trigger automático en INSERT/UPDATE/DELETE de reports y consultations).

**Row Level Security** es obligatoria en todas las tablas — cada médico solo accede a sus propias consultas e informes.

### Orden de implementación para desarrollador solo

- **Semanas 1-2**: Setup proyecto, auth, CRUD pacientes/consultas, RLS
- **Semanas 3-4**: Grabación de audio, upload a Storage, transcripción batch Whisper, display transcripción → **MVP listo**
- **Semana 5**: Integración Claude/GPT para estructuración, schema Zod del informe médico, streaming
- **Semanas 6-7**: Editor TipTap, layout lado a lado, auto-save, versionado
- **Semana 8**: Firma, hash SHA-256, audit triggers, exportación PDF
- **Semanas 9-10**: Deepgram real-time (opcional), templates por especialidad, pulido

---

## 5. Análisis de costos: $54/mes para 1,100 consultas mensuales

### Parámetros base

50 consultas/día × 10 min × 22 días hábiles = **11,000 minutos/mes (1,100 consultas)**. Cada transcripción genera ~2,000 tokens de input + ~1,200 tokens de output para el LLM.

### Comparativa de enfoques

| Enfoque | Costo API/mes | Infraestructura | **Total/mes** | Por consulta | Inversión inicial |
|---|---|---|---|---|---|
| **Groq Turbo + GPT-4o-mini** ⭐ | $8.62 | $45 | **$53.62** | $0.049 | $0 |
| Whisper API + Claude Haiku | $75.90 | $45 | $120.90 | $0.110 | $0 |
| Google STT + Claude Haiku | $185.90 | $45 | $230.90 | $0.210 | $0 |
| **Híbrido local + cloud** ⭐ | $23-57 | $45 | $68-102 | $0.062-0.093 | $799-1,699 |
| Self-hosted (RunPod A5000) | ~$51 | $45 | ~$96 | $0.087 | $0 |
| Dragon Medical (referencia) | $99+/usuario | N/A | $99+/usuario | $0.090 | $525/usuario |

**El enfoque Groq Whisper Turbo + GPT-4o-mini es absurdamente barato**: $8.62/mes en APIs para 1,100 consultas. Con Supabase Pro ($25) y Vercel Pro ($20), el total mensual es **~$54**. Para 5 médicos usando Dragon Medical, el costo sería $5,940/año + $2,625 de setup vs. $648/año total con el sistema custom (infraestructura compartida).

### Desglose del enfoque recomendado

| Componente | Cálculo | Costo mensual |
|---|---|---|
| Groq Whisper V3 Turbo | 183.3 hrs × $0.04/hr | $7.33 |
| GPT-4o-mini input | 3.3M tokens × $0.15/M | $0.50 |
| GPT-4o-mini output | 1.32M tokens × $0.60/M | $0.79 |
| Supabase Pro | Plan fijo | $25.00 |
| Vercel Pro | Plan fijo | $20.00 |
| **Total** | | **$53.62** |

---

## 6. Privacidad y cumplimiento legal: la transferencia internacional es el punto crítico

### El marco legal argentino en tres leyes

**Ley 25.326 (Protección de Datos Personales)** clasifica los datos de salud como **datos sensibles** (Art. 2). Los establecimientos de salud pueden procesarlos bajo la excepción del Art. 8, respetando el secreto profesional. El Art. 12 **prohíbe** la transferencia de datos personales a países sin nivel adecuado de protección — y **Estados Unidos no está en la lista de países adecuados**. Esto significa que enviar audio de pacientes a OpenAI, Groq, o Google (servidores en EEUU) está prohibido por defecto.

**Mecanismos legales para transferir a EEUU:**
- **Consentimiento expreso del paciente** para la transferencia internacional específica
- **Cláusulas contractuales modelo (CCM)** aprobadas por la AAIP (Disposición 60/2016, Resolución 198/2023)
- **Excepción médica** del Art. 12(2)(b): intercambio de datos médicos para tratamiento del paciente
- **Disociación/anonimización**: si los datos se anonimizan completamente, dejan de ser datos personales

Las sanciones van desde $80,000 a **$15,000,000 ARS** para infracciones muy graves (como violar la confidencialidad de datos sensibles), más posibles sanciones penales de 1 mes a 3 años de prisión.

**Ley 26.529 (Derechos del Paciente)** regula la historia clínica electrónica (Art. 13), exigiendo integridad, autenticidad, inalterabilidad, y firma digital conforme a Ley 25.506. Los registros deben conservarse **mínimo 10 años**. El paciente es titular de su HC y puede exigir copia en 48 horas.

**Ley 27.706 (2023)** crea el programa federal de digitalización de historias clínicas, estableciendo implementación progresiva en todos los establecimientos públicos y privados.

### Estrategia de compliance recomendada

El enfoque más seguro es un **modelo híbrido**: procesamiento de audio local (Whisper on-premise en Mac) para que el audio nunca salga del sanatorio, y envío solo de texto de-identificado al LLM cloud. Si se opta por APIs cloud para el STT, se necesita: (1) consentimiento escrito específico del paciente para procesamiento con IA, (2) cláusulas contractuales modelo con el proveedor, (3) DPA (Data Processing Agreement) con OpenAI/Groq/Anthropic.

**Ningún proveedor cloud mayor tiene datacenter en Argentina.** Las opciones más cercanas son São Paulo (AWS, Google, Azure) y Santiago de Chile (Azure, Google). Azure OpenAI en Brasil South o Chile North Central permite usar modelos GPT manteniendo datos en Sudamérica, aunque técnicamente sigue siendo transferencia internacional bajo ley argentina.

### Consentimiento del paciente

Se recomienda un formulario de consentimiento **separado** del consentimiento general de admisión, que explique en lenguaje claro: qué datos se graban, cómo se procesan con IA, dónde se procesan, quién tiene acceso, derecho a negarse sin afectar la calidad de atención, y que el médico siempre revisa antes de incorporar al registro.

---

## 7. ¿Qué precisión esperar honestamente? La realidad del WER médico

**Sin fine-tuning**, Whisper en español médico argentino tendrá un **WER de ~10-15%**: aproximadamente 1 de cada 7-10 palabras con error. Para texto general conversacional en español, Whisper alcanza ~3-8% WER. El incremento se debe a terminología médica especializada (nombres de fármacos, procedimientos, anatomía) que el modelo no ha visto frecuentemente en su entrenamiento.

Esto es **usable pero requiere revisión humana**, especialmente para nombres de medicamentos, dosis y términos diagnósticos. La buena noticia es que el paso de estructuración con LLM puede inferir y corregir muchos errores por contexto (si Whisper transcribe "perone" sin tilde, el LLM entiende "peroné"; si transcribe "amoxisilina", el LLM corrige a "amoxicilina").

**Estrategias de mitigación que no requieren fine-tuning:**
- Usar el parámetro `prompt` de Whisper con ~50 términos médicos frecuentes del sanatorio
- Post-procesamiento con LLM que conoce terminología médica
- Diccionario de corrección automática de términos médicos frecuentes
- Revisión obligatoria del médico antes de firmar (nunca auto-guardar en la HC)

---

## Conclusión: la recomendación concreta

**Si yo estuviera construyendo esto hoy con presupuesto limitado, haría exactamente esto:**

Arrancaría con un **MVP de transcripción pura en 3 semanas**: grabación de audio en el browser → Groq Whisper Turbo para transcripción (resulta en 2 segundos) → texto editable en pantalla. Costo: <$10/mes. Este MVP solo ya ahorra horas de tipeo a los médicos y entrega valor inmediato.

En las siguientes 3 semanas agregaría **estructuración con GPT-4o-mini**: el médico dicta libremente, el sistema transcribe y luego genera un informe con secciones (motivo de consulta, examen físico, diagnóstico, plan) que el médico revisa en un editor TipTap lado a lado con la transcripción. Costo adicional: ~$1/mes.

Para la cuestión legal, implementaría un **formulario de consentimiento** del paciente para procesamiento IA, evaluaría correr Whisper localmente en un Mac Mini M4 ($799) para que el audio nunca salga del sanatorio, y enviaría solo texto de-identificado al LLM cloud.

**No compraría Dragon Medical ni ninguna solución comercial.** Son 50-100x más caras, no soportan español argentino adecuadamente, y no se integran con un stack custom. El mercado latinoamericano de documentación clínica con IA es un espacio vacío — este proyecto no solo resuelve el problema del Sanatorio UPCN sino que tiene potencial de producto.

El costo total en producción para 50 consultas/día: **~$54/mes**, incluyendo toda la infraestructura. Compárese con $470-520/mes *por médico* de Dragon Medical. La matemática no miente.