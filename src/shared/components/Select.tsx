import React from 'react';
import ReactSelect, { type SingleValue, type MultiValue, type StylesConfig, type GroupBase } from 'react-select';

export interface Option {
    value: string | number;
    label: string;
}

interface SelectProps {
    value?: string | number;
    onChange: (value: string | number | undefined) => void;
    options: Option[];
    placeholder?: string;
    className?: string;
    label?: string;
    error?: string;
    disabled?: boolean;
    required?: boolean;
    name?: string;
    id?: string;
    isClearable?: boolean;
}

export const Select: React.FC<SelectProps> = ({
    value,
    onChange,
    options,
    placeholder = 'Seleccionar...',
    className,
    label,
    error,
    disabled,
    required,
    name,
    id,
    isClearable = true
}) => {
    // Find selected option object based on value
    const selectedOption = options.find(opt => opt.value === value) || null;

    const handleChange = (
        newValue: SingleValue<Option> | MultiValue<Option>
    ) => {
        const val = newValue as SingleValue<Option>;
        onChange(val ? val.value : undefined);
    };

    // Custom styles to match Tailwind/application design (Sync with UserSelect)
    const customStyles: StylesConfig<Option, boolean, GroupBase<Option>> = {
        control: (provided, state) => ({
            ...provided,
            borderColor: state.isFocused ? '#0d9488' : error ? '#ef4444' : '#e5e7eb', // brand-teal or red-500 or gray-200
            boxShadow: state.isFocused ? '0 0 0 1px #0d9488' : 'none',
            '&:hover': {
                borderColor: state.isFocused ? '#0d9488' : '#d1d5db' // gray-300
            },
            paddingTop: '2px',
            paddingBottom: '2px',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            lineHeight: '1.25rem',
            minHeight: '42px',
            backgroundColor: state.isDisabled ? '#f3f4f6' : 'white', // gray-100
        }),
        option: (provided, state) => ({
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
        menu: (provided) => ({
            ...provided,
            zIndex: 9999,
            borderRadius: '0.5rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
        }),
        input: (provided) => ({
            ...provided,
            color: '#374151'
        }),
        singleValue: (provided) => ({
            ...provided,
            color: '#374151'
        }),
        placeholder: (provided) => ({
            ...provided,
            color: '#9ca3af'
        })
    };

    return (
        <div className={className}>
            {label && (
                <label htmlFor={id} className="block text-sm font-bold text-gray-700 mb-1">
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
            )}
            <ReactSelect<Option, false, GroupBase<Option>>
                id={id}
                name={name}
                value={selectedOption}
                onChange={handleChange}
                options={options}
                placeholder={placeholder}
                styles={customStyles}
                isClearable={isClearable}
                isDisabled={disabled}
                noOptionsMessage={() => "No hay opciones"}
                classNamePrefix="react-select"
            />
            {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        </div>
    );
};
