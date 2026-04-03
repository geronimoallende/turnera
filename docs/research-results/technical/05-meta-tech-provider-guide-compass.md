# Guía completa: registrar una empresa argentina como Meta Tech Provider para WhatsApp

**La ruta más directa para AlthemGroup es constituir una SAS unipersonal en Entre Ríos y, en paralelo, preparar todo el ecosistema Meta.** A los 18 años tenés plena capacidad legal en Argentina para fundar una sociedad, firmar contratos con Meta y operar como Tech Provider sin intermediarios. El proceso completo — desde cero absoluto hasta enviar el primer mensaje de WhatsApp a un paciente — toma entre **6 y 12 semanas** si se ejecuta bien. Esta guía cubre cada paso con el nivel de detalle que necesitás para no improvisar en ninguna etapa.

El camino sin Solution Partner (sin BSP) es técnicamente más exigente pero te da control total sobre la experiencia, los datos y los márgenes de tu SaaS. La principal contrapartida es que **no podés centralizar la facturación de Meta** — cada clínica paga directo a Meta sus mensajes — pero tu negocio cobra aparte por Turnera como plataforma. Para un SaaS de gestión de turnos médicos con chatbot de IA, esta arquitectura es viable y escalable.

---

## 1. La estructura legal: SAS unipersonal es tu mejor opción

**A los 18 años tenés plena capacidad legal** en Argentina. La Ley 26.579 (2009) bajó la mayoría de edad de 21 a 18, y el Código Civil y Comercial (Art. 25) lo confirma. No hay restricción alguna para constituir sociedades, ser administrador, ni contratar con empresas extranjeras como Meta.

La **SAS (Sociedad por Acciones Simplificada)**, regulada por la Ley 27.349, permite un único socio-fundador (SAS unipersonal o SASU). Genera un CUIT propio con prefijo 30 (persona jurídica), un estatuto social inscripto, y toda la documentación que Meta necesita para verificar un negocio. El monotributo como persona física es más rápido y barato, pero tu "nombre comercial" sería tu nombre personal — lo que genera fricción con Meta si tu marca es AlthemGroup.

**Pasos para crear la SAS en Entre Ríos:**

1. **Reservar denominación** en la Dirección General de Inspección de Personas Jurídicas (DGIPJ) de Entre Ríos. Presentar 2-3 nombres posibles, incluyendo "AlthemGroup SAS" o "Althem Group SAS". Tarda 2-5 días hábiles.
2. **Redactar el instrumento constitutivo** con un abogado. Debe incluir: datos del socio (DNI, CUIT/CUIL, domicilio), denominación + "SAS", objeto social amplio (desarrollo de software, servicios tecnológicos, consultoría), domicilio en Paraná, capital social, estructura de administración. Necesitás designar un administrador suplente (puede ser un familiar o socio de confianza, solo necesita CUIL).
3. **Firmar** ante escribano (certificación de firmas) o con firma digital si está disponible en la provincia.
4. **Integrar capital mínimo**: 2 salarios mínimos vitales y móviles (**~$600.000 ARS** al momento de redacción), depositando el 25% (~$150.000 ARS) en cuenta bancaria. Este depósito es recuperable post-inscripción.
5. **Publicar edicto** en el Boletín Oficial de Entre Ríos.
6. **Presentar en DGIPJ**: instrumento constitutivo, comprobante de tasa, recibo bancario del capital, publicación del edicto, declaración jurada Art. 264. Solicitar rúbrica de libros societarios.
7. **Obtener CUIT de la sociedad** en ARCA (ex AFIP). La ley establece emisión en 24 horas. Registrar en IVA, Ganancias, y como Autónomo del administrador.
8. **Inscribir en Ingresos Brutos** (ATER, Entre Ríos).

**Costos aproximados**: $300.000-$700.000 ARS todo incluido (abogado, escribano, tasas, edicto, capital). **Tiempo**: 3-8 semanas. En Entre Ríos el proceso es mayormente presencial (no hay plataforma digital como CABA).

**¿Y si empiezo con monotributo mientras tanto?** Es una estrategia híbrida válida. Podés inscribirte como monotributista en categoría A (servicios, hasta ~$7.8M ARS/año) en 1-2 semanas, obtener CUIT rápidamente, y arrancar a configurar Meta. Después migrás a la SAS cuando esté lista. Pero ojo: si Meta verifica tu negocio con tu nombre personal y después querés cambiar a la SAS, vas a tener que re-verificar.

---

## 2. Setup en Meta desde cero absoluto

Con el CUIT y la documentación de la SAS (o monotributo) en mano, arrancás la configuración en Meta. Todo se hace en paralelo con el desarrollo de Turnera.

**Crear el Meta Business Portfolio (ex Business Manager):**

Ingresá a `business.facebook.com` con tu cuenta personal de Facebook (creá una si no tenés, usando tu email @althemgroup). Hacé clic en "Crear cuenta", completá el nombre del portfolio (**"AlthemGroup"**, debe coincidir con tu razón social), tu nombre y email corporativo. Meta envía un email de verificación — confirmalo. Después completá la información del negocio en Business Settings > Business Info: dirección legal, teléfono, sitio web.

**Requisitos del dominio y sitio web:**

Un dominio **.com.ar funciona perfectamente** — Meta acepta cualquier TLD. Lo crítico es poder verificar la propiedad del dominio mediante uno de tres métodos: registro DNS TXT, meta tag HTML en `<head>`, o subida de archivo HTML a la raíz. La verificación DNS puede tardar hasta 72 horas en propagarse.

Tu sitio web debe estar **públicamente accesible** y mostrar: nombre del negocio (AlthemGroup), descripción de servicios, dirección, contacto. Necesitás tener publicada una **Privacy Policy** y **Terms of Service** antes de configurar la app de Meta — estos URLs son campos obligatorios. La privacy policy debe explicar qué datos recolectás vía WhatsApp, cómo los usás, almacenás y compartís. No necesita ser un documento legal de 50 páginas — pero sí debe ser específica sobre el uso de datos de mensajería.

**2FA es obligatorio**: activá la autenticación de dos factores tanto en tu cuenta personal de Facebook como en el Business Portfolio (Security Center > 2FA).

**Verificación de negocio — documentos para Argentina:**

Meta acepta para Argentina: **constancia de inscripción de CUIT** (ARCA/AFIP), estatuto social inscripto, factura de servicios (luz, gas, teléfono a nombre de la empresa), y resumen bancario empresarial. La constancia de CUIT es el documento más usado y directo. El nombre en los documentos **debe coincidir exactamente** con el nombre en Business Manager. Experiencias de empresas argentinas reportan que el proceso toma **2-14 días hábiles** y que tenés **hasta 3 intentos** si te rechazan. Causas comunes de rechazo: documentos borrosos, nombre que no coincide, sitio web sin información del negocio, o teléfono con IVR que impide la verificación.

---

## 3. El camino de Tech Provider sin Solution Partner

Una vez que tenés el Business Portfolio verificado y la cuenta de developer creada en `developers.facebook.com`, el proceso de onboarding como Tech Provider sigue estos pasos concretos:

**Crear la Meta App:** en el App Dashboard, hacé clic en "Create App". Nombre de la app: algo como "Turnera by AlthemGroup" (**nunca incluir "WhatsApp", "Meta" o "Facebook"** en el nombre). Use case: "Other" > App type: "Business" > Seleccionar tu Business Portfolio > Create App. En Settings > Basic: subir ícono (512×512px), completar Privacy Policy URL, Terms of Service URL, categoría "Messaging", y agregar tu dominio como plataforma.

**Agregar el producto WhatsApp:** en el Dashboard de la app, buscar la card "WhatsApp" > "Set Up". Aceptar los términos de WhatsApp Business y los Meta Hosting Terms for Cloud API. Esto te lleva al panel de Quickstart donde Meta te genera automáticamente un WABA de prueba y un número de prueba para testing.

**Iniciar onboarding como Tech Provider:** en Quickstart > "Scale your Business" > "Become a Tech Provider" > "Start onboarding". Aceptar los Tech Provider Terms of Service. Acá elegís: **"Independent Tech Provider"** (sin partner). Esta es tu ruta. La diferencia clave con ir con un Solution Partner es que **no podés extender líneas de crédito a tus clientes ni cobrar markup sobre las tarifas de mensajería de Meta**. Pero tenés acceso a exactamente las mismas APIs, funcionalidades y capacidades técnicas.

**Completar la verificación de negocio** (si no la hiciste antes): desde el panel de onboarding > "Start Verification" > Security Center. Subir documentos, verificar teléfono o dominio.

**App Review** (paso crítico): solicitar Advanced Access para dos permisos: `whatsapp_business_messaging` y `whatsapp_business_management`. Esto requiere enviar dos videos demostrativos y responder preguntas sobre manejo de datos.

**Access Verification** (post App Review): en App Settings > Basic > Verifications > "Start verification". Completar información sobre cómo tu negocio usa datos de otras empresas. Tarda ~5 días hábiles.

**Timeline total realista:**

| Paso | Mejor caso | Peor caso |
|------|-----------|-----------|
| Crear Business Portfolio + Developer | 1 día | 1 día |
| Verificación de negocio | 2 días | 4 semanas |
| App Review | 3 días | 3 semanas |
| Access Verification | 3 días | 2 semanas |
| **Total** | **~2 semanas** | **~8 semanas** |

---

## 4. Cómo pasar el App Review a la primera

El App Review es donde más empresas chicas de LATAM se traban. Meta pide evidencia concreta de que tu app usa los permisos de forma legítima.

**Video 1 — para `whatsapp_business_messaging`:** Grabá tu pantalla mostrando el proceso de enviar un mensaje desde tu aplicación (o desde un script cURL/Python usando la API) y que ese mensaje llegue a un celular con WhatsApp. **No necesitás una UI pulida** — Meta acepta explícitamente una grabación del API Setup panel enviando un mensaje de prueba, o un script de Python ejecutándose en terminal. Lo importante es que se vea claramente: la llamada a la API, el número destino, el contenido del mensaje, y la confirmación de entrega en el celular.

**Video 2 — para `whatsapp_business_management`:** Grabá la creación de un message template. Podés hacerlo directamente en WhatsApp Manager (interfaz web de Meta) — no necesitás UI propia. Mostrar: nombre del template, categoría, idioma, cuerpo del mensaje con variables, y el submit para review.

**Requisitos técnicos de los videos:** resolución 1080p o superior, ancho de pantalla máximo 1440px, UI en inglés (o con subtítulos en inglés), y explicar cada paso claramente. Podés usar Loom, OBS, o cualquier grabador de pantalla.

**Preguntas de data handling:** te van a preguntar quién es el data controller (tu empresa), qué data processors acceden a datos de Meta (solo tu backend), si compartiste datos con autoridades públicas, y qué políticas tenés de minimización de datos y eliminación. Respondé con honestidad y especificidad. Tener la privacy policy bien redactada ayuda enormemente.

**Errores que causan rechazo y cómo evitarlos:**

- Descripción vaga del uso de permisos — sé extremadamente específico: "Usamos whatsapp_business_messaging para enviar recordatorios de turnos médicos a pacientes de clínicas que usan nuestra plataforma Turnera"
- Videos de baja calidad o que muestran la experiencia del consumidor en vez de la interfaz de negocio
- Pedir permisos que no usás — solo pedí los dos necesarios
- Falta de Privacy Policy URL o Terms of Service URL en App Settings
- Nombre de app que incluye marcas de Meta
- Información inconsistente entre Business Manager, sitio web y documentos legales

Si te rechazan, **podés reenviar** con correcciones. Meta da feedback específico sobre qué corregir. No hay límite documentado de reintentos para App Review, pero cada reenvío agrega 3-5 días hábiles.

---

## 5. Embedded Signup: cómo las clínicas conectan su WhatsApp desde Turnera

Embedded Signup es el flujo que permite a cada clínica cliente conectar su número de WhatsApp a tu plataforma directamente desde tu app web, sin que tengan que tocar el dashboard de Meta.

**Configuración en Meta App Dashboard:**

En tu app, ir a Facebook Login for Business > Configurations > Create Configuration. Nombre: "Turnera WhatsApp Onboarding". Login variation: **"WhatsApp Embedded Signup"**. Access token: **"System-user access token"** (60 días de duración). Assets: asegurarte que "WhatsApp accounts" esté seleccionado. Guardar y anotar el **config_id** — lo necesitás en el frontend.

En Facebook Login > Settings: habilitar "Login with the JavaScript SDK", agregar tu dominio en "Allowed Domains for the JavaScript SDK", y tu redirect URI en "Valid OAuth Redirect URIs".

**Integración en Next.js — cargar el Facebook SDK:**

```jsx
// components/FacebookSDK.jsx
import { useEffect } from 'react';

export default function FacebookSDK({ appId }) {
  useEffect(() => {
    window.fbAsyncInit = function () {
      FB.init({
        appId: appId,
        cookie: true,
        xfbml: true,
        version: 'v22.0',
      });
    };
    (function (d, s, id) {
      var js, fjs = d.getElementsByTagName(s)[0];
      if (d.getElementById(id)) return;
      js = d.createElement(s);
      js.id = id;
      js.src = 'https://connect.facebook.net/en_US/sdk.js';
      fjs.parentNode.insertBefore(js, fjs);
    })(document, 'script', 'facebook-jssdk');
  }, [appId]);
  return null;
}
```

**Lanzar el flujo de Embedded Signup:**

```jsx
const launchWhatsAppSignup = () => {
  // Listener para capturar WABA ID y Phone Number ID
  const listener = (event) => {
    if (event.origin !== 'https://www.facebook.com') return;
    try {
      const data = JSON.parse(event.data);
      if (data.type === 'WA_EMBEDDED_SIGNUP') {
        if (data.event === 'FINISH') {
          const { phone_number_id, waba_id } = data.data;
          // Guardar en tu backend
        }
      }
    } catch (e) { /* ignorar mensajes no-JSON */ }
  };
  window.addEventListener('message', listener);

  FB.login((response) => {
    if (response.authResponse) {
      const code = response.authResponse.code;
      // Enviar code al backend para exchange
      fetch('/api/whatsapp/complete-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
    }
  }, {
    config_id: 'TU_CONFIG_ID',
    response_type: 'code',
    override_default_response_type: true,
    extras: {
      setup: {},
      featureType: '',
      sessionInfoVersion: 2,
    },
  });
};
```

**Lo que ve la clínica:** un popup de Facebook que los guía por 5 pantallas: login con su cuenta de Facebook personal → crear/seleccionar Business Portfolio (nombre del negocio, dirección) → crear WABA (display name, categoría "Healthcare") → ingresar y verificar número de teléfono vía SMS/llamada → revisar permisos que otorgan a tu app → confirmación. **Todo el flujo toma menos de 5 minutos.**

**Backend Python — exchange de código por token:**

```python
import requests, os

def exchange_code_for_token(code: str) -> dict:
    response = requests.get(
        "https://graph.facebook.com/v22.0/oauth/access_token",
        params={
            "client_id": os.environ["META_APP_ID"],
            "client_secret": os.environ["META_APP_SECRET"],
            "code": code,
        }
    )
    response.raise_for_status()
    return response.json()
    # Retorna: {"access_token": "...", "token_type": "bearer", "expires_in": 5184000}
    # 5184000 segundos = 60 días
```

**Registrar el número y suscribir webhooks:**

```python
def register_phone(phone_number_id: str, token: str):
    requests.post(
        f"https://graph.facebook.com/v22.0/{phone_number_id}/register",
        headers={"Authorization": f"Bearer {token}"},
        json={"messaging_product": "whatsapp", "pin": "123456"}
    ).raise_for_status()

def subscribe_webhooks(waba_id: str, token: str):
    requests.post(
        f"https://graph.facebook.com/v22.0/{waba_id}/subscribed_apps",
        headers={"Authorization": f"Bearer {token}"}
    ).raise_for_status()
```

El número **debe registrarse dentro de los 14 días** posteriores al Embedded Signup. Si no, hay que repetir el flujo.

---

## 6. Operación directa con la Cloud API desde Python

**Enviar mensajes de texto:**

```python
BASE_URL = f"https://graph.facebook.com/v22.0/{PHONE_NUMBER_ID}/messages"
HEADERS = {"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"}

def send_text(to: str, body: str):
    return requests.post(BASE_URL, headers=HEADERS, json={
        "messaging_product": "whatsapp",
        "to": to,  # Formato: 5493411234567 (con 9 después de 54)
        "type": "text",
        "text": {"body": body}
    }).json()
```

**Enviar templates (para recordatorios de turnos):**

```python
def send_template(to: str, template_name: str, params: list):
    return requests.post(BASE_URL, headers=HEADERS, json={
        "messaging_product": "whatsapp",
        "to": to,
        "type": "template",
        "template": {
            "name": template_name,
            "language": {"code": "es_AR"},
            "components": [{"type": "body",
                "parameters": [{"type": "text", "text": p} for p in params]}]
        }
    }).json()

# Ejemplo: send_template("5493411234567", "recordatorio_turno",
#   ["María", "15 de abril", "10:30", "Dr. Rodríguez"])
```

**Mensajes interactivos (botones para confirmar turno):**

```python
def send_buttons(to: str, body: str, buttons: list):
    return requests.post(BASE_URL, headers=HEADERS, json={
        "messaging_product": "whatsapp",
        "to": to,
        "type": "interactive",
        "interactive": {
            "type": "button",
            "body": {"text": body},
            "action": {"buttons": [
                {"type": "reply", "reply": {"id": b["id"], "title": b["title"]}}
                for b in buttons[:3]  # Máximo 3 botones
            ]}
        }
    }).json()
```

**Recibir webhooks (Flask):**

```python
@app.route("/webhook", methods=["GET"])
def verify():
    if request.args.get("hub.verify_token") == VERIFY_TOKEN:
        return request.args.get("hub.challenge"), 200
    return "Forbidden", 403

@app.route("/webhook", methods=["POST"])
def handle():
    for entry in request.json.get("entry", []):
        for change in entry.get("changes", []):
            value = change["value"]
            for msg in value.get("messages", []):
                # msg["from"] = número del paciente
                # msg["type"] = "text" | "interactive" | "image" | etc.
                # msg["text"]["body"] = texto del mensaje
                process_incoming(msg)
            for status in value.get("statuses", []):
                # status["status"] = "sent" | "delivered" | "read" | "failed"
                update_status(status)
    return "OK", 200
```

**Gestión de tokens — punto crítico para multi-tenant:** cada clínica onboarded vía Embedded Signup genera un **Business Integration System User (BISU) token** con 60 días de vida. Guardá estos tokens cifrados en Supabase (AES-256) con la fecha de expiración. Implementá un cron job que renueve tokens antes de que expiren. Nunca expongas tokens en el frontend ni en logs.

**Rate limits**: Cloud API permite **80 mensajes por segundo** por defecto (20 MPS en modo coexistencia). Para un número nuevo, arrancás con **250 conversaciones únicas por 24 horas**. Esto sube a 1.000 al completar verificación de negocio, y luego auto-escala a 10K → 100K → ilimitado según calidad y volumen. Para un SaaS de turnos médicos con pocas clínicas al inicio, estos límites son más que suficientes.

**Librería recomendada**: **pywa** (`pip install pywa`) es el framework Python más completo para WhatsApp Cloud API. Soporta async, integración con Flask/FastAPI, handlers de webhooks, gestión de templates, y hasta tiene un método para el exchange de tokens de Embedded Signup. Docs: `pywa.readthedocs.io`.

---

## 7. Billing sin BSP: cada clínica paga a Meta directamente

Este es el trade-off más importante de ir sin Solution Partner. **Como Tech Provider independiente, no podés centralizar la facturación de mensajes bajo tu cuenta.** Cada WABA (cada clínica) necesita configurar su propio método de pago en Meta Business Manager → WhatsApp Accounts → Payment Settings. Meta cobra directamente a cada negocio por los mensajes template enviados.

Tu modelo de negocio sería: **cobrar por Turnera como SaaS** (suscripción mensual por la plataforma) y que Meta cobre aparte por mensajería. Esto tiene la ventaja de transparencia total para la clínica y la desventaja de fricción en el onboarding.

**Precios de Meta para Argentina (vigente desde julio 2025 — modelo por mensaje):**

- **Marketing**: ~$0.034-$0.054 USD por mensaje entregado
- **Utility**: ~$0.010-$0.020 USD por mensaje (reducido desde octubre 2025 para Argentina)
- **Authentication**: ~$0.010-$0.020 USD por mensaje
- **Service (respuestas dentro de 24h)**: **GRATIS** — los templates Utility enviados dentro de una ventana de servicio abierta también son gratuitos

Desde **abril 2026, ARS es moneda de facturación soportada** por Meta, lo que permite a las clínicas pagar en pesos tratado como transacción local (solo 21% IVA, sin percepciones de Ganancias del 30% que aplican a pagos internacionales).

**Problemas conocidos con tarjetas argentinas:** las tarjetas de crédito argentinas históricamente sufren rechazos en Meta por restricciones bancarias a transacciones internacionales. Desde la eliminación del cepo (abril 2025) y del Impuesto PAÍS (diciembre 2024), la situación mejoró significativamente. La facturación en ARS local es la mejor solución. Alternativas: tarjetas virtuales internacionales (Payoneer, similares) o tarjetas fondadas en USD.

---

## 8. Coexistence mode: la clínica sigue usando la app mientras tu bot opera

**El modo coexistencia, lanzado por Meta en febrero 2025**, permite usar la WhatsApp Business App y la Cloud API simultáneamente en el mismo número. Esto es exactamente lo que necesitás para las clínicas que no quieren dejar de usar su app de WhatsApp de un día para el otro.

**Cómo funciona:** la clínica completa el Embedded Signup desde Turnera — durante ese flujo, si ya tiene la WhatsApp Business App activa en su celular (versión 2.24.17 o superior), el modo coexistencia se activa automáticamente. No hay configuración adicional. Los mensajes enviados vía API (tu chatbot) aparecen automáticamente en la Business App del celular. Los mensajes enviados desde la app se replican al API mediante webhooks `smb_message_echoes`, permitiendo que tu backend se mantenga sincronizado.

**¿Quién "gana" si ambos responden?** Ambos mensajes llegan al paciente — **WhatsApp no bloquea ningún canal**. Esto significa que necesitás un SOP claro: por ejemplo, el bot maneja respuestas automáticas (confirmaciones de turno, horarios, etc.) y la recepcionista interviene solo para consultas complejas, con un botón en Turnera que "pause" el bot para esa conversación.

**Limitaciones importantes del modo coexistencia:**

- **Throughput reducido a 20 MPS** (vs 80 MPS en modo API puro) — suficiente para clínicas, pero limitante si escalás a alto volumen
- **Listas de difusión deshabilitadas** en la app (solo lectura de existentes; broadcasts deben hacerse vía API)
- **Mensajes efímeros, View-once y ubicación en vivo no soportados**
- **Grupos, llamadas y estados** funcionan en la app pero no se sincronizan al API
- **No se puede obtener Official Business Account (badge azul)** con coexistencia activa
- **Dispositivos vinculados** se desvinculan durante el onboarding (WhatsApp for Windows y WearOS no se pueden re-vincular)

**¿Viable como modo permanente?** Para clínicas pequeñas-medianas que manejan decenas de turnos por día, sí. El límite de 20 MPS y las restricciones no afectan el caso de uso core (recordatorios, confirmaciones, consultas). Para clínicas que migren a un volumen alto o quieran el badge azul, la migración a API puro es el siguiente paso.

**Migración a API puro:** la clínica va a Settings > Account > Business Platform > "Disconnect Account" en la WhatsApp Business App. Después no puede reactivar coexistencia por 1-2 meses. El número queda registrado exclusivamente en Cloud API con throughput completo de 80 MPS.

---

## 9. Gotchas, riesgos y lo que pocos te cuentan

**Formato de números argentinos (+54):** esta es la trampa técnica más común. Los números móviles argentinos requieren insertar un **9** después del código de país y eliminar el **15** del formato local. Ejemplo: el número local 0343 15-412-3456 debe formatearse como **+54 9 343 4123456** para la API. Usá `libphonenumber` (Google) para normalizar automáticamente. Si el formato es incorrecto, los mensajes fallan silenciosamente.

**Argentina no tiene restricciones país-específicas** en WhatsApp Business Platform. No está en la lista de países excluidos (Crimea, Cuba, Irán, Corea del Norte, Siria), y el soporte de facturación en ARS confirma que Meta trata a Argentina como mercado prioritario en LATAM.

**Política de bots de IA (enero 2026):** Meta prohibió los "chatbots de propósito general" en la plataforma. Solo se permiten bots **task-specific** (soporte, ventas, reservas). Tu chatbot de gestión de turnos médicos entra perfectamente en la categoría permitida — es una automatización de tarea específica, no un chatbot conversacional genérico. Documentá claramente en tu App Review que el bot tiene un propósito acotado.

**Templates estrictos:** Meta endureció las reglas de templates. Los que excedan **550 caracteres** o tengan más de **10 emojis** son rechazados automáticamente. Los templates de marketing están limitados a **2 por usuario en 24 horas** a menos que el destinatario responda. Para recordatorios de turnos, usá categoría **Utility** — son más baratos y tienen reglas más flexibles.

**Riesgos de ir sin BSP:**

- **Sin soporte prioritario de Meta** — los Solution Partners tienen canales de soporte dedicados; vos tenés el portal de soporte estándar
- **Cada clínica gestiona su propio pago** — si una tarjeta falla, los templates dejan de enviarse hasta que paguen. No podés cubrirlo vos
- **Sin capacidad de markup** — tu ingreso viene 100% de la suscripción SaaS, no podés cobrar un margen sobre cada mensaje
- **Onboarding de cliente potencialmente más lento** — la clínica tiene que crear Business Portfolio, verificar número, y configurar pago, todo por su cuenta (aunque el Embedded Signup simplifica mucho el setup técnico)

**Plan de contingencia:** si Meta rechaza tu verificación o App Review después de múltiples intentos, o si el modelo sin BSP genera demasiada fricción con las clínicas, podés pivotear a un **modelo híbrido con un BSP como 360dialog o Infobip** que centralice billing mientras vos mantenés el control de la tecnología. Esta es la opción "Multi-Partner Solution" que Meta ofrece — tu app se conecta al Solution Partner para billing, pero vos seguís siendo el Tech Provider.

---

## Roadmap ejecutivo: de cero a primer mensaje en 10 pasos

El orden óptimo de ejecución, considerando que muchos pasos pueden hacerse en paralelo:

**Semana 1-2** (en paralelo): iniciar constitución de SAS con abogado en Paraná + crear sitio web de AlthemGroup con privacy policy + Terms of Service + crear cuenta personal de Facebook + crear Meta Business Portfolio + registrarse como Meta Developer.

**Semana 2-3**: obtener CUIT de la SAS (o inscribirse en monotributo como puente) + verificar dominio en Meta + crear Meta App con producto WhatsApp + iniciar verificación de negocio en Meta con constancia de CUIT.

**Semana 3-5**: mientras esperás verificación de negocio, desarrollar: endpoint de webhooks, lógica de envío de mensajes, templates de recordatorio/confirmación de turno, integración básica del chatbot de IA. Usar el WABA y número de prueba que Meta provee gratuitamente.

**Semana 4-6**: con verificación de negocio aprobada, grabar los dos videos de App Review y enviar solicitud de Advanced Access.

**Semana 5-8**: mientras esperás App Review, integrar Embedded Signup en tu frontend Next.js. Con App Review aprobado, completar Access Verification.

**Semana 7-10**: tech provider aprobado → testear flujo completo end-to-end con una clínica piloto → primer mensaje real a un paciente.

Este es un camino desafiante pero absolutamente realizable para un developer de 18 años con las habilidades técnicas correctas. La ventaja competitiva de ser Tech Provider directo es que controlás toda la experiencia del usuario, no dependés de intermediarios que pueden cambiar precios o condiciones, y tu SaaS queda posicionado como plataforma independiente — exactamente lo que las clínicas necesitan.