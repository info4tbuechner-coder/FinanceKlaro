
import { useMemo } from 'react';
import { useAppState } from '../context/AppContext';
import useFilteredTransactions from './useFilteredTransactions';
import { TransactionType, CategoryType, ReportsData } from '../types';
// Fix: Switched to direct submodule imports for date-fns to resolve module export errors.
import { format } from 'date-fns/format';
import { subMonths } from 'date-fns/subMonths';
import { startOfMonth } from 'date-fns/startOfMonth';
import { parseISO } from 'date-fns/parseISO';
import { endOfMonth } from 'date-fns/endOfMonth';
// Fix: Use direct import for locale to prevent type errors.
import { de } from 'date-fns/locale/de';

const useReportsData = (): ReportsData => {
    const { categories, projects, transactions: allTransactions } = useAppState();
    const filteredTransactions = useFilteredTransactions();

    const budgetOverviewData = useMemo(() => {
        const expenseCategoriesWithBudget = categories.filter(c => c.type === CategoryType.EXPENSE && c.budget && c.budget > 0);
        if (expenseCategoriesWithBudget.length === 0) return [];

        const spentByCategory = filteredTransactions.reduce((acc, t) => {
            if (t.type === TransactionType.EXPENSE && t.categoryId) {
                acc[t.categoryId] = (acc[t.categoryId] || 0) + t.amount;
            }
            return acc;
        }, {} as Record<string, number>);
        
        return expenseCategoriesWithBudget.map(category => {
            const spent = spentByCategory[category.id] || 0;
            return {
                id: category.id,
                name: category.name,
                spent,
                budget: category.budget || 0,
                percentage: category.budget ? (spent / category.budget) * 100 : 0,
            };
        }).sort((a,b) => b.percentage - a.percentage);
    }, [categories, filteredTransactions]);

    const expenseDataForPieChart = useMemo(() => {
        const categoryMap = new Map(categories.map(c => [c.id, c.name]));
        const expenseByCategory = filteredTransactions.reduce((acc, t) => {
            if (t.type === TransactionType.EXPENSE && t.amount > 0) {
                const categoryName = (t.categoryId && categoryMap.get(t.categoryId)) || 'Unkategorisiert';
                acc[categoryName] = (acc[categoryName] || 0) + t.amount;
            }
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(expenseByCategory)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }, [categories, filteredTransactions]);

    const projectReportData = useMemo(() => {
        return projects.map((project): ReportsData['projectReportData'][number] => {
            const projectTransactions = filteredTransactions.filter(t => t.tags?.includes(project.tag));
            let income = 0;
            let expense = 0;
            projectTransactions.forEach(t => {
                if (t.type === TransactionType.INCOME) income += t.amount;
                else if (t.type === TransactionType.EXPENSE) expense += t.amount;
            });

            return {
                name: project.name,
                profit: income - expense,
                data: [
                    { name: 'Einnahmen', value: income },
                    { name: 'Ausgaben', value: expense },
                ]
            };
        });
    }, [projects, filteredTransactions]);

    const cashflowData = useMemo(() => {
        const data: { month: string; Einnahmen: number; Ausgaben: number }[] = [];
        const today = new Date();
        
        // Pre-calculate month boundaries to avoid redundant date operations
        const months = Array.from({ length: 12 }, (_, i) => {
            const date = subMonths(today, 11 - i);
            return {
                date,
                start: format(startOfMonth(date), 'yyyy-MM-dd'),
                end: format(endOfMonth(date), 'yyyy-MM-dd'),
                label: format(date, 'MMM', { locale: de as any })
            };
        });

        months.forEach(m => {
            let income = 0;
            let expense = 0;
            
            // Single pass over all transactions for each month is still O(12 * N)
            // but we can optimize by grouping all transactions by month first.
            allTransactions.forEach(t => {
                if (t.date >= m.start && t.date <= m.end) {
                    if (t.type === TransactionType.INCOME) income += t.amount;
                    else if (t.type === TransactionType.EXPENSE) expense += t.amount;
                }
            });

            data.push({
                month: m.label,
                Einnahmen: income,
                Ausgaben: expense,
            });
        });
        return data;
    }, [allTransactions]);

    const sankeyData = useMemo(() => {
        const nodes: { name: string }[] = [];
        const links: { source: number; target: number; value: number }[] = [];
        const nodeMap = new Map<string, number>();

        const addNode = (name: string) => {
            if (!nodeMap.has(name)) {
                nodeMap.set(name, nodes.length);
                nodes.push({ name });
            }
            return nodeMap.get(name)!;
        };

        const incomeSourceIndex = addNode('Einkommen');
        
        const incomeCategories = categories.filter(c => c.type === CategoryType.INCOME);
        const incomeCategoryMap = new Map(incomeCategories.map(c => [c.id, c.name]));
        
        filteredTransactions.forEach(t => {
            if (t.type === TransactionType.INCOME && t.categoryId && t.amount > 0) {
                const categoryName = incomeCategoryMap.get(t.categoryId) || 'Sonstiges Einkommen';
                const sourceIndex = addNode(categoryName);
                links.push({ source: sourceIndex, target: incomeSourceIndex, value: t.amount });
            }
        });

        const expenseCategories = categories.filter(c => c.type === CategoryType.EXPENSE);
        const expenseCategoryMap = new Map(expenseCategories.map(c => [c.id, c.name]));

        filteredTransactions.forEach(t => {
            if (t.type === TransactionType.EXPENSE && t.categoryId && t.amount > 0) {
                const targetIndex = addNode(expenseCategoryMap.get(t.categoryId) || 'Unkategorisiert');
                links.push({ source: incomeSourceIndex, target: targetIndex, value: t.amount });
            }
        });

        return { nodes, links };
    }, [filteredTransactions, categories]);

    return {
        budgetOverviewData,
        expenseDataForPieChart,
        projectReportData,
        cashflowData,
        sankeyData,
    };
};

export default useReportsData;
