import React, { useState, useCallback, useMemo, memo } from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { Transaction, TransactionType, LiabilityType, CategoryType } from '../../types';
import { X, Plus, Check } from 'lucide-react';
import { formatCurrency, triggerHapticFeedback } from '../../utils';
import { FormGroup, Input, Select, Button } from '../ui';

const QUICK_COLORS = ['#ef4444','#f97316','#f59e0b','#22c55e','#3b82f6','#6366f1','#8b5cf6','#ec4899'];
const QUICK_EMOJIS = ['🏠','🛒','🚗','🍕','💊','🎮','💰','💼','📈','🏦','💻','✈️','🎵','👔','📚','🐾'];

const CategoryPicker: React.FC<{
    categoryId: string;
    type: TransactionType;
    onChange: (id: string) => void;
}> = memo(({ categoryId, type, onChange }) => {
    const { categories } = useAppState();
    const dispatch = useAppDispatch();
    const [showQuickAdd, setShowQuickAdd] = useState(false);
    const [quickName, setQuickName] = useState('');
    const [quickIcon, setQuickIcon] = useState('📦');
    const [quickColor, setQuickColor] = useState('#6366f1');
    const [showEmojiGrid, setShowEmojiGrid] = useState(false);

    const catType = type === TransactionType.INCOME ? CategoryType.INCOME : CategoryType.EXPENSE;
    const filtered = categories.filter(c => c.type === catType);

    const handleQuickAdd = () => {
        if (!quickName.trim()) return;
        triggerHapticFeedback('light');
        const id = crypto.randomUUID();
        dispatch({
            type: 'ADD_CATEGORY',
            payload: { name: quickName.trim(), type: catType, icon: quickIcon, color: quickColor },
        });
        setTimeout(() => {
            const newCats = categories.filter(c => c.type === catType);
            const added = newCats.find(c => c.name === quickName.trim());
            if (added) onChange(added.id);
        }, 50);
        setQuickName('');
        setShowQuickAdd(false);
        setShowEmojiGrid(false);
    };

    return (
        <div className="space-y-2">
            <div className="flex flex-wrap gap-1.5">
                <button
                    type="button"
                    onClick={() => onChange('')}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                        categoryId === ''
                            ? 'border-muted-foreground/40 bg-secondary text-foreground'
                            : 'border-border/30 text-muted-foreground hover:border-border hover:text-foreground'
                    }`}
                >
                    Keine
                </button>
                {filtered.map(c => {
                    const icon = c.icon || '📦';
                    const color = c.color || '#6366f1';
                    const selected = categoryId === c.id;
                    return (
                        <button
                            key={c.id}
                            type="button"
                            onClick={() => onChange(c.id)}
                            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                                selected
                                    ? 'text-white border-transparent shadow-sm'
                                    : 'border-border/30 text-foreground hover:border-border'
                            }`}
                            style={selected ? { background: color, borderColor: color } : { background: color + '15' }}
                        >
                            <span>{icon}</span>
                            <span>{c.name}</span>
                            {selected && <Check size={11} className="opacity-90" />}
                        </button>
                    );
                })}
                <button
                    type="button"
                    onClick={() => setShowQuickAdd(v => !v)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-dashed border-border/50 text-muted-foreground hover:text-primary hover:border-primary/40 transition-all"
                >
                    <Plus size={12} /> Neu
                </button>
            </div>

            {showQuickAdd && (
                <div className="p-3 bg-secondary/40 rounded-xl border border-border/20 space-y-2 animate-fade-in">
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setShowEmojiGrid(v => !v)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-base border border-border/30 hover:border-primary/50 transition-colors flex-shrink-0"
                            style={{ background: quickColor + '22' }}
                        >
                            {quickIcon}
                        </button>
                        <Input
                            value={quickName}
                            onChange={e => setQuickName(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleQuickAdd())}
                            placeholder="Kategoriename…"
                            className="flex-1 h-8 text-sm border-none bg-transparent shadow-none"
                            autoFocus
                        />
                        <button
                            type="button"
                            onClick={handleQuickAdd}
                            className="p-1.5 text-success hover:text-success/80 transition-colors flex-shrink-0"
                        >
                            <Check size={16} />
                        </button>
                        <button
                            type="button"
                            onClick={() => { setShowQuickAdd(false); setShowEmojiGrid(false); }}
                            className="p-1.5 text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                        >
                            <X size={16} />
                        </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        {QUICK_COLORS.map(c => (
                            <button
                                key={c}
                                type="button"
                                onClick={() => setQuickColor(c)}
                                className="w-5 h-5 rounded-full border-2 transition-transform hover:scale-110"
                                style={{
                                    background: c,
                                    borderColor: quickColor === c ? '#fff' : 'transparent',
                                    outline: quickColor === c ? `2px solid ${c}` : 'none',
                                }}
                            />
                        ))}
                    </div>
                    {showEmojiGrid && (
                        <div className="grid grid-cols-8 gap-1">
                            {QUICK_EMOJIS.map(e => (
                                <button
                                    key={e}
                                    type="button"
                                    onClick={() => { setQuickIcon(e); setShowEmojiGrid(false); }}
                                    className={`w-8 h-8 rounded-lg text-base flex items-center justify-center hover:bg-secondary transition-colors ${quickIcon === e ? 'bg-primary/20' : ''}`}
                                >
                                    {e}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
});

const TransactionModal: React.FC<{ transaction?: Transaction }> = memo(({ transaction }) => {
    const { goals, liabilities, viewMode, predefinedTags, transactions: allTransactions } = useAppState();
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
        setFormData(prev => ({
            ...prev,
            [name]: name === 'amount' ? parseFloat(value) : value,
            ...(name === 'type' ? { categoryId: '' } : {}),
        }));
    }, []);

    const handleSubmit = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        triggerHapticFeedback('success');
        if (transaction) {
            dispatch({ type: 'UPDATE_TRANSACTION', payload: { ...formData, id: transaction.id } });
        } else {
            dispatch({ type: 'ADD_TRANSACTION', payload: formData });
        }
    }, [dispatch, formData, transaction]);

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <FormGroup label="Beschreibung" htmlFor="description">
                <Input type="text" id="description" name="description" value={formData.description} onChange={handleChange} required placeholder="Wofür?" />
            </FormGroup>
            <div className="grid grid-cols-2 gap-4">
                <FormGroup label="Betrag" htmlFor="amount">
                    <Input type="number" id="amount" name="amount" value={formData.amount} onChange={handleChange} required step="0.01" inputMode="decimal" />
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

            {formData.type !== TransactionType.SAVING && (
                <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Kategorie</label>
                    <CategoryPicker
                        categoryId={formData.categoryId || ''}
                        type={formData.type}
                        onChange={id => setFormData(prev => ({ ...prev, categoryId: id }))}
                    />
                </div>
            )}

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
                <Button type="button" onClick={() => dispatch({ type: 'CLOSE_MODAL' })} className="flex-1">Abbrechen</Button>
                <Button type="submit" variant="primary" className="flex-1">Speichern</Button>
            </div>
        </form>
    );
});

export default TransactionModal;
