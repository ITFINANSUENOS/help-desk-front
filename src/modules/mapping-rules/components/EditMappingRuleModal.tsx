import { useState, useEffect } from 'react';
import { FormModal } from '../../../shared/components/FormModal';
import { Select } from '../../../shared/components/Select';
import { subcategoryService } from '../../subcategories/services/subcategory.service';
import { positionService } from '../../positions/services/position.service';
import { profileService } from '../../profiles/services/profile.service';
import type { Subcategory } from '../../subcategories/interfaces/Subcategory';
import type { Position } from '../../positions/interfaces/Position';
import type { Profile } from '../../profiles/interfaces/Profile';
import type { MappingRule, UpdateMappingRuleDto } from '../interfaces/MappingRule';

export interface EditMappingRuleModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (id: number, data: UpdateMappingRuleDto) => void | Promise<void>;
    rule: MappingRule | null;
}

export function EditMappingRuleModal({ isOpen, onClose, onSubmit, rule }: EditMappingRuleModalProps) {
    const [formData, setFormData] = useState<UpdateMappingRuleDto>({
        subcategoriaId: 0,
        estado: 1,
        creadorCargoIds: [],
        creadorPerfilIds: [],
        asignadoCargoIds: []
    });
    const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
    const [positions, setPositions] = useState<Position[]>([]);
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [loadingData, setLoadingData] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Cargar datos auxiliares
    useEffect(() => {
        if (isOpen) {
            loadData();
        }
    }, [isOpen]);

    // Pre-cargar datos de la regla
    useEffect(() => {
        if (rule) {
            setFormData({
                subcategoriaId: rule.subcategoriaId,
                estado: rule.estado,
                creadorCargoIds: rule.creadores?.map(c => c.cargoId) || [],
                creadorPerfilIds: rule.creadoresPerfil?.map(cp => cp.perfilId) || [],
                asignadoCargoIds: rule.asignados?.map(a => a.cargoId) || []
            });
        }
    }, [rule]);

    const loadData = async () => {
        setLoadingData(true);
        try {
            const [subcatsData, positionsData, profilesData] = await Promise.all([
                subcategoryService.getAll(),
                positionService.getPositions({ limit: 1000, estado: 1 }),
                profileService.getProfiles({ limit: 1000, estado: 1 })
            ]);
            setSubcategories(subcatsData);
            setPositions(positionsData.data);
            setProfiles(profilesData.data);
        } catch (err) {
            console.error('Error loading data:', err);
            setError('Error al cargar datos auxiliares');
        } finally {
            setLoadingData(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!rule) return;

        if (!formData.subcategoriaId || formData.subcategoriaId === 0) {
            setError('Debe seleccionar una subcategoría');
            return;
        }

        setLoading(true);

        try {
            await onSubmit(rule.id, formData);
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al actualizar la regla de mapeo');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setError(null);
        onClose();
    };

    const toggleCreadorCargo = (cargoId: number) => {
        setFormData(prev => {
            const currentIds = prev.creadorCargoIds || [];
            if (currentIds.includes(cargoId)) {
                return { ...prev, creadorCargoIds: currentIds.filter(id => id !== cargoId) };
            } else {
                return { ...prev, creadorCargoIds: [...currentIds, cargoId] };
            }
        });
    };

    const toggleCreadorPerfil = (perfilId: number) => {
        setFormData(prev => {
            const currentIds = prev.creadorPerfilIds || [];
            if (currentIds.includes(perfilId)) {
                return { ...prev, creadorPerfilIds: currentIds.filter(id => id !== perfilId) };
            } else {
                return { ...prev, creadorPerfilIds: [...currentIds, perfilId] };
            }
        });
    };

    const toggleAsignadoCargo = (cargoId: number) => {
        setFormData(prev => {
            const currentIds = prev.asignadoCargoIds || [];
            if (currentIds.includes(cargoId)) {
                return { ...prev, asignadoCargoIds: currentIds.filter(id => id !== cargoId) };
            } else {
                return { ...prev, asignadoCargoIds: [...currentIds, cargoId] };
            }
        });
    };

    if (!rule) return null;

    return (
        <FormModal
            isOpen={isOpen}
            onClose={handleClose}
            onSubmit={handleSubmit}
            title="Editar Regla de Mapeo"
            submitText="Actualizar"
            loading={loading}
            size="lg"
        >
            <div className="space-y-4">
                {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                        <p className="text-sm text-red-600">{error}</p>
                    </div>
                )}

                {/* Subcategoría */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Subcategoría <span className="text-red-500">*</span>
                    </label>
                    {loadingData ? (
                        <div className="text-sm text-gray-500">Cargando...</div>
                    ) : (
                        <Select
                            value={formData.subcategoriaId}
                            onChange={(val) => setFormData({ ...formData, subcategoriaId: Number(val) })}
                            options={subcategories.map(subcat => ({
                                value: subcat.id,
                                label: `${subcat.nombre} ${subcat.categoria ? `(${subcat.categoria.nombre})` : ''}`
                            }))}
                            placeholder="Seleccione una subcategoría"
                            disabled={loading}
                        />
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Cargos Creadores */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Cargos Creadores
                        </label>
                        {loadingData ? (
                            <div className="text-sm text-gray-500">Cargando...</div>
                        ) : (
                            <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-md p-2 space-y-2">
                                {positions.length === 0 ? (
                                    <p className="text-sm text-gray-500 italic">No hay cargos disponibles</p>
                                ) : (
                                    positions.map(pos => (
                                        <div key={pos.id} className="flex items-center gap-2 hover:bg-gray-50 p-1 rounded">
                                            <input
                                                type="checkbox"
                                                id={`edit-creador-cargo-${pos.id}`}
                                                checked={formData.creadorCargoIds?.includes(pos.id) || false}
                                                onChange={() => toggleCreadorCargo(pos.id)}
                                                disabled={loading}
                                                className="w-4 h-4 text-brand-blue border-gray-300 rounded focus:ring-brand-blue"
                                            />
                                            <label htmlFor={`edit-creador-cargo-${pos.id}`} className="text-sm text-gray-700 w-full cursor-pointer">
                                                {pos.nombre}
                                            </label>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>

                    {/* Perfiles Creadores */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Perfiles Creadores
                        </label>
                        {loadingData ? (
                            <div className="text-sm text-gray-500">Cargando...</div>
                        ) : (
                            <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-md p-2 space-y-2">
                                {profiles.length === 0 ? (
                                    <p className="text-sm text-gray-500 italic">No hay perfiles disponibles</p>
                                ) : (
                                    profiles.map(profile => (
                                        <div key={profile.id} className="flex items-center gap-2 hover:bg-gray-50 p-1 rounded">
                                            <input
                                                type="checkbox"
                                                id={`edit-creador-perfil-${profile.id}`}
                                                checked={formData.creadorPerfilIds?.includes(profile.id) || false}
                                                onChange={() => toggleCreadorPerfil(profile.id)}
                                                disabled={loading}
                                                className="w-4 h-4 text-brand-blue border-gray-300 rounded focus:ring-brand-blue"
                                            />
                                            <label htmlFor={`edit-creador-perfil-${profile.id}`} className="text-sm text-gray-700 w-full cursor-pointer">
                                                {profile.nombre}
                                            </label>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>

                    {/* Cargos Asignados */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Cargos Asignados
                        </label>
                        {loadingData ? (
                            <div className="text-sm text-gray-500">Cargando...</div>
                        ) : (
                            <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-md p-2 space-y-2">
                                {positions.length === 0 ? (
                                    <p className="text-sm text-gray-500 italic">No hay cargos disponibles</p>
                                ) : (
                                    positions.map(pos => (
                                        <div key={pos.id} className="flex items-center gap-2 hover:bg-gray-50 p-1 rounded">
                                            <input
                                                type="checkbox"
                                                id={`edit-asignado-cargo-${pos.id}`}
                                                checked={formData.asignadoCargoIds?.includes(pos.id) || false}
                                                onChange={() => toggleAsignadoCargo(pos.id)}
                                                disabled={loading}
                                                className="w-4 h-4 text-brand-blue border-gray-300 rounded focus:ring-brand-blue"
                                            />
                                            <label htmlFor={`edit-asignado-cargo-${pos.id}`} className="text-sm text-gray-700 w-full cursor-pointer">
                                                {pos.nombre}
                                            </label>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                    <input
                        type="checkbox"
                        id="edit-estado"
                        checked={formData.estado === 1}
                        onChange={(e) => setFormData({ ...formData, estado: e.target.checked ? 1 : 0 })}
                        disabled={loading}
                        className="w-4 h-4 text-brand-blue border-gray-300 rounded focus:ring-brand-blue"
                    />
                    <label htmlFor="edit-estado" className="text-sm font-medium text-gray-700 cursor-pointer">
                        Activo
                    </label>
                </div>
            </div>
        </FormModal>
    );
}
