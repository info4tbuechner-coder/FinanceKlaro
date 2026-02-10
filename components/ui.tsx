
import React from 'react';
import { X } from 'lucide-react';
import { triggerHapticFeedback } from '../utils';

export const Modal: React.FC<{ children: React.ReactNode; title: string; onClose: () => void; size?: 'sm' | 'md' | 'lg' | 'xl' }> = ({ children, title, onClose, size = 'md' }) => {
    const sizeClasses = {
        sm: 'sm:max-w-sm',
        md: 'sm:max-w-md',
        lg: 'sm:max-w-lg',
        xl: 'sm:max-w-xl',
    };

    const handleClose = () => {
        triggerHapticFeedback('light');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center animate-fade-in-backdrop" onClick={handleClose}>
            <div 
                className={`relative w-full glass-card rounded-t-[2.5rem] sm:rounded-2xl shadow-2xl ${sizeClasses[size]} animate-slide-up-sheet sm:animate-zoom-in-modal sm:mx-4 border-t sm:border border-border/20`} 
                onClick={e => e.stopPropagation()}
            >
                {/* Grab Handle for UX - Visual cue that it's a pullable drawer */}
                <div className="w-12 h-1.5 bg-border/20 rounded-full mx-auto mt-4 mb-2 sm:hidden"></div>
                
                <div className="flex items-center justify-between p-5 border-b border-border/10">
                    <h3 className="text-xl font-bold text-foreground">{title}</h3>
                    <button onClick={handleClose} className="p-3 -mr-2 rounded-full hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground" aria-label="Schließen">
                        <X className="h-6 w-6" />
                    </button>
                </div>
                <div className="p-6 max-h-[85vh] overflow-y-auto pb-safe">
                    {children}
                </div>
            </div>
        </div>
    );
};

export const FormGroup: React.FC<{children: React.ReactNode, label: string, htmlFor?: string}> = ({children, label, htmlFor}) => (
    <div className="mb-5">
        <label htmlFor={htmlFor} className="block text-xs font-bold mb-2 text-muted-foreground uppercase tracking-widest">{label}</label>
        {children}
    </div>
);

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    enterKeyHint?: "enter" | "done" | "go" | "next" | "previous" | "search" | "send";
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>((props, ref) => (
    <input 
        spellCheck="false"
        autoComplete="off"
        {...props} 
        ref={ref} 
        className={`block w-full bg-secondary text-foreground border border-border/50 rounded-xl shadow-sm focus:ring-2 focus:ring-primary/40 focus:border-primary/60 outline-none px-4 py-4 sm:py-3 text-base placeholder:text-muted-foreground/50 transition-all duration-200 ${props.className}`} 
    />
));

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>((props, ref) => (
    <select 
        {...props} 
        ref={ref} 
        className={`block w-full bg-secondary text-foreground border border-border/50 rounded-xl shadow-sm focus:ring-2 focus:ring-primary/40 focus:border-primary/60 outline-none px-4 py-4 sm:py-3 text-base appearance-none cursor-pointer transition-all duration-200 ${props.className}`} 
    />
));

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & {variant?: 'primary' | 'secondary' | 'destructive'}> = ({children, variant = 'secondary', ...props}) => {
    const baseClasses = "px-5 py-4 sm:py-3 rounded-xl font-bold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95 flex items-center justify-center text-base touch-manipulation focus-visible:ring-2 focus-visible:ring-primary/60 outline-none";
    const variantClasses = {
        primary: "bg-primary text-primary-foreground hover:brightness-110 shadow-lg shadow-primary/20",
        secondary: "border border-border/50 bg-secondary/30 text-foreground hover:bg-secondary/60",
        destructive: "bg-destructive text-destructive-foreground hover:brightness-110 shadow-lg shadow-destructive/20"
    };
    return <button {...props} className={`${baseClasses} ${variantClasses[variant]} ${props.className}`}>{children}</button>;
};
