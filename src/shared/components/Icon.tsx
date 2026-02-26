import React from 'react';
import { cn } from '../lib/utils'; // Assuming cn utility exists, usually in shared/lib/utils

interface IconProps {
    name: string;
    className?: string;
    style?: React.CSSProperties;
    onClick?: (e: React.MouseEvent<HTMLSpanElement, MouseEvent>) => void;
    title?: string;
}

export const Icon = ({ name, className = "", style, onClick, title }: IconProps) => {
    return (
        <span
            className={cn("material-symbols-outlined notranslate", className)}
            translate="no"
            style={style}
            onClick={onClick}
            title={title}
        >
            {name}
        </span>
    );
};
