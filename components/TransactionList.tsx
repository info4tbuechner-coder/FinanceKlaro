
import React, { useMemo, useState, useCallback, memo, useRef, useEffect } from 'react';
import { useAppState, useAppDispatch } from '../context/AppContext';
import useFilteredTransactions from '../hooks/useFilteredTransactions';
import { Transaction, TransactionType, Category, DateRangePreset, Filters } from '../types';
import { Edit, Trash2, Search, Package, Banknote, PiggyBank, DollarSign, X, Combine, Tags, Inbox, FileDown } from 'lucide-react';
import { formatCurrency, formatDate, triggerHapticFeedback } from '../utils';
import { Button } from './ui';
import { isToday } from 'date-fns/isToday';
import { isYesterday } from 'date-fns/isYesterday';
import { format as formatFns } from 'date-fns/format';
import { parseISO } from 'date-fns/parseISO';
import de from 'date-fns/locale/de';

const TransactionTypeIcon: React.FC<{ type: TransactionType }> = ({ type }) => {
    switch (type) {
        case TransactionType.INCOME: return <Banknote className="h-5 w-5 text-success" />;
        case TransactionType.EXPENSE: return <Package className="h-5 w-5 text-destructive" />;
        case TransactionType.SAVING: return <PiggyBank className="h-5 w-5 text-blue-500" />;
        default: return <DollarSign className="h-5 w-5 text-muted-foreground" />;
    }
};

const FilterBar = memo(({ allTags }: { allTags: string[] }) => {
    const { filters } = useAppState();
    const dispatch = useAppDispatch();
    const updateFilters = (newFilters: Partial<Filters>) => dispatch({ type: 'UPDATE_FILTERS', payload: newFilters });
    const [isTagDropdownOpen, setIsTagDropdownOpen] = useState(false);
    const tagFilterRef = useRef<HTMLDivElement>(null);

    const handleTagToggle = (tag: string) => {
        const newTags = filters.tags.includes(tag)
            ? filters.tags.filter(t => t !== tag)
            : [...filters.tags, tag];
        updateFilters({ tags: newTags });
    };

    const handleClearTags = () => {
        updateFilters({ tags: [] });
    };

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
                    type="text"
                    placeholder="Suchen nach Beschreibung, Tags..."
                    value={filters.searchTerm}
                    onChange={(e) => updateFilters({ searchTerm: e.target.value })}
                    enterKeyHint="search"
                    autoComplete="off"
                    spellCheck="false"
                    className="w-full pl-10 pr-4 py-3 sm:py-2 rounded-lg bg-secondary border border-transparent focus:ring-2 focus:ring-primary focus:border-primary text-base"
                />
            </div>
             <select
                value={filters.transactionType}
                onChange={(e) => updateFilters({ transactionType: e.target.value as TransactionType | 'all' })}
                className="w-full px-4 py-3 sm:py-2 rounded-lg bg-secondary border border-transparent focus:ring-2 focus:ring-primary focus:border-primary text-base cursor-pointer"
             >
                <option value="all">Alle Typen</option>
                <option value={TransactionType.INCOME}>Einnahmen</option>
                <option value={TransactionType.EXPENSE}>Ausgaben</option>
                <option value={TransactionType.SAVING}>Sparen</option>
             </select>
             <select
                value={filters.dateRange.preset}
                onChange={(e) => updateFilters({ dateRange: { ...filters.dateRange, preset: e.target.value as DateRangePreset } })}
                className="w-full px-4 py-3 sm:py-2 rounded-lg bg-secondary border border-transparent focus:ring-2 focus:ring-primary focus:border-primary text-base cursor-pointer"
            >
                <option value="this_month">Dieser Monat</option>
                <option value="last_month">Letzter Monat</option>
                <option value="this_year">Dieses Jahr</option>
                <option value="all_time">Gesamter Zeitraum</option>
             </select>
             <div className="relative" ref={tagFilterRef}>
                <button
                    onClick={() => setIsTagDropdownOpen(prev => !prev)}
                    className="w-full px-4 py-3 sm:py-2 rounded-lg bg-secondary border border-transparent focus:ring-2 focus:ring-primary focus:border-primary text-left flex items-center justify-between"
                >
                    <span className="flex items-center gap-2"><Tags size={16} className="text-muted-foreground"/> Tags</span>
                    {filters.tags.length > 0 && <span className="px-2 py-0.5 text-xs rounded-full bg-primary text-primary-foreground">{filters.tags.length}</span>}
                </button>
                {isTagDropdownOpen && (
                    <div className="absolute top-full mt-2 w-72 p-3 bg-popover text-popover-foreground rounded-lg shadow-xl z-20 border border-border/20 animate-fade-in">
                        <p className="text-sm font-semibold mb-2">Nach Tags filtern</p>
                        <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
                            {allTags.map(tag => {
                                const isSelected = filters.tags.includes(tag);
                                return (
                                    <button
                                        key={tag}
                                        onClick={() => handleTagToggle(tag)}
                                        className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${isSelected ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-secondary hover:bg-secondary/80'}`}
                                    >
                                        {tag}
                                    </button>
                                )
                            })}
                        </div>
                        {filters.tags.length > 0 && (
                            <>
                                <div className="border-t border-border/20 my-2"></div>
                                <Button onClick={handleClearTags} className="w-full text-sm">Auswahl aufheben</Button>
                            </>
                        )}
                    </div>
                )}
             </div>
        </div>
    );
});

const TransactionItem = memo(({ transaction, category, isSelected, onSelect, style, allTags }: { transaction: Transaction; category?: Category; isSelected: boolean; onSelect: (id: string) => void; style: React.CSSProperties; allTags: string[] }) => {
    const dispatch = useAppDispatch();
    const openModal = (modal: any) => dispatch({ type: 'OPEN_MODAL', payload: modal });
    const updateTransaction = (t: Transaction) => dispatch({ type: 'UPDATE_TRANSACTION', payload: t });
    
    const [newTag, setNewTag] = useState('');
    const datalistId = `tags-suggestions-${transaction.id}`;

    const handleSelect = () => {
        triggerHapticFeedback('light');
        onSelect(transaction.id);
    };

    const handleRemoveTag = useCallback((tagToRemove: string) => {
        const updatedTags = transaction.tags?.filter(t => t !== tagToRemove) || [];
        updateTransaction({ ...transaction, tags: updatedTags });
    }, [transaction, updateTransaction]);

    const handleAddTag = useCallback((e: React.KeyboardEvent<HTMLInputElement> | React.FocusEvent<HTMLInputElement>) => {
        if ((e as React.KeyboardEvent<HTMLInputElement>).key && (e as React.KeyboardEvent<HTMLInputElement>).key !== 'Enter') return;

        if (newTag.trim() !== '') {
            if (e.preventDefault) e.preventDefault();
            const trimmedTag = newTag.trim();
            const existingTags = transaction.tags || [];
            if (!existingTags.some(tag => tag.toLowerCase() === trimmedTag.toLowerCase())) {
                const updatedTags = [...existingTags, trimmedTag];
                updateTransaction({ ...transaction, tags: updatedTags });
            }
            setNewTag('');
        }
    }, [newTag, transaction, updateTransaction]);

    return (
        <div 
            style={style} 
            className={`flex items-start p-4 sm:p-3 rounded-xl sm:rounded-lg transition-all animate-fade-in mb-1 active:bg-secondary/80 active:scale-[0.98] cursor-pointer ${isSelected ? 'bg-primary/10 ring-1 ring-primary/20' : 'hover:bg-secondary'}`}
            onClick={handleSelect}
        >
            <div className="flex items-center h-6 mr-3">
                <input 
                    type="checkbox" 
                    checked={isSelected} 
                    onChange={handleSelect} 
                    onClick={(e) => e.stopPropagation()}
                    className="h-6 w-6 sm:h-5 sm:w-5 rounded border-border text-primary focus:ring-primary" 
                />
            </div>
            <div className="flex-shrink-0 mr-3 mt-0.5">
                <TransactionTypeIcon type={transaction.type} />
            </div>
            <div className="flex-grow min-w-0">
                <p className="font-semibold text-base sm:text-sm truncate">{transaction.description}</p>
                <p className="text-sm sm:text-xs text-muted-foreground">{category?.name || 'Unkategorisiert'}</p>
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    {transaction.tags?.map(tag => (
                        <span key={tag} className="flex items-center text-[11px] font-medium bg-muted text-muted-foreground px-2 py-0.5 rounded-full group">
                            {tag}
                            <button
                                onClick={(e) => { e.stopPropagation(); handleRemoveTag(tag); }}
                                className="ml-1 -mr-1 p-0.5 rounded-full opacity-60 hover:opacity-100 hover:bg-destructive/20 hover:text-destructive transition-opacity"
                                aria-label={`Entferne Tag ${tag}`}
                            >
                                <X size={10} />
                            </button>
                        </span>
                    ))}
                    <input
                        type="text"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyDown={handleAddTag}
                        onBlur={handleAddTag}
                        onClick={(e) => e.stopPropagation()}
                        placeholder="+ Tag"
                        list={datalistId}
                        enterKeyHint="done"
                        spellCheck="false"
                        className="text-[11px] bg-transparent border border-dashed border-border/50 rounded-md w-14 h-5 px-1 focus:ring-2 focus:ring-primary focus:bg-secondary focus:border-primary focus:w-20 transition-all duration-200"
                        aria-label="Neuen Tag hinzufügen"
                    />
                     <datalist id={datalistId}>
                        {allTags.map(tag => <option key={tag} value={tag} />)}
                    </datalist>
                </div>
            </div>
            <div className="text-right ml-3 flex flex-col items-end">
                <p 
                    className={`font-bold text-base sm:text-sm ${transaction.type === TransactionType.INCOME ? 'text-success' : 'text-foreground'}`}
                    data-privacy
                >
                    {formatCurrency(transaction.amount)}
                </p>
                <button 
                    onClick={(e) => { e.stopPropagation(); openModal({ type: 'EDIT_TRANSACTION', data: transaction }); }} 
                    className="p-3 -mr-3 mt-1 text-muted-foreground hover:text-foreground sm:p-1 sm:mr-0"
                    aria-label="Bearbeiten"
                >
                    <Edit size={16} />
                </button>
            </div>
        </div>
    );
});

const groupTransactionsByDate = (transactions: Transaction[]) => {
    return transactions.reduce((acc, transaction) => {
        const date = parseISO(transaction.date);
        let groupTitle: string;

        if (isToday(date)) {
            groupTitle = 'Heute';
        } else if (isYesterday(date)) {
            groupTitle = 'Gestern';
        } else {
            // Fix: Cast locale to any to bypass type mismatch in build environment
            groupTitle = formatFns(date, 'd. MMMM yyyy', { locale: de as any });
        }
        
        if (!acc[groupTitle]) {
            acc[groupTitle] = [];
        }
        acc[groupTitle].push(transaction);
        return acc;
    }, {} as Record<string, Transaction[]>);
};

const CategoryFilterIndicator = memo(() => {
    const { filters, categories } = useAppState();
    const dispatch = useAppDispatch();
    
    if (!filters.categoryId) {
        return null;
    }

    const category = categories.find(c => c.id === filters.categoryId);
    if (!category) {
        return null;
    }

    const clearFilter = () => {
        dispatch({ type: 'UPDATE_FILTERS', payload: { categoryId: null } });
    };

    return (
        <div className="px-4 pt-3">
            <div className="flex items-center justify-start bg-primary/10 p-2.5 rounded-xl animate-fade-in border border-primary/20">
                <span className="text-sm font-semibold text-primary">
                    Filter: {category.name}
                </span>
                <button
                    onClick={clearFilter}
                    className="ml-auto p-1.5 rounded-full text-primary hover:bg-primary/20 transition-colors"
                    aria-label="Kategoriefilter entfernen"
                >
                    <X size={16} />
                </button>
            </div>
        </div>
    );
});

const TransactionList: React.FC = () => {
    const { categories, selectedTransactions, transactions } = useAppState();
    const dispatch = useAppDispatch();
    const filteredTransactions = useFilteredTransactions();
    
    const allTags = useMemo(() => [...new Set(transactions.flatMap(t => t.tags || []))].sort(), [transactions]);
    const categoriesMap = useMemo(() => new Map(categories.map(c => [c.id, c])), [categories]);
    const groupedTransactions = useMemo(() => groupTransactionsByDate(filteredTransactions), [filteredTransactions]);

    const setSelectedTransactions = (updater: React.SetStateAction<Set<string>>) => dispatch({ type: 'SET_SELECTED_TRANSACTIONS', payload: updater });
    const openModal = (modal: any) => dispatch({ type: 'OPEN_MODAL', payload: modal });
    const deleteTransactions = (ids: string[]) => dispatch({ type: 'DELETE_TRANSACTIONS', payload: ids });
    const categorizeTransactions = (ids: string[], categoryId: string) => dispatch({ type: 'CATEGORIZE_TRANSACTIONS', payload: { ids, categoryId } });
    
    const handleExportCSV = useCallback(() => {
        if (filteredTransactions.length === 0) {
            alert("Keine Transaktionen zum Exportieren vorhanden.");
            return;
        }

        const headers = ['Datum', 'Beschreibung', 'Betrag', 'Typ', 'Kategorie', 'Tags'];
        const rows = filteredTransactions.map(t => {
            const categoryName = categoriesMap.get(t.categoryId || '')?.name || '';
            const tags = t.tags?.join(', ') || '';
            const escapeCSV = (str: string) => `"${str.replace(/"/g, '""')}"`;

            return [
                t.date,
                escapeCSV(t.description),
                t.amount.toString().replace('.', ','),
                t.type,
                escapeCSV(categoryName),
                escapeCSV(tags)
            ].join(';');
        });

        const csvContent = [headers.join(';'), ...rows].join('\n');
        const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
        
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `Klaro_Export_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

    }, [filteredTransactions, categoriesMap]);

    const handleSelectTransaction = useCallback((id: string) => {
        setSelectedTransactions(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    }, [setSelectedTransactions]);
    
    const handleDeleteSelected = () => {
        if (window.confirm(`${selectedTransactions.size} Transaktionen wirklich löschen?`)) {
            triggerHapticFeedback('heavy');
            deleteTransactions(Array.from(selectedTransactions));
        }
    };

    const handleCategorizeSelected = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const categoryId = e.target.value;
        if (categoryId) {
            triggerHapticFeedback('medium');
            categorizeTransactions(Array.from(selectedTransactions), categoryId);
        }
    };
    
    const selectedTransactionDetails = useMemo(() =>
        filteredTransactions.filter(t => selectedTransactions.has(t.id)),
        [filteredTransactions, selectedTransactions]
    );

    const canMerge = useMemo(() => {
        if (selectedTransactionDetails.length < 2) return false;
        const firstType = selectedTransactionDetails[0].type;
        return selectedTransactionDetails.every(t => t.type === firstType);
    }, [selectedTransactionDetails]);


    return (
        <section className="glass-card rounded-2xl mb-24 lg:mb-0 overflow-hidden">
            <div className="p-4 border-b border-border/10 flex justify-between items-center">
                <h2 className="text-xl font-bold tracking-tight">Transaktionen</h2>
                <button onClick={handleExportCSV} className="p-2 text-muted-foreground hover:text-primary transition-colors disabled:opacity-50" disabled={filteredTransactions.length === 0} title="CSV Export">
                    <FileDown size={20}/>
                </button>
            </div>
            <FilterBar allTags={allTags} />
            <CategoryFilterIndicator />
            
            {selectedTransactions.size > 0 && (
                 <div className="px-4 py-3 border-b border-border/10 bg-primary/5 flex flex-wrap items-center justify-between gap-3 animate-fade-in">
                     <p className="text-sm font-semibold text-primary">{selectedTransactions.size} ausgewählt</p>
                     <div className="flex items-center gap-2">
                         <select onChange={handleCategorizeSelected} defaultValue="" className="pl-3 pr-8 py-1.5 text-xs rounded-lg border border-border bg-card hover:bg-secondary appearance-none transition-colors">
                             <option value="" disabled>Kategorie...</option>
                             {categories.filter(c=>c.type === 'expense').map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                         </select>
                         <button
                            onClick={() => openModal({ type: 'MERGE_TRANSACTIONS', data: { transactionIds: Array.from(selectedTransactions) } })}
                            disabled={!canMerge}
                            className="p-1.5 rounded-lg border border-border text-foreground hover:bg-secondary disabled:opacity-50 transition-colors"
                            title="Zusammenführen"
                        >
                            <Combine size={18} />
                        </button>
                         <button onClick={handleDeleteSelected} className="p-1.5 rounded-lg border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors">
                             <Trash2 size={18} />
                         </button>
                     </div>
                 </div>
            )}
            
            <div className="p-4 space-y-6">
                {filteredTransactions.length > 0 ? (
                    (Object.entries(groupedTransactions) as [string, Transaction[]][]).map(([date, transactionsForDate]) => (
                        <div key={date}>
                            <div className="flex justify-between items-center mb-3 pt-2">
                                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">{date}</h3>
                                <div className="h-px flex-grow mx-4 bg-border/20"></div>
                                <p className="text-sm font-bold text-foreground/80" data-privacy>
                                    {formatCurrency(transactionsForDate.reduce((sum, t) => sum + (t.type === TransactionType.INCOME ? t.amount : -t.amount), 0))}
                                </p>
                            </div>
                            <div className="space-y-1">
                                {transactionsForDate.map((t, index) => (
                                    <TransactionItem 
                                        key={t.id} 
                                        transaction={t} 
                                        category={categoriesMap.get(t.categoryId || '')} 
                                        isSelected={selectedTransactions.has(t.id)} 
                                        onSelect={handleSelectTransaction} 
                                        style={{ animationDelay: `${index * 30}ms` }} 
                                        allTags={allTags} 
                                    />
                                ))}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-24 animate-fade-in">
                        <Inbox className="mx-auto h-16 w-16 text-muted-foreground/30" />
                        <h3 className="mt-6 text-lg font-semibold">Keine Einträge</h3>
                        <p className="mt-2 text-sm text-muted-foreground">Versuchen Sie einen anderen Filter oder Zeitraum.</p>
                    </div>
                )}
            </div>
        </section>
    );
};

export default TransactionList;
