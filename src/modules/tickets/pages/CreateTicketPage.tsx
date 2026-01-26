import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { Button } from '../../../shared/components/Button';
import { InfoModal } from '../../../shared/components/InfoModal';
import { useAuth } from '../../auth/context/useAuth';
import { ticketService } from '../services/ticket.service';
import { subcategoryService } from '../services/subcategory.service';
import { priorityService } from '../services/priority.service';
import { workflowService } from '../services/workflow.service';
import { departmentService } from '../services/department.service';
import { companyService } from '../services/company.service';
import { documentService } from '../services/document.service';

import type { Subcategory } from '../interfaces/Subcategory';
import type { Priority } from '../interfaces/Priority';
import type { CreateTicketDto } from '../interfaces/Ticket';
import type { UserCandidate } from '../interfaces/Workflow';
import type { Department } from '../interfaces/Department';
import type { Company } from '../interfaces/Company';
import { useLayout } from '../../../core/layout/context/LayoutContext';


export default function CreateTicketPage() {
    const { setTitle } = useLayout();
    const navigate = useNavigate();
    const { user } = useAuth();

    // UI State
    const [loading, setLoading] = useState(false);
    const [checkingFlow, setCheckingFlow] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    // Data State
    const [departments, setDepartments] = useState<Department[]>([]);
    // Categories removed from UI state
    const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [priorities, setPriorities] = useState<Priority[]>([]);
    const [assigneeCandidates, setAssigneeCandidates] = useState<UserCandidate[]>([]);

    // Form State
    const [title, setTitleSubject] = useState('');
    const [departmentId, setDepartmentId] = useState<number | ''>('');
    // categoryId derived from selected subcategory
    const [categoryId, setCategoryId] = useState<number | ''>('');
    const [subcategoryId, setSubcategoryId] = useState<number | ''>('');
    const [companyId, setCompanyId] = useState<number | ''>('');
    const [priorityId, setPriorityId] = useState<number | ''>('');
    const [description, setDescription] = useState('');
    const [assigneeId, setAssigneeId] = useState<number | ''>('');
    const [file, setFile] = useState<File | null>(null);

    // Workflow Logic State
    const [requiresManualSelection, setRequiresManualSelection] = useState(false);
    const [initialStepName, setInitialStepName] = useState<string>('');

    useEffect(() => {
        setTitle('Gestión de Tickets');
    }, [setTitle]);

    // 1. Initial Load (Departments, Companies, Priorities)
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const [depts, comps, prios] = await Promise.all([
                    departmentService.getDepartments(),
                    companyService.getCompanies(),
                    priorityService.getPriorities()
                ]);
                setDepartments(depts);
                setCompanies(comps);
                setPriorities(prios);
            } catch (error) {
                console.error("Error loading initial data", error);
            }
        };
        loadInitialData();
    }, []);

    // 2. Load Subcategories when Department changes (Logic: Dept -> Categories -> Allowed Subcategories)
    // 2. Load Subcategories when Department changes (Optimized: Single backend call)
    useEffect(() => {
        if (!departmentId) {
            setSubcategories([]);
            setSubcategoryId('');
            setCategoryId('');
            return;
        }
        const loadSubcategories = async () => {
            try {
                // Call the new optimized endpoint
                const subs = await subcategoryService.getAllowedByDepartment(departmentId as number);
                setSubcategories(subs);
            } catch (error) {
                console.error("Error loading subcategories", error);
                setSubcategories([]);
            }
        };
        loadSubcategories();
        setSubcategoryId('');
        setCategoryId('');
        setRequiresManualSelection(false);
        setAssigneeId('');
    }, [departmentId]);

    // 3. Set Category, Priority & Template when Subcategory changes
    useEffect(() => {
        if (!subcategoryId) {
            setCategoryId('');
            setRequiresManualSelection(false);
            setAssigneeCandidates([]);
            setInitialStepName('');
            setAssigneeId('');
            return;
        }

        const selectedSub = subcategories.find(s => s.id === subcategoryId);
        if (selectedSub) {
            // Auto-set Category ID
            setCategoryId(selectedSub.categoriaId);

            if (selectedSub.prioridadId) {
                setPriorityId(selectedSub.prioridadId);
            }
            // Template Logic
            if (selectedSub.descripcion) {
                setDescription(selectedSub.descripcion);
            }
        } else {
            setPriorityId('');
        }

        // Workflow Logic
        const checkWorkflow = async () => {
            setCheckingFlow(true);
            try {
                const result = await workflowService.checkStartFlow(subcategoryId as number);
                setRequiresManualSelection(result.requiresManualSelection);
                setInitialStepName(result.initialStepName);

                if (result.requiresManualSelection) {
                    setAssigneeCandidates(result.candidates);
                } else {
                    setAssigneeCandidates([]);
                }
            } catch (error) {
                console.error("Error checking workflow", error);
            } finally {
                setCheckingFlow(false);
            }
        };
        checkWorkflow();
    }, [subcategoryId, subcategories]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const cleanDesc = description.replace(/<(.|\n)*?>/g, '').trim();

        if (!title || !departmentId || !subcategoryId || !categoryId || !cleanDesc) {
            alert("Por favor complete todos los campos obligatorios.");
            return;
        }
        if (requiresManualSelection && !assigneeId) {
            alert("Por favor seleccione un usuario para asignar el ticket.");
            return;
        }

        setLoading(true);
        try {
            const payload: CreateTicketDto = {
                titulo: title,
                descripcion: description,
                categoriaId: Number(categoryId),
                subcategoriaId: Number(subcategoryId),
                prioridadId: priorityId ? Number(priorityId) : undefined,
                usuarioAsignadoId: assigneeId ? Number(assigneeId) : undefined,
                usuarioId: user?.id,
            };

            const createdTicket = await ticketService.createTicket(payload);

            if (file && createdTicket.id) {
                await documentService.uploadToTicket(createdTicket.id, file);
            }

            setShowSuccessModal(true);

        } catch (error) {
            console.error("Error creating ticket", error);
            alert("Error creando el ticket. Por favor intente nuevamente.");
        } finally {
            setLoading(false);
        }
    };

    const handleModalClose = () => {
        setShowSuccessModal(false);
        navigate('/tickets');
    };

    return (
        <>
            <div className="mx-auto max-w-6xl">
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-gray-900">Nueva Solicitud de Ticket</h2>
                    <p className="mt-1 text-sm text-gray-500">Por favor proporcione los detalles del problema que está experimentando.</p>
                </div>

                <div className="bg-white shadow rounded-lg p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">

                        {/* SUBJECT */}
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">Asunto</label>
                            <input
                                className="w-full rounded-lg border-gray-300 px-4 py-3 text-sm focus:border-brand-teal focus:ring-brand-teal shadow-sm"
                                placeholder="Resuma el problema"
                                type="text"
                                value={title}
                                onChange={(e) => setTitleSubject(e.target.value)}
                                required
                            />
                        </div>

                        {/* ROW: DEPARTMENT, SUBCATEGORY (Category Hidden) */}
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700">Departamento</label>
                                <select
                                    className="w-full rounded-lg border-gray-300 px-4 py-3 text-sm focus:border-brand-teal focus:ring-brand-teal shadow-sm appearance-none"
                                    value={departmentId}
                                    onChange={(e) => setDepartmentId(Number(e.target.value))}
                                    required
                                >
                                    <option value="">Seleccione Departamento</option>
                                    {departments.map(dept => (
                                        <option key={dept.id} value={dept.id}>{dept.nombre}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700">Subcategoría</label>
                                <select
                                    className="w-full rounded-lg border-gray-300 px-4 py-3 text-sm focus:border-brand-teal focus:ring-brand-teal shadow-sm appearance-none disabled:bg-gray-100 disabled:text-gray-400"
                                    value={subcategoryId}
                                    onChange={(e) => setSubcategoryId(Number(e.target.value))}
                                    required
                                    disabled={!departmentId}
                                >
                                    <option value="">{departmentId ? 'Seleccione Subcategoría' : 'Primero seleccione Departamento'}</option>
                                    {subcategories.map(sub => (
                                        <option key={sub.id} value={sub.id}>
                                            {sub.categoria ? `${sub.categoria.nombre} - ${sub.nombre}` : sub.nombre}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* ROW: COMPANY & PRIORITY */}
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700">Empresa</label>
                                <select
                                    className="w-full rounded-lg border-gray-300 px-4 py-3 text-sm focus:border-brand-teal focus:ring-brand-teal shadow-sm appearance-none"
                                    value={companyId}
                                    onChange={(e) => setCompanyId(Number(e.target.value))}
                                    required
                                >
                                    <option value="">Seleccione Empresa</option>
                                    {companies.map(comp => (
                                        <option key={comp.id} value={comp.id}>{comp.nombre}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700">Prioridad</label>
                                <div className="flex gap-2">
                                    {priorities.slice(0, 3).map((prio, idx) => (
                                        <label key={prio.id} className="flex-1">
                                            <input
                                                className="peer sr-only"
                                                name="priority"
                                                type="radio"
                                                value={prio.id}
                                                checked={priorityId === prio.id}
                                                onChange={() => setPriorityId(prio.id)}
                                            />
                                            <div className={`flex cursor-pointer items-center justify-center rounded-lg border bg-white p-3 text-sm font-medium transition-all hover:bg-gray-50
                                            ${priorityId === prio.id
                                                    ? idx === 2 ? 'border-brand-red bg-red-50 text-brand-red' : 'border-brand-teal bg-cyan-50 text-brand-teal'
                                                    : 'border-gray-200 text-gray-600'
                                                }`}>
                                                {idx === 0 ? 'Baja' : idx === 1 ? 'Media' : 'Alta'}
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* WORKFLOW INFO */}
                        {subcategoryId && (
                            <div className={`rounded-xl p-4 border ${checkingFlow ? 'bg-gray-50 border-gray-200' : 'bg-blue-50 border-blue-100'}`}>
                                {checkingFlow ? (
                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                        <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-brand-blue rounded-full"></div>
                                        Verificando requisitos del flujo...
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <div className="flex items-start gap-3">
                                            <span className="material-symbols-outlined text-blue-600 mt-0.5">info</span>
                                            <div>
                                                <p className="text-sm font-medium text-blue-900">
                                                    Flujo: {initialStepName || 'Flujo Estándar'}
                                                </p>
                                                <p className="text-xs text-blue-700 mt-1">
                                                    {requiresManualSelection
                                                        ? "Este ticket requiere que seleccione un asignado manualmente."
                                                        : "Este ticket será asignado automáticamente según las reglas del flujo."}
                                                </p>
                                            </div>
                                        </div>

                                        {requiresManualSelection && (
                                            <div className="pt-2">
                                                <label className="text-sm font-bold text-blue-900 block mb-2">Asignar a</label>
                                                <select
                                                    className="w-full rounded-lg border-blue-200 px-4 py-3 text-sm focus:border-blue-500 focus:ring-blue-500 shadow-sm"
                                                    value={assigneeId}
                                                    onChange={(e) => setAssigneeId(Number(e.target.value))}
                                                    required
                                                >
                                                    <option value="">Seleccione un usuario...</option>
                                                    {assigneeCandidates.map(cand => (
                                                        <option key={cand.id} value={cand.id}>
                                                            {cand.nombre} {cand.apellido} {cand.cargo ? `(${cand.cargo})` : ''}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* DESCRIPTION (Rich Text) */}
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">Descripción</label>
                            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                                <ReactQuill
                                    theme="snow"
                                    value={description}
                                    onChange={setDescription}
                                    className="[&_.ql-container]:min-h-[200px] [&_.ql-editor]:min-h-[200px]"
                                    placeholder="Explique el problema en detalle..."
                                    modules={{
                                        toolbar: [
                                            [{ 'header': [1, 2, false] }],
                                            ['bold', 'italic', 'underline'],
                                            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                                            ['link', 'image'],
                                            ['clean']
                                        ],
                                    }}
                                />
                            </div>
                        </div>

                        {/* ATTACHMENTS */}
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">Adjuntos</label>
                            <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50/50 p-8 transition-colors hover:border-brand-teal hover:bg-sky-50/30">
                                {file ? (
                                    <div className="flex flex-col items-center">
                                        <span className="material-symbols-outlined text-4xl text-green-500 mb-3">description</span>
                                        <p className="text-sm font-medium text-gray-700">{file.name}</p>
                                        <p className="mt-1 text-xs text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
                                        <button
                                            type="button"
                                            onClick={() => setFile(null)}
                                            className="mt-4 rounded-lg border border-red-300 bg-white px-4 py-2 text-xs font-semibold text-red-600 shadow-sm hover:bg-red-50"
                                        >
                                            Eliminar Archivo
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined text-4xl text-gray-400 mb-3">cloud_upload</span>
                                        <p className="text-sm font-medium text-gray-700">Click para subir o arrastrar y soltar</p>
                                        <p className="mt-1 text-xs text-gray-500">PNG, JPG, PDF o DOC hasta 10MB</p>
                                        <input
                                            className="hidden"
                                            id="file-upload"
                                            type="file"
                                            onChange={(e) => e.target.files && setFile(e.target.files[0])}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => document.getElementById('file-upload')?.click()}
                                            className="mt-4 rounded-lg border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
                                        >
                                            Seleccionar Archivos
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* ACTIONS */}
                        <div className="mt-10 flex items-center justify-end gap-4 border-t border-gray-100 pt-8">
                            <button
                                type="button"
                                onClick={() => navigate('/tickets')}
                                className="rounded-lg border border-gray-300 bg-white px-6 py-2.5 text-sm font-semibold text-gray-600 shadow-sm transition-colors hover:bg-gray-50 hover:text-gray-800"
                            >
                                Cancelar
                            </button>
                            <Button
                                type="submit"
                                variant="destructive"
                                disabled={loading || checkingFlow}
                                className="rounded-lg bg-brand-red px-8 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-red-700 hover:shadow-lg focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                            >
                                {loading ? 'Enviando...' : 'Enviar Ticket'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>

            {/* SUCCESS MODAL */}
            <InfoModal
                isOpen={showSuccessModal}
                onClose={handleModalClose}
                title="Ticket Creado Exitosamente"
                message="El ticket ha sido registrado en el sistema y se ha iniciado el flujo de trabajo correspondiente. Puede hacer seguimiento en la lista de tickets."
                variant="success"
            />
        </>
    );
}
