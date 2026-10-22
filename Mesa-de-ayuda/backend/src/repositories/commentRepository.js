import db from '../config/database.js';

export const commentRepository = {
  findByTicketId(ticketId) {
    const sql = `
      SELECT c.id, c.ticket_id, c.autor_tipo, c.autor_id, c.contenido, c.es_resolucion, c.created_at,
             CASE
               WHEN c.autor_tipo = 'agente' THEN a.nombre
               WHEN c.autor_tipo = 'cliente' THEN cl.nombre
               ELSE 'Desconocido'
             END AS autor_nombre
      FROM comentarios c
      LEFT JOIN agentes a ON c.autor_tipo = 'agente' AND c.autor_id = a.id
      LEFT JOIN clientes cl ON c.autor_tipo = 'cliente' AND c.autor_id = cl.id
      WHERE c.ticket_id = ?
      ORDER BY c.created_at ASC, c.id ASC
    `;
    return db.prepare(sql).all(ticketId);
  },

  findById(id) {
    return db.prepare('SELECT id, ticket_id, autor_tipo, autor_id, contenido, es_resolucion, created_at FROM comentarios WHERE id = ?').get(id);
  },

  create({ ticket_id, autor_tipo, autor_id, contenido, es_resolucion = 0 }) {
    const stmt = db.prepare(`
      INSERT INTO comentarios (ticket_id, autor_tipo, autor_id, contenido, es_resolucion)
      VALUES (?, ?, ?, ?, ?)
    `);
    const result = stmt.run(ticket_id, autor_tipo, autor_id, contenido, es_resolucion ? 1 : 0);
    return this.findById(Number(result.lastInsertRowid));
  }
};
