let _specIdCounter = 0;
function nextSpecId() { return ++_specIdCounter; }

function makeSpec(key = '', value = ''): { _id: number; key: string; value: string } {
    return { _id: nextSpecId(), key, value };
}

export { makeSpec, nextSpecId };

export function ProductSpecsSection({ specs, setSpecs }: {
    specs: { _id: number; key: string; value: string }[];
    setSpecs: (updater: (prev: { _id: number; key: string; value: string }[]) => { _id: number; key: string; value: string }[]) => void;
}) {
    const addSpec = () => setSpecs(prev => [...prev, makeSpec()]);
    const removeSpec = (id: number) => setSpecs(prev => prev.filter(s => s._id !== id));
    const updateSpec = (id: number, field: 'key' | 'value', value: string) => {
        setSpecs(prev => prev.map(s => s._id === id ? { ...s, [field]: value } : s));
    };

    return (
        <div className="glass-card">
            <div className="card-header">
                <span className="material-symbols-outlined text-purple-400">memory</span>
                <h3>المواصفات الفنية</h3>
                <div className="mr-auto flex items-center gap-2">
                    <button onClick={addSpec} className="btn-ghost text-xs" type="button">
                        <span className="material-symbols-outlined text-[16px]">add</span> إضافة مواصفة
                    </button>
                </div>
            </div>
            <div className="space-y-2">
                {specs.length > 0 && (
                    <div className="grid grid-cols-12 gap-2 px-1 mb-1">
                        <div className="col-span-4 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">الخاصية</div>
                        <div className="col-span-7 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">القيمة</div>
                    </div>
                )}
                {specs.map((spec) => (
                    <div key={spec._id} className="grid grid-cols-12 gap-2 items-center group">
                        <input className="col-span-4 input-field h-10 text-sm" type="text" value={spec.key}
                            onChange={(e) => updateSpec(spec._id, 'key', e.target.value)} placeholder="الخاصية، مثلاً: الرام" />
                        <input className="col-span-7 input-field h-10 text-sm" type="text" value={spec.value}
                            onChange={(e) => updateSpec(spec._id, 'value', e.target.value)} placeholder="القيمة، مثلاً: 4 جيجا" />
                        <div className="col-span-1 flex justify-center">
                            <button onClick={() => removeSpec(spec._id)}
                                className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
                                type="button" title="حذف المواصفة">
                                <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                        </div>
                    </div>
                ))}
            </div>
            {specs.length === 0 && (
                <div className="text-center py-6 border-2 border-dashed border-white/10 rounded-xl">
                    <p className="text-sm text-slate-500">لا توجد مواصفات مضافة حالياً</p>
                    <button onClick={addSpec} className="text-indigo-400 text-xs mt-2 hover:underline" type="button">اضغط هنا لإضافة مواصفة يدوياً</button>
                </div>
            )}
        </div>
    );
}

export function DynamicAttributesSection({ schema, attributes, onChange }: {
    schema: any[];
    attributes: Record<string, string | string[]>;
    onChange: (updater: (prev: Record<string, string | string[]>) => Record<string, string | string[]>) => void;
}) {
    if (schema.length === 0) return null;

    return (
        <div className="glass-card border-t-2 border-t-blue-500/30">
            <div className="card-header">
                <span className="material-symbols-outlined text-blue-400">tune</span>
                <h3>خصائص المنتج (حسب القسم)</h3>
            </div>
            <div className="space-y-6">
                {schema.map((schemaBlock: any, idx: number) => {
                    const isMulti = schemaBlock.type === 'multi-select';
                    const currentValue = attributes[schemaBlock.name];
                    const selectedArray = Array.isArray(currentValue) ? currentValue : (currentValue ? [currentValue] : []);

                    return (
                        <div key={idx}>
                            <label className="field-label mb-3">{schemaBlock.name} ({isMulti ? 'متعدد' : 'اختيار واحد'})</label>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                                {schemaBlock.options.map((opt: string) => {
                                    const isSelected = selectedArray.includes(opt);
                                    return (
                                        <button key={opt} type="button"
                                            onClick={() => {
                                                onChange(prev => {
                                                    if (isMulti) {
                                                        const newArr = isSelected ? selectedArray.filter(x => x !== opt) : [...selectedArray, opt];
                                                        return { ...prev, [schemaBlock.name]: newArr };
                                                    } else {
                                                        return { ...prev, [schemaBlock.name]: isSelected ? '' : opt };
                                                    }
                                                });
                                            }}
                                            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all border ${isSelected ? 'bg-primary/20 border-primary text-primary' : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20 hover:text-white'}`}>
                                            {opt}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
