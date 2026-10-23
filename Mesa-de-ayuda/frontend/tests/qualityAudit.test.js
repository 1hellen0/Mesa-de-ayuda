/**
 * Suite de Pruebas de Auditoría de Calidad — NEXORA INTELLIGENCE OPERATIONS
 *
 * Verifica:
 * 1. SLA por prioridad: Alta (4h), Media (24h), Baja (72h).
 * 2. Catálogo estricto de prioridades: solo 'alta', 'media', 'baja' (sin 'crítica').
 * 3. Zona horaria: Conversión y visualización coherente con America/Costa_Rica (UTC-6).
 * 4. Inmutabilidad y consistencia del cálculo de SLA sin umbral universal.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseDate,
  formatDate,
  formatTime,
  getSlaInfo,
  TIMEZONE_CR
} from '../src/utils/formatters.js';
import {
  TICKET_PRIORITY,
  SLA_HOURS,
  TICKET_STATUS
} from '../src/utils/constants.js';

describe('Auditoría de Calidad — SLA, Catálogo y Zona Horaria (America/Costa_Rica)', () => {

  // 1. SLA Y LÍMITES POR PRIORIDAD
  describe('1. SLA y Límites por Prioridad', () => {
    test('Los umbrales de SLA oficiales son estrictamente 4h (Alta), 24h (Media) y 72h (Baja)', () => {
      assert.strictEqual(SLA_HOURS[TICKET_PRIORITY.ALTA], 4, 'Alta debe ser exactamente 4 horas');
      assert.strictEqual(SLA_HOURS[TICKET_PRIORITY.MEDIA], 24, 'Media debe ser exactamente 24 horas');
      assert.strictEqual(SLA_HOURS[TICKET_PRIORITY.BAJA], 72, 'Baja debe ser exactamente 72 horas');
      assert.strictEqual(Object.keys(SLA_HOURS).length, 3, 'Solo deben existir 3 políticas de SLA');
    });

    test('getSlaInfo evalúa el vencimiento según fecha_limite individual, no por umbral universal de 4h', () => {
      const now = new Date();
      // Ticket con prioridad Baja (72h), creado hace 10h, le restan 62 horas. NO debe marcarse como vencido por superar 4h
      const fechaLimiteBaja = new Date(now.getTime() + 62 * 3600 * 1000).toISOString().replace('T', ' ').substring(0, 19);

      const ticketBaja = {
        id: 99,
        prioridad: TICKET_PRIORITY.BAJA,
        estado: TICKET_STATUS.EN_PROGRESO,
        fecha_limite: fechaLimiteBaja
      };

      const slaInfo = getSlaInfo(ticketBaja);
      assert.strictEqual(slaInfo.isOverdue, false, 'Un ticket de baja con 62h restantes no debe marcarse como vencido');
      assert.ok(slaInfo.text.includes('Quedan'), `Debe indicar tiempo restante, obtenido: ${slaInfo.text}`);
    });

    test('getSlaInfo detecta cumplimiento a tiempo cuando fecha_resolucion <= fecha_limite', () => {
      const ticketResuelto = {
        id: 42,
        prioridad: TICKET_PRIORITY.MEDIA,
        estado: TICKET_STATUS.CERRADO,
        fecha_limite: '2026-10-23 22:21:54',
        fecha_resolucion: '2026-10-22 22:26:51' // Resuelto 5 minutos después de creado
      };

      const slaInfo = getSlaInfo(ticketResuelto);
      assert.strictEqual(slaInfo.isOverdue, false, 'Ticket resuelto antes del límite debe ser a tiempo');
      assert.strictEqual(slaInfo.text, 'Cumplido a tiempo');
    });

    test('getSlaInfo detecta incumplimiento cuando fecha_resolucion > fecha_limite', () => {
      const ticketTarde = {
        id: 43,
        prioridad: TICKET_PRIORITY.ALTA,
        estado: TICKET_STATUS.RESUELTO,
        fecha_limite: '2026-10-22 14:00:00',
        fecha_resolucion: '2026-10-22 15:30:00' // Resuelto 1.5 horas tarde
      };

      const slaInfo = getSlaInfo(ticketTarde);
      assert.strictEqual(slaInfo.isOverdue, true, 'Ticket resuelto tras la fecha límite debe ser incumplido');
      assert.strictEqual(slaInfo.text, 'Resuelto fuera de plazo');
    });
  });

  // 2. CATÁLOGO OFICIAL DE PRIORIDADES
  describe('2. Catálogo Oficial de Prioridades', () => {
    test('El catálogo de prioridades solo permite exactamente alta, media y baja', () => {
      const prioridades = Object.values(TICKET_PRIORITY);
      assert.deepStrictEqual(prioridades.sort(), ['alta', 'baja', 'media'].sort());
      assert.ok(!prioridades.includes('critica'), 'No debe existir prioridad crítica');
      assert.ok(!prioridades.includes('urgente'), 'No debe existir prioridad urgente');
    });
  });

  // 3. ZONA HORARIA AMERICA/COSTA_RICA
  describe('3. Zona Horaria y Conversión de Fechas (America/Costa_Rica)', () => {
    test('Constante de zona horaria oficial es America/Costa_Rica', () => {
      assert.strictEqual(TIMEZONE_CR, 'America/Costa_Rica');
    });

    test('parseDate interpreta correctamente timestamps de SQLite UTC sin sesgo local', () => {
      // 2026-10-22 22:21:54 UTC
      const parsed = parseDate('2026-10-22 22:21:54');
      assert.ok(parsed instanceof Date, 'Debe retornar instancia de Date');
      assert.strictEqual(parsed.toISOString(), '2026-10-22T22:21:54.000Z', 'Debe corresponder exactamente al instante UTC');
    });

    test('formatDate convierte instantes UTC a la hora local de America/Costa_Rica (UTC-6)', () => {
      // 22:21:54 UTC equivale a 16:21:54 en Costa Rica (UTC-6)
      const formatted = formatDate('2026-10-22 22:21:54');
      assert.ok(formatted.includes('22 oct'), 'Debe incluir la fecha 22 oct');
      assert.ok(formatted.includes('04:21') || formatted.includes('4:21') || formatted.includes('16:21'),
        `Debe mostrar 04:21 p.m. o 16:21 en hora de Costa Rica, obtenido: ${formatted}`);
    });

    test('formatTime convierte timestamp UTC a hora 24h de Costa Rica', () => {
      // 22:21:54 UTC -> 16:21 en Costa Rica
      const timeStr = formatTime('2026-10-22 22:21:54');
      assert.strictEqual(timeStr, '16:21', 'Debe ser 16:21 en hora de Costa Rica');
    });

    test('Resistencia ante entradas nulas, vacías o malformadas', () => {
      assert.strictEqual(formatDate(null), '—');
      assert.strictEqual(formatDate(''), '—');
      assert.strictEqual(formatTime(null), '—');
      assert.strictEqual(parseDate(null), null);
    });
  });

});
