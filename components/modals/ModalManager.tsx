
import React, { useState, useCallback, useRef, useEffect, memo, useMemo } from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import useReportsData from '../../hooks/useReportsData';
import { AppState, SyncedAppState, Transaction, Category, Goal, Project, RecurringTransaction, TransactionType, CategoryType, GoalType, Frequency, ModalType, Liability, LiabilityType } from '../../types';
import { GoogleGenAI, Type } from "@google/genai";
import { X, Camera, Sparkles, Trash2, FileDown, UploadCloud, Edit, FileText, ArrowDownCircle, ArrowUpCircle, Calendar, LogIn, LogOut, RefreshCw, AlertTriangle, CheckCircle, Copy, LoaderCircle, BarChart, LineChart, WifiOff } from 'lucide-react';
import { Sankey, Tooltip, ResponsiveContainer, Rectangle, Bar, XAxis, YAxis, Legend as RechartsLegend, CartesianGrid, ComposedChart as RechartsComposedChart } from 'recharts';
import { formatCurrency, formatDate, triggerHapticFeedback } from '../../utils';
import { calculateDebtPaydownPlan } from '../../utils/financialUtils';
import { Modal, FormGroup, Input, Select, Button } from '../ui';
import isPast from 'date-fns/isPast';
import isToday from 'date-fns/isToday';
import differenceInDays from 'date-fns/differenceInDays';
import parseISO from 'date-fns/parseISO';
import startOfToday from 'date-fns/startOfToday';
import { login, logout, getActor, getPrincipal } from '../../services/ic';


const TransactionModal: React.FC<{ transaction?: Transaction }> = memo(({ transaction }) => {
    const { categories, goals, liabilities, viewMode } = useAppState();
    const dispatch = useAppDispatch();

    const getInitialFormData = useCallback(() => {
        if (transaction) return { ...transaction, categoryId: transaction.categoryId || '', goalId: transaction.goalId || '', liabilityId: transaction.liabilityId || '', tags: transaction.tags || [] };
        return {
            type: TransactionType.EXPENSE, amount: 0, description: '',
            date: new Date().toISOString().split('T')[0], categoryId: '', goalId: '', liabilityId: '',
            tags: viewMode === 'private' ? ['privat'] : viewMode === 'business' ? ['business'] : [],
        };
    }, [transaction, viewMode]);

    const [formData, setFormData] = useState<Omit<Transaction, 'id'>>(getInitialFormData());

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'amount' ? parseFloat(value) : value }));
    }, []);
    
    const handleSubmit = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        triggerHapticFeedback('success');
        if(transaction) {
            dispatch({ type: 'UPDATE_TRANSACTION', payload: { ...formData, id: transaction.id } });
        } else {
            dispatch({ type: 'ADD_TRANSACTION', payload: formData });
        }
    }, [dispatch, formData, transaction]);

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <FormGroup label="Beschreibung" htmlFor="description">
                <Input 
                    type="text" 
                    id="description" 
                    name="description" 
                    value={formData.description} 
                    onChange={handleChange} 
                    required 
                    autoFocus
                />
            </FormGroup>
            <div className="grid grid-cols-2 gap-4">
                <FormGroup label="Betrag" htmlFor="amount">
                    <Input 
                        type="number" 
                        id="amount" 
                        name="amount" 
                        value={formData.amount} 
                        onChange={handleChange} 
                        required 
                        step="0.01" 
                        inputMode="decimal" 
                    />
                </FormGroup>
                <FormGroup label="Datum" htmlFor="date">
                    <Input type="date" id="date" name="date" value={formData.date} onChange={handleChange} required />
                </FormGroup>
            </div>
             <FormGroup label="Typ" htmlFor="type">
                <Select name="type" id="type" value={formData.type} onChange={handleChange}>
                    <option value={TransactionType.EXPENSE}>Ausgabe</option>
                    <option value={TransactionType.INCOME}>Einnahme</option>
                    <option value={TransactionType.SAVING}>Sparen</option>
                </Select>
            </FormGroup>
            <FormGroup label="Kategorie" htmlFor="categoryId">
                <Select name="categoryId" id="categoryId" value={formData.categoryId} onChange={handleChange}>
                    <option value="">Keine Kategorie</option>
                    {categories.filter(c => c.type === (formData.type === 'income' ? 'income' : 'expense')).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </Select>
            </FormGroup>
            <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" onClick={() => dispatch({type: 'CLOSE_MODAL'})}>Abbrechen</Button>
                <Button type="submit" variant="primary">Speichern</Button>
            </div>
        </form>
    );
});

const SmartScanModal: React.FC = memo(() => {
    const dispatch = useAppDispatch();
    const videoRef = useRef<HTMLVideoElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isOffline, setIsOffline] = useState(!navigator.onLine);

    useEffect(() => {
        const handleStatus = () => setIsOffline(!navigator.onLine);
        window.addEventListener('online', handleStatus);
        window.addEventListener('offline', handleStatus);
        return () => {
            window.removeEventListener('online', handleStatus);
            window.removeEventListener('offline', handleStatus);
        };
    }, []);

    const startCamera = useCallback(async () => {
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                setError("Kamera wird von diesem Browser nicht unterstützt.");
                return;
            }
            const mediaStream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    facingMode: 'environment',
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                } 
            });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (err) {
            console.error("Camera Error:", err);
            setError("Kamerazugriff verweigert.");
        }
    }, []);

    useEffect(() => {
        startCamera();
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [startCamera]);

    const handleScan = useCallback(async () => {
        if (!videoRef.current) return;
        if (isOffline) {
            triggerHapticFeedback('error');
            setError("KI-Scan erfordert eine Internetverbindung.");
            return;
        }
        
        triggerHapticFeedback('medium');
        setIsLoading(true);
        setError(null);
        
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            setIsLoading(false);
            return;
        }
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const base64Data = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];

        try {
            const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
            const response = await ai.models.generateContent({
                model: "gemini-3-flash-preview",
                contents: [{
                    parts: [
                        { text: "Analysiere diesen Kassenbeleg. Extrahiere den Händlernamen als 'description', den Bruttobetrag als 'amount' (Zahl) und das Datum als 'date' (YYYY-MM-DD). Antworte strikt im JSON Format." },
                        { inlineData: { mimeType: 'image/jpeg', data: base64Data } }
                    ]
                }],
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            description: { type: Type.STRING },
                            amount: { type: Type.NUMBER },
                            date: { type: Type.STRING },
                        },
                        required: ["description", "amount", "date"]
                    },
                },
            });
            
            const result = JSON.parse(response.text);
            triggerHapticFeedback('success');
            
            dispatch({ type: 'ADD_TRANSACTION', payload: {
                description: result.description || 'Beleg-Scan',
                amount: result.amount || 0,
                date: result.date || new Date().toISOString().split('T')[0],
                type: TransactionType.EXPENSE,
                tags: ['ki-scan']
            }});
        } catch (e) {
            triggerHapticFeedback('error');
            setError("Beleg konnte nicht präzise gelesen werden. Bitte manuell erfassen.");
        } finally {
            setIsLoading(false);
        }
    }, [dispatch, isOffline]);

    return (
        <div className="space-y-4">
            {error && (
                <div className="p-3 bg-destructive/10 text-destructive text-xs font-medium rounded-xl border border-destructive/20 animate-fade-in flex items-center">
                    <AlertTriangle className="mr-2 h-4 w-4" /> {error}
                </div>
            )}
            {isOffline && (
                <div className="p-3 bg-warning/10 text-warning text-xs font-medium rounded-xl border border-warning/20 flex items-center">
                    <WifiOff className="mr-2 h-4 w-4" /> Du bist offline. KI-Features sind deaktiviert.
                </div>
            )}
            <div className="relative aspect-[3/4] bg-black rounded-3xl overflow-hidden shadow-2xl border border-border/20">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                
                {/* Visual Guides */}
                <div className="absolute inset-0 pointer-events-none border-[30px] border-black/40"></div>
                <div className="absolute inset-x-[30px] inset-y-[30px] border-2 border-primary/40 rounded-2xl shadow-[0_0_0_1000px_rgba(0,0,0,0.2)]"></div>
                
                {/* Animated Scan Line */}
                {!isLoading && !isOffline && (
                    <div className="absolute inset-x-[30px] h-0.5 bg-primary/60 shadow-[0_0_15px_hsl(var(--primary))] animate-scan-line z-10"></div>
                )}
                
                {isLoading && (
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center animate-fade-in z-20">
                        <div className="relative mb-6">
                            <div className="absolute inset-0 animate-ping rounded-full bg-primary/30"></div>
                            <div className="relative bg-primary/20 p-5 rounded-full">
                                <Sparkles className="h-10 w-10 text-primary animate-pulse" />
                            </div>
                        </div>
                        <p className="font-bold text-white text-lg">KI wird schlau...</p>
                        <p className="text-white/60 text-sm mt-1">Beleg wird analysiert</p>
                    </div>
                )}
            </div>
            
            <div className="flex flex-col items-center gap-3">
                <Button 
                    onClick={handleScan} 
                    disabled={isLoading || !stream || isOffline} 
                    variant="primary" 
                    className="w-full py-6 rounded-2xl text-lg shadow-xl"
                >
                    <Camera className="mr-3 h-6 w-6" /> {isOffline ? 'Offline' : 'Jetzt scannen'}
                </Button>
                <p className="text-[11px] text-muted-foreground uppercase font-bold tracking-widest">Gute Beleuchtung verbessert die Genauigkeit</p>
            </div>
        </div>
    );
});

const CategoryManagerModal: React.FC = memo(() => {
    const { categories, transactions } = useAppState();
    const dispatch = useAppDispatch();
    const [newCategoryName, setNewCategoryName] = useState('');

    const usageCount = useMemo(() => transactions.reduce((acc, t) => { if(t.categoryId) acc.set(t.categoryId, (acc.get(t.categoryId) || 0) + 1); return acc; }, new Map<string, number>()), [transactions]);

    const handleDelete = useCallback((c: Category) => {
        if (window.confirm(`Möchten Sie "${c.name}" wirklich löschen?`)) {
            triggerHapticFeedback('heavy');
            dispatch({ type: 'DELETE_CATEGORY', payload: c.id });
        }
    }, [dispatch]);
    
    const handleAdd = (e: React.FormEvent, type: CategoryType) => {
        e.preventDefault();
        if (newCategoryName.trim()) {
            triggerHapticFeedback('light');
            dispatch({ type: 'ADD_CATEGORY', payload: { name: newCategoryName.trim(), type } });
            setNewCategoryName('');
        }
    };

    return (
        <div className="space-y-6">
            <form className="flex items-center gap-2 p-1.5 bg-secondary/30 rounded-2xl border border-border/20">
                <Input value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="Neue Kategorie..." className="border-none bg-transparent shadow-none" />
                <Button onClick={(e) => handleAdd(e, CategoryType.EXPENSE)} variant="primary" className="h-10 w-10 p-0 rounded-xl">+</Button>
            </form>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <h4 className="font-bold text-xs uppercase tracking-widest text-muted-foreground mb-4">Ausgaben</h4>
                    <div className="space-y-1">
                        {categories.filter(c=>c.type === 'expense').map(c => (
                            <div key={c.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-secondary/50 transition-colors">
                                <span className="font-medium">{c.name}</span>
                                <button onClick={() => handleDelete(c)} className="text-muted-foreground hover:text-destructive transition-colors"><Trash2 size={16} /></button>
                            </div>
                        ))}
                    </div>
                </div>
                <div>
                    <h4 className="font-bold text-xs uppercase tracking-widest text-muted-foreground mb-4">Einnahmen</h4>
                    <div className="space-y-1">
                        {categories.filter(c=>c.type === 'income').map(c => (
                             <div key={c.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-secondary/50 transition-colors">
                                <span className="font-medium">{c.name}</span>
                                <button onClick={() => handleDelete(c)} className="text-muted-foreground hover:text-destructive transition-colors"><Trash2 size={16} /></button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
});

const AnalysisModal: React.FC = () => {
    const { sankeyData } = useReportsData();
    return (
        <div className="space-y-6">
            <div className="text-center">
                <h4 className="font-bold text-xl">Cashflow Visualisierung</h4>
                <p className="text-sm text-muted-foreground mt-1">Woher kommt mein Geld und wohin fließt es?</p>
            </div>
             {sankeyData.links.length > 0 ? (
                <div style={{ width: '100%', height: 450 }} className="p-4 bg-secondary/10 rounded-3xl border border-border/20">
                    <ResponsiveContainer>
                        <Sankey 
                            data={sankeyData} 
                            nodePadding={50} 
                            margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                        >
                            <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                        </Sankey>
                    </ResponsiveContainer>
                </div>
            ) : (
                <div className="text-center py-20 text-muted-foreground bg-secondary/10 rounded-3xl border border-dashed border-border/40">
                    <BarChart className="mx-auto h-12 w-12 opacity-20 mb-4" />
                    Keine ausreichenden Daten für Analyse verfügbar.
                </div>
            )}
        </div>
    );
};

const ModalManager: React.FC = () => {
    const { activeModal } = useAppState();
    const dispatch = useAppDispatch();
    const closeModal = useCallback(() => dispatch({ type: 'CLOSE_MODAL' }), [dispatch]);

    if (!activeModal) return null;

    const renderModalContent = () => {
        switch (activeModal.type) {
            case 'ADD_TRANSACTION': return { title: "Neuer Eintrag", content: <TransactionModal />, size: 'md' as const };
            case 'EDIT_TRANSACTION': return { title: "Eintrag bearbeiten", content: <TransactionModal transaction={activeModal.data} />, size: 'md' as const };
            case 'SMART_SCAN': return { title: "KI Beleg-Scan", content: <SmartScanModal />, size: 'lg' as const };
            case 'MANAGE_CATEGORIES': return { title: "Kategorien", content: <CategoryManagerModal />, size: 'lg' as const };
            case 'ANALYSIS': return { title: "Cashflow Analyse", content: <AnalysisModal />, size: 'xl' as const };
            default: return { title: "Information", content: <div className="p-10 text-center text-muted-foreground">In Kürze verfügbar...</div>, size: 'md' as const };
        }
    };
    
    const modalProps = renderModalContent();
    if (!modalProps) return null;

    return <Modal title={modalProps.title} onClose={closeModal} size={modalProps.size}>{modalProps.content}</Modal>;
};

export default ModalManager;
