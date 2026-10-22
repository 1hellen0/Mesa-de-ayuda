import db from '../config/database.js';

export const agentRepository = {
  findAll({ activo, area } = {}) {
    let sql = 'SELECT id, nombre, email, area, activo, created_at FROM agentes WHERE 1=1';
    const params = [];

    if (activo !== undefined && activo !== null) {
      sql += ' AND activo = ?';
      params.push(Number(activo));
    }
    if (area) {
      sql += ' AND area = ?';
      params.push(area);
    }
    sql += ' ORDER BY id ASC';

    return db.prepare(sql).all(...params);
  },

  findById(id) {
    return db.prepare('SELECT id, nombre, email, area, activo, created_at FROM agentes WHERE id = ?').get(id);
  },

  findByEmail(email) {
    return db.prepare('SELECT id, nombre, email, area, activo, created_at FROM agentes WHERE email = ?').get(email);
  },

  create({ nombre, email, area, activo = 1 }) {
    const stmt = db.prepare(`
      INSERT INTO agentes (nombre, email, area, activo)
      VALUES (?, ?, ?, ?)
    `);
    const result = stmt.run(nombre, email, area, activo);
    return this.findById(Number(result.lastInsertRowid));
  },

  update(id, fields) {
    const allowed = ['nombre', 'email', 'area', 'activo'];
    const updates = [];
    const params = [];

    for (const key of allowed) {
      if (fields[key] !== undefined) {
        updates.push(`${key} = ?`);
        params.push(fields[key]);
      }
    }

    if (updates.length === 0) return this.findById(id);

    params.push(id);
    const sql = `UPDATE agentes SET ${updates.join(', ')} WHERE id = ?`;
    db.prepare(sql).run(...params);
    return this.findById(id);
  },

  delete(id) {
    const result = db.prepare('DELETE FROM agentes WHERE id = ?').run(id);
    return result.changes > 0;
  },

  /**
   * Asignación automática:
   * Agente activo de la misma área con la menor carga de tickets abiertos ('abierto', 'en progreso').
   * Resuelve empates con el ID menor de forma determinista.
   */
  findAvailableWithLeastLoad(area) {
    const sql = `
      SELECT a.id, a.nombre, a.email, a.area, a.activo,
             COUNT(t.id) AS tickets_en_curso
      FROM agentes a
      LEFT JOIN tickets t ON t.agente_id = a.id AND t.estado IN ('abierto', 'en progreso')
      WHERE a.area = ? AND a.activo = 1
      GROUP BY a.id, a.nombre, a.email, a.area, a.activo
      ORDER BY tickets_en_curso ASC, a.id ASC
      LIMIT 1
    `;
    return db.prepare(sql).get(area);
  }
};
