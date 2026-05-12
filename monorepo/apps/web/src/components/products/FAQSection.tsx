import { useState } from 'react';
import { ChevronDown, ChevronUp, MessageCircleQuestion } from 'lucide-react';

interface FAQItem {
    question: string;
    answer: string;
}

interface FAQSectionProps {
    faqs: FAQItem[];
}

export const FAQSection = ({ faqs }: FAQSectionProps) => {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    if (!faqs || faqs.length === 0) return null;

    return (
        <div className="bg-surface-dark rounded-2xl p-6 border border-white/5 shadow-xl mt-8" id="faq-section">
            <div className="flex items-center gap-3 mb-6">
                <div className="size-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                    <MessageCircleQuestion className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-white">الأسئلة الشائعة (FAQ)</h3>
                    <p className="text-xs text-slate-400 mt-1">أبرز الاستفسارات التقنية حول هذا المنتج</p>
                </div>
            </div>

            <div className="space-y-3">
                {faqs.map((faq, index) => {
                    const isOpen = openIndex === index;
                    return (
                        <div 
                            key={index} 
                            className={`border transition-all duration-300 rounded-xl overflow-hidden ${
                                isOpen ? 'border-indigo-500/30 bg-indigo-500/5' : 'border-white/5 bg-white/5 hover:border-white/10'
                            }`}
                        >
                            <button
                                onClick={() => setOpenIndex(isOpen ? null : index)}
                                className="w-full flex items-center justify-between p-4 text-right gap-4"
                            >
                                <span className={`font-bold text-sm md:text-base ${isOpen ? 'text-indigo-300' : 'text-slate-200'}`}>
                                    {faq.question}
                                </span>
                                <div className={`size-8 rounded-full flex items-center justify-center transition-colors shrink-0 ${
                                    isOpen ? 'bg-indigo-500/20 text-indigo-400' : 'bg-black/20 text-slate-400'
                                }`}>
                                    {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                </div>
                            </button>
                            <div 
                                className={`transition-all duration-300 ease-in-out px-4 overflow-hidden ${
                                    isOpen ? 'max-h-96 pb-4 opacity-100' : 'max-h-0 opacity-0'
                                }`}
                            >
                                <div className="text-sm text-slate-400 leading-relaxed pt-2 border-t border-white/5">
                                    {faq.answer}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
