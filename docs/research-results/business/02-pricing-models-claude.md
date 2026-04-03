# Análisis integral de pricing para Turnera: secretaria virtual con IA para clínicas en Argentina

**Turnera puede posicionarse como el software de gestión de turnos más competitivo del mercado argentino cobrando entre ARS $24.900 y ARS $149.000 mensuales**, aprovechando un diferenciador clave que ningún competidor local incluye en su plan base: automatización completa por WhatsApp con chatbot de inteligencia artificial. El mercado argentino de software médico está fragmentado, con precios que van desde ARS $9.900 (Gendu) hasta ARS $55.000 (Doctoralia VIP), y la mayoría cobra WhatsApp como adicional. El costo de ausentismo para una clínica con 3 médicos supera los **ARS $6 millones mensuales**, lo que convierte a un sistema de recordatorios automáticos en una inversión con retorno de **27x**. Este análisis presenta modelos de pricing globales, un relevamiento exhaustivo de competidores, unit economics detallados, y una estrategia de lanzamiento para el primer año.

---

## 1. Cómo cobran los SaaS médicos en el mundo

Los modelos de monetización en software de gestión médica han convergido globalmente hacia variantes del modelo por suscripción. Entender sus ventajas y limitaciones es fundamental para elegir la estructura óptima para el mercado argentino.

### Por profesional/proveedor

Es el modelo dominante en el segmento de práctica médica. Cada médico activo paga una tarifa mensual; el personal administrativo no paga. **Tebra cobra USD $99-$399/profesional/mes**, DrChrono desde USD $199, y SimplePractice entre USD $29-$99 para solistas. En Argentina, DrApp usa este modelo a **ARS $16.499/profesional/mes + IVA**. La ventaja es que el ingreso escala proporcionalmente con el crecimiento de la clínica. La desventaja principal: desincentiva agregar médicos part-time y genera fricción al crecimiento.

### Tarifa plana por clínica

Cliniko, el referente australiano, cobra entre **USD $45 (1 profesional) y USD $395/mes (26-200 profesionales)** con todas las funcionalidades incluidas sin restricciones. MedTurnos en Argentina sigue un modelo similar a **ARS $12.000/mes** con usuarios ilimitados. Este modelo es ideal para clínicas medianas y grandes donde el costo por profesional se diluye dramáticamente, pero penaliza a consultorios individuales que subsidian capacidad no utilizada.

### Planes escalonados (tiered)

Es la estructura más extendida globalmente. Jane App (Canadá) ofrece Balance a CAD $54, Practice a CAD $79 y Thrive a CAD $99, diferenciándose por funcionalidades y no por cantidad de usuarios. Practice Better va desde gratis (estudiantes) hasta USD $155/mes (equipos). La distribución típica de features por nivel es: **básico** (agenda, recordatorios por email, booking online), **profesional** (SMS, telehealth, pagos, reportes, multi-agenda), y **enterprise** (API, multi-sede, soporte dedicado, white-label).

### Freemium

Funciona como motor de adquisición pero con limitaciones severas. Turnito ofrece un plan gratuito con 3 agendas y 100 reservas/mes. SimplyBook.me permite 50 bookings/mes gratis. CharmHealth da 50 encuentros/mes sin cargo. El patrón es consistente: **el free plan cubre el 10-20% de las necesidades reales**, forzando la conversión rápida. En software médico, las exigencias de compliance (HIPAA, protección de datos) reducen la viabilidad de planes gratuitos robustos.

### Por turno/cita

Modelo de nicho utilizado por Medesk (desde USD $12/mes por 50 citas) y CharmHealth (USD $0.50/encuentro). Alinea costos con uso real, beneficiando a prácticas de bajo volumen. Sin embargo, genera costos impredecibles para clínicas de alto tráfico y dificulta la proyección de ingresos del proveedor.

### Porcentaje de facturación

Utilizado casi exclusivamente en Estados Unidos para servicios de Revenue Cycle Management. **Athenahealth cobra 4-8% de las cobranzas** incluyendo EHR, gestión de práctica y facturación. No es aplicable al contexto argentino donde la facturación médica es fragmentada entre obras sociales, prepagas y particulares.

**Conclusión para Turnera:** el modelo óptimo combina **pricing por profesional con tiers de funcionalidad**, aprovechando que el costo de WhatsApp escala naturalmente con la cantidad de médicos (más profesionales = más turnos = más mensajes). Esto alinea costos con ingresos de manera orgánica.

---

## 2. Qué cobran los competidores en Argentina y Latinoamérica

El panorama competitivo argentino presenta un mercado fragmentado donde ningún jugador domina claramente y los precios varían significativamente. La siguiente tabla resume los hallazgos del relevamiento:

| Competidor | Precio entrada | Moneda | Modelo | Plan gratis | WhatsApp incluido | Diferenciador |
|:---|:---|:---|:---|:---|:---|:---|
| **MedTurnos** | ~ARS $12.000/mes | ARS | Tarifa plana, todo ilimitado | Trial 30 días | Básico | Precio más bajo, funcionalidad básica |
| **Gendu** | ~ARS $9.900/mes | ARS | Por funcionalidad | No | No especificado | Multi-agenda, gestión de roles |
| **DrApp** | ARS $16.499/prof + IVA | ARS | Por profesional | Trial 15 días | Semi-automático (bot es adicional) | 20K+ profesionales, e-recetas, marketplace |
| **Turnito** | Gratis (3 agendas) | ARS | Freemium + comisión 5% | **Sí (lifetime)** | Recordatorios básicos | Freemium agresivo, MercadoPago seña |
| **Calu** | Oculto (consultar) | ARS | Por agenda, escalonado | Demo | Caps por plan (50-ilimitado) | E-recetas, integración MercadoPago |
| **Doctoralia** | ARS $18.000-$25.000/mes | ARS | Por especialista, anual | Perfil básico | No (usa SMS) | Marketplace de pacientes, visibilidad SEO |
| **AgendaPro** | USD $23/mes (anual) | USD | Por profesional, escalonado | Trial | 50 msgs gratis, luego USD $7/50 | $35M funding, AI assistant, regional |
| **SimplyBook.me** | Gratis (50 bookings) | USD | Por volumen de reservas | **Sí** | USD $8/100 créditos | Global, 70+ funciones custom, HIPAA |
| **Reservo** | Cotización requerida | Variable | Tarifa plana por tamaño | No | No especificado | 43M+ turnos agendados, fuerte en Chile |
| **Doctolib** | €139/prof/mes | EUR | Por médico | No | No aplica | Líder europeo, **no disponible en LatAm** |

### Insights clave del análisis competitivo

**El rango de precios del mercado argentino oscila entre ARS $9.900 y ARS $55.000 mensuales.** La mediana se ubica alrededor de ARS $16.000-$25.000 para un profesional individual. Los jugadores locales (DrApp, Turnito, MedTurnos, Calu) cobran en pesos argentinos, mientras que los regionales (AgendaPro, SimplyBook.me) cobran en dólares.

**WhatsApp es la funcionalidad más demandada pero ningún competidor local la incluye de forma ilimitada en su plan base.** Calu lo limita por plan (50/200/1.000 mensajes), DrApp cobra el bot como adicional, y AgendaPro regala solo 50 mensajes/mes cobrando USD $7 por cada 50 adicionales. Esta es la oportunidad estratégica central de Turnera: incluir WhatsApp automation como feature core diferenciador.

**El mercado valora fuertemente la integración con MercadoPago** para cobrar señas y reducir ausentismo. Turnito ofrece esto en su plan gratuito y lo posiciona como killer feature. Calu cobra comisiones decrecientes por plan (4%/2%/1%).

**Doctoralia compite en otro eje**: su valor principal no es el software de agenda sino el marketplace de pacientes. Cobra más porque incluye generación de demanda (SEO, perfil público, reviews). No es un competidor directo de software de gestión.

---

## 3. El contexto argentino cambia todas las reglas del pricing

### Inflación y estrategia de moneda

La inflación anual de 2025 fue del **31,5%** (la más baja en 8 años), y las proyecciones del REM para 2026 la ubican en **~24,4%**. Si bien la tendencia es a la baja, un producto que no ajuste precios trimestralmente pierde entre 6% y 8% de margen real por trimestre.

**La recomendación es cobrar en pesos argentinos con ajustes trimestrales vinculados al IPC.** Esta es la práctica estándar del mercado: DrApp, Turnito, Doctoralia y MedTurnos cobran en ARS. Las clínicas prefieren pesos por previsibilidad presupuestaria y simplicidad impositiva. Cobrar en dólares generaría un sobrecosto efectivo del **51-57%** para el cliente (por percepciones de IVA, Ganancias e IIBB sobre pagos al exterior), destruyendo competitividad.

El tipo de cambio oficial al cierre de marzo de 2026 es de **ARS $1.360 compra / ARS $1.410 venta** en el BNA. La banda de flotación se ajusta mensualmente por inflación (~2,5%/mes). Internamente, Turnera debería fijar sus precios con un tipo de cambio de referencia de **ARS $1.400/USD** y recalcular trimestralmente.

### Impuestos aplicables

El **IVA es del 21%** y aplica obligatoriamente a servicios de software/SaaS prestados desde Argentina. Todos los precios al público deberían comunicarse como "más IVA" o "IVA incluido" — la práctica estándar del sector B2B es comunicar precios sin IVA. **Ingresos Brutos varía entre 1,5% y 5%** según la jurisdicción provincial, con las principales provincias cobrando entre 3% y 4,5% sobre servicios digitales. El impacto combinado de estos tributos sobre el margen es de aproximadamente 25-28% sobre la facturación bruta.

### Métodos de pago

**MercadoPago domina el cobro de suscripciones B2B en Argentina.** Soporta débito automático recurrente (semanal, mensual, trimestral), acepta tarjetas de crédito/débito, saldo de MercadoPago, y efectivo en Rapipago/Pago Fácil. Su comisión varía entre 3% y 6% + IVA según el plan. Para clínicas medianas y grandes, la **transferencia bancaria** con facturación mensual es la alternativa preferida (sin comisión de procesador). Plataformas especializadas como **Rebill** ofrecen funcionalidades avanzadas de retry y recuperación de pagos fallidos, optimizadas para el mercado local.

### Psicología de precios para médicos argentinos

El umbral psicológico clave es: **el software debe costar menos que una consulta médica** para sentirse como una decisión obvia. Con el valor promedio de una consulta privada entre ARS $15.000 y ARS $30.000, cualquier plan que cueste menos que 1-2 consultas/mes se percibe como ganga. Un testimonio de usuario de Medicloud lo resume: *"El valor mensual no llega a una consulta"*. Precios superiores a ARS $55.000/mes para funcionalidades básicas se perciben como "caros" para consultorios individuales.

---

## 4. El verdadero costo de no automatizar: análisis de ROI

### Cuánto cuesta una secretaria médica en Argentina

Según las paritarias de Sanidad (CCT 122/75) actualizadas a Q1 2026, el **sueldo bruto estimado de una secretaria médica es de ARS $750.000-$900.000/mes**. Sumando cargas sociales (~26%), aguinaldo proporcional (8,33%), ART (~3%) y otros conceptos, el **costo total empleador asciende a ARS $1.030.000-$1.236.000/mes**, equivalente a **USD $735-$883**. Este es el benchmark de valor: si Turnera automatiza el 20-30% de las tareas repetitivas de la secretaria (recordatorios, confirmaciones, reprogramaciones), el software debería costar una fracción proporcional de ese costo.

### El agujero negro del ausentismo

Los datos de investigación del **Hospital Italiano de Buenos Aires** (2,5 millones de turnos analizados) ubican la tasa de ausentismo en Argentina entre el **23% y 34%**. Geblix confirma este rango con datos de 1,5 millones de citas en LatAm: **1 de cada 3 pacientes no se presenta**. Las causas: 40% olvida el turno; 60% sabe que no va a asistir pero no cancela.

El impacto financiero es devastador. Para una clínica modelo con 3 médicos:

| Métrica | Valor |
|:---|:---|
| Turnos diarios (15/médico × 3) | 45 |
| Turnos mensuales (× 22 días hábiles) | 990 |
| Tasa de ausentismo (25%) | 248 turnos perdidos |
| Valor promedio consulta privada | ARS $25.000 |
| **Pérdida mensual por ausentismo** | **ARS $6.200.000** |
| **Pérdida anual** | **ARS $74.400.000 (~USD $53.100)** |

### El ROI concreto de Turnera

Los sistemas de recordatorio por WhatsApp tienen una **tasa de apertura del 95-98%** y reducen el ausentismo entre un **25% y 40%**. Usando una estimación conservadora del 30%:

| Concepto | Cálculo |
|:---|:---|
| Turnos recuperados/mes (30% de 248) | 74 turnos |
| Ingreso recuperado/mes | ARS $1.850.000 |
| Costo del software (Plan Clínica, 3 profs) | ~ARS $69.000/mes (IVA incluido) |
| **ROI mensual** | **27x** |
| **Payback** | **Menos de 1 día de turnos recuperados** |

Adicionalmente, la automatización de WhatsApp ahorra entre **2-3 horas diarias** de trabajo de la secretaria (llamadas de confirmación, mensajes manuales, reprogramaciones), liberándola para tareas de mayor valor. Si ese tiempo se valora al costo proporcional de su salario, representa un ahorro adicional de **ARS $130.000-$190.000/mes**.

---

## 5. Propuesta de precios: tres planes diseñados para cada tamaño de clínica

La estructura recomendada combina un modelo **por profesional con descuento por volumen**, asegurando que los costos de WhatsApp se cubran naturalmente a medida que crece la cantidad de médicos. WhatsApp automation se incluye en todos los planes como diferenciador central.

### Tabla de precios recomendados

| | **Plan Profesional** | **Plan Clínica** | **Plan Centro Médico** |
|:---|:---|:---|:---|
| **Precio** | ARS $24.900/mes + IVA | ARS $18.900/mes por prof + IVA | ARS $14.900/mes por prof + IVA |
| **Equivalente USD** | ~USD $17,80 | ~USD $13,50/prof | ~USD $10,65/prof |
| **Profesionales** | 1 | 2 a 5 (mín. 2) | 6 a 15+ (mín. 6) |
| **Precio clínica típica** | ARS $24.900 (1 prof) | ARS $56.700 (3 profs) | ARS $149.000 (10 profs) |
| **Usuarios admin** | Ilimitados | Ilimitados | Ilimitados |
| **Turnos/mes** | Ilimitados | Ilimitados | Ilimitados |
| **WhatsApp incluido** | ✅ 500 msgs/mes | ✅ 2.500 msgs/mes | ✅ 6.000 msgs/mes |
| **Chatbot IA (WhatsApp)** | ✅ | ✅ | ✅ |
| **Agenda online** | ✅ | ✅ | ✅ |
| **Reserva online pacientes** | ✅ | ✅ | ✅ |
| **Recordatorios email** | ✅ | ✅ | ✅ |
| **Historia clínica básica** | ✅ | ✅ | ✅ |
| **Reportes básicos** | ✅ | ✅ | ✅ |
| **Multi-agenda** | — | ✅ | ✅ |
| **Roles y permisos** | — | ✅ | ✅ |
| **Portal del paciente** | — | ✅ | ✅ |
| **Reportes avanzados** | — | ✅ | ✅ |
| **Integración MercadoPago (seña)** | — | ✅ | ✅ |
| **Lista de espera inteligente** | — | ✅ | ✅ |
| **Múltiples sedes** | — | — | ✅ |
| **Acceso API** | — | — | ✅ |
| **Reportes gerenciales** | — | — | ✅ |
| **Onboarding personalizado** | — | — | ✅ |
| **Soporte** | Chat y email | Prioritario (chat + WhatsApp) | Dedicado (+ teléfono) |
| **WhatsApp adicional** | ARS $4.900 / 500 msgs | ARS $4.900 / 500 msgs | ARS $3.900 / 500 msgs |

### Justificación de los tiers

**Plan Profesional** apunta al consultorio individual — el segmento más grande del mercado. A ARS $24.900/mes se posiciona ligeramente por encima de DrApp (ARS $16.499 + IVA = ~$19.964) pero incluye lo que DrApp cobra como adicional: **WhatsApp automation con chatbot IA**. El precio equivale a menos de una consulta privada, activando el disparador psicológico de "decisión obvia".

**Plan Clínica** ofrece un descuento del **24% por profesional** respecto al plan individual (ARS $18.900 vs $24.900), incentivando la migración de consultorios individuales que crecen. Para una clínica de 3 médicos, el total de ARS $56.700 + IVA compite directamente con Doctoralia Plus (ARS $35.000 pero sin WhatsApp automation) ofreciendo significativamente más valor.

**Plan Centro Médico** aplica un descuento del **40% por profesional** (ARS $14.900). Para 10 médicos, ARS $149.000 + IVA es competitivo contra soluciones enterprise que no ofrecen WhatsApp integrado. Las funcionalidades premium (multi-sede, API, reportes gerenciales) justifican la adición y generan barreras de salida.

### Sobre el setup fee

**No se recomienda cobrar setup fee.** En el mercado argentino, el costo inicial es una barrera de entrada significativa para consultorios pequeños. La práctica del mercado (DrApp, Turnito, MedTurnos) es ofrecer onboarding gratuito. Para el Plan Centro Médico, el onboarding personalizado incluido en el precio funciona como valor percibido sin necesidad de cargo adicional.

### Qué no incluir gratis (y por qué)

No se recomienda un plan freemium para Turnera. El costo marginal de WhatsApp (USD $0,026/mensaje) hace que cada usuario gratuito genere pérdidas reales, a diferencia de modelos SaaS con costo marginal cercano a cero. En su lugar, un **trial de 14 días con funcionalidad completa** logra el mismo efecto de adquisición sin el riesgo financiero. Si eventualmente se desea ofrecer un plan gratuito, debería limitarse a agenda manual sin WhatsApp ni IA — esencialmente, una versión simplificada que motive la conversión.

---

## 6. Unit economics: la radiografía de costos por clínica

### Costos de infraestructura de la plataforma

El stack tecnológico de Turnera tiene costos que se dividen en **variables** (escalan por clínica) y **fijos** (se amortizan entre todas las clínicas).

**Costos variables por clínica — WhatsApp API (vía YCloud):**

YCloud no cobra markup sobre las tarifas de Meta. Los costos de WhatsApp Business API para Argentina (per-message pricing vigente desde julio 2025) son:

| Tipo de mensaje | Costo/mensaje (USD) | Uso en Turnera |
|:---|:---|:---|
| **Utility** (recordatorios, confirmaciones proactivas) | $0,026 | Recordatorios 24h antes del turno |
| **Service** (respuestas dentro de ventana 24h) | GRATIS | Respuestas del chatbot IA a pacientes |
| **Marketing** (promociones) | $0,0618 | Campañas opcionales |
| **Authentication** (OTP) | $0,026 | Verificación de identidad |

**Dato crítico:** los mensajes **utility enviados dentro de una ventana de servicio activa son gratuitos**. Si el paciente interactúa primero (ej: el chatbot le envía un mensaje y el paciente responde "Sí"), toda la conversación subsiguiente dentro de 24 horas es gratis. Con una tasa de respuesta del 60-70%, esto reduce el costo real de WhatsApp en un **20-35%**.

**Costos variables — IA (GPT-4o-mini):**

| Métrica | Valor |
|:---|:---|
| Costo input | USD $0,15 / 1M tokens |
| Costo output | USD $0,60 / 1M tokens |
| Tokens por interacción (est.) | ~500 input + ~300 output |
| **Costo por interacción** | **USD $0,00026** |
| 500 interacciones/mes por clínica | **USD $0,13/mes** |

El costo de IA es **prácticamente irrelevante**: menos de USD $0,15/mes por clínica incluso con uso intensivo.

**Costos fijos de infraestructura (compartidos):**

| Servicio | Plan | Costo mensual |
|:---|:---|:---|
| Supabase (base de datos) | Pro | USD $25-$50 |
| Vercel (frontend + API) | Pro | USD $20-$40 |
| Railway (workers/webhooks) | Hobby/Pro | USD $5-$20 |
| **Total infraestructura fija** | | **USD $50-$110/mes** |

### Costo total por clínica según escala

La siguiente tabla muestra el costo real de servir a una clínica tipo (3 médicos, ~1.100 turnos/mes) a diferentes escalas:

| Escala | WhatsApp/clínica | IA/clínica | Infra/clínica | **Total/clínica** |
|:---|:---|:---|:---|:---|
| **10 clínicas** | USD $28,60 | USD $0,13 | USD $5,00 | **USD $33,73** |
| **50 clínicas** | USD $28,60 | USD $0,13 | USD $1,50 | **USD $30,23** |
| **100 clínicas** | USD $27,17* | USD $0,13 | USD $1,05 | **USD $28,35** |
| **500 clínicas** | USD $24,31** | USD $0,13 | USD $0,45 | **USD $24,89** |

\* A 100 clínicas = ~110K msgs utility/mes → Volume Tier 2 de Meta (~5% descuento)  
\** A 500 clínicas = ~550K msgs/mes → Volume Tier 3 (~15% descuento estimado)

### Margen bruto por plan

| Plan | Precio (USD equiv.) | Costo estimado (USD) | **Margen bruto** |
|:---|:---|:---|:---|
| **Profesional** (1 prof, ~400 msgs) | $17,80 | ~$12,40 | **30%** |
| **Clínica** (3 profs, ~1.100 msgs) | $40,50 | ~$30,20 | **25%** |
| **Clínica** (5 profs, ~1.800 msgs) | $67,50 | ~$49,30 | **27%** |
| **Centro** (10 profs, ~3.500 msgs) | $106,50 | ~$93,00 | **13%** |
| **Centro** (10 profs, con optimización CSW) | $106,50 | ~$72,00 | **32%** |

El margen del Plan Centro mejora sustancialmente con la **optimización de ventana de servicio al cliente (CSW)**: diseñando flujos donde el paciente responde primero (ej: "Responda CONFIRMAR para confirmar su turno"), se activa la ventana gratuita de 24 horas, haciendo que los mensajes utility subsiguientes sean sin costo.

### Punto de equilibrio y viabilidad

| Métrica | 10 clínicas | 50 clínicas | 100 clínicas |
|:---|:---|:---|:---|
| Ingreso mensual estimado (mix de planes)* | USD $500 | USD $2.500 | USD $5.000 |
| Costo variable total | USD $337 | USD $1.512 | USD $2.835 |
| Costo fijo infraestructura | USD $80 | USD $80 | USD $105 |
| **Ganancia bruta mensual** | **USD $83** | **USD $908** | **USD $2.060** |
| **Margen bruto** | **17%** | **36%** | **41%** |

\* Asumiendo mix: 60% Plan Profesional, 30% Plan Clínica (3 profs), 10% Plan Centro (8 profs)

**El negocio alcanza viabilidad operativa básica con ~30-40 clínicas** (ingresos de ~USD $1.500/mes, margen bruto de ~30%). Para un ingreso mensual de **USD $10.000** (suficiente para un equipo pequeño de 2-3 personas), se necesitan aproximadamente **200-250 clínicas**. A 500 clínicas, los ingresos superan los USD $25.000/mes con márgenes de 40%+.

---

## 7. Estrategia de descuentos y precios especiales

### Descuento de lanzamiento / early adopters

Se recomienda un **30% de descuento durante los primeros 6 meses** para los primeros 50 clientes ("Fundadores"). Este pricing agresivo tiene múltiples objetivos: validar product-market fit, generar testimonios y reviews, construir el pipeline de referidos, e iterar el producto con feedback real.

| Plan | Precio regular | Precio Fundador (30% off) |
|:---|:---|:---|
| **Profesional** | ARS $24.900 + IVA | **ARS $17.400 + IVA** |
| **Clínica** (por prof) | ARS $18.900 + IVA | **ARS $13.200 + IVA** |
| **Centro** (por prof) | ARS $14.900 + IVA | **ARS $10.400 + IVA** |

A precio Fundador, el Plan Profesional queda en ARS $17.400 — **prácticamente idéntico a DrApp** pero con WhatsApp automation incluida. Esta es una propuesta irresistible para la etapa de adquisición.

Los Fundadores mantienen el precio de lanzamiento durante 12 meses (no 6), creando un lock-in emocional. Después del primer año, migran al precio vigente con un descuento permanente del 10% como reconocimiento.

### Descuento por pago anual

**2 meses gratis (equivalente a 17% de descuento)** al contratar un plan anual. El pago anual se congela al precio del momento de contratación — una ventaja significativa en un contexto inflacionario. Esto mejora la previsibilidad de ingresos del negocio y reduce el churn mensual.

### Descuentos por volumen (cadenas de clínicas)

Para organizaciones con múltiples sedes, se aplican descuentos adicionales sobre el Plan Centro Médico:

- **3-5 sedes:** 10% adicional sobre el precio por profesional
- **6-10 sedes:** 15% adicional
- **11+ sedes:** Negociación personalizada

### Programa de referidos

**1 mes gratis por cada clínica referida que se convierta en cliente pago.** El referidor y el referido obtienen el beneficio. Limitado a 6 meses acumulables de crédito. Los programas de referidos son especialmente efectivos en el sector médico, donde las recomendaciones entre colegas son el principal canal de adquisición.

### Pricing para instituciones sin fines de lucro

Hospitales públicos, fundaciones y organizaciones sin fines de lucro: **50% de descuento permanente** sobre cualquier plan. Además de la misión social, estas instituciones generan visibilidad, volumen, y pueden convertirse en referencias para el sector privado.

---

## 8. Guía del primer año: de cero a 200 clínicas

### Fase 1: Validación (Meses 1-3)

**Objetivo:** 20-30 clínicas activas, validar producto y pricing.

- Lanzar con **pricing Fundadores** (30% descuento)
- Foco exclusivo en **consultorios individuales y clínicas de 2-3 médicos** (menor complejidad de onboarding, feedback más rápido)
- Canal de adquisición principal: **outreach directo** a médicos en redes sociales, grupos de WhatsApp profesionales, y colegios médicos
- Onboarding 1:1 con cada cliente para maximizar activación y recoger feedback
- No cobrar mensajes de WhatsApp adicionales durante esta fase — absorber el costo como inversión
- **Métricas clave:** tasa de activación (% que envía primer recordatorio), NPS, tasa de conversión de trial a pago

### Fase 2: Tracción (Meses 4-6)

**Objetivo:** 50-80 clínicas activas, validar canales de crecimiento.

- Cerrar el programa Fundadores (límite 50 clínicas)
- Lanzar **precio regular** con descuento de 20% para primeros 3 meses de nuevos clientes
- Activar **programa de referidos** (1 mes gratis por referido)
- Publicar **casos de éxito** con datos reales: "La clínica X redujo ausentismo del 28% al 12%"
- Incorporar **Plan Clínica** como foco de ventas (mayor LTV, mejor margen)
- Empezar a cobrar mensajes adicionales de WhatsApp según plan
- Iniciar contenido SEO: "mejor software de turnos médicos Argentina"

### Fase 3: Crecimiento (Meses 7-12)

**Objetivo:** 150-200 clínicas activas, unit economics positivos.

- **Precio estándar sin descuento de adquisición** (mantener descuento anual)
- Ajustar precios por IPC trimestralmente (comunicar con 30 días de anticipación)
- Lanzar Plan Centro Médico para capturar clínicas medianas
- Desarrollar **integraciones premium**: MercadoPago para señas, e-recetas, portal del paciente
- Buscar partnerships con distribuidores de software médico y asociaciones profesionales
- Evaluar y lanzar **funcionalidades premium** como add-ons: dictado por voz IA (ARS $X/mes), integración con historias clínicas externas, reportes personalizados
- A 200 clínicas, el ingreso mensual recurrente debería superar **ARS $7-10 millones (~USD $5.000-$7.000)**

### Evolución del precio esperada

| Período | Precio Plan Profesional | Estrategia |
|:---|:---|:---|
| Meses 1-6 | ARS $17.400 (Fundadores) | Adquisición agresiva, validar PMF |
| Meses 4-6 | ARS $24.900 (regular) | Nuevos clientes pagan precio completo |
| Mes 7+ | ARS $24.900 + ajuste IPC trimestral | Pricing estable, crece con inflación |
| Mes 13+ | Evaluar aumento de base si el valor entregado lo justifica | Posible suba a ARS $29.900 |

---

## Conclusiones y recomendaciones finales

Turnera tiene una **ventana de oportunidad clara** en el mercado argentino de software médico: ningún competidor incluye automatización completa de WhatsApp con chatbot IA en su plan base. El modelo de pricing por profesional con tiers de funcionalidad es la estructura óptima porque alinea ingresos con costos variables (más profesionales = más mensajes WhatsApp = más ingreso para cubrir más costo).

**Tres decisiones estratégicas definen el éxito del pricing:**

Primero, **cobrar en pesos argentinos es innegociable** para competir en el mercado local. Los ajustes trimestrales por IPC y la operación a través de MercadoPago son requisitos, no opciones.

Segundo, **el margen del negocio vive o muere con la optimización de WhatsApp.** A $0,026/mensaje utility para Argentina, WhatsApp representa el 85-95% del costo variable por clínica. La ingeniería de flujos conversacionales que maximicen el uso de la ventana de servicio gratuita de 24 horas es la palanca técnica más importante del negocio. Cada punto porcentual de mejora en la tasa de respuesta de pacientes se traduce directamente en margen.

Tercero, **el valor no está en la agenda sino en la reducción de ausentismo.** El pitch de ventas nunca debería ser "software de turnos por ARS $24.900" sino "recupere ARS $1.850.000/mes en turnos perdidos por ARS $24.900". Un ROI de **27x** convierte el precio en irrelevante para cualquier clínica que haga los números. El desafío no es convencer sobre el precio sino lograr que el prospecto abra la calculadora.