import React from 'react';
import { ShoppingCart, Truck, CreditCard, ClipboardCheck, Check } from 'lucide-react';

interface CheckoutProgressBarProps {
    currentStep: 1 | 2 | 3 | 4;
}

const STEPS = [
    { id: 1, label: 'سلة المشتريات', icon: ShoppingCart },
    { id: 2, label: 'معلومات الشحن', icon: Truck },
    { id: 3, label: 'طريقة الدفع', icon: CreditCard },
    { id: 4, label: 'مراجعة الطلب', icon: ClipboardCheck },
];

export const CheckoutProgressBar: React.FC<CheckoutProgressBarProps> = ({ currentStep }) => {
    return (
        <div className="glass-panel rounded-2xl p-6 mb-8 relative overflow-hidden">
            {/* Background Glow Effect */}
            <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-primary/0 via-primary/30 to-primary/0" />

            <div className="flex items-center justify-between relative z-10">
                {STEPS.map((step, index) => {
                    const isCompleted = step.id < currentStep;
                    const isActive = step.id === currentStep;
                    const StepIcon = step.icon;

                    return (
                        <React.Fragment key={step.id}>
                            <div className="flex flex-col items-center gap-3 flex-shrink-0 group">
                                <div
                                    className={`size-12 rounded-full flex items-center justify-center transition-all duration-500 relative
                                        ${isCompleted
                                            ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                                            : isActive
                                                ? 'bg-primary text-white shadow-xl shadow-primary/40 scale-110'
                                                : 'bg-[#181a20] text-gray-500 border border-white/10 group-hover:border-white/20'}`}
                                >
                                    {/* Active Glow */}
                                    {isActive && (
                                        <div className="absolute inset-0 rounded-full bg-primary animate-ping opacity-20" />
                                    )}

                                    {isCompleted ? (
                                        <Check className="w-6 h-6 animate-in zoom-in duration-300" />
                                    ) : (
                                        <StepIcon className={`w-5 h-5 ${isActive ? 'animate-pulse' : ''}`} />
                                    )}

                                    {/* Step Number Badge */}
                                    {!isCompleted && !isActive && (
                                        <span className="absolute -top-1 -right-1 size-5 bg-[#232f48] text-[10px] font-bold rounded-full flex items-center justify-center border border-white/5 text-gray-400">
                                            {step.id}
                                        </span>
                                    )}
                                </div>

                                <span className={`text-xs md:text-sm font-bold transition-colors duration-300 whitespace-nowrap
                                    ${isActive
                                        ? 'text-primary'
                                        : isCompleted
                                            ? 'text-emerald-400'
                                            : 'text-gray-500'}`}
                                >
                                    {step.label}
                                </span>
                            </div>

                            {/* Connector Line */}
                            {index < STEPS.length - 1 && (
                                <div className="flex-1 mx-2 md:mx-4 relative h-1 mb-8">
                                    <div className="absolute inset-0 bg-white/5 rounded-full" />
                                    <div
                                        className={`absolute inset-0 bg-gradient-to-l from-primary to-primary-light rounded-full transition-all duration-700 origin-right
                                            ${isCompleted ? 'scale-x-100' : 'scale-x-0'}`}
                                    />
                                    {/* Completion Connector (Emerald) */}
                                    {step.id < currentStep - 1 && (
                                        <div className="absolute inset-0 bg-emerald-500 rounded-full transition-all duration-700" />
                                    )}
                                </div>
                            )}
                        </React.Fragment>
                    );
                })}
            </div>
        </div>
    );
};
