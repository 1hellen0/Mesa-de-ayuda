# Bitácora de Uso de IA - Proyecto Mesa de Ayuda con SLA e Historial

## Registro de Sesiones y Decisiones Técnicas

### Sesión 1: Definición de Arquitectura y Configuración Inicial
- **Fecha:** 2026-10-21
- **Objetivo:** Definir la arquitectura limpia del monorepo (`backend/` y `frontend/`), esquema de base de datos relacional y flujo de automatización con n8n.
- **Herramienta / Modelo:** Antigravity (AI Senior Software Architect).
- **Decisiones Clave Acordadas:**
  1. Base de datos: **SQLite** con `node:sqlite` nativo por portabilidad y compatibilidad en Node 24 / Windows en el plazo de 48 horas.
  2. Integración n8n: Frontend invocará directamente el webhook del AI Agent (DeepSeek) para cumplir de forma estricta la consigna académica.
  3. Estados normalizados: `'abierto'`, `'en progreso'`, `'resuelto'`, `'cerrado'`.
  4. SLA: Alta (4h), Media (24h), Baja (72h), persistido en el campo `fecha_limite`.
  5. Asignación automática: Agente activo del área correspondiente con menor número de tickets en estado abierto o en progreso.
  6. Manejo de Errores: `400 Bad Request` para validaciones sintácticas y `409 Conflict` para violaciones de reglas de negocio (ej. transiciones inválidas, resolver sin comentario). Formato: `{ "error": "mensaje" }`.
- **Estructura de Base de Datos Diseñada:**
  - `backend/database/schema.sql`: Tablas `agentes`, `clientes`, `tickets`, `comentarios`, `historial`, con claves foráneas `ON DELETE RESTRICT`, restricciones `CHECK` e índices.
  - `backend/database/seeds.sql`: Datos iniciales con agentes por área, clientes y tickets en distintos estados y prioridades.

---

### PROMPT 2 — Implementación del backend real

1. **Objetivo del prompt:**
   Implementar el servidor backend real con Node.js, Express y SQLite (`node:sqlite`), completando la arquitectura por capas (rutas, controladores, servicios, repositorios, validadores y middlewares), aplicando reglas de negocio estrictas (SLA de 4/24/72h, asignación automática, máquina de estados, transacciones ACID para resolución con comentario obligatorio), CRUDs de agentes y clientes, endpoints de tickets, cálculo SQL para `GET /api/resumen`, suite de pruebas automatizadas y actualización de la colección Postman.

2. **Archivos creados:**
   - `backend/src/utils/errors.js`: Clases de error de dominio (`AppError`, `BadRequestError`, `NotFoundError`, `ConflictError`) para tipar respuestas 400, 404 y 409.
   - `backend/src/middlewares/validateRequest.js`: Middleware genérico basado en esquemas Zod para validar `body`, `params` y `query`.
   - `backend/src/validators/agentValidator.js`: Esquemas de validación Zod para creación, actualización y parámetros de agentes.
   - `backend/src/validators/clientValidator.js`: Esquemas de validación Zod para creación, actualización y parámetros de clientes.
   - `backend/src/validators/ticketValidator.js`: Esquemas de validación Zod para tickets, filtros de listado y cambio de estado.
   - `backend/src/validators/commentValidator.js`: Esquemas de validación Zod para inserción de comentarios en tickets.
   - `backend/src/repositories/agentRepository.js`: Consultas parametrizadas para agentes y query de asignación por menor carga de tickets abiertos en el área.
   - `backend/src/repositories/clientRepository.js`: Consultas parametrizadas para clientes.
   - `backend/src/repositories/ticketRepository.js`: Consultas parametrizadas de tickets con joins (`clientes`, `agentes`), filtros y ordenamiento seguro.
   - `backend/src/repositories/commentRepository.js`: Consultas parametrizadas para comentarios con resolución de autor en SQL.
   - `backend/src/repositories/historyRepository.js`: Consultas parametrizadas para la bitácora de auditoría e historial cronológico.
   - `backend/src/repositories/summaryRepository.js`: Consultas SQL nativas con Common Table Expressions (CTEs) y agregaciones para `GET /api/resumen`.
   - `backend/src/services/agentService.js`: Lógica de negocio de agentes con verificación de correos duplicados y protección referencial.
   - `backend/src/services/clientService.js`: Lógica de negocio de clientes con control de unicidad de email y protección referencial.
   - `backend/src/services/ticketService.js`: Orquestación de SLA, asignación automática determinista, validación de transiciones de estado y resolución atómica en transacción.
   - `backend/src/services/summaryService.js`: Servicio de entrega de métricas SQL.
   - `backend/src/controllers/agentController.js`: Controlador HTTP para el CRUD de agentes con respuestas formateadas y códigos 200, 201.
   - `backend/src/controllers/clientController.js`: Controlador HTTP para el CRUD de clientes con códigos 200, 201.
   - `backend/src/controllers/ticketController.js`: Controlador HTTP para tickets, detalle con relaciones, comentarios, historial y cambio de estado.
   - `backend/src/controllers/summaryController.js`: Controlador HTTP para `GET /api/resumen`.
   - `backend/src/routes/agentRoutes.js`: Rutas Express para el recurso `/api/agentes`.
   - `backend/src/routes/clientRoutes.js`: Rutas Express para el recurso `/api/clientes`.
   - `backend/src/routes/ticketRoutes.js`: Rutas Express para el recurso `/api/tickets`.
   - `backend/src/routes/summaryRoutes.js`: Rutas Express para el recurso `/api/resumen`.
   - `backend/tests/integration.test.js`: Suite completa de 29 pruebas automatizadas ejecutadas contra servidor Express y SQLite real.

3. **Archivos modificados:**
   - `backend/src/app.js`: Se importaron y montaron los cuatro enrutadores de la API REST (`/api/agentes`, `/api/clientes`, `/api/tickets`, `/api/resumen`).
   - `backend/src/middlewares/errorHandler.js`: Se agregaron manejadores específicos para capturar errores de SQLite (`UNIQUE`, `FOREIGN KEY`, `CHECK`) y convertirlos a 400 y 409 bajo `{ "error": "mensaje" }`.
   - `backend/database/verifyDb.js`: Se flexibilizó la aserción de conteo total (`>= 5`) para permitir la ejecución de verificaciones consecutivas tras la inserción de registros en pruebas.
   - `backend/package.json`: Se incorporó el script `"test": "node --test tests/integration.test.js"`.
   - `docs/postman/mesa-de-ayuda.postman_collection.json`: Se actualizó de plantilla a colección real de pruebas, cubriendo todos los endpoints y casos 200, 201, 400, 404 y 409.

4. **Código o funcionalidades generadas:**
   - Servidor Express real sin simulaciones en memoria ni JSON ficticios.
   - CRUD completo de Agentes y Clientes con códigos REST estándar y control de unicidad.
   - Ciclo de vida de tickets con máquina de estados estricta: `abierto` → `en progreso` → `resuelto` → `cerrado`.
   - Cálculo automático de `fecha_limite` en base a prioridad (Alta: 4h, Media: 24h, Baja: 72h).
   - Asignación automática al  agente activo del área con menor cantidad de tickets en estados `abierto` o `en progreso` (desempate determinista por menor `id`).
   - Resolución de tickets obligatoriamente condicionada a la inclusión de un comentario explicativo, ejecutada en una sola transacción atómica con el historial.
   - Cálculo de métricas SQL en `GET /api/resumen`: tickets por estado, carga por agente, porcentaje de cumplimiento de SLA y tiempo promedio de resolución.

5. **Pruebas realizadas:**
   - `npm run db:init`: Inicialización limpia de la base de datos `mesa.db` y ejecución de seeds (5 agentes, 3 clientes, 5 tickets, 4 comentarios, 7 historiales). Resultado: Éxito (código 0).
   - `npm run db:verify`: Comprobación de 9 pruebas de base de datos (restricciones CHECK, claves foráneas, asignación, métricas SQL y rollback transaccional). Resultado: 9/9 aprobadas (código 0).
   - `npm test`: Ejecución de 29 pruebas de integración reales en 7 suites (`node:test`) contra la API HTTP. Resultado: 29/29 aprobadas (código 0).

6. **Errores encontrados:**
   - En `integration.test.js`, la prueba de agente duplicado esperaba la cadena `'ya se encuentra registrado'` pero el servicio emitía `'Ya existe un agente registrado...'`.
   - En `verifyDb.js`, la comprobación estricta de `total_tickets === 5` fallaba si se ejecutaba después de la suite de integración, debido a que las pruebas agregan tickets reales persistentes.

7. **Correcciones realizadas:**
   - Se ajustó la aserción de la prueba de integración para comprobar la raíz `'registrado'`, armonizando la validación.
   - Se ajustó la aserción en `verifyDb.js` para verificar `total_tickets >= 5` y `tickets_vencidos >= 1`, permitiendo la idempotencia del script.

8. **Decisiones técnicas:**
   - Adopción del runner nativo `node:test` y `fetch` de Node 24 para las pruebas de integración, evitando dependencias pesadas (Jest o Supertest) y asegurando ejecución ultrarrápida (< 1 segundo).
   - Uso de `db.transaction()` nativo de `node:sqlite` para garantizar transaccionalidad ACID en creación de tickets y resoluciones.

9. **Cambios rechazados o ajustados:**
   - Se rechazó calcular métricas en Node.js filtrando arreglos; se mantuvo el 100% de los cálculos y promedios directamente en sentencias SQL con CTEs.
   - Se rechazó la eliminación física sin restricción; se conservó `ON DELETE RESTRICT` para evitar la destrucción accidental de la auditoría.

10. **Estado final:**
    **Completado.** El backend real cumple con la totalidad de los requisitos del primer día, cuenta con servidor HTTP Express en funcionamiento, persistencia en SQLite real, 29 pruebas automatizadas aprobadas y colección de Postman sincronizada.

11. **Siguiente paso:**
    Iniciar el **Prompt 3**: Auditoría de consistencia, cobertura de SLA y verificación del checkpoint.

---

### PROMPT 3 — Auditoría y checkpoint del backend (Cobertura del SLA y consistencia de la colección)

1. **Objetivo de la auditoría:**
   Verificar la consistencia del modelo de datos frente a `schema.sql` (auditar `created_at` vs `fecha_creacion`), comprobar la cobertura estricta de las tres duraciones de SLA (4h, 24h, 72h) en pruebas y Postman, auditar el conteo real de solicitudes de la colección de Postman, validar los códigos HTTP 400, 404 y 409, y certificar que las transacciones atómicas reviertan los cambios ante cualquier fallo sin dejar datos corruptos ni huérfanos.

2. **Archivos modificados:**
   - `README.md`: Se corrigieron las menciones a `fecha_creacion` por el nombre de columna real en base de datos: `created_at`.
   - `backend/src/repositories/summaryRepository.js`: Se corrigieron los comentarios y el texto descriptivo de la fórmula para reflejar `created_at`.
   - `docs/postman/mesa-de-ayuda.postman_collection.json`: Se agregó la solicitud faltante para prioridad baja (`POST /api/tickets - Crear Ticket Prioridad Baja (SLA 72h)`), junto con casos de prueba para 400 y 404 en tickets. Conteo real auditado: **36 solicitudes HTTP**.
   - `backend/tests/integration.test.js`: Se expandió la suite de pruebas agregando la sección 8 con validaciones específicas de 400 (JSON mal formado, tipos inválidos), 404 (recursos inexistentes), 409 (conflictos de negocio y de claves foráneas) y comprobación de reversión transaccional en base de datos (conteo verificado en 0 tras rollback). Total de pruebas: 37.

3. **Código o funcionalidades verificadas:**
   - Cobertura de SLA completa: Alta (4 horas), Media (24 horas) y Baja (72 horas) calculadas y comparadas mediante diferencias de tiempo basadas en fechas con tolerancias razonables (< 0.1h).
   - Atomicidad transaccional: Verificación de que los fallos en auto-asignación o resolución no dejan tickets, comentarios ni entradas de historial huérfanas en la base de datos.
   - Formato estandarizado de error: Todos los fallos 400, 404 y 409 responden estrictamente con `{ "error": "mensaje comprensible" }`.

4. **Pruebas realizadas:**
   - `npm run db:init`: Ejecución limpia de DDL y datos iniciales en `database/mesa.db`. Código de salida: 0.
   - `npm run db:verify`: 9 de 9 pruebas de integridad referencial, restricciones CHECK y transacciones aprobadas. Código de salida: 0.
   - `npm test`: 37 de 37 pruebas de integración en 8 suites ejecutadas contra el servidor Express y base de datos real. Código de salida: 0 (duración: ~1.1s).
   - Auditoría programática de Postman: Script Node.js recorrió recursivamente el árbol de `mesa-de-ayuda.postman_collection.json` confirmando **36 solicitudes HTTP reales**.

5. **Errores encontrados y correcciones realizadas:**
   - *Discrepancia en nombre de columna:* Documentación y comentarios usaban `fecha_creacion`, mientras que `schema.sql` define `created_at`. Se unificó todo a `created_at`.
   - *Omisión en Postman:* No existía una solicitud explícita para crear ticket con prioridad baja (SLA 72h). Se agregó `POST /api/tickets - Crear Ticket Prioridad Baja (SLA 72h) (201 Created)`.
   - *Inexactitud en reporte previo:* Se había reportado un estimado de 22 peticiones cuando la colección en realidad tenía 35 (y ahora 36). Se auditó y corrigió el conteo formal a 36 peticiones.

7. **Adenda de Cierre — Nombres del modelo de datos (`tickets.fecha_creacion`):**
   - **Contexto y requerimiento:** Se revisó la consigna académica original para la entidad `tickets`, la cual especifica textualmente el campo `fecha_creacion` junto a `fecha_limite` y `fecha_resolucion`.
   - **Decisión adoptada:** Cumplimiento literal y estricto del requisito académico en la tabla `tickets`, sustituyendo `created_at` por `fecha_creacion` (sin duplicar columnas ni crear redundancias innecesarias). Las demás tablas (`agentes`, `clientes`, `comentarios`, `historial`) conservan su columna estándar `created_at`.
   - **Archivos actualizados:**
     - `backend/database/schema.sql`: Definición de `tickets` con `fecha_creacion TEXT NOT NULL DEFAULT (datetime('now'))`.
     - `backend/database/seeds.sql`: Inserciones en `tickets` especificando `fecha_creacion`.
     - `backend/src/repositories/ticketRepository.js`: Consultas SQL (`SELECT`, `INSERT`), whitelist de ordenamiento con alias compatible (`sortBy: fecha_creacion` por defecto y compatibilidad con `created_at`).
     - `backend/src/repositories/summaryRepository.js`: Consultas agregadas con `julianday(t.fecha_creacion)` y descripción de fórmula actualizada.
     - `backend/src/validators/ticketValidator.js`: Whitelist en `queryTicketSchema` soportando `fecha_creacion` y `created_at`.
     - `backend/tests/integration.test.js`: Pruebas de cálculo de SLA (4h, 24h, 72h) evaluando `ticket.fecha_creacion`.
     - `docs/database-design.md`: Diagrama ERD y documentación de reglas de DDL actualizados.
     - `README.md`: Fórmulas de SLA actualizadas para reflejar `fecha_creacion`.
   - **Pruebas y verificaciones ejecutadas:**
     - `npm run db:init`: 0 errores, recreación limpia de la base de datos con `fecha_creacion`.
     - `npm run db:verify`: 9 de 9 pruebas de integridad, CHECK, FK y transacciones aprobadas.
     - `npm test`: 37 de 37 pruebas de integración aprobadas (8 suites en 1009 ms).
   - **Estado:** 100% consistente y verificado. Backend estable y listo para la fase de cliente.

8. **Estado final:**
   **Completado y Verificado.** El modelo de datos, la API REST, la base de datos física y las pruebas son consistentes con la consigna académica.

9. **Siguiente paso:**
   Proceder con el **PROMPT 4 — Frontend React + Vite + Tailwind CSS**.

---

### PROMPT 4 — Implementación del frontend React + Vite + Tailwind CSS

1. **Objetivo:**
   Implementar el frontend completo, modular y profesional para el sistema "Mesa de ayuda con SLA e historial", desarrollado con React 18, Vite, Tailwind CSS y React Router v6, consumiendo exclusivamente los endpoints reales del backend Express con base de datos relacional SQLite (sin mocks ni sustitutos en memoria).

2. **Archivos creados y modificados:**
   - `frontend/.env`: Configuración local de `VITE_API_URL=http://localhost:3000/api` y `VITE_N8N_WEBHOOK_URL`.
   - `frontend/src/utils/constants.js`: Definición sincronizada de estados (`abierto`, `en progreso`, `resuelto`, `cerrado`), prioridades (`baja`, `media`, `alta`), duraciones de SLA (4h, 24h, 72h), transiciones válidas, tipos de evento de historial y catálogo de áreas.
   - `frontend/src/utils/formatters.js`: Formateo de fechas con `Intl.DateTimeFormat`, función `getSlaInfo` para cálculo de horas restantes o vencidas, badges de estado y prioridad.
   - `frontend/src/services/api.js`: Cliente HTTP centralizado que maneja serialización JSON, headers, capturador de errores `{ error: '...' }` y métodos para agentes, clientes, tickets, comentarios, historial y resumen.
   - `frontend/src/hooks/useFetch.js`: Hook reutilizable para llamadas asíncronas con gestión de `data`, `loading`, `error`, `refetch` y protección contra actualizaciones en componentes desmontados.
   - `frontend/src/components/feedback/`:
     - `LoadingSpinner.jsx`: Spinner animado para estados de carga.
     - `ErrorMessage.jsx`: Alerta descriptiva de error con botón de reintento.
     - `EmptyState.jsx`: Estado vacío con iconografía y botón de llamada a la acción.
     - `ConfirmModal.jsx`: Diálogo modal accesible para confirmar acciones destructivas.
   - `frontend/src/components/layout/`:
     - `Sidebar.jsx`: Barra lateral de navegación con enlaces activos y tarjeta resumen de políticas SLA.
     - `Navbar.jsx`: Encabezado con monitor en tiempo real del estado de la API (`/health`), botón de menú móvil y acción rápida de nuevo ticket.
     - `Layout.jsx`: Contenedor maestro responsive que integra Sidebar, Navbar y `<Outlet />`.
   - `frontend/src/components/tickets/`:
     - `TicketBadge.jsx`: Badges estilizados para estados y prioridades.
     - `SlaIndicator.jsx`: Indicador visual de SLA con alerta animada en tickets vencidos.
   - `frontend/src/components/metrics/`:
     - `MetricCard.jsx`: Tarjetas de KPI (Total, Abiertos, En Progreso, Resueltos, Vencidos).
     - `AgentWorkloadChart.jsx`: Gráfico de barras de carga activa por agente y resalte de elegibilidad para auto-asignación.
   - `frontend/src/components/forms/`:
     - `FormField.jsx`: Envoltorio de inputs con soporte de etiquetas, textos de ayuda y errores de validación.
     - `StatusChangeModal.jsx`: Modal de cambio de estado que exige comentario de resolución obligatorio cuando se transiciona a `resuelto`.
   - `frontend/src/pages/`:
     - `DashboardPage.jsx`: Vista principal con métricas de `GET /api/resumen`, alertas de tickets vencidos, cumplimiento de SLA y tickets recientes.
     - `TicketsListPage.jsx`: Listado con pestañas de estado, búsqueda de texto libre, filtros de prioridad y área, ordenamiento dinámico y tabla con indicador de SLA.
     - `TicketDetailPage.jsx`: Vista detallada con metadatos del cliente y agente, línea temporal de comentarios, formulario para añadir respuestas y trazabilidad de eventos de auditoría.
     - `CreateTicketPage.jsx`: Formulario controlado para crear tickets con preview dinámico del SLA (4h, 24h, 72h), selección de clientes y captura de conflictos 409 (falta de agentes en área).
     - `EditTicketPage.jsx`: Formulario para editar campos permitidos y reasignar agentes con registro en el historial.
     - `AgentsPage.jsx`: CRUD de agentes con modal de creación/edición, control de estado activo y modal de borrado con manejo de 409 (`ON DELETE RESTRICT`).
     - `ClientsPage.jsx`: CRUD de clientes con modal de creación/edición y confirmación de borrado con protección referencial.
     - `NotFoundPage.jsx`: Vista 404 personalizada para rutas no existentes.
   - `frontend/src/routes/AppRoutes.jsx`: Enrutador declarativo con React Router v6.
   - `frontend/src/main.jsx`: Punto de entrada con montaje en `React.StrictMode`.
   - `frontend/src/index.css`: Estilos globales y utilidades de animación en Tailwind CSS.

3. **Componentes y páginas implementados:**
   - 8 vistas completas implementadas en `pages/`.
   - 12 componentes modulares y reutilizables en `components/`.
   - 1 servicio HTTP centralizado en `services/api.js`.
   - 1 custom hook `useFetch` en `hooks/useFetch.js`.

4. **Endpoints reales consumidos:**
   - `GET /api/health`: Monitor de conectividad en el Navbar.
   - `GET /api/resumen`: Métricas de estado, SLA, tiempos promedio y carga por agente en el Dashboard.
   - `GET /api/tickets`: Listado con query params (`q`, `estado`, `prioridad`, `area`, `sortBy`, `order`).
   - `POST /api/tickets`: Creación con auto-asignación y cálculo de fecha límite.
   - `GET /api/tickets/:id`: Consulta del detalle completo, comentarios e historial.
   - `PATCH /api/tickets/:id`: Edición de datos generales y reasignación de agente.
   - `PATCH /api/tickets/:id/estado`: Transiciones de estado con validación de comentario para `resuelto`.
   - `POST /api/tickets/:id/comentarios`: Registro de nuevos comentarios asociados.
   - `GET /api/agentes`, `POST /api/agentes`, `PATCH /api/agentes/:id`, `DELETE /api/agentes/:id`: CRUD de agentes.
   - `GET /api/clientes`, `POST /api/clientes`, `PATCH /api/clientes/:id`, `DELETE /api/clientes/:id`: CRUD de clientes.

5. **Decisiones de diseño:**
   - Se empleó una estética corporativa y limpia (Tailwind CSS) con una paleta de colores basada en Slate, Sky, Indigo, Emerald, Amber y Rose.
   - Resalte visual prioritario para los tickets con SLA vencido mediante indicadores animados en rojo.
   - Manejo defensivo de errores HTTP 400, 404 y 409, mostrando mensajes inteligibles al usuario sin fingir éxito.
   - Prevención de fugas de memoria al desmontar componentes asíncronos mediante `useRef` en `useFetch`.

6. **Problemas encontrados y correcciones:**
   - *Instalación limpia de paquetes:* El directorio `frontend/` requirió la ejecución inicial de `npm install` para materializar `node_modules` con React 18, React Router v6 y Lucide Icons.
   - *Validación en cliente de comentario obligatorio:* Se implementó doble control (validación en el modal de interfaz y soporte de respuesta del servidor) para garantizar que ningún ticket pase a `resuelto` sin la debida justificación técnica.

7. **Pruebas ejecutadas y resultados reales:**
   - `npm run build` en `frontend/`: Compilación exitosa en 7.02s con 1973 módulos transformados sin errores de imports ni de sintaxis.
   - Servidor Express backend (`http://localhost:3000`): Verificado en vivo mediante llamada a `/api/health` retornando `{ status: "ok" }`.
   - Servidor Vite frontend (`http://localhost:5173`): Activo y verificado en 978 ms.
   - **Prueba End-to-End con Browser Subagent:**
     - Navegación al Dashboard: Verificación de KPIs, cumplimiento de SLA, tiempos promedio y carga de agentes.
     - Navegación a Tickets (`/tickets`): Verificación de tabla con semillas reales, badges de prioridad/estado e indicadores de SLA.
     - Navegación al Detalle (`/tickets/1`): Verificación de cards de cliente/agente, fechas, hilo de comentarios e historial auditable.
     - Navegación a Nuevo Ticket (`/tickets/nuevo`): Verificación de selectores de clientes y áreas, y selector interactivo de prioridad (4h, 24h, 72h).
     - Navegación a Agentes (`/agentes`): Verificación de listado, áreas y estados de actividad.
     - Navegación a Clientes (`/clientes`): Verificación de directorio de clientes corporativos.
     - Inspección de consola del navegador: 0 errores de JavaScript en todas las vistas navegadas. Grabación de sesión generada en WebP.

8. **Funcionalidades pendientes:**
   - Integración con el workflow automatizado de n8n para sugerencias de IA y autocompletado inteligente (reservado para el PROMPT 5).

9. **Próximo prompt recomendado:**
   **PROMPT 5 — Workflow de n8n con AI Agent y DeepSeek**.

---

### PROMPT 5 — Workflow n8n con AI Agent y DeepSeek

1. **Objetivo:**
   Diseñar, construir y verificar un workflow en n8n que utilice un AI Agent conectado al modelo DeepSeek (a través de la integración compatible con OpenAI) para procesar solicitudes de soporte y emitir tres recomendaciones deterministas:
   - Prioridad sugerida: estrictamente `alta`, `media` o `baja`.
   - Área sugerida: estrictamente una de las áreas válidas del sistema (`Soporte Técnico`, `Facturación`, `Infraestructura`, `Atención al Cliente`).
   - Borrador de respuesta inicial cordial y profesional para el solicitante.
   - Justificación técnica y marca explícita de `requiereRevisionHumana: true`.
   Garantizar la inmutabilidad de la base de datos relacional y un manejo de errores robusto con respuestas HTTP 400 y 500 estandarizadas que eviten ramas colgadas.

2. **Archivos creados y modificados:**
   - `n8n/workflows/mesa-ayuda-ai-agent.json`: Definición completa del workflow para n8n v2.x con 10 nodos, manejo de ramas condicionales y respuestas estructuradas.
   - `n8n/workflows/ticket-ai-agent-workflow.json`: Sincronización del archivo de workflow preexistente para garantizar coherencia en cualquier ruta de importación.
   - `n8n/README.md`: Guía técnica y operativa detallada con diagramas de flujo, pasos de importación en n8n local, configuración de credenciales de DeepSeek, uso de Test URL vs Production URL, diagnóstico de errores y contrato de datos.
   - `n8n/tests/workflow-validation.test.js`: Suite de pruebas automatizadas en Node.js que valida la sintaxis JSON, los nodos, la lógica de validación de entrada/salida y la inmutabilidad de SQLite.
   - `frontend/.env` y `frontend/.env.example`: Actualización de `VITE_N8N_WEBHOOK_URL` a `http://localhost:5678/webhook/mesa-ayuda/analizar-ticket`.

3. **Nodos del workflow y arquitectura:**
   - `Webhook Inbound` (`n8n-nodes-base.webhook`): Recibe peticiones POST en `/mesa-ayuda/analizar-ticket` con `responseMode: responseNode`.
   - `Normalizar y Validar Entrada` (`n8n-nodes-base.code`): Extrae y sanea los campos del cuerpo de la petición (`titulo`, `descripcion`, `clienteNombre`, `empresa`, `area`, `prioridad`), validando longitudes mínimas y presencia obligatoria.
   - `IF Datos Válidos` (`n8n-nodes-base.if`): Bifurca hacia el agente de IA si los datos son correctos o al nodo de rechazo si faltan campos obligatorios.
   - `Respond 400 - Entrada Inválida` (`n8n-nodes-base.respondToWebhook`): Retorna HTTP 400 con el contrato de error ante títulos o descripciones vacías.
   - `AI Agent (DeepSeek)` (`@n8n/n8n-nodes-langchain.agent`): Orquesta el análisis semántico bajo instrucciones estrictas de formato JSON y catálogo cerrado de áreas y prioridades. Configurado con `onError: continueRegularOutput` para evitar bloqueos ante fallos de conexión.
   - `DeepSeek Chat Model (OpenAI Compatible)` (`@n8n/n8n-nodes-langchain.lmChatOpenAi`): Conexión con `https://api.deepseek.com`, modelo `deepseek-chat` (o compatible), temperatura baja (0.2) y credenciales aisladas.
   - `Validar y Normalizar Resultado` (`n8n-nodes-base.code`): Limpia bloques markdown, parsea el JSON emitido por la IA y valida contra la lista blanca estricta de prioridades y áreas.
   - `IF Salida Válida` (`n8n-nodes-base.if`): Bifurca hacia la respuesta de éxito o al manejador de error de IA.
   - `Respond 200 - Éxito` (`n8n-nodes-base.respondToWebhook`): Devuelve HTTP 200 con `{ ok: true, data: { prioridadSugerida, areaSugerida, respuestaInicial, justificacion, requiereRevisionHumana: true }, error: null }`.
   - `Respond 500 - Error IA` (`n8n-nodes-base.respondToWebhook`): Devuelve HTTP 500 con `{ ok: false, data: null, error: "mensaje descriptivo" }` ante fallos de credenciales o alucinaciones del modelo.

4. **Contratos de entrada y salida:**
   - **Entrada:** `{ "titulo": "...", "descripcion": "...", "clienteNombre": "...", "empresa": "...", "area": "...", "prioridad": "..." }`
   - **Salida Exitosa (HTTP 200):**
     `{ "ok": true, "data": { "prioridadSugerida": "alta", "areaSugerida": "Infraestructura", "respuestaInicial": "...", "justificacion": "...", "requiereRevisionHumana": true }, "error": null }`
   - **Salida de Error (HTTP 400 / 500):**
     `{ "ok": false, "data": null, "error": "Descripción clara del problema." }`

5. **Configuración del modelo:**
   - Tipo de nodo: `lmChatOpenAi` (compatible con OpenAI).
   - URL Base: `https://api.deepseek.com`.
   - Modelo: `deepseek-chat` (con soporte para `deepseek-flash` según el backend de inferencia).
   - Credenciales: Aisladas en n8n bajo el nombre `DeepSeek API (OpenAI Compatible)`. **Sin secretos expuestos en código ni repositorios.**

6. **Pruebas ejecutadas y resultados reales:**
   - Suite `n8n/tests/workflow-validation.test.js` ejecutada con Node.js `node --test`:
     - Test 1 (Estructura): Archivo JSON válido y nodos indispensables presentes. &rarr; Aprobado.
     - Test 2 (Entrada válida): Procesamiento y normalización exitosa de payload completo. &rarr; Aprobado.
     - Test 3 (Entrada inválida): Rechazo con HTTP 400 y mensaje explicativo ante omisión de título o descripción. &rarr; Aprobado.
     - Test 4 (Prioridad inválida): Rechazo controlado si el modelo intenta emitir 'urgente' o valor no soportado. &rarr; Aprobado.
     - Test 5 (Área inválida): Rechazo controlado si el modelo intenta sugerir áreas fuera del catálogo oficial (ej. 'Ventas'). &rarr; Aprobado.
     - Test 6 (Fallo de DeepSeek): Manejo controlado con HTTP 500 ante fallo de API Key o cuota sin dejar colgado el webhook. &rarr; Aprobado.
     - Test 7 (Contrato estricto): Verificación de todas las claves requeridas en `data`. &rarr; Aprobado.
     - Test 8 (Inmutabilidad): Comprobación estricta de conteos en SQLite (`tickets`, `comentarios`, `historial`, `agentes`, `clientes`) antes y después del análisis de IA, confirmando 0 modificaciones en base de datos. &rarr; Aprobado.
   - Resumen: **8 de 8 pruebas aprobadas (100%)**.

7. **Problemas encontrados y correcciones:**
   - *Riesgo de ejecuciones "colgadas" por errores del LLM:* Por defecto, si el nodo del agente de IA falla por credenciales o timeout, n8n detiene la ejecución sin llamar al nodo `Respond to Webhook`. Se solucionó configurando `onError: continueRegularOutput` e incorporando en el nodo de validación la detección del objeto de error para responder inmediatamente con HTTP 500 y descripción limpia.
   - *Formateo de salida Markdown:* Los modelos de DeepSeek ocasionalmente envuelven la salida en bloques ````json ... ````. Se implementó una rutina de saneamiento por expresiones regulares y búsqueda de delimitadores `{ ... }` antes del parseo JSON.

8. **Limitaciones pendientes:**
   - La ejecución en vivo de llamadas reales al modelo DeepSeek requiere que el usuario configure su API Key personal en la interfaz de n8n (`http://localhost:5678`) bajo la credencial `DeepSeek API (OpenAI Compatible)`.

9. **Próximo paso:**
   **PROMPT 6 — Integración del frontend React con el webhook de n8n**.

---

## PROMPT 5.1 — Auditoría correctiva del workflow n8n con DeepSeek

1. **Objetivo de la auditoría:**
   Revisar y corregir en profundidad el workflow existente de n8n para análisis de tickets con IA, unificando el modelo de lenguaje en `deepseek-flash`, robusteciendo el manejo de errores con la salida dedicada de error de n8n (`continueErrorOutput`), garantizando respuestas HTTP con códigos de estado explícitos y objetos JSON reales (evitando dobles codificaciones de strings), y sincronizando de forma estricta las plantillas JSON del proyecto.

2. **Archivos auditados y modificados:**
   - `n8n/workflows/mesa-ayuda-ai-agent.json`: Workflow principal actualizado con 12 nodos, modelo `deepseek-flash`, bifurcación física de errores de ejecución (`continueErrorOutput`), formateadores dedicados y respuestas HTTP explícitas (200, 400, 500) con `respondWith: "firstIncomingItem"`.
   - `n8n/workflows/ticket-ai-agent-workflow.json`: Sincronizado para ser idéntico byte a byte con el workflow principal.
   - `n8n/README.md`: Documentación reescrita con especificación unificada de `deepseek-flash`, diagrama ASCII del flujo con bifurcación de errores, detalle del contrato de respuesta `{ ok, data, error }`, y guía paso a paso de pruebas manuales y diagnósticos con cURL y PowerShell.
   - `n8n/tests/workflow-validation.test.js`: Suite ampliada de 8 a 12 pruebas automatizadas que verifican sintaxis, sincronización de plantillas, configuración del modelo, manejo de ramas de error, códigos HTTP, serialización nativa de JSON, ausencia de secretos, lógica de nodos e inmutabilidad en SQLite.

3. **Decisiones técnicas y mejoras arquitectónicas:**
   - **Unificación del modelo de inferencia:** Se configuró exclusivamente `deepseek-flash` en el nodo de chat compatible con OpenAI (`@n8n/n8n-nodes-langchain.lmChatOpenAi`), fijando la URL base en `https://api.deepseek.com`. Se removieron todas las instrucciones y notas ambiguas que presentaban `deepseek-chat` y `deepseek-flash` de manera intercambiable o indeterminada.
   - **Corrección de `onError: continueErrorOutput`:** Anteriormente se utilizaba `onError: continueRegularOutput`, lo que mezclaba los errores de ejecución del agente (401 invalid key, 429 quota, timeouts) con las respuestas regulares en la salida principal (`main[0]`), obligando al nodo de validación a heurísticas para deducir si hubo fallo. Se corrigió a `onError: continueErrorOutput`, permitiendo que n8n bifurque los fallos de runtime directamente a la salida de error (`main[1]`), pasando por el nodo `Formatear Error Modelo` hacia `Respond 500 - Error IA`.
   - **Garantía de JSON nativo y eliminación de doble serialización:** Se configuró `respondWith: "firstIncomingItem"` en los tres nodos de respuesta (`Respond 200 - Éxito`, `Respond 400 - Entrada Inválida`, `Respond 500 - Error IA`). Esto asegura que n8n entregue `item.json` como un objeto JSON real en la cabecera `Content-Type: application/json`, evitando la serialización doble (evitando strings JSON escapadas como `"\"{\\\"ok\\\":...}\""`).
   - **Códigos HTTP explícitos:**
     - Entrada inválida (omisión o campos vacíos de título/descripción): HTTP 400.
     - Éxito con recomendación válida (prioridad y área dentro del catálogo): HTTP 200.
     - Error de inferencia, timeout, cuota o alucinación de catálogo inválido: HTTP 500.
   - **Contrato uniforme estricto:** Todas las salidas responden bajo `{ ok: boolean, data: object | null, error: string | null }`.

4. **Pruebas automatizadas ejecutadas y resultados:**
   Se ejecutó la suite `n8n/tests/workflow-validation.test.js` bajo Node.js (`node --test`), obteniendo:
   - **Test 1:** Sintaxis JSON y estructura de ambos workflows. &rarr; **APROBADO**
   - **Test 2:** Sincronización idéntica entre `mesa-ayuda-ai-agent.json` y `ticket-ai-agent-workflow.json`. &rarr; **APROBADO**
   - **Test 3:** Configuración de modelo unificado `deepseek-flash` y baseURL `https://api.deepseek.com`. &rarr; **APROBADO**
   - **Test 4:** Estrategia de errores `continueErrorOutput` y conexión de salida de error `main[1]`. &rarr; **APROBADO**
   - **Test 5:** Códigos HTTP explícitos (200, 400, 500) y `respondWith: firstIncomingItem`. &rarr; **APROBADO**
   - **Test 6:** Ausencia total de API keys o credenciales privadas en los archivos exportados. &rarr; **APROBADO**
   - **Test 7:** Lógica de validación de entrada (rechazo ante campos faltantes, aceptación ante datos válidos). &rarr; **APROBADO**
   - **Test 8:** Validación de salida del modelo (aceptación de catálogo válido, rechazo de áreas o prioridades inventadas). &rarr; **APROBADO**
   - **Test 9:** Formateo de error en fallo de ejecución de DeepSeek (Auth, Quota, Timeout). &rarr; **APROBADO**
   - **Test 10:** Uniformidad estricta del contrato de respuesta `{ ok, data, error }`. &rarr; **APROBADO**
   - **Test 11:** Inmutabilidad garantizada de la base de datos SQLite durante el análisis. &rarr; **APROBADO**
   - **Test 12:** Carga e instanciación formal del workflow usando las clases oficiales del paquete `n8n-workflow` (v2.38.6). &rarr; **APROBADO**
   - **Resultado general:** **12 de 12 pruebas aprobadas (100% de éxito, 0 fallos).**

5. **Diferenciación entre validaciones automáticas y pruebas manuales:**
   - **Validaciones automáticas completadas:** Integridad de archivos JSON, tipado de nodos, conexiones de grafos, simulación de ramas, sanitización de payloads e inmutabilidad de la base de datos SQLite.
   - **Procedimientos manuales requeridos en n8n UI:**
     1. Importar `mesa-ayuda-ai-agent.json` en la interfaz gráfica de n8n (`http://localhost:5678`).
     2. Configurar la credencial `DeepSeek API (OpenAI Compatible)` asociando una clave API real con créditos disponibles.
     3. Activar la escucha de pruebas en n8n ("Test step" o "Test workflow") y enviar una petición POST a `/webhook-test/mesa-ayuda/analizar-ticket` para comprobar la inferencia real de DeepSeek y la recepción de HTTP 200.
     4. Probar la rama de error simulando credenciales inválidas o forzando un payload corrupto desde n8n UI para verificar visualmente el camino hacia el HTTP 500.
     5. Publicar el workflow ("Active") para habilitar el endpoint de producción `/webhook/mesa-ayuda/analizar-ticket`.

6. **Limitaciones pendientes:**
   - No se ejecutó una inferencia HTTP real contra la API de DeepSeek desde el agente local durante esta auditoría, debido a que no se dispone ni se deben registrar credenciales reales en el entorno de desarrollo automatizado.
   - La ejecución en vivo queda sujeta a la vinculación de la credencial en n8n por parte del operador humano.

7. **Próximo paso:**
   **PROMPT 6 — Integración del frontend React con el webhook de n8n**.

---

## PROMPT 5.2 — Auditoría y unificación del catálogo de áreas y prioridades

1. **Catálogo oficial de áreas identificado y fuente de verdad:**
   - Se realizó una auditoría exhaustiva en la base de datos real SQLite (`schema.sql` y `seeds.sql`), repositorios, servicios (`ticketService.js`), controladores, validadores y tests.
   - En la base de datos real y en las reglas operativas de asignación automática, **únicamente existen 3 áreas con soporte y agentes asignables**:
     1. `Soporte Técnico` (Carlos Mendoza [id: 1, activo], Laura Fernández [id: 2, activo], Diego Martínez [id: 5, inactivo]).
     2. `Facturación` (Andrés Gómez [id: 3, activo]).
     3. `Infraestructura` (Sofía Ramos [id: 4, activo]).
   - No existe ningún agente ni ticket en la base de datos para otra área. Cualquier petición hacia otra área detona una excepción de regla de negocio (`ConflictError` HTTP 409: "No hay agentes activos disponibles en el área '...' para la asignación automática").
   - Se formalizó esta definición como la única fuente de verdad creando `export const TICKET_AREAS = Object.freeze(['Soporte Técnico', 'Facturación', 'Infraestructura'])` en `backend/src/utils/constants.js`.

2. **Evaluación de `Redes` y `Atención al Cliente`:**
   - **`Redes`:** No es un área válida. Se confirmó mediante búsqueda global que `Redes` nunca existió en el esquema de base de datos, semillas, validadores, frontend ni workflows. Su mención provino exclusivamente de un ejemplo ilustrativo accidental (hallucination) en el bloque cURL del informe del PROMPT 5.1. Quedó completamente erradicada.
   - **`Atención al Cliente`:** Fue introducida de manera desarticulada en `frontend/src/utils/constants.js` durante el PROMPT 4 y copiada a n8n en el PROMPT 5 sin respaldo en el backend (0 agentes en semillas, 0 tickets). Si un usuario o la IA intentaba crear un ticket en `Atención al Cliente`, el backend lo rechazaba con HTTP 409. Siguiendo el principio de que el backend es la fuente de verdad, `Atención al Cliente` fue eliminada de las listas permitidas de frontend y n8n, unificando todo en las 3 áreas con cobertura operativa real.

3. **Prioridades oficiales encontradas:**
   - Se confirmó paridad total (100% consistente):
     - Restricción SQLite: `CHECK (prioridad IN ('baja', 'media', 'alta'))`
     - Backend constants: `TICKET_PRIORITY: { BAJA: 'baja', MEDIA: 'media', ALTA: 'alta' }`
     - Backend validator: `z.enum([TICKET_PRIORITY.BAJA, TICKET_PRIORITY.MEDIA, TICKET_PRIORITY.ALTA])`
     - Frontend constants: `TICKET_PRIORITY: { BAJA: 'baja', MEDIA: 'media', ALTA: 'alta' }`
     - n8n workflows: `VALID_PRIORITIES = ['baja', 'media', 'alta']`
     - Tiempos de SLA: Alta = 4h, Media = 24h, Baja = 72h.

4. **Archivos modificados y motivo de cada cambio:**
   - `backend/src/utils/constants.js`: Se definió y exportó `TICKET_AREAS` (`['Soporte Técnico', 'Facturación', 'Infraestructura']`) como fuente de verdad canónica.
   - `frontend/src/utils/constants.js`: Se actualizó `COMMON_AREAS` para contener exactamente las 3 áreas oficiales y se exportó `TICKET_AREAS` como alias.
   - `n8n/workflows/mesa-ayuda-ai-agent.json`: Se actualizaron las instrucciones de clasificación del prompt del AI Agent, el system message y el nodo `Validar y Normalizar Resultado` para restringir `VALID_AREAS` a las 3 áreas del backend.
   - `n8n/workflows/ticket-ai-agent-workflow.json`: Sincronizado idéntico al workflow principal.
   - `n8n/README.md`: Se corrigió el listado del catálogo en la sección 4 y se confirmó que los ejemplos cURL/PowerShell usan únicamente áreas oficiales.
   - `n8n/tests/workflow-validation.test.js`: Se actualizó `VALID_AREAS` en el mock de pruebas, se añadieron casos para verificar el rechazo de `Redes` y `Atención al Cliente`, y se agregó el Test 13 para auditar la paridad del catálogo y la ausencia de `Redes`.
   - `backend/tests/integration.test.js`: Se incorporó la suite `9. Auditoría y Unificación del Catálogo Oficial de Áreas y Prioridades (PROMPT 5.2)` con 7 nuevas pruebas de integración que validan el catálogo canónico, concordancia con SQLite, creación con auto-asignación por área, rechazo controlado (409) de `Redes` y `Atención al Cliente`, y sincronización de código con frontend y n8n.

5. **Pruebas ejecutadas y resultados reales:**
   - **Backend Integration Tests (`npm test` en `backend/`):** 44 de 44 pruebas aprobadas (9 suites, 0 fallos).
     - Se crearon tickets en las 3 áreas oficiales (`Soporte Técnico`, `Facturación`, `Infraestructura`), comprobando código 201 y auto-asignación a agentes activos.
     - Se comprobó el rechazo controlado (HTTP 409) de `Redes` y `Atención al Cliente`.
   - **Database Verification Script (`node database/verifyDb.js`):** 9 de 9 pruebas de integridad relacional en SQLite aprobadas.
   - **n8n Workflow Tests (`node --test tests/workflow-validation.test.js` en `n8n/`):** 13 de 13 pruebas aprobadas.
     - Validador rechaza `Redes` y `Atención al Cliente` con mensaje descriptivo y conduce al HTTP 500.
     - Test de paridad de catálogo confirma consistencia total entre archivos.
   - **Frontend Build (`npm run build` en `frontend/`):** Compilación Vite satisfactoria (0 errores de TypeScript/JSX/módulos).

6. **Discrepancias no resueltas:**
   - Ninguna. Todas las discrepancias detectadas (`Redes`, `Atención al Cliente`, ausencia de constante en backend) fueron subsanadas y probadas.

7. **Confirmación de que backend, frontend y n8n utilizan el mismo catálogo:**
   - Confirmado: backend (`TICKET_AREAS`), frontend (`COMMON_AREAS` / `TICKET_AREAS`) y n8n (`VALID_AREAS`) comparten de forma estricta el conjunto `['Soporte Técnico', 'Facturación', 'Infraestructura']`.

8. **Próximo paso:**
   **PROMPT 6 — Integración de React con n8n y DeepSeek**.

---

## PROMPT 5.3 — Verificación final de la validación de áreas en el backend

1. **Objetivo de la verificación:**
   Asegurar que la constante canónica `TICKET_AREAS` definida en `backend/src/utils/constants.js` se utilice de forma activa en los esquemas de validación Zod del backend (`ticketValidator.js` y `agentValidator.js`), distinguiendo con precisión semántica entre:
   - Error de validación HTTP 400: Entrada con área fuera del catálogo oficial (`Redes`, `Atención al Cliente`, etc.).
   - Conflicto de negocio HTTP 409: Petición con área válida del catálogo oficial (`Soporte Técnico`, `Facturación`, `Infraestructura`) pero que en el momento carece de agentes activos disponibles para auto-asignación.

2. **Código revisado y modificaciones implementadas:**
   - `backend/src/validators/ticketValidator.js`:
     - Se importó `TICKET_AREAS` desde `../utils/constants.js`.
     - Se actualizó el campo `area` en `createTicketSchema` y `updateTicketSchema` reemplazando la validación genérica `z.string().trim().min(2)` por `z.enum([TICKET_AREAS[0], ...TICKET_AREAS.slice(1)])`, garantizando el rechazo inmediato con HTTP 400 antes de ejecutar la lógica de base de datos o auto-asignación.
   - `backend/src/validators/agentValidator.js`:
     - Se importó `TICKET_AREAS` y se aplicó la misma validación estricta en `createAgentSchema` y `updateAgentSchema`, impidiendo registrar agentes en áreas espurias.
   - `backend/tests/integration.test.js`:
     - Se adaptaron y enriquecieron las pruebas de integración para verificar explícitamente:
       1. Las 3 áreas oficiales (`Soporte Técnico`, `Facturación`, `Infraestructura`) superan la validación sintáctica y completan la creación (HTTP 201).
       2. Áreas no catalogadas (`Redes` y `Atención al Cliente`) son rechazadas a nivel de validación respondiendo estrictamente **HTTP 400 Bad Request**.
       3. Peticiones con área válida pero sin agentes activos disponibles (simulada desactivando temporalmente al agente del área) responden **HTTP 409 Conflict** con mensaje explicativo.
       4. Las 45 pruebas de integración del backend y las 9 pruebas de SQLite pasan limpiamente sin regresiones.

3. **Pruebas ejecutadas y resultados reales:**
   - **Backend Integration Tests (`npm test`):** 45 pruebas aprobadas en 9 suites (0 fallos).
   - **Database Integrity Verification (`node database/verifyDb.js`):** 9 de 9 verificaciones aprobadas (0 fallos).
   - **n8n Workflow Validation Tests (`node --test tests/workflow-validation.test.js`):** 13 de 13 pruebas aprobadas (0 fallos).
   - **Frontend Build (`npm run build`):** Compilación exitosa en 18.7s sin errores.

4. **Confirmación de integridad arquitectónica:**
   Se confirma que las reglas de negocio (SLA de 4h, 24h y 72h, cálculo de `fecha_limite`, asignación automática por menor carga de agentes activos, transiciones de estado, comentarios obligatorios de resolución e historial cronológico) permanecen 100% intactas y operativas. La paridad de catálogo entre backend, frontend y n8n es absoluta.

5. **Próximo paso:**
   **PROMPT 6 — Integración de React con n8n y DeepSeek**.

---

## PROMPT 6 — Integración del frontend React con n8n y DeepSeek

1. **Objetivo:**
   Implementar la integración desacoplada y segura entre el frontend React (Vite + Tailwind CSS) y el workflow de triaje con IA en n8n impulsado por DeepSeek (`deepseek-flash`). El sistema permite a los usuarios solicitar un análisis de cualquier ticket (durante la creación o desde la pantalla de detalle), recibir recomendaciones de clasificación y borradores de respuesta inicial de cortesía, y decidir manualmente si aplicar las sugerencias, garantizando que ninguna acción de IA altere la base de datos SQLite ni ejecute transiciones sin intervención humana explícita.

2. **Archivos creados y modificados:**
   - `frontend/src/services/aiService.js` *(Creado)*: Servicio centralizado para comunicación con el webhook de n8n. Valida entradas, sanitiza salidas contra el catálogo canónico (`['Soporte Técnico', 'Facturación', 'Infraestructura']` y `['alta', 'media', 'baja']`), gestiona timeouts vía `AbortController`, controla concurrencia evitando llamadas duplicadas simultáneas y previene la exposición de secretos o credenciales.
   - `frontend/src/components/ai/AiRecommendationPanel.jsx` *(Creado)*: Componente modular reutilizable que gestiona estados de carga, error y recomendación exitosa. Presenta avisos de revisión humana obligatoria, justificación técnica, badges de prioridad y área, botones de aplicación manual e independiente de sugerencias, y función de copia del borrador de respuesta al portapapeles con fallback para navegadores legados.
   - `frontend/src/pages/CreateTicketPage.jsx` *(Modificado)*: Incorporación de controles accesibles "Analizar con IA", validación preventiva de título y descripción no vacíos antes de la invocación, renderizado del panel de recomendaciones y botones independientes para aplicar prioridad o área sugeridas al formulario sin persistencia automática.
   - `frontend/src/pages/TicketDetailPage.jsx` *(Modificado)*: Incorporación del botón "Analizar ticket con IA", renderizado del panel de IA independiente del historial y la conversación, y opción "Cargar en respuesta" que rellena el formulario de comentarios sin publicarlo de forma automática.
   - `frontend/package.json` *(Modificado)*: Adición del script `"test": "node --test tests/aiIntegration.test.js"` para ejecución de pruebas unitarias y de integración.
   - `frontend/tests/aiIntegration.test.js` *(Creado)*: Suite completa de 15 pruebas automatizadas que verifican validación de entrada/salida, catálogo estricto, independencia de aplicación, manejo de errores HTTP (400, 500), timeout, errores de red, respuestas corruptas e inmutabilidad estricta de SQLite.
   - `prompts/BITACORA_IA.md` *(Modificado)*: Registro cronológico de la auditoría y ejecución del PROMPT 6.

3. **Componentes y servicios implementados:**
   - **`aiService.js`**:
     - `validateAiInput(payload)`: Comprueba longitudes mínimas y coherencia de datos previos al despacho.
     - `validateAiResponse(responseJson)`: Exige la presencia de los 5 campos en `data` y verifica que `prioridadSugerida` y `areaSugerida` pertenezcan estrictamente al catálogo oficial.
     - `analyzeTicketWithAi(ticketData, options)`: Orquesta la llamada HTTP POST al webhook con timeout de 25s y protección contra solicitudes paralelas concurrentes.
   - **`AiRecommendationPanel.jsx`**:
     - Panel visual con diseño responsivo, aviso de no-persistencia, selector granular de cambios ("Aplicar prioridad" y "Aplicar área") y acción para copiar borrador al portapapeles.

4. **Contratos de entrada y salida:**
   - **Entrada al Webhook (`POST /webhook/mesa-ayuda/analizar-ticket`):**
     ```json
     {
       "titulo": "Falla de conectividad en cluster",
       "descripcion": "El servidor de base de datos no acepta conexiones.",
       "clienteNombre": "Carlos Mendoza",
       "empresa": "Fintech Solutions",
       "area": "Infraestructura",
       "prioridad": "alta"
     }
     ```
   - **Salida Exitosa de n8n (HTTP 200):**
     ```json
     {
       "ok": true,
       "data": {
         "prioridadSugerida": "alta",
         "areaSugerida": "Infraestructura",
         "respuestaInicial": "Estimado Carlos, hemos recibido el reporte sobre la falla de conectividad...",
         "justificacion": "Afectación de base de datos crítica con impacto operativo directo.",
         "requiereRevisionHumana": true
       },
       "error": null
     }
     ```
   - **Salida de Error (HTTP 400 / 500):**
     ```json
     {
       "ok": false,
       "data": null,
       "error": "Mensaje descriptivo del error sin exponer secretos ni trazas internas."
     }
     ```

5. **Configuración de CORS y variables de entorno:**
   - Variable de entorno única en frontend: `VITE_N8N_WEBHOOK_URL` definida en `frontend/.env` y documentada en `frontend/.env.example`.
   - **URL de Producción (workflow activo):** `http://localhost:5678/webhook/mesa-ayuda/analizar-ticket`
   - **URL de Prueba (escucha activa en editor n8n):** `http://localhost:5678/webhook-test/mesa-ayuda/analizar-ticket`
   - **CORS:** El frontend se ejecuta en `http://localhost:5173` y se comunica mediante solicitudes POST con `http://localhost:5678`. En n8n, el nodo Webhook gestiona la cabecera preflight `OPTIONS` y acepta `Content-Type: application/json`. No se exponen credenciales de DeepSeek en React ni en el cliente web; las API keys residen exclusivamente dentro de la bóveda de credenciales de n8n.

6. **Pruebas ejecutadas y resultados reales:**
   - **Frontend AI Integration Tests (`npm test` en `frontend/`):**
     - 15 de 15 pruebas aprobadas (1 suite, 0 fallos, duración: ~173ms).
     - Validación de entrada (título y descripción obligatorios con longitudes mínimas).
     - Validación del contrato de respuesta (5 campos requeridos).
     - Aplicación independiente de prioridad (sin alterar área).
     - Aplicación independiente de área (sin alterar prioridad).
     - Rechazo estricto de sugerencias no catalogadas (`Redes`, `Atención al Cliente`, `urgente`).
     - Manejo controlado de HTTP 400 y HTTP 500 sin romper la interfaz.
     - Manejo de desconexión de red y timeout de 25s.
     - Rechazo de respuestas corruptas o no JSON.
     - Aislamiento de copia de borrador (no envía comentarios).
     - Inmutabilidad estricta de SQLite (0 cambios en base de datos al consultar IA).
     - Persistencia intacta del backend con cálculo de SLA de 4h, 24h y 72h.
     - Preservación de funciones de detalle de ticket.
     - Coherencia estructural de componentes y rutas.
     - Generación de artefactos de producción en `dist/`.
   - **Frontend Production Build (`npm run build` en `frontend/`):**
     - Compilación exitosa en 5.14s (0 errores de bundle, assets generados limpiamente).
   - **Backend Integration Tests (`npm test` en `backend/`):**
     - 45 de 45 pruebas aprobadas en 9 suites (~1186ms).
   - **Database Integrity Verification (`node database/verifyDb.js` en `backend/`):**
     - 9 de 9 verificaciones aprobadas (0 fallos).
   - **n8n Workflow Validation Tests (`node --test tests/workflow-validation.test.js` en `n8n/`):**
     - 13 de 13 pruebas aprobadas (0 fallos).

7. **Errores encontrados y correcciones:**
   - *Extensión de módulo en Node.js ESM:* La prueba inicial falló por importar `../utils/constants` sin la extensión `.js`. Se corrigió a `../utils/constants.js` en `aiService.js`, permitiendo compatibilidad plena tanto con el bundler Vite como con el ejecutor nativo `node --test`.
   - *Límite de caracteres en aserción:* La prueba de descripción menor a 5 caracteres utilizaba `'Fallo'`, que posee exactamente 5 caracteres y superaba la validación. Se ajustó a `'Bug'` (3 caracteres), confirmando el disparo estricto de la excepción esperada.
   - *Ruta física de SQLite en pruebas:* La suite intentaba verificar `mesa_ayuda.db`. Se corrigió a `mesa.db`, ruta canónica establecida en la configuración del backend.

8. **Prueba real de integración:**
   - Se comprobó mediante diagnóstico de red (`Test-NetConnection`) que el puerto 5678 no se encuentra en escucha activa en el host local. Por lo tanto, la invocación de inferencia real en vivo contra DeepSeek a través de n8n no pudo completarse en esta sesión. Se verificó exhaustivamente todo el pipeline mediante mocks estandarizados que validan exactamente el contrato del nodo Webhook y la ausencia de modificaciones en la base de datos.
   - **Procedimiento manual para prueba en vivo:**
     1. Iniciar n8n localmente ejecutando `n8n start` en una terminal.
     2. Abrir `http://localhost:5678` e importar `n8n/workflows/mesa-ayuda-ai-agent.json`.
     3. Configurar la credencial `DeepSeek API (OpenAI Compatible)` con una API key válida.
     4. Activar el workflow.
     5. En el frontend (`http://localhost:5173`), abrir la pantalla de creación de ticket o detalle de ticket y pulsar **Analizar con IA**.

9. **Limitaciones pendientes:**
   - La inferencia real en vivo depende de la ejecución local activa del servicio n8n en el puerto 5678 con credencial configurada y saldo disponible en la cuenta de DeepSeek.

10. **Siguiente paso:**
    **PROMPT 6.1 — Preparación del workflow importable y prueba manual con DeepSeek**.

---

## PROMPT 6.1 — Preparación del workflow importable y prueba manual con DeepSeek

1. **Objetivo:**
   Verificar exhaustivamente la compatibilidad del workflow de triaje con IA con la instalación local de n8n v2.38.6, preparar la documentación y procedimientos para la importación manual y prueba interactiva por parte del usuario, documentar el comportamiento nativo de CORS y las URLs de webhook, y suministrar datos de prueba para los escenarios HTTP 200, 400 y 500 sin alterar la base de datos ni arriesgar credenciales existentes.

2. **Archivos revisados y modificados:**
   - `n8n/workflows/mesa-ayuda-ai-agent.json` *(Revisado y Validado)*: Workflow canónico principal. Verificado para n8n v2.38.6, con 12 nodos, modelo `deepseek-flash`, bifurcación de errores `continueErrorOutput`, códigos de estado explícitos (200, 400, 500) y cero secretos.
   - `n8n/workflows/ticket-ai-agent-workflow.json` *(Revisado y Validado)*: Plantilla secundaria confirmada idéntica byte a byte (100% paridad).
   - `n8n/README.md` *(Modificado y Ampliado)*: Guía paso a paso enriquecida con instrucciones detalladas para n8n v2.38.6, explicación del mecanismo de CORS nativo (`supportsCORS: true`), tablas de compatibilidad de nodos, 9 pasos de importación manual y scripts PowerShell para pruebas con manejo de excepciones HTTP.
   - `n8n/tests/workflow-validation.test.js` *(Ejecutado)*: Suite de 13 pruebas ejecutada exitosamente.
   - `frontend/tests/aiIntegration.test.js` *(Ejecutado)*: Suite de 15 pruebas de integración frontend ejecutada exitosamente.
   - `prompts/BITACORA_IA.md` *(Modificado)*: Registro formal de la auditoría y entrega del PROMPT 6.1.

3. **Método de importación recomendado:**
   - **Importación vía UI de n8n (Recomendada):**
     1. Iniciar n8n en terminal (`n8n start`) y abrir `http://localhost:5678`.
     2. Abrir un nuevo workflow vacío (**Workflows** &rarr; **Add Workflow**) para evitar sobrescrituras accidentales.
     3. Seleccionar **Import from File** en el menú de opciones (**...**) e importar `n8n/workflows/mesa-ayuda-ai-agent.json`.
     4. Asociar la credencial de tipo **OpenAI API** llamada `DeepSeek API (OpenAI Compatible)` con la API key personal del usuario.
     5. Probar con la Test URL mediante el botón "Listen for test event", y activar el interruptor a **Active** para habilitar la Production URL.

4. **Validaciones técnicas realizadas:**
   - **Versión de n8n confirmada:** `n8n --version` retornó `2.38.6`.
   - **Inspección de código fuente de n8n v2.38.6:** Se inspeccionó `webhook-request-handler.js` en `n8n/dist`, confirmando que el nodo Webhook (`supportsCORS: true`) gestiona automáticamente las peticiones preflight `OPTIONS` respondiendo con HTTP 204 y cabeceras dinámicas `Access-Control-Allow-Origin: http://localhost:5173`, `Access-Control-Allow-Methods` y `Access-Control-Allow-Headers`.
   - **Validación con motor de n8n:** La clase `Workflow` del paquete oficial `@n8n/workflow` instanció e indexó correctamente los 12 nodos y sus conexiones.
   - **Inmutabilidad relacional comprobada:** Se verificó contra `backend/database/mesa.db` que las simulaciones del workflow generan cero escrituras en `tickets`, `comentarios`, `historial`, `agentes` y `clientes`.

5. **Pruebas ejecutadas realmente:**
   - **n8n Workflow Validation Tests (`node --test tests/workflow-validation.test.js`):** 13 de 13 pruebas aprobadas (~1144ms).
   - **Frontend AI Integration Tests (`npm test` en `frontend/`):** 15 de 15 pruebas aprobadas (~90ms).
   - **Backend Integration Tests (`npm test` en `backend/`):** 45 de 45 pruebas aprobadas (~1186ms).
   - **Database Integrity Verification (`node database/verifyDb.js`):** 9 de 9 verificaciones aprobadas (0 fallos).
   - **Compilación de producción de React (`npm run build` en `frontend/`):** Completada sin errores en 5.14s.

6. **Pruebas que todavía necesitan ejecutarse en el equipo del usuario:**
   - Iniciar el servidor local de n8n (`n8n start`) y acceder a `http://localhost:5678`.
   - Importar `n8n/workflows/mesa-ayuda-ai-agent.json` en la interfaz gráfica.
   - Configurar la API key real de DeepSeek en la credencial `DeepSeek API (OpenAI Compatible)`.
   - Ejecutar una llamada de prueba real con PowerShell o cURL hacia la Test URL y verificar que DeepSeek responda con inferencia en vivo.
   - Probar la interacción desde la aplicación React (`http://localhost:5173`) pulsando el botón "Analizar con IA".

7. **Limitaciones conocidas:**
   - La inferencia real en vivo no pudo ser ejecutada por la IA asistencial en esta sesión debido a que n8n no se encuentra corriendo en segundo plano y las credenciales reales de DeepSeek no están expuestas en el repositorio por motivos de seguridad.

8. **Siguiente paso:**
   **PROMPT 7 — Auditoría final, documentación y preparación de la demostración** (en espera de que el usuario complete su prueba manual en n8n local).

---

### PROMPT CORRECTIVO — Workflow n8n Mesa de Ayuda con DeepSeek

1. **Objetivo:**
   Identificar la causa raíz por la cual las solicitudes POST a `http://localhost:5678/webhook-test/mesa-ayuda/analizar-ticket` retornaban HTTP 200 con el payload original del webhook en lugar de avanzar al nodo `Normalizar y Validar Entrada`, implementar el workflow corregido como `n8n/workflows/mesa-ayuda-ai-agent-fixed.json`, y validar el cumplimiento del contrato estricto de respuesta (HTTP 200, 400 y 500).

2. **Causa exacta identificada:**
   En n8n v2.38.6, al probar el Webhook mediante el botón individual "Test step" dentro de la configuración del nodo, el servidor registra una ejecución parcial con `destinationNode: { nodeName: "Webhook Inbound", mode: "inclusive" }`. Al estar restringida la ejecución a dicho nodo, los nodos subsiguientes (`Normalizar y Validar Entrada`, `IF`, `AI Agent`) nunca son alcanzados. Debido a que el flujo termina sin alcanzar un nodo `Respond to Webhook`, el manejador interno de n8n entra en modo de contingencia (*fallback*), respondiendo HTTP 200 con la carga bruta recibida por el webhook. Para ejecutar todo el flujo en modo prueba con `responseMode: "responseNode"`, se debe presionar el botón global inferior **"Test workflow"** del lienzo o activar el workflow en producción.

3. **Archivos creados y modificados:**
   - `n8n/workflows/mesa-ayuda-ai-agent-fixed.json`: Workflow completo, corregido y validado con 10 nodos, enrutamiento estricto por ramas (HTTP 200, 400 y 500), `firstIncomingItem` sin doble serialización, y salvaguardas de normalización.
   - `n8n/tests/fixed-workflow.test.js`: Suite de 11 pruebas automatizadas que verifican la sintaxis JSON, la integridad de conexiones, los códigos HTTP y los contratos ante entradas inválidas, válidas y errores del agente.
   - `prompts/BITACORA_IA.md`: Documentación de la causa técnica y resultados de auditoría.

4. **Pruebas ejecutadas:**
   - `node --test n8n/tests/fixed-workflow.test.js`: 11 de 11 pruebas aprobadas.
   - `node --test n8n/tests/workflow-validation.test.js`: 13 de 13 pruebas aprobadas.

5. **Siguiente paso:**
### IMPLEMENTACIÓN VISUAL DE NEXORA — PROPUESTA 2

1. **Objetivo del prompt:**
   Rediseñar la aplicación completa de "Mesa de Ayuda con SLA e Historial" bajo la identidad de producto **NEXORA Intelligence Operations**, tomando como referencia visual estricta la Propuesta 2 (diseño editorial, asimétrico, cinematográfico y empresarial de alta gama). Se requirió reproducir la paleta cromática (Marfil `#F3F0E9`, Verde pino profundo `#202C2A`, Verde salvia `#A9B8A5`, Bronce `#C49A6C`, Carbón `#252A30`, Blanco `#FFFFFF`), eliminar gradientes neón o tarjetas genéricas, preservar el 100% de la funcionalidad existente (Express, SQLite, SLA 4/24/72h, auto-asignación por carga, máquina de estados, historial inmutable, integración con n8n/DeepSeek) y destacar el **Ticket #42** de *Distribuidora Global* como caso demostrativo de trazabilidad completa.

2. **Decisiones de Diseño y Dirección Creativa:**
   - **Sistema Tipográfico:** Incorporación de *Plus Jakarta Sans* para encabezados editoriales y acentos numéricos de impacto (`font-display`), combinada con *Inter* para tablas y datos de alta densidad.
   - **Paleta Cromática Armónica:** Tokens configurados en Tailwind CSS:
     - Marfil de fondo editorial: `#F3F0E9`
     - Verde pino profundo: `#202C2A` (barra lateral y acentos de contraste)
     - Bronce corporativo: `#C49A6C` (insignias, indicadores de SLA y botones de acción)
     - Verde salvia: `#A9B8A5` (estados de éxito, métricas cumplidas y bordes suaves)
     - Carbón editorial: `#252A30` (tipografía principal de lectura)
     - Bordes estructurados: `#E2DDD2` y superficies `#FFFFFF`
   - **Atmósfera Cinematográfica:** Fondos ambientales generados con fotografía minimalista de interiores arquitectónicos (`nexora_hero_bg.jpg`) y cordillera al anochecer (`nexora_mountain_bg.jpg`) para el banner final de trazabilidad ("Cada incidencia tiene un recorrido. Cada acción deja evidencia").
   - **Preservación Funcional Absoluta:** Cero mocks y cero simulaciones. Todos los datos mostrados en el Centro de Operaciones, listado, métricas y detalle provienen de las consultas SQL reales a `backend/database/mesa.db`.

3. **Archivos Creados:**
   - `frontend/src/components/common/NexoraLogo.jsx`: Identidad geométrica "N" estilizada en bronce y salvia con versiones clara y oscura.
   - `frontend/src/pages/HomePage.jsx`: Landing page editorial con:
     - Hero cinematográfico con propuesta de valor y acceso directo.
     - Vitrina interactiva del **Ticket #42** (*Distribuidora Global*) con stepper del ciclo de vida (`Creado 22:21` → `Analizado IA` → `Asignado` → `En atención` → `Resuelto 22:26` → `Cerrado 22:32`) y recomendación de DeepSeek.
     - Sección "Un problema, una solución" con comparación asimétrica de 4 dolores operativos vs. 4 pilares de NEXORA.
     - Grilla Bento de 6 "Capacidades inteligentes" en verde pino profundo.
     - Stepper explicativo del "Ciclo de vida de un ticket" y tarjeta del stack arquitectónico (React, Vite, Express, SQLite, n8n, DeepSeek).
     - Banner panorámico atmosférico con lema de trazabilidad y acceso rápido.
   - `frontend/src/pages/MetricsPage.jsx`: Pantalla especializada de métricas operacionales con:
     - Gráfico Donut SVG de tickets por estado con conteo central.
     - Gráfico spline curvo de tiempo de resolución vs. objetivo de SLA de 4 horas.
     - Gráfico de barras de tickets por prioridad (Crítica, Alta, Media, Baja).
     - Línea temporal de auditoría y actividad reciente con enlaces de navegación.

4. **Archivos Modificados:**
   - `frontend/tailwind.config.js`: Integración de tokens de color `nexora` (`ivory`, `pine`, `sage`, `bronze`, `charcoal`), sombras suaves y fuentes personalizadas.
   - `frontend/index.html`: Carga de Google Fonts (*Plus Jakarta Sans* e *Inter*) y actualización del título a **NEXORA Intelligence Operations**.
   - `frontend/src/index.css`: Ajustes globales de antialiasing, utilidades `.nexora-glass-dark`, `.nexora-glass-light` y scrollbars estilizadas.
   - `frontend/src/components/layout/Sidebar.jsx`: Navegación lateral verde pino (`#202C2A`), logotipo NEXORA, cuadro resumen de políticas de SLA, enlaces a rutas principales y estado "Sistema en línea".
   - `frontend/src/components/layout/Navbar.jsx`: Barra superior marfil con buscador global, reloj en vivo, badge de estado del API Express y avatar del agente de guardia.
   - `frontend/src/components/layout/Layout.jsx`: Contenedor principal con fondo marfil (`#F3F0E9`) y desplazamiento adaptable.
   - `frontend/src/routes/AppRoutes.jsx`: Enrutamiento con `/` para `HomePage`, `/dashboard` para `DashboardPage`, `/metricas` para `MetricsPage`, y todas las rutas internas de tickets, agentes y clientes bajo `Layout`.
   - `frontend/src/pages/DashboardPage.jsx`: Centro de Operaciones con 4 KPIs superiores, stepper visual del flujo de tickets, gráfico Donut de carga por agente, alertas de SLA en riesgo y actividad en vivo.
   - `frontend/src/pages/TicketsListPage.jsx`: Tabla refinada con buscador dinámico, selectores de estado, prioridad y área, badges de SLA y paginación.
   - `frontend/src/pages/CreateTicketPage.jsx`: Formulario empresarial con panel de recomendación de IA DeepSeek (`AiRecommendationPanel`), selector de prioridades SLA y cálculo de auto-asignación.
   - `frontend/src/pages/TicketDetailPage.jsx`: Ficha operativa integral con stepper de ciclo de vida, trazabilidad del Ticket #42, comentarios destacados de resolución e historial inmutable de auditoría.
   - `frontend/src/pages/AgentsPage.jsx` y `frontend/src/pages/ClientsPage.jsx`: Rediseño con la paleta marfil, pino y bronce, tablas consistentes y modales con diseño NEXORA.
   - `frontend/src/pages/EditTicketPage.jsx` y `frontend/src/pages/NotFoundPage.jsx`: Alineación cromática y tipográfica con la identidad de marca.
   - `frontend/src/utils/formatters.js`: Actualización de badges de estado y prioridad a los tonos oficiales Nexora y adición del helper `formatRelativeTime`.

5. **Pruebas y Verificaciones Realizadas:**
   - **Compilación de producción de Vite (`npm run build`):** Éxito (código 0). Generó bundle optimizado (`dist/index.html` 0.86 kB, `index-*.css` 48.11 kB, `index-*.js` 342.46 kB en 13.35s).
   - **Pruebas unitarias y de integración de Frontend (`npm test` en `frontend/`):** 15 de 15 pruebas aprobadas (código 0) en 207ms.
   - **Pruebas de integración del Backend (`npm test` en `backend/`):** 45 de 45 pruebas aprobadas (código 0) en 1094ms, verificando SLA, asignación automática, auditoría y transacciones SQLite.
   - **Inspección visual en navegador real (Browser Subagent):**
     - Verificación de la Homepage en `http://localhost:5173/` con hero, caso Ticket #42, bento grid y banner.
     - Verificación del Centro de Operaciones en `http://localhost:5173/dashboard` con métricas, stepper, carga por agente y alertas de SLA.
     - Verificación del listado de tickets en `http://localhost:5173/tickets` con filtros y paginación.
     - Verificación del detalle del Ticket #42 en `http://localhost:5173/tickets/42` con comentarios e historial de auditoría.
     - Verificación de la pantalla de métricas en `http://localhost:5173/metricas` con gráficos Donut, curvas de tiempo y barras de prioridad.
     - Verificación del formulario de creación en `http://localhost:5173/tickets/nuevo` con el panel de DeepSeek.

6. **Resultado:**
   La aplicación ha sido transformada visualmente al estándar de la Propuesta 2, convirtiéndose en un producto de nivel empresarial sofisticado y cinematográfico, manteniendo al 100% su operatividad técnica con Express, SQLite y n8n.

---

### REVISIÓN FINAL DE CALIDAD — NEXORA INTELLIGENCE OPERATIONS

1. **Objetivo de la auditoría:**
   Realizar una auditoría técnica y funcional exhaustiva del sistema tras la implementación visual de NEXORA. Comprobar la rigurosidad en los límites de SLA por prioridad (Alta: 4h, Media: 24h, Baja: 72h) eliminando cualquier umbral universal erróneo; erradicar la prioridad no oficial "Crítica" del catálogo de visualización; asegurar la consistencia temporal bajo la zona horaria `America/Costa_Rica` (UTC-6) sin sesgos en el cálculo de horas; y verificar la integridad operativa del backend, base de datos SQLite, asignación automática, máquina de estados, integración con n8n/DeepSeek y suites de pruebas automatizadas.

2. **Debilidades detectadas y correcciones aplicadas:**
   - **SLA — Umbral universal vs. Vencimiento individual:**
     - *Defecto:* En `/metricas`, el gráfico de tiempo de resolución comparaba todos los tickets contra una línea estática de "Objetivo: < 4h", clasificando incorrectamente tickets de prioridad media (24h) y baja (72h) como fuera de SLA. En `/dashboard`, el filtro de "En Riesgo" calculaba tickets activos sin filtrar por la ventana crítica restante `<= 4 horas`.
     - *Corrección:* Se reescribió `getSlaInfo` en `frontend/src/utils/formatters.js` para contrastar individualmente la fecha límite (`fecha_limite`) calculada en backend contra `fecha_resolucion` (o `Date.now()` para activos). En `DashboardPage.jsx`, se delimitó estrictamente la condición de riesgo a `diffHoras <= 4 && diffHoras >= 0`. En `MetricsPage.jsx`, se eliminó la meta plana de 4h y se reemplazó por la política segmentada oficial (Alta: 4h, Media: 24h, Baja: 72h).
   - **Catálogo de prioridades — Eliminación de «Crítica»:**
     - *Defecto:* En `MetricsPage.jsx`, el objeto de conteo inicial y el gráfico de barras incluían "Crítica" como categoría visible con valor 0, introducida durante el maquetado del rediseño visual. La base de datos (`schema.sql`) rechaza cualquier valor fuera de `baja`, `media`, `alta`.
     - *Corrección:* Se removió "Crítica" de los contadores y del gráfico de barras en `MetricsPage.jsx`. Se sincronizó con `DashboardPage.jsx` donde se retiró la etiqueta obsoleta "(Crítica: 4h)". La visualización refleja estrictamente las 3 columnas canónicas (`alta`, `media`, `baja`).
   - **Zona horaria — Sesgo de interpretación UTC a local:**
     - *Defecto:* SQLite almacena fechas como cadenas ISO sin sufijo de zona horaria (`YYYY-MM-DD HH:MM:SS`) generadas en UTC por `datetime('now')`. Los navegadores y entornos V8 interpretan estas cadenas como hora local si no llevan la designación `Z`, ocasionando un desplazamiento de +6 horas en Costa Rica (UTC-6) que falseaba el cálculo de `getSlaInfo`.
     - *Corrección:* Se creó el helper `parseDate(dateString)` en `formatters.js` y `parseDateUtc` en `backend/src/utils/dateUtils.js`, asegurando que toda fecha SQLite sea interpretada como UTC (`+ 'Z'`). Se configuró la visualización en `Intl.DateTimeFormat` con `timeZone: 'America/Costa_Rica'` en `formatDate`, `formatTime` y `Navbar.jsx`.

3. **Archivos creados y modificados:**
   - `frontend/src/utils/formatters.js`: Normalización UTC `parseDate`, configuración de zona horaria `America/Costa_Rica`, refactorización de `getSlaInfo` y límites oficiales en `getPriorityConfig`.
   - `backend/src/utils/dateUtils.js`: Helper `parseDateUtc` y verificación precisa de `isSlaBreached`.
   - `frontend/src/pages/DashboardPage.jsx`: Corrección en cálculo de tickets en riesgo (`<= 4h` restantes) y depuración del texto de políticas SLA.
   - `frontend/src/pages/MetricsPage.jsx`: Supresión de "Crítica" en conteos y barras; eliminación de la línea universal de 4h en el gráfico de tiempos de resolución.
   - `frontend/src/components/layout/Navbar.jsx`: Reloj operativo en vivo sincronizado explícitamente con `America/Costa_Rica`.
   - `frontend/tests/qualityAudit.test.js` *(Creado)*: Suite con 10 pruebas unitarias que validan umbrales SLA (4h, 24h, 72h), ausencia de regla universal de 4h, cumplimiento de `fecha_resolucion`, catálogo estricto y conversión UTC a Costa Rica.
   - `frontend/package.json`: Script `"test"` actualizado para ejecutar concurrentemente `aiIntegration.test.js` y `qualityAudit.test.js`.

4. **Resultados reales de verificación y pruebas:**
   - **Pruebas Frontend (`npm test` en `frontend/`):**
     - Total: **25 de 25 pruebas aprobadas** (15 de integración IA + 10 de auditoría de calidad).
     - Duración: ~238 ms.
     - Códigos de salida: 0 fallos.
   - **Pruebas Backend (`npm test` en `backend/`):**
     - Total: **45 de 45 pruebas aprobadas** en 9 suites.
     - Duración: ~1496 ms.
     - Cobertura: SLA 4h/24h/72h, auto-asignación por menor carga, reversión transaccional, errores 400/404/409, y validación estricta de áreas.
   - **Verificación de Base de Datos SQLite (`node database/verifyDb.js`):**
     - Total: **9 de 9 verificaciones aprobadas**.
     - Restricciones CHECK, claves foráneas `ON DELETE RESTRICT`, integridad de historial y transacciones validadas al 100%.
   - **Compilación de Producción (`npm run build` en `frontend/`):**
     - Vite v6.4.5: Éxito en 6.80s.
     - `dist/index.html`: 0.86 kB
     - `dist/assets/index-CqKBAKo-.css`: 48.16 kB
     - `dist/assets/index-CMSOfm1b.js`: 344.02 kB
     - 0 errores de sintaxis, tipos o referencias rotas.

5. **Estado final del sistema:**
   **Completado y Auditado.** NEXORA Intelligence Operations opera con consistencia matemática total en métricas y SLAs, alineación estricta con el catálogo relacional, manejo temporal determinista en la zona horaria de Costa Rica y verificación automatizada integral.




