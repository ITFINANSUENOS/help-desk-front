import { Select, type Option } from '../../../../shared/components/Select';

interface FiltroRegionalProps {
    value?: string;
    onChange: (regional?: string) => void;
    regionales: string[];
    placeholder?: string;
    className?: string;
}

export const FiltroRegional = ({ value, onChange, regionales, placeholder = 'Todas las regionales', className }: FiltroRegionalProps) => {
    const options: Option[] = [
        { value: '', label: placeholder },
        ...regionales.map(r => ({ value: r, label: r }))
    ];

    return (
        <Select
            value={value || ''}
            onChange={(val) => {
                onChange(val === '' ? undefined : String(val));
            }}
            options={options}
            placeholder={placeholder}
            className={className}
            isClearable={false}
        />
    );
};
