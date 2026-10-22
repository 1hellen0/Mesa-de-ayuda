import db from '../config/database.js';

export const historyRepository = {
  findByTicketId(ticketId) {
    const sql = `
      SELECT h.id, h.ticket_id, h.tipo_evento, h.campo, h.valor_anterior, h.valor_nuevo,
             h.autor_id, h.detalles, h.created_at,
             a.nombre AS autor_nombre
      FROM historial h
      LEFT JOIN agentes a ON h.autor_id = a.id
      WHERE h.ticket_id = ?
      ORDER BY h.created_at ASC, h.id ASC
    `;
    return db.prepare(sql).all(ticketId);
  },

  create({ ticket_id, tipo_evento, campo, valor_anterior = null, valor_nuevo = null, autor_id = null, detalles = null }) {
    const stmt = db.prepare(`
      INSERT INTO historial (ticket_id, tipo_evento, campo, valor_anterior, valor_nuevo, autor_id, detalles)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(ticket_id, tipo_evento, campo, valor_anterior, valor_nuevo, autor_id, detalles);
    return db.prepare('SELECT * FROM historial WHERE id = ?').get(Number(result.lastInsertRowid));
  }
};
