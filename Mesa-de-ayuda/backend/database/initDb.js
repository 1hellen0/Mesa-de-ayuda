import { DatabaseSync } from 'node:sqlite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, 'mesa.db');
const schemaPath = path.resolve(__dirname, 'schema.sql');
const seedsPath = path.resolve(__dirname, 'seeds.sql');

console.log('============================================================');
console.log('   INICIALIZACIÓN DE BASE DE DATOS SQLITE (MESA DE AYUDA)   ');
console.log('============================================================');
console.log(`Archivo de base de datos: ${dbPath}`);

try {
  // Eliminar BD anterior si existe para garantizar un estado limpio reproducible
  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
    console.log('[OK] Base de datos previa eliminada para estado limpio.');
  }

  const db = new DatabaseSync(dbPath);
  db.exec('PRAGMA foreign_keys = ON;');

  console.log('[1/4] Ejecutando schema.sql...');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schemaSql);
  console.log('      -> Tablas, restricciones e índices creados.');

  console.log('[2/4] Ejecutando seeds.sql...');
  const seedsSql = fs.readFileSync(seedsPath, 'utf8');
  db.exec(seedsSql);
  console.log('      -> Datos de prueba iniciales insertados.');

  console.log('[3/4] Verificando conteos en las cinco entidades:');
  const counts = [
    { Entidad: 'agentes', Registros: db.prepare('SELECT COUNT(*) as c FROM agentes').get().c },
    { Entidad: 'clientes', Registros: db.prepare('SELECT COUNT(*) as c FROM clientes').get().c },
    { Entidad: 'tickets', Registros: db.prepare('SELECT COUNT(*) as c FROM tickets').get().c },
    { Entidad: 'comentarios', Registros: db.prepare('SELECT COUNT(*) as c FROM comentarios').get().c },
    { Entidad: 'historial', Registros: db.prepare('SELECT COUNT(*) as c FROM historial').get().c }
  ];
  console.table(counts);

  console.log('[4/4] Verificando integridad referencial (Foreign Keys):');
  const fkViolations = db.prepare('PRAGMA foreign_key_check').all();
  if (fkViolations.length === 0) {
    console.log('      -> Integridad referencial perfecta (0 violaciones de FK).');
  } else {
    console.error('      -> ERROR: Violaciones de clave foránea encontradas:', fkViolations);
    process.exit(1);
  }

  console.log('\n[ÉXITO] Base de datos inicializada y validada correctamente.\n');
  db.close();
} catch (error) {
  console.error('\n[ERROR FATAL] Fallo en la inicialización de la base de datos:\n', error);
  process.exit(1);
}
