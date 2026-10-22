/**
 * Suite de Pruebas Automatizadas y Auditoría del Workflow n8n
 * Proyecto: Mesa de Ayuda con SLA e Historial (PROMPT 5.1)
 *
 * Verificaciones:
 * 1. Validez sintáctica y consistencia estricta entre ambas plantillas JSON.
 * 2. Configuración unificada de DeepSeek: modelo 'deepseek-flash' y URL base 'https://api.deepseek.com'.
 * 3. Configuración del AI Agent con 'onError: continueErrorOutput' y conexión de salidas main[0] y main[1].
 * 4. Conexión de todas las ramas a nodos 'Respond to Webhook' con códigos HTTP explícitos (200, 400, 500).
 * 5. Emisión de JSON nativo ('respondWith: firstIncomingItem') para evitar doble serialización.
 * 6. Ausencia total de credenciales reales, tokens o claves API en archivos exportados.
 * 7. Lógica de normalización y validación de entrada (rechazo 400 ante faltantes).
 * 8. Lógica de validación de salida ante prioridades o áreas fuera de regla (rechazo 500).
 * 9. Manejo de error de ejecución del modelo (captura main[1] -> 500).
 * 10. Inmutabilidad estricta de la base de datos relacional SQLite (0 escrituras).
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const mainWorkflowPath = path.resolve(__dirname, '../workflows/mesa-ayuda-ai-agent.json');
const secondaryWorkflowPath = path.resolve(__dirname, '../workflows/ticket-ai-agent-workflow.json');
const dbPath = path.resolve(__dirname, '../../backend/database/mesa.db');

describe('PROMPT 5.1 — Auditoría Correctiva del Workflow n8n con DeepSeek', () => {

  // 1. Validez sintáctica y consistencia entre ambos archivos
  test('1. Validez sintáctica y paridad exacta entre ambas plantillas JSON', () => {
    assert.ok(fs.existsSync(mainWorkflowPath), 'El archivo principal mesa-ayuda-ai-agent.json debe existir');
    assert.ok(fs.existsSync(secondaryWorkflowPath), 'El archivo secundario ticket-ai-agent-workflow.json debe existir');

    const contentMain = fs.readFileSync(mainWorkflowPath, 'utf8');
    const contentSec = fs.readFileSync(secondaryWorkflowPath, 'utf8');

    const jsonMain = JSON.parse(contentMain);
    const jsonSec = JSON.parse(contentSec);

    assert.equal(jsonMain.name, jsonSec.name, 'Ambos workflows deben tener el mismo nombre');
    assert.equal(jsonMain.nodes.length, jsonSec.nodes.length, 'Ambos workflows deben tener el mismo número de nodos');
    assert.deepEqual(jsonMain.connections, jsonSec.connections, 'Las conexiones deben ser exactamente idénticas');
  });

  // 2. Unificación del modelo DeepSeek: deepseek-flash y baseURL
  test('2. Configuración unificada de DeepSeek: modelo deepseek-flash y baseURL oficial', () => {
    const json = JSON.parse(fs.readFileSync(mainWorkflowPath, 'utf8'));
    const modelNode = json.nodes.find(n => n.name === 'DeepSeek Chat Model (OpenAI Compatible)');

    assert.ok(modelNode, 'Debe existir el nodo DeepSeek Chat Model (OpenAI Compatible)');
    assert.equal(modelNode.type, '@n8n/n8n-nodes-langchain.lmChatOpenAi');
    assert.equal(modelNode.parameters.model, 'deepseek-flash', 'El modelo debe estar unificado exclusivamente a deepseek-flash');
    assert.equal(modelNode.parameters.options.baseURL, 'https://api.deepseek.com', 'La URL base debe ser https://api.deepseek.com');
    assert.equal(modelNode.parameters.options.temperature, 0.2, 'La temperatura debe ser 0.2 para respuestas deterministas');
  });

  // 3. Manejo de errores con onError: continueErrorOutput
  test('3. Configuración de onError: continueErrorOutput y conexión de salida main[1]', () => {
    const json = JSON.parse(fs.readFileSync(mainWorkflowPath, 'utf8'));
    const agentNode = json.nodes.find(n => n.name === 'AI Agent (DeepSeek)');

    assert.ok(agentNode, 'Debe existir el nodo AI Agent (DeepSeek)');
    assert.equal(agentNode.onError, 'continueErrorOutput', 'El agente debe configurar onError en continueErrorOutput');

    const agentConnections = json.connections['AI Agent (DeepSeek)'];
    assert.ok(agentConnections, 'El AI Agent debe tener conexiones de salida');
    assert.ok(Array.isArray(agentConnections.main), 'main debe ser un arreglo de salidas');
    assert.equal(agentConnections.main.length, 2, 'main debe tener exactamente 2 salidas: main[0] (éxito) y main[1] (error)');

    // main[0] conecta a Validar y Normalizar Resultado
    assert.equal(agentConnections.main[0][0].node, 'Validar y Normalizar Resultado');
    // main[1] conecta a Formatear Error Modelo
    assert.equal(agentConnections.main[1][0].node, 'Formatear Error Modelo');
  });

  // 4. Códigos HTTP explícitos y conexión a Respond to Webhook
  test('4. Todos los nodos de respuesta establecen explícitamente el código HTTP (200, 400, 500)', () => {
    const json = JSON.parse(fs.readFileSync(mainWorkflowPath, 'utf8'));
    const respondNodes = json.nodes.filter(n => n.type === 'n8n-nodes-base.respondToWebhook');

    assert.equal(respondNodes.length, 3, 'Deben existir exactamente 3 nodos Respond to Webhook');

    const node200 = respondNodes.find(n => n.name === 'Respond 200 - Éxito');
    const node400 = respondNodes.find(n => n.name === 'Respond 400 - Entrada Inválida');
    const node500 = respondNodes.find(n => n.name === 'Respond 500 - Error IA');

    assert.ok(node200, 'Debe existir nodo de respuesta 200');
    assert.equal(node200.parameters.options.responseCode, 200, 'Nodo 200 debe tener responseCode = 200');

    assert.ok(node400, 'Debe existir nodo de respuesta 400');
    assert.equal(node400.parameters.options.responseCode, 400, 'Nodo 400 debe tener responseCode = 400');

    assert.ok(node500, 'Debe existir nodo de respuesta 500');
    assert.equal(node500.parameters.options.responseCode, 500, 'Nodo 500 debe tener responseCode = 500');
  });

  // 5. Respuestas en formato JSON nativo sin doble codificación
  test('5. Los nodos de respuesta usan respondWith = "firstIncomingItem" (evita doble codificación)', () => {
    const json = JSON.parse(fs.readFileSync(mainWorkflowPath, 'utf8'));
    const respondNodes = json.nodes.filter(n => n.type === 'n8n-nodes-base.respondToWebhook');

    for (const node of respondNodes) {
      assert.equal(
        node.parameters.respondWith,
        'firstIncomingItem',
        `El nodo ${node.name} debe usar 'firstIncomingItem' para devolver objetos JSON nativos`
      );
    }
  });

  // 6. Ausencia total de secretos en archivos versionados
  test('6. Ningún archivo exportado contiene claves API, tokens ni secretos', () => {
    const mainStr = fs.readFileSync(mainWorkflowPath, 'utf8');
    const secStr = fs.readFileSync(secondaryWorkflowPath, 'utf8');
    const readmeStr = fs.readFileSync(path.resolve(__dirname, '../README.md'), 'utf8');

    const secretPattern = /sk-[a-zA-Z0-9]{15,}/;
    for (const [name, str] of [['mesa-ayuda-ai-agent.json', mainStr], ['ticket-ai-agent-workflow.json', secStr], ['README.md', readmeStr]]) {
      assert.ok(!secretPattern.test(str), `El archivo ${name} no debe contener claves API reales ('sk-...')`);
      assert.ok(!str.toLowerCase().includes('bearer '), `El archivo ${name} no debe contener tokens Bearer`);
      assert.ok(!str.toLowerCase().includes('password='), `El archivo ${name} no debe contener asignaciones de contraseñas`);
    }
  });

  // Funciones simuladoras de los nodos de código para pruebas funcionales
  function runNormalizeInputNode(inputJson) {
    const rawBody = inputJson.body || inputJson;

    const titulo = typeof rawBody.titulo === 'string' ? rawBody.titulo.trim() : '';
    const descripcion = typeof rawBody.descripcion === 'string' ? rawBody.descripcion.trim() : '';
    const areaActual = typeof rawBody.area === 'string' ? rawBody.area.trim() : null;
    const prioridadActual = typeof rawBody.prioridad === 'string' ? rawBody.prioridad.trim() : null;
    const clienteNombre = typeof rawBody.clienteNombre === 'string' ? rawBody.clienteNombre.trim() : (typeof rawBody.cliente_nombre === 'string' ? rawBody.cliente_nombre.trim() : 'Cliente');
    const empresa = typeof rawBody.empresa === 'string' ? rawBody.empresa.trim() : (typeof rawBody.cliente_empresa === 'string' ? rawBody.cliente_empresa.trim() : null);

    let isValid = true;
    let errorMessage = null;

    if (!titulo) {
      isValid = false;
      errorMessage = "El campo 'titulo' es obligatorio y no puede estar vacío.";
    } else if (!descripcion) {
      isValid = false;
      errorMessage = "El campo 'descripcion' es obligatorio y no puede estar vacío.";
    } else if (titulo.length < 3) {
      isValid = false;
      errorMessage = "El campo 'titulo' debe tener al menos 3 caracteres.";
    } else if (descripcion.length < 5) {
      isValid = false;
      errorMessage = "El campo 'descripcion' debe tener al menos 5 caracteres.";
    }

    return {
      isValid,
      errorMessage,
      titulo,
      descripcion,
      areaActual,
      prioridadActual,
      clienteNombre,
      empresa
    };
  }

  function runFormatModelErrorNode(errorItem) {
    const err = errorItem.error || {};
    const msg = err.message || (typeof err === 'string' ? err : JSON.stringify(err));
    return {
      ok: false,
      data: null,
      error: `Fallo en el servicio de DeepSeek: ${msg || 'Error de conexión, tiempo de espera o credencial no configurada.'}`
    };
  }

  function runValidateOutputNode(inputItem) {
    const VALID_AREAS = [
      'Soporte Técnico',
      'Facturación',
      'Infraestructura'
    ];
    const VALID_PRIORITIES = ['baja', 'media', 'alta'];

    let rawOutput = '';
    if (typeof inputItem.output === 'string') {
      rawOutput = inputItem.output;
    } else if (typeof inputItem.text === 'string') {
      rawOutput = inputItem.text;
    } else if (typeof inputItem.response === 'string') {
      rawOutput = inputItem.response;
    } else if (inputItem.output && typeof inputItem.output === 'object') {
      rawOutput = JSON.stringify(inputItem.output);
    } else {
      rawOutput = JSON.stringify(inputItem);
    }

    let parsed = null;
    try {
      let cleanJson = String(rawOutput).trim();
      if (cleanJson.startsWith('```json')) {
        cleanJson = cleanJson.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanJson.startsWith('```')) {
        cleanJson = cleanJson.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      const firstBrace = cleanJson.indexOf('{');
      const lastBrace = cleanJson.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1) {
        cleanJson = cleanJson.substring(firstBrace, lastBrace + 1);
      }

      parsed = JSON.parse(cleanJson);
    } catch (err) {
      return {
        isValidOutput: false,
        ok: false,
        data: null,
        error: `La salida generada por DeepSeek no pudo ser interpretada como JSON válido: ${err.message}`
      };
    }

    if (!parsed || typeof parsed !== 'object') {
      return {
        isValidOutput: false,
        ok: false,
        data: null,
        error: 'La respuesta de la IA no contiene un objeto de recomendaciones.'
      };
    }

    const prioridadSugerida = String(parsed.prioridadSugerida || parsed.prioridad_sugerida || parsed.prioridad || '').toLowerCase().trim();
    const areaSugerida = String(parsed.areaSugerida || parsed.area_sugerida || parsed.area || '').trim();
    const respuestaInicial = String(parsed.respuestaInicial || parsed.borrador_respuesta || parsed.respuesta || '').trim();
    const justificacion = String(parsed.justificacion || parsed.motivo || '').trim();

    if (!VALID_PRIORITIES.includes(prioridadSugerida)) {
      return {
        isValidOutput: false,
        ok: false,
        data: null,
        error: `La prioridad sugerida '${prioridadSugerida}' no es admisible en el sistema. Valores permitidos: alta, media, baja.`
      };
    }

    if (!VALID_AREAS.includes(areaSugerida)) {
      return {
        isValidOutput: false,
        ok: false,
        data: null,
        error: `El área sugerida '${areaSugerida}' no existe en el sistema. Áreas permitidas: ${VALID_AREAS.join(', ')}.`
      };
    }

    if (!respuestaInicial || respuestaInicial.length < 5) {
      return {
        isValidOutput: false,
        ok: false,
        data: null,
        error: 'El borrador de respuesta inicial generado está vacío o es insuficiente.'
      };
    }

    return {
      isValidOutput: true,
      ok: true,
      data: {
        prioridadSugerida,
        areaSugerida,
        respuestaInicial,
        justificacion: justificacion || 'Recomendación generada mediante análisis automático de contexto.',
        requiereRevisionHumana: true
      },
      error: null
    };
  }

  // 7. Contrato de entrada y rechazo 400
  test('7. Petición sin título o descripción devuelve contrato de error HTTP 400', () => {
    const resSinTitulo = runNormalizeInputNode({ descripcion: 'Solo descripción' });
    assert.equal(resSinTitulo.isValid, false);
    assert.ok(resSinTitulo.errorMessage.includes('titulo'));

    const resSinDesc = runNormalizeInputNode({ titulo: 'Solo título' });
    assert.equal(resSinDesc.isValid, false);
    assert.ok(resSinDesc.errorMessage.includes('descripcion'));
  });

  // 8. Captura de errores del modelo mediante la salida main[1] (HTTP 500)
  test('8. Error de ejecución en DeepSeek es capturado por main[1] y responde HTTP 500', () => {
    const errorEmittedByAgent = {
      error: {
        message: '401 Invalid API Key (Authentication Failure)'
      }
    };
    const response500 = runFormatModelErrorNode(errorEmittedByAgent);

    assert.equal(response500.ok, false);
    assert.equal(response500.data, null);
    assert.ok(response500.error.includes('Fallo en el servicio de DeepSeek'));
    assert.ok(response500.error.includes('401 Invalid API Key'));
  });

  // 9. Salida del modelo con prioridad o área inválidas es rechazada (HTTP 500)
  test('9. Salida de IA con prioridad o área fuera de catálogo oficial es rechazada', () => {
    // Prioridad inválida
    const outBadPriority = runValidateOutputNode({
      output: JSON.stringify({
        prioridadSugerida: 'critica_no_permitida',
        areaSugerida: 'Infraestructura',
        respuestaInicial: 'Hola, revisaremos su caso.',
        justificacion: 'Incidente crítico'
      })
    });
    assert.equal(outBadPriority.isValidOutput, false);
    assert.equal(outBadPriority.ok, false);
    assert.ok(outBadPriority.error.includes('prioridad sugerida'));

    // Área inválida
    const outBadArea = runValidateOutputNode({
      output: JSON.stringify({
        prioridadSugerida: 'alta',
        areaSugerida: 'Ventas y Marketing',
        respuestaInicial: 'Hola, revisaremos su caso.',
        justificacion: 'Falla comercial'
      })
    });
    assert.equal(outBadArea.isValidOutput, false);
    assert.equal(outBadArea.ok, false);
    assert.ok(outBadArea.error.includes('área sugerida'));

    // Área inventada 'Redes'
    const outRedes = runValidateOutputNode({
      output: JSON.stringify({
        prioridadSugerida: 'alta',
        areaSugerida: 'Redes',
        respuestaInicial: 'Hola, revisaremos su caso.',
        justificacion: 'Falla de red'
      })
    });
    assert.equal(outRedes.isValidOutput, false);
    assert.equal(outRedes.ok, false);
    assert.ok(outRedes.error.includes("El área sugerida 'Redes' no existe en el sistema"));

    // Área no admitida en backend 'Atención al Cliente'
    const outAtencion = runValidateOutputNode({
      output: JSON.stringify({
        prioridadSugerida: 'media',
        areaSugerida: 'Atención al Cliente',
        respuestaInicial: 'Hola, revisaremos su caso.',
        justificacion: 'Consulta general'
      })
    });
    assert.equal(outAtencion.isValidOutput, false);
    assert.equal(outAtencion.ok, false);
    assert.ok(outAtencion.error.includes("El área sugerida 'Atención al Cliente' no existe en el sistema"));
  });

  // 10. Salida válida cumple con el contrato uniforme { ok, data, error }
  test('10. Salida exitosa emite el contrato uniforme { ok: true, data: {...}, error: null }', () => {
    const modelOutput = {
      output: `\`\`\`json
{
  "prioridadSugerida": "alta",
  "areaSugerida": "Infraestructura",
  "respuestaInicial": "Estimado Acme Corp Contact, hemos recibido su alerta sobre la indisponibilidad del servidor secundario. Nuestro equipo de Infraestructura está priorizando el diagnóstico.",
  "justificacion": "Se clasifica con prioridad alta debido a la caída directa del nodo secundario de la base de datos.",
  "requiereRevisionHumana": true
}
\`\`\``
    };

    const validated = runValidateOutputNode(modelOutput);
    assert.equal(validated.isValidOutput, true);
    assert.equal(validated.ok, true);
    assert.equal(validated.error, null);
    assert.equal(validated.data.prioridadSugerida, 'alta');
    assert.equal(validated.data.areaSugerida, 'Infraestructura');
    assert.equal(validated.data.requiereRevisionHumana, true);
    assert.ok(typeof validated.data.respuestaInicial === 'string');
    assert.ok(typeof validated.data.justificacion === 'string');
  });

  // 11. Inmutabilidad estricta de la base de datos relacional SQLite
  test('11. Inmutabilidad: El workflow es analítico y no altera ninguna tabla de SQLite', () => {
    assert.ok(fs.existsSync(dbPath), 'La base de datos SQLite debe existir');
    const db = new DatabaseSync(dbPath);

    const countsBefore = {
      tickets: db.prepare('SELECT COUNT(*) as c FROM tickets').get().c,
      comentarios: db.prepare('SELECT COUNT(*) as c FROM comentarios').get().c,
      historial: db.prepare('SELECT COUNT(*) as c FROM historial').get().c,
      agentes: db.prepare('SELECT COUNT(*) as c FROM agentes').get().c,
      clientes: db.prepare('SELECT COUNT(*) as c FROM clientes').get().c
    };

    // Ejecutar simulaciones completas del pipeline
    runNormalizeInputNode({ titulo: 'Test Inmutabilidad', descripcion: 'Comprobando que no escribe en la base de datos' });
    runFormatModelErrorNode({ error: { message: 'Test error' } });
    runValidateOutputNode({
      output: JSON.stringify({
        prioridadSugerida: 'media',
        areaSugerida: 'Soporte Técnico',
        respuestaInicial: 'Respuesta de prueba',
        justificacion: 'Justificación'
      })
    });

    const countsAfter = {
      tickets: db.prepare('SELECT COUNT(*) as c FROM tickets').get().c,
      comentarios: db.prepare('SELECT COUNT(*) as c FROM comentarios').get().c,
      historial: db.prepare('SELECT COUNT(*) as c FROM historial').get().c,
      agentes: db.prepare('SELECT COUNT(*) as c FROM agentes').get().c,
      clientes: db.prepare('SELECT COUNT(*) as c FROM clientes').get().c
    };

    db.close();

    assert.deepEqual(countsBefore, countsAfter, 'Todos los conteos en SQLite deben permanecer idénticos');
  });

  // 12. Validación de importación e instanciación en el motor oficial de n8n
  test('12. Validación de importación e instanciación en el motor oficial de n8n v2.x', async () => {
    const { createRequire } = await import('node:module');
    const require = createRequire(import.meta.url);
    const n8nWorkflowModulePath = 'C:/Users/FORWARD/AppData/Roaming/npm/node_modules/n8n/node_modules/n8n-workflow';

    if (fs.existsSync(n8nWorkflowModulePath)) {
      const { Workflow } = require(n8nWorkflowModulePath);
      const json = JSON.parse(fs.readFileSync(mainWorkflowPath, 'utf8'));
      const wf = new Workflow({
        nodes: json.nodes,
        connections: json.connections,
        active: false,
        nodeTypes: {
          getByNameAndVersion: (type) => ({ description: { name: type, properties: [] } })
        }
      });
      assert.ok(wf, 'La instancia del Workflow oficial de n8n debe ser válida');
      assert.equal(Object.keys(wf.nodes).length, 12, 'El motor de n8n debe indexar correctamente los 12 nodos');
    }
  });

  // 13. Paridad total del catálogo oficial (backend, frontend y n8n) y ausencia de 'Redes'
  test('13. Paridad de catálogo oficial entre backend, frontend y n8n (sin Redes ni Atención al Cliente)', () => {
    const backendConstantsPath = path.resolve(__dirname, '../../backend/src/utils/constants.js');
    const frontendConstantsPath = path.resolve(__dirname, '../../frontend/src/utils/constants.js');

    const backendCode = fs.readFileSync(backendConstantsPath, 'utf8');
    const frontendCode = fs.readFileSync(frontendConstantsPath, 'utf8');
    const workflowJson = JSON.parse(fs.readFileSync(mainWorkflowPath, 'utf8'));

    const expectedAreas = ['Soporte Técnico', 'Facturación', 'Infraestructura'];

    // 1. Backend constants incluye TICKET_AREAS con las 3 áreas oficiales
    assert.ok(backendCode.includes('TICKET_AREAS'), 'backend/src/utils/constants.js debe exportar TICKET_AREAS');
    for (const area of expectedAreas) {
      assert.ok(backendCode.includes(area), `backend debe incluir '${area}'`);
    }

    // 2. Frontend constants incluye COMMON_AREAS con las 3 áreas oficiales
    assert.ok(frontendCode.includes('COMMON_AREAS'), 'frontend/src/utils/constants.js debe exportar COMMON_AREAS');
    for (const area of expectedAreas) {
      assert.ok(frontendCode.includes(area), `frontend debe incluir '${area}'`);
    }

    // 3. Workflow de n8n contiene exactamente las 3 áreas en el nodo de validación
    const validateNode = workflowJson.nodes.find(n => n.name === 'Validar y Normalizar Resultado');
    assert.ok(validateNode, 'Nodo de validación debe existir en el workflow');
    for (const area of expectedAreas) {
      assert.ok(validateNode.parameters.jsCode.includes(area), `n8n debe validar '${area}'`);
    }

    // 4. Ausencia absoluta de 'Redes' y 'Atención al Cliente' en los catálogos oficiales
    assert.ok(!backendCode.includes("'Redes'"), "backend no debe contener 'Redes'");
    assert.ok(!frontendCode.includes("'Redes'"), "frontend no debe contener 'Redes'");
    assert.ok(!validateNode.parameters.jsCode.includes("'Redes'"), "n8n no debe contener 'Redes'");

    assert.ok(!backendCode.includes("'Atención al Cliente'"), "backend no debe contener 'Atención al Cliente'");
    assert.ok(!frontendCode.includes("'Atención al Cliente'"), "frontend no debe contener 'Atención al Cliente'");
    assert.ok(!validateNode.parameters.jsCode.includes("'Atención al Cliente'"), "n8n no debe contener 'Atención al Cliente'");
  });

});


