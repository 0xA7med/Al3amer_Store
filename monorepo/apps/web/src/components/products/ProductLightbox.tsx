import { Plus, ChevronLeft } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

interface ProductLightboxProps {
    images: string[];
    activeImageIndex: number;
    isZoomOpen: boolean;
    productName: string;
    onImageSelect: (index: number) => void;
    onClose: () => void;
}

export function ProductLightbox({
    images,
    activeImageIndex,
    isZoomOpen,
    productName,
    onImageSelect,
    onClose,
}: ProductLightboxProps) {
    return (
        <AnimatePresence>
            {isZoomOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-4"
                    onClick={onClose}
                >
                    <button
                        className="absolute top-6 right-6 size-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors border border-white/10"
                        onClick={onClose}
                    >
                        <Plus className="w-6 h-6 rotate-45" />
                    </button>

                    <div className="absolute top-6 left-6 text-slate-400 text-sm font-medium">
                        {activeImageIndex + 1} / {images.length}
                    </div>

                    <div className="absolute inset-x-4 md:inset-x-8 top-1/2 -translate-y-1/2 flex justify-between pointer-events-none">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onImageSelect((activeImageIndex + 1) % images.length);
                            }}
                            className="size-14 rounded-full bg-white/5 hover:bg-white/10 text-white flex items-center justify-center transition-colors border border-white/10 pointer-events-auto backdrop-blur-md"
                        >
                            <ChevronLeft className="w-8 h-8" />
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onImageSelect((activeImageIndex - 1 + images.length) % images.length);
                            }}
                            className="size-14 rounded-full bg-white/5 hover:bg-white/10 text-white flex items-center justify-center transition-colors border border-white/10 pointer-events-auto backdrop-blur-md"
                        >
                            <ChevronLeft className="w-8 h-8 rotate-180" />
                        </button>
                    </div>

                    <motion.div
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: 20 }}
                        className="max-w-5xl w-full h-full flex items-center justify-center"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <img
                            src={images[activeImageIndex]}
                            alt={productName}
                            className="max-w-full max-h-full object-contain drop-shadow-[0_0_50px_rgba(19,91,236,0.2)]"
                        />
                    </motion.div>

                    <div className="absolute bottom-8 flex gap-2 overflow-x-auto max-w-[90vw] p-2 no-scrollbar" onClick={(e: any) => e.stopPropagation()}>
                        {images.map((img, idx) => (
                            <button
                                key={idx}
                                onClick={() => onImageSelect(idx)}
                                className={`size-16 rounded-lg border-2 overflow-hidden transition-all flex-shrink-0 ${activeImageIndex === idx ? 'border-primary ring-4 ring-primary/20' : 'border-white/10 opacity-50 hover:opacity-100'}`}
                            >
                                <img src={img} alt="صورة المنتج" className="w-full h-full object-cover" />
                            </button>
                        ))}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
