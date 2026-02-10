
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
import de from 'date-fns/locale/de';

const useReportsData = (): ReportsData => {
    const { categories, projects, transactions: allTransactions } = useAppState();
    const filteredTransactions = useFilteredTransactions();

    const budgetOverviewData = useMemo(() => {
        const expenseCategoriesWithBudget = categories.filter(c => c.type === CategoryType.EXPENSE && c.budget && c.budget > 0);
        
        return expenseCategoriesWithBudget.map(category => {
            const spent = filteredTransactions
                .filter(t => t.categoryId === category.id && t.type === TransactionType.EXPENSE)
                .reduce((sum, t) => sum + t.amount, 0);
            
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
        const expenseByCategory = filteredTransactions
            .filter(t => t.type === TransactionType.EXPENSE && t.amount > 0)
            .reduce((acc, t) => {
                const categoryName = categories.find(c => c.id === t.categoryId)?.name || 'Unkategorisiert';
                acc[categoryName] = (acc[categoryName] || 0) + t.amount;
                return acc;
            }, {} as { [key: string]: number });

        return Object.entries(expenseByCategory)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }, [categories, filteredTransactions]);

    const projectReportData = useMemo(() => {
        // Fix: Add explicit type annotation to map callback to ensure correct type inference.
        return projects.map((project): ReportsData['projectReportData'][number] => {
            const projectTransactions = filteredTransactions.filter(t => t.tags?.includes(project.tag));
            const income = projectTransactions.filter(t => t.type === TransactionType.INCOME).reduce((sum, t) => sum + t.amount, 0);
            const expense = projectTransactions.filter(t => t.type === TransactionType.EXPENSE).reduce((sum, t) => sum + t.amount, 0);

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
        for (let i = 11; i >= 0; i--) {
            const date = subMonths(today, i);
            const monthStart = startOfMonth(date);
            const monthEnd = endOfMonth(date);

            const monthTransactions = allTransactions.filter(t => {
                const tDate = parseISO(t.date);
                return tDate >= monthStart && tDate <= monthEnd;
            });

            const income = monthTransactions.filter(t => t.type === TransactionType.INCOME).reduce((sum, t) => sum + t.amount, 0);
            const expense = monthTransactions.filter(t => t.type === TransactionType.EXPENSE).reduce((sum, t) => sum + t.amount, 0);
            
            data.push({
                // Fix: Cast locale to any to handle module resolution differences in build env
                month: format(date, 'MMM', { locale: de as any }),
                Einnahmen: income,
                Ausgaben: expense,
            });
        }
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
