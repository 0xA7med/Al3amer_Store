export function AIPromptInput({ onGenerate, isGenerating, setNameField }: {
    onGenerate: () => void;
    isGenerating: boolean;
    setNameField: (name: string) => void;
}) {
    return (
        <div className="glass-card p-1 relative overflow-hidden">
            <div className="absolute inset-[-1px] rounded-2xl p-[1px] bg-gradient-to-r from-indigo-500 via-purple-500 to-primary opacity-50 pointer-events-none"></div>
            <div className="bg-[#161b26]/90 backdrop-blur-sm rounded-xl p-4 flex items-center gap-4 relative z-10">
                <div className="size-10 rounded-full bg-indigo-500/10 flex items-center justify-center flex-shrink-0 animate-pulse">
                    <span className="material-symbols-outlined text-indigo-400">psychology</span>
                </div>
                <div className="flex-1">
                    <input className="w-full bg-transparent border-none text-sm text-white placeholder-slate-500 focus:ring-0"
                        placeholder="الصق رابط منتج أو اكتب اسمه هنا لإنشاء التفاصيل تلقائياً..."
                        type="text"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                setNameField(e.currentTarget.value);
                                setTimeout(onGenerate, 100);
                            }
                        }}
                    />
                </div>
                <button onClick={onGenerate} disabled={isGenerating}
                    className="text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                    type="button">
                    {isGenerating ? (
                        <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    ) : (
                        <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
                    )}
                    توليد بالذكاء الاصطناعي
                </button>
            </div>
        </div>
    );
}
