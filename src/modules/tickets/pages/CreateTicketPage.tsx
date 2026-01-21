import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

import { DashboardLayout } from '../../../core/layout/DashboardLayout';
import { Button } from '../../../shared/components/Button';
import { Input } from '../../../shared/components/Input';
import { InfoModal } from '../../../shared/components/InfoModal';

import { ticketService } from '../services/ticket.service';
import { categoryService } from '../services/category.service';
import { subcategoryService } from '../services/subcategory.service';
import { priorityService } from '../services/priority.service';
import { workflowService } from '../services/workflow.service';
import { departmentService } from '../services/department.service';
import { companyService } from '../services/company.service';
import { documentService } from '../services/document.service';
import { useAuth } from '../../auth/context/useAuth';

import type { Category } from '../interfaces/Category';
import type { Subcategory } from '../interfaces/Subcategory';
import type { Priority } from '../interfaces/Priority';
import type { CreateTicketDto } from '../interfaces/Ticket';
import type { UserCandidate } from '../interfaces/Workflow';
import type { Department } from '../interfaces/Department';
import type { Company } from '../interfaces/Company';


export default function CreateTicketPage() {
    const navigate = useNavigate();
    const { user } = useAuth();

    // UI State
    const [loading, setLoading] = useState(false);
    const [checkingFlow, setCheckingFlow] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    // Data State
    const [departments, setDepartments] = useState<Department[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [priorities, setPriorities] = useState<Priority[]>([]);
    const [assigneeCandidates, setAssigneeCandidates] = useState<UserCandidate[]>([]);

    // Form State
    const [title, setTitle] = useState('');
    const [departmentId, setDepartmentId] = useState<number | ''>('');
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

    // 2. Load Categories when Department changes
    useEffect(() => {
        if (!departmentId) {
            setCategories([]);
            setCategoryId('');
            setSubcategories([]);
            setSubcategoryId('');
            return;
        }
        const loadCategories = async () => {
            try {
                const cats = await categoryService.getByDepartment(departmentId as number);
                setCategories(cats);
            } catch (error) {
                console.error("Error loading categories", error);
                setCategories([]);
            }
        };
        loadCategories();
        setCategoryId('');
        setSubcategoryId('');
    }, [departmentId]);

    // 3. Load Subcategories when Category changes
    useEffect(() => {
        if (!categoryId) {
            setSubcategories([]);
            setSubcategoryId('');
            return;
        }
        const loadSubcategories = async () => {
            try {
                const subs = await subcategoryService.getByCategory(categoryId as number);
                setSubcategories(subs);
            } catch (error) {
                console.error("Error loading subcategories", error);
                setSubcategories([]);
            }
        };
        loadSubcategories();
        setSubcategoryId('');
        setRequiresManualSelection(false);
        setAssigneeId('');
    }, [categoryId]);

    // 4. Check Workflow & Set Default Priority when Subcategory changes
    useEffect(() => {
        if (!subcategoryId) {
            setRequiresManualSelection(false);
            setAssigneeCandidates([]);
            setInitialStepName('');
            setAssigneeId('');
            return;
        }

        // 4a. Set Default Priority Logic
        const selectedSub = subcategories.find(s => s.id === subcategoryId);
        if (selectedSub && selectedSub.prioridadId) {
            setPriorityId(selectedSub.prioridadId);
        } else {
            setPriorityId(''); // Or keep previous? Usually reset or set to default if logic dictates
        }

        // 4b. Workflow Logic
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
        // Nota: ReactQuill description puede venir vacía o con solo etiquetas HTML vacías
        const cleanDesc = description.replace(/<(.|\n)*?>/g, '').trim();

        if (!title || !departmentId || !categoryId || !subcategoryId || !cleanDesc) {
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
                descripcion: description, // Send rich text
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

            // Show Success Modal instead of navigating immediately
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
        <DashboardLayout title="Crear Ticket">
            <div className="mx-auto max-w-5xl">
                <div className="mb-6">
                    <Button variant="ghost" onClick={() => navigate('/tickets')} className="pl-0 hover:bg-transparent">
                        <span className="material-symbols-outlined mr-2">arrow_back</span>
                        Volver a Tickets
                    </Button>
                    <h1 className="text-2xl font-bold text-gray-900 mt-2">Crear Nuevo Ticket</h1>
                    <p className="text-sm text-gray-500">Complete los detalles para enviar una nueva solicitud de soporte.</p>
                </div>

                <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">

                    {/* LEFT COLUMN: FORM */}
                    <div className="lg:col-span-2 space-y-6">
                        <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 space-y-6">

                            {/* 1. ASUNTO */}
                            <Input
                                label="Asunto"
                                placeholder="Resumen breve del problema"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                            />

                            <div className="grid grid-cols-1 gap-6">
                                {/* 2. DEPARTAMENTO */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Departamento <span className="text-red-500">*</span></label>
                                    <select
                                        className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-brand-teal focus:ring-brand-teal sm:text-sm"
                                        value={departmentId}
                                        onChange={(e) => setDepartmentId(Number(e.target.value))}
                                        required
                                    >
                                        <option value="">Seleccione Departamento...</option>
                                        {departments.map(dept => (
                                            <option key={dept.id} value={dept.id}>{dept.nombre}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* CATEGORIA */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Categoría <span className="text-red-500">*</span></label>
                                    <select
                                        className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-brand-teal focus:ring-brand-teal sm:text-sm disabled:bg-gray-100 disabled:text-gray-400"
                                        value={categoryId}
                                        onChange={(e) => setCategoryId(Number(e.target.value))}
                                        required
                                        disabled={!departmentId}
                                    >
                                        <option value="">{departmentId ? 'Seleccione Categoría...' : 'Seleccione Departamento primero'}</option>
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* 3. SUBCATEGORIA */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Subcategoría <span className="text-red-500">*</span></label>
                                    <select
                                        className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-brand-teal focus:ring-brand-teal sm:text-sm disabled:bg-gray-100 disabled:text-gray-400"
                                        value={subcategoryId}
                                        onChange={(e) => setSubcategoryId(Number(e.target.value))}
                                        required
                                        disabled={!categoryId}
                                    >
                                        <option value="">{categoryId ? 'Seleccione Subcategoría...' : 'Seleccione Categoría primero'}</option>
                                        {subcategories.map(sub => (
                                            <option key={sub.id} value={sub.id}>{sub.nombre}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* 4. EMPRESA */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Empresa <span className="text-red-500">*</span></label>
                                    <select
                                        className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-brand-teal focus:ring-brand-teal sm:text-sm"
                                        value={companyId}
                                        onChange={(e) => setCompanyId(Number(e.target.value))}
                                        required
                                    >
                                        <option value="">Seleccione Empresa...</option>
                                        {companies.map(comp => (
                                            <option key={comp.id} value={comp.id}>{comp.nombre}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* 5. ADJUNTAR ARCHIVO */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Adjuntar Archivo</label>
                                    <div className="flex items-center justify-center rounded-lg border border-dashed border-gray-300 px-6 py-10 hover:bg-gray-50">
                                        <div className="text-center">
                                            {file ? (
                                                <div className="flex flex-col items-center">
                                                    <span className="material-symbols-outlined text-green-500 text-3xl mb-2">description</span>
                                                    <p className="text-sm text-gray-900 font-medium">{file.name}</p>
                                                    <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
                                                    <button
                                                        type="button"
                                                        onClick={() => setFile(null)}
                                                        className="mt-2 text-xs font-medium text-red-600 hover:text-red-500"
                                                    >
                                                        Eliminar
                                                    </button>
                                                </div>
                                            ) : (
                                                <>
                                                    <span className="material-symbols-outlined mx-auto h-12 w-12 text-gray-300">cloud_upload</span>
                                                    <div className="mt-4 flex text-sm leading-6 text-gray-600 justify-center">
                                                        <label
                                                            htmlFor="file-upload"
                                                            className="relative cursor-pointer rounded-md bg-white font-semibold text-brand-blue focus-within:outline-none focus-within:ring-2 focus-within:ring-brand-blue focus-within:ring-offset-2 hover:text-blue-500"
                                                        >
                                                            <span>Subir un archivo</span>
                                                            <input
                                                                id="file-upload"
                                                                name="file-upload"
                                                                type="file"
                                                                className="sr-only"
                                                                onChange={(e) => e.target.files && setFile(e.target.files[0])}
                                                            />
                                                        </label>
                                                        <p className="pl-1">o arrastrar y soltar</p>
                                                    </div>
                                                    <p className="text-xs leading-5 text-gray-600">PNG, JPG, PDF hasta 5MB</p>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* 6. PRIORIDAD */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Prioridad (Opcional)</label>
                                    <select
                                        className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-brand-teal focus:ring-brand-teal sm:text-sm"
                                        value={priorityId}
                                        onChange={(e) => setPriorityId(Number(e.target.value))}
                                    >
                                        <option value="">Prioridad por defecto</option>
                                        {priorities.map(prio => (
                                            <option key={prio.id} value={prio.id}>{prio.nombre}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* WORKFLOW */}
                                {subcategoryId && (
                                    <div className={`rounded-md p-4 border ${checkingFlow ? 'bg-gray-50 border-gray-200' : 'bg-blue-50 border-blue-100'}`}>
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
                                                        <label className="text-sm font-medium text-blue-900 block mb-1">
                                                            Asignar a <span className="text-red-500">*</span>
                                                        </label>
                                                        <select
                                                            className="block w-full rounded-md border-blue-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
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

                                {/* 7. DESCRIPCION (React Quill) */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Descripción <span className="text-red-500">*</span></label>
                                    <div className="bg-white">
                                        <ReactQuill
                                            theme="snow"
                                            value={description}
                                            onChange={setDescription}
                                            className="h-40 mb-12" // mb to avoid toolbar overlap issues or small space
                                            modules={{
                                                toolbar: [
                                                    [{ 'header': [1, 2, false] }],
                                                    ['bold', 'italic', 'underline', 'strike', 'blockquote'],
                                                    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                                                    ['link', 'clean']
                                                ],
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                                <Button type="button" variant="ghost" onClick={() => navigate('/tickets')}>
                                    Cancelar
                                </Button>
                                <Button type="submit" variant="brand" disabled={loading || checkingFlow}>
                                    {loading ? 'Creando Ticket...' : 'Crear Ticket'}
                                </Button>
                            </div>
                        </form>
                    </div>

                    {/* RIGHT COLUMN */}
                    <div className="space-y-6">
                        <div className="bg-white shadow rounded-lg p-6">
                            <h3 className="text-sm font-medium text-gray-500 mb-4 uppercase tracking-wider">Información del Solicitante</h3>
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-full bg-brand-gradient flex items-center justify-center text-white font-bold text-lg shadow-sm">
                                    {user?.nombre?.[0]}{user?.apellido?.[0]}
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900">{user?.nombre} {user?.apellido}</p>
                                    <p className="text-sm text-gray-500">{user?.role?.nombre}</p>
                                    <p className="text-xs text-gray-400 mt-1">{user?.email}</p>
                                </div>
                            </div>

                            <div className="mt-6 pt-6 border-t border-gray-100 space-y-3">
                                <h4 className="text-sm font-medium text-gray-700">Consejos Útiles</h4>
                                <ul className="text-sm text-gray-500 space-y-2 list-disc pl-4">
                                    <li>Proporcione un asunto claro y conciso.</li>
                                    <li>Seleccione la categoría más relevante para asegurar que el ticket llegue al equipo correcto.</li>
                                    <li>Use el editor de texto para dar formato y claridad a su descripción.</li>
                                </ul>
                            </div>
                        </div>
                    </div>

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
        </DashboardLayout>
    );
}
