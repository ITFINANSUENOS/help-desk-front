import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TicketDetailPage from './TicketDetailPage';
import { ticketService } from '../services/ticket.service';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

vi.mock('../services/ticket.service');

vi.mock('../layout/DashboardLayout', () => ({
    DashboardLayout: ({ children, title }: { children: React.ReactNode; title: string }) => (
        <div>
            <h1>{title}</h1>
            {children}
        </div>
    )
}));

vi.mock('../components/tickets/TicketWorkflow', () => ({
    TicketWorkflow: () => <div>Workflow Mock</div>
}));

vi.mock('../components/tickets/TicketTimeline', () => ({
    TicketTimeline: ({ items }: { items: any[] }) => (
        <div data-testid="timeline">
            {items.map(item => (
                <div key={item.id}>
                    {item.type === 'comment' && <span>Comment: {item.content}</span>}
                    {item.type === 'status_change' && <span>Status: {item.metadata?.newStatus}</span>}
                    {item.type === 'assignment' && <span>Assignment: {item.content}</span>}
                </div>
            ))}
        </div>
    )
}));

const mockTicket = {
    id: 1,
    subject: 'Test Ticket',
    customer: 'Customer A',
    status: 'Abierto',
    priority: 'Alta',
    createdDate: '2023-01-01',
    category: 'Hardware',
    customerInitials: 'CA',
    lastUpdated: '2h ago',
    description: 'Desc',
    subcategory: 'Sub',
    workflowStep: 'Step 1',
    workflowStepId: 1,
    creatorName: 'Creator'
};

const mockTimeline = [
    {
        id: 1,
        type: 'comment',
        content: 'Comment 1',
        author: 'User',
        date: '2023-01-01T10:00:00Z',
        metadata: {}
    },
    {
        id: 2,
        type: 'status_change',
        content: 'Changed status',
        author: 'System',
        date: '2023-01-02T10:00:00Z',
        metadata: { newStatus: 'Pausado' }
    },
    {
        id: 3,
        type: 'assignment',
        content: 'Assigned to Admin',
        author: 'Admin',
        date: '2023-01-03T10:00:00Z',
        metadata: {}
    }
];

describe('TicketDetailPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (ticketService.getTicket as any).mockResolvedValue(mockTicket);
        (ticketService.getTicketTimeline as any).mockResolvedValue(mockTimeline);
    });

    it('filters timeline items correctly', async () => {
        render(
            <MemoryRouter initialEntries={['/tickets/1']}>
                <Routes>
                    <Route path="/tickets/:id" element={<TicketDetailPage />} />
                </Routes>
            </MemoryRouter>
        );

        // Wait for ticket to load
        await waitFor(() => expect(screen.getByText(/Test Ticket/i)).toBeTruthy());

        // Default: All items visible
        expect(screen.getByText('Comment: Comment 1')).toBeTruthy();
        expect(screen.getByText('Status: Pausado')).toBeTruthy();
        expect(screen.getByText('Assignment: Assigned to Admin')).toBeTruthy();

        // Switch to comments
        const commentsBtn = screen.getByText('Comentarios');
        fireEvent.click(commentsBtn);

        expect(screen.getByText('Comment: Comment 1')).toBeTruthy();
        expect(screen.queryByText('Status: Pausado')).toBeNull();
        expect(screen.queryByText('Assignment: Assigned to Admin')).toBeNull();

        // Switch to history
        const historyBtn = screen.getByText('Historial');
        fireEvent.click(historyBtn);

        expect(screen.queryByText('Comment: Comment 1')).toBeNull();
        expect(screen.getByText('Status: Pausado')).toBeTruthy();
        expect(screen.getByText('Assignment: Assigned to Admin')).toBeTruthy();

        // Switch back to all
        const allBtn = screen.getByText('Toda la Actividad');
        fireEvent.click(allBtn);

        expect(screen.getByText('Comment: Comment 1')).toBeTruthy();
        expect(screen.getByText('Status: Pausado')).toBeTruthy();
    });
});
