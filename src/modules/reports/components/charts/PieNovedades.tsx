import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { TipoNovedad } from '../../types/dashboard.types';

interface PieNovedadesProps {
    data: TipoNovedad[];
}

const COLORS: Record<string, string> = {
    'Error de Proceso': '#D92323', // brand-red
    'Error Informativo': '#43BBCA', // brand-teal
    Otros: '#94a3b8' // slate-400
};

// Tooltip extraído afuera
const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: TipoNovedad }> }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload as TipoNovedad;
        return (
            <div className="bg-white p-2 border border-gray-200 rounded shadow-sm text-sm">
                <p className="font-semibold text-gray-800">{data.tipo_novedad}</p>
                <div className="mt-1">
                    <p className="text-gray-600">Cantidad: <span className="font-medium">{data.cantidad}</span></p>
                    <p className="text-gray-600">% del Total: <span className="font-medium">{data.pct_total.toFixed(1)}%</span></p>
                </div>
            </div>
        );
    }
    return null;
};

export const PieNovedades = ({ data }: PieNovedadesProps) => {
    return (
        <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="cantidad"
                        nameKey="tipo_novedad"
                    >
                        {data.map((entry, index) => {
                            const fill = entry.tipo_novedad.includes('Proceso') ? COLORS['Error de Proceso'] :
                                entry.tipo_novedad.includes('Informativo') ? COLORS['Error Informativo'] :
                                    COLORS.Otros;

                            return <Cell key={`cell-${index}`} fill={fill} />;
                        })}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ paddingTop: '10px' }} />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
};
