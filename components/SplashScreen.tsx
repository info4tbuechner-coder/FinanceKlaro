import React, { useEffect, useState } from 'react';

const SplashScreen: React.FC<{ onDone: () => void }> = ({ onDone }) => {
    const [fadeOut, setFadeOut] = useState(false);

    useEffect(() => {
        const fadeTimer = setTimeout(() => setFadeOut(true), 2000);
        const doneTimer = setTimeout(() => onDone(), 2600);
        return () => {
            clearTimeout(fadeTimer);
            clearTimeout(doneTimer);
        };
    }, [onDone]);

    return (
        <div
            className={`fixed inset-0 z-[999] flex flex-col items-center justify-center bg-gradient-to-br from-background-start to-background-end transition-opacity duration-500 ${fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
        >
            <div className="flex flex-col items-center gap-6 animate-fade-in">
                <div className="relative">
                    <div className="h-24 w-24 rounded-3xl bg-primary flex items-center justify-center shadow-2xl shadow-primary/40">
                        <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-14 w-14">
                            <path d="M8 36 L20 24 L8 12" stroke="white" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M22 36 H40" stroke="white" strokeWidth="4.5" strokeLinecap="round"/>
                        </svg>
                    </div>
                    <div className="absolute -inset-3 rounded-[2rem] bg-primary/20 -z-10 blur-xl" />
                </div>

                <div className="text-center space-y-1">
                    <h1 className="text-5xl font-black tracking-tight text-foreground">Klaro</h1>
                    <p className="text-muted-foreground text-sm font-medium tracking-widest uppercase">Persönliche Finanzen</p>
                </div>

                <div className="mt-8 flex flex-col items-center gap-1.5">
                    <div className="h-px w-16 bg-border" />
                    <p className="text-[11px] text-muted-foreground/70 font-medium tracking-wider uppercase">
                        Entwickelt von
                    </p>
                    <p className="text-sm font-semibold text-foreground/80">Ch. von Büchner</p>
                </div>
            </div>
        </div>
    );
};

export default SplashScreen;
