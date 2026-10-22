# Guía Operativa del Workflow n8n con AI Agent y DeepSeek

Esta guía documenta la instalación, configuración, ejecución y diagnóstico del workflow de automatización e inteligencia artificial para la **Mesa de Ayuda con SLA e Historial**, verificado para **n8n v2.38.6**.

Archivos de workflow sincronizados en el repositorio:
- `n8n/workflows/mesa-ayuda-ai-agent.json` (plantilla principal para importación)
- `n8n/workflows/ticket-ai-agent-workflow.json` (plantilla idéntica de respaldo)

---

## 1. Arquitectura y Manejo de Errores

El flujo implementa un pipeline de triaje asistido por IA con separación física entre la salida normal y la salida de error del modelo mediante `onError: continueErrorOutput`:

```
                       [Webhook Inbound]
                    (POST mesa-ayuda/analizar-ticket)
                               │
                               ▼
                 [Normalizar y Validar Entrada]
                               │
                ┌──────────────┴──────────────┐
                ▼ [Válido]                    ▼ [Inválido]
       [AI Agent (DeepSeek)]        [Formatear Error 400]
      (onError: continueErrorOutput)          │
       │ (Modelo: deepseek-flash)             ▼
       │                            [Respond 400 - Entrada Inválida]
       │                             (HTTP 400, { ok: false, ... })
       ├──────────────────────────────────────────┐
       ▼ [Éxito: main 0]                          ▼ [Error Ejecución: main 1]
[Validar y Normalizar Resultado]           [Formatear Error Modelo]
       │                                          │
   ┌───┴────────────────────────┐                 ▼
   ▼ [Salida Válida]            ▼ [Salida Inválida] [Respond 500 - Error IA]
[Respond 200 - Éxito]    [Respond 500 - Error IA]   (HTTP 500, { ok: false, ... })
(HTTP 200, { ok: true }) (HTTP 500, { ok: false })
```

### Principios Clave del Diseño
1. **Separación de Salidas del AI Agent:** La bifurcación `onError: continueErrorOutput` canaliza fallos de ejecución (credenciales inválidas, cuota agotada, timeouts de red) directamente a `main[1]`, impidiendo que el webhook quede colgado o que el error se procese erróneamente como texto válido.
2. **Respuestas JSON Nativas (`firstIncomingItem`):** Todos los nodos `Respond to Webhook` utilizan `respondWith: "firstIncomingItem"`. Esto garantiza que el payload emitido hacia el cliente HTTP sea un objeto JSON real y previene la doble serialización (`"\"{\\\"ok\\\":...}\""`).
3. **Códigos de Estado HTTP Explícitos:**
   - **HTTP 200:** Recomendación válida y aprobada por los validadores de dominio.
   - **HTTP 400:** Petición con campos obligatorios ausentes o insuficientes (`titulo` < 3 chars, `descripcion` < 5 chars).
   - **HTTP 500:** Fallos de conectividad con DeepSeek o generación de áreas/prioridades no admitidas.
4. **Catálogo Estricto de Dominio:**
   - **Prioridades:** `alta`, `media`, `baja`.
   - **Áreas:** `Soporte Técnico`, `Facturación`, `Infraestructura`.
5. **Inmutabilidad:** El workflow es estrictamente analítico (solo lectura). No realiza inserciones ni modificaciones sobre la base de datos SQLite.

---

## 2. Compatibilidad Técnica con n8n v2.38.6

Todos los nodos, versiones y conexiones del workflow han sido verificados contra el motor oficial de n8n v2.38.6:

| Nodo | Tipo de Nodo | Type Version | Función en el Flujo |
| :--- | :--- | :---: | :--- |
| **Webhook Inbound** | `n8n-nodes-base.webhook` | `2` | Recepción de peticiones POST en `/mesa-ayuda/analizar-ticket` con `responseMode: "responseNode"`. |
| **Normalizar y Validar Entrada** | `n8n-nodes-base.code` | `2` | Saneamiento de cadenas y validación de `titulo` y `descripcion`. |
| **IF Datos Válidos** | `n8n-nodes-base.if` | `2.2` | Bifurcación condicional booleana según `$json.isValid`. |
| **Formatear Error 400** | `n8n-nodes-base.code` | `2` | Generación del contrato `{ ok: false, data: null, error: ... }` para HTTP 400. |
| **Respond 400 - Entrada Inválida** | `n8n-nodes-base.respondToWebhook` | `1.1` | Emisión de respuesta HTTP 400 con `responseCode: 400`. |
| **AI Agent (DeepSeek)** | `@n8n/n8n-nodes-langchain.agent` | `1.6` | Orquestación LangChain con prompt estructurado y salida de error `continueErrorOutput`. |
| **DeepSeek Chat Model (OpenAI Compatible)** | `@n8n/n8n-nodes-langchain.lmChatOpenAi` | `1` | Conector al modelo `deepseek-flash` con temperatura `0.2` vía `https://api.deepseek.com`. |
| **Formatear Error Modelo** | `n8n-nodes-base.code` | `2` | Captura de errores del modelo desde `main[1]` y formateo de error HTTP 500. |
| **Validar y Normalizar Resultado** | `n8n-nodes-base.code` | `2` | Limpieza de markdown (````json...````) y validación de catálogo contra áreas y prioridades oficiales. |
| **IF Salida Válida** | `n8n-nodes-base.if` | `2.2` | Bifurcación condicional booleana según `$json.isValidOutput`. |
| **Respond 200 - Éxito** | `n8n-nodes-base.respondToWebhook` | `1.1` | Emisión de respuesta HTTP 200 con `{ ok: true, data: {...}, error: null }`. |
| **Respond 500 - Error IA** | `n8n-nodes-base.respondToWebhook` | `1.1` | Emisión de respuesta HTTP 500 para fallos del modelo o salidas fuera de catálogo. |

**Seguridad y Portabilidad:** El archivo exportado **no contiene credenciales reales ni claves API**. Utiliza la referencia simbólica `"id": "DEEPSEEK_CREDENTIAL_ID"`, lo que permite importar el workflow en cualquier instalación sin riesgo de filtración.

---

## 3. URLs del Webhook y Comportamiento de CORS

### URLs del Endpoint
- **Test URL (Pruebas manuales en editor):**
  ```
  http://localhost:5678/webhook-test/mesa-ayuda/analizar-ticket
  ```
  *Uso:* Solo funciona mientras n8n tenga el botón **"Listen for test event"** activo en el nodo Webhook Inbound.
- **Production URL (Uso en vivo con React):**
  ```
  http://localhost:5678/webhook/mesa-ayuda/analizar-ticket
  ```
  *Uso:* Se utiliza cuando el workflow está en estado **Active** (interruptor en ON). Coincide con la configuración de `VITE_N8N_WEBHOOK_URL` en `frontend/.env`.

### Comportamiento de CORS en n8n v2.38.6
En n8n v2.38.6, el servicio `webhook-request-handler.js` incluye soporte nativo para CORS (`supportsCORS: true`):
1. **Preflight OPTIONS:** Cuando el navegador (originado en `http://localhost:5173`) envía una solicitud preliminar `OPTIONS` con cabeceras `Content-Type, Accept`, el servidor de webhooks de n8n responde automáticamente con código `204 No Content`, configurando:
   - `Access-Control-Allow-Origin: http://localhost:5173` (refleja dinámicamente el origen de la petición).
   - `Access-Control-Allow-Methods: OPTIONS, POST`.
   - `Access-Control-Allow-Headers: Content-Type, Accept`.
   - `Access-Control-Max-Age: 300`.
2. **Petición Principal POST:** Al recibir la petición `POST`, n8n adjunta la cabecera `Access-Control-Allow-Origin: http://localhost:5173`, permitiendo la lectura de la respuesta en la aplicación React sin errores de bloqueo en la consola del navegador.

---

## 4. Instrucciones para Importación Manual en n8n

Siga estos pasos para configurar el workflow en su instalación local de n8n v2.38.6:

1. **Abrir n8n en el navegador:**
   - Asegúrese de que n8n esté ejecutándose (`n8n start` en su terminal) y abra `http://localhost:5678`.
2. **Crear o preparar un nuevo workflow:**
   - En el menú lateral izquierdo, pulse **Workflows** &rarr; **Add Workflow** (o utilice un lienzo vacío para no sobrescribir ningún workflow existente).
3. **Importar el archivo JSON:**
   - En la esquina superior derecha del lienzo, haga clic en el menú de tres puntos (**...**) y seleccione **Import from File**.
   - Seleccione el archivo:
     `n8n/workflows/mesa-ayuda-ai-agent.json`
4. **Revisar los nodos y conexiones:**
   - Confirme que los 12 nodos aparezcan en el lienzo y que las conexiones coincidan con el diagrama arquitectónico.
   - Preste especial atención a que el nodo `DeepSeek Chat Model (OpenAI Compatible)` esté conectado a la entrada inferior (`ai_languageModel`) del nodo `AI Agent (DeepSeek)`.
5. **Configurar la credencial de DeepSeek:**
   - En el menú lateral izquierdo, vaya a **Credentials** &rarr; **Add Credential**.
   - Busque y seleccione **OpenAI API** (DeepSeek utiliza una API 100% compatible con la especificación de OpenAI).
   - Configure:
     - **Credential Name:** `DeepSeek API (OpenAI Compatible)`
     - **API Key:** Su clave secreta personal de DeepSeek (`sk-...`).
   - Pulse **Save**.
6. **Asignar la credencial y verificar parámetros del modelo:**
   - Vuelva al workflow y haga doble clic en el nodo **DeepSeek Chat Model (OpenAI Compatible)**.
   - En el campo **Credential to connect with**, seleccione la credencial creada (`DeepSeek API (OpenAI Compatible)`).
   - Verifique los parámetros:
     - **Model:** `deepseek-flash` (o `deepseek-chat` si su cuenta no dispone de acceso al endpoint flash).
     - **Base URL:** `https://api.deepseek.com`
     - **Temperature:** `0.2`
     - **Max Tokens:** `1000`
   - Guarde los cambios del nodo.
7. **Ejecutar prueba con Test URL:**
   - Haga doble clic en el nodo **Webhook Inbound** y presione el botón **Listen for test event**.
   - Envíe la petición de prueba con PowerShell (ver Caso 1 a continuación).
   - Verifique que el flujo se ejecute exitosamente, que los nodos se marquen en verde y que devuelva HTTP 200 con el JSON esperado.
8. **Activar el workflow para producción:**
   - En la parte superior derecha de la pantalla, active el interruptor **Active** (debe cambiar a color verde).
   - Pulse **Save** para guardar la versión activa.
9. **Probar la Production URL:**
   - Envíe una petición a `http://localhost:5678/webhook/mesa-ayuda/analizar-ticket` y verifique que responda de forma autónoma sin necesidad de presionar "Listen".

---

## 5. Datos de Prueba y Procedimiento de Diagnóstico

### Caso 1: Solicitud Válida de Triaje (HTTP 200)

**Payload de entrada:**
```json
{
  "titulo": "Caída del servidor de pruebas",
  "descripcion": "El servidor no responde y necesitamos determinar la prioridad y el área responsable.",
  "clienteNombre": "Cliente de prueba",
  "empresa": "Empresa de prueba",
  "area": "Infraestructura",
  "prioridad": "alta"
}
```

**Ejecución en PowerShell:**
```powershell
$body = @{
  titulo = "Caída del servidor de pruebas"
  descripcion = "El servidor no responde y necesitamos determinar la prioridad y el área responsable."
  clienteNombre = "Cliente de prueba"
  empresa = "Empresa de prueba"
  area = "Infraestructura"
  prioridad = "alta"
} | ConvertTo-Json

Invoke-RestMethod -Method Post `
  -Uri "http://localhost:5678/webhook/mesa-ayuda/analizar-ticket" `
  -ContentType "application/json" `
  -Body $body
```

**Respuesta esperada (HTTP 200):**
```json
{
  "ok": true,
  "data": {
    "prioridadSugerida": "alta",
    "areaSugerida": "Infraestructura",
    "respuestaInicial": "Estimado Cliente de prueba, hemos recibido su reporte sobre la caída del servidor de pruebas...",
    "justificacion": "Se clasifica con prioridad alta debido a la indisponibilidad total del servidor de pruebas, asignándose al área de Infraestructura.",
    "requiereRevisionHumana": true
  },
  "error": null
}
```

---

### Caso 2: Rechazo por Entrada Incompleta (HTTP 400)

**Payload con omisión de título:**
```json
{
  "descripcion": "El servidor no responde pero omitimos el título a propósito para validar el error 400."
}
```

**Ejecución en PowerShell con captura de error:**
```powershell
$bodyInvalido = @{
  descripcion = "El servidor no responde pero omitimos el título a propósito para validar el error 400."
} | ConvertTo-Json

try {
  Invoke-RestMethod -Method Post `
    -Uri "http://localhost:5678/webhook/mesa-ayuda/analizar-ticket" `
    -ContentType "application/json" `
    -Body $bodyInvalido
} catch {
  $stream = $_.Exception.Response.GetResponseStream()
  $reader = New-Object System.IO.StreamReader($stream)
  Write-Host "HTTP Status:" $_.Exception.Response.StatusCode
  Write-Host "Cuerpo de error:" $reader.ReadToEnd()
}
```

**Respuesta esperada (HTTP 400):**
```json
{
  "ok": false,
  "data": null,
  "error": "El campo 'titulo' es obligatorio y no puede estar vacío."
}
```

---

### Caso 3: Prueba Segura de la Rama de Error del Modelo (HTTP 500)

Para verificar que la rama `onError: continueErrorOutput` atrapa fallos sin romper su credencial principal ni arriesgar la configuración en producción:

1. **Procedimiento Seguro Recomendado:**
   - Duplique el nodo `DeepSeek Chat Model (OpenAI Compatible)` en un workflow de prueba (o cambie temporalmente su Base URL).
   - En el nodo de chat del modelo, modifique temporalmente la **Base URL** a una URL inalcanzable:
     `https://api.deepseek.invalid`
   - O cree una credencial secundaria temporal llamada `DeepSeek Invalida` con la clave `sk-test-invalida-0000000000`.
   - Envíe la petición válida del Caso 1.
2. **Resultado esperado:**
   - El nodo AI Agent detecta el error de red o autenticación.
   - En lugar de abortar la ejecución o dejar la petición colgada, desvía el flujo por la salida `main[1]`.
   - El nodo `Formatear Error Modelo` captura el error.
   - El nodo `Respond 500 - Error IA` devuelve HTTP 500 con formato limpio:
     ```json
     {
       "ok": false,
       "data": null,
       "error": "Fallo en el servicio de DeepSeek: Error de conexión, tiempo de espera o credencial no configurada."
     }
     ```
3. **Restauración:**
   - Vuelva a asociar su credencial válida y la URL base `https://api.deepseek.com`.

---

## 6. Verificación Automatizada Local de la Suite de Pruebas

Para validar la sintaxis JSON, el grafo de conexiones, las bifurcaciones condicionales, la normalización de datos y la inmutabilidad de SQLite sin requerir llamadas reales a la API de DeepSeek, ejecute:

```powershell
node --test n8n/tests/workflow-validation.test.js
```

**Resultados esperados:** 13 pruebas aprobadas (100% pass), confirmando paridad total entre plantillas, compatibilidad con el motor oficial de n8n v2.x e inmutabilidad estricta sobre `mesa.db`.
