# Bitácora de Uso de IA - Proyecto Mesa de Ayuda con SLA e Historial

## Registro de Sesiones y Decisiones Técnicas

### Sesión 1: Definición de Arquitectura y Configuración Inicial
- **Fecha:** 2026-10-21
- **Objetivo:** Definir la arquitectura limpia del monorepo (`backend/` y `frontend/`), esquema de base de datos relacional y flujo de automatización con n8n.
- **Herramienta / Modelo:** Antigravity (AI Senior Software Architect).
- **Decisiones Clave Acordadas:**
  1. Base de datos: **SQLite** con `better-sqlite3` por portabilidad y ejecución local sin dependencias externas en el plazo de 48 horas.
  2. Integración n8n: Frontend invocará directamente el webhook del AI Agent (DeepSeek) para cumplir de forma estricta la consigna académica.
  3. Estados normalizados: `'abierto'`, `'en progreso'`, `'resuelto'`, `'cerrado'`.
  4. SLA: Alta (4h), Media (24h), Baja (72h), persistido en el campo `fecha_limite`.
  5. Asignación automática: Agente activo del área correspondiente con menor número de tickets en estado abierto o en progreso.
  6. Manejo de Errores: `400 Bad Request` para validaciones sintácticas y `409 Conflict` para violaciones de reglas de negocio (ej. transiciones inválidas, resolver sin comentario). Formato: `{ "error": "mensaje" }`.
- **Estructura de Base de Datos Diseñada:**
  - `backend/database/schema.sql`: Tablas `agentes`, `clientes`, `tickets`, `comentarios`, `historial`, con claves foráneas, restricciones `CHECK`, índices y triggers de actualización.
  - `backend/database/seeds.sql`: Datos iniciales con agentes por área, clientes y tickets en distintos estados y prioridades.
