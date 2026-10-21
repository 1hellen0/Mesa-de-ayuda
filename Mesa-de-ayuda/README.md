# Mesa de Ayuda con SLA e Historial

Sistema de gestión de tickets de soporte técnico con control de SLA (Acuerdo de Nivel de Servicio), asignación automática por carga y área, trazabilidad mediante historial de auditoría y sugerencias de IA vía n8n con DeepSeek.

## Arquitectura del Proyecto

El repositorio está organizado como un monorepo desacoplado con dos aplicaciones principales:

- **`backend/`**: API REST construida con Node.js, Express y base de datos relacional SQLite (`better-sqlite3`). Implementa arquitectura por capas:
  - Rutas (`routes/`)
  - Controladores (`controllers/`)
  - Servicios de negocio (`services/`)
  - Repositorios de datos (`repositories/`)
  - Validadores (`validators/`)
  - Middlewares (`middlewares/`)
- **`frontend/`**: Aplicación web SPA con React, Vite, Tailwind CSS y React Router DOM.
- **`docs/`**: Documentación técnica, diseño de base de datos y colección de Postman (`docs/postman/mesa-de-ayuda.postman_collection.json`).
- **`n8n/`**: Flujo de automatización para el nodo AI Agent con DeepSeek (`n8n/workflows/ticket-ai-agent-workflow.json`).
- **`prompts/`**: Bitácora de ingeniería de prompts y decisiones con IA (`prompts/BITACORA_IA.md`).

## Entidades y Reglas de Negocio

1. **Entidades Principales**: `agentes`, `clientes`, `tickets`, `comentarios`, `historial`.
2. **Estados Permitidos**: `'abierto'`, `'en progreso'`, `'resuelto'`, `'cerrado'`.
3. **SLA por Prioridad**:
   - **Alta**: 4 horas (`fecha_limite = fecha_creacion + 4h`).
   - **Media**: 24 horas (`fecha_limite = fecha_creacion + 24h`).
   - **Baja**: 72 horas (`fecha_limite = fecha_creacion + 72h`).
4. **Asignación Automática**: Agente activo del área correspondiente con menor número de tickets en estado `'abierto'` o `'en progreso'`.
5. **Transiciones e Historial**:
   - Todo cambio de estado o agente genera una entrada en la tabla `historial`.
   - Para transicionar al estado `'resuelto'`, es obligatorio adjuntar un comentario explicativo.
   - Operaciones que tocan múltiples tablas se ejecutan bajo transacciones atómicas.
6. **Métricas en SQL**: Endpoint obligatorio `GET /api/resumen` con agregaciones nativas (tickets por estado, cumplimiento de SLA y tiempos promedio).
7. **Códigos HTTP Estándar**:
   - `200`: Éxito / lectura / actualización.
   - `201`: Creación exitosa.
   - `400`: Error de validación de sintaxis o payload. Formato: `{ "error": "mensaje" }`.
   - `404`: Recurso no encontrado. Formato: `{ "error": "mensaje" }`.
   - `409`: Conflicto de negocio (transición inválida, falta de comentario al resolver). Formato: `{ "error": "mensaje" }`.

## Guía Rápida de Instalación y Verificación

### Inicialización de Base de Datos
```bash
cd backend
npm install
npm run db:init
```
Este comando ejecuta `database/schema.sql` y `database/seeds.sql` en `database/mesa.db`.
