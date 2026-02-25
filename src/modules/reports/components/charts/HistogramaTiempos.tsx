import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { RangoTiempo } from '../../types/dashboard.types';

interface HistogramaTiemposProps {
    data: RangoTiempo[];
}

export const HistogramaTiempos = ({ data }: HistogramaTiemposProps) => {
    return (
        <div className="w-full h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis
                        dataKey="rango_tiempo"
                        scale="band"
                        tick={{ fontSize: 12, fill: '#6b7280' }}
                        interval={0}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                    />
                    <YAxis
                        yAxisId="left"
                        tick={{ fontSize: 12, fill: '#6b7280' }}
                        label={{ value: 'Cantidad de Tickets', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#4b5563', fontSize: 12 } }}
                    />
                    <YAxis
                        yAxisId="right"
                        orientation="right"
                        unit="%"
                        tick={{ fontSize: 12, fill: '#6b7280' }}
                        domain={[0, 100]}
                        label={{ value: '% Acumulado', angle: 90, position: 'insideRight', style: { textAnchor: 'middle', fill: '#4b5563', fontSize: 12 } }}
                    />
                    <Tooltip
                        contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}
                        formatter={(value: any, name: any) => {
                            const numericValue = Number(value) || 0;
                            if (name === 'pct_acumulado') return [`${numericValue.toFixed(1)}%`, '% Acumulado'];
                            return [numericValue, 'Cantidad'];
                        }}
                    />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                    <Bar yAxisId="left" dataKey="cantidad" name="Cantidad" fill="#43BBCA" radius={[4, 4, 0, 0]} barSize={40} />
                    <Line yAxisId="right" type="monotone" dataKey="pct_acumulado" name="% Acumulado" stroke="#2B378A" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    );
};
