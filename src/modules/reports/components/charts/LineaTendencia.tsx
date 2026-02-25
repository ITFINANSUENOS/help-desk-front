import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine, ResponsiveContainer } from 'recharts';

interface DatosTendencia {
    fecha: string;
    pct_cumplimiento: number;
    errores_proceso: number;
}

interface LineaTendenciaProps {
    data: DatosTendencia[];
}

// Tooltip extraído afuera
const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ color: string; name: string; value: number }>; label?: string }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white p-3 border border-gray-200 rounded shadow-sm text-sm">
                <p className="font-bold text-gray-800 mb-2 pb-1 border-b border-gray-100">{label}</p>
                {payload.map((entry, index) => (
                    <p key={`item-${index}`} className="flex items-center gap-2 mt-1">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></span>
                        <span className="text-gray-600">{entry.name}:</span>
                        <span className="font-medium text-gray-900">
                            {Number(entry.value).toFixed(1)}{(entry.name || '').includes('%') ? '%' : ''}
                        </span>
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

export const LineaTendencia = ({ data }: LineaTendenciaProps) => {
    return (
        <div className="w-full h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis
                        dataKey="fecha"
                        tick={{ fontSize: 12, fill: '#6b7280' }}
                        interval="preserveStartEnd"
                    />
                    <YAxis
                        yAxisId="left"
                        tick={{ fontSize: 12, fill: '#6b7280' }}
                        domain={[0, 100]}
                        unit="%"
                    />
                    <YAxis
                        yAxisId="right"
                        orientation="right"
                        tick={{ fontSize: 12, fill: '#6b7280' }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} />

                    <ReferenceLine y={85} yAxisId="left" stroke="#10b981" strokeDasharray="3 3" label={{ position: 'insideTopLeft', value: 'Meta 85%', fill: '#10b981', fontSize: 12 }} />

                    <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="pct_cumplimiento"
                        name="% Cumplimiento"
                        stroke="#43BBCA"
                        strokeWidth={3}
                        dot={{ r: 4, strokeWidth: 2 }}
                        activeDot={{ r: 6 }}
                    />
                    <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="errores_proceso"
                        name="Errores de Proceso"
                        stroke="#D92323"
                        strokeWidth={3}
                        dot={{ r: 4, strokeWidth: 2 }}
                        activeDot={{ r: 6 }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};
