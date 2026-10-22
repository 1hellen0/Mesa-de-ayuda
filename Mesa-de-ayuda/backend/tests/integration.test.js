/**
 * Test Suite de Integración Completa para la API REST del Backend
 * Ejecuta pruebas reales contra Express y SQLite mediante fetch nativo.
 */

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';
import db from '../src/config/database.js';

let server;
let baseUrl;

before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const { port } = server.address();
      baseUrl = `http://localhost:${port}/api`;
      console.log(`[Test Server] Corriendo en puerto efímero ${port}`);
      resolve();
    });
  });
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

describe('1. Health Check y Manejo de Rutas 404', () => {
  test('GET /api/health retorna 200 y status ok', async () => {
    const res = await fetch(`${baseUrl}/health`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.status, 'ok');
  });

  test('GET a ruta inexistente retorna 404 con formato { error: mensaje }', async () => {
    const res = await fetch(`${baseUrl}/ruta-inexistente`);
    assert.equal(res.status, 404);
    const body = await res.json();
    assert.ok(body.error);
    assert.match(body.error, /Ruta no encontrada/);
  });
});

describe('2. CRUD Completo de Agentes', () => {
  let createdAgentId;

  test('GET /api/agentes lista los agentes existentes', async () => {
    const res = await fetch(`${baseUrl}/agentes`);
    assert.equal(res.status, 200);
    const agents = await res.json();
    assert.ok(Array.isArray(agents));
    assert.ok(agents.length >= 5);
  });

  test('POST /api/agentes crea un agente con éxito (201 Created)', async () => {
    const newAgent = {
      nombre: 'Elena Castro',
      email: 'elena.castro.test@mesadeayuda.com',
      area: 'Facturación',
      activo: 1
    };
    const res = await fetch(`${baseUrl}/agentes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newAgent)
    });
    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.nombre, newAgent.nombre);
    assert.equal(body.email, newAgent.email);
    assert.ok(body.id);
    createdAgentId = body.id;
  });

  test('POST /api/agentes con email duplicado retorna 409 Conflict', async () => {
    const dupAgent = {
      nombre: 'Elena Duplicada',
      email: 'elena.castro.test@mesadeayuda.com',
      area: 'Facturación'
    };
    const res = await fetch(`${baseUrl}/agentes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dupAgent)
    });
    assert.equal(res.status, 409);
    const body = await res.json();
    assert.ok(body.error.includes('registrado') || body.error.includes('ya pertenece'));
  });

  test('POST /api/agentes con datos inválidos retorna 400 Bad Request', async () => {
    const invalidAgent = { nombre: '', email: 'no-es-email' };
    const res = await fetch(`${baseUrl}/agentes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidAgent)
    });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.ok(body.error);
  });

  test('GET /api/agentes/:id obtiene el agente por ID (200 OK)', async () => {
    const res = await fetch(`${baseUrl}/agentes/${createdAgentId}`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.id, createdAgentId);
  });

  test('PATCH /api/agentes/:id actualiza un agente (200 OK)', async () => {
    const res = await fetch(`${baseUrl}/agentes/${createdAgentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: 'Elena Castro Actualizada' })
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.nombre, 'Elena Castro Actualizada');
  });

  test('DELETE /api/agentes/:id elimina un agente sin tickets (200 OK)', async () => {
    const res = await fetch(`${baseUrl}/agentes/${createdAgentId}`, { method: 'DELETE' });
    assert.equal(res.status, 200);
    const check = await fetch(`${baseUrl}/agentes/${createdAgentId}`);
    assert.equal(check.status, 404);
  });

  test('DELETE /api/agentes/1 con tickets históricos retorna 409 Conflict (ON DELETE RESTRICT)', async () => {
    const res = await fetch(`${baseUrl}/agentes/1`, { method: 'DELETE' });
    assert.equal(res.status, 409);
    const body = await res.json();
    assert.ok(body.error);
  });
});

describe('3. CRUD Completo de Clientes', () => {
  let createdClientId;

  test('GET /api/clientes lista todos los clientes (200 OK)', async () => {
    const res = await fetch(`${baseUrl}/clientes`);
    assert.equal(res.status, 200);
    const clients = await res.json();
    assert.ok(Array.isArray(clients));
    assert.ok(clients.length >= 3);
  });

  test('POST /api/clientes crea un cliente (201 Created)', async () => {
    const newClient = {
      nombre: 'Grupo Logístico Alfa',
      email: 'contacto@alfa.cr',
      telefono: '+506 2200-3344',
      empresa: 'Alfa Logistics S.A.'
    };
    const res = await fetch(`${baseUrl}/clientes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newClient)
    });
    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.nombre, newClient.nombre);
    assert.ok(body.id);
    createdClientId = body.id;
  });

  test('POST /api/clientes con email duplicado retorna 409 Conflict', async () => {
    const dupClient = {
      nombre: 'Duplicado',
      email: 'contacto@alfa.cr'
    };
    const res = await fetch(`${baseUrl}/clientes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dupClient)
    });
    assert.equal(res.status, 409);
    const body = await res.json();
    assert.ok(body.error);
  });

  test('PATCH /api/clientes/:id actualiza campos (200 OK)', async () => {
    const res = await fetch(`${baseUrl}/clientes/${createdClientId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ empresa: 'Alfa Corp Holding' })
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.empresa, 'Alfa Corp Holding');
  });

  test('DELETE /api/clientes/:id elimina cliente sin tickets (200 OK)', async () => {
    const res = await fetch(`${baseUrl}/clientes/${createdClientId}`, { method: 'DELETE' });
    assert.equal(res.status, 200);
  });

  test('DELETE /api/clientes/1 con tickets retorna 409 Conflict (ON DELETE RESTRICT)', async () => {
    const res = await fetch(`${baseUrl}/clientes/1`, { method: 'DELETE' });
    assert.equal(res.status, 409);
  });
});

describe('4. Gestión de Tickets: Creación, SLA y Asignación Automática', () => {
  let ticketAltaId;

  test('POST /api/tickets crea ticket con prioridad alta (SLA 4h) y auto-asignación', async () => {
    const ticketPayload = {
      titulo: 'Interrupción total de servidor web',
      descripcion: 'El servicio nginx arrojó código 502 de forma masiva en producción',
      cliente_id: 1,
      area: 'Infraestructura',
      prioridad: 'alta'
    };
    const res = await fetch(`${baseUrl}/tickets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ticketPayload)
    });
    assert.equal(res.status, 201);
    const ticket = await res.json();

    // Verificaciones de reglas de negocio
    assert.equal(ticket.estado, 'en progreso', 'Estado debe avanzar a en progreso tras auto-asignación');
    assert.ok(ticket.agente_id, 'Debe tener agente asignado automáticamente');
    assert.equal(ticket.agente_nombre, 'Sofía Ramos', 'Debe asignarse al agente activo de Infraestructura');

    // Verificación de SLA 4 horas
    const createdTime = new Date(ticket.fecha_creacion).getTime();
    const limitTime = new Date(ticket.fecha_limite).getTime();
    const diffHours = (limitTime - createdTime) / (1000 * 60 * 60);
    assert.ok(Math.abs(diffHours - 4) < 0.1, 'Fecha límite debe ser de aproximadamente 4 horas');

    ticketAltaId = ticket.id;
  });

  test('POST /api/tickets calcula SLA de 24 horas para prioridad media', async () => {
    const res = await fetch(`${baseUrl}/tickets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        titulo: 'Consulta sobre factura duplicada',
        descripcion: 'Se cobró dos veces el cargo de soporte del periodo actual',
        cliente_id: 2,
        area: 'Facturación',
        prioridad: 'media'
      })
    });
    assert.equal(res.status, 201);
    const ticket = await res.json();
    const diffHours = (new Date(ticket.fecha_limite).getTime() - new Date(ticket.fecha_creacion).getTime()) / (1000 * 60 * 60);
    assert.ok(Math.abs(diffHours - 24) < 0.1, 'Fecha límite debe ser de 24 horas');
  });

  test('POST /api/tickets calcula SLA de 72 horas para prioridad baja', async () => {
    const res = await fetch(`${baseUrl}/tickets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        titulo: 'Solicitud de capacitación a usuarios',
        descripcion: 'Capacitación en uso del portal de autogestión',
        cliente_id: 2,
        area: 'Soporte Técnico',
        prioridad: 'baja'
      })
    });
    assert.equal(res.status, 201);
    const ticket = await res.json();
    const diffHours = (new Date(ticket.fecha_limite).getTime() - new Date(ticket.fecha_creacion).getTime()) / (1000 * 60 * 60);
    assert.ok(Math.abs(diffHours - 72) < 0.1, 'Fecha límite debe ser de 72 horas');
  });

  test('POST /api/tickets falla con 409 si no hay agentes activos en el área', async () => {
    const res = await fetch(`${baseUrl}/tickets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        titulo: 'Solicitud en área inexistente',
        descripcion: 'Descripción del ticket de prueba',
        cliente_id: 1,
        area: 'Área Sin Agentes',
        prioridad: 'media'
      })
    });
    assert.equal(res.status, 409);
    const body = await res.json();
    assert.ok(body.error.includes('No hay agentes activos disponibles'));
  });

  test('GET /api/tickets/:id devuelve información relacionada completa (cliente, agente, comentarios, historial)', async () => {
    const res = await fetch(`${baseUrl}/tickets/${ticketAltaId}`);
    assert.equal(res.status, 200);
    const detail = await res.json();

    assert.equal(detail.id, ticketAltaId);
    assert.ok(detail.cliente_nombre);
    assert.ok(detail.agente_nombre);
    assert.ok(Array.isArray(detail.comentarios));
    assert.ok(Array.isArray(detail.historial));
    assert.ok(detail.historial.length >= 3, 'Debe registrar creación, asignación y estado');
  });
});

describe('5. Transiciones de Estado, Resolución Obligatoria y Trazabilidad', () => {
  let testTicketId;

  before(async () => {
    // Crear ticket para pruebas de ciclo de vida
    const res = await fetch(`${baseUrl}/tickets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        titulo: 'Ticket para prueba de ciclo de vida',
        descripcion: 'Pruebas de transiciones y comentarios obligatorios',
        cliente_id: 1,
        area: 'Soporte Técnico',
        prioridad: 'alta'
      })
    });
    const ticket = await res.json();
    testTicketId = ticket.id;
  });

  test('Transición no permitida (directo a cerrado) retorna 409 Conflict', async () => {
    const res = await fetch(`${baseUrl}/tickets/${testTicketId}/estado`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: 'cerrado' })
    });
    assert.equal(res.status, 409);
    const body = await res.json();
    assert.ok(body.error.includes('Transición no permitida'));
  });

  test('Intento de resolver ticket SIN comentario retorna 409 Conflict y no cambia estado', async () => {
    const res = await fetch(`${baseUrl}/tickets/${testTicketId}/estado`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: 'resuelto' })
    });
    assert.equal(res.status, 409);
    const body = await res.json();
    assert.ok(body.error.includes('obligatorio'));

    // Verificar que el estado del ticket sigue siendo 'en progreso' (Rollback verificado)
    const check = await fetch(`${baseUrl}/tickets/${testTicketId}`);
    const ticket = await check.json();
    assert.equal(ticket.estado, 'en progreso');
  });

  test('Resolver ticket CON comentario obligatorio retorna 200 y registra comentario e historial en una transacción', async () => {
    const res = await fetch(`${baseUrl}/tickets/${testTicketId}/estado`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        estado: 'resuelto',
        comentario: 'Se resolvió la incidencia reiniciando el servicio y aplicando parche.',
        autor_id: 1
      })
    });
    assert.equal(res.status, 200);
    const updated = await res.json();
    assert.equal(updated.estado, 'resuelto');
    assert.ok(updated.fecha_resolucion, 'Debe establecer fecha_resolucion');

    // Verificar que el comentario existe y es de resolución (es_resolucion = 1)
    const comRes = await fetch(`${baseUrl}/tickets/${testTicketId}/comentarios`);
    const comments = await comRes.json();
    const resComment = comments.find((c) => c.es_resolucion === 1);
    assert.ok(resComment, 'Debe registrar comentario con es_resolucion = 1');
    assert.equal(resComment.contenido, 'Se resolvió la incidencia reiniciando el servicio y aplicando parche.');

    // Verificar registro en historial
    const histRes = await fetch(`${baseUrl}/tickets/${testTicketId}/historial`);
    const history = await histRes.json();
    const resolutionEvent = history.find((h) => h.valor_nuevo === 'resuelto');
    assert.ok(resolutionEvent, 'Debe existir evento de cambio a resuelto en el historial');
  });

  test('Cerrar ticket resuelto retorna 200 OK', async () => {
    const res = await fetch(`${baseUrl}/tickets/${testTicketId}/estado`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: 'cerrado' })
    });
    assert.equal(res.status, 200);
    const updated = await res.json();
    assert.equal(updated.estado, 'cerrado');
  });

  test('Intentar transicionar desde cerrado retorna 409 Conflict', async () => {
    const res = await fetch(`${baseUrl}/tickets/${testTicketId}/estado`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: 'en progreso' })
    });
    assert.equal(res.status, 409);
  });
});

describe('6. Filtros, Búsqueda y Ordenamiento en Tickets', () => {
  test('Filtrar por estado retorna únicamente tickets con ese estado', async () => {
    const res = await fetch(`${baseUrl}/tickets?estado=resuelto`);
    assert.equal(res.status, 200);
    const tickets = await res.json();
    assert.ok(tickets.length > 0);
    tickets.forEach((t) => assert.equal(t.estado, 'resuelto'));
  });

  test('Búsqueda por término (q) filtra coincidencias en título o descripción', async () => {
    const res = await fetch(`${baseUrl}/tickets?q=VPN`);
    assert.equal(res.status, 200);
    const tickets = await res.json();
    assert.ok(tickets.length >= 1);
    assert.ok(tickets.some((t) => t.titulo.includes('VPN') || t.descripcion.includes('VPN')));
  });
});

describe('7. Métricas y Resumen SQL (GET /api/resumen)', () => {
  test('GET /api/resumen calcula métricas por estado, cumplimiento de SLA y tiempo promedio en SQL', async () => {
    const res = await fetch(`${baseUrl}/resumen`);
    assert.equal(res.status, 200);
    const data = await res.json();

    assert.ok(data.resumen_tickets);
    assert.ok(data.resumen_tickets.total > 0);
    assert.ok(data.resumen_tickets.abiertos !== undefined);
    assert.ok(data.resumen_tickets.en_progreso !== undefined);
    assert.ok(data.resumen_tickets.resueltos !== undefined);
    assert.ok(data.resumen_tickets.cerrados !== undefined);

    assert.ok(data.cumplimiento_sla);
    assert.ok(data.cumplimiento_sla.porcentaje_cumplimiento !== undefined);
    assert.equal(data.cumplimiento_sla.formula, '(resueltos_a_tiempo / total_resueltos) * 100');

    assert.ok(data.tiempo_promedio_resolucion);
    assert.ok(data.tiempo_promedio_resolucion.horas_promedio !== undefined);

    assert.ok(Array.isArray(data.carga_por_agente));
    assert.ok(data.carga_por_agente.length > 0);
  });
});

describe('8. Checkpoint Académico: Errores 400, 404, 409 y Reversión Transaccional', () => {
  test('Error 400: JSON mal formado en cuerpo de petición retorna 400 { error: mensaje }', async () => {
    const res = await fetch(`${baseUrl}/tickets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{"titulo": "JSON Incompleto"'
    });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.ok(body.error);
    assert.match(body.error, /mal formado/);
  });

  test('Error 400: Parámetro ID no numérico en URL retorna 400', async () => {
    const res = await fetch(`${baseUrl}/tickets/parametro_invalido`);
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.ok(body.error);
  });

  test('Error 400: Prioridad inválida en creación de ticket retorna 400', async () => {
    const res = await fetch(`${baseUrl}/tickets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        titulo: 'Ticket con prioridad inválida',
        descripcion: 'Descripción válida de prueba',
        cliente_id: 1,
        area: 'Soporte Técnico',
        prioridad: 'urgente_invalida'
      })
    });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.ok(body.error);
  });

  test('Error 404: Consulta de cliente inexistente retorna 404', async () => {
    const res = await fetch(`${baseUrl}/clientes/88888`);
    assert.equal(res.status, 404);
    const body = await res.json();
    assert.equal(body.error, 'Cliente no encontrado con ID 88888');
  });

  test('Error 404: Consulta de comentarios de ticket inexistente retorna 404', async () => {
    const res = await fetch(`${baseUrl}/tickets/88888/comentarios`);
    assert.equal(res.status, 404);
    const body = await res.json();
    assert.ok(body.error.includes('Ticket no encontrado'));
  });

  test('Error 404: Consulta de historial de ticket inexistente retorna 404', async () => {
    const res = await fetch(`${baseUrl}/tickets/88888/historial`);
    assert.equal(res.status, 404);
    const body = await res.json();
    assert.ok(body.error.includes('Ticket no encontrado'));
  });

  test('Error 409 y Reversión: Falla en auto-asignación por área sin agentes no deja datos huérfanos', async () => {
    const res = await fetch(`${baseUrl}/tickets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        titulo: 'Ticket para área sin personal',
        descripcion: 'Debe fallar con 409 y no dejar registros parciales',
        cliente_id: 1,
        area: 'Área Vencida Sin Personal',
        prioridad: 'alta'
      })
    });
    assert.equal(res.status, 409);
    const body = await res.json();
    assert.ok(body.error.includes('No hay agentes activos'));

    // Confirmar que la transacción revirtió y no hay ticket insertado
    const checkSql = db.prepare("SELECT COUNT(*) as c FROM tickets WHERE titulo = 'Ticket para área sin personal'").get();
    assert.equal(checkSql.c, 0, 'La transacción debe revertir la inserción del ticket');
  });

  test('Transacciones: Intento fallido de resolución sin comentario preserva estado, comentarios e historial', async () => {
    const ticketBefore = db.prepare("SELECT id, estado FROM tickets WHERE estado = 'en progreso' LIMIT 1").get();
    assert.ok(ticketBefore, 'Debe haber un ticket en progreso');

    const commentsBefore = db.prepare("SELECT COUNT(*) as c FROM comentarios WHERE ticket_id = ?").get(ticketBefore.id).c;
    const historyBefore = db.prepare("SELECT COUNT(*) as c FROM historial WHERE ticket_id = ?").get(ticketBefore.id).c;

    const res = await fetch(`${baseUrl}/tickets/${ticketBefore.id}/estado`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: 'resuelto' })
    });
    assert.equal(res.status, 409);

    const ticketAfter = db.prepare("SELECT estado FROM tickets WHERE id = ?").get(ticketBefore.id);
    const commentsAfter = db.prepare("SELECT COUNT(*) as c FROM comentarios WHERE ticket_id = ?").get(ticketBefore.id).c;
    const historyAfter = db.prepare("SELECT COUNT(*) as c FROM historial WHERE ticket_id = ?").get(ticketBefore.id).c;

    assert.equal(ticketAfter.estado, 'en progreso', 'El estado del ticket debe seguir siendo en progreso');
    assert.equal(commentsAfter, commentsBefore, 'No se deben insertar comentarios en caso de error');
    assert.equal(historyAfter, historyBefore, 'No se debe insertar historial en caso de error');
  });
});
