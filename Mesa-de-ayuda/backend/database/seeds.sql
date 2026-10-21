-- ============================================================================
-- Datos Iniciales de Prueba (Seeds) - Mesa de Ayuda con SLA e Historial
-- ============================================================================

PRAGMA foreign_keys = ON;

-- ----------------------------------------------------------------------------
-- 1. Semillas: Agentes
-- ----------------------------------------------------------------------------
INSERT INTO agentes (id, nombre, email, area, activo) VALUES
(1, 'Carlos Mendoza', 'carlos.mendoza@mesadeayuda.com', 'Soporte Técnico', 1),
(2, 'Laura Fernández', 'laura.fernandez@mesadeayuda.com', 'Soporte Técnico', 1),
(3, 'Andrés Gómez', 'andres.gomez@mesadeayuda.com', 'Facturación', 1),
(4, 'Sofía Ramos', 'sofia.ramos@mesadeayuda.com', 'Infraestructura', 1),
(5, 'Diego Martínez', 'diego.martinez@mesadeayuda.com', 'Soporte Técnico', 0); -- Inactivo para pruebas

-- ----------------------------------------------------------------------------
-- 2. Semillas: Clientes
-- ----------------------------------------------------------------------------
INSERT INTO clientes (id, nombre, email, telefono, empresa) VALUES
(1, 'Acme Corp Contact', 'soporte@acme.com', '+506 2222-1111', 'Acme Corporation'),
(2, 'TechSolutions Admin', 'admin@techsolutions.io', '+506 8888-9999', 'TechSolutions Ltd'),
(3, 'Distribuidora Global', 'contacto@distribuidoraglobal.cr', '+506 2440-5555', 'Distribuidora Global S.A.');

-- ----------------------------------------------------------------------------
-- 3. Semillas: Tickets
-- SLA: Alta = 4 horas, Media = 24 horas, Baja = 72 horas
-- Incluye casos normales y tickets vencidos para probar métricas e indicadores.
-- ----------------------------------------------------------------------------
INSERT INTO tickets (id, titulo, descripcion, cliente_id, agente_id, area, estado, prioridad, fecha_limite, fecha_resolucion, created_at, updated_at) VALUES
-- Ticket 1: Abierto, prioridad alta (vigente)
(1, 'Error en pasarela de pagos al checkout', 'Los clientes no pueden procesar transacciones con tarjeta visa.', 1, 1, 'Soporte Técnico', 'abierto', 'alta', datetime('now', '+3 hours'), NULL, datetime('now', '-1 hour'), datetime('now', '-1 hour')),

-- Ticket 2: En progreso, prioridad media (vigente)
(2, 'Factura electrónica no emitida mes anterior', 'Se solicita regenerar el documento tributario de septiembre.', 2, 3, 'Facturación', 'en progreso', 'media', datetime('now', '+18 hours'), NULL, datetime('now', '-6 hours'), datetime('now', '-2 hours')),

-- Ticket 3: Resuelto a tiempo (con fecha de resolución)
(3, 'Acceso VPN bloqueado para colaborador', 'Reestablecer credenciales de acceso remoto.', 2, 4, 'Infraestructura', 'resuelto', 'media', datetime('now', '-2 hours'), datetime('now', '-3 hours'), datetime('now', '-20 hours'), datetime('now', '-3 hours')),

-- Ticket 4: Abierto, prioridad alta VENCIDO (para validar métricas y alertas rojas)
(4, 'Servidor de base de datos no responde', 'Alerta crítica de indisponibilidad total en nodo secundario.', 1, 4, 'Infraestructura', 'abierto', 'alta', datetime('now', '-2 hours'), NULL, datetime('now', '-6 hours'), datetime('now', '-6 hours')),

-- Ticket 5: Cerrado
(5, 'Consulta sobre horarios de mantenimiento', 'Solicitud de información sobre la ventana de mantenimiento del fin de semana.', 3, 2, 'Soporte Técnico', 'cerrado', 'baja', datetime('now', '+60 hours'), datetime('now', '-10 hours'), datetime('now', '-24 hours'), datetime('now', '-5 hours'));

-- ----------------------------------------------------------------------------
-- 4. Semillas: Comentarios
-- El ticket 3 incluye el comentario obligatorio de resolución (es_resolucion = 1)
-- ----------------------------------------------------------------------------
INSERT INTO comentarios (id, ticket_id, autor_tipo, autor_id, contenido, es_resolucion, created_at) VALUES
(1, 1, 'cliente', 1, 'Adjunto captura del código de error 502 retornado por el procesador.', 0, datetime('now', '-45 minutes')),
(2, 2, 'agente', 3, 'Se está revisando el registro de la DIAN para verificar el estado del comprobante.', 0, datetime('now', '-2 hours')),
(3, 3, 'agente', 4, 'Se reinició el túnel IPSec y se validó el certificado del usuario. Acceso restablecido con éxito.', 1, datetime('now', '-3 hours')),
(4, 5, 'agente', 2, 'Se enviaron los horarios programados vía correo.', 1, datetime('now', '-10 hours'));

-- ----------------------------------------------------------------------------
-- 5. Semillas: Historial de Auditoría
-- ----------------------------------------------------------------------------
INSERT INTO historial (id, ticket_id, tipo_evento, campo, valor_anterior, valor_nuevo, autor_id, detalles, created_at) VALUES
(1, 1, 'creacion', 'estado', NULL, 'abierto', 1, 'Ticket creado y asignado automáticamente a Carlos Mendoza por menor carga.', datetime('now', '-1 hour')),
(2, 2, 'creacion', 'estado', NULL, 'abierto', 2, 'Ticket creado.', datetime('now', '-6 hours')),
(3, 2, 'cambio_estado', 'estado', 'abierto', 'en progreso', 3, 'Agente Andrés Gómez inició la atención del ticket.', datetime('now', '-2 hours')),
(4, 3, 'creacion', 'estado', NULL, 'abierto', 2, 'Ticket creado.', datetime('now', '-20 hours')),
(5, 3, 'cambio_estado', 'estado', 'en progreso', 'resuelto', 4, 'Ticket resuelto con comentario de cierre técnico.', datetime('now', '-3 hours')),
(6, 4, 'creacion', 'estado', NULL, 'abierto', 1, 'Ticket crítico creado.', datetime('now', '-6 hours')),
(7, 5, 'cambio_estado', 'estado', 'resuelto', 'cerrado', 2, 'Ticket cerrado automáticamente tras aceptación del cliente.', datetime('now', '-5 hours'));
