import { useState, useEffect } from 'react';
import { IconX, IconUserPlus, IconBriefcase } from '@tabler/icons-react';
import { Button } from '../../../shared/components/Button';
import { Select } from '../../../shared/components/Select';
import { userService } from '../../users/services/user.service';
import { positionService } from '../../positions/services/position.service';
import type { User } from '../../users/interfaces/User';
import type { Position } from '../../positions/interfaces/Position';

interface SpecificAssignment {
    usuarioId?: number;
    cargoId?: number;
}

interface SpecificAssignmentConfigProps {
    assignments: SpecificAssignment[];
    onChange: (assignments: SpecificAssignment[]) => void;
}

export const SpecificAssignmentConfig = ({ assignments, onChange }: SpecificAssignmentConfigProps) => {
    const [users, setUsers] = useState<User[]>([]);
    const [positions, setPositions] = useState<Position[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<string>('');
    const [selectedPositionId, setSelectedPositionId] = useState<string>('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [usersResponse, positionsResponse] = await Promise.all([
                userService.getUsers({ limit: 1000 }), // Get all users
                positionService.getPositions({ limit: 1000, estado: 1 }) // Get all active positions
            ]);
            setUsers(usersResponse.data);
            setPositions(positionsResponse.data);
        } catch (error) {
            console.error('Error loading users/positions:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddUser = () => {
        if (!selectedUserId) return;
        const userId = parseInt(selectedUserId);

        // Check if user already exists
        if (assignments.some(a => a.usuarioId === userId)) {
            return;
        }

        onChange([...assignments, { usuarioId: userId }]);
        setSelectedUserId('');
    };

    const handleAddPosition = () => {
        if (!selectedPositionId) return;
        const positionId = parseInt(selectedPositionId);

        // Check if position already exists
        if (assignments.some(a => a.cargoId === positionId)) {
            return;
        }

        onChange([...assignments, { cargoId: positionId }]);
        setSelectedPositionId('');
    };

    const handleRemove = (index: number) => {
        onChange(assignments.filter((_, i) => i !== index));
    };

    const getUserName = (userId: number) => {
        const user = users.find(u => u.id === userId);
        return user ? `${user.nombre} ${user.apellido}` : `Usuario #${userId}`;
    };

    const getPositionName = (positionId: number) => {
        const position = positions.find(p => p.id === positionId);
        return position ? position.nombre : `Cargo #${positionId}`;
    };

    if (loading) {
        return <div className="text-sm text-gray-500">Cargando...</div>;
    }

    return (
        <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                    <strong>Asignación Específica:</strong> Define qué usuarios o cargos pueden ser asignados manualmente a este paso.
                </p>
            </div>

            {/* Add User */}
            <div className="flex gap-2">
                <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Agregar Usuario
                    </label>
                    <Select
                        value={selectedUserId}
                        onChange={(val) => setSelectedUserId(val ? String(val) : '')}
                        options={users
                            .filter(u => !assignments.some(a => a.usuarioId === u.id))
                            .map(user => ({
                                value: String(user.id),
                                label: `${user.nombre} ${user.apellido} - ${user.email}`
                            }))
                        }
                        placeholder="-- Seleccionar Usuario --"
                        isClearable
                    />
                </div>
                <div className="flex items-end">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={handleAddUser}
                        disabled={!selectedUserId}
                    >
                        <IconUserPlus className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Add Position */}
            <div className="flex gap-2">
                <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Agregar Cargo (Para Asignación por Regional)
                    </label>
                    <Select
                        value={selectedPositionId}
                        onChange={(val) => setSelectedPositionId(val ? String(val) : '')}
                        options={positions
                            .filter(p => !assignments.some(a => a.cargoId === p.id))
                            .map(position => ({
                                value: String(position.id),
                                label: position.nombre
                            }))
                        }
                        placeholder="-- Seleccionar Cargo --"
                        isClearable
                    />
                </div>
                <div className="flex items-end">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={handleAddPosition}
                        disabled={!selectedPositionId}
                    >
                        <IconBriefcase className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* List of Assignments */}
            {assignments.length > 0 && (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                    Tipo
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                    Nombre
                                </th>
                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {assignments.map((assignment, index) => (
                                <tr key={index} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-sm text-gray-900">
                                        {assignment.usuarioId ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                                                <IconUserPlus className="w-3 h-3" />
                                                Usuario
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
                                                <IconBriefcase className="w-3 h-3" />
                                                Cargo
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-900">
                                        {assignment.usuarioId
                                            ? getUserName(assignment.usuarioId)
                                            : assignment.cargoId
                                                ? getPositionName(assignment.cargoId)
                                                : 'N/A'
                                        }
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <button
                                            type="button"
                                            onClick={() => handleRemove(index)}
                                            className="text-red-600 hover:text-red-800"
                                        >
                                            <IconX className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {assignments.length === 0 && (
                <div className="text-center py-8 text-gray-500 text-sm border border-dashed border-gray-300 rounded-lg">
                    No hay usuarios o cargos específicos configurados
                </div>
            )}
        </div>
    );
};
