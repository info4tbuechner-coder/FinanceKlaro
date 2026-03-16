import React, { useState, useMemo, memo } from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { Category, CategoryType } from '../../types';
import { Edit, Trash2, X, CheckCircle, Plus } from 'lucide-react';
import { formatCurrency, triggerHapticFeedback } from '../../utils';
import { Input, Button } from '../ui';

const CATEGORY_COLORS = [
    '#ef4444', '#f97316', '#f59e0b', '#eab308',
    '#84cc16', '#22c55e', '#10b981', '#14b8a6',
    '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6',
    '#a855f7', '#ec4899', '#f43f5e', '#64748b',
];

const CATEGORY_EMOJIS = [
    '🏠', '🛒', '🚗', '🍕', '✈️', '💊', '🎮', '👔',
    '📚', '💡', '📱', '🎵', '🏋️', '🐾', '🎁', '🍺',
    '💰', '💼', '📈', '🏦', '💳', '🎯', '🔧', '🏥',
    '🎓', '👶', '🌿', '🍽️', '⚽', '🛍️', '💻', '🚿',
    '🚌', '⛽', '🅿️', '📦', '🌐', '🎭', '🖨️', '☕',
];

interface CategoryFormState {
    name: string;
    type: CategoryType;
    budget: string;
    icon: string;
    color: string;
}

const DEFAULT_FORM: CategoryFormState = {
    name: '',
    type: CategoryType.EXPENSE,
    budget: '',
    icon: '📦',
    color: '#6366f1',
};

interface EmojiColorPickerProps {
    icon: string;
    color: string;
    onIconChange: (icon: string) => void;
    onColorChange: (color: string) => void;
}

const EmojiColorPicker: React.FC<EmojiColorPickerProps> = ({ icon, color, onIconChange, onColorChange }) => {
    const [showEmoji, setShowEmoji] = useState(false);
    return (
        <div className="space-y-2">
            <div className="flex items-center gap-2">
                <button
                    type="button"
                    onClick={() => setShowEmoji(v => !v)}
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl border border-border/30 hover:border-primary/50 transition-colors flex-shrink-0"
                    style={{ background: color + '22' }}
                    title="Emoji wählen"
                >
                    {icon}
                </button>
                <div className="flex flex-wrap gap-1.5">
                    {CATEGORY_COLORS.map(c => (
                        <button
                            key={c}
                            type="button"
                            onClick={() => onColorChange(c)}
                            className="w-5 h-5 rounded-full border-2 transition-transform hover:scale-110"
                            style={{
                                background: c,
                                borderColor: color === c ? '#fff' : 'transparent',
                                outline: color === c ? `2px solid ${c}` : 'none',
                            }}
                        />
                    ))}
                </div>
            </div>
            {showEmoji && (
                <div className="p-2 bg-secondary/40 rounded-xl border border-border/20 grid grid-cols-8 gap-1">
                    {CATEGORY_EMOJIS.map(e => (
                        <button
                            key={e}
                            type="button"
                            onClick={() => { onIconChange(e); setShowEmoji(false); }}
                            className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center hover:bg-secondary transition-colors ${icon === e ? 'bg-primary/20 ring-1 ring-primary' : ''}`}
                        >
                            {e}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

const CategoryManagerModal: React.FC = memo(() => {
    const { categories, transactions } = useAppState();
    const dispatch = useAppDispatch();

    const [form, setForm] = useState<CategoryFormState>(DEFAULT_FORM);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<CategoryFormState>(DEFAULT_FORM);

    const usageCount = useMemo(() => transactions.reduce((acc, t) => {
        if (t.categoryId) acc.set(t.categoryId, (acc.get(t.categoryId) || 0) + 1);
        return acc;
    }, new Map<string, number>()), [transactions]);

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name.trim()) return;
        triggerHapticFeedback('light');
        dispatch({
            type: 'ADD_CATEGORY', payload: {
                name: form.name.trim(),
                type: form.type,
                icon: form.icon,
                color: form.color,
                ...(form.type === CategoryType.EXPENSE && form.budget ? { budget: parseFloat(form.budget) } : {}),
            }
        });
        setForm(DEFAULT_FORM);
    };

    const startEdit = (c: Category) => {
        setEditingId(c.id);
        setEditForm({
            name: c.name,
            type: c.type,
            budget: c.budget?.toString() || '',
            icon: c.icon || '📦',
            color: c.color || '#6366f1',
        });
    };

    const saveEdit = (c: Category) => {
        if (!editForm.name.trim()) return;
        triggerHapticFeedback('light');
        dispatch({
            type: 'UPDATE_CATEGORY', payload: {
                ...c,
                name: editForm.name.trim(),
                icon: editForm.icon,
                color: editForm.color,
                budget: editForm.budget ? parseFloat(editForm.budget) : undefined,
            }
        });
        setEditingId(null);
    };

    const handleDelete = (c: Category) => {
        if (window.confirm(`Möchten Sie "${c.name}" wirklich löschen?`)) {
            triggerHapticFeedback('heavy');
            dispatch({ type: 'DELETE_CATEGORY', payload: c.id });
        }
    };

    const renderRow = (c: Category) => {
        const icon = c.icon || '📦';
        const color = c.color || '#6366f1';
        if (editingId === c.id) {
            return (
                <div key={c.id} className="p-3 rounded-xl bg-primary/5 border border-primary/20 space-y-2">
                    <div className="flex items-center gap-2">
                        <Input
                            value={editForm.name}
                            onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                            onKeyDown={e => e.key === 'Enter' && saveEdit(c)}
                            className="flex-1 border-none bg-transparent shadow-none h-8 text-sm"
                            placeholder="Name..."
                            autoFocus
                        />
                        {c.type === CategoryType.EXPENSE && (
                            <Input
                                type="number"
                                value={editForm.budget}
                                onChange={e => setEditForm(f => ({ ...f, budget: e.target.value }))}
                                className="w-24 border-none bg-transparent shadow-none h-8 text-sm"
                                placeholder="Budget €"
                                step="0.01"
                            />
                        )}
                        <button type="button" onClick={() => saveEdit(c)} className="p-1.5 text-success hover:text-success/80 transition-colors flex-shrink-0"><CheckCircle size={16} /></button>
                        <button type="button" onClick={() => setEditingId(null)} className="p-1.5 text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"><X size={16} /></button>
                    </div>
                    <EmojiColorPicker
                        icon={editForm.icon}
                        color={editForm.color}
                        onIconChange={v => setEditForm(f => ({ ...f, icon: v }))}
                        onColorChange={v => setEditForm(f => ({ ...f, color: v }))}
                    />
                </div>
            );
        }
        return (
            <div key={c.id} className="group flex items-center justify-between p-2.5 rounded-xl hover:bg-secondary/50 transition-colors">
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0" style={{ background: color + '22' }}>
                        {icon}
                    </div>
                    <div className="flex items-center gap-2 min-w-0">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                        <span className="font-medium truncate text-sm">{c.name}</span>
                        {c.budget && <span className="text-xs text-muted-foreground whitespace-nowrap">{formatCurrency(c.budget)}</span>}
                    </div>
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
                    <Input
                        value={form.name}
                        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                        placeholder="Neue Kategorie..."
                        className="flex-1 border-none bg-transparent shadow-none"
                    />
                    <div className="flex rounded-lg overflow-hidden border border-border/30 flex-shrink-0">
                        <button
                            type="button"
                            onClick={() => setForm(f => ({ ...f, type: CategoryType.EXPENSE }))}
                            className={`px-3 py-1.5 text-xs font-bold transition-colors ${form.type === CategoryType.EXPENSE ? 'bg-destructive/70 text-white' : 'text-muted-foreground hover:bg-secondary'}`}
                        >Ausgabe</button>
                        <button
                            type="button"
                            onClick={() => setForm(f => ({ ...f, type: CategoryType.INCOME }))}
                            className={`px-3 py-1.5 text-xs font-bold transition-colors ${form.type === CategoryType.INCOME ? 'bg-success/70 text-white' : 'text-muted-foreground hover:bg-secondary'}`}
                        >Einnahme</button>
                    </div>
                </div>

                <EmojiColorPicker
                    icon={form.icon}
                    color={form.color}
                    onIconChange={v => setForm(f => ({ ...f, icon: v }))}
                    onColorChange={v => setForm(f => ({ ...f, color: v }))}
                />

                <div className="flex items-center gap-2">
                    {form.type === CategoryType.EXPENSE && (
                        <Input
                            type="number"
                            value={form.budget}
                            onChange={e => setForm(f => ({ ...f, budget: e.target.value }))}
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
                    <h4 className="font-bold text-xs uppercase tracking-widest text-muted-foreground mb-3">Ausgaben ({expenseCategories.length})</h4>
                    <div className="space-y-0.5">
                        {expenseCategories.map(renderRow)}
                        {expenseCategories.length === 0 && <p className="text-xs text-muted-foreground text-center py-6 opacity-60">Keine Kategorien</p>}
                    </div>
                </div>
                <div>
                    <h4 className="font-bold text-xs uppercase tracking-widest text-muted-foreground mb-3">Einnahmen ({incomeCategories.length})</h4>
                    <div className="space-y-0.5">
                        {incomeCategories.map(renderRow)}
                        {incomeCategories.length === 0 && <p className="text-xs text-muted-foreground text-center py-6 opacity-60">Keine Kategorien</p>}
                    </div>
                </div>
            </div>
        </div>
    );
});

export default CategoryManagerModal;
