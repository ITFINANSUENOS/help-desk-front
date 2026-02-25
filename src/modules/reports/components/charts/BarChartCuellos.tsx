import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell} from 'recharts';
import type { CuelloBottleneck } from '../../types/dashboard.types';

interface BarChartCuellosProps {
    data: CuelloBottleneck[];
}

const truncate = (str: string, max: number) => (str.length > max ? str.slice(0, max) + '...' : str);

// Tooltip customizado extraído para evitar recreación en render
const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: CuelloBottleneck; fill: string }> }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload as CuelloBottleneck;
        return (
            <div className="bg-white p-3 border border-gray-200 rounded shadow-sm text-sm">
                <p className="font-bold text-gray-800 mb-1">{data.paso_flujo}</p>
                <p className="text-gray-600">Duración promedio: <span className="font-medium text-gray-900">{data.duracion_promedio.toFixed(1)}h</span></p>
                <p className="text-gray-600">% Atrasos: <span className="font-medium text-gray-900">{data.pct_atrasos.toFixed(1)}%</span></p>
                <p className="text-gray-600 mt-1 pt-1 border-t border-gray-100">
                    Severidad: <span className="font-medium uppercase" style={{ color: payload[0].fill }}>{data.severidad}</span>
                </p>
            </div>
        );
    }
    return null;
};

export const BarChartCuellos = ({ data }: BarChartCuellosProps) => {
    const chartData = data.map(item => ({
        ...item,
        displayPaso: truncate(item.paso_flujo, 25)
    }));

    return (
        <div className="w-full h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={chartData} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                    <XAxis type="number" unit="h" stroke="#6b7280" fontSize={12} tickFormatter={(val) => Math.round(val).toString()} />
                    <YAxis type="category" dataKey="displayPaso" width={200} stroke="#4b5563" fontSize={12} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f3f4f6' }} />
                    <Bar dataKey="duracion_promedio" radius={[0, 4, 4, 0]}>
                        {chartData.map((entry, i) => {
                            let color = '#22c55e'; // verde
                            if (entry.color === 'rojo') color = '#ef4444';
                            else if (entry.color === 'amarillo') color = '#eab308';

                            return <Cell key={i} fill={color} />;
                        })}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};
