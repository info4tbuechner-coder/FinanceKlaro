
import React, { useState, useCallback, useRef, useEffect, memo, useMemo } from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import useReportsData from '../../hooks/useReportsData';
import { AppState, SyncedAppState, Transaction, Category, Goal, Project, RecurringTransaction, TransactionType, CategoryType, GoalType, Frequency, ModalType, Liability, LiabilityType } from '../../types';
import { GoogleGenAI, Type } from "@google/genai";
import { X, Camera, Sparkles, Trash2, FileDown, UploadCloud, Edit, FileText, ArrowDownCircle, ArrowUpCircle, Calendar, LogIn, LogOut, RefreshCw, AlertTriangle, CheckCircle, Copy, LoaderCircle, BarChart, LineChart, WifiOff, Search, Plus, Landmark } from 'lucide-react';
import { Sankey, Tooltip, ResponsiveContainer, Rectangle, Bar, XAxis, YAxis, Legend as RechartsLegend, CartesianGrid, ComposedChart as RechartsComposedChart } from 'recharts';
import { formatCurrency, formatDate, triggerHapticFeedback } from '../../utils';
import { calculateDebtPaydownPlan } from '../../utils/financialUtils';
import { Modal, FormGroup, Input, Select, Button } from '../ui';
import { isPast } from 'date-fns/isPast';
import { isToday } from 'date-fns/isToday';
import { differenceInDays } from 'date-fns/differenceInDays';
import { parseISO } from 'date-fns/parseISO';
import { startOfToday } from 'date-fns/startOfToday';
import { login, logout, getActor, getPrincipal } from '../../services/ic';


const TransactionModal: React.FC<{ transaction?: Transaction }> = memo(({ transaction }) => {
    const { categories, goals, liabilities, viewMode, predefinedTags, transactions: allTransactions } = useAppState();
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
    const [tagInput, setTagInput] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);

    const allKnownTags = useMemo(() => {
        const tags = new Set<string>(predefinedTags || []);
        allTransactions.forEach(tx => tx.tags?.forEach(t => tags.add(t)));
        return Array.from(tags).sort();
    }, [predefinedTags, allTransactions]);

    const tagSuggestions = useMemo(() => {
        if (!tagInput.trim()) return allKnownTags.filter(t => !(formData.tags || []).includes(t));
        const input = tagInput.toLowerCase();
        return allKnownTags.filter(t => t.includes(input) && !(formData.tags || []).includes(t));
    }, [tagInput, allKnownTags, formData.tags]);

    const addTag = useCallback((raw: string) => {
        const clean = raw.trim().toLowerCase().replace(/,/g, '');
        if (!clean || (formData.tags || []).includes(clean)) { setTagInput(''); return; }
        setFormData(prev => ({ ...prev, tags: [...(prev.tags || []), clean] }));
        setTagInput('');
        setShowSuggestions(false);
    }, [formData.tags]);

    const removeTag = useCallback((tag: string) => {
        setFormData(prev => ({ ...prev, tags: (prev.tags || []).filter(t => t !== tag) }));
    }, []);

    const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            addTag(tagInput);
        } else if (e.key === 'Backspace' && !tagInput && (formData.tags || []).length) {
            removeTag((formData.tags || [])[(formData.tags || []).length - 1]);
        }
    };

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
                    placeholder="Wofür?"
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
            {formData.type === TransactionType.SAVING && (
                <FormGroup label="Sparziel" htmlFor="goalId">
                    <Select name="goalId" id="goalId" value={formData.goalId} onChange={handleChange}>
                        <option value="">Kein Ziel</option>
                        {goals.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </Select>
                </FormGroup>
            )}
            {formData.type === TransactionType.EXPENSE && (
                <FormGroup label="Verbindlichkeit (Tilgung)" htmlFor="liabilityId">
                    <Select name="liabilityId" id="liabilityId" value={formData.liabilityId} onChange={handleChange}>
                        <option value="">Keine Verbindlichkeit</option>
                        {liabilities.filter(l => l.type === LiabilityType.DEBT).map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                    </Select>
                </FormGroup>
            )}
            {formData.type === TransactionType.INCOME && (
                <FormGroup label="Verbindlichkeit (Auszahlung)" htmlFor="liabilityId">
                    <Select name="liabilityId" id="liabilityId" value={formData.liabilityId} onChange={handleChange}>
                        <option value="">Keine Verbindlichkeit</option>
                        {liabilities.filter(l => l.type === LiabilityType.LOAN).map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                    </Select>
                </FormGroup>
            )}

            <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Tags</label>
                <div className="flex flex-wrap gap-1.5 p-2 bg-secondary/50 border border-border/50 rounded-lg min-h-[42px] focus-within:ring-2 focus-within:ring-primary/30 transition-all">
                    {(formData.tags || []).map(tag => (
                        <span key={tag} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/15 text-primary text-xs font-bold">
                            {tag}
                            <button type="button" onClick={() => removeTag(tag)} className="hover:text-destructive transition-colors ml-0.5">
                                <X size={10} />
                            </button>
                        </span>
                    ))}
                    <input
                        type="text"
                        value={tagInput}
                        onChange={e => { setTagInput(e.target.value); setShowSuggestions(true); }}
                        onKeyDown={handleTagKeyDown}
                        onFocus={() => setShowSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                        placeholder={(formData.tags || []).length === 0 ? 'Tag eingeben + Enter…' : ''}
                        className="flex-1 min-w-[100px] bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
                    />
                </div>
                {showSuggestions && tagSuggestions.length > 0 && (
                    <div className="mt-1 p-1.5 glass-card rounded-xl border border-border/20 shadow-lg max-h-36 overflow-y-auto z-10 flex flex-wrap gap-1">
                        {tagSuggestions.slice(0, 12).map(tag => (
                            <button
                                key={tag}
                                type="button"
                                onMouseDown={() => addTag(tag)}
                                className="px-2 py-1 rounded-full bg-secondary hover:bg-primary/10 hover:text-primary text-xs font-medium transition-colors"
                            >
                                {tag}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" onClick={() => dispatch({type: 'CLOSE_MODAL'})} className="flex-1">Abbrechen</Button>
                <Button type="submit" variant="primary" className="flex-1">Speichern</Button>
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

    const [newName, setNewName] = useState('');
    const [newType, setNewType] = useState<CategoryType>(CategoryType.EXPENSE);
    const [newBudget, setNewBudget] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [editBudget, setEditBudget] = useState('');

    const usageCount = useMemo(() => transactions.reduce((acc, t) => {
        if (t.categoryId) acc.set(t.categoryId, (acc.get(t.categoryId) || 0) + 1);
        return acc;
    }, new Map<string, number>()), [transactions]);

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName.trim()) return;
        triggerHapticFeedback('light');
        dispatch({ type: 'ADD_CATEGORY', payload: {
            name: newName.trim(),
            type: newType,
            ...(newType === CategoryType.EXPENSE && newBudget ? { budget: parseFloat(newBudget) } : {}),
        }});
        setNewName('');
        setNewBudget('');
    };

    const startEdit = (c: Category) => {
        setEditingId(c.id);
        setEditName(c.name);
        setEditBudget(c.budget?.toString() || '');
    };

    const saveEdit = (c: Category) => {
        if (!editName.trim()) return;
        triggerHapticFeedback('light');
        dispatch({ type: 'UPDATE_CATEGORY', payload: {
            ...c,
            name: editName.trim(),
            budget: editBudget ? parseFloat(editBudget) : undefined,
        }});
        setEditingId(null);
    };

    const handleDelete = (c: Category) => {
        if (window.confirm(`Möchten Sie "${c.name}" wirklich löschen?`)) {
            triggerHapticFeedback('heavy');
            dispatch({ type: 'DELETE_CATEGORY', payload: c.id });
        }
    };

    const renderRow = (c: Category) => {
        if (editingId === c.id) {
            return (
                <div key={c.id} className="flex items-center gap-2 p-2 rounded-xl bg-primary/10 border border-primary/20">
                    <Input
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && saveEdit(c)}
                        className="flex-1 border-none bg-transparent shadow-none h-8 text-sm"
                        placeholder="Name..."
                        autoFocus
                    />
                    {c.type === CategoryType.EXPENSE && (
                        <Input
                            type="number"
                            value={editBudget}
                            onChange={e => setEditBudget(e.target.value)}
                            className="w-28 border-none bg-transparent shadow-none h-8 text-sm"
                            placeholder="Budget €"
                            step="0.01"
                        />
                    )}
                    <button type="button" onClick={() => saveEdit(c)} className="p-1.5 text-success hover:text-success/80 transition-colors flex-shrink-0" title="Speichern">
                        <CheckCircle size={16} />
                    </button>
                    <button type="button" onClick={() => setEditingId(null)} className="p-1.5 text-muted-foreground hover:text-foreground transition-colors flex-shrink-0" title="Abbrechen">
                        <X size={16} />
                    </button>
                </div>
            );
        }
        return (
            <div key={c.id} className="group flex items-center justify-between p-3 rounded-xl hover:bg-secondary/50 transition-colors">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="font-medium truncate">{c.name}</span>
                    {c.budget && (
                        <span className="text-xs text-muted-foreground whitespace-nowrap">{formatCurrency(c.budget)}</span>
                    )}
                </div>
                <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                    {(usageCount.get(c.id) || 0) > 0 && (
                        <span className="text-[10px] text-muted-foreground px-1.5 py-0.5 bg-secondary rounded-full mr-1">{usageCount.get(c.id)}x</span>
                    )}
                    <button onClick={() => startEdit(c)} className="p-1.5 text-muted-foreground hover:text-primary transition-colors opacity-0 group-hover:opacity-100" title="Bearbeiten">
                        <Edit size={14} />
                    </button>
                    <button onClick={() => handleDelete(c)} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100" title="Löschen">
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>
        );
    };

    const expenseCategories = categories.filter(c => c.type === 'expense');
    const incomeCategories = categories.filter(c => c.type === 'income');

    return (
        <div className="space-y-6">
            <form onSubmit={handleAdd} className="p-3 bg-secondary/30 rounded-2xl border border-border/20 space-y-3">
                <div className="flex items-center gap-2">
                    <Input
                        value={newName}
                        onChange={e => setNewName(e.target.value)}
                        placeholder="Neue Kategorie..."
                        className="flex-1 border-none bg-transparent shadow-none"
                    />
                    <div className="flex rounded-lg overflow-hidden border border-border/30 flex-shrink-0">
                        <button
                            type="button"
                            onClick={() => setNewType(CategoryType.EXPENSE)}
                            className={`px-3 py-1.5 text-xs font-bold transition-colors ${newType === CategoryType.EXPENSE ? 'bg-destructive/70 text-white' : 'text-muted-foreground hover:bg-secondary'}`}
                        >
                            Ausgabe
                        </button>
                        <button
                            type="button"
                            onClick={() => setNewType(CategoryType.INCOME)}
                            className={`px-3 py-1.5 text-xs font-bold transition-colors ${newType === CategoryType.INCOME ? 'bg-success/70 text-white' : 'text-muted-foreground hover:bg-secondary'}`}
                        >
                            Einnahme
                        </button>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {newType === CategoryType.EXPENSE && (
                        <Input
                            type="number"
                            value={newBudget}
                            onChange={e => setNewBudget(e.target.value)}
                            placeholder="Monats-Budget € (optional)"
                            step="0.01"
                            className="flex-1 border-none bg-transparent shadow-none"
                        />
                    )}
                    <Button type="submit" variant="primary" className="ml-auto px-5">
                        <Plus size={16} className="mr-1" /> Hinzufügen
                    </Button>
                </div>
            </form>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <h4 className="font-bold text-xs uppercase tracking-widest text-muted-foreground mb-3">
                        Ausgaben ({expenseCategories.length})
                    </h4>
                    <div className="space-y-1">
                        {expenseCategories.map(renderRow)}
                        {expenseCategories.length === 0 && (
                            <p className="text-xs text-muted-foreground text-center py-6 opacity-60">Keine Kategorien</p>
                        )}
                    </div>
                </div>
                <div>
                    <h4 className="font-bold text-xs uppercase tracking-widest text-muted-foreground mb-3">
                        Einnahmen ({incomeCategories.length})
                    </h4>
                    <div className="space-y-1">
                        {incomeCategories.map(renderRow)}
                        {incomeCategories.length === 0 && (
                            <p className="text-xs text-muted-foreground text-center py-6 opacity-60">Keine Kategorien</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
});

const TagManagerModal: React.FC = memo(() => {
    const { predefinedTags, transactions } = useAppState();
    const dispatch = useAppDispatch();
    const [newTag, setNewTag] = useState('');

    const usageCount = useMemo(() => {
        const counts = new Map<string, number>();
        transactions.forEach(t => t.tags?.forEach(tag => counts.set(tag, (counts.get(tag) || 0) + 1)));
        return counts;
    }, [transactions]);

    const allTags = useMemo(() => {
        const tags = new Set<string>(predefinedTags || []);
        transactions.forEach(t => t.tags?.forEach(tag => tags.add(tag)));
        return Array.from(tags).sort();
    }, [predefinedTags, transactions]);

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        const clean = newTag.trim().toLowerCase();
        if (!clean) return;
        triggerHapticFeedback('light');
        dispatch({ type: 'ADD_PREDEFINED_TAG', payload: clean });
        setNewTag('');
    };

    const handleDelete = (tag: string) => {
        triggerHapticFeedback('light');
        dispatch({ type: 'DELETE_PREDEFINED_TAG', payload: tag });
    };

    const isPredefined = (tag: string) => (predefinedTags || []).includes(tag);

    return (
        <div className="space-y-5">
            <form onSubmit={handleAdd} className="flex items-center gap-2 p-1.5 bg-secondary/30 rounded-2xl border border-border/20">
                <Input
                    value={newTag}
                    onChange={e => setNewTag(e.target.value)}
                    placeholder="Neuen Tag erstellen..."
                    className="border-none bg-transparent shadow-none"
                />
                <Button type="submit" variant="primary" className="h-10 px-4 rounded-xl flex-shrink-0">
                    <Plus size={16} className="mr-1" /> Hinzufügen
                </Button>
            </form>
            <p className="text-xs text-muted-foreground">
                Tags werden automatisch aus Transaktionen übernommen. Eigene Tags können hier als Vorlage gespeichert und gelöscht werden.
            </p>
            {allTags.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm opacity-60">
                    Noch keine Tags vorhanden.
                </div>
            ) : (
                <div className="flex flex-wrap gap-2">
                    {allTags.map(tag => (
                        <div
                            key={tag}
                            className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-colors ${isPredefined(tag) ? 'bg-primary/10 border-primary/20' : 'bg-secondary/50 border-border/30'}`}
                        >
                            <span className={`text-sm font-bold ${isPredefined(tag) ? 'text-primary' : 'text-foreground'}`}>{tag}</span>
                            {(usageCount.get(tag) || 0) > 0 && (
                                <span className="text-[10px] text-muted-foreground bg-secondary/80 rounded-full px-1.5 py-0.5">{usageCount.get(tag)}x</span>
                            )}
                            {isPredefined(tag) && (
                                <button
                                    onClick={() => handleDelete(tag)}
                                    className="text-muted-foreground hover:text-destructive transition-colors ml-0.5 opacity-0 group-hover:opacity-100"
                                    title="Aus Vorlagen entfernen"
                                >
                                    <X size={12} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
});

const LiabilityManagerModal: React.FC = memo(() => {
    const { liabilities } = useAppState();
    const dispatch = useAppDispatch();
    const [searchTerm, setSearchTerm] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    
    const [formData, setFormData] = useState<Omit<Liability, 'id' | 'paidAmount'>>({
        name: '',
        type: LiabilityType.DEBT,
        initialAmount: 0,
        interestRate: 0,
        minMonthlyPayment: 0
    });

    const filteredLiabilities = useMemo(() => {
        return liabilities.filter(l => l.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [liabilities, searchTerm]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'initialAmount' || name === 'interestRate' || name === 'minMonthlyPayment' ? parseFloat(value) : value
        }));
    };

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        triggerHapticFeedback('success');
        dispatch({ type: 'ADD_LIABILITY', payload: formData });
        setIsAdding(false);
        setFormData({ name: '', type: LiabilityType.DEBT, initialAmount: 0, interestRate: 0, minMonthlyPayment: 0 });
    };

    const handleDelete = (id: string) => {
        if (window.confirm("Möchten Sie diese Verbindlichkeit wirklich löschen?")) {
            triggerHapticFeedback('heavy');
            dispatch({ type: 'DELETE_LIABILITY', payload: id });
        }
    };

    return (
        <div className="space-y-6">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="Suchen..." 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                    className="pl-10"
                />
            </div>

            <div className="space-y-3">
                <div className="flex justify-between items-center px-1">
                    <h4 className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Liste ({filteredLiabilities.length})</h4>
                    <button 
                        onClick={() => setIsAdding(!isAdding)} 
                        className="text-primary hover:text-primary/80 transition-colors p-1"
                    >
                        {isAdding ? <X size={20} /> : <Plus size={20} />}
                    </button>
                </div>

                {isAdding && (
                    <form onSubmit={handleAdd} className="p-4 bg-primary/5 rounded-2xl border border-primary/20 space-y-4 animate-fade-in">
                        <FormGroup label="Name" htmlFor="l-name">
                            <Input id="l-name" name="name" value={formData.name} onChange={handleChange} required placeholder="Kredit, Darlehen..." />
                        </FormGroup>
                        <div className="grid grid-cols-2 gap-4">
                            <FormGroup label="Betrag" htmlFor="l-amount">
                                <Input id="l-amount" name="initialAmount" type="number" step="0.01" value={formData.initialAmount} onChange={handleChange} required />
                            </FormGroup>
                            <FormGroup label="Zinssatz (%)" htmlFor="l-interest">
                                <Input id="l-interest" name="interestRate" type="number" step="0.1" value={formData.interestRate} onChange={handleChange} required />
                            </FormGroup>
                        </div>
                        <FormGroup label="Min. Rate" htmlFor="l-min">
                            <Input id="l-min" name="minMonthlyPayment" type="number" step="0.01" value={formData.minMonthlyPayment} onChange={handleChange} required />
                        </FormGroup>
                        <Button type="submit" variant="primary" className="w-full">Erstellen</Button>
                    </form>
                )}

                <div className="space-y-2">
                    {filteredLiabilities.length > 0 ? filteredLiabilities.map(l => (
                        <div key={l.id} className="glass-card p-4 rounded-xl flex items-center justify-between group">
                            <div>
                                <h5 className="font-bold text-foreground flex items-center gap-2">
                                    <Landmark size={14} className="text-muted-foreground" /> {l.name}
                                </h5>
                                <div className="text-xs text-muted-foreground mt-1 flex gap-3">
                                    <span>Zinsen: {l.interestRate}%</span>
                                    <span>Rate: {formatCurrency(l.minMonthlyPayment)}</span>
                                </div>
                            </div>
                            <div className="text-right flex items-center gap-4">
                                <div>
                                    <p className="text-sm font-bold text-foreground">{formatCurrency(l.initialAmount - l.paidAmount)}</p>
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Restschuld</p>
                                </div>
                                <button onClick={() => handleDelete(l.id)} className="p-2 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    )) : (
                        <div className="text-center py-10 text-muted-foreground">Keine Verbindlichkeiten gefunden.</div>
                    )}
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
                <div className="p-4 bg-secondary/10 rounded-3xl border border-border/20">
                    <ResponsiveContainer width="100%" height={450} debounce={1}>
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
            case 'MANAGE_TAGS': return { title: "Tags verwalten", content: <TagManagerModal />, size: 'md' as const };
            case 'MANAGE_LIABILITIES': return { title: "Verbindlichkeiten", content: <LiabilityManagerModal />, size: 'lg' as const };
            case 'ANALYSIS': return { title: "Cashflow Analyse", content: <AnalysisModal />, size: 'xl' as const };
            default: return { title: "Information", content: <div className="p-10 text-center text-muted-foreground">In Kürze verfügbar...</div>, size: 'md' as const };
        }
    };
    
    const modalProps = renderModalContent();
    if (!modalProps) return null;

    return <Modal title={modalProps.title} onClose={closeModal} size={modalProps.size}>{modalProps.content}</Modal>;
};

export default ModalManager;
