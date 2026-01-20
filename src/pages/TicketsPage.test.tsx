import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TicketsPage from './TicketsPage';
import { ticketService } from '../services/ticket.service';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../services/ticket.service');
vi.mock('../layout/DashboardLayout', () => ({
    DashboardLayout: ({ children, title }: { children: React.ReactNode; title: string }) => (
        <div>
            <h1>{title}</h1>
            {children}
        </div>
    )
}));

vi.mock('../components/tickets/CreateTicketModal', () => ({
    CreateTicketModal: () => <div>CreateTicketModal Mock</div>
}));

const mockTicketsPage1 = Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    subject: `Ticket ${i + 1}`,
    customer: 'Customer',
    customerInitials: 'CU',
    status: 'Abierto',
    priority: 'Media',
    lastUpdated: 'Today'
}));

const mockResponsePage1 = {
    data: mockTicketsPage1,
    meta: { total: 25, page: 1, limit: 10, totalPages: 3 }
};

const mockResponsePage2 = {
    data: mockTicketsPage1.map(t => ({ ...t, id: t.id + 10, subject: `Ticket ${t.id + 10}` })),
    meta: { total: 25, page: 2, limit: 10, totalPages: 3 }
};

describe('TicketsPage Pagination', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (ticketService.getTickets as any).mockResolvedValue(mockResponsePage1);
    });

    it('renders pagination controls and handles page changes', async () => {
        render(
            <MemoryRouter>
                <TicketsPage />
            </MemoryRouter>
        );

        // Verify initial load (Page 1)
        // Verify initial load (Page 1)
        await waitFor(() => expect(screen.getByText('Ticket 1')).toBeTruthy());

        // Use a function match for text split across multiple elements
        expect(screen.getByText((content, element) => {
            return element?.tagName.toLowerCase() === 'div' &&
                element.textContent === 'Showing 1 to 10 of 25 results';
        })).toBeTruthy();

        const prevBtn = screen.getByText('Previous') as HTMLButtonElement;
        const nextBtn = screen.getByText('Next') as HTMLButtonElement;

        expect(prevBtn.disabled).toBe(true);
        expect(nextBtn.disabled).toBe(false);

        // Click Next
        (ticketService.getTickets as any).mockResolvedValue(mockResponsePage2);
        fireEvent.click(nextBtn);

        await waitFor(() => expect(ticketService.getTickets).toHaveBeenCalledWith(expect.objectContaining({ page: 2 })));

        // Wait for page 2 update
        await waitFor(() => expect(screen.getByText('Ticket 11')).toBeTruthy());
        expect(screen.getByText((content, element) => {
            return element?.tagName.toLowerCase() === 'div' &&
                element.textContent === 'Showing 11 to 20 of 25 results';
        })).toBeTruthy();

        expect(prevBtn.disabled).toBe(false);
        expect(nextBtn.disabled).toBe(false); // Valid since total pages is 3

        // Click Previous
        (ticketService.getTickets as any).mockResolvedValue(mockResponsePage1);
        fireEvent.click(prevBtn);

        await waitFor(() => expect(ticketService.getTickets).toHaveBeenCalledWith(expect.objectContaining({ page: 1 })));
        await waitFor(() => expect(screen.getByText('Ticket 1')).toBeTruthy());
        expect(prevBtn.disabled).toBe(true);
    });
});
