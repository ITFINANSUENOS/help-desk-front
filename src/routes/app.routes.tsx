import { lazy, Suspense } from 'react';
import { Navigate, type RouteObject } from 'react-router-dom';
import { AuthGuard } from '../modules/auth/guards/AuthGuard';
import { PageLoader } from '../shared/components/PageLoader';
import { MainLayout } from '../core/layout/MainLayout';
import PriceListsAdminPage from '../modules/price-lists/pages/PriceListsAdminPage';
import PriceListsPage from '../modules/price-lists/pages/PriceListsPage';

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
const UserProfilePage = lazy(() => import('../modules/users/pages/UserProfilePage'));
const OrganigramaPage = lazy(() => import('../modules/organigrama/pages/OrganigramaPage'));
const ErrorTypesPage = lazy(() => import('../modules/error-types/pages/ErrorTypesPage'));
const WorkflowListPage = lazy(() => import('../modules/workflows/pages/WorkflowListPage'));
const WorkflowStepsPage = lazy(() => import('../modules/workflows/pages/WorkflowStepsPage').then(module => ({ default: module.WorkflowStepsPage })));
const MappingRulesPage = lazy(() => import('../modules/mapping-rules/pages/MappingRulesPage'));
const NotificationsPage = lazy(() => import('../modules/notifications/pages/NotificationsPage'));
const ReportsPage = lazy(() => import('../modules/reports/pages/ReportsPage'));
const MainDashboardPage = lazy(() => import('../modules/reports/pages/MainDashboard'));
const RankingUsuariosPage = lazy(() => import('../modules/reports/pages/RankingUsuarios'));
const RegionalesPage = lazy(() => import('../modules/reports/pages/Regionales'));
const MapaCalorPage = lazy(() => import('../modules/reports/pages/MapaCalor'));
const CategoriasPage = lazy(() => import('../modules/reports/pages/Categorias'));
const CuellosBottleneckPage = lazy(() => import('../modules/reports/pages/CuellosBottleneck'));
const ViaticosPage = lazy(() => import('../modules/viaticos/pages/ViaticosPage'));
const CreateViaticoPage = lazy(() => import('../modules/viaticos/pages/CreateViaticoPage'));
const ViaticoDetailPage = lazy(() => import('../modules/viaticos/pages/ViaticoDetailPage'));
const ViaticoConfigPage = lazy(() => import('../modules/viaticos/pages/ViaticoConfigPage'));
const DistribucionTiemposPage = lazy(() => import('../modules/reports/pages/DistribucionTiempos'));
const NovedadesPage = lazy(() => import('../modules/reports/pages/Novedades'));
const DetalleUsuarioPage = lazy(() => import('../modules/reports/pages/DetalleUsuario'));
const FlowOpenTicketsPage = lazy(() => import('../modules/reports/pages/FlowOpenTicketsPage'));
const TicketsUsuarioPage = lazy(() => import('../modules/reports/pages/TicketsUsuarioPage'));

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
                        path: '/profile',
                        element: (
                            <Suspense fallback={<PageLoader />}>
                                <UserProfilePage />
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
                    {
                        path: '/mapping-rules',
                        element: (
                            <Suspense fallback={<PageLoader />}>
                                <MappingRulesPage />
                            </Suspense>
                        )
                    },
                    {
                        path: '/notifications',
                        element: (
                            <Suspense fallback={<PageLoader />}>
                                <NotificationsPage />
                            </Suspense>
                        )
                    },
                    {
                        path: '/reports',
                        element: (
                            <Suspense fallback={<PageLoader />}>
                                <ReportsPage />
                            </Suspense>
                        )
                    },
                    {
                        path: '/reports/dashboard',
                        element: (
                            <Suspense fallback={<PageLoader />}>
                                <MainDashboardPage />
                            </Suspense>
                        )
                    },
                    {
                        path: '/reports/flow-open',
                        element: (
                            <Suspense fallback={<PageLoader />}>
                                <FlowOpenTicketsPage />
                            </Suspense>
                        )
                    },
                    {
                        path: '/price-lists',
                        element: (
                            <Suspense fallback={<PageLoader />}>
                                <PriceListsPage />
                            </Suspense>
                        )
                    },
                    {
                        path: '/price-lists/admin',
                        element: (
                            <Suspense fallback={<PageLoader />}>
                                <PriceListsAdminPage />
                            </Suspense>
                        )
                    },
                    {
                        path: '/reports/dashboard/ranking',
                        element: (
                            <Suspense fallback={<PageLoader />}>
                                <RankingUsuariosPage />
                            </Suspense>
                        )
                    },
                    {
                        path: '/reports/dashboard/regionales',
                        element: (
                            <Suspense fallback={<PageLoader />}>
                                <RegionalesPage />
                            </Suspense>
                        )
                    },
                    {
                        path: '/reports/dashboard/mapa-calor',
                        element: (
                            <Suspense fallback={<PageLoader />}>
                                <MapaCalorPage />
                            </Suspense>
                        )
                    },
                    {
                        path: '/reports/dashboard/categorias',
                        element: (
                            <Suspense fallback={<PageLoader />}>
                                <CategoriasPage />
                            </Suspense>
                        )
                    },
                    {
                        path: '/reports/dashboard/cuellos-botella',
                        element: (
                            <Suspense fallback={<PageLoader />}>
                                <CuellosBottleneckPage />
                            </Suspense>
                        )
                    },
                    {
                        path: '/reports/dashboard/distribucion',
                        element: (
                            <Suspense fallback={<PageLoader />}>
                                <DistribucionTiemposPage />
                            </Suspense>
                        )
                    },
                    {
                        path: '/reports/dashboard/novedades',
                        element: (
                            <Suspense fallback={<PageLoader />}>
                                <NovedadesPage />
                            </Suspense>
                        )
                    },
                    {
                        path: '/reports/dashboard/usuario/:id',
                        element: (
                            <Suspense fallback={<PageLoader />}>
                                <DetalleUsuarioPage />
                            </Suspense>
                        )
                    },
                    {
                        path: '/reports/dashboard/tickets-usuario',
                        element: (
                            <Suspense fallback={<PageLoader />}>
                                <TicketsUsuarioPage />
                            </Suspense>
                        )
                    },
                    {
                        path: '/reports/flow-open',
                        element: (
                            <Suspense fallback={<PageLoader />}>
                                <FlowOpenTicketsPage />
                            </Suspense>
                        )
                    },
                    {
                        path: '/viaticos',
                        element: (
                            <Suspense fallback={<PageLoader />}>
                                <ViaticosPage />
                            </Suspense>
                        )
                    },
                    {
                        path: '/viaticos/nuevo',
                        element: (
                            <Suspense fallback={<PageLoader />}>
                                <CreateViaticoPage />
                            </Suspense>
                        )
                    },
                    {
                        path: '/viaticos/:id',
                        element: (
                            <Suspense fallback={<PageLoader />}>
                                <ViaticoDetailPage />
                            </Suspense>
                        )
                    },
                    {
                        path: '/viaticos/config',
                        element: (
                            <Suspense fallback={<PageLoader />}>
                                <ViaticoConfigPage />
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
