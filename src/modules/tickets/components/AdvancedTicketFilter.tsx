
import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import type { TicketFilter } from '../interfaces/Ticket';
import { Button } from '../../../shared/components/Button';
import { companyService } from '../services/company.service';
import { subcategoryService } from '../services/subcategory.service';
import { tagService } from '../services/tag.service';

interface AdvancedTicketFilterProps {
    filters: TicketFilter;
    onFilterChange: (filters: TicketFilter) => void;
    onClear: () => void;
}

interface FilterFormValues {
    companyId?: number;
    subcategoryId?: number;
    tagId?: number;
    ticketId?: number;
    dateFrom?: string;
    dateTo?: string;
    creatorId?: number; // Though usually name logic
    messageSearch?: string;
    creatorName?: string; // Metadata not in filter
}

export const AdvancedTicketFilter: React.FC<AdvancedTicketFilterProps> = ({ filters, onFilterChange, onClear }) => {
    const { control, register, handleSubmit, reset, watch} = useForm<FilterFormValues>({
        defaultValues: {
            companyId: filters.companyId,
            subcategoryId: filters.subcategoryId,
            tagId: filters.tagId,
            messageSearch: filters.messageSearch,
            dateFrom: filters.dateFrom,
            dateTo: filters.dateTo
        }
    });

    const [isExpanded, setIsExpanded] = useState(false);
    const [companies, setCompanies] = useState<{ id: number; nombre: string }[]>([]);
    const [subcategories, setSubcategories] = useState<{ id: number; nombre: string }[]>([]);
    const [tags, setTags] = useState<{ id: number; nombre: string; color: string }[]>([]);

    // Load initial data
    useEffect(() => {
        const loadData = async () => {
            try {
                // Fetch basic lists
                const loadedTags = await tagService.getMyTags();
                setTags(loadedTags);

                const loadedCompanies = await companyService.getCompanies();
                setCompanies(loadedCompanies);
            } catch (err) {
                console.error("Error loading filter data", err);
            }
        };
        loadData();
    }, []);

    // Load subcategories when company changes (optional) or just load all
    const selectedCompanyId = watch('companyId');
    useEffect(() => {
        if (selectedCompanyId) {
            const loadSubcats = async () => {
                try {
                    const subs = await subcategoryService.getByCompany(selectedCompanyId);
                    setSubcategories(subs);
                } catch (e) { console.error(e); }
            };
            loadSubcats();
        } else {
            setSubcategories([]);
        }
    }, [selectedCompanyId]);

    const onSubmit = (data: FilterFormValues) => {
        onFilterChange({
            ...filters,
            ...data,
            page: 1 // Reset page on filter
        });
    };

    const handleClear = () => {
        reset({
            companyId: undefined,
            subcategoryId: undefined,
            tagId: undefined,
            messageSearch: '',
            dateFrom: '',
            dateTo: ''
        });
        onClear();
    };

    return (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="flex justify-between items-center mb-4 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
                <h3 className="text-sm font-semibold text-gray-700 flex items-center">
                    <span className="material-symbols-outlined mr-2">filter_list</span>
                    Filtros Avanzados
                </h3>
                <span className="material-symbols-outlined text-gray-500">
                    {isExpanded ? 'expand_less' : 'expand_more'}
                </span>
            </div>

            {isExpanded && (
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                        {/* Empresa */}
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Empresa</label>
                            <Controller
                                name="companyId"
                                control={control}
                                render={({ field }) => (
                                    <div className="relative">
                                        <select {...field}
                                            className="appearance-none block w-full rounded-lg border-gray-200 bg-white py-2.5 pl-4 pr-10 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:border-brand-teal focus:ring-brand-teal"
                                            value={field.value || ''}
                                            onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)}>
                                            <option value="">Seleccionar</option>
                                            {companies.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                                        </select>
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                                            <span className="material-symbols-outlined text-lg">expand_more</span>
                                        </div>
                                    </div>
                                )}
                            />
                        </div>

                        {/* Subcategoria */}
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Subcategoría</label>
                            <Controller
                                name="subcategoryId"
                                control={control}
                                render={({ field }) => (
                                    <div className="relative">
                                        <select {...field}
                                            className="appearance-none block w-full rounded-lg border-gray-200 bg-white py-2.5 pl-4 pr-10 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:border-brand-teal focus:ring-brand-teal"
                                            value={field.value || ''}
                                            onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)}>
                                            <option value="">Seleccionar</option>
                                            {subcategories.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                                        </select>
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                                            <span className="material-symbols-outlined text-lg">expand_more</span>
                                        </div>
                                    </div>
                                )}
                            />
                        </div>

                        {/* Etiqueta */}
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Etiqueta</label>
                            <Controller
                                name="tagId"
                                control={control}
                                render={({ field }) => (
                                    <div className="relative">
                                        <select {...field}
                                            className="appearance-none block w-full rounded-lg border-gray-200 bg-white py-2.5 pl-4 pr-10 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:border-brand-teal focus:ring-brand-teal"
                                            value={field.value || ''}
                                            onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)}>
                                            <option value="">Seleccionar</option>
                                            {tags.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                                        </select>
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                                            <span className="material-symbols-outlined text-lg">expand_more</span>
                                        </div>
                                    </div>
                                )}
                            />
                        </div>

                        {/* N Ticket */}
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">N° Ticket</label>
                            <input
                                type="number"
                                placeholder="ID"
                                {...register('ticketId', { valueAsNumber: true })}
                                className="block w-full rounded-lg border-gray-200 bg-white py-2.5 px-4 text-sm font-medium text-gray-900 placeholder-gray-500 focus:border-brand-teal focus:ring-brand-teal"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                        {/* Fecha Inicio */}
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Fecha Inicio</label>
                            <input
                                type="date"
                                {...register('dateFrom')}
                                className="block w-full rounded-lg border-gray-200 bg-white py-2.5 px-4 text-sm font-medium text-gray-900 focus:border-brand-teal focus:ring-brand-teal"
                            />
                        </div>

                        {/* Fecha Fin */}
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Fecha Fin</label>
                            <input
                                type="date"
                                {...register('dateTo')}
                                className="block w-full rounded-lg border-gray-200 bg-white py-2.5 px-4 text-sm font-medium text-gray-900 focus:border-brand-teal focus:ring-brand-teal"
                            />
                        </div>

                        {/* Usuario (Solo ID por ahora, idealmente un autocomplete) */}
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Usuario (ID Creador)</label>
                            <input
                                type="number"
                                placeholder="ID Usuario"
                                {...register('creatorId', { valueAsNumber: true })}
                                className="block w-full rounded-lg border-gray-200 bg-white py-2.5 px-4 text-sm font-medium text-gray-900 placeholder-gray-500 focus:border-brand-teal focus:ring-brand-teal"
                            />
                        </div>
                    </div>

                    {/* Busqueda Mensajes (Full Width) */}
                    <div className="mb-4">
                        <label className="block text-xs font-medium text-gray-700 mb-1">Búsqueda en Mensajes</label>
                        <div className="flex relative">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <span className="material-symbols-outlined text-gray-400">search</span>
                            </div>
                            <input
                                type="text"
                                placeholder="Buscar texto en historial de mensajes..."
                                {...register('messageSearch')}
                                className="block w-full rounded-l-lg border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm font-medium text-gray-900 placeholder-gray-500 focus:border-brand-teal focus:bg-white focus:ring-brand-teal"
                            />
                            <Button type="submit" variant="brand" className="rounded-l-none rounded-r-lg">
                                Buscar
                            </Button>
                            <Button type="button" variant="outline" onClick={handleClear} className="ml-2 rounded-lg">
                                <span className="material-symbols-outlined">filter_alt_off</span>
                            </Button>
                        </div>
                    </div>
                </form>
            )}
        </div>
    );
};
