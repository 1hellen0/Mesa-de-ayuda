/**
 * Script de Verificación de Integridad y Reglas de Negocio en SQLite
 * Valida:
 * 1. Restricciones CHECK de estados y prioridades.
 * 2. Integridad de Claves Foráneas.
 * 3. Consulta de Asignación Automática (menor carga por área).
 * 4. Consulta SQL de Agregación para GET /api/resumen.
 * 5. Rollback en Transacciones Atómicas.
 */

import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, 'mesa.db');

const db = new DatabaseSync(dbPath);
db.exec('PRAGMA foreign_keys = ON;');

console.log('--- INICIANDO SUITE DE PRUEBAS DE BASE DE DATOS ---');

let passedTests = 0;
let totalTests = 0;

function assert(condition, description) {
  totalTests++;
  if (condition) {
    console.log(`  [PASS] Test ${totalTests}: ${description}`);
    passedTests++;
  } else {
    console.error(`  [FAIL] Test ${totalTests}: ${description}`);
    process.exitCode = 1;
  }
}

// 1. Validar que no se permiten estados inválidos en tickets
try {
  db.prepare(`
    INSERT INTO tickets (titulo, descripcion, cliente_id, area, estado, prioridad, fecha_limite)
    VALUES ('Test', 'Desc', 1, 'Soporte Técnico', 'estado_invalido', 'alta', datetime('now'))
  `).run();
  assert(false, 'Debe rechazar estado no permitido en tickets');
} catch (error) {
  assert(error.message.includes('CHECK constraint failed'), 'Restricción CHECK de estados de tickets validada');
}

// 2. Validar que no se permiten prioridades inválidas
try {
  db.prepare(`
    INSERT INTO tickets (titulo, descripcion, cliente_id, area, estado, prioridad, fecha_limite)
    VALUES ('Test', 'Desc', 1, 'Soporte Técnico', 'abierto', 'urgente_no_permitida', datetime('now'))
  `).run();
  assert(false, 'Debe rechazar prioridad no permitida');
} catch (error) {
  assert(error.message.includes('CHECK constraint failed'), 'Restricción CHECK de prioridades validada');
}

// 3. Validar Clave Foránea en tickets -> clientes
try {
  db.prepare(`
    INSERT INTO tickets (titulo, descripcion, cliente_id, area, estado, prioridad, fecha_limite)
    VALUES ('Test', 'Desc', 9999, 'Soporte Técnico', 'abierto', 'alta', datetime('now'))
  `).run();
  assert(false, 'Debe rechazar cliente_id inexistente');
} catch (error) {
  assert(error.message.includes('FOREIGN KEY constraint failed'), 'Integridad referencial de cliente_id validada');
}

// 4. Probar Query de Asignación Automática:
// "Agente activo del área correspondiente con menor número de tickets abiertos/en progreso"
const targetArea = 'Soporte Técnico';
const autoAssignQuery = `
  SELECT a.id, a.nombre, a.area, COUNT(t.id) AS tickets_en_curso
  FROM agentes a
  LEFT JOIN tickets t ON t.agente_id = a.id AND t.estado IN ('abierto', 'en progreso')
  WHERE a.area = ? AND a.activo = 1
  GROUP BY a.id, a.nombre, a.area
  ORDER BY tickets_en_curso ASC, a.id ASC
  LIMIT 1
`;
const assignedAgent = db.prepare(autoAssignQuery).get(targetArea);
assert(assignedAgent && assignedAgent.area === targetArea, 'Query de asignación automática encuentra agente activo idóneo');
console.log(`         -> Agente seleccionado para '${targetArea}': ${assignedAgent.nombre} (Carga: ${assignedAgent.tickets_en_curso} tickets)`);

// 5. Probar Query de Métricas Agregadas en SQL para GET /api/resumen
const summaryQuery = `
  SELECT
    COUNT(*) AS total_tickets,
    SUM(CASE WHEN estado = 'abierto' THEN 1 ELSE 0 END) AS tickets_abiertos,
    SUM(CASE WHEN estado = 'en progreso' THEN 1 ELSE 0 END) AS tickets_en_progreso,
    SUM(CASE WHEN estado = 'resuelto' THEN 1 ELSE 0 END) AS tickets_resueltos,
    SUM(CASE WHEN estado = 'cerrado' THEN 1 ELSE 0 END) AS tickets_cerrados,
    SUM(CASE WHEN estado IN ('abierto', 'en progreso') AND fecha_limite < datetime('now') THEN 1 ELSE 0 END) AS tickets_vencidos,
    SUM(CASE WHEN estado = 'resuelto' AND fecha_resolucion <= fecha_limite THEN 1 ELSE 0 END) AS resueltos_en_sla,
    ROUND(
      CAST(SUM(CASE WHEN estado = 'resuelto' AND fecha_resolucion <= fecha_limite THEN 1 ELSE 0 END) AS REAL) * 100.0 /
      NULLIF(SUM(CASE WHEN estado = 'resuelto' THEN 1 ELSE 0 END), 0),
      1
    ) AS porcentaje_cumplimiento_sla
  FROM tickets;
`;
const summary = db.prepare(summaryQuery).get();
assert(summary.total_tickets === 5, 'Query de resumen SQL calcula total de tickets correctamente');
assert(summary.tickets_vencidos === 1, 'Query de resumen detecta correctamente 1 ticket vencido');
console.log('         -> Métricas calculadas en SQL:', summary);

// 6. Validar que NO se permite borrar un agente con tickets asignados (ON DELETE RESTRICT)
try {
  db.prepare('DELETE FROM agentes WHERE id = 1').run();
  assert(false, 'Debe impedir el borrado de un agente con tickets históricos');
} catch (error) {
  assert(error.message.includes('FOREIGN KEY constraint failed'), 'ON DELETE RESTRICT en agentes(id) validado correctamente (no permite orfandad)');
}

// 7. Validar que NO se permite borrar un ticket con comentarios o historial (ON DELETE RESTRICT)
try {
  db.prepare('DELETE FROM tickets WHERE id = 1').run();
  assert(false, 'Debe impedir el borrado de un ticket con comentarios o historial');
} catch (error) {
  assert(error.message.includes('FOREIGN KEY constraint failed'), 'ON DELETE RESTRICT en tickets(id) validado correctamente (auditoría protegida)');
}

// 8. Probar Atomicidad Transaccional (Rollback ante fallo)
const ticketBefore = db.prepare('SELECT estado FROM tickets WHERE id = 1').get();
try {
  db.exec('BEGIN TRANSACTION');
  db.prepare("UPDATE tickets SET estado = 'en progreso' WHERE id = 1").run();
  // Provocar fallo intencional en la misma transacción (FK inválida)
  db.prepare("INSERT INTO comentarios (ticket_id, autor_tipo, autor_id, contenido) VALUES (9999, 'agente', 1, 'Fallo')").run();
  db.exec('COMMIT');
} catch (error) {
  db.exec('ROLLBACK');
}
const ticketAfter = db.prepare('SELECT estado FROM tickets WHERE id = 1').get();
assert(ticketBefore.estado === ticketAfter.estado, 'Rollback transaccional conserva el estado original ante fallos');

console.log(`\n============================================================`);
console.log(`  RESULTADO: ${passedTests} de ${totalTests} pruebas de base de datos aprobadas exitosamente.`);
console.log(`============================================================\n`);
db.close();
