import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

interface Brand {
    id: string;
    name: string;
}

interface BrandSelectProps {
    value: string;
    onChange: (val: string) => void;
    brands: Brand[];
    placeholder: string;
    label?: string;
}

export function BrandSelect({
    value,
    onChange,
    brands,
    placeholder,
    label
}: BrandSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState(value);
    const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Sync searchTerm with value when not open
    useEffect(() => {
        if (!isOpen) {
            setSearchTerm(value);
        }
    }, [value, isOpen]);

    const filteredBrands = brands.filter(b => 
        b.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const closeDropdown = useCallback(() => setIsOpen(false), []);

    const openDropdown = useCallback(() => {
        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            const spaceBelow = viewportHeight - rect.bottom;
            const dropdownHeight = Math.min(260, (filteredBrands.length + 1) * 42 + 8);

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
        setIsOpen(true);
    }, [filteredBrands.length]);

    useEffect(() => {
        if (!isOpen) return;
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && dropdownRef.current.contains(event.target as Node)) return;
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                closeDropdown();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, closeDropdown]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setSearchTerm(val);
        onChange(val); // Update form data immediately
        if (!isOpen) setIsOpen(true);
    };

    const handleSelectBrand = (name: string) => {
        onChange(name);
        setSearchTerm(name);
        setIsOpen(false);
    };

    const dropdown = isOpen ? createPortal(
        <div
            ref={dropdownRef}
            style={dropdownStyle}
            className="bg-[#1a2035] border border-white/10 rounded-xl shadow-2xl py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-100"
        >
            <div className="max-h-[250px] overflow-y-auto custom-scrollbar" style={{ overscrollBehavior: 'contain' }}>
                {filteredBrands.length > 0 ? (
                    filteredBrands.map((brand) => (
                        <button
                            key={brand.id}
                            type="button"
                            onMouseDown={(e) => {
                                e.preventDefault();
                                handleSelectBrand(brand.name);
                            }}
                            className={`w-full text-right px-4 py-2.5 text-sm transition-colors flex items-center justify-between ${value === brand.name
                                ? 'bg-primary/20 text-white font-bold'
                                : 'text-slate-400 hover:bg-white/5 hover:text-white'
                                }`}
                        >
                            <span className="truncate">{brand.name}</span>
                            {value === brand.name && (
                                <span className="material-symbols-outlined text-[18px] text-primary flex-shrink-0">check</span>
                            )}
                        </button>
                    ))
                ) : (
                    searchTerm && (
                        <div className="px-4 py-2.5 text-xs text-slate-500 italic">
                            سيتم إضافة "{searchTerm}" كعلامة تجارية جديدة
                        </div>
                    )
                )}
            </div>
        </div>,
        document.body
    ) : null;

    return (
        <div className="relative" ref={containerRef}>
            {label && <label className="field-label">{label}</label>}
            <div className="relative group">
                <input
                    ref={inputRef}
                    type="text"
                    value={searchTerm}
                    onChange={handleInputChange}
                    onFocus={openDropdown}
                    placeholder={placeholder}
                    className="input-field text-sm pr-10"
                />
                <span className={`absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
                    expand_more
                </span>
            </div>
            {dropdown}
        </div>
    );
}
