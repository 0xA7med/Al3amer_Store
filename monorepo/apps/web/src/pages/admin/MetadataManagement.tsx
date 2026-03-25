import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import toast from 'react-hot-toast';

interface SpecGroup {
    key: string;
    values: string[];
}

export default function MetadataManagement() {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');

    const { data: specs = [], isLoading } = useQuery<SpecGroup[]>({
        queryKey: ['metadata-specs'],
        queryFn: async () => {
            const { data } = await api.get('/metadata');
            return data;
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async ({ key, value }: { key: string; value: string }) => {
            const { data } = await api.post('/metadata/delete-value', { key, value });
            return data;
        },
        onSuccess: (data) => {
            toast.success(data.message || 'تم الحذف بنجاح');
            queryClient.invalidateQueries({ queryKey: ['metadata-specs'] });
        },
        onError: () => {
            toast.error('حدث خطأ أثناء الحذف');
        }
    });

    const filteredSpecs = specs.filter(s => 
        s.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.values.some(v => v.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const handleDelete = (key: string, value: string) => {
        if (window.confirm(`هل أنت متأكد من حذف القيمة "${value}" من جميع المنتجات تحت مفتاح "${key}"؟`)) {
            deleteMutation.mutate({ key, value });
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">إدارة البيانات الوصفية</h1>
                    <p className="text-slate-400 text-sm mt-1">تصفح واحذف القيم المكررة أو غير المرغوب فيها من جميع المنتجات</p>
                </div>

                <div className="relative w-full md:w-80">
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-[20px]">search</span>
                    <input
                        type="text"
                        placeholder="بحث في المفاتيح أو القيم..."
                        className="w-full h-11 bg-[#1e232d] border border-white/10 rounded-xl pr-10 pl-4 text-white text-sm focus:border-primary outline-none transition-all placeholder-slate-600"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center p-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                </div>
            ) : filteredSpecs.length === 0 ? (
                <div className="glass-panel rounded-2xl p-12 text-center">
                    <span className="material-symbols-outlined text-slate-600 text-[60px] mb-4">database_off</span>
                    <p className="text-slate-400">لم يتم العثور على بيانات تطابق بحثك</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredSpecs.map((group) => (
                        <div key={group.key} className="glass-panel rounded-2xl border border-white/5 overflow-hidden flex flex-col bg-[#1e232d]">
                            <div className="p-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
                                <h3 className="font-bold text-white flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary text-[18px]">key</span>
                                    {group.key}
                                </h3>
                                <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                                    {group.values.length} قيم
                                </span>
                            </div>
                            <div className="p-4 flex-1 overflow-y-auto max-h-[300px] space-y-2 custom-scrollbar">
                                {group.values.map(val => (
                                    <div key={val} className="flex items-center justify-between gap-3 group bg-white/[0.02] hover:bg-white/[0.05] p-2.5 rounded-xl transition-all border border-transparent hover:border-white/5">
                                        <span className="text-xs text-slate-300 break-all leading-relaxed">{val}</span>
                                        <button
                                            onClick={() => handleDelete(group.key, val)}
                                            disabled={deleteMutation.isPending}
                                            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-all opacity-0 group-hover:opacity-100 flex-shrink-0"
                                            title="حذف من جميع المنتجات"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">delete</span>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
