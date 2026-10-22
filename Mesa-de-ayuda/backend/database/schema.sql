-- ============================================================================
-- Esquema Principal de Base de Datos - Mesa de Ayuda con SLA e Historial
-- Motor: SQLite (node:sqlite nativo de Node.js / compatible con better-sqlite3)
-- ============================================================================

PRAGMA foreign_keys = ON;

-- ----------------------------------------------------------------------------
-- 1. Tabla: agentes
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS agentes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    area TEXT NOT NULL,
    activo INTEGER NOT NULL DEFAULT 1 CHECK (activo IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ----------------------------------------------------------------------------
-- 2. Tabla: clientes
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS clientes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    telefono TEXT,
    empresa TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ----------------------------------------------------------------------------
-- 3. Tabla: tickets
-- Estados válidos: 'abierto', 'en progreso', 'resuelto', 'cerrado'
-- Prioridades válidas: 'baja', 'media', 'alta'
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo TEXT NOT NULL,
    descripcion TEXT NOT NULL,
    cliente_id INTEGER NOT NULL,
    agente_id INTEGER,
    area TEXT NOT NULL,
    estado TEXT NOT NULL DEFAULT 'abierto' CHECK (estado IN ('abierto', 'en progreso', 'resuelto', 'cerrado')),
    prioridad TEXT NOT NULL CHECK (prioridad IN ('baja', 'media', 'alta')),
    fecha_limite TEXT NOT NULL,
    fecha_resolucion TEXT,
    fecha_creacion TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE RESTRICT,
    FOREIGN KEY (agente_id) REFERENCES agentes(id) ON DELETE RESTRICT
);

-- ----------------------------------------------------------------------------
-- 4. Tabla: comentarios
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS comentarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_id INTEGER NOT NULL,
    autor_tipo TEXT NOT NULL CHECK (autor_tipo IN ('agente', 'cliente')),
    autor_id INTEGER NOT NULL,
    contenido TEXT NOT NULL,
    es_resolucion INTEGER NOT NULL DEFAULT 0 CHECK (es_resolucion IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE RESTRICT
);

-- ----------------------------------------------------------------------------
-- 5. Tabla: historial
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS historial (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_id INTEGER NOT NULL,
    tipo_evento TEXT NOT NULL CHECK (tipo_evento IN ('creacion', 'cambio_estado', 'cambio_agente', 'comentario_resolucion')),
    campo TEXT NOT NULL,
    valor_anterior TEXT,
    valor_nuevo TEXT,
    autor_id INTEGER,
    detalles TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE RESTRICT
);

-- ----------------------------------------------------------------------------
-- Índices para Optimización de Consultas, Asignación y Métricas
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_tickets_estado ON tickets(estado);
CREATE INDEX IF NOT EXISTS idx_tickets_fecha_limite ON tickets(fecha_limite);
CREATE INDEX IF NOT EXISTS idx_tickets_agente_id ON tickets(agente_id);
CREATE INDEX IF NOT EXISTS idx_tickets_cliente_id ON tickets(cliente_id);
CREATE INDEX IF NOT EXISTS idx_agentes_area_activo ON agentes(area, activo);
CREATE INDEX IF NOT EXISTS idx_comentarios_ticket ON comentarios(ticket_id);
CREATE INDEX IF NOT EXISTS idx_historial_ticket ON historial(ticket_id);
