import { useMemo } from 'react';
import { useAppState } from '../context/AppContext';
import useFilteredTransactions from './useFilteredTransactions';
import { Transaction, TransactionType, DashboardStats } from '../types';
// Fix: Switched to direct submodule imports for date-fns to resolve module export errors.
import { parseISO } from 'date-fns/parseISO';
import { sub } from 'date-fns/sub';
import { differenceInDays } from 'date-fns/differenceInDays';

const calculateStats = (transactions: Transaction[]): Omit<DashboardStats, 'incomeTrend' | 'expenseTrend' | 'savingTrend' | 'balanceTrend'> => {
    const stats = transactions.reduce((acc, t) => {
        if (t.type === TransactionType.INCOME) acc.income += t.amount;
        else if (t.type === TransactionType.EXPENSE) acc.expense += t.amount;
        else if (t.type === TransactionType.SAVING) acc.saving += t.amount;
        return acc;
    }, { income: 0, expense: 0, saving: 0 });
    
    return { ...stats, balance: stats.income - stats.expense - stats.saving };
};

const calculateTrend = (current: number, previous: number): number => {
    if (previous === 0) {
        return current > 0 ? 100 : 0;
    }
    if (current === previous) {
        return 0;
    }
    return ((current - previous) / Math.abs(previous)) * 100;
};

const useDashboardStats = (): DashboardStats => {
    const { transactions: allTransactions, filters } = useAppState();
    const currentPeriodTransactions = useFilteredTransactions();

    const stats = useMemo(() => {
        const currentStats = calculateStats(currentPeriodTransactions);

        let previousPeriodFrom: Date;
        let previousPeriodTo: Date;
        const currentFrom = parseISO(filters.dateRange.from);
        const currentTo = parseISO(filters.dateRange.to);

        if (filters.dateRange.preset === 'all_time') {
             return { ...currentStats, incomeTrend: 0, expenseTrend: 0, savingTrend: 0, balanceTrend: 0 };
        } else if (filters.dateRange.preset === 'this_month' || filters.dateRange.preset === 'last_month') {
             const subUnit = { months: 1 };
             previousPeriodFrom = sub(currentFrom, subUnit);
             previousPeriodTo = sub(currentTo, subUnit);
        } else if (filters.dateRange.preset === 'this_year') {
             const subUnit = { years: 1 };
             previousPeriodFrom = sub(currentFrom, subUnit);
             previousPeriodTo = sub(currentTo, subUnit);
        } else { // custom
            const durationDays = differenceInDays(currentTo, currentFrom) + 1;
            previousPeriodTo = sub(currentFrom, { days: 1 });
            previousPeriodFrom = sub(previousPeriodTo, { days: durationDays - 1 });
        }
        
        previousPeriodTo.setHours(23, 59, 59, 999);

        const previousPeriodTransactions = allTransactions.filter(t => {
            const transactionDate = parseISO(t.date);
            return transactionDate >= previousPeriodFrom && transactionDate <= previousPeriodTo;
        });

        const previousStats = calculateStats(previousPeriodTransactions);

        return {
            ...currentStats,
            incomeTrend: calculateTrend(currentStats.income, previousStats.income),
            expenseTrend: calculateTrend(currentStats.expense, previousStats.expense),
            savingTrend: calculateTrend(currentStats.saving, previousStats.saving),
            balanceTrend: calculateTrend(currentStats.balance, previousStats.balance),
        };

    }, [currentPeriodTransactions, allTransactions, filters.dateRange]);

    return stats;
};

export default useDashboardStats;