import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    text?: string;
    fullScreen?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
    size = 'md',
    text,
    fullScreen = false
}) => {
    const sizeClasses = {
        sm: 'h-4 w-4',
        md: 'h-8 w-8',
        lg: 'h-12 w-12'
    };

    const containerClass = fullScreen
        ? 'min-h-screen flex items-center justify-center bg-gray-50'
        : 'flex items-center justify-center py-8';

    return (
        <div className={containerClass}>
            <div className="text-center">
                <Loader2 className={`${sizeClasses[size]} animate-spin text-yellow-500 mx-auto mb-4`} />
                {text && <p className="text-gray-600">{text}</p>}
            </div>
        </div>
    );
};