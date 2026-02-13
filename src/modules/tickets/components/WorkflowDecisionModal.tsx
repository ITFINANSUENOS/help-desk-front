import React, { useState, useEffect } from 'react';
import type { CheckNextStepResponse, UserCandidate } from '../interfaces/Ticket';
import { Modal } from '../../../shared/components/Modal';
import { Button } from '../../../shared/components/Button';
import { UserSelect } from '../../users/components/UserSelect';

interface WorkflowDecisionModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    transitionData: CheckNextStepResponse | null;
    onConfirm: (decisionKey: string, targetUserId?: number, manualAssignments?: Record<string, number>, bossId?: number) => void;
    isLoading?: boolean;
    isAssignedUser: boolean;
}

export const WorkflowDecisionModal: React.FC<WorkflowDecisionModalProps> = ({
    open,
    onOpenChange,
    transitionData,
    onConfirm,
    isLoading,
    isAssignedUser
}) => {
    const [selectedDecision, setSelectedDecision] = useState<string>('');
    const [selectedUser, setSelectedUser] = useState<string>('');
    const [manualAssignments, setManualAssignments] = useState<Record<number, string>>({});
    const [stepCandidates, setStepCandidates] = useState<UserCandidate[]>([]);
    const [selectedBossId, setSelectedBossId] = useState<string>('');
    const [verified, setVerified] = useState(false);

    // Derived state
    const isDecisionMode = transitionData?.transitionType === 'decision';
    const isLinearMode = transitionData?.transitionType === 'linear';

    useEffect(() => {
        if (open) {
            // Reset states when opening
            setSelectedDecision('');
            setSelectedUser('');
            setManualAssignments({});
            setVerified(false);

            if (isLinearMode && transitionData?.linear?.candidates) {
                setStepCandidates(transitionData.linear.candidates);
                // Pre-select boss if already assigned
                if (transitionData.linear.currentBossId) {
                    setSelectedBossId(String(transitionData.linear.currentBossId));
                }
            }
        }
    }, [open, transitionData, isLinearMode]);

    // Update candidates when decision changes
    useEffect(() => {
        if (isDecisionMode && selectedDecision) {
            const decision = transitionData?.decisions?.find(d => d.decisionId === selectedDecision);
            setManualAssignments({}); // Reset assignments on decision change
            setSelectedUser(''); // Reset selected user on decision change
            if (decision?.candidates) {
                setStepCandidates(decision.candidates);
            } else {
                setStepCandidates([]);
            }

            // Link Boss Logic for Decisions
            if (decision?.currentBossId) {
                setSelectedBossId(String(decision.currentBossId));
            } else {
                setSelectedBossId('');
            }
        }
    }, [selectedDecision, isDecisionMode, transitionData]);

    const handleConfirm = () => {
        const transitionKey = isDecisionMode ? selectedDecision : (transitionData?.linear?.targetStepId.toString() || '');
        const userId = selectedUser ? Number(selectedUser) : undefined;

        const assignmentsPayload: Record<string, number> = {};
        Object.entries(manualAssignments).forEach(([roleId, uId]) => {
            if (uId === 'SKIP') {
                assignmentsPayload[roleId] = -1;
            } else if (uId) {
                assignmentsPayload[roleId] = Number(uId);
            }
        });

        onConfirm(transitionKey, userId, Object.keys(assignmentsPayload).length > 0 ? assignmentsPayload : undefined, selectedBossId ? Number(selectedBossId) : undefined);
    };

    const getCurrentOption = () => {
        if (isLinearMode) return transitionData?.linear;
        if (isDecisionMode && selectedDecision) return transitionData?.decisions?.find(d => d.decisionId === selectedDecision);
        return null;
    };

    const currentOption = getCurrentOption();
    const needsUserSelection = currentOption?.requiresManualAssignment || false;
    const missingRoles = currentOption?.missingRoles || [];
    const bossCandidates = currentOption?.bossCandidates || [];
    const targetAssignees = currentOption?.targetAssignees || [];

    // Check if all needed assignments are made
    const areAllRolesAssigned = missingRoles.every(r => manualAssignments[r.id]);
    const isBossSelected = bossCandidates.length > 0 ? !!selectedBossId : true;

    const isFormValid =
        (isAssignedUser ? verified : true) &&
        (isDecisionMode ? !!selectedDecision : true) &&
        (missingRoles.length > 0 ? areAllRolesAssigned : (needsUserSelection ? !!selectedUser : true)) &&
        isBossSelected;

    return (
        <Modal
            isOpen={open}
            onClose={() => onOpenChange(false)}
            title="Confirmar Transición"
            className="sm:max-w-md"
        >
            <div className="space-y-6">
                <p className="text-sm text-gray-500">
                    {isDecisionMode
                        ? 'Seleccione la acción que desea tomar para este ticket.'
                        : 'Para avanzar, por favor complete la siguiente información.'}
                </p>

                <div className="space-y-4 max-h-[60vh] overflow-y-auto px-1">
                    {/* DECISION MODE SELECTOR */}
                    {isDecisionMode && transitionData?.decisions && (
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-[#121617]">Decisión</label>
                            <div className="flex flex-col gap-2">
                                {transitionData.decisions.map((d) => (
                                    <button
                                        key={d.decisionId}
                                        onClick={() => setSelectedDecision(d.decisionId)}
                                        className={`w-full text-left px-4 py-3 rounded-lg border transition-all flex items-center justify-between group ${selectedDecision === d.decisionId
                                            ? 'border-brand-teal bg-teal-50 text-brand-teal shadow-sm'
                                            : 'border-gray-200 hover:bg-slate-50 text-gray-700'
                                            }`}
                                    >
                                        <div className="font-medium flex items-center gap-2">
                                            <span className="material-symbols-outlined text-xl">
                                                {d.isRoute ? 'alt_route' : 'arrow_forward'}
                                            </span>
                                            {d.label}
                                        </div>
                                        {d.isRoute && (
                                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
                                                Ruta
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* MISSING ROLES WARNING & SELECTION */}
                    {missingRoles.length > 0 && (
                        <div className="space-y-3">
                            <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
                                <div className="flex gap-2">
                                    <span className="material-symbols-outlined text-amber-600">warning</span>
                                    <div>
                                        <p className="text-sm font-medium text-amber-800">Cargos sin usuario asignado</p>
                                        <p className="text-xs text-amber-700 mt-1">
                                            El sistema no encontró usuarios automáticos para los siguientes cargos. Seleccione un responsable para cada uno.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Render a select for EACH missing role */}
                            <div className="space-y-3 pt-2">
                                {missingRoles.map(role => (
                                    <div key={role.id} className="space-y-1">
                                        <label htmlFor={`role-${role.id}`} className="text-xs font-semibold text-gray-700 uppercase tracking-wider flex justify-between">
                                            <span>{role.name}</span>
                                            {role.allowSkip && <span className="text-gray-400 font-normal normal-case">(Opcional)</span>}
                                        </label>
                                        <div className="relative">
                                            <UserSelect
                                                value={manualAssignments[role.id] && manualAssignments[role.id] !== 'SKIP' ? Number(manualAssignments[role.id]) : undefined}
                                                onChange={(val) => setManualAssignments(prev => ({ ...prev, [role.id]: val ? String(val) : '' }))}
                                                candidates={role.candidates}
                                                placeholder="Seleccione asignado..."
                                            />
                                            {role.allowSkip && (
                                                <div className="mt-1">
                                                    <label className="inline-flex items-center">
                                                        <input
                                                            type="checkbox"
                                                            className="rounded border-gray-300 text-brand-teal shadow-sm focus:border-brand-teal focus:ring focus:ring-brand-teal focus:ring-opacity-50"
                                                            checked={manualAssignments[role.id] === 'SKIP'}
                                                            onChange={(e) => setManualAssignments(prev => ({ ...prev, [role.id]: e.target.checked ? 'SKIP' : '' }))}
                                                        />
                                                        <span className="ml-2 text-xs text-gray-600">No asignar (Omitir)</span>
                                                    </label>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* SINGLE MANUAL ASSIGNMENT (Fallback or Normal) */}
                    {needsUserSelection && missingRoles.length === 0 && (selectedDecision || isLinearMode) && (
                        <div className="space-y-2">
                            <label htmlFor="user-select" className="text-sm font-semibold text-[#121617]">
                                Asignar a Usuario
                            </label>
                            <div className="relative">
                                <UserSelect
                                    value={selectedUser ? Number(selectedUser) : undefined}
                                    onChange={(val) => setSelectedUser(val ? String(val) : '')}
                                    candidates={stepCandidates}
                                    placeholder="Seleccione un usuario..."
                                />
                            </div>
                        </div>
                    )}

                    {/* BOSS SELECTION SECTION */}
                    {bossCandidates.length > 0 && (selectedDecision || isLinearMode) && (
                        <div className="bg-purple-50 border border-purple-100 rounded-lg p-3 space-y-2">
                            <div className="flex gap-2 items-center">
                                <span className="material-symbols-outlined text-purple-600">supervisor_account</span>
                                <label htmlFor="boss-select" className="text-sm font-semibold text-purple-900">
                                    Confirmar Jefe Inmediato
                                </label>
                            </div>
                            <p className="text-xs text-purple-700">
                                Es necesario confirmar quién aprobará este ticket.
                            </p>
                            <div className="relative">
                                <UserSelect
                                    value={selectedBossId ? Number(selectedBossId) : undefined}
                                    onChange={(val) => setSelectedBossId(val ? String(val) : '')}
                                    candidates={bossCandidates}
                                    placeholder="Seleccione al Jefe Inmediato..."
                                />
                            </div>
                        </div>
                    )}

                    {/* NEXT STEP ASSIGNEES PREVIEW */}
                    {targetAssignees.length > 0 && (selectedDecision || isLinearMode) && (
                        <div className="mt-4 border-t border-gray-100 pt-3">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                Usuarios del Siguiente Paso
                            </p>
                            <div className="bg-gray-50 rounded-lg p-2 space-y-1 max-h-32 overflow-y-auto">
                                {targetAssignees.map(u => (
                                    <div key={u.id} className="flex items-center gap-2 text-sm text-gray-700 p-1.5 hover:bg-white rounded transition-colors">
                                        <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600">
                                            {u.nombre.charAt(0)}{u.apellido.charAt(0)}
                                        </div>
                                        <div className="flex-1">
                                            <span className="font-medium">{u.nombre} {u.apellido}</span>
                                            {u.cargo && <span className="text-xs text-gray-500 ml-1">({u.cargo})</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}



                    {/* LINEAR INFO */}
                    {transitionData?.linear && (
                        <div className="p-4 bg-sky-50 text-sky-800 rounded-lg text-sm border border-sky-100 space-y-2">
                            <div className="flex items-start gap-3">
                                <span className="material-symbols-outlined text-lg mt-0.5">info</span>
                                <div>
                                    El ticket avanzará al paso: <strong className="font-bold">{transitionData?.linear?.targetStepName}</strong>
                                    {transitionData?.parallelStatus && (
                                        <div className="mt-1 flex items-center gap-1 text-xs font-bold text-brand-orange uppercase">
                                            <span className="material-symbols-outlined text-base">call_split</span>
                                            Paso Paralelo
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* FOOTER: Checkbox + Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100 gap-4">
                    {/* VERIFICATION CHECKBOX (Left Side) - ONLY FOR ASSIGNED USER */}
                    {isAssignedUser && (
                        <div className="flex items-center gap-2">
                            <input
                                id="verify-check"
                                type="checkbox"
                                checked={verified}
                                onChange={(e) => setVerified(e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-brand-teal focus:ring-brand-teal"
                            />
                            <label htmlFor="verify-check" className="text-xs text-gray-600 cursor-pointer select-none leading-tight">
                                Confirmar información
                            </label>
                        </div>
                    )}

                    {/* BUTTONS (Right Side) */}
                    <div className="flex gap-3 ml-auto">
                        <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={isLoading}>
                            Cancelar
                        </Button>
                        <Button
                            variant="brand"
                            onClick={handleConfirm}
                            disabled={isLoading || !isFormValid}
                        >
                            {isLoading ? 'Wait...' : 'Avanzar'}
                        </Button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};
