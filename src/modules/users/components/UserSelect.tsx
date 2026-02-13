import React from 'react';
import AsyncSelect from 'react-select/async';
import { userService } from '../services/user.service';
import type { User, UserSelectResult } from '../interfaces/User';
import type { UserCandidate } from '../../tickets/interfaces/Ticket';

interface UserSelectProps {
    value?: number;
    onChange: (value: number | undefined) => void;
    placeholder?: string;
    className?: string;
    candidates?: (User | UserCandidate)[]; // Optional list of users to select from (Restricted mode)
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
    candidates
}) => {
    // Ref for debounce timer
    const debounceTimer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    // Function to load options asynchronously with debounce
    const loadOptions = (inputValue: string): Promise<UserOption[]> => {
        return new Promise((resolve) => {
            // If candidates are provided, filter them client-side
            if (candidates && candidates.length > 0) {
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

    // We need to fetch the initial user if a value is provided but no options are loaded yet
    // However, AsyncSelect handles this via defaultOptions or loadOptions. 
    // If value is provided, we might need to fetch that specific user to display correctly 
    // if we don't have the full object.
    // For now, let's rely on the consumer to maybe provide the object or just load options.
    // Actually, AsyncSelect with just a 'value' ID won't show the label unless we provide the option object.

    // To simplify: we'll use a controlled component approach where we load the selected user if needed.
    // But since the parent only has ID, we might need a small useEffect here to fetch the selected user label
    // if it's not in the current options. 
    // OR we can make this component accept `initialUser` prop.

    // Let's stick to the simplest implementation first: loadOptions returns options.
    // When `value` (ID) changes, we need to map it to an option.
    // Since `react-select` expects an object `{value, label}` as value, not just ID.

    const [selectedOption, setSelectedOption] = React.useState<UserOption | null>(null);

    React.useEffect(() => {
        let isMounted = true;

        const fetchUser = async () => {
            if (value) {
                // If we already have the option and it matches, don't refetch
                if (selectedOption?.value === value) return;

                try {
                    const user = await userService.getUser(value);
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
        };

        fetchUser();

        return () => { isMounted = false; };
    }, [value]);

    const handleChange = (option: UserOption | null) => {
        setSelectedOption(option);
        onChange(option ? option.value : undefined);
    };

    return (
        <div className={className}>
            <AsyncSelect
                cacheOptions
                defaultOptions={true}
                loadOptions={loadOptions}
                value={selectedOption}
                onChange={handleChange as any}
                placeholder={placeholder}
                styles={customStyles}
                isClearable
                loadingMessage={() => "Cargando..."}
                noOptionsMessage={() => "No se encontraron usuarios"}
            />
        </div>
    );
};
