import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import AsyncSelect from 'react-select/async';
import { Input } from '../../../shared/components/Input';
import type { TemplateField } from '../interfaces/Ticket';
import { templateService } from '../../templates/services/template.service';

interface DynamicStepFormProps {
    fields: TemplateField[]; // Schema
    onChange: (values: { campoId: number; valor: string }[]) => void;
}

export const DynamicStepForm: React.FC<DynamicStepFormProps> = ({ fields, onChange }) => {
    const { control, watch, setValue, formState: { errors } } = useForm();
    const allValues = watch();

    const prevValuesRef = React.useRef<string>('');

    // Propagate changes up to parent
    useEffect(() => {
        if (!fields || fields.length === 0) return;

        const formattedValues = Object.entries(allValues).map(([key, value]) => {
            if (key.startsWith('field_')) {
                const fieldId = parseInt(key.replace('field_', ''), 10);
                return {
                    campoId: fieldId,
                    valor: String(value || '')
                };
            }
            return null;
        }).filter((v): v is { campoId: number; valor: string } => v !== null && v.valor !== '');

        const stringified = JSON.stringify(formattedValues);
        if (stringified !== prevValuesRef.current) {
            prevValuesRef.current = stringified;
            onChange(formattedValues);
        }
    }, [allValues, fields, onChange]);

    if (!fields || fields.length === 0) return null;

    const loadOptions = async (inputValue: string, fieldId: number) => {
        try {
            const results = await templateService.executeFieldQuery(fieldId, inputValue);
            return results.map(r => ({
                label: r.label || r.nombre || Object.values(r).find(v => typeof v === 'string') || JSON.stringify(r),
                value: String(r.id || r.code || Object.values(r)[0]),
                data: r
            }));
        } catch (e) {
            console.error('Error loading options', e);
            return [];
        }
    };

    const handleSelectChange = (selectedOption: any, field: TemplateField, reactHookFormChange: (val: any) => void) => {
        const val = selectedOption ? selectedOption.value : '';
        reactHookFormChange(val);

        // TRIGGER LOGIC
        // TRIGGER LOGIC
        if (field.campoTrigger === 1 && selectedOption?.data) {
            const rowData = selectedOption.data as Record<string, any>;

            // Create a normalized map of the data for case-insensitive lookup
            const normalizedData: Record<string, any> = {};
            Object.keys(rowData).forEach(key => {
                normalizedData[key.toUpperCase()] = rowData[key];
            });

            fields.forEach(f => {
                if (f.id !== field.id) {
                    // Try to find the value using uppercase code
                    const targetCode = f.codigo.toUpperCase();
                    const value = normalizedData[targetCode];

                    if (value !== undefined && value !== null) {
                        setValue(`field_${f.id}`, String(value));
                    }
                }
            });
        }
    };

    // Auto-fill specialized presets on mount
    useEffect(() => {
        if (!fields) return;
        fields.forEach(async (f) => {
            if (f.campoQuery === 'PRESET_FECHA_ACTUAL') {
                try {
                    const results = await templateService.executeFieldQuery(f.id, '');
                    if (results && results.length > 0) {
                        const val = results[0].value || results[0].id; // Expecting { value: 'dd/mm/yyyy' }
                        setValue(`field_${f.id}`, String(val));
                    }
                } catch (e) {
                    console.error('Error pre-fetching field', f.nombre, e);
                }
            }
        });
    }, [fields, setValue]);

    return (
        <div className="space-y-4 p-4 border border-gray-100 rounded-lg bg-slate-50/50 mb-4 transition-all">
            <h4 className="font-semibold text-sm text-[#121617] mb-2 uppercase tracking-wide">Información del Paso</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {fields.map((field) => {
                    const fieldName = `field_${field.id}`;
                    const hasQuery = field.campoQuery && field.campoQuery.trim().length > 0;

                    // Special handling for System Presets that should be read-only
                    const isSystemPreset = field.campoQuery === 'PRESET_FECHA_ACTUAL';

                    return (
                        <div key={field.id} className={field.tipo === 'textarea' ? 'col-span-2' : ''}>
                            <Controller
                                name={fieldName}
                                control={control}
                                rules={{ required: field.required ? 'Este campo es obligatorio' : false }}
                                render={({ field: { onChange: rhfChange, value } }) => {

                                    // 1. SYSTEM PRESETS (Read-only)
                                    if (isSystemPreset) {
                                        return (
                                            <div className="flex flex-col gap-2">
                                                <label htmlFor={fieldName} className="text-[#121617] text-sm font-semibold">
                                                    {field.nombre}
                                                </label>
                                                <input
                                                    id={fieldName}
                                                    type="text"
                                                    value={value || ''}
                                                    disabled
                                                    className="w-full rounded-lg border border-gray-200 bg-gray-100 px-4 py-2 text-sm text-gray-500 cursor-not-allowed"
                                                />
                                            </div>
                                        );
                                    }

                                    // 2. QUERY FIELDS (Async Select)
                                    if (hasQuery) {
                                        return (
                                            <div className="flex flex-col gap-2">
                                                <label htmlFor={fieldName} className="text-[#121617] text-sm font-semibold">
                                                    {field.nombre} {field.required && <span className="text-red-500">*</span>}
                                                </label>
                                                <AsyncSelect
                                                    cacheOptions
                                                    defaultOptions
                                                    isClearable
                                                    loadOptions={(v) => loadOptions(v, field.id)}
                                                    onChange={(opt) => handleSelectChange(opt, field, rhfChange)}
                                                    placeholder={`Buscar ${field.nombre}...`}
                                                    noOptionsMessage={() => "No se encontraron resultados"}
                                                    loadingMessage={() => "Buscando..."}
                                                    className="react-select-container"
                                                    classNamePrefix="react-select"
                                                    value={value ? { label: value, value } : null} // Simple display, ideally we'd store the label too
                                                />
                                            </div>
                                        );
                                    }

                                    if (field.tipo === 'textarea') {
                                        return (
                                            <div className="flex flex-col gap-2">
                                                <label htmlFor={fieldName} className="text-[#121617] text-sm font-semibold">
                                                    {field.nombre} {field.required && <span className="text-red-500">*</span>}
                                                </label>
                                                <textarea
                                                    id={fieldName}
                                                    className="form-textarea block w-full rounded-lg border border-gray-200 bg-slate-50 p-3 text-base text-[#121617] placeholder:text-gray-400 focus:border-brand-teal focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-teal min-h-[100px] transition-all hover:bg-slate-100"
                                                    value={value || ''}
                                                    onChange={rhfChange}
                                                    placeholder={field.nombre}
                                                />
                                            </div>
                                        );
                                    }
                                    if (field.tipo === 'date') {
                                        return <Input
                                            type="date"
                                            label={`${field.nombre} ${field.required ? '*' : ''}`}
                                            id={fieldName}
                                            value={value || ''}
                                            onChange={rhfChange}
                                        />;
                                    }
                                    // Default text
                                    return <Input
                                        type="text"
                                        label={`${field.nombre} ${field.required ? '*' : ''}`}
                                        id={fieldName}
                                        value={value || ''}
                                        onChange={rhfChange}
                                        placeholder={field.nombre}
                                    />;
                                }}
                            />
                            {errors[fieldName] && (
                                <span className="text-xs text-red-500 mt-1 block">Este campo es requerido</span>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
