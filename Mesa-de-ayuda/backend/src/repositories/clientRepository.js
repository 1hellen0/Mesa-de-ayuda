import db from '../config/database.js';

export const clientRepository = {
  findAll() {
    return db.prepare('SELECT id, nombre, email, telefono, empresa, created_at FROM clientes ORDER BY id ASC').all();
  },

  findById(id) {
    return db.prepare('SELECT id, nombre, email, telefono, empresa, created_at FROM clientes WHERE id = ?').get(id);
  },

  findByEmail(email) {
    return db.prepare('SELECT id, nombre, email, telefono, empresa, created_at FROM clientes WHERE email = ?').get(email);
  },

  create({ nombre, email, telefono = null, empresa = null }) {
    const stmt = db.prepare(`
      INSERT INTO clientes (nombre, email, telefono, empresa)
      VALUES (?, ?, ?, ?)
    `);
    const result = stmt.run(nombre, email, telefono, empresa);
    return this.findById(Number(result.lastInsertRowid));
  },

  update(id, fields) {
    const allowed = ['nombre', 'email', 'telefono', 'empresa'];
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
    const sql = `UPDATE clientes SET ${updates.join(', ')} WHERE id = ?`;
    db.prepare(sql).run(...params);
    return this.findById(id);
  },

  delete(id) {
    const result = db.prepare('DELETE FROM clientes WHERE id = ?').run(id);
    return result.changes > 0;
  }
};
