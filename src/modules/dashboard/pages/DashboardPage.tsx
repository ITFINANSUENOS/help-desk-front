
import { useEffect, useState } from 'react';
import { StatsCard } from '../components/StatsCard';
import { TicketTable } from '../components/TicketTable';
import { useAuth } from '../../auth/context/useAuth';
import { useLayout } from '../../../core/layout/context/LayoutContext';
import { dashboardService } from '../services/dashboard.service';
import type { DashboardStats } from '../services/dashboard.service';

export default function DashboardPage() {
    const { user } = useAuth();
    const { setTitle } = useLayout();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setTitle('Dashboard');
        loadStats();
    }, [setTitle]);

    const loadStats = async () => {
        try {
            const data = await dashboardService.getStats();
            setStats(data);
        } catch (error) {
            console.error('Failed to load dashboard stats:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Cargando estadísticas...</div>;
    }

    return (
        <>
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Bienvenido, {user?.nombre} {user?.apellido}! 👋</h2>
                <p className="mt-2 text-gray-500">Aquí tienes un resumen de tu actividad.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                <StatsCard
                    title="Pasos Asignados"
                    value={stats?.assigned.toString() || '0'}
                    icon="assignment_ind"
                    iconColor="text-brand-blue"
                    iconBgColor="bg-blue-50"
                    trend="Total histórico"
                    trendColor="text-gray-500"
                />
                <StatsCard
                    title="Gestionados"
                    value={stats?.managed.toString() || '0'}
                    icon="check_circle"
                    iconColor="text-green-600"
                    iconBgColor="bg-green-50"
                    footerLabel="Finalizados o Reasignados"
                />
                <StatsCard
                    title="Pendientes"
                    value={stats?.pending.toString() || '0'}
                    icon="hourglass_top"
                    iconColor="text-orange-500"
                    iconBgColor="bg-orange-50"
                    footerLabel="Activos en tu bandeja"
                    footerIcon="priority_high"
                    footerColor="text-brand-red"
                    isUrgent={true}
                />
                <StatsCard
                    title="Total Tickets"
                    value={stats?.total.toString() || '0'}
                    icon="folder"
                    iconColor="text-purple-600"
                    iconBgColor="bg-purple-50"
                    footerLabel="Total General"
                />
            </div>

            {/* Recent Tickets Table */}
            <TicketTable tickets={stats?.recent || []} />
        </>
    );
}
