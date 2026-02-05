import React, { useState, useEffect } from 'react';
import type { CheckNextStepResponse, UserCandidate } from '../interfaces/Ticket';
import { Modal } from '../../../shared/components/Modal';
import { Button } from '../../../shared/components/Button';

interface WorkflowDecisionModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    transitionData: CheckNextStepResponse | null;
    onConfirm: (decisionKey: string, targetUserId?: number, manualAssignments?: Record<string, number>) => void;
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

        onConfirm(transitionKey, userId, Object.keys(assignmentsPayload).length > 0 ? assignmentsPayload : undefined);
    };

    const getCurrentOption = () => {
        if (isLinearMode) return transitionData?.linear;
        if (isDecisionMode && selectedDecision) return transitionData?.decisions?.find(d => d.decisionId === selectedDecision);
        return null;
    };

    const currentOption = getCurrentOption();
    const needsUserSelection = currentOption?.requiresManualAssignment || false;
    const missingRoles = currentOption?.missingRoles || [];

    // Check if all needed assignments are made
    const areAllRolesAssigned = missingRoles.every(r => manualAssignments[r.id]);
    const isFormValid =
        (isAssignedUser ? verified : true) &&
        (isDecisionMode ? !!selectedDecision : true) &&
        (missingRoles.length > 0 ? areAllRolesAssigned : (needsUserSelection ? !!selectedUser : true));

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

                <div className="space-y-4">
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
                                            <select
                                                id={`role-${role.id}`}
                                                className="block w-full rounded-lg border border-gray-200 bg-slate-50 p-2 text-sm text-[#121617] focus:border-brand-teal focus:bg-white focus:outline-none h-10 appearance-none"
                                                value={manualAssignments[role.id] || ''}
                                                onChange={(e) => setManualAssignments(prev => ({ ...prev, [role.id]: e.target.value }))}
                                            >
                                                <option value="">Seleccione asignado...</option>
                                                {role.allowSkip && (
                                                    <option value="SKIP">⚠️ No asignar (Omitir este cargo)</option>
                                                )}
                                                {role.candidates && role.candidates.map((u) => (
                                                    <option key={u.id} value={u.id.toString()}>
                                                        {u.nombre} {u.apellido} {u.cargo ? `(${u.cargo})` : ''}
                                                    </option>
                                                ))}
                                            </select>
                                            <span className="material-symbols-outlined absolute right-2 top-2.5 text-gray-400 pointer-events-none text-lg">expand_more</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* SINGLE MANUAL ASSIGNMENT (Fallback or Normal) */}
                    {/* Show this ONLY if NO missing roles are present (to avoid double entry), BUT manual selection is still required */}
                    {needsUserSelection && missingRoles.length === 0 && (selectedDecision || isLinearMode) && (
                        <div className="space-y-2">
                            <label htmlFor="user-select" className="text-sm font-semibold text-[#121617]">
                                Asignar a Usuario
                            </label>
                            <div className="relative">
                                <select
                                    id="user-select"
                                    key={`user-select-${selectedDecision}`} // Force re-render on decision change
                                    className="block w-full rounded-lg border border-gray-200 bg-slate-50 p-3 text-base text-[#121617] focus:border-brand-teal focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-teal h-12 appearance-none"
                                    value={selectedUser}
                                    onChange={(e) => setSelectedUser(e.target.value)}
                                >
                                    <option value="">Seleccione un usuario...</option>
                                    {stepCandidates.map((u) => (
                                        <option key={u.id} value={u.id.toString()}>
                                            {u.nombre} {u.apellido} {u.cargo ? `(${u.cargo})` : ''}
                                        </option>
                                    ))}
                                </select>
                                <span className="material-symbols-outlined absolute right-3 top-3 text-gray-400 pointer-events-none">expand_more</span>
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
