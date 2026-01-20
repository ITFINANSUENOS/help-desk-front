
import { cn } from '../../lib/utils';

interface StatsCardProps {
    title: string;
    value: string | number;
    icon: string;
    iconColor: string; // e.g., "text-brand-blue"
    iconBgColor: string; // e.g., "bg-blue-50"
    trend?: string;
    trendLabel?: string;
    trendColor?: string; // e.g., "text-green-600"
    footerIcon?: string;
    footerLabel?: string;
    footerColor?: string;
}

export function StatsCard({
    title,
    value,
    icon,
    iconColor,
    iconBgColor,
    trend,
    trendLabel,
    trendColor = "text-green-600",
    footerIcon,
    footerLabel,
    footerColor = "text-gray-400"
}: StatsCardProps) {
    return (
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-500">{title}</p>
                    <p className="mt-2 text-3xl font-bold text-gray-800">{value}</p>
                </div>
                <div className={cn("flex h-12 w-12 items-center justify-center rounded-lg", iconBgColor, iconColor)}>
                    <span className="material-symbols-outlined">{icon}</span>
                </div>
            </div>
            {(trend || footerLabel) && (
                <div className={cn("mt-4 flex items-center text-xs font-medium", trend ? trendColor : footerColor)}>
                    {(trend || footerIcon) && (
                        <span className="material-symbols-outlined mr-1 text-sm">{trend ? (Number(trend.replace(/\D/g, '')) > 0 ? "trending_up" : "trending_down") : footerIcon}</span>
                    )}
                    <span>{trendLabel || footerLabel}</span>
                </div>
            )}
        </div>
    );
}
