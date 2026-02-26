import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ScoreBadge } from '../components/ui/ScoreBadge';

/**
 * ScoreBadge renders a coloured pill showing the formatted score.
 * Colour classes are determined by getClasificacionCumplimiento (>= 90 verde, >= 75 amarillo, < 75 rojo).
 */
describe('ScoreBadge', () => {
    it('renders the formatted score text', () => {
        const { container } = render(<ScoreBadge score={91.5} />);
        expect(container.textContent).toBe('91.5');
    });

    it('applies green classes for score >= 90', () => {
        const { container } = render(<ScoreBadge score={92} />);
        const el = container.firstElementChild as HTMLElement;
        expect(el.className).toContain('bg-green-100');
        expect(el.className).toContain('text-green-800');
    });

    it('applies yellow classes for score >= 75 and < 90', () => {
        const { container } = render(<ScoreBadge score={80} />);
        const el = container.firstElementChild as HTMLElement;
        expect(el.className).toContain('bg-yellow-100');
        expect(el.className).toContain('text-yellow-800');
    });

    it('applies red classes for score < 75', () => {
        const { container } = render(<ScoreBadge score={60} />);
        const el = container.firstElementChild as HTMLElement;
        expect(el.className).toContain('bg-red-100');
        expect(el.className).toContain('text-red-800');
    });

    it('renders "90.0" for score exactly 90', () => {
        const { container } = render(<ScoreBadge score={90} />);
        expect(container.textContent).toBe('90.0');
    });

    it('renders "75.0" for score exactly 75 and uses yellow', () => {
        const { container } = render(<ScoreBadge score={75} />);
        expect(container.textContent).toBe('75.0');
        const el = container.firstElementChild as HTMLElement;
        expect(el.className).toContain('bg-yellow-100');
    });

    it('merges extra className prop', () => {
        const { container } = render(<ScoreBadge score={90} className="extra-class" />);
        const el = container.firstElementChild as HTMLElement;
        expect(el.className).toContain('extra-class');
    });
});
