import React, { useState, useMemo, memo } from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { Category, CategoryType } from '../../types';
import { Edit, Trash2, X, CheckCircle, Plus } from 'lucide-react';
import { formatCurrency, triggerHapticFeedback } from '../../utils';
import { Input, Button } from '../ui';

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
        dispatch({
            type: 'ADD_CATEGORY', payload: {
                name: newName.trim(),
                type: newType,
                ...(newType === CategoryType.EXPENSE && newBudget ? { budget: parseFloat(newBudget) } : {}),
            }
        });
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
        dispatch({ type: 'UPDATE_CATEGORY', payload: { ...c, name: editName.trim(), budget: editBudget ? parseFloat(editBudget) : undefined } });
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
                    <Input value={editName} onChange={e => setEditName(e.target.value)} onKeyDown={e => e.key === 'Enter' && saveEdit(c)} className="flex-1 border-none bg-transparent shadow-none h-8 text-sm" placeholder="Name..." autoFocus />
                    {c.type === CategoryType.EXPENSE && (
                        <Input type="number" value={editBudget} onChange={e => setEditBudget(e.target.value)} className="w-28 border-none bg-transparent shadow-none h-8 text-sm" placeholder="Budget €" step="0.01" />
                    )}
                    <button type="button" onClick={() => saveEdit(c)} className="p-1.5 text-success hover:text-success/80 transition-colors flex-shrink-0"><CheckCircle size={16} /></button>
                    <button type="button" onClick={() => setEditingId(null)} className="p-1.5 text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"><X size={16} /></button>
                </div>
            );
        }
        return (
            <div key={c.id} className="group flex items-center justify-between p-3 rounded-xl hover:bg-secondary/50 transition-colors">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="font-medium truncate">{c.name}</span>
                    {c.budget && <span className="text-xs text-muted-foreground whitespace-nowrap">{formatCurrency(c.budget)}</span>}
                </div>
                <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                    {(usageCount.get(c.id) || 0) > 0 && (
                        <span className="text-[10px] text-muted-foreground px-1.5 py-0.5 bg-secondary rounded-full mr-1">{usageCount.get(c.id)}x</span>
                    )}
                    <button onClick={() => startEdit(c)} className="p-1.5 text-muted-foreground hover:text-primary transition-colors opacity-0 group-hover:opacity-100"><Edit size={14} /></button>
                    <button onClick={() => handleDelete(c)} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={14} /></button>
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
                    <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Neue Kategorie..." className="flex-1 border-none bg-transparent shadow-none" />
                    <div className="flex rounded-lg overflow-hidden border border-border/30 flex-shrink-0">
                        <button type="button" onClick={() => setNewType(CategoryType.EXPENSE)} className={`px-3 py-1.5 text-xs font-bold transition-colors ${newType === CategoryType.EXPENSE ? 'bg-destructive/70 text-white' : 'text-muted-foreground hover:bg-secondary'}`}>Ausgabe</button>
                        <button type="button" onClick={() => setNewType(CategoryType.INCOME)} className={`px-3 py-1.5 text-xs font-bold transition-colors ${newType === CategoryType.INCOME ? 'bg-success/70 text-white' : 'text-muted-foreground hover:bg-secondary'}`}>Einnahme</button>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {newType === CategoryType.EXPENSE && (
                        <Input type="number" value={newBudget} onChange={e => setNewBudget(e.target.value)} placeholder="Monats-Budget € (optional)" step="0.01" className="flex-1 border-none bg-transparent shadow-none" />
                    )}
                    <Button type="submit" variant="primary" className="ml-auto px-5">
                        <Plus size={16} className="mr-1" /> Hinzufügen
                    </Button>
                </div>
            </form>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <h4 className="font-bold text-xs uppercase tracking-widest text-muted-foreground mb-3">Ausgaben ({expenseCategories.length})</h4>
                    <div className="space-y-1">
                        {expenseCategories.map(renderRow)}
                        {expenseCategories.length === 0 && <p className="text-xs text-muted-foreground text-center py-6 opacity-60">Keine Kategorien</p>}
                    </div>
                </div>
                <div>
                    <h4 className="font-bold text-xs uppercase tracking-widest text-muted-foreground mb-3">Einnahmen ({incomeCategories.length})</h4>
                    <div className="space-y-1">
                        {incomeCategories.map(renderRow)}
                        {incomeCategories.length === 0 && <p className="text-xs text-muted-foreground text-center py-6 opacity-60">Keine Kategorien</p>}
                    </div>
                </div>
            </div>
        </div>
    );
});

export default CategoryManagerModal;
