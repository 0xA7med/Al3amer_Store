import React from 'react';

interface LoadingSpinnerProps {
  fullScreen?: boolean;
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ fullScreen = false, className = '' }) => {
  const containerClasses = fullScreen 
    ? 'fixed inset-0 flex items-center justify-center bg-white bg-opacity-75 z-50' 
    : 'flex items-center justify-center';

  return (
    <div className={`${containerClasses} ${className}`}>
      <div className="flex flex-col items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <p className="mt-2 text-gray-600 text-sm">جاري التحميل...</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;
