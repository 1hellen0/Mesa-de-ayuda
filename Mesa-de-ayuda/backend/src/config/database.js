/**
 * Conexión Centralizada de Base de Datos SQLite
 * Utiliza el motor nativo SQLite de Node.js (DatabaseSync) garantizando:
 * 1. Cero dependencias nativas o problemas de compilación en Windows / Node 24.
 * 2. Soporte de claves foráneas (PRAGMA foreign_keys = ON).
 * 3. Interfaz idéntica a better-sqlite3 (prepare, all, get, run, exec, transaction).
 */

import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { config } from './environment.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Asegurar que la carpeta database exista
const dbDir = path.resolve(__dirname, '../../database');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.isAbsolute(config.databasePath)
  ? config.databasePath
  : path.resolve(__dirname, '../../', config.databasePath);

const db = new DatabaseSync(dbPath);

// Activar claves foráneas estrictas
db.exec('PRAGMA foreign_keys = ON;');

// Helper para emular db.transaction(fn) de better-sqlite3
db.transaction = function (fn) {
  return function (...args) {
    db.exec('BEGIN TRANSACTION');
    try {
      const result = fn(...args);
      db.exec('COMMIT');
      return result;
    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }
  };
};

export default db;
