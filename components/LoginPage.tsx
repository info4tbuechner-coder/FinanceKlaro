import React, { useEffect } from 'react';

const LoginPage: React.FC = () => {
    useEffect(() => {
        const prev = document.body.style.backgroundColor;
        document.body.style.backgroundColor = '#ffffff';
        return () => { document.body.style.backgroundColor = prev; };
    }, []);

    return (
        <div style={{ fontFamily: 'Inter, system-ui, sans-serif' }} className="min-h-screen flex flex-col lg:flex-row">
            <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #f0f4ff 0%, #e8f0fe 100%)', borderRight: '1px solid #e2e8f0' }}>
                <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 20% 50%, rgba(59, 130, 246, 0.08) 0%, transparent 60%)' }} />

                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-1">
                        <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)', boxShadow: '0 8px 24px rgba(59,130,246,0.35)' }}>
                            <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-6 w-6">
                                <path d="M8 36 L20 24 L8 12" stroke="white" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M22 36 H40" stroke="white" strokeWidth="4.5" strokeLinecap="round"/>
                            </svg>
                        </div>
                        <span className="text-2xl font-black" style={{ color: '#0f172a' }}>Klaro</span>
                    </div>
                    <p className="text-xs tracking-widest uppercase font-bold" style={{ color: '#64748b' }}>Persönliche Finanzen</p>
                </div>

                <div className="relative z-10 space-y-6">
                    <h1 className="text-5xl font-black leading-tight" style={{ color: '#0f172a' }}>
                        Volle Kontrolle über deine <span style={{ color: '#2563eb' }}>Finanzen</span>.
                    </h1>
                    <p className="text-lg leading-relaxed" style={{ color: '#475569' }}>
                        Überblicke Einnahmen, Ausgaben und Sparziele — alles an einem Ort. Einfach, sicher, privat.
                    </p>

                    <div className="grid grid-cols-1 gap-3 pt-4">
                        {[
                            { icon: '📊', title: 'Dashboard & Berichte', desc: 'Visualisiere deine Finanzen auf einen Blick' },
                            { icon: '🔒', title: 'Privacy-Modus', desc: 'Sensible Daten ausblenden mit einem Klick' },
                            { icon: '🤖', title: 'KI-Belegscan', desc: 'Belege automatisch mit der Kamera erfassen' },
                        ].map(f => (
                            <div key={f.title} className="flex items-start gap-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(226,232,240,0.8)', backdropFilter: 'blur(8px)' }}>
                                <span className="text-xl flex-shrink-0">{f.icon}</span>
                                <div>
                                    <p className="font-bold text-sm" style={{ color: '#0f172a' }}>{f.title}</p>
                                    <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>{f.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="relative z-10">
                    <p className="text-xs" style={{ color: '#94a3b8' }}>
                        Entwickelt von Ch. von Büchner · {new Date().getFullYear()}
                    </p>
                </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-8" style={{ background: '#ffffff' }}>
                <div className="w-full max-w-sm space-y-8">
                    <div className="lg:hidden flex flex-col items-center gap-3 mb-8">
                        <div className="h-16 w-16 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)', boxShadow: '0 12px 32px rgba(59,130,246,0.4)' }}>
                            <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-10 w-10">
                                <path d="M8 36 L20 24 L8 12" stroke="white" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M22 36 H40" stroke="white" strokeWidth="4.5" strokeLinecap="round"/>
                            </svg>
                        </div>
                        <h1 className="text-3xl font-black" style={{ color: '#0f172a' }}>Klaro</h1>
                        <p className="text-sm" style={{ color: '#64748b' }}>Persönliche Finanzen</p>
                    </div>

                    <div className="text-center space-y-2">
                        <h2 className="text-2xl font-black" style={{ color: '#0f172a' }}>Willkommen zurück</h2>
                        <p className="text-sm" style={{ color: '#64748b' }}>Melde dich an, um auf deine Finanzdaten zuzugreifen.</p>
                    </div>

                    <div className="space-y-3">
                        <a
                            href="/api/login"
                            className="flex items-center justify-center gap-3 w-full rounded-2xl font-bold text-base transition-all active:scale-[0.98] no-underline"
                            style={{ padding: '14px 24px', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: '#ffffff', boxShadow: '0 4px 14px rgba(59,130,246,0.35)', textDecoration: 'none' }}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.9 }}>
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                            </svg>
                            Mit Google anmelden
                        </a>

                        <div className="flex items-center gap-3 py-1">
                            <div className="flex-1 h-px" style={{ background: '#e2e8f0' }} />
                            <span className="text-xs uppercase tracking-widest font-bold" style={{ color: '#94a3b8' }}>oder</span>
                            <div className="flex-1 h-px" style={{ background: '#e2e8f0' }} />
                        </div>

                        <a
                            href="/api/login"
                            className="flex items-center justify-center gap-3 w-full rounded-2xl font-bold text-base transition-all active:scale-[0.98]"
                            style={{ padding: '14px 24px', background: '#f8fafc', color: '#1e293b', border: '1.5px solid #e2e8f0', textDecoration: 'none' }}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" style={{ color: '#1e293b' }}>
                                <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.341-3.369-1.341-.454-1.155-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.268 2.75 1.026A9.578 9.578 0 0112 6.836c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.026 2.747-1.026.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.741 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
                            </svg>
                            Mit GitHub anmelden
                        </a>

                        <a
                            href="/api/login"
                            className="flex items-center justify-center gap-3 w-full rounded-2xl font-bold text-base transition-all active:scale-[0.98]"
                            style={{ padding: '14px 24px', background: '#f8fafc', color: '#1e293b', border: '1.5px solid #e2e8f0', textDecoration: 'none' }}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" style={{ color: '#64748b' }}>
                                <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                            </svg>
                            Mit E-Mail anmelden
                        </a>
                    </div>

                    <p className="text-center text-xs leading-relaxed" style={{ color: '#94a3b8' }}>
                        Durch die Anmeldung stimmst du den Nutzungsbedingungen zu.<br/>
                        Deine Daten werden sicher und verschlüsselt gespeichert.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
