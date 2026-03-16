import React, { useState, useMemo, memo } from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { X, Plus } from 'lucide-react';
import { triggerHapticFeedback } from '../../utils';
import { Input, Button } from '../ui';

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
                <Input value={newTag} onChange={e => setNewTag(e.target.value)} placeholder="Neuen Tag erstellen..." className="border-none bg-transparent shadow-none" />
                <Button type="submit" variant="primary" className="h-10 px-4 rounded-xl flex-shrink-0">
                    <Plus size={16} className="mr-1" /> Hinzufügen
                </Button>
            </form>
            <p className="text-xs text-muted-foreground">
                Tags werden automatisch aus Transaktionen übernommen. Eigene Tags können hier als Vorlage gespeichert und gelöscht werden.
            </p>
            {allTags.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm opacity-60">Noch keine Tags vorhanden.</div>
            ) : (
                <div className="flex flex-wrap gap-2">
                    {allTags.map(tag => (
                        <div key={tag} className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-colors ${isPredefined(tag) ? 'bg-primary/10 border-primary/20' : 'bg-secondary/50 border-border/30'}`}>
                            <span className={`text-sm font-bold ${isPredefined(tag) ? 'text-primary' : 'text-foreground'}`}>{tag}</span>
                            {(usageCount.get(tag) || 0) > 0 && (
                                <span className="text-[10px] text-muted-foreground bg-secondary/80 rounded-full px-1.5 py-0.5">{usageCount.get(tag)}x</span>
                            )}
                            {isPredefined(tag) && (
                                <button onClick={() => handleDelete(tag)} className="text-muted-foreground hover:text-destructive transition-colors ml-0.5 opacity-0 group-hover:opacity-100" title="Aus Vorlagen entfernen">
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

export default TagManagerModal;
