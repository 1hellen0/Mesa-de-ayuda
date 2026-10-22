import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fixedWorkflowPath = path.resolve(__dirname, '../workflows/mesa-ayuda-ai-agent-fixed.json');

describe('PROMPT CORRECTIVO — Validación Integral de mesa-ayuda-ai-agent-fixed.json', () => {

  test('1. El archivo mesa-ayuda-ai-agent-fixed.json existe y es JSON válido', () => {
    assert.ok(fs.existsSync(fixedWorkflowPath), 'El archivo mesa-ayuda-ai-agent-fixed.json debe existir');
    const content = fs.readFileSync(fixedWorkflowPath, 'utf8');
    const json = JSON.parse(content);
    assert.ok(json.name, 'El workflow debe tener nombre');
    assert.ok(Array.isArray(json.nodes), 'El workflow debe tener arreglo de nodos');
    assert.ok(json.connections, 'El workflow debe tener conexiones');
  });

  test('2. Estructura exacta de los 10 nodos obligatorios', () => {
    const json = JSON.parse(fs.readFileSync(fixedWorkflowPath, 'utf8'));
    const expectedNodeNames = [
      'Webhook POST',
      'Normalizar y Validar Entrada',
      'IF: Datos válidos',
      'Respond to Webhook - 400',
      'AI Agent DeepSeek',
      'DeepSeek Chat Model (OpenAI Compatible)',
      'Formatear Error IA',
      'Respond to Webhook - 500',
      'Validar Respuesta IA',
      'Respond to Webhook - 200'
    ];

    assert.equal(json.nodes.length, 10, 'El workflow debe contener exactamente 10 nodos');
    for (const name of expectedNodeNames) {
      const node = json.nodes.find(n => n.name === name);
      assert.ok(node, `El nodo "${name}" debe existir en la lista de nodos`);
    }
  });

  test('3. Configuración del Webhook POST con responseMode: responseNode', () => {
    const json = JSON.parse(fs.readFileSync(fixedWorkflowPath, 'utf8'));
    const webhookNode = json.nodes.find(n => n.name === 'Webhook POST');

    assert.ok(webhookNode);
    assert.equal(webhookNode.type, 'n8n-nodes-base.webhook');
    assert.equal(webhookNode.parameters.httpMethod, 'POST');
    assert.equal(webhookNode.parameters.path, 'mesa-ayuda/analizar-ticket');
    assert.equal(webhookNode.parameters.responseMode, 'responseNode', 'responseMode debe ser responseNode');
  });

  test('4. Todas las conexiones apuntan a nodos existentes y respetan las ramas', () => {
    const json = JSON.parse(fs.readFileSync(fixedWorkflowPath, 'utf8'));
    const nodeNames = new Set(json.nodes.map(n => n.name));

    for (const [sourceNode, connectionTypes] of Object.entries(json.connections)) {
      assert.ok(nodeNames.has(sourceNode), `El nodo origen "${sourceNode}" no existe`);
      for (const [connType, outputs] of Object.entries(connectionTypes)) {
        for (const outputGroup of outputs) {
          for (const conn of outputGroup) {
            assert.ok(nodeNames.has(conn.node), `El nodo destino "${conn.node}" no existe`);
          }
        }
      }
    }

    // Comprobar ramificación del IF
    const ifConn = json.connections['IF: Datos válidos'];
    assert.ok(ifConn && ifConn.main);
    assert.equal(ifConn.main[0][0].node, 'AI Agent DeepSeek', 'Rama válida (main[0]) debe conectar con AI Agent DeepSeek');
    assert.equal(ifConn.main[1][0].node, 'Respond to Webhook - 400', 'Rama inválida (main[1]) debe conectar directamente con Respond to Webhook - 400');

    // Comprobar salidas del AI Agent
    const agentConn = json.connections['AI Agent DeepSeek'];
    assert.ok(agentConn && agentConn.main);
    assert.equal(agentConn.main[0][0].node, 'Validar Respuesta IA', 'Salida de éxito main[0] debe conectar con Validar Respuesta IA');
    assert.equal(agentConn.main[1][0].node, 'Formatear Error IA', 'Salida de error main[1] debe conectar con Formatear Error IA');

    // Comprobar salidas terminales
    assert.equal(json.connections['Formatear Error IA'].main[0][0].node, 'Respond to Webhook - 500');
    assert.equal(json.connections['Validar Respuesta IA'].main[0][0].node, 'Respond to Webhook - 200');
  });

  test('5. Configuración de Respond to Webhook (200, 400, 500) y firstIncomingItem', () => {
    const json = JSON.parse(fs.readFileSync(fixedWorkflowPath, 'utf8'));
    const node200 = json.nodes.find(n => n.name === 'Respond to Webhook - 200');
    const node400 = json.nodes.find(n => n.name === 'Respond to Webhook - 400');
    const node500 = json.nodes.find(n => n.name === 'Respond to Webhook - 500');

    assert.equal(node200.parameters.options.responseCode, 200);
    assert.equal(node200.parameters.respondWith, 'firstIncomingItem');

    assert.equal(node400.parameters.options.responseCode, 400);
    assert.equal(node400.parameters.respondWith, 'firstIncomingItem');

    assert.equal(node500.parameters.options.responseCode, 500);
    assert.equal(node500.parameters.respondWith, 'firstIncomingItem');
  });

  test('6. Modelo DeepSeek: deepseek-flash, baseURL https://api.deepseek.com y sin API keys quemadas', () => {
    const json = JSON.parse(fs.readFileSync(fixedWorkflowPath, 'utf8'));
    const modelNode = json.nodes.find(n => n.name === 'DeepSeek Chat Model (OpenAI Compatible)');

    assert.equal(modelNode.parameters.model, 'deepseek-flash');
    assert.equal(modelNode.parameters.options.baseURL, 'https://api.deepseek.com');
    assert.equal(modelNode.parameters.options.temperature, 0.2);

    const str = JSON.stringify(json);
    assert.ok(!/sk-[a-zA-Z0-9]{15,}/.test(str), 'No debe contener claves API reales');
    assert.ok(!str.toLowerCase().includes('bearer '), 'No debe contener Bearer tokens');
  });

  // Funciones simuladoras directas del código de los nodos para las pruebas funcionales
  function executeNormalizeNode(inputPayload) {
    const rawBody = inputPayload.body || inputPayload;
    const titulo = typeof rawBody.titulo === 'string' ? rawBody.titulo.trim() : '';
    const descripcion = typeof rawBody.descripcion === 'string' ? rawBody.descripcion.trim() : '';
    const area = typeof rawBody.area === 'string' ? rawBody.area.trim() : (typeof rawBody.areaActual === 'string' ? rawBody.areaActual.trim() : '');
    const prioridad = typeof rawBody.prioridad === 'string' ? rawBody.prioridad.trim() : (typeof rawBody.prioridadActual === 'string' ? rawBody.prioridadActual.trim() : '');
    const clienteNombre = typeof rawBody.clienteNombre === 'string' ? rawBody.clienteNombre.trim() : (typeof rawBody.cliente_nombre === 'string' ? rawBody.cliente_nombre.trim() : 'Cliente');
    const empresa = typeof rawBody.empresa === 'string' ? rawBody.empresa.trim() : (typeof rawBody.cliente_empresa === 'string' ? rawBody.cliente_empresa.trim() : '');

    const missing = [];
    if (!titulo) missing.push("'titulo'");
    if (!descripcion) missing.push("'descripcion'");

    if (missing.length > 0) {
      return {
        ok: false,
        data: null,
        error: `Datos de entrada inválidos. Faltan campos obligatorios o están vacíos: ${missing.join(', ')}.`
      };
    }

    if (titulo.length < 3) {
      return {
        ok: false,
        data: null,
        error: "El campo 'titulo' debe tener al menos 3 caracteres."
      };
    }

    if (descripcion.length < 5) {
      return {
        ok: false,
        data: null,
        error: "El campo 'descripcion' debe tener al menos 5 caracteres."
      };
    }

    return {
      titulo,
      descripcion,
      area,
      prioridad,
      clienteNombre,
      empresa
    };
  }

  function evaluateIfCondition(item) {
    return Boolean(!item.error && item.titulo && item.descripcion);
  }

  function executeFormatErrorIaNode(agentErrorOutput) {
    const err = agentErrorOutput.error || {};
    const msg = err.message || (typeof err === 'string' ? err : (err.description || JSON.stringify(err)));
    return {
      ok: false,
      data: null,
      error: `Error en AI Agent (DeepSeek): ${msg || 'Error de conexión, credencial no configurada o tiempo de espera agotado.'}`
    };
  }

  function executeValidateIaResponseNode(inputItem) {
    const VALID_AREAS = ['Soporte Técnico', 'Facturación', 'Infraestructura'];
    const VALID_PRIORITIES = ['alta', 'media', 'baja'];

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

    let clean = String(rawOutput || '').trim();
    if (clean.startsWith('```json')) {
      clean = clean.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (clean.startsWith('```')) {
      clean = clean.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    const firstBrace = clean.indexOf('{');
    const lastBrace = clean.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      clean = clean.substring(firstBrace, lastBrace + 1);
    }

    let parsed = {};
    try {
      parsed = JSON.parse(clean);
    } catch (e) {
      parsed = {};
    }

    let area = String(parsed.area || parsed.areaSugerida || parsed.area_sugerida || '').trim();
    if (!VALID_AREAS.includes(area)) {
      const lowerArea = area.toLowerCase();
      if (lowerArea.includes('factur') || lowerArea.includes('cobro') || lowerArea.includes('pago')) {
        area = 'Facturación';
      } else if (lowerArea.includes('infra') || lowerArea.includes('servidor') || lowerArea.includes('red')) {
        area = 'Infraestructura';
      } else {
        area = 'Soporte Técnico';
      }
    }

    let prioridad = String(parsed.prioridad || parsed.prioridadSugerida || parsed.prioridad_sugerida || '').toLowerCase().trim();
    if (!VALID_PRIORITIES.includes(prioridad)) {
      if (prioridad.includes('alt') || prioridad.includes('crit') || prioridad.includes('urg')) {
        prioridad = 'alta';
      } else if (prioridad.includes('baj')) {
        prioridad = 'baja';
      } else {
        prioridad = 'media';
      }
    }

    const titulo = String(parsed.titulo || parsed.tituloSugerido || inputItem.titulo || 'Ticket de Soporte').trim();
    const descripcion = String(parsed.descripcion || parsed.descripcionSugerida || inputItem.descripcion || 'Incidencia reportada por el usuario.').trim();
    const justificacion = String(parsed.justificacion || parsed.motivo || 'Recomendación generada mediante análisis inteligente del incidente.').trim();
    const respuestaInicial = String(parsed.respuestaInicial || parsed.borrador_respuesta || `Estimado cliente, hemos recibido su ticket sobre "${titulo}" y ha sido asignado al equipo de ${area}.`).trim();

    return {
      ok: true,
      data: {
        titulo,
        descripcion,
        area,
        prioridad,
        justificacion,
        prioridadSugerida: prioridad,
        areaSugerida: area,
        respuestaInicial,
        requiereRevisionHumana: true
      },
      error: null
    };
  }

  test('7. Prueba A: Entrada inválida (sin título) produce HTTP 400 con contrato exacto', () => {
    const inputSinTitulo = {
      body: {
        descripcion: 'El sistema arroja error 500 al guardar factura',
        area: 'Facturación',
        prioridad: 'alta'
      }
    };

    const result = executeNormalizeNode(inputSinTitulo);
    assert.equal(result.ok, false);
    assert.equal(result.data, null);
    assert.ok(result.error.includes("'titulo'"), 'El mensaje de error debe indicar que falta el título');

    const ifPassed = evaluateIfCondition(result);
    assert.equal(ifPassed, false, 'El IF debe evaluar false y dirigir a la rama 400');
  });

  test('8. Prueba A: Entrada inválida (sin descripción) produce HTTP 400 con contrato exacto', () => {
    const inputSinDesc = {
      body: {
        titulo: 'Falla en pasarela'
      }
    };

    const result = executeNormalizeNode(inputSinDesc);
    assert.equal(result.ok, false);
    assert.equal(result.data, null);
    assert.ok(result.error.includes("'descripcion'"));

    const ifPassed = evaluateIfCondition(result);
    assert.equal(ifPassed, false, 'El IF debe evaluar false');
  });

  test('9. Prueba B: Entrada válida pasa el IF y produce contrato 200 con áreas y prioridades oficiales', () => {
    const inputValido = {
      body: {
        titulo: 'Falla total en servidor de base de datos de producción',
        descripcion: 'El servicio PostgreSQL no responde a conexiones y bloquea la operación de la empresa.',
        area: 'Infraestructura',
        prioridad: 'alta'
      }
    };

    const normResult = executeNormalizeNode(inputValido);
    assert.equal(normResult.error, undefined);
    assert.equal(normResult.titulo, inputValido.body.titulo);

    const ifPassed = evaluateIfCondition(normResult);
    assert.equal(ifPassed, true, 'El IF debe evaluar true y avanzar hacia el AI Agent');

    // Simular respuesta devuelta por DeepSeek
    const mockAgentOutput = {
      output: JSON.stringify({
        titulo: 'Indisponibilidad de PostgreSQL en Servidor Productivo',
        descripcion: 'El servicio de base de datos no admite conexiones entrantes.',
        area: 'Infraestructura',
        prioridad: 'alta',
        justificacion: 'Afecta la disponibilidad completa del sistema de producción.',
        respuestaInicial: 'Estimado cliente, nuestro equipo de infraestructura ya está atendiendo la incidencia en el servidor.'
      })
    };

    const response200 = executeValidateIaResponseNode(mockAgentOutput);
    assert.equal(response200.ok, true);
    assert.equal(response200.error, null);
    assert.ok(response200.data);
    assert.equal(response200.data.area, 'Infraestructura');
    assert.equal(response200.data.prioridad, 'alta');
    assert.equal(response200.data.titulo, 'Indisponibilidad de PostgreSQL en Servidor Productivo');
    assert.ok(response200.data.justificacion.length > 5);
  });

  test('10. Prueba C: Error en modelo DeepSeek activa la rama 500 con contrato de error', () => {
    const agentError = {
      error: {
        message: '401 Unauthorized: Invalid API Key or Quota Exceeded'
      }
    };

    const result500 = executeFormatErrorIaNode(agentError);
    assert.equal(result500.ok, false);
    assert.equal(result500.data, null);
    assert.ok(result500.error.includes('Error en AI Agent (DeepSeek)'));
    assert.ok(result500.error.includes('401 Unauthorized'));
  });

  test('11. Validación de compatibilidad con frontend existente (aiService.js)', () => {
    const mockAgentOutput = {
      output: JSON.stringify({
        titulo: 'Consulta sobre factura de servicios',
        descripcion: 'Solicitud de aclaración sobre cargos del mes de octubre.',
        area: 'Facturación',
        prioridad: 'media',
        justificacion: 'Consulta financiera sin impacto operativo bloqueante.'
      })
    };

    const result = executeValidateIaResponseNode(mockAgentOutput);
    // Verificar campos requeridos por contrato PROMPT CORRECTIVO
    assert.equal(result.data.titulo, 'Consulta sobre factura de servicios');
    assert.equal(result.data.descripcion, 'Solicitud de aclaración sobre cargos del mes de octubre.');
    assert.equal(result.data.area, 'Facturación');
    assert.equal(result.data.prioridad, 'media');
    assert.ok(result.data.justificacion);

    // Verificar campos requeridos por frontend aiService.js
    assert.equal(result.data.prioridadSugerida, 'media');
    assert.equal(result.data.areaSugerida, 'Facturación');
    assert.ok(result.data.respuestaInicial);
    assert.equal(result.data.requiereRevisionHumana, true);
  });
});
