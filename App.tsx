
import React, { useState, useEffect } from 'react';
import { AppProvider, useAppState, useAppDispatch, useUpcomingBills } from './context/AppContext';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import TransactionList from './components/TransactionList';
import RightSidebar from './components/RightSidebar';
import ModalManager from './components/modals/ModalManager';
import { Plus, ScanLine, LayoutDashboard, Receipt, BarChart2, WifiOff } from 'lucide-react';
import { triggerHapticFeedback } from './utils';

const OfflineNotice: React.FC = () => {
    const [isOffline, setIsOffline] = useState(!navigator.onLine);

    useEffect(() => {
        const handleOnline = () => setIsOffline(false);
        const handleOffline = () => setIsOffline(true);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    if (!isOffline) return null;

    return (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[60] animate-bounce pointer-events-none">
            <div className="bg-destructive text-destructive-foreground px-4 py-2 rounded-full shadow-2xl flex items-center gap-2 text-sm font-bold border-2 border-background">
                <WifiOff size={16} /> Offline-Modus aktiv
            </div>
        </div>
    );
};

const MobileNavBar: React.FC = () => {
    const { activeSidebarTab } = useAppState();
    const dispatch = useAppDispatch();
    
    const openModal = (modal: any) => {
        triggerHapticFeedback('medium');
        dispatch({ type: 'OPEN_MODAL', payload: modal });
    };

    const setActiveTab = (tab: string) => {
        triggerHapticFeedback('light');
        dispatch({ type: 'SET_ACTIVE_SIDEBAR_TAB', payload: tab });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden glass-card border-t border-border/20 px-4 py-2 flex items-center justify-between pb-safe shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.3)]">
            <button 
                onClick={() => setActiveTab('Bericht')}
                className={`flex flex-col items-center p-3 rounded-2xl transition-all active:scale-90 ${activeSidebarTab === 'Bericht' ? 'text-primary' : 'text-muted-foreground'}`}
            >
                <LayoutDashboard size={22} strokeWidth={activeSidebarTab === 'Bericht' ? 2.5 : 2} />
                <span className="text-[10px] mt-1.5 font-bold uppercase tracking-tighter">Home</span>
            </button>
            <button 
                onClick={() => setActiveTab('Rechnungen')}
                className={`flex flex-col items-center p-3 rounded-2xl transition-all active:scale-90 ${activeSidebarTab === 'Rechnungen' ? 'text-primary' : 'text-muted-foreground'}`}
            >
                <Receipt size={22} strokeWidth={activeSidebarTab === 'Rechnungen' ? 2.5 : 2} />
                <span className="text-[10px] mt-1.5 font-bold uppercase tracking-tighter">Bills</span>
            </button>
            
            <div className="relative -mt-10 mb-2">
                <button
                    onClick={() => openModal({ type: 'ADD_TRANSACTION' })}
                    className="bg-primary text-primary-foreground h-14 w-14 rounded-full shadow-2xl flex items-center justify-center border-4 border-background transition-transform active:scale-125"
                    aria-label="Neu"
                >
                    <Plus size={28} strokeWidth={3} />
                </button>
            </div>

            <button 
                onClick={() => openModal({ type: 'ANALYSIS' })}
                className="flex flex-col items-center p-3 rounded-2xl transition-all active:scale-90 text-muted-foreground"
            >
                <BarChart2 size={22} />
                <span className="text-[10px] mt-1.5 font-bold uppercase tracking-tighter">Graph</span>
            </button>
            
            <button 
                onClick={() => openModal({ type: 'SMART_SCAN' })}
                className="flex flex-col items-center p-3 rounded-2xl transition-all active:scale-90 text-muted-foreground"
            >
                <ScanLine size={22} />
                <span className="text-[10px] mt-1.5 font-bold uppercase tracking-tighter">Scan</span>
            </button>
        </nav>
    );
};

const AppContent: React.FC = () => {
    const { theme, activeModal, privacyMode } = useAppState();
    const dispatch = useAppDispatch();
    const { dueOrOverdueCount } = useUpcomingBills();
    const isBlockchainTheme = theme === 'blockchain';

    // PWA Lifecycle: appinstalled event
    useEffect(() => {
        const handleAppInstalled = () => {
            console.log('App was successfully installed');
            // Logic to hide custom install buttons could go here if managed globally
        };
        window.addEventListener('appinstalled', handleAppInstalled);
        return () => window.removeEventListener('appinstalled', handleAppInstalled);
    }, []);

    // PWA App Badging API sync
    useEffect(() => {
        if ('setAppBadge' in navigator) {
            if (dueOrOverdueCount > 0) {
                (navigator as any).setAppBadge(dueOrOverdueCount).catch((e: any) => console.debug('Badge error', e));
            } else {
                (navigator as any).clearAppBadge().catch((e: any) => console.debug('Badge error', e));
            }
        }
    }, [dueOrOverdueCount]);

    // Dynamic Theme-Sync for Body Background & System bars
    useEffect(() => {
        const themeConfigs: Record<string, { meta: string; body: string }> = {
            grandeur: { meta: '#f8fafc', body: '#f8fafc' },
            synthwave: { meta: '#0f0720', body: '#0f0720' },
            blockchain: { meta: '#0f172a', body: '#0f172a' },
            neon: { meta: '#0a0a0a', body: '#0a0a0a' },
            forest: { meta: '#f1f5f9', body: '#f1f5f9' }
        };
        const config = themeConfigs[theme] || { meta: '#0a0a0a', body: '#0a0a0a' };
        
        document.getElementById('theme-color-meta')?.setAttribute('content', config.meta);
        document.body.style.backgroundColor = config.body;
    }, [theme]);

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (activeModal) {
            document.body.style.overflow = 'hidden';
            document.body.style.touchAction = 'none';
        } else {
            document.body.style.overflow = '';
            document.body.style.touchAction = 'manipulation';
        }
    }, [activeModal]);

    // Note: removed global 'pt-safe' here. It's now handled in the Header component 
    // to ensure the header background extends behind the status bar/notch.
    return (
        <div className={`theme-${theme} ${privacyMode ? 'privacy-mode' : ''} font-sans min-h-screen bg-gradient-to-br from-background-start to-background-end text-foreground transition-all duration-500 pb-20 lg:pb-0 ${isBlockchainTheme ? 'blockchain-bg' : ''}`}>
            <OfflineNotice />
            <Header />
            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 lg:gap-8">
                    <div className="lg:col-span-2 space-y-6 lg:space-y-8">
                        <Dashboard />
                        <TransactionList />
                    </div>
                    <div className="hidden lg:block lg:col-span-1">
                        <RightSidebar />
                    </div>
                </div>
            </main>
            
            <div className="hidden lg:flex fixed bottom-8 right-8 flex-col items-center gap-4 z-30">
                <button
                    onClick={() => { triggerHapticFeedback('medium'); dispatch({ type: 'OPEN_MODAL', payload: { type: 'SMART_SCAN' } }); }}
                    className="bg-secondary text-secondary-foreground h-14 w-14 rounded-full shadow-lg flex items-center justify-center hover:bg-card focus:outline-none transition-all transform hover:scale-110 active:scale-95"
                    title="Beleg scannen"
                >
                    <ScanLine size={28} />
                </button>
                <button
                    onClick={() => { triggerHapticFeedback('medium'); dispatch({ type: 'OPEN_MODAL', payload: { type: 'ADD_TRANSACTION' } }); }}
                    className="bg-primary text-primary-foreground h-16 w-16 rounded-full shadow-lg flex items-center justify-center hover:bg-primary/90 focus:outline-none transition-transform transform hover:scale-110 active:scale-95"
                >
                    <Plus size={32} />
                </button>
            </div>

            <MobileNavBar />
            <ModalManager />
        </div>
    );
};

const App: React.FC = () => {
    return (
        <AppProvider>
            <AppContent />
        </AppProvider>
    );
};

export default App;
