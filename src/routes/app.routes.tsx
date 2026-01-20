import { lazy, Suspense } from 'react';
import { Navigate, type RouteObject } from 'react-router-dom';
import { AuthGuard } from '../guards/AuthGuard';
import { PageLoader } from '../components/ui/PageLoader';

// Lazy load pages
const LoginPage = lazy(() => import('../pages/LoginPage'));
const DashboardPage = lazy(() => import('../pages/DashboardPage'));
const RolesPage = lazy(() => import('../pages/RolesPage'));
const RoleDetailPage = lazy(() => import('../pages/RoleDetailPage'));
const PermissionsPage = lazy(() => import('../pages/PermissionsPage'));
const TicketsPage = lazy(() => import('../pages/TicketsPage'));


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
        ]
    },
    {
        path: '*',
        element: <Navigate to="/" replace />
    }
];
