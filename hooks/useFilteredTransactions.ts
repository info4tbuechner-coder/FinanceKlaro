import { useMemo } from 'react';
import { useAppState } from '../context/AppContext';
import { Transaction } from '../types';
// Fix: Switched to direct submodule imports for date-fns to resolve module export errors.
import { parseISO } from 'date-fns/parseISO';
import { isWithinInterval } from 'date-fns/isWithinInterval';

const useFilteredTransactions = (): Transaction[] => {
    const { transactions, filters, viewMode } = useAppState();

    return useMemo(() => {
        const startDate = parseISO(filters.dateRange.from);
        const endDate = parseISO(filters.dateRange.to);
        endDate.setHours(23, 59, 59, 999); // include transactions on the end date

        return transactions
            .filter(t => {
                // Date range filter
                const transactionDate = parseISO(t.date);
                return isWithinInterval(transactionDate, { start: startDate, end: endDate });
            })
            .filter(t => {
                // ViewMode filter
                if (viewMode === 'private') {
                    // Show transactions without a 'business' tag. This includes untagged transactions.
                    return !t.tags?.includes('business');
                }
                if (viewMode === 'business') {
                    return t.tags?.includes('business');
                }
                return true; // 'all'
            })
            .filter(t => {
                // Transaction type filter
                if (filters.transactionType === 'all') return true;
                return t.type === filters.transactionType;
            })
            .filter(t => {
                // Category filter
                if (!filters.categoryId) return true;
                return t.categoryId === filters.categoryId;
            })
            .filter(t => {
                // Search term filter
                const searchTerm = filters.searchTerm.toLowerCase();
                if (!searchTerm) return true;
                const descriptionMatch = t.description.toLowerCase().includes(searchTerm);
                const tagMatch = t.tags?.some(tag => tag.toLowerCase().includes(searchTerm));
                const amountMatch = t.amount.toString().includes(searchTerm);
                return descriptionMatch || tagMatch || amountMatch;
            })
            .filter(t => {
                // Tags filter (must have at least one of the selected tags)
                if (filters.tags.length === 0) return true;
                if (!t.tags || t.tags.length === 0) return false;
                return filters.tags.some(filterTag => t.tags?.includes(filterTag));
            })
            .sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());
    }, [transactions, filters, viewMode]);
};

export default useFilteredTransactions;