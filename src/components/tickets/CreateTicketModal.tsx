import { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { ticketService } from '../../services/ticket.service';
import { categoryService } from '../../services/category.service';
import { priorityService } from '../../services/priority.service';
import { useAuth } from '../../context/useAuth';
import type { Category } from '../../interfaces/Category';
import type { Priority } from '../../interfaces/Priority';
import type { CreateTicketDto } from '../../interfaces/Ticket';

interface CreateTicketModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function CreateTicketModal({ isOpen, onClose, onSuccess }: CreateTicketModalProps) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const [priorities, setPriorities] = useState<Priority[]>([]);

    // Form state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [categoryId, setCategoryId] = useState<number | ''>('');
    const [priorityId, setPriorityId] = useState<number | ''>('');

    // Fetch dependencies on open
    useEffect(() => {
        if (isOpen) {
            loadDependencies();
            // Reset form
            setTitle('');
            setDescription('');
            setCategoryId('');
            setPriorityId('');
        }
    }, [isOpen]);

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
        if (!title || !description || !categoryId) return;

        setLoading(true);
        try {
            const payload: CreateTicketDto = {
                titulo: title,
                descripcion: description,
                categoriaId: Number(categoryId),
                prioridadId: priorityId ? Number(priorityId) : undefined
            };

            await ticketService.createTicket(payload);
            onSuccess();
            onClose();
        } catch (error) {
            console.error("Error creating ticket", error);
            // Ideally assume global error handler or add local error state
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Create New Ticket"
            className="max-w-2xl"
        >
            <form onSubmit={handleSubmit} className="space-y-6">

                {/* User Info (Read only) */}
                <div className="rounded-lg bg-gray-50 p-4 border border-gray-100">
                    <p className="text-sm text-gray-500 mb-1">Creating as</p>
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-brand-blue text-white flex items-center justify-center font-bold text-xs">
                            {user?.nombre?.[0]}{user?.apellido?.[0]}
                        </div>
                        <div>
                            <p className="font-medium text-gray-900">{user?.nombre} {user?.apellido}</p>
                            <p className="text-xs text-gray-500">{user?.role?.nombre}</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <Input
                        label="Subject"
                        placeholder="Brief summary of the issue"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                    />

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Category</label>
                        <select
                            className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-brand-teal focus:ring-brand-teal sm:text-sm"
                            value={categoryId}
                            onChange={(e) => setCategoryId(Number(e.target.value))}
                            required
                        >
                            <option value="">Select a Category...</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Priority (Optional)</label>
                        <select
                            className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-brand-teal focus:ring-brand-teal sm:text-sm"
                            value={priorityId}
                            onChange={(e) => setPriorityId(Number(e.target.value))}
                        >
                            <option value="">Default Priority</option>
                            {priorities.map(prio => (
                                <option key={prio.id} value={prio.id}>{prio.nombre}</option>
                            ))}
                        </select>
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
                        {loading ? 'Creating...' : 'Create Ticket'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
