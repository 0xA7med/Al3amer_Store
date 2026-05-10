import { useEffect, useRef } from 'react';

export const EGYPT_GOVERNORATES = [
    'القاهرة', 'الجيزة', 'الإسكندرية', 'الدقهلية', 'البحر الأحمر', 'البحيرة', 'الفيوم',
    'الغربية', 'الإسماعيلية', 'المنوفية', 'المنيا', 'القليوبية', 'الوادي الجديد',
    'السويس', 'أسوان', 'أسيوط', 'بني سويف', 'بورسعيد', 'دمياط', 'الشرقية', 'جنوب سيناء',
    'كفر الشيخ', 'مطروح', 'الأقصر', 'قنا', 'شمال سيناء', 'سوهاج'
];

interface GovernorateSelectProps {
    value: string;
    onChange: (value: string) => void;
    disabledOptions?: string[];
    className?: string;
    placeholder?: string;
    required?: boolean;
}

export function GovernorateSelect({
    value,
    onChange,
    disabledOptions = [],
    className = '',
    placeholder = 'اختر المحافظة...',
    required = false,
}: GovernorateSelectProps) {
    const selectRef = useRef<HTMLSelectElement>(null);

    useEffect(() => {
        if (selectRef.current) {
            const handleWheel = (e: WheelEvent) => e.preventDefault();
            selectRef.current.addEventListener('wheel', handleWheel, { passive: false });
            return () => selectRef.current?.removeEventListener('wheel', handleWheel);
        }
    }, []);

    return (
        <div className="relative">
            <select
                ref={selectRef}
                required={required}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className={`w-full bg-[#111318]/50 text-white border border-[#3b4354] rounded-lg py-3 px-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all appearance-none ${className}`}
            >
                <option value="" className="bg-[#1e2330]">{placeholder}</option>
                {EGYPT_GOVERNORATES.map((gov) => (
                    <option
                        key={gov}
                        value={gov}
                        className="bg-[#1e2330]"
                        disabled={disabledOptions.includes(gov)}
                    >
                        {gov}{disabledOptions.includes(gov) ? ' (معين سابقاً)' : ''}
                    </option>
                ))}
            </select>
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                expand_more
            </span>
        </div>
    );
}
