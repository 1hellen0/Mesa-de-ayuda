/**
 * Servicio Centralizado de Integración con n8n y DeepSeek - Frontend
 * Mesa de Ayuda con SLA e Historial
 *
 * Conecta exclusivamente con el webhook de n8n configurado en VITE_N8N_WEBHOOK_URL.
 * No expone secretos ni claves de API en el cliente.
 */

import { TICKET_AREAS, TICKET_PRIORITY } from '../utils/constants.js';

// Catálogo oficial canónico obligatorio
export const VALID_AREAS = Object.freeze([...TICKET_AREAS]);
export const VALID_PRIORITIES = Object.freeze([
  TICKET_PRIORITY.ALTA,
  TICKET_PRIORITY.MEDIA,
  TICKET_PRIORITY.BAJA
]);

// URL base del webhook de n8n
const DEFAULT_WEBHOOK_URL = 'http://localhost:5678/webhook/mesa-ayuda/analizar-ticket';

export const getN8nWebhookUrl = () => {
  return (
    (typeof import.meta !== 'undefined' &&
      import.meta.env &&
      import.meta.env.VITE_N8N_WEBHOOK_URL) ||
    DEFAULT_WEBHOOK_URL
  );
};

// Control de concurrencia en memoria para prevenir solicitudes simultáneas
let isAnalysisInProgress = false;

/**
 * Valida que los datos de entrada cumplan los requisitos mínimos antes de invocar a n8n
 */
export function validateAiInput(payload) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Los datos para el análisis de IA deben ser un objeto válido.');
  }

  const titulo = typeof payload.titulo === 'string' ? payload.titulo.trim() : '';
  const descripcion = typeof payload.descripcion === 'string' ? payload.descripcion.trim() : '';

  if (!titulo) {
    throw new Error("El campo 'titulo' es obligatorio y no puede estar vacío.");
  }
  if (titulo.length < 3) {
    throw new Error("El título debe tener al menos 3 caracteres para ser analizado.");
  }

  if (!descripcion) {
    throw new Error("El campo 'descripcion' es obligatorio y no puede estar vacío.");
  }
  if (descripcion.length < 5) {
    throw new Error("La descripción debe tener al menos 5 caracteres para ser analizada.");
  }

  if (payload.area && !VALID_AREAS.includes(payload.area)) {
    throw new Error(`El área '${payload.area}' no pertenece al catálogo oficial permitido (${VALID_AREAS.join(', ')}).`);
  }

  if (payload.prioridad && !VALID_PRIORITIES.includes(payload.prioridad)) {
    throw new Error(`La prioridad '${payload.prioridad}' no pertenece al catálogo oficial permitido (${VALID_PRIORITIES.join(', ')}).`);
  }

  return {
    titulo,
    descripcion,
    clienteNombre: payload.clienteNombre?.trim() || payload.cliente_nombre?.trim() || 'Cliente',
    empresa: payload.empresa?.trim() || payload.cliente_empresa?.trim() || null,
    area: payload.area || null,
    prioridad: payload.prioridad || null
  };
}

/**
 * Valida la estructura y catálogo del payload de respuesta emitido por el webhook de n8n
 */
export function validateAiResponse(responseJson) {
  if (!responseJson || typeof responseJson !== 'object') {
    throw new Error('La respuesta del servicio de IA no contiene un objeto JSON válido.');
  }

  if (responseJson.ok === false) {
    const errorMsg = responseJson.error || 'El agente de IA no pudo procesar la solicitud.';
    throw new Error(errorMsg);
  }

  if (!responseJson.ok || !responseJson.data || typeof responseJson.data !== 'object') {
    throw new Error('La respuesta del servicio de IA no cumple con el contrato esperado ({ ok: true, data: {...} }).');
  }

  const { data } = responseJson;
  const requiredFields = [
    'prioridadSugerida',
    'areaSugerida',
    'respuestaInicial',
    'justificacion',
    'requiereRevisionHumana'
  ];

  for (const field of requiredFields) {
    if (data[field] === undefined || data[field] === null) {
      throw new Error(`La respuesta de IA carece del campo obligatorio: '${field}'.`);
    }
  }

  // Validación estricta contra catálogo de prioridad
  if (!VALID_PRIORITIES.includes(data.prioridadSugerida)) {
    throw new Error(
      `La prioridad sugerida por la IA ('${data.prioridadSugerida}') no pertenece al catálogo oficial: ${VALID_PRIORITIES.join(', ')}.`
    );
  }

  // Validación estricta contra catálogo de área
  if (!VALID_AREAS.includes(data.areaSugerida)) {
    throw new Error(
      `El área sugerida por la IA ('${data.areaSugerida}') no pertenece al catálogo oficial: ${VALID_AREAS.join(', ')}.`
    );
  }

  if (typeof data.requiereRevisionHumana !== 'boolean' || !data.requiereRevisionHumana) {
    throw new Error('La sugerencia de IA debe tener explícitamente requiereRevisionHumana: true.');
  }

  return {
    prioridadSugerida: data.prioridadSugerida,
    areaSugerida: data.areaSugerida,
    respuestaInicial: String(data.respuestaInicial).trim(),
    justificacion: String(data.justificacion).trim(),
    requiereRevisionHumana: true
  };
}

/**
 * Envía el ticket al webhook de n8n para su análisis por el agente de IA DeepSeek
 *
 * @param {Object} ticketData { titulo, descripcion, clienteNombre, empresa, area, prioridad }
 * @param {Object} [options] { timeoutMs, signal, webhookUrl }
 * @returns {Promise<{ ok: boolean, data: Object, error: null }>}
 */
export async function analyzeTicketWithAi(ticketData, options = {}) {
  // Prevenir solicitudes concurrentes
  if (isAnalysisInProgress) {
    const conflictErr = new Error('Ya hay un análisis de IA en curso. Por favor espere a que finalice.');
    conflictErr.status = 409;
    throw conflictErr;
  }

  // Validar y normalizar entrada
  const sanitizedInput = validateAiInput(ticketData);

  const webhookUrl = options.webhookUrl || getN8nWebhookUrl();
  const timeoutMs = options.timeoutMs || 25000;

  // Manejo de timeout con AbortController
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort(new Error('TIMEOUT'));
  }, timeoutMs);

  // Vincular señal externa de cancelación si se proporciona
  if (options.signal) {
    options.signal.addEventListener('abort', () => {
      clearTimeout(timeoutId);
      controller.abort(options.signal.reason);
    });
  }

  isAnalysisInProgress = true;

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(sanitizedInput),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    // Parseo seguro de respuesta
    let responseBody = null;
    const contentType = response.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      try {
        responseBody = await response.json();
      } catch (jsonErr) {
        throw new Error('El servicio de IA respondió pero el cuerpo no es un JSON válido.');
      }
    } else {
      const text = await response.text();
      try {
        responseBody = JSON.parse(text);
      } catch {
        throw new Error(`El servicio de IA devolvió una respuesta no JSON (HTTP ${response.status}): ${text.slice(0, 150)}`);
      }
    }

    // Manejo de códigos de estado HTTP
    if (!response.ok) {
      const errorMessage =
        responseBody?.error ||
        responseBody?.message ||
        `Error en el servicio de IA (HTTP ${response.status})`;
      const httpErr = new Error(errorMessage);
      httpErr.status = response.status;
      httpErr.data = responseBody;
      throw httpErr;
    }

    // Validar estructura y catálogo de la respuesta exitosa
    const validatedData = validateAiResponse(responseBody);

    return {
      ok: true,
      data: validatedData,
      error: null
    };
  } catch (err) {
    // Clasificar errores para el usuario
    if (err.name === 'AbortError' || err.message === 'TIMEOUT') {
      const timeoutErr = new Error('La solicitud al servicio de IA superó el tiempo máximo de espera (25s). Verifique la conectividad de n8n y DeepSeek.');
      timeoutErr.status = 408;
      throw timeoutErr;
    }

    if (err.name === 'TypeError' && (err.message.includes('fetch') || err.message.includes('network'))) {
      const connErr = new Error(`No fue posible conectar con el servicio de IA en ${webhookUrl}. Verifique que n8n esté activo en el puerto 5678 y el workflow esté encendido.`);
      connErr.status = 0;
      throw connErr;
    }

    // Asegurar que no se filtren credenciales o rutas privadas
    const sanitizedMessage = String(err.message || 'Error desconocido al analizar con IA')
      .replace(/sk-[a-zA-Z0-9_-]{20,}/g, '[REDACTED_API_KEY]');

    const cleanErr = new Error(sanitizedMessage);
    cleanErr.status = err.status || 500;
    cleanErr.data = err.data || null;
    throw cleanErr;
  } finally {
    clearTimeout(timeoutId);
    isAnalysisInProgress = false;
  }
}

export const aiService = {
  analyzeTicket: analyzeTicketWithAi,
  validateInput: validateAiInput,
  validateResponse: validateAiResponse,
  getWebhookUrl: getN8nWebhookUrl,
  isBusy: () => isAnalysisInProgress,
  VALID_AREAS,
  VALID_PRIORITIES
};

export default aiService;
