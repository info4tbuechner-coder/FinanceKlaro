
export enum TransactionType {
  INCOME = 'income',
  EXPENSE = 'expense',
  SAVING = 'saving',
}

export enum CategoryType {
  INCOME = 'income',
  EXPENSE = 'expense',
}

export enum GoalType {
  GOAL = 'goal',
  SINKING_FUND = 'sinking_fund',
}

export enum Frequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
}

export enum LiabilityType {
  DEBT = 'debt',
  LOAN = 'loan',
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  description: string;
  date: string;
  categoryId?: string;
  goalId?: string;
  liabilityId?: string;
  tags?: string[];
}

export interface Liability {
  id: string;
  name: string;
  type: LiabilityType;
  initialAmount: number;
  paidAmount: number;
  interestRate: number;
  minMonthlyPayment: number;
}

export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  budget?: number;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  type: GoalType;
  monthlyContribution?: number;
  startDate?: string;
}

export interface RecurringTransaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  categoryId?: string;
  goalId?: string;
  frequency: Frequency;
  interval: number;
  startDate: string;
  endDate?: string;
  nextDueDate: string;
  isBill?: boolean;
}

export interface Project {
  id: string;
  name: string;
  incomeBudget?: number;
  expenseBudget?: number;
  tag: string;
}

export interface DashboardStats {
    income: number;
    expense: number;
    saving: number;
    balance: number;
    incomeTrend: number;
    expenseTrend: number;
    savingTrend: number;
    balanceTrend: number;
}

export type Theme = 'grandeur' | 'synthwave' | 'blockchain' | 'neon' | 'forest';

export type ViewMode = 'all' | 'private' | 'business';

export type DateRangePreset = 'this_month' | 'last_month' | 'this_year' | 'all_time' | 'custom';

export type ICStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface Filters {
    dateRange: {
        preset: DateRangePreset;
        from: string;
        to: string;
    };
    searchTerm: string;
    transactionType: TransactionType | 'all';
    categoryId: string | null;
    tags: string[];
}

export interface ReportsData {
    budgetOverviewData: {
        id: string;
        name: string;
        spent: number;
        budget: number;
        percentage: number;
    }[];
    expenseDataForPieChart: { name: string, value: number }[];
    projectReportData: {
        name: string;
        profit: number;
        data: {
            name: 'Einnahmen' | 'Ausgaben';
            value: number;
        }[];
    }[];
    cashflowData: {
        month: string;
        Einnahmen: number;
        Ausgaben: number;
    }[];
    sankeyData: {
        nodes: { name: string }[];
        links: { source: number; target: number; value: number }[];
    };
}


export type ModalType =
  | { type: 'ADD_TRANSACTION' }
  | { type: 'EDIT_TRANSACTION'; data: Transaction }
  | { type: 'SMART_SCAN' }
  | { type: 'MONTHLY_CHECK' }
  | { type: 'MANAGE_CATEGORIES' }
  | { type: 'MANAGE_GOALS' }
  | { type: 'MANAGE_PROJECTS' }
  | { type: 'MANAGE_RECURRING' }
  | { type: 'MANAGE_LIABILITIES' }
  | { type: 'EXPORT_IMPORT_DATA' }
  | { type: 'TAX_EXPORT' }
  | { type: 'SUBSCRIPTION' }
  | { type: 'SYNC_DATA' }
  | { type: 'MERGE_TRANSACTIONS'; data: { transactionIds: string[] } }
  | { type: 'DEBT_PAYDOWN_PLAN' }
  | { type: 'ANALYSIS' };

export interface AppState {
    transactions: Transaction[];
    categories: Category[];
    goals: Goal[];
    projects: Project[];
    recurringTransactions: RecurringTransaction[];
    liabilities: Liability[];
    theme: Theme;
    viewMode: ViewMode;
    filters: Filters;
    isSubscribed: boolean;
    activeModal: ModalType | null;
    selectedTransactions: Set<string>;
    icStatus: ICStatus;
    icPrincipal: string | null;
    activeSidebarTab: string;
    privacyMode: boolean;
}

export type SyncedAppState = Omit<AppState, 'activeModal' | 'selectedTransactions' | 'icStatus' | 'icPrincipal' | 'activeSidebarTab'>;
