
import React from 'react';
import { X, Loader2 } from 'lucide-react';
import { triggerHapticFeedback } from '../utils';

export const Modal: React.FC<{ 
    children: React.ReactNode; 
    title: string; 
    onClose: () => void; 
    size?: 'sm' | 'md' | 'lg' | 'xl' 
}> = ({ children, title, onClose, size = 'md' }) => {
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
        <div 
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-[2px] transition-opacity duration-300" 
            onClick={handleClose}
            aria-modal="true"
            role="dialog"
        >
            <div 
                className={`relative w-full glass-card rounded-t-[2.5rem] sm:rounded-2xl shadow-2xl ${sizeClasses[size]} animate-slide-up-sheet sm:animate-zoom-in-modal sm:mx-4 border-t sm:border border-border/20 overflow-hidden will-change-transform`} 
                onClick={e => e.stopPropagation()}
            >
                {/* Grab Handle for UX */}
                <div className="w-12 h-1 bg-muted/30 rounded-full mx-auto mt-3 mb-1 sm:hidden"></div>
                
                <div className="flex items-center justify-between p-5 border-b border-border/10">
                    <h3 className="text-xl font-extrabold text-foreground tracking-tight">{title}</h3>
                    <button 
                        onClick={handleClose} 
                        className="p-2 -mr-2 rounded-full hover:bg-secondary transition-all active:scale-90 text-muted-foreground hover:text-foreground" 
                        aria-label="Schließen"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>
                <div className="p-6 max-h-[75vh] sm:max-h-[85vh] overflow-y-auto pb-safe custom-scrollbar">
                    {children}
                </div>
            </div>
        </div>
    );
};

export const FormGroup: React.FC<{children: React.ReactNode, label: string, htmlFor?: string, error?: string}> = ({children, label, htmlFor, error}) => (
    <div className="mb-5 last:mb-0">
        <label htmlFor={htmlFor} className="block text-[10px] font-bold mb-1.5 text-muted-foreground uppercase tracking-widest ml-1">{label}</label>
        {children}
        {error && <p className="text-destructive text-[10px] mt-1 ml-1 font-bold uppercase">{error}</p>}
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
        className={`block w-full bg-secondary/50 text-foreground border border-border/40 rounded-xl shadow-sm focus:ring-2 focus:ring-primary/30 focus:border-primary/50 focus:bg-secondary outline-none px-4 py-4 sm:py-3 text-base placeholder:text-muted-foreground/40 transition-all duration-200 select-text ${props.className}`} 
    />
));

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>((props, ref) => (
    <div className="relative">
        <select 
            {...props} 
            ref={ref} 
            className={`block w-full bg-secondary/50 text-foreground border border-border/40 rounded-xl shadow-sm focus:ring-2 focus:ring-primary/30 focus:border-primary/50 focus:bg-secondary outline-none px-4 py-4 sm:py-3 text-base appearance-none cursor-pointer transition-all duration-200 select-none ${props.className}`} 
        />
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
        </div>
    </div>
));

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: 'primary' | 'secondary' | 'destructive' | 'ghost',
    loading?: boolean,
    haptic?: boolean
}> = ({children, variant = 'secondary', loading = false, haptic = true, ...props}) => {
    const baseClasses = "relative px-5 py-4 sm:py-3 rounded-xl font-bold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-[0.97] flex items-center justify-center text-base touch-manipulation focus-visible:ring-2 focus-visible:ring-primary/60 outline-none select-none overflow-hidden";
    const variantClasses = {
        primary: "bg-primary text-primary-foreground hover:brightness-110 shadow-lg shadow-primary/20",
        secondary: "border border-border/50 bg-secondary/40 text-foreground hover:bg-secondary/60",
        destructive: "bg-destructive text-destructive-foreground hover:brightness-110 shadow-lg shadow-destructive/20",
        ghost: "bg-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/30"
    };

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        if (haptic && !props.disabled && !loading) {
            triggerHapticFeedback(variant === 'destructive' ? 'medium' : 'light');
        }
        if (props.onClick) props.onClick(e);
    };

    return (
        <button 
            {...props} 
            onClick={handleClick}
            className={`${baseClasses} ${variantClasses[variant]} ${props.className}`}
        >
            {loading ? (
                <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    <span className="opacity-0">{children}</span>
                </>
            ) : children}
        </button>
    );
};
