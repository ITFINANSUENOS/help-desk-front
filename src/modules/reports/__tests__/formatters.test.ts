import { describe, it, expect } from 'vitest';
import {
    formatHoras,
    formatPct,
    formatScore,
    formatNumero,
    formatFecha,
} from '../utils/formatters';

// ─── formatHoras ─────────────────────────────────────────────────────────
describe('formatHoras', () => {
    it('0.5h → 30min', () => expect(formatHoras(0.5)).toBe('30min'));
    it('0.25h → 15min', () => expect(formatHoras(0.25)).toBe('15min'));
    it('1h → 1.0h (boundary — exactly 1)', () => expect(formatHoras(1)).toBe('1.0h'));
    it('8h → 8.0h', () => expect(formatHoras(8)).toBe('8.0h'));
    it('23.9h → horas (< 24)', () => expect(formatHoras(23.9)).toBe('23.9h'));
    it('48h → 2.0 días', () => expect(formatHoras(48)).toBe('2.0 días'));
    it('120h → 5.0 días', () => expect(formatHoras(120)).toBe('5.0 días'));
    it('167.9h → días (< 168)', () => expect(formatHoras(167.9)).toBe('7.0 días'));
    it('336h → 2.0 sem', () => expect(formatHoras(336)).toBe('2.0 sem'));
    it('504h → 3.0 sem', () => expect(formatHoras(504)).toBe('3.0 sem'));
});

// ─── formatPct ───────────────────────────────────────────────────────────
describe('formatPct', () => {
    it('85.555 → "85.6%"', () => expect(formatPct(85.555)).toBe('85.6%'));
    it('100 → "100.0%"', () => expect(formatPct(100)).toBe('100.0%'));
    it('0 → "0.0%"', () => expect(formatPct(0)).toBe('0.0%'));
    it('33.333 → "33.3%"', () => expect(formatPct(33.333)).toBe('33.3%'));
});

// ─── formatScore ─────────────────────────────────────────────────────────
describe('formatScore', () => {
    it('91.5 → "91.5"', () => expect(formatScore(91.5)).toBe('91.5'));
    it('100 → "100.0"', () => expect(formatScore(100)).toBe('100.0'));
    it('0 → "0.0"', () => expect(formatScore(0)).toBe('0.0'));
});

// ─── formatNumero ────────────────────────────────────────────────────────
describe('formatNumero', () => {
    it('1000 → "1.000" (es-CO locale)', () =>
        expect(formatNumero(1000)).toBe('1.000'));
    it('0 → "0"', () => expect(formatNumero(0)).toBe('0'));
    it('1234567 → "1.234.567"', () =>
        expect(formatNumero(1234567)).toBe('1.234.567'));
});

// ─── formatFecha ─────────────────────────────────────────────────────────
describe('formatFecha', () => {
    it('returns a non-empty string for a valid ISO date', () => {
        const result = formatFecha('2024-12-25T00:00:00.000Z');
        expect(typeof result).toBe('string');
        expect(result.length).toBeGreaterThan(0);
    });

    it('includes the year 2024 for a 2024 date', () => {
        const result = formatFecha('2024-12-25T00:00:00.000Z');
        expect(result).toContain('2024');
    });
});
