import { useState, useEffect } from 'react';
import { Modal } from '../../../shared/components/Modal';
import { Button } from '../../../shared/components/Button';
import { Input } from '../../../shared/components/Input';
import { Select } from '../../../shared/components/Select';
import { ticketService } from '../services/ticket.service';
import { categoryService } from '../services/category.service';
import { priorityService } from '../services/priority.service';
import type { Category } from '../interfaces/Category';
import type { Priority } from '../interfaces/Priority';
import type { UpdateTicketDto, TicketDetail } from '../interfaces/Ticket';

interface EditTicketModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    ticket: TicketDetail | null;
    className?: string;
}

export function EditTicketModal({ isOpen, onClose, onSuccess, ticket, className }: EditTicketModalProps) {
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const [priorities, setPriorities] = useState<Priority[]>([]);

    // Form state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [categoryId, setCategoryId] = useState<number | ''>('');
    const [priorityId, setPriorityId] = useState<number | ''>('');

    // Fetch dependencies and initial values
    useEffect(() => {
        if (isOpen) {
            loadDependencies();
        }
    }, [isOpen]);

    useEffect(() => {
        if (isOpen && ticket) {
            setTitle(ticket.subject);
            setDescription(ticket.description);
            setCategoryId(ticket.categoryId || '');
            setPriorityId(ticket.priorityId || '');
        }
    }, [isOpen, ticket]);

    const loadDependencies = async () => {
        try {
            const [cats, prios] = await Promise.all([
                categoryService.getCategories(),
                priorityService.getPriorities()
            ]);
            setCategories(cats);
            setPriorities(prios);
        } catch (error) {
            console.error("Error loading form dependencies", error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!ticket || !title || !description || !categoryId) return;

        setLoading(true);
        try {
            const payload: UpdateTicketDto = {
                titulo: title,
                descripcion: description,
                categoriaId: Number(categoryId),
                prioridadId: priorityId ? Number(priorityId) : undefined
            };

            await ticketService.updateTicket(ticket.id, payload);
            onSuccess();
            onClose();
        } catch (error) {
            console.error("Error updating ticket", error);
        } finally {
            setLoading(false);
        }
    };

    if (!ticket) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Edit Ticket #${ticket.id}`}
            className={`max-w-2xl ${className || ''}`}
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                    <Input
                        label="Subject"
                        placeholder="Brief summary of the issue"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                    />

                    <div className="space-y-2">
                        <Select
                            label="Category"
                            placeholder="Select a Category..."
                            value={categoryId}
                            onChange={(val) => setCategoryId(Number(val))}
                            options={categories.map(cat => ({ value: cat.id, label: cat.nombre }))}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Select
                            label="Priority"
                            placeholder="Default Priority"
                            value={priorityId}
                            onChange={(val) => setPriorityId(Number(val))}
                            options={priorities.map(prio => ({ value: prio.id, label: prio.nombre }))}
                            isClearable={true}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Description</label>
                        <textarea
                            rows={4}
                            className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-brand-teal focus:ring-brand-teal sm:text-sm"
                            placeholder="Detailed description of the problem..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            required
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                    <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
                        Cancel
                    </Button>
                    <Button type="submit" variant="brand" disabled={loading}>
                        {loading ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
