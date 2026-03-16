import React, { useState, useCallback, useMemo, memo } from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { Transaction, TransactionType, LiabilityType } from '../../types';
import { X } from 'lucide-react';
import { formatCurrency, triggerHapticFeedback } from '../../utils';
import { FormGroup, Input, Select, Button } from '../ui';

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
                <Button type="button" onClick={() => dispatch({ type: 'CLOSE_MODAL' })} className="flex-1">Abbrechen</Button>
                <Button type="submit" variant="primary" className="flex-1">Speichern</Button>
            </div>
        </form>
    );
});

export default TransactionModal;
