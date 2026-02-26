import { describe, it, expect } from 'vitest';
import {
    getClasificacionCumplimiento,
    getClasificacionErrores,
    getClasificacionCuello,
    getClasificacionNovedades,
    getTailwindClasificacion,
} from '../utils/colores';

// ─── getClasificacionCumplimiento ─────────────────────────────────────────
describe('getClasificacionCumplimiento', () => {
    it('>= 90 → verde', () => expect(getClasificacionCumplimiento(95)).toBe('verde'));
    it('>= 75 → amarillo', () => expect(getClasificacionCumplimiento(80)).toBe('amarillo'));
    it('< 75 → rojo', () => expect(getClasificacionCumplimiento(60)).toBe('rojo'));
    it('exactamente 90 → verde', () => expect(getClasificacionCumplimiento(90)).toBe('verde'));
    it('exactamente 75 → amarillo', () => expect(getClasificacionCumplimiento(75)).toBe('amarillo'));
    it('74.9 → rojo', () => expect(getClasificacionCumplimiento(74.9)).toBe('rojo'));
    it('100 → verde', () => expect(getClasificacionCumplimiento(100)).toBe('verde'));
    it('0 → rojo', () => expect(getClasificacionCumplimiento(0)).toBe('rojo'));
});

// ─── getClasificacionErrores (invertido) ─────────────────────────────────
describe('getClasificacionErrores (invertido)', () => {
    it('<= 5 → verde', () => expect(getClasificacionErrores(3)).toBe('verde'));
    it('<= 15 → amarillo', () => expect(getClasificacionErrores(10)).toBe('amarillo'));
    it('> 15 → rojo', () => expect(getClasificacionErrores(20)).toBe('rojo'));
    it('exactamente 5 → verde', () => expect(getClasificacionErrores(5)).toBe('verde'));
    it('exactamente 15 → amarillo', () => expect(getClasificacionErrores(15)).toBe('amarillo'));
    it('15.1 → rojo', () => expect(getClasificacionErrores(15.1)).toBe('rojo'));
    it('0 → verde', () => expect(getClasificacionErrores(0)).toBe('verde'));
});

// ─── getClasificacionCuello ──────────────────────────────────────────────
describe('getClasificacionCuello', () => {
    it('>= 100 → rojo', () => expect(getClasificacionCuello(100)).toBe('rojo'));
    it('>= 50 → amarillo', () => expect(getClasificacionCuello(75)).toBe('amarillo'));
    it('< 50 → verde', () => expect(getClasificacionCuello(20)).toBe('verde'));
    it('exactamente 50 → amarillo', () => expect(getClasificacionCuello(50)).toBe('amarillo'));
    it('49.9 → verde', () => expect(getClasificacionCuello(49.9)).toBe('verde'));
});

// ─── getClasificacionNovedades ───────────────────────────────────────────
describe('getClasificacionNovedades', () => {
    it('>= 30 → rojo', () => expect(getClasificacionNovedades(35)).toBe('rojo'));
    it('>= 15 → amarillo', () => expect(getClasificacionNovedades(20)).toBe('amarillo'));
    it('< 15 → verde', () => expect(getClasificacionNovedades(10)).toBe('verde'));
    it('exactamente 30 → rojo', () => expect(getClasificacionNovedades(30)).toBe('rojo'));
    it('exactamente 15 → amarillo', () => expect(getClasificacionNovedades(15)).toBe('amarillo'));
    it('0 → verde', () => expect(getClasificacionNovedades(0)).toBe('verde'));
});

// ─── getTailwindClasificacion ────────────────────────────────────────────
describe('getTailwindClasificacion', () => {
    it('verde → bg-green-100 text-green-800', () =>
        expect(getTailwindClasificacion('verde')).toBe('bg-green-100 text-green-800'));
    it('amarillo → bg-yellow-100 text-yellow-800', () =>
        expect(getTailwindClasificacion('amarillo')).toBe('bg-yellow-100 text-yellow-800'));
    it('rojo → bg-red-100 text-red-800', () =>
        expect(getTailwindClasificacion('rojo')).toBe('bg-red-100 text-red-800'));
});
