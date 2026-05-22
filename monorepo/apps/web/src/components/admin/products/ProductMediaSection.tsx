import { useRef } from 'react';
import { compressImage } from '../../../utils/imageUtils';

interface ImageItem { url: string; isPrimary: boolean }
interface VideoItem { url: string; title: string; is_featured: boolean }

export function ProductMediaSection({ images, setImages, videos, setVideos }: {
    images: ImageItem[];
    setImages: (updater: (prev: ImageItem[]) => ImageItem[]) => void;
    videos: VideoItem[];
    setVideos: (updater: (prev: VideoItem[]) => VideoItem[]) => void;
}) {
    const dragIndexRef = useRef<number | null>(null);

    const handleDragStart = (idx: number) => { dragIndexRef.current = idx; };
    const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); };
    const handleDrop = (idx: number) => {
        const from = dragIndexRef.current;
        if (from === null || from === idx) return;
        setImages(prev => {
            const next = [...prev];
            const [moved] = next.splice(from, 1);
            next.splice(idx, 0, moved);
            dragIndexRef.current = null;
            // Always make the first image the primary one
            return next.map((img, i) => ({ ...img, isPrimary: i === 0 }));
        });
    };

    const addVideo = () => setVideos(prev => [...prev, { url: '', title: '', is_featured: prev.length === 0 }]);
    const removeVideo = (idx: number) => setVideos(prev => {
        const next = prev.filter((_, i) => i !== idx);
        if (next.length > 0 && !next.some(v => v.is_featured)) next[0].is_featured = true;
        return next;
    });
    const updateVideo = (idx: number, field: 'url' | 'title', value: string) => {
        setVideos(prev => prev.map((v, i) => i === idx ? { ...v, [field]: value } : v));
    };
    const setFeaturedVideo = (idx: number) => {
        setVideos(prev => prev.map((v, i) => ({ ...v, is_featured: i === idx })));
    };

    const handleImageUpload = async (files: FileList) => {
        for (const file of Array.from(files)) {
            try {
                const compressedBase64 = await compressImage(file);
                setImages(prev => {
                    const next = [...prev, { url: compressedBase64, isPrimary: false }];
                    return next.map((img, i) => ({ ...img, isPrimary: i === 0 }));
                });
            } catch {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setImages(prev => {
                        const next = [...prev, { url: reader.result as string, isPrimary: false }];
                        return next.map((img, i) => ({ ...img, isPrimary: i === 0 }));
                    });
                };
                reader.readAsDataURL(file);
            }
        }
    };

    return (
        <div className="glass-card">
            <div className="card-header">
                <span className="material-symbols-outlined text-blue-400">perm_media</span>
                <h3>صور وفيديوهات المنتج</h3>
                <p className="text-[11px] text-slate-500 mr-auto">اسحب الصور لترتيبها (الأولى هي الأساسية)</p>
                <div className="flex gap-2">
                    <button onClick={() => { const url = window.prompt('أدخل رابط الصورة:'); if (url) setImages(prev => {
                        const next = [...prev, { url, isPrimary: false }];
                        return next.map((img, i) => ({ ...img, isPrimary: i === 0 }));
                    }); }}
                        className="btn-secondary text-xs" type="button">رابط خارجي</button>
                    <button onClick={() => document.getElementById('image-upload')?.click()}
                        className="btn-primary text-xs flex items-center gap-1.5" type="button">
                        <span className="material-symbols-outlined text-[16px]">upload</span> رفع صور
                    </button>
                    <input type="file" accept="image/*" multiple className="hidden" id="image-upload"
                        onChange={async (e) => { if (e.target.files) handleImageUpload(e.target.files); }} />
                </div>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4 mb-6">
                {images.map((img, i) => (
                    <div key={i} draggable onDragStart={() => handleDragStart(i)} onDragOver={handleDragOver} onDrop={() => handleDrop(i)}
                        className={`aspect-square rounded-xl border-2 bg-white/5 relative group/img overflow-hidden transition-all cursor-grab active:cursor-grabbing ${img.isPrimary ? 'border-primary ring-2 ring-primary/20' : 'border-white/10 hover:border-white/30'}`}>
                        <img src={img.url}
                            onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/600x400?text=No+Image'; }}
                            className="w-full h-full object-cover pointer-events-none" alt="صورة المنتج" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            {!img.isPrimary && (
                                <button onClick={() => setImages(prev => {
                                    const next = [...prev];
                                    const [moved] = next.splice(i, 1);
                                    next.unshift(moved);
                                    return next.map((im, idx) => ({ ...im, isPrimary: idx === 0 }));
                                })}
                                    className="size-8 rounded-full bg-emerald-500 text-white flex items-center justify-center hover:bg-emerald-600 transition-colors" title="نقل للبداية (أساسية)" type="button">
                                    <span className="material-symbols-outlined text-[16px]">star</span>
                                </button>
                            )}
                            <button onClick={() => { setImages(prev => { 
                                const next = prev.filter((_, idx) => idx !== i); 
                                return next.map((im, idx) => ({ ...im, isPrimary: idx === 0 })); 
                            }); }}
                                className="size-8 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors" title="حذف" type="button">
                                <span className="material-symbols-outlined text-[16px]">delete</span>
                            </button>
                        </div>
                        {img.isPrimary && (
                            <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-primary text-white text-[10px] font-bold shadow-lg">أساسية</div>
                        )}
                        <div className="absolute bottom-1 left-1 text-white/30 group-hover/img:text-white/60 transition-colors">
                            <span className="material-symbols-outlined text-[14px]">drag_indicator</span>
                        </div>
                    </div>
                ))}
                <div onClick={() => document.getElementById('image-upload')?.click()} onDragOver={handleDragOver} onDrop={() => handleDrop(images.length)}
                    className="aspect-square rounded-xl border-2 border-dashed border-white/20 hover:border-primary/50 bg-white/5 flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-white/10">
                    <span className="material-symbols-outlined text-slate-500 text-3xl mb-1">add_a_photo</span>
                    <span className="text-[10px] text-slate-500 font-medium">إضافة</span>
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <label className="field-label mb-0">روابط الفيديو (يوتيوب أو فيسبوك)</label>
                    <button onClick={addVideo} type="button" className="text-xs text-primary hover:text-primary/80 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px]">add</span> إضافة فيديو
                    </button>
                </div>
                {videos.map((video, idx) => (
                    <div key={idx} className="flex flex-col gap-2 p-3 bg-white/5 border border-white/10 rounded-xl relative">
                        <div className="flex items-start gap-4">
                            <div className="flex-1 space-y-3">
                                <input type="text" value={video.url} onChange={(e) => updateVideo(idx, 'url', e.target.value)}
                                    className="input-field" placeholder="رابط الفيديو (https://youtube.com/... أو facebook.com/...)" />
                                <input type="text" value={video.title} onChange={(e) => updateVideo(idx, 'title', e.target.value)}
                                    className="input-field" placeholder="عنوان توضيحي (اختياري) - مثلاً: شرح الاستخدام" />
                            </div>
                            <button onClick={() => removeVideo(idx)} type="button" className="p-2 text-slate-400 hover:text-red-400 hover:bg-white/5 rounded-lg transition-colors mt-1">
                                <span className="material-symbols-outlined text-[20px]">delete</span>
                            </button>
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer mt-1 pl-2">
                            <input type="radio" name="featured_video" checked={video.is_featured} onChange={() => setFeaturedVideo(idx)}
                                className="w-4 h-4 text-primary focus:ring-primary border-slate-600 bg-slate-800" />
                            <span className="text-sm text-slate-300">تعيين كفيديو أساسي (شرح الاستخدام)</span>
                        </label>
                    </div>
                ))}
            </div>
        </div>
    );
}
