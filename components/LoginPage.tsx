import React from 'react';

const LoginPage: React.FC = () => {
    return (
        <div className="min-h-screen flex flex-col lg:flex-row bg-gradient-to-br from-background-start to-background-end">
            <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-primary/5 border-r border-border/10 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent pointer-events-none" />

                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
                            <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-6 w-6">
                                <path d="M8 36 L20 24 L8 12" stroke="white" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M22 36 H40" stroke="white" strokeWidth="4.5" strokeLinecap="round"/>
                            </svg>
                        </div>
                        <span className="text-2xl font-black text-foreground">Klaro</span>
                    </div>
                    <p className="text-xs text-muted-foreground tracking-widest uppercase font-bold">Persönliche Finanzen</p>
                </div>

                <div className="relative z-10 space-y-6">
                    <h1 className="text-4xl xl:text-5xl font-black text-foreground leading-tight">
                        Volle Kontrolle über deine <span className="text-primary">Finanzen</span>.
                    </h1>
                    <p className="text-muted-foreground text-lg leading-relaxed">
                        Überblicke Einnahmen, Ausgaben und Sparziele — alles an einem Ort. Einfach, sicher, privat.
                    </p>

                    <div className="grid grid-cols-1 gap-4 pt-4">
                        {[
                            { icon: '📊', title: 'Dashboard & Berichte', desc: 'Visualisiere deine Finanzen auf einen Blick' },
                            { icon: '🔒', title: 'Privacy-Modus', desc: 'Sensible Daten ausblenden mit einem Klick' },
                            { icon: '🤖', title: 'KI-Belegscan', desc: 'Belege automatisch mit der Kamera erfassen' },
                        ].map(f => (
                            <div key={f.title} className="flex items-start gap-3 p-3 rounded-xl bg-card/40 border border-border/20 backdrop-blur-sm">
                                <span className="text-2xl flex-shrink-0">{f.icon}</span>
                                <div>
                                    <p className="font-bold text-sm text-foreground">{f.title}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">{f.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="relative z-10">
                    <p className="text-xs text-muted-foreground/50">
                        Entwickelt von Ch. von Büchner · {new Date().getFullYear()}
                    </p>
                </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-8">
                <div className="w-full max-w-sm space-y-8 animate-fade-in">
                    <div className="lg:hidden flex flex-col items-center gap-3 mb-8">
                        <div className="h-16 w-16 rounded-2xl bg-primary flex items-center justify-center shadow-2xl shadow-primary/40">
                            <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-10 w-10">
                                <path d="M8 36 L20 24 L8 12" stroke="white" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M22 36 H40" stroke="white" strokeWidth="4.5" strokeLinecap="round"/>
                            </svg>
                        </div>
                        <h1 className="text-3xl font-black text-foreground">Klaro</h1>
                        <p className="text-muted-foreground text-sm">Persönliche Finanzen</p>
                    </div>

                    <div className="text-center space-y-2">
                        <h2 className="text-2xl font-black text-foreground">Willkommen zurück</h2>
                        <p className="text-muted-foreground text-sm">Melde dich an, um auf deine Finanzdaten zuzugreifen.</p>
                    </div>

                    <div className="space-y-4">
                        <a
                            href="/api/login"
                            className="flex items-center justify-center gap-3 w-full py-3.5 px-6 rounded-2xl bg-primary text-primary-foreground font-bold text-base shadow-lg shadow-primary/30 hover:bg-primary/90 transition-all active:scale-[0.98]"
                        >
                            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current opacity-90" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12.545 10.239v3.821h5.445c-.712 2.315-2.647 3.972-5.445 3.972a6.033 6.033 0 110-12.064c1.498 0 2.866.549 3.921 1.453l2.814-2.814A9.969 9.969 0 0012.545 2C7.021 2 2.543 6.477 2.543 12s4.478 10 10.002 10c8.396 0 10.249-7.85 9.426-11.748l-9.426-.013z"/>
                            </svg>
                            Mit Google anmelden
                        </a>

                        <div className="relative flex items-center gap-3">
                            <div className="flex-1 h-px bg-border/40" />
                            <span className="text-[11px] text-muted-foreground uppercase tracking-widest font-bold">oder</span>
                            <div className="flex-1 h-px bg-border/40" />
                        </div>

                        <a
                            href="/api/login"
                            className="flex items-center justify-center gap-3 w-full py-3.5 px-6 rounded-2xl bg-secondary text-foreground font-bold text-base border border-border/30 hover:bg-secondary/70 transition-all active:scale-[0.98]"
                        >
                            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current text-muted-foreground" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.341-3.369-1.341-.454-1.155-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.268 2.75 1.026A9.578 9.578 0 0112 6.836c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.026 2.747-1.026.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.741 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
                            </svg>
                            Mit GitHub anmelden
                        </a>

                        <a
                            href="/api/login"
                            className="flex items-center justify-center gap-3 w-full py-3.5 px-6 rounded-2xl bg-secondary text-foreground font-bold text-base border border-border/30 hover:bg-secondary/70 transition-all active:scale-[0.98]"
                        >
                            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current text-muted-foreground" xmlns="http://www.w3.org/2000/svg">
                                <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                            </svg>
                            Mit E-Mail anmelden
                        </a>
                    </div>

                    <p className="text-center text-[11px] text-muted-foreground/60 leading-relaxed">
                        Durch die Anmeldung stimmst du den Nutzungsbedingungen zu.<br/>
                        Deine Daten werden sicher und verschlüsselt gespeichert.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
