# Guía Operativa del Workflow n8n con AI Agent y DeepSeek

Esta guía documenta la instalación, configuración, ejecución y diagnóstico del workflow de automatización e inteligencia artificial para la **Mesa de Ayuda con SLA e Historial**.

Archivos de workflow sincronizados:
- `n8n/workflows/mesa-ayuda-ai-agent.json` (plantilla principal)
- `n8n/workflows/ticket-ai-agent-workflow.json` (plantilla secundaria consistente)

---

## 1. Arquitectura y Manejo de Errores

El flujo implementa un pipeline de triaje asistido por IA con separación estricta entre la salida normal y la salida de error de ejecución del modelo mediante `onError: continueErrorOutput`:

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

## 2. Configuración Unificada de DeepSeek

El modelo predeterminado es **`deepseek-flash`**:

- **Tipo de Conexión:** OpenAI Chat Model (`@n8n/n8n-nodes-langchain.lmChatOpenAi`).
- **Model Name:** `deepseek-flash`
- **Base URL:** `https://api.deepseek.com`
- **Temperature:** `0.2`
- **Max Tokens:** `1000`
- **Credential:** Configurada exclusivamente en la interfaz de n8n bajo el tipo **OpenAI API** con el nombre `DeepSeek API (OpenAI Compatible)`. **No se almacenan API keys en archivos versionados.**

---

## 3. Guía Paso a Paso para Importación y Ejecución en n8n Local

### Paso 1: Iniciar n8n
Abra una terminal y ejecute:
```powershell
n8n start
```
Acceda a la interfaz web en `http://localhost:5678`.

### Paso 2: Crear la Credencial de DeepSeek
1. En n8n, vaya a **Credentials** &rarr; **Add Credential**.
2. Seleccione **OpenAI API**.
3. Ingrese:
   - **Credential Name:** `DeepSeek API (OpenAI Compatible)`
   - **API Key:** Su clave secreta personal de DeepSeek (generada en platform.deepseek.com).
4. Guarde la credencial.

### Paso 3: Importar el Workflow
1. En **Workflows**, haga clic en **Import from File**.
2. Seleccione `n8n/workflows/mesa-ayuda-ai-agent.json`.
3. Verifique que el nodo `DeepSeek Chat Model (OpenAI Compatible)` tenga asociada la credencial creada.

---

## 4. Pruebas: Test URL vs Production URL

| Entorno | URL del Webhook | Requisito de Activación |
| :--- | :--- | :--- |
| **Prueba (Test)** | `http://localhost:5678/webhook-test/mesa-ayuda/analizar-ticket` | Presionar **"Listen for test event"** en el nodo Webhook antes de enviar la petición. |
| **Producción** | `http://localhost:5678/webhook/mesa-ayuda/analizar-ticket` | Activar el interruptor **Active** (ON) en la barra superior del workflow. |

### Prueba Manual con PowerShell

#### Caso 1: Entrada Válida (Responde HTTP 200)
```powershell
Invoke-RestMethod -Method Post `
  -Uri "http://localhost:5678/webhook-test/mesa-ayuda/analizar-ticket" `
  -ContentType "application/json" `
  -Body (@{
    titulo = "Error al procesar pago en pasarela Visa"
    descripcion = "Los clientes reciben error 502 al intentar confirmar su compra con tarjetas Visa."
    clienteNombre = "Acme Corp Contact"
    empresa = "Acme Corporation"
    area = "Soporte Técnico"
    prioridad = "alta"
  } | ConvertTo-Json)
```
**Respuesta esperada (HTTP 200):**
```json
{
  "ok": true,
  "data": {
    "prioridadSugerida": "alta",
    "areaSugerida": "Soporte Técnico",
    "respuestaInicial": "Estimado Acme Corp Contact, gracias por contactarnos...",
    "justificacion": "Se clasifica con prioridad alta debido a la falla en la pasarela de pagos que impide transacciones comerciales.",
    "requiereRevisionHumana": true
  },
  "error": null
}
```

#### Caso 2: Falta de Título (Responde HTTP 400)
```powershell
Invoke-RestMethod -Method Post `
  -Uri "http://localhost:5678/webhook-test/mesa-ayuda/analizar-ticket" `
  -ContentType "application/json" `
  -Body (@{
    descripcion = "Descripción sin título"
  } | ConvertTo-Json)
```
**Respuesta esperada (HTTP 400):**
```json
{
  "ok": false,
  "data": null,
  "error": "El campo 'titulo' es obligatorio y no puede estar vacío."
}
```

#### Caso 3: Error de Inferencia o Credencial Inválida (Responde HTTP 500)
Si la credencial de DeepSeek no tiene saldo o es incorrecta, la rama `onError: continueErrorOutput` atrapa el fallo y devuelve:
```json
{
  "ok": false,
  "data": null,
  "error": "Fallo en el servicio de DeepSeek: Invalid API Key or Quota Exceeded..."
}
```

---

## 5. Verificación Automatizada Local

Para validar la sintaxis JSON, el grafo de conexiones, las bifurcaciones condicionales, la normalización de datos y la inmutabilidad de SQLite sin requerir llamadas reales a la API de DeepSeek, ejecute:

```powershell
node --test n8n/tests/workflow-validation.test.js
```
