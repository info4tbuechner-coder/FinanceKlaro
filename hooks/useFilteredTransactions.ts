import { useMemo } from 'react';
import { useAppState } from '../context/AppContext';
import { Transaction } from '../types';
// Fix: Switched to direct submodule imports for date-fns to resolve module export errors.
import { parseISO } from 'date-fns/parseISO';
import { isWithinInterval } from 'date-fns/isWithinInterval';

const useFilteredTransactions = (): Transaction[] => {
    const { transactions, filters, viewMode } = useAppState();

    return useMemo(() => {
        const startStr = filters.dateRange.from;
        const endStr = filters.dateRange.to;

        return transactions
            .filter(t => {
                // Date range filter (string comparison works for yyyy-MM-dd)
                if (t.date < startStr || t.date > endStr) return false;

                // ViewMode filter
                if (viewMode === 'private' && t.tags?.includes('business')) return false;
                if (viewMode === 'business' && !t.tags?.includes('business')) return false;

                // Transaction type filter
                if (filters.transactionType !== 'all' && t.type !== filters.transactionType) return false;

                // Category filter
                if (filters.categoryId && t.categoryId !== filters.categoryId) return false;

                // Search term filter
                const searchTerm = filters.searchTerm.toLowerCase();
                if (searchTerm) {
                    const descriptionMatch = t.description.toLowerCase().includes(searchTerm);
                    const tagMatch = t.tags?.some(tag => tag.toLowerCase().includes(searchTerm));
                    const amountMatch = t.amount.toString().includes(searchTerm);
                    if (!descriptionMatch && !tagMatch && !amountMatch) return false;
                }

                // Tags filter
                if (filters.tags.length > 0) {
                    if (!t.tags || !filters.tags.some(filterTag => t.tags?.includes(filterTag))) return false;
                }

                return true;
            })
            .sort((a, b) => b.date.localeCompare(a.date));
    }, [transactions, filters, viewMode]);
};

export default useFilteredTransactions;