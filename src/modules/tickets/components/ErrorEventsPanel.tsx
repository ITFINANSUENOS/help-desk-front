import { useState, useEffect } from 'react';
import { ticketService, type ErrorType } from '../services/ticket.service';
import { Button } from '../../../shared/components/Button';
import { toast } from 'sonner';

interface ErrorEventsPanelProps {
    ticketId: number;
    onSuccess: () => void;
}

export const ErrorEventsPanel = ({ ticketId, onSuccess }: ErrorEventsPanelProps) => {
    const [errorTypes, setErrorTypes] = useState<ErrorType[]>([]);
    const [selectedErrorId, setSelectedErrorId] = useState<number | ''>('');
    const [selectedSubtypeId, setSelectedSubtypeId] = useState<number | ''>('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

    const relatedSubtypes = selectedErrorId
        ? errorTypes.find(t => t.id === Number(selectedErrorId))?.subtypes || []
        : [];

    useEffect(() => {
        const fetchErrorTypes = async () => {
            try {
                const types = await ticketService.getErrorTypes();
                setErrorTypes(types);
            } catch (error) {
                console.error("Failed to load error types", error);
                toast.error("Error al cargar tipos de error");
            } finally {
                setFetching(false);
            }
        };

        fetchErrorTypes();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedErrorId) return;

        try {
            setLoading(true);
            await ticketService.registerErrorEvent(ticketId, {
                errorTypeId: Number(selectedErrorId),
                errorSubtypeId: selectedSubtypeId ? Number(selectedSubtypeId) : undefined,
                description
            });
            toast.success("Evento registrado correctamente");
            setDescription('');
            setSelectedErrorId('');
            setSelectedSubtypeId('');
            onSuccess();
        } catch (error) {
            console.error("Failed to register event", error);
            toast.error("Error al registrar el evento");
        } finally {
            setLoading(false);
        }
    };

    if (fetching) return <div className="text-sm text-gray-500">Cargando tipos de error...</div>;

    return (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6 mb-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Registrar Evento / Error</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tipo de Evento
                    </label>
                    <select
                        className="block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary sm:text-sm"
                        value={selectedErrorId}
                        onChange={(e) => {
                            setSelectedErrorId(Number(e.target.value));
                            setSelectedSubtypeId('');
                        }}
                        required
                    >
                        <option value="">Seleccione un tipo...</option>
                        {errorTypes.map((type) => (
                            <option key={type.id} value={type.id}>
                                {type.title}
                            </option>
                        ))}
                    </select>
                </div>

                {relatedSubtypes.length > 0 && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Subtipo (Detalle)
                        </label>
                        <select
                            className="block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary sm:text-sm"
                            value={selectedSubtypeId}
                            onChange={(e) => setSelectedSubtypeId(Number(e.target.value))}
                            required
                        >
                            <option value="">Seleccione una opción...</option>
                            {relatedSubtypes.map((subtype) => (
                                <option key={subtype.id} value={subtype.id}>
                                    {subtype.title}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Descripción (Opcional)
                    </label>
                    <textarea
                        className="block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary sm:text-sm"
                        rows={3}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Detalles adicionales del evento..."
                    />
                </div>

                <div className="flex justify-end">
                    <Button
                        type="submit"
                        className="bg-brand-blue text-white hover:bg-brand-blue/90 focus:ring-brand-blue"
                        disabled={loading || !selectedErrorId || (relatedSubtypes.length > 0 && !selectedSubtypeId)}
                    >
                        {loading ? 'Registrando...' : 'Registrar Evento'}
                    </Button>
                </div>
            </form>
        </div>
    );
};
