import db from '../config/database.js';

export const ticketRepository = {
  findAll({ estado, prioridad, area, agente_id, cliente_id, q, sortBy = 'created_at', order = 'desc' } = {}) {
    let sql = `
      SELECT t.id, t.titulo, t.descripcion, t.cliente_id, t.agente_id, t.area,
             t.estado, t.prioridad, t.fecha_limite, t.fecha_resolucion,
             t.created_at, t.updated_at,
             c.nombre AS cliente_nombre, c.email AS cliente_email, c.empresa AS cliente_empresa,
             a.nombre AS agente_nombre, a.email AS agente_email,
             CASE
               WHEN t.estado IN ('abierto', 'en progreso') AND t.fecha_limite < datetime('now') THEN 1
               ELSE 0
             END AS es_vencido
      FROM tickets t
      JOIN clientes c ON t.cliente_id = c.id
      LEFT JOIN agentes a ON t.agente_id = a.id
      WHERE 1=1
    `;
    const params = [];

    if (estado) {
      sql += ' AND t.estado = ?';
      params.push(estado);
    }
    if (prioridad) {
      sql += ' AND t.prioridad = ?';
      params.push(prioridad);
    }
    if (area) {
      sql += ' AND t.area = ?';
      params.push(area);
    }
    if (agente_id) {
      sql += ' AND t.agente_id = ?';
      params.push(Number(agente_id));
    }
    if (cliente_id) {
      sql += ' AND t.cliente_id = ?';
      params.push(Number(cliente_id));
    }
    if (q) {
      sql += ' AND (t.titulo LIKE ? OR t.descripcion LIKE ? OR c.nombre LIKE ?)';
      const term = `%${q}%`;
      params.push(term, term, term);
    }

    // Whitelist para ordenamiento seguro
    const allowedSort = {
      created_at: 't.created_at',
      fecha_limite: 't.fecha_limite',
      prioridad: 't.prioridad',
      estado: 't.estado',
      id: 't.id'
    };
    const sortCol = allowedSort[sortBy] || 't.created_at';
    const sortOrder = order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    sql += ` ORDER BY ${sortCol} ${sortOrder}, t.id DESC`;

    return db.prepare(sql).all(...params);
  },

  findById(id) {
    const sql = `
      SELECT t.id, t.titulo, t.descripcion, t.cliente_id, t.agente_id, t.area,
             t.estado, t.prioridad, t.fecha_limite, t.fecha_resolucion,
             t.created_at, t.updated_at,
             c.nombre AS cliente_nombre, c.email AS cliente_email, c.empresa AS cliente_empresa,
             a.nombre AS agente_nombre, a.email AS agente_email,
             CASE
               WHEN t.estado IN ('abierto', 'en progreso') AND t.fecha_limite < datetime('now') THEN 1
               ELSE 0
             END AS es_vencido
      FROM tickets t
      JOIN clientes c ON t.cliente_id = c.id
      LEFT JOIN agentes a ON t.agente_id = a.id
      WHERE t.id = ?
    `;
    return db.prepare(sql).get(id);
  },

  create({ titulo, descripcion, cliente_id, agente_id = null, area, estado = 'abierto', prioridad, fecha_limite }) {
    const stmt = db.prepare(`
      INSERT INTO tickets (titulo, descripcion, cliente_id, agente_id, area, estado, prioridad, fecha_limite, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `);
    const result = stmt.run(titulo, descripcion, cliente_id, agente_id, area, estado, prioridad, fecha_limite);
    return this.findById(Number(result.lastInsertRowid));
  },

  update(id, fields) {
    const allowed = ['titulo', 'descripcion', 'area', 'prioridad', 'agente_id'];
    const updates = [];
    const params = [];

    for (const key of allowed) {
      if (fields[key] !== undefined) {
        updates.push(`${key} = ?`);
        params.push(fields[key]);
      }
    }

    if (updates.length === 0) return this.findById(id);

    updates.push("updated_at = datetime('now')");
    params.push(id);
    const sql = `UPDATE tickets SET ${updates.join(', ')} WHERE id = ?`;
    db.prepare(sql).run(...params);
    return this.findById(id);
  },

  updateStatus(id, estado, fechaResolucion = null) {
    const sql = `
      UPDATE tickets
      SET estado = ?,
          fecha_resolucion = ?,
          updated_at = datetime('now')
      WHERE id = ?
    `;
    db.prepare(sql).run(estado, fechaResolucion, id);
    return this.findById(id);
  }
};
