
import React, { memo } from 'react';
import { useAppState, useAppDispatch } from '../context/AppContext';
import useDashboardStats from '../hooks/useDashboardStats';
import useReportsData from '../hooks/useReportsData';
import { ArrowUpRight, ArrowDownRight, Minus, AlertCircle, TrendingUp, TrendingDown, Wallet, Landmark } from 'lucide-react';
import { formatCurrency, triggerHapticFeedback } from '../utils';

const StatCard: React.FC<{ title: string; amount: number; trend: number; icon: React.ReactNode }> = memo(({ title, amount, trend, icon }) => {
    const TrendIcon = trend > 0 ? ArrowUpRight : trend < 0 ? ArrowDownRight : Minus;
    const trendColor = trend > 0 ? 'text-success' : trend < 0 ? 'text-destructive' : 'text-muted-foreground';

    return (
        <div 
            onClick={() => triggerHapticFeedback('light')}
            className="glass-card stat-card-bg p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row items-start justify-between group transition-all duration-300 active:scale-[0.98] cursor-default"
        >
            <div className="w-full">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-muted-foreground text-xs sm:text-base font-medium truncate uppercase tracking-tighter">{title}</h3>
                    <div className="bg-primary/10 text-primary p-2 rounded-lg sm:hidden">
                        {/* Fix: Casting to React.ReactElement<any> to avoid type errors when adding props via cloneElement */}
                        {React.cloneElement(icon as React.ReactElement<any>, { size: 16 })}
                    </div>
                </div>
                <p className="text-xl sm:text-3xl font-bold text-foreground truncate" data-privacy>{formatCurrency(amount)}</p>
                 <div className={`mt-2 flex items-center text-[10px] sm:text-sm font-semibold ${trendColor}`}>
                    <TrendIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-0.5 sm:mr-1" />
                    <span>{Math.abs(trend).toFixed(0)}%</span>
                </div>
            </div>
             <div className="hidden sm:block bg-primary/10 text-primary p-3 rounded-lg transition-transform duration-300 group-hover:scale-110">
                {icon}
            </div>
        </div>
    );
});

const BudgetOverview: React.FC = () => {
    const { budgetOverviewData } = useReportsData();
    const { filters } = useAppState();
    const dispatch = useAppDispatch();

    const handleBudgetClick = (categoryId: string) => {
        triggerHapticFeedback('light');
        dispatch({
            type: 'UPDATE_FILTERS',
            payload: { categoryId: filters.categoryId === categoryId ? null : categoryId },
        });
    };

    if (budgetOverviewData.length === 0) {
        return <p className="text-sm text-center py-4 text-muted-foreground">Keine Budgets für diesen Zeitraum festgelegt.</p>;
    }

    const isAnyActive = !!filters.categoryId;

    return (
        <div className="space-y-6">
            {budgetOverviewData.map(item => {
                const isOverBudget = item.percentage > 100;
                const progressBarColor = isOverBudget ? 'bg-destructive' : 'bg-primary';
                const percentageWidth = Math.min(item.percentage, 100);
                const remaining = item.budget - item.spent;
                const isActive = item.id === filters.categoryId;
                const tooltipId = `budget-tooltip-dashboard-${item.id}`;

                return (
                    <div
                        key={item.id}
                        role="button"
                        onClick={() => handleBudgetClick(item.id)}
                        className={`group relative p-2 -m-2 rounded-lg cursor-pointer transition-all active:bg-primary/5 ${isActive ? 'bg-primary/10 ring-1 ring-primary/30' : 'hover:bg-secondary/50'} ${isAnyActive && !isActive ? 'opacity-50 hover:opacity-100' : ''}`}
                    >
                        <div className="animate-fade-in">
                            <div className="flex justify-between items-center mb-1">
                                <h4 className="font-medium text-sm truncate pr-2">{item.name}</h4>
                                <div className={`flex items-center text-sm font-semibold ${isOverBudget ? 'text-destructive' : 'text-muted-foreground'}`}>
                                    {isOverBudget && <AlertCircle className="mr-1 h-4 w-4" />}
                                    <span>{item.percentage.toFixed(0)}%</span>
                                </div>
                            </div>

                            <div className="w-full bg-secondary rounded-full h-2.5">
                                <div
                                    className={`${progressBarColor} h-2.5 rounded-full transition-all duration-500`}
                                    style={{ width: `${percentageWidth}%` }}
                                ></div>
                            </div>
                            
                            <div className="flex justify-between text-xs mt-1 text-muted-foreground">
                                <span className="font-medium" data-privacy>{formatCurrency(item.spent)}</span>
                                <span>von <span data-privacy>{formatCurrency(item.budget)}</span></span>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

const Dashboard: React.FC = () => {
    const dashboardStats = useDashboardStats();
    const reportsData = useReportsData();

    return (
        <div className="space-y-6">
            <section>
                <div className="grid grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
                    <StatCard title="Einnahmen" amount={dashboardStats.income} trend={dashboardStats.incomeTrend} icon={<TrendingUp size={24}/>} />
                    <StatCard title="Ausgaben" amount={dashboardStats.expense} trend={dashboardStats.expenseTrend} icon={<TrendingDown size={24}/>} />
                    <StatCard title="Gespart" amount={dashboardStats.saving} trend={dashboardStats.savingTrend} icon={<Landmark size={24}/>} />
                    <StatCard title="Saldo" amount={dashboardStats.balance} trend={dashboardStats.balanceTrend} icon={<Wallet size={24}/>} />
                </div>
            </section>
            
            {reportsData.budgetOverviewData.length > 0 && (
                <section className="glass-card rounded-2xl p-6">
                    <h2 className="text-xl font-bold mb-4 tracking-tighter">Budgetübersicht</h2>
                    <BudgetOverview />
                </section>
            )}
        </div>
    );
};

export default Dashboard;
