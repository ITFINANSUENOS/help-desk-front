
import { DashboardLayout } from '../layout/DashboardLayout';
import { StatsCard } from '../components/dashboard/StatsCard';
import { TicketTable } from '../components/dashboard/TicketTable';
import { useAuth } from '../context/useAuth';

export default function DashboardPage() {
    const { user } = useAuth();

    // Extract name from email (before @) as a fallback name
    const userName = user?.usu_correo.split('@')[0] || 'Usuario';

    return (
        <DashboardLayout>
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900">Bienvenido, {userName}! 👋</h2>
                <p className="mt-1 text-gray-500">Aquí tienes un resumen de tu actividad de hoy.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                <StatsCard
                    title="Total Tickets"
                    value="142"
                    icon="folder"
                    iconColor="text-brand-blue"
                    iconBgColor="bg-blue-50"
                    trend="+8% from yesterday"
                    trendColor="text-green-600"
                />
                <StatsCard
                    title="Active Now"
                    value="28"
                    icon="bolt"
                    iconColor="text-brand-teal"
                    iconBgColor="bg-cyan-50"
                    footerLabel="Currently being handled"
                />
                <StatsCard
                    title="Pending"
                    value="14"
                    icon="hourglass_top"
                    iconColor="text-orange-500"
                    iconBgColor="bg-orange-50"
                    footerLabel="3 high priority"
                    footerIcon="priority_high"
                    footerColor="text-brand-red"
                />
                <StatsCard
                    title="Resolved"
                    value="100"
                    icon="check_circle"
                    iconColor="text-green-600"
                    iconBgColor="bg-green-50"
                    trend="+12% completion rate"
                />
            </div>

            {/* Recent Tickets Table */}
            <TicketTable />
        </DashboardLayout>
    );
}
