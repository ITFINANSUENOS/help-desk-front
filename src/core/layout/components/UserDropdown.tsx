import { useState, useRef, useEffect } from 'react';
import { cn } from '../../../shared/lib/utils';

interface UserDropdownProps {
    userName: string;
    userRole: string;
    onLogout: () => void;
}

/**
 * UserDropdown component for displaying user info and actions
 * Groups profile information and logout in a clean dropdown menu
 */
export function UserDropdown({ userName, userRole, onLogout }: UserDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    // Get user initials for avatar
    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-gray-50 transition-colors"
            >
                <div className="text-right hidden sm:block">
                    <p className="text-sm font-semibold text-gray-800">{userName}</p>
                    <p className="text-xs text-gray-500 capitalize">{userRole}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-blue text-white font-semibold text-sm">
                    {getInitials(userName)}
                </div>
                <span
                    className={cn(
                        "material-symbols-outlined text-gray-400 transition-transform hidden sm:block",
                        isOpen && "rotate-180"
                    )}
                    style={{ fontSize: '20px', fontVariationSettings: '"FILL" 1' }}
                >
                    expand_more
                </span>
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-lg border border-gray-200 bg-white shadow-lg z-50">
                    {/* User Info (visible on mobile) */}
                    <div className="border-b border-gray-100 p-4 sm:hidden">
                        <p className="text-sm font-semibold text-gray-800">{userName}</p>
                        <p className="text-xs text-gray-500 capitalize mt-1">{userRole}</p>
                    </div>

                    {/* Menu Items */}
                    <div className="py-2">
                        <button
                            onClick={onLogout}
                            className="flex w-full items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            <span className="material-symbols-outlined text-gray-400" style={{ fontSize: '20px', fontVariationSettings: '"FILL" 1' }}>
                                logout
                            </span>
                            <span>Cerrar Sesión</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
