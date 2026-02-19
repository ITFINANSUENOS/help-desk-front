import React from 'react';
import AsyncSelect from 'react-select/async';
import { userService } from '../services/user.service';
import type { User, UserSelectResult } from '../interfaces/User';
import type { UserCandidate } from '../../tickets/interfaces/Ticket';

interface UserSelectProps {
    value?: number | number[];
    onChange: (value: number | number[] | undefined) => void;
    placeholder?: string;
    className?: string;
    candidates?: (User | UserCandidate)[]; // Optional list of users to select from (Restricted mode)
    isMulti?: boolean;
}

interface UserOption {
    value: number;
    label: string;
    // We keep 'user' implicit or minimal if needed, but primarily we depend on value/label
    data: User | UserSelectResult | UserCandidate;
}

export const UserSelect: React.FC<UserSelectProps> = ({
    value,
    onChange,
    placeholder = 'Buscar usuario...',
    className,
    candidates,
    isMulti = false
}) => {
    // Ref for debounce timer
    const debounceTimer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    // Function to load options asynchronously with debounce
    const loadOptions = (inputValue: string): Promise<UserOption[]> => {
        return new Promise((resolve) => {
            // If candidates are provided (even if empty list), strictly use them
            if (candidates) {
                const filtered = candidates.filter((u) =>
                    `${u.nombre} ${u.apellido} ${u.email}`.toLowerCase().includes(inputValue.toLowerCase())
                );
                resolve(filtered.map((user) => ({
                    value: user.id,
                    label: `${user.nombre} ${user.apellido}${user.email ? ` (${user.email})` : ''}`,
                    data: user
                })));
                return;
            }

            if (debounceTimer.current) {
                clearTimeout(debounceTimer.current);
            }

            debounceTimer.current = setTimeout(async () => {
                try {
                    const users = await userService.searchUsers(inputValue);

                    resolve(users.map(user => ({
                        value: user.id,
                        label: `${user.nombre} ${user.apellido}${user.email ? ` (${user.email})` : ''}`,
                        data: user
                    })));
                } catch (error) {
                    console.error('Error loading users:', error);
                    resolve([]);
                }
            }, 500); // Wait 500ms after last keystroke
        });
    };

    // Custom styles to match Tailwind/application design
    const customStyles = {
        control: (provided: any, state: any) => ({
            ...provided,
            borderColor: state.isFocused ? '#0d9488' : '#e5e7eb', // brand-teal or gray-200
            boxShadow: state.isFocused ? '0 0 0 1px #0d9488' : 'none',
            '&:hover': {
                borderColor: state.isFocused ? '#0d9488' : '#d1d5db' // gray-300
            },
            paddingTop: '2px',
            paddingBottom: '2px',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            lineHeight: '1.25rem',
            minHeight: '42px'
        }),
        option: (provided: any, state: any) => ({
            ...provided,
            backgroundColor: state.isSelected
                ? '#0d9488'
                : state.isFocused
                    ? '#ccfbf1' // teal-100
                    : 'white',
            color: state.isSelected ? 'white' : '#374151', // gray-700
            cursor: 'pointer',
            fontSize: '0.875rem'
        }),
        menu: (provided: any) => ({
            ...provided,
            zIndex: 9999, // Ensure it's above other elements like modals
            borderRadius: '0.5rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
        }),
        input: (provided: any) => ({
            ...provided,
            color: '#374151' // gray-700
        }),
        singleValue: (provided: any) => ({
            ...provided,
            color: '#374151' // gray-700
        }),
        placeholder: (provided: any) => ({
            ...provided,
            color: '#9ca3af' // gray-400
        })
    };

    // State for selected option(s)
    const [selectedOption, setSelectedOption] = React.useState<UserOption | UserOption[] | null>(null);

    React.useEffect(() => {
        let isMounted = true;

        const fetchUser = async () => {
            if (isMulti) {
                const ids = value as number[];
                if (Array.isArray(ids) && ids.length > 0) {
                    // Check if we need to update
                    if (Array.isArray(selectedOption) && selectedOption.every(opt => ids.includes(opt.value)) && selectedOption.length === ids.length) return;

                    try {
                        // Parallel fetch for simplified implementation (or bulk endpoint if available)
                        const promises = ids.map(id => userService.getUser(id));
                        const users = await Promise.all(promises);

                        if (isMounted) {
                            const options = users.filter((u): u is User => !!u).map(user => ({
                                value: user.id,
                                label: `${user.nombre} ${user.apellido}${user.email ? ` (${user.email})` : ''}`,
                                data: user
                            }));
                            setSelectedOption(options);
                        }

                    } catch (error) {
                        console.error('Error fetching selected users:', error);
                    }
                } else if (!ids || ids.length === 0) {
                    setSelectedOption([]);
                }
            } else {
                const id = value as number;
                if (id) {
                    // If we already have the option and it matches, don't refetch
                    if (selectedOption && !Array.isArray(selectedOption) && selectedOption.value === id) return;

                    try {
                        const user = await userService.getUser(id);
                        if (isMounted && user) {
                            setSelectedOption({
                                value: user.id,
                                label: `${user.nombre} ${user.apellido}${user.email ? ` (${user.email})` : ''}`,
                                data: user
                            });
                        }
                    } catch (error) {
                        console.error('Error fetching selected user:', error);
                    }
                } else {
                    setSelectedOption(null);
                }
            }
        };

        fetchUser();

        return () => { isMounted = false; };
    }, [value, isMulti]);

    const handleChange = (option: any) => {
        setSelectedOption(option);
        if (isMulti) {
            const opts = option as UserOption[];
            onChange(opts ? opts.map(o => o.value) : []);
        } else {
            const opt = option as UserOption | null;
            onChange(opt ? opt.value : undefined);
        }
    };

    return (
        <div className={className}>
            <AsyncSelect
                key={candidates ? `candidates-${candidates.length}` : 'global-search'}
                cacheOptions
                defaultOptions={true}
                loadOptions={loadOptions}
                value={selectedOption}
                onChange={handleChange}
                placeholder={placeholder}
                styles={customStyles}
                isClearable
                isMulti={isMulti}
                loadingMessage={() => "Cargando..."}
                noOptionsMessage={() => "No se encontraron usuarios"}
            />
        </div>
    );
};
