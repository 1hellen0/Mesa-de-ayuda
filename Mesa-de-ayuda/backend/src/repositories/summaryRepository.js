import db from '../config/database.js';

export const summaryRepository = {
  getSummary() {
    // 1. Resumen general y tickets por estado (calculado en SQL)
    const sqlTicketsEstado = `
      SELECT
        COUNT(*) AS total_tickets,
        SUM(CASE WHEN estado = 'abierto' THEN 1 ELSE 0 END) AS abiertos,
        SUM(CASE WHEN estado = 'en progreso' THEN 1 ELSE 0 END) AS en_progreso,
        SUM(CASE WHEN estado = 'resuelto' THEN 1 ELSE 0 END) AS resueltos,
        SUM(CASE WHEN estado = 'cerrado' THEN 1 ELSE 0 END) AS cerrados,
        SUM(CASE WHEN estado IN ('abierto', 'en progreso') AND fecha_limite < datetime('now') THEN 1 ELSE 0 END) AS vencidos_activos
      FROM tickets;
    `;
    const ticketsPorEstado = db.prepare(sqlTicketsEstado).get();

    // 2. Carga actual por agente (tickets en 'abierto' o 'en progreso')
    const sqlCargaAgente = `
      SELECT
        a.id AS agente_id,
        a.nombre AS agente_nombre,
        a.area AS agente_area,
        a.activo AS agente_activo,
        COUNT(t.id) AS tickets_en_curso
      FROM agentes a
      LEFT JOIN tickets t ON t.agente_id = a.id AND t.estado IN ('abierto', 'en progreso')
      GROUP BY a.id, a.nombre, a.area, a.activo
      ORDER BY tickets_en_curso DESC, a.nombre ASC;
    `;
    const cargaPorAgente = db.prepare(sqlCargaAgente).all();

    // 3. Porcentaje de cumplimiento del SLA
    // Fórmula: (Tickets resueltos con fecha de resolución <= fecha_limite / Total tickets resueltos) * 100
    // Se utiliza el evento de resolución en el historial para corroborar la fecha de cierre.
    const sqlSla = `
      WITH TicketsResolucion AS (
        SELECT
          t.id,
          t.fecha_limite,
          t.estado,
          COALESCE(
            t.fecha_resolucion,
            (SELECT h.created_at FROM historial h
             WHERE h.ticket_id = t.id AND h.tipo_evento = 'cambio_estado' AND h.valor_nuevo = 'resuelto'
             ORDER BY h.id DESC LIMIT 1)
          ) AS fecha_cierre_real
        FROM tickets t
        WHERE t.estado IN ('resuelto', 'cerrado')
      )
      SELECT
        COUNT(*) AS total_resueltos,
        SUM(CASE WHEN fecha_cierre_real <= fecha_limite THEN 1 ELSE 0 END) AS resueltos_dentro_sla,
        SUM(CASE WHEN fecha_cierre_real > fecha_limite THEN 1 ELSE 0 END) AS resueltos_fuera_sla,
        ROUND(
          CAST(SUM(CASE WHEN fecha_cierre_real <= fecha_limite THEN 1 ELSE 0 END) AS REAL) * 100.0 /
          NULLIF(COUNT(*), 0),
          1
        ) AS porcentaje_cumplimiento_sla
      FROM TicketsResolucion;
    `;
    const cumplimientoSla = db.prepare(sqlSla).get();

    // 4. Tiempo promedio de resolución (en horas)
    // Fórmula: AVG((fecha_cierre_real - created_at) en horas)
    // Se calcula mediante la diferencia de días julianos multiplicada por 24 horas.
    const sqlTiempoPromedio = `
      WITH TiemposResolucion AS (
        SELECT
          t.id,
          (
            julianday(
              COALESCE(
                t.fecha_resolucion,
                (SELECT h.created_at FROM historial h
                 WHERE h.ticket_id = t.id AND h.tipo_evento = 'cambio_estado' AND h.valor_nuevo = 'resuelto'
                 ORDER BY h.id DESC LIMIT 1)
              )
            ) - julianday(t.created_at)
          ) * 24.0 AS horas_resolucion
        FROM tickets t
        WHERE t.estado IN ('resuelto', 'cerrado')
      )
      SELECT
        ROUND(AVG(horas_resolucion), 2) AS tiempo_promedio_horas,
        ROUND(MIN(horas_resolucion), 2) AS tiempo_minimo_horas,
        ROUND(MAX(horas_resolucion), 2) AS tiempo_maximo_horas
      FROM TiemposResolucion
      WHERE horas_resolucion IS NOT NULL;
    `;
    const tiempoResolucion = db.prepare(sqlTiempoPromedio).get();

    return {
      resumen_tickets: {
        total: ticketsPorEstado.total_tickets,
        abiertos: ticketsPorEstado.abiertos,
        en_progreso: ticketsPorEstado.en_progreso,
        resueltos: ticketsPorEstado.resueltos,
        cerrados: ticketsPorEstado.cerrados,
        vencidos_activos: ticketsPorEstado.vencidos_activos
      },
      cumplimiento_sla: {
        total_evaluados: cumplimientoSla.total_resueltos || 0,
        resueltos_a_tiempo: cumplimientoSla.resueltos_dentro_sla || 0,
        resueltos_tarde: cumplimientoSla.resueltos_fuera_sla || 0,
        porcentaje_cumplimiento: cumplimientoSla.porcentaje_cumplimiento_sla !== null
          ? cumplimientoSla.porcentaje_cumplimiento_sla
          : 0,
        formula: '(resueltos_a_tiempo / total_resueltos) * 100'
      },
      tiempo_promedio_resolucion: {
        horas_promedio: tiempoResolucion.tiempo_promedio_horas !== null
          ? tiempoResolucion.tiempo_promedio_horas
          : 0,
        horas_minimo: tiempoResolucion.tiempo_minimo_horas !== null
          ? tiempoResolucion.tiempo_minimo_horas
          : 0,
        horas_maximo: tiempoResolucion.tiempo_maximo_horas !== null
          ? tiempoResolucion.tiempo_maximo_horas
          : 0,
        formula: 'AVG((fecha_resolucion - created_at) * 24 horas)'
      },
      carga_por_agente: cargaPorAgente
    };
  }
};
