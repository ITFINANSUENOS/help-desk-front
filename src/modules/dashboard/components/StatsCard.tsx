
import { cn } from '../../../shared/lib/utils';
import { Icon } from '../../../shared/components/Icon';

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
    isUrgent?: boolean; // Highlights the card with urgent styling
    onClick?: () => void;
    active?: boolean;
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
    footerColor = "text-gray-400",
    isUrgent = false,
    onClick,
    active = false
}: StatsCardProps) {
    return (
        <div
            className={cn(
                "rounded-xl border bg-white p-6 shadow-sm transition-all",
                isUrgent ? "border-red-200 bg-red-50/30" : "border-gray-100",
                onClick && "cursor-pointer hover:shadow-md hover:border-brand-blue/30",
                active && "ring-2 ring-brand-blue border-brand-blue shadow-md"
            )}
            onClick={onClick}
            role={onClick ? "button" : undefined}
            tabIndex={onClick ? 0 : undefined}
            onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); } : undefined}
        >
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-500">{title}</p>
                    <p className={cn(
                        "mt-2 text-3xl font-bold",
                        isUrgent ? "text-brand-red" : "text-gray-800"
                    )}>{value}</p>
                </div>
                <div className={cn("flex h-14 w-14 items-center justify-center rounded-lg", iconBgColor, iconColor)}>
                    <Icon name={icon} className="text-2xl" style={{ fontVariationSettings: '"FILL" 1' }} />
                </div>
            </div>
            {(trend || footerLabel) && (
                <div className={cn("mt-4 flex items-center text-xs font-medium", trend ? trendColor : footerColor)}>
                    {(trend || footerIcon) && (
                        <Icon name={trend ? (Number(trend.replace(/\D/g, '')) > 0 ? "trending_up" : "trending_down") : footerIcon!} className="mr-1 text-sm" style={{ fontVariationSettings: '"FILL" 1' }} />
                    )}
                    <span>{trendLabel || footerLabel}</span>
                </div>
            )}
        </div>
    );
}

