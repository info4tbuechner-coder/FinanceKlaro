
import React, { useState, memo, useEffect } from 'react';
import { useAppState, useAppDispatch, useUpcomingBills } from '../context/AppContext';
import { Sun, Moon, BarChart2, Settings, Menu, X, Bot, Palette, FileDown, UploadCloud, Repeat, Gem, LoaderCircle, Bell, Eye, EyeOff, Smartphone } from 'lucide-react';
import type { Theme, ViewMode, ModalType, ICStatus } from '../types';
import { triggerHapticFeedback } from '../utils';
import { Button } from './ui';

const THEMES: { name: Theme; icon: React.ReactNode }[] = [
  { name: 'grandeur', icon: <Sun className="h-5 w-5" /> },
  { name: 'synthwave', icon: <Moon className="h-5 w-5" /> },
  { name: 'blockchain', icon: <Gem className="h-5 w-5" /> },
  { name: 'neon', icon: <Bot className="h-5 w-5" /> },
  { name: 'forest', icon: <Palette className="h-5 w-5" /> },
];

const baseButtonClass = "px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200";
const activeButtonClass = "bg-primary text-primary-foreground";
const inactiveButtonClass = "text-muted-foreground hover:bg-secondary hover:text-secondary-foreground";

const ControlGroupContainer: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
    <div className={`flex items-center p-1 rounded-xl bg-secondary ${className || ''}`}>
        {children}
    </div>
);

const ViewSwitcher = memo(({ viewMode, setViewMode }: { viewMode: ViewMode, setViewMode: (mode: ViewMode) => void }) => (
    <ControlGroupContainer className="space-x-1">
        <button onClick={() => setViewMode('all')} className={`${baseButtonClass} ${viewMode === 'all' ? activeButtonClass : inactiveButtonClass}`}>Alle</button>
        <button onClick={() => setViewMode('private')} className={`${baseButtonClass} ${viewMode === 'private' ? activeButtonClass : inactiveButtonClass}`}>Privat</button>
        <button onClick={() => setViewMode('business')} className={`${baseButtonClass} ${viewMode === 'business' ? activeButtonClass : inactiveButtonClass}`}>Business</button>
    </ControlGroupContainer>
));

const NotificationBell = memo(() => {
    const { dueOrOverdueCount } = useUpcomingBills();
    const dispatch = useAppDispatch();

    const handleBellClick = () => {
        triggerHapticFeedback('light');
        dispatch({ type: 'SET_ACTIVE_SIDEBAR_TAB', payload: 'Rechnungen' });
    };

    return (
        <button onClick={handleBellClick} className="relative p-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-secondary">
            <Bell className="h-5 w-5" />
            {dueOrOverdueCount > 0 && (
                <span className="absolute top-1 right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-destructive text-white text-[9px] items-center justify-center">{dueOrOverdueCount}</span>
                </span>
            )}
        </button>
    );
});

const Header: React.FC = () => {
    const { theme, viewMode, icStatus, privacyMode } = useAppState();
    const dispatch = useAppDispatch();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

    useEffect(() => {
        const handler = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };
        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const setTheme = (newTheme: Theme) => {
        triggerHapticFeedback('light');
        dispatch({ type: 'SET_THEME', payload: newTheme });
    };
    const setViewMode = (newMode: ViewMode) => {
        triggerHapticFeedback('light');
        dispatch({ type: 'SET_VIEW_MODE', payload: newMode });
    };
    const openModal = (modal: ModalType) => {
        triggerHapticFeedback('medium');
        dispatch({ type: 'OPEN_MODAL', payload: modal });
    };
    const togglePrivacy = () => {
        triggerHapticFeedback('medium');
        dispatch({ type: 'TOGGLE_PRIVACY_MODE' });
    };

    const handleInstall = async () => {
        triggerHapticFeedback('heavy');
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') setDeferredPrompt(null);
        } else {
            alert("Klaro ist bereits installiert oder wird direkt über Ihren Browser verwaltet.");
        }
    };

    const toggleDropdown = () => {
        triggerHapticFeedback('light');
        setIsDropdownOpen(!isDropdownOpen);
    };

    const toggleMenu = () => {
        triggerHapticFeedback('light');
        setIsMenuOpen(!isMenuOpen);
    };

    return (
        <header className="sticky top-0 z-40 w-full glass-card border-b border-border/10">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center gap-4">
                        <span className={`text-2xl font-bold tracking-tighter ${theme === 'synthwave' || theme === 'blockchain' ? 'text-primary' : ''}`}>Klaro</span>
                        <button 
                            onClick={togglePrivacy} 
                            className={`p-2 rounded-full transition-all ${privacyMode ? 'bg-primary/20 text-primary shadow-inner' : 'text-muted-foreground hover:bg-secondary'}`}
                            title={privacyMode ? "Privacy aus" : "Privacy an"}
                        >
                            {privacyMode ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>
                    
                    <div className="hidden md:flex items-center space-x-4">
                        <ViewSwitcher viewMode={viewMode} setViewMode={setViewMode} />
                        <div className="flex items-center space-x-2">
                            <NotificationBell />
                            <div className="relative">
                                <button
                                    onClick={toggleDropdown}
                                    className={`${baseButtonClass} ${inactiveButtonClass} flex items-center`}
                                >
                                    <Settings className="mr-2 h-4 w-4" /> Verwaltung
                                </button>
                                {isDropdownOpen && (
                                    <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg py-1 glass-card ring-1 ring-black ring-opacity-5 z-20 animate-fade-in">
                                        <button onClick={() => { openModal({type: 'MANAGE_CATEGORIES'}); setIsDropdownOpen(false); }} className="w-full text-left block px-4 py-3 text-sm text-foreground hover:bg-secondary">Kategorien</button>
                                        <button onClick={() => { openModal({type: 'MANAGE_RECURRING'}); setIsDropdownOpen(false);}} className="w-full text-left block px-4 py-3 text-sm text-foreground hover:bg-secondary">Daueraufträge</button>
                                        <div className="border-t border-border my-1"></div>
                                        {deferredPrompt && (
                                            <button onClick={() => { handleInstall(); setIsDropdownOpen(false); }} className="w-full text-left flex items-center px-4 py-3 text-sm text-primary font-bold hover:bg-secondary">
                                                <Smartphone className="mr-2 h-4 w-4" /> App installieren
                                            </button>
                                        )}
                                        <button onClick={() => { openModal({type: 'EXPORT_IMPORT_DATA'}); setIsDropdownOpen(false);}} className="w-full text-left flex items-center px-4 py-3 text-sm text-foreground hover:bg-secondary"><UploadCloud className="mr-2 h-4 w-4" /> Export / Import</button>
                                    </div>
                                )}
                            </div>
                            <ControlGroupContainer>
                                {THEMES.map(t => (
                                    <button
                                        key={t.name}
                                        onClick={() => setTheme(t.name)}
                                        className={`p-2 rounded-full transition-all ${theme === t.name ? 'bg-primary text-primary-foreground shadow-lg' : 'text-muted-foreground hover:text-foreground'}`}
                                    >
                                        {t.icon}
                                    </button>
                                ))}
                            </ControlGroupContainer>
                        </div>
                    </div>
                    
                    <div className="md:hidden flex items-center gap-2">
                        <NotificationBell />
                        <button onClick={toggleMenu} className="p-2 rounded-md text-foreground hover:bg-secondary">
                            {isMenuOpen ? <X /> : <Menu />}
                        </button>
                    </div>
                </div>
            </div>
            {isMenuOpen && (
                <div className="md:hidden glass-card p-4 space-y-4 animate-fade-in border-t border-border/10">
                    <ViewSwitcher viewMode={viewMode} setViewMode={setViewMode} />
                    <div className="grid grid-cols-2 gap-2">
                        <Button onClick={() => { setIsMenuOpen(false); openModal({type: 'ANALYSIS'}); }} className="text-sm py-2">Analyse</Button>
                        <Button onClick={() => { setIsMenuOpen(false); openModal({type: 'SMART_SCAN'}); }} className="text-sm py-2">Scanner</Button>
                    </div>
                    <div className="flex justify-center gap-4 py-2">
                        {THEMES.map(t => (
                            <button key={t.name} onClick={() => setTheme(t.name)} className={`p-3 rounded-full ${theme === t.name ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}>
                                {t.icon}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </header>
    );
};

export default Header;
