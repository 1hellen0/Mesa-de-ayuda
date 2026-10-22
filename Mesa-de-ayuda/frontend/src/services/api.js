/**
 * Servicio Centralizado de API REST - Frontend
 * Conecta con el servidor Express en VITE_API_URL
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

/**
 * Cliente HTTP base con manejo estandarizado de JSON y errores
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const config = {
    ...options,
    headers
  };

  try {
    const response = await fetch(url, config);

    // Intentar leer la respuesta como JSON
    let data = null;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = text ? { message: text } : {};
    }

    if (!response.ok) {
      // Extraer mensaje descriptivo enviado por el backend
      const errorMessage = data?.error || data?.message || `Error del servidor (${response.status})`;
      const error = new Error(errorMessage);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (err) {
    if (err.name === 'TypeError' && err.message.includes('Failed to fetch')) {
      const networkError = new Error('No fue posible conectar con el servidor backend. Verifique que Express esté activo en el puerto 3000.');
      networkError.status = 0;
      throw networkError;
    }
    throw err;
  }
}

export const api = {
  // Verificación del servidor
  checkHealth: () => request('/health'),

  // Resumen / Métricas en tiempo real
  getSummary: () => request('/resumen'),

  // Tickets
  getTickets: (filters = {}) => {
    const query = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query.append(key, value);
      }
    });
    const queryString = query.toString();
    return request(`/tickets${queryString ? `?${queryString}` : ''}`);
  },

  getTicketById: (id) => request(`/tickets/${id}`),

  createTicket: (data) =>
    request('/tickets', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  updateTicket: (id, data) =>
    request(`/tickets/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    }),

  changeTicketStatus: (id, { estado, comentario, autor_id }) =>
    request(`/tickets/${id}/estado`, {
      method: 'PATCH',
      body: JSON.stringify({ estado, comentario, autor_id })
    }),

  // Comentarios
  getTicketComments: (id) => request(`/tickets/${id}/comentarios`),

  addTicketComment: (id, commentData) =>
    request(`/tickets/${id}/comentarios`, {
      method: 'POST',
      body: JSON.stringify(commentData)
    }),

  // Historial
  getTicketHistory: (id) => request(`/tickets/${id}/historial`),

  // Agentes
  getAgents: (filters = {}) => {
    const query = new URLSearchParams();
    if (filters.area) query.append('area', filters.area);
    if (filters.activo !== undefined) query.append('activo', filters.activo);
    const queryString = query.toString();
    return request(`/agentes${queryString ? `?${queryString}` : ''}`);
  },

  getAgentById: (id) => request(`/agentes/${id}`),

  createAgent: (data) =>
    request('/agentes', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  updateAgent: (id, data) =>
    request(`/agentes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    }),

  deleteAgent: (id) =>
    request(`/agentes/${id}`, {
      method: 'DELETE'
    }),

  // Clientes
  getClients: () => request('/clientes'),

  getClientById: (id) => request(`/clientes/${id}`),

  createClient: (data) =>
    request('/clientes', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  updateClient: (id, data) =>
    request(`/clientes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    }),

  deleteClient: (id) =>
    request(`/clientes/${id}`, {
      method: 'DELETE'
    })
};
