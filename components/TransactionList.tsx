
import React, { useMemo, useState, useCallback, memo, useRef, useEffect } from 'react';
import { useAppState, useAppDispatch } from '../context/AppContext';
import useFilteredTransactions from '../hooks/useFilteredTransactions';
import { Transaction, TransactionType, DateRangePreset, Filters } from '../types';
import { Edit, Trash2, Search, Package, Banknote, PiggyBank, DollarSign, X, Combine, Tags, Inbox } from 'lucide-react';
import { formatCurrency, formatDate, triggerHapticFeedback } from '../utils';
import { Button } from './ui';

// Custom icon component for transaction types
const TransactionTypeIcon: React.FC<{ type: TransactionType }> = memo(({ type }) => {
    switch (type) {
        case TransactionType.INCOME: return <Banknote className="h-5 w-5 text-success" />;
        case TransactionType.EXPENSE: return <Package className="h-5 w-5 text-destructive" />;
        case TransactionType.SAVING: return <PiggyBank className="h-5 w-5 text-blue-500" />;
        default: return <DollarSign className="h-5 w-5 text-muted-foreground" />;
    }
});

// Filter bar for searching and filtering transactions
const FilterBar = memo(({ allTags }: { allTags: string[] }) => {
    const { filters } = useAppState();
    const dispatch = useAppDispatch();
    
    // Helper to update filters via context dispatch
    const updateFilters = useCallback((newFilters: Partial<Filters>) => 
        dispatch({ type: 'UPDATE_FILTERS', payload: newFilters }), [dispatch]);
    
    const [isTagDropdownOpen, setIsTagDropdownOpen] = useState(false);
    const tagFilterRef = useRef<HTMLDivElement>(null);

    const handleTagToggle = useCallback((tag: string) => {
        const newTags = filters.tags.includes(tag)
            ? filters.tags.filter(t => t !== tag)
            : [...filters.tags, tag];
        updateFilters({ tags: newTags });
    }, [filters.tags, updateFilters]);

    const handleClearTags = useCallback(() => {
        updateFilters({ tags: [] });
    }, [updateFilters]);

    // Close tag dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (tagFilterRef.current && !tagFilterRef.current.contains(event.target as Node)) {
                setIsTagDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [tagFilterRef]);

    return (
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 border-b border-border/10">
            <div className="relative md:col-span-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                    type="search"
                    enterKeyHint="search"
                    inputMode="search"
                    placeholder="Suchen..."
                    value={filters.searchTerm}
                    onChange={(e) => updateFilters({ searchTerm: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 bg-secondary/50 border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                />
            </div>
            
            <select
                value={filters.dateRange.preset}
                onChange={(e) => updateFilters({ dateRange: { ...filters.dateRange, preset: e.target.value as DateRangePreset } })}
                className="bg-secondary/50 border border-border/50 rounded-lg text-sm px-3 py-2 outline-none cursor-pointer hover:bg-secondary/70 transition-colors"
            >
                <option value="this_month">Dieser Monat</option>
                <option value="last_month">Letzter Monat</option>
                <option value="this_year">Dieses Jahr</option>
                <option value="all_time">Gesamt</option>
                <option value="custom">Benutzerdefiniert</option>
            </select>

            <select
                value={filters.transactionType}
                onChange={(e) => updateFilters({ transactionType: e.target.value as TransactionType | 'all' })}
                className="bg-secondary/50 border border-border/50 rounded-lg text-sm px-3 py-2 outline-none cursor-pointer hover:bg-secondary/70 transition-colors"
            >
                <option value="all">Alle Typen</option>
                <option value={TransactionType.INCOME}>Einnahmen</option>
                <option value={TransactionType.EXPENSE}>Ausgaben</option>
                <option value={TransactionType.SAVING}>Sparen</option>
            </select>

            <div className="relative" ref={tagFilterRef}>
                <button
                    onClick={() => setIsTagDropdownOpen(!isTagDropdownOpen)}
                    className="w-full flex items-center justify-between px-3 py-2 bg-secondary/50 border border-border/50 rounded-lg text-sm hover:bg-secondary/70 transition-colors"
                >
                    <span className="truncate">{filters.tags.length > 0 ? filters.tags.join(', ') : 'Tags filtern'}</span>
                    <Tags className="h-4 w-4 ml-2 flex-shrink-0" />
                </button>
                {isTagDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 p-2 glass-card rounded-lg z-20 max-h-48 overflow-y-auto shadow-xl animate-in fade-in zoom-in duration-200">
                        <button onClick={handleClearTags} className="w-full text-left text-[10px] p-2 hover:bg-primary/10 rounded mb-1 font-bold text-primary uppercase tracking-widest">Alle löschen</button>
                        {allTags.length > 0 ? allTags.map(tag => (
                            <label key={tag} className="flex items-center p-2 hover:bg-secondary rounded cursor-pointer text-xs">
                                <input
                                    type="checkbox"
                                    checked={filters.tags.includes(tag)}
                                    onChange={() => handleTagToggle(tag)}
                                    className="mr-3 h-4 w-4 rounded border-border text-primary focus:ring-primary/30"
                                />
                                <span className="truncate font-medium">{tag}</span>
                            </label>
                        )) : (
                            <div className="p-2 text-center text-[10px] text-muted-foreground uppercase font-bold">Keine Tags</div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
});

// Individual transaction item component with selection support
const TransactionItem = memo(({ transaction, isSelected, toggleSelection }: { transaction: Transaction, isSelected: boolean, toggleSelection: (id: string) => void }) => {
    const dispatch = useAppDispatch();
    const { categories } = useAppState();
    const categoryName = useMemo(() => categories.find(c => c.id === transaction.categoryId)?.name || 'Unkategorisiert', [categories, transaction.categoryId]);

    const handleEdit = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        triggerHapticFeedback('medium');
        dispatch({ type: 'OPEN_MODAL', payload: { type: 'EDIT_TRANSACTION', data: transaction } });
    }, [dispatch, transaction]);

    const handleDelete = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.confirm('Diese Transaktion wirklich löschen?')) {
            triggerHapticFeedback('heavy');
            dispatch({ type: 'DELETE_TRANSACTIONS', payload: [transaction.id] });
        }
    }, [dispatch, transaction.id]);

    return (
        <div 
            onClick={() => toggleSelection(transaction.id)}
            className={`group flex items-center p-4 hover:bg-secondary/30 transition-all border-b border-border/5 cursor-pointer select-none ${isSelected ? 'bg-primary/10 ring-1 ring-primary/30' : ''}`}
        >
            <div className="mr-4 flex-shrink-0">
                <TransactionTypeIcon type={transaction.type} />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                    <p className="font-semibold text-sm sm:text-base truncate pr-2">{transaction.description}</p>
                    <p className={`font-bold text-sm sm:text-base ${transaction.type === TransactionType.INCOME ? 'text-success' : 'text-foreground'}`}>
                        {transaction.type === TransactionType.EXPENSE ? '-' : transaction.type === TransactionType.INCOME ? '+' : ''}{formatCurrency(transaction.amount)}
                    </p>
                </div>
                <div className="flex items-center justify-between mt-1">
                    <div className="flex items-center gap-2 overflow-hidden">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground whitespace-nowrap">{categoryName}</span>
                        {transaction.tags && transaction.tags.map(tag => (
                            <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold uppercase truncate max-w-[80px]">{tag}</span>
                        ))}
                    </div>
                    <p className="text-[11px] text-muted-foreground whitespace-nowrap ml-2">{formatDate(transaction.date)}</p>
                </div>
            </div>
            <div className="ml-4 flex items-center gap-2 md:opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                <button onClick={handleEdit} className="p-2 text-muted-foreground hover:text-primary transition-colors active:scale-90" title="Bearbeiten"><Edit size={16} /></button>
                <button onClick={handleDelete} className="p-2 text-muted-foreground hover:text-destructive transition-colors active:scale-90" title="Löschen"><Trash2 size={16} /></button>
            </div>
        </div>
    );
});

// Main TransactionList component rendering the full list section
const TransactionList: React.FC = () => {
    const transactions = useFilteredTransactions();
    const { selectedTransactions, transactions: allTransactions } = useAppState();
    const dispatch = useAppDispatch();

    // Extract all unique tags for the filter dropdown
    const allTags = useMemo(() => {
        const tags = new Set<string>();
        allTransactions.forEach(t => t.tags?.forEach(tag => tags.add(tag)));
        return Array.from(tags).sort();
    }, [allTransactions]);

    const toggleSelection = useCallback((id: string) => {
        dispatch({
            type: 'SET_SELECTED_TRANSACTIONS',
            payload: (prev: Set<string>) => {
                const next = new Set(prev);
                if (next.has(id)) next.delete(id);
                else next.add(id);
                return next;
            }
        });
    }, [dispatch]);

    const handleBulkDelete = () => {
        if (window.confirm(`${selectedTransactions.size} Transaktionen wirklich löschen?`)) {
            triggerHapticFeedback('heavy');
            dispatch({ type: 'DELETE_TRANSACTIONS', payload: Array.from(selectedTransactions) });
        }
    };

    const handleBulkMerge = () => {
        if (selectedTransactions.size < 2) return;
        dispatch({ type: 'OPEN_MODAL', payload: { type: 'MERGE_TRANSACTIONS', data: { transactionIds: Array.from(selectedTransactions) } } });
    };

    return (
        <section className="glass-card rounded-2xl overflow-hidden shadow-xl animate-fade-in border border-border/10">
            <div className="bg-secondary/50 px-6 py-4 border-b border-border/10 flex items-center justify-between flex-wrap gap-4">
                <h2 className="text-xl font-bold tracking-tighter">Transaktionen</h2>
                {selectedTransactions.size > 0 && (
                    <div className="flex items-center gap-2 animate-in slide-in-from-top-2">
                        <span className="text-xs font-bold text-primary mr-2">{selectedTransactions.size} ausgewählt</span>
                        <Button onClick={handleBulkMerge} variant="secondary" className="px-3 py-1.5 h-auto text-[10px] uppercase tracking-widest"><Combine size={14} className="mr-1.5" /> Zusammenführen</Button>
                        <Button onClick={handleBulkDelete} variant="destructive" className="px-3 py-1.5 h-auto text-[10px] uppercase tracking-widest"><Trash2 size={14} className="mr-1.5" /> Löschen</Button>
                        <button 
                            onClick={() => dispatch({ type: 'SET_SELECTED_TRANSACTIONS', payload: new Set() })} 
                            className="p-1.5 hover:bg-secondary rounded-full text-muted-foreground transition-colors"
                        >
                            <X size={16}/>
                        </button>
                    </div>
                )}
            </div>
            
            <FilterBar allTags={allTags} />
            
            <div className="divide-y divide-border/5 max-h-[600px] overflow-y-auto custom-scrollbar">
                {transactions.length > 0 ? (
                    transactions.map(t => (
                        <TransactionItem 
                            key={t.id} 
                            transaction={t} 
                            isSelected={selectedTransactions.has(t.id)} 
                            toggleSelection={toggleSelection} 
                        />
                    ))
                ) : (
                    <div className="py-24 flex flex-col items-center justify-center text-muted-foreground animate-fade-in">
                        <Inbox size={48} className="opacity-20 mb-4" />
                        <p className="font-bold text-lg">Keine Transaktionen</p>
                        <p className="text-sm opacity-60">Ändern Sie Ihre Filter oder fügen Sie einen Eintrag hinzu.</p>
                    </div>
                )}
            </div>
            
            {transactions.length > 0 && (
                <div className="p-4 bg-secondary/20 flex justify-center border-t border-border/10">
                    <p className="text-[10px] text-muted-foreground uppercase font-black tracking-[0.2em]">{transactions.length} Einträge angezeigt</p>
                </div>
            )}
        </section>
    );
};

export default TransactionList;
