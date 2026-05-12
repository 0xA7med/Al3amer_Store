import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

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
    searchable?: boolean;
}

export function CustomSelect({
    value,
    onChange,
    options,
    placeholder,
    className = "",
    icon = "expand_more",
    label,
    required = false,
    searchable = false
}: CustomSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
    const buttonRef = useRef<HTMLButtonElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const closeDropdown = useCallback(() => setIsOpen(false), []);

    // Position the dropdown relative to the trigger button using fixed positioning
    // This escapes all ancestor stacking contexts and overflow:hidden traps
    const openDropdown = useCallback(() => {
        if (buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            const spaceBelow = viewportHeight - rect.bottom;
            const dropdownHeight = Math.min(260, options.length * 42 + 8);

            // Open upwards if not enough space below
            const openUpwards = spaceBelow < dropdownHeight && rect.top > dropdownHeight;

            setDropdownStyle({
                position: 'fixed',
                left: rect.left,
                width: rect.width,
                zIndex: 9999,
                ...(openUpwards
                    ? { bottom: viewportHeight - rect.top + 4, top: 'auto' }
                    : { top: rect.bottom + 4, bottom: 'auto' }
                ),
            });
        }
        setIsOpen(prev => !prev);
    }, [options.length]);

    useEffect(() => {
        if (!isOpen) return;
        const handleClickOutside = (event: MouseEvent) => {
            // Don't close if clicking inside the dropdown portal
            if (dropdownRef.current && dropdownRef.current.contains(event.target as Node)) return;
            if (
                containerRef.current && !containerRef.current.contains(event.target as Node)
            ) {
                closeDropdown();
            }
        };
        const handleScroll = (event: Event) => {
            // Don't close if scrolling inside the dropdown list
            if (dropdownRef.current && dropdownRef.current.contains(event.target as Node)) return;
            closeDropdown();
        };
        const handleResize = () => closeDropdown();

        document.addEventListener('mousedown', handleClickOutside);
        window.addEventListener('scroll', handleScroll, true);
        window.addEventListener('resize', handleResize);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', handleScroll, true);
            window.removeEventListener('resize', handleResize);
        };
    }, [isOpen, closeDropdown]);

    const selectedOption = options.find(opt => opt.value === value);

    const dropdown = isOpen ? createPortal(
        <div
            ref={dropdownRef}
            style={dropdownStyle}
            className="bg-[#1a2035] border border-white/10 rounded-xl shadow-2xl py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-100"
        >
                {searchable && (
                    <div className="p-2 border-b border-white/5">
                        <input
                            type="text"
                            placeholder="بحث..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onMouseDown={(e) => e.stopPropagation()} // Prevent closing
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-primary/50 transition-all"
                            autoFocus
                        />
                    </div>
                )}
                <div className="max-h-[250px] overflow-y-auto custom-scrollbar" style={{ overscrollBehavior: 'contain' }}>
                    {options.filter(opt => 
                        !searchable || 
                        opt.label.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        opt.value.toLowerCase().includes(searchTerm.toLowerCase())
                    ).map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            onMouseDown={(e) => {
                                // mousedown fires before blur, prevents flicker
                                e.preventDefault();
                                onChange(option.value);
                                closeDropdown();
                                setSearchTerm('');
                            }}
                            className={`w-full text-right px-4 py-2.5 text-sm transition-colors flex items-center justify-between ${value === option.value
                                ? 'bg-primary/20 text-white font-bold'
                                : 'text-slate-400 hover:bg-white/5 hover:text-white'
                                }`}
                        >
                            <span className="truncate">{option.label}</span>
                            {value === option.value && (
                                <span className="material-symbols-outlined text-[18px] text-primary flex-shrink-0">check</span>
                            )}
                        </button>
                    ))}
                </div>
        </div>,
        document.body
    ) : null;

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            {label && (
                <label className="block text-xs font-medium text-slate-500 mb-1.5 flex items-center gap-1">
                    {label}
                    {required && <span className="text-secondary">*</span>}
                </label>
            )}
            <button
                ref={buttonRef}
                type="button"
                onClick={openDropdown}
                className="flex items-center justify-between w-full h-10 px-3 pr-4 rounded-lg bg-white/5 border border-white/10 text-sm text-slate-300 hover:border-white/20 transition-all outline-none"
            >
                <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
                <span className={`material-symbols-outlined text-[20px] transition-transform duration-200 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}>
                    {icon}
                </span>
            </button>

            {dropdown}
        </div>
    );
}
