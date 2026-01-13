import { useState, useRef, useEffect } from 'react';

interface Option {
    value: string;
    label: string;
}

interface CustomSelectProps {
    value: string;
    onChange: (val: string) => void;
    options: Option[];
    placeholder: string;
    className?: string;
    icon?: string;
    label?: string;
    required?: boolean;
}

export function CustomSelect({
    value,
    onChange,
    options,
    placeholder,
    className = "",
    icon = "expand_more",
    label,
    required = false
}: CustomSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedOption = options.find(opt => opt.value === value);

    return (
        <div className={`relative ${isOpen ? 'z-40' : 'z-10'} ${className}`} ref={containerRef}>
            {label && (
                <label className="block text-xs font-medium text-slate-500 mb-1.5 flex items-center gap-1">
                    {label}
                    {required && <span className="text-secondary">*</span>}
                </label>
            )}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between w-full h-10 px-3 pr-4 rounded-lg bg-white/5 border border-white/10 text-sm text-slate-300 hover:border-white/20 transition-all outline-none"
            >
                <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
                <span className={`material-symbols-outlined text-[20px] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
                    {icon}
                </span>
            </button>

            {isOpen && (
                <div className="absolute top-full mt-1 left-0 right-0 z-[999] bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl py-1 animate-in fade-in zoom-in-95 duration-100 overflow-hidden">
                    <div className="max-h-[250px] overflow-y-auto custom-scrollbar">
                        {options.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => {
                                    onChange(option.value);
                                    setIsOpen(false);
                                }}
                                className={`w-full text-right px-4 py-2.5 text-sm transition-colors flex items-center justify-between ${value === option.value
                                    ? 'bg-primary/20 text-white font-bold'
                                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                                    }`}
                            >
                                <span>{option.label}</span>
                                {value === option.value && (
                                    <span className="material-symbols-outlined text-[18px] text-primary">check</span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
