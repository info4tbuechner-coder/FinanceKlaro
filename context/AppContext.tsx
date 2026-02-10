
import React, { createContext, useContext, useMemo, useEffect, useReducer } from 'react';
import { Transaction, Category, Goal, Project, RecurringTransaction, Theme, ViewMode, Filters, ModalType, TransactionType, CategoryType, GoalType, Frequency, DateRangePreset, ReportsData, DashboardStats, AppState, ICStatus, SyncedAppState, Liability, LiabilityType } from '../types';
import useLocalStorage from '../hooks/useLocalStorage';
import { format } from 'date-fns/format';
import { startOfMonth } from 'date-fns/startOfMonth';
import { endOfMonth } from 'date-fns/endOfMonth';
import { startOfYear } from 'date-fns/startOfYear';
import { endOfYear } from 'date-fns/endOfYear';
import { subMonths } from 'date-fns/subMonths';
import { sub } from 'date-fns/sub';
import { parseISO } from 'date-fns/parseISO';
import { addDays } from 'date-fns/addDays';
import { addWeeks } from 'date-fns/addWeeks';
import { addMonths } from 'date-fns/addMonths';
import { addYears } from 'date-fns/addYears';
import { isBefore } from 'date-fns/isBefore';
import { startOfToday } from 'date-fns/startOfToday';
import de from 'date-fns/locale/de';

const AppStateContext = createContext<AppState | undefined>(undefined);
const AppDispatchContext = createContext<React.Dispatch<Action> | undefined>(undefined);

const initialFilters: Filters = {
    dateRange: {
        preset: 'this_month',
        from: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
        to: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
    },
    searchTerm: '',
    transactionType: 'all',
    categoryId: null,
    tags: [],
};

const sampleData = {
    transactions: [
        { id: '1', type: TransactionType.INCOME, amount: 3200, description: 'Gehalt', date: format(new Date(), 'yyyy-MM-dd'), categoryId: 'c1' },
        { id: '2', type: TransactionType.EXPENSE, amount: 850, description: 'Miete', date: format(new Date(), 'yyyy-MM-01'), categoryId: 'c2', tags: ['privat'] },
        { id: '3', type: TransactionType.EXPENSE, amount: 75.50, description: 'Wocheneinkauf', date: format(subMonths(new Date(), 1), 'yyyy-MM-20'), categoryId: 'c3', tags: ['privat'] },
        { id: '4', type: TransactionType.SAVING, amount: 200, description: 'ETF Sparplan', date: format(new Date(), 'yyyy-MM-15'), categoryId: 'c4', goalId: 'g1' },
        { id: '5', type: TransactionType.INCOME, amount: 500, description: 'Freiberufliches Projekt', date: format(new Date(), 'yyyy-MM-10'), categoryId: 'c5', tags: ['business', 'projekt-alpha'] },
        { id: '6', type: TransactionType.EXPENSE, amount: 49.99, description: 'Software-Abo', date: format(new Date(), 'yyyy-MM-05'), categoryId: 'c6', tags: ['business', 'projekt-alpha'] },
        { id: '7', type: TransactionType.EXPENSE, amount: 120.00, description: 'Versicherung', date: format(new Date(), 'yyyy-MM-02'), categoryId: 'c2', tags: ['privat'] },
        { id: 't-l1', type: TransactionType.EXPENSE, amount: 500, description: 'Kreditrate Auto', date: format(new Date(), 'yyyy-MM-01'), liabilityId: 'l1', categoryId: 'c7' },
    ],
    categories: [
        { id: 'c1', name: 'Gehalt', type: CategoryType.INCOME },
        { id: 'c2', name: 'Wohnen', type: CategoryType.EXPENSE, budget: 1000 },
        { id: 'c3', name: 'Lebensmittel', type: CategoryType.EXPENSE, budget: 400 },
        { id: 'c4', name: 'Investments', type: CategoryType.EXPENSE },
        { id: 'c5', name: 'Freiberuflich', type: CategoryType.INCOME },
        { id: 'c6', name: 'Software', type: CategoryType.EXPENSE, budget: 100 },
        { id: 'c7', name: 'Kredit', type: CategoryType.EXPENSE },
    ],
    goals: [
        { id: 'g1', name: 'Neues Auto', targetAmount: 20000, currentAmount: 0, type: GoalType.GOAL },
        { id: 'g2', name: 'Urlaub', targetAmount: 1500, currentAmount: 0, type: GoalType.SINKING_FUND },
    ],
    projects: [
        { id: 'p1', name: 'Projekt Alpha', tag: 'projekt-alpha' },
    ],
    recurringTransactions: [
        { id: 'r1', description: 'Miete', amount: 850, type: TransactionType.EXPENSE, categoryId: 'c2', frequency: Frequency.MONTHLY, interval: 1, startDate: '2023-01-01', nextDueDate: format(addDays(new Date(), 5), 'yyyy-MM-dd'), isBill: true },
        { id: 'r2', description: 'Handyvertrag', amount: 35, type: TransactionType.EXPENSE, categoryId: 'c2', frequency: Frequency.MONTHLY, interval: 1, startDate: '2023-01-01', nextDueDate: format(new Date(), 'yyyy-MM-dd'), isBill: true },
        { id: 'r3', description: 'Versicherung', amount: 120, type: TransactionType.EXPENSE, categoryId: 'c2', frequency: Frequency.YEARLY, interval: 1, startDate: '2023-01-01', nextDueDate: format(addDays(new Date(), 40), 'yyyy-MM-dd'), isBill: true },
    ],
    liabilities: [
        { id: 'l1', name: 'Autokredit', type: LiabilityType.DEBT, initialAmount: 15000, paidAmount: 0, interestRate: 3.5, minMonthlyPayment: 500 },
        { id: 'l2', name: 'Studiendarlehen', type: LiabilityType.DEBT, initialAmount: 25000, paidAmount: 0, interestRate: 1.8, minMonthlyPayment: 250 },
        { id: 'l3', name: 'Darlehen an Freund', type: LiabilityType.LOAN, initialAmount: 1000, paidAmount: 0, interestRate: 0, minMonthlyPayment: 100 },
    ],
};

const initialState: AppState = {
    transactions: sampleData.transactions,
    categories: sampleData.categories,
    goals: sampleData.goals,
    projects: sampleData.projects,
    recurringTransactions: sampleData.recurringTransactions,
    liabilities: sampleData.liabilities,
    theme: 'grandeur',
    viewMode: 'all',
    filters: initialFilters,
    isSubscribed: false,
    activeModal: null,
    selectedTransactions: new Set(),
    icStatus: 'disconnected',
    icPrincipal: null,
    activeSidebarTab: 'Bericht',
    privacyMode: false,
};

type Action =
    | { type: 'SET_THEME'; payload: Theme }
    | { type: 'SET_VIEW_MODE'; payload: ViewMode }
    | { type: 'UPDATE_FILTERS'; payload: Partial<Filters> }
    | { type: 'SET_IS_SUBSCRIBED'; payload: boolean }
    | { type: 'ADD_TRANSACTION'; payload: Omit<Transaction, 'id'> }
    | { type: 'UPDATE_TRANSACTION'; payload: Transaction }
    | { type: 'DELETE_TRANSACTIONS'; payload: string[] }
    | { type: 'CATEGORIZE_TRANSACTIONS'; payload: { ids: string[]; categoryId: string } }
    | { type: 'MERGE_TRANSACTIONS'; payload: { transactionIds: string[]; newDescription: string } }
    | { type: 'ADD_CATEGORY'; payload: Omit<Category, 'id'> }
    | { type: 'UPDATE_CATEGORY'; payload: Category }
    | { type: 'DELETE_CATEGORY'; payload: string }
    | { type: 'DELETE_UNUSED_CATEGORIES' }
    | { type: 'ADD_GOAL'; payload: Omit<Goal, 'id' | 'currentAmount'> }
    | { type: 'UPDATE_GOAL'; payload: Goal }
    | { type: 'DELETE_GOAL'; payload: string }
    | { type: 'ADD_LIABILITY'; payload: Omit<Liability, 'id' | 'paidAmount'> }
    | { type: 'UPDATE_LIABILITY'; payload: Liability }
    | { type: 'DELETE_LIABILITY'; payload: string }
    | { type: 'ADD_PROJECT'; payload: Omit<Project, 'id'> }
    | { type: 'DELETE_PROJECT'; payload: string }
    | { type: 'ADD_RECURRING'; payload: Omit<RecurringTransaction, 'id' | 'nextDueDate'> }
    | { type: 'UPDATE_RECURRING'; payload: RecurringTransaction }
    | { type: 'DELETE_RECURRING'; payload: string }
    | { type: 'IMPORT_DATA'; payload: SyncedAppState }
    | { type: 'OPEN_MODAL'; payload: ModalType }
    | { type: 'CLOSE_MODAL' }
    | { type: 'SET_SELECTED_TRANSACTIONS'; payload: React.SetStateAction<Set<string>> }
    | { type: 'SET_IC_STATUS'; payload: ICStatus }
    | { type: 'SET_IC_PRINCIPAL'; payload: string | null }
    | { type: 'PAY_BILL'; payload: string }
    | { type: 'SET_ACTIVE_SIDEBAR_TAB'; payload: string }
    | { type: 'TOGGLE_PRIVACY_MODE' };


const recalculateGoalAmounts = (transactions: Transaction[], goals: Goal[]): Goal[] => {
    return goals.map(g => ({
        ...g,
        currentAmount: transactions
            .filter(t => t.type === TransactionType.SAVING && t.goalId === g.id)
            .reduce((sum, t) => sum + t.amount, 0)
    }));
};

const recalculateLiabilityAmounts = (transactions: Transaction[], liabilities: Liability[]): Liability[] => {
    return liabilities.map(l => {
        const relevantTransactionType = l.type === LiabilityType.DEBT ? TransactionType.EXPENSE : TransactionType.INCOME;
        const totalPaid = transactions
            .filter(t => t.liabilityId === l.id && t.type === relevantTransactionType)
            .reduce((sum, t) => sum + t.amount, 0);

        return {
            ...l,
            paidAmount: Math.min(totalPaid, l.initialAmount),
        };
    });
};

const calculateNextDueDate = (rt: { startDate: string; frequency: Frequency; interval: number; endDate?: string; }): string => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let nextDate = parseISO(rt.startDate);

    if (isBefore(nextDate, today)) {
        const addFn = {
            [Frequency.DAILY]: addDays,
            [Frequency.WEEKLY]: addWeeks,
            [Frequency.MONTHLY]: addMonths,
            [Frequency.YEARLY]: addYears,
        }[rt.frequency];

        while (isBefore(nextDate, today)) {
            nextDate = addFn(nextDate, rt.interval);
        }
    }
    
    if (rt.endDate && isBefore(parseISO(rt.endDate), nextDate)) {
        return '';
    }
    
    return format(nextDate, 'yyyy-MM-dd');
};

function appReducer(state: AppState, action: Action): AppState {
    switch (action.type) {
        case 'SET_THEME': return { ...state, theme: action.payload };
        case 'SET_VIEW_MODE': return { ...state, viewMode: action.payload };
        case 'SET_IS_SUBSCRIBED': return { ...state, isSubscribed: action.payload };
        case 'OPEN_MODAL': return { ...state, activeModal: action.payload };
        case 'CLOSE_MODAL': return { ...state, activeModal: null, selectedTransactions: new Set() };
        case 'SET_IC_STATUS': return { ...state, icStatus: action.payload };
        case 'SET_IC_PRINCIPAL': return { ...state, icPrincipal: action.payload };
        case 'SET_ACTIVE_SIDEBAR_TAB': return { ...state, activeSidebarTab: action.payload };
        case 'TOGGLE_PRIVACY_MODE': return { ...state, privacyMode: !state.privacyMode };
        case 'SET_SELECTED_TRANSACTIONS': {
            const newSet = typeof action.payload === 'function' ? action.payload(state.selectedTransactions) : action.payload;
            return { ...state, selectedTransactions: newSet };
        }
        case 'UPDATE_FILTERS': {
            const updatedFilters = { ...state.filters, ...action.payload };
            if (action.payload.dateRange && action.payload.dateRange.preset !== state.filters.dateRange.preset) {
                const now = new Date();
                switch (action.payload.dateRange.preset) {
                    case 'this_month':
                        updatedFilters.dateRange.from = format(startOfMonth(now), 'yyyy-MM-dd');
                        updatedFilters.dateRange.to = format(endOfMonth(now), 'yyyy-MM-dd');
                        break;
                    case 'last_month':
                        const lastMonth = subMonths(now, 1);
                        updatedFilters.dateRange.from = format(startOfMonth(lastMonth), 'yyyy-MM-dd');
                        updatedFilters.dateRange.to = format(endOfMonth(lastMonth), 'yyyy-MM-dd');
                        break;
                    case 'this_year':
                        updatedFilters.dateRange.from = format(startOfYear(now), 'yyyy-MM-dd');
                        updatedFilters.dateRange.to = format(endOfYear(now), 'yyyy-MM-dd');
                        break;
                     case 'all_time':
                         updatedFilters.dateRange.from = '1970-01-01';
                         updatedFilters.dateRange.to = format(new Date(), 'yyyy-MM-dd');
                         break;
                }
            }
            return { ...state, filters: updatedFilters };
        }
        case 'ADD_TRANSACTION': {
            const newTransaction = { ...action.payload, id: crypto.randomUUID() };
            const transactions = [...state.transactions, newTransaction];
            const goals = recalculateGoalAmounts(transactions, state.goals);
            const liabilities = recalculateLiabilityAmounts(transactions, state.liabilities);
            return { ...state, transactions, goals, liabilities, activeModal: null };
        }
        case 'UPDATE_TRANSACTION': {
            const transactions = state.transactions.map(t => t.id === action.payload.id ? action.payload : t);
            const goals = recalculateGoalAmounts(transactions, state.goals);
            const liabilities = recalculateLiabilityAmounts(transactions, state.liabilities);
            return { ...state, transactions, goals, liabilities, activeModal: null };
        }
        case 'DELETE_TRANSACTIONS': {
            const idSet = new Set(action.payload);
            const transactions = state.transactions.filter(t => !idSet.has(t.id));
            const goals = recalculateGoalAmounts(transactions, state.goals);
            const liabilities = recalculateLiabilityAmounts(transactions, state.liabilities);
            return { ...state, transactions, goals, liabilities, selectedTransactions: new Set() };
        }
        case 'PAY_BILL': {
            const rtId = action.payload;
            const rt = state.recurringTransactions.find(r => r.id === rtId);
            if (!rt || !rt.nextDueDate) return state;

            const newTransaction: Omit<Transaction, 'id'> = {
                type: rt.type,
                amount: rt.amount,
                description: `Zahlung für: ${rt.description}`,
                date: new Date().toISOString().split('T')[0],
                categoryId: rt.categoryId,
                tags: rt.isBill ? ['rechnung', ...rt.description.toLowerCase().split(' ')] : [],
            };
            const transactions = [...state.transactions, { ...newTransaction, id: crypto.randomUUID() }];

            const addFn = {
                [Frequency.DAILY]: addDays,
                [Frequency.WEEKLY]: addWeeks,
                [Frequency.MONTHLY]: addMonths,
                [Frequency.YEARLY]: addYears,
            }[rt.frequency];

            let nextDueDate = parseISO(rt.nextDueDate);
            const today = startOfToday();
            
            do {
                nextDueDate = addFn(nextDueDate, rt.interval);
            } while (isBefore(nextDueDate, today));

            const updatedRt = { ...rt, nextDueDate: format(nextDueDate, 'yyyy-MM-dd') };
            
            if (rt.endDate && isBefore(parseISO(rt.endDate), nextDueDate)) {
                updatedRt.nextDueDate = ''; 
            }

            const recurringTransactions = state.recurringTransactions.map(r => r.id === rtId ? updatedRt : r);
            const goals = recalculateGoalAmounts(transactions, state.goals);
            const liabilities = recalculateLiabilityAmounts(transactions, state.liabilities);

            return { ...state, transactions, recurringTransactions, goals, liabilities };
        }
        case 'CATEGORIZE_TRANSACTIONS': {
            const idSet = new Set(action.payload.ids);
            const transactions = state.transactions.map(t => idSet.has(t.id) ? { ...t, categoryId: action.payload.categoryId } : t);
            return { ...state, transactions, selectedTransactions: new Set() };
        }
        case 'MERGE_TRANSACTIONS': {
            const { transactionIds, newDescription } = action.payload;
            const idSet = new Set(transactionIds);
            const transactionsToMerge = state.transactions.filter(t => idSet.has(t.id));
            if (transactionsToMerge.length < 2) return state;

            const firstType = transactionsToMerge[0].type;
            if (!transactionsToMerge.every(t => t.type === firstType)) {
                alert("Zusammenführen fehlgeschlagen: Transaktionen müssen vom gleichen Typ sein.");
                return state;
            }

            const totalAmount = transactionsToMerge.reduce((sum, t) => sum + t.amount, 0);
            const combinedTags = [...new Set(transactionsToMerge.flatMap(t => t.tags || []))];
            const latestDate = transactionsToMerge.reduce((latest, t) => (t.date > latest ? t.date : latest), transactionsToMerge[0].date);
            const firstCategoryId = transactionsToMerge[0].categoryId;
            const commonCategoryId = transactionsToMerge.every(t => t.categoryId === firstCategoryId) ? firstCategoryId : undefined;

            const mergedTransaction: Transaction = {
                id: crypto.randomUUID(), type: firstType, amount: totalAmount, description: newDescription,
                date: latestDate, categoryId: commonCategoryId, tags: combinedTags,
            };
            
            const remainingTransactions = state.transactions.filter(t => !idSet.has(t.id));
            const transactions = [...remainingTransactions, mergedTransaction];
            const goals = recalculateGoalAmounts(transactions, state.goals);
            const liabilities = recalculateLiabilityAmounts(transactions, state.liabilities);
            return { ...state, transactions, goals, liabilities, activeModal: null, selectedTransactions: new Set() };
        }
        case 'ADD_CATEGORY': {
            const newCategory = { ...action.payload, id: crypto.randomUUID() };
            return { ...state, categories: [...state.categories, newCategory] };
        }
        case 'UPDATE_CATEGORY': {
            const categories = state.categories.map(c => c.id === action.payload.id ? action.payload : c);
            return { ...state, categories };
        }
        case 'DELETE_CATEGORY': {
            const categoryId = action.payload;
            const transactions = state.transactions.map(t => t.categoryId === categoryId ? { ...t, categoryId: undefined } : t);
            const categories = state.categories.filter(c => c.id !== categoryId);
            return { ...state, transactions, categories };
        }
        case 'ADD_GOAL': {
            const newGoal = { ...action.payload, id: crypto.randomUUID(), currentAmount: 0 };
            return { ...state, goals: [...state.goals, newGoal] };
        }
        case 'UPDATE_GOAL': {
            const goals = state.goals.map(g => g.id === action.payload.id ? action.payload : g);
            return { ...state, goals };
        }
        case 'DELETE_GOAL': {
            const goalIdToDelete = action.payload;
            const transactions = state.transactions.map(t => 
                t.goalId === goalIdToDelete ? { ...t, goalId: undefined } : t
            );
            const goals = state.goals.filter(g => g.id !== goalIdToDelete);
            return { ...state, transactions, goals };
        }
        case 'ADD_LIABILITY': {
            const newLiability = { ...action.payload, id: crypto.randomUUID(), paidAmount: 0 };
            return { ...state, liabilities: [...state.liabilities, newLiability] };
        }
        case 'UPDATE_LIABILITY': {
            const liabilities = state.liabilities.map(l => l.id === action.payload.id ? action.payload : l);
            const transactions = state.transactions;
            const updatedLiabilities = recalculateLiabilityAmounts(transactions, liabilities);
            return { ...state, liabilities: updatedLiabilities };
        }
        case 'DELETE_LIABILITY': {
            const liabilityIdToDelete = action.payload;
            const transactions = state.transactions.map(t => 
                t.liabilityId === liabilityIdToDelete ? { ...t, liabilityId: undefined } : t
            );
            const liabilities = state.liabilities.filter(l => l.id !== liabilityIdToDelete);
            return { ...state, transactions, liabilities };
        }
        case 'ADD_RECURRING': {
            const nextDueDate = calculateNextDueDate({ ...action.payload });
            if (!nextDueDate) return state; 
            const newRt = { ...action.payload, id: crypto.randomUUID(), nextDueDate };
            return { ...state, recurringTransactions: [...state.recurringTransactions, newRt] };
        }
        case 'UPDATE_RECURRING': {
            const { nextDueDate, ...data } = action.payload;
            const newNextDueDate = calculateNextDueDate(data);
            if (!newNextDueDate) { 
                return { ...state, recurringTransactions: state.recurringTransactions.filter(r => r.id !== data.id) };
            }
            const updatedRt = { ...data, nextDueDate: newNextDueDate };
            const recurringTransactions = state.recurringTransactions.map(rt => rt.id === updatedRt.id ? updatedRt : rt);
            return { ...state, recurringTransactions };
        }
         case 'DELETE_RECURRING': {
            return { ...state, recurringTransactions: state.recurringTransactions.filter(rt => rt.id !== action.payload) };
        }
        case 'IMPORT_DATA': {
            const { theme, viewMode, filters, isSubscribed, privacyMode, ...dataToSync } = action.payload;
            return { ...state, ...dataToSync };
        }
        default: return state;
    }
}

export const useUpcomingBills = () => {
    const { recurringTransactions } = useAppState();

    return useMemo(() => {
        const today = startOfToday();
        
        const upcoming = recurringTransactions
            .filter(rt => rt.isBill && rt.nextDueDate)
            .map(rt => ({ ...rt, dueDate: parseISO(rt.nextDueDate) }))
            .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());

        const dueOrOverdueCount = upcoming.filter(rt => isBefore(rt.dueDate, addDays(today, 1))).length;

        return {
            upcomingBills: upcoming,
            dueOrOverdueCount: dueOrOverdueCount,
        };
    }, [recurringTransactions]);
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [storedState, setStoredState] = useLocalStorage<AppState>('klaro-state', initialState);

    useEffect(() => {
        setStoredState(prevState => ({
            ...prevState,
            goals: recalculateGoalAmounts(prevState.transactions, prevState.goals),
            liabilities: recalculateLiabilityAmounts(prevState.transactions, prevState.liabilities),
        }));
    }, []); 

    const [state, dispatch] = useReducer(appReducer, storedState);

    useEffect(() => {
        setStoredState(state);
    }, [state, setStoredState]);

    return (
        <AppStateContext.Provider value={state}>
            <AppDispatchContext.Provider value={dispatch}>
                {children}
            </AppDispatchContext.Provider>
        </AppStateContext.Provider>
    );
};

export const useAppState = (): AppState => {
    const context = useContext(AppStateContext);
    if (context === undefined) {
        throw new Error('useAppState must be used within an AppProvider');
    }
    return context;
};

export const useAppDispatch = (): React.Dispatch<Action> => {
    const context = useContext(AppDispatchContext);
    if (context === undefined) {
        throw new Error('useAppDispatch must be used within an AppProvider');
    }
    return context;
};
