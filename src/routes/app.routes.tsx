import { lazy, Suspense } from 'react';
import { Navigate, type RouteObject } from 'react-router-dom';
import { AuthGuard } from '../modules/auth/guards/AuthGuard';
import { PageLoader } from '../shared/components/PageLoader';
import { MainLayout } from '../core/layout/MainLayout';

// Lazy load pages
const LoginPage = lazy(() => import('../modules/auth/pages/LoginPage'));
const DashboardPage = lazy(() => import('../modules/dashboard/pages/DashboardPage'));
const RolesPage = lazy(() => import('../modules/roles/pages/RolesPage'));
const RoleDetailPage = lazy(() => import('../modules/roles/pages/RoleDetailPage'));
const PermissionsPage = lazy(() => import('../modules/roles/pages/PermissionsPage'));
const TicketsPage = lazy(() => import('../modules/tickets/pages/TicketsPage'));
const CreateTicketPage = lazy(() => import('../modules/tickets/pages/CreateTicketPage'));
const TicketDetailPage = lazy(() => import('../modules/tickets/pages/TicketDetailPage'));
const UsersPage = lazy(() => import('../modules/users/pages/UsersPage'));
const DepartmentsPage = lazy(() => import('../modules/departments/pages/DepartmentsPage'));
const CategoriesPage = lazy(() => import('../modules/categories/pages/CategoriesPage'));
const CompaniesPage = lazy(() => import('../modules/companies/pages/CompaniesPage'));
const SubcategoriesPage = lazy(() => import('../modules/subcategories/pages/SubcategoriesPage'));
const RegionsPage = lazy(() => import('../modules/regions/pages/RegionsPage'));
const ZonesPage = lazy(() => import('../modules/zones/pages/ZonesPage'));
const PositionsPage = lazy(() => import('../modules/positions/pages/PositionsPage'));
const ProfilesPage = lazy(() => import('../modules/profiles/pages/ProfilesPage'));
const OrganigramaPage = lazy(() => import('../modules/organigrama/pages/OrganigramaPage'));
const ErrorTypesPage = lazy(() => import('../modules/error-types/pages/ErrorTypesPage'));
const WorkflowListPage = lazy(() => import('../modules/workflows/pages/WorkflowListPage'));
const WorkflowStepsPage = lazy(() => import('../modules/workflows/pages/WorkflowStepsPage').then(module => ({ default: module.WorkflowStepsPage })));


export const appRoutes: RouteObject[] = [
    {
        path: '/login',
        element: (
            <Suspense fallback={<PageLoader />}>
                <LoginPage />
            </Suspense>
        )
    },
    {
        element: <AuthGuard />,
        children: [
            {
                element: <MainLayout />,
                children: [
                    {
                        path: '/',
                        element: (
                            <Suspense fallback={<PageLoader />}>
                                <DashboardPage />
                            </Suspense>
                        )
                    },
                    {
                        path: '/tickets',
                        element: (
                            <Suspense fallback={<PageLoader />}>
                                <TicketsPage />
                            </Suspense>
                        )
                    },
                    {
                        path: '/tickets/create',
                        element: (
                            <Suspense fallback={<PageLoader />}>
                                <CreateTicketPage />
                            </Suspense>
                        )
                    },
                    {
                        path: '/tickets/:id',
                        element: (
                            <Suspense fallback={<PageLoader />}>
                                <TicketDetailPage />
                            </Suspense>
                        )
                    },
                    {
                        path: '/roles',
                        element: (
                            <Suspense fallback={<PageLoader />}>
                                <RolesPage />
                            </Suspense>
                        )
                    },
                    {
                        path: '/roles/:id',
                        element: (
                            <Suspense fallback={<PageLoader />}>
                                <RoleDetailPage />
                            </Suspense>
                        )
                    },
                    {
                        path: '/permissions',
                        element: (
                            <Suspense fallback={<PageLoader />}>
                                <PermissionsPage />
                            </Suspense>
                        )
                    },
                    {
                        path: '/users',
                        element: (
                            <Suspense fallback={<PageLoader />}>
                                <UsersPage />
                            </Suspense>
                        )
                    },
                    {
                        path: '/departments',
                        element: (
                            <Suspense fallback={<PageLoader />}>
                                <DepartmentsPage />
                            </Suspense>
                        )
                    },
                    {
                        path: '/categories',
                        element: (
                            <Suspense fallback={<PageLoader />}>
                                <CategoriesPage />
                            </Suspense>
                        )
                    },
                    {
                        path: '/companies',
                        element: (
                            <Suspense fallback={<PageLoader />}>
                                <CompaniesPage />
                            </Suspense>
                        )
                    },
                    {
                        path: '/regions',
                        element: (
                            <Suspense fallback={<PageLoader />}>
                                <RegionsPage />
                            </Suspense>
                        )
                    },
                    {
                        path: '/zones',
                        element: (
                            <Suspense fallback={<PageLoader />}>
                                <ZonesPage />
                            </Suspense>
                        )
                    },
                    {
                        path: '/positions',
                        element: (
                            <Suspense fallback={<PageLoader />}>
                                <PositionsPage />
                            </Suspense>
                        )
                    },
                    {
                        path: '/profiles',
                        element: (
                            <Suspense fallback={<PageLoader />}>
                                <ProfilesPage />
                            </Suspense>
                        )
                    },
                    {
                        path: '/organigrama',
                        element: (
                            <Suspense fallback={<PageLoader />}>
                                <OrganigramaPage />
                            </Suspense>
                        )
                    },
                    {
                        path: '/subcategories',
                        element: (
                            <Suspense fallback={<PageLoader />}>
                                <SubcategoriesPage />
                            </Suspense>
                        )
                    },
                    {
                        path: '/workflows',
                        element: (
                            <Suspense fallback={<PageLoader />}>
                                <WorkflowListPage />
                            </Suspense>
                        )
                    },
                    {
                        path: '/workflows/:id/steps',
                        element: (
                            <Suspense fallback={<PageLoader />}>
                                <WorkflowStepsPage />
                            </Suspense>
                        )
                    },
                    {
                        path: '/error-types',
                        element: (
                            <Suspense fallback={<PageLoader />}>
                                <ErrorTypesPage />
                            </Suspense>
                        )
                    },
                ]
            },
            {
                path: '*',
                element: <Navigate to="/" replace />
            }
        ]
    }
];
