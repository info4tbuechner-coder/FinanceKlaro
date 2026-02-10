import React, { useMemo, useRef, useCallback, memo } from 'react';
import { useAppState, useAppDispatch } from '../context/AppContext';
import useReportsData from '../hooks/useReportsData';
import { Target, Briefcase, BarChartHorizontal, AlertCircle, FileDown, TrendingUp, Receipt } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Bar, XAxis, YAxis, Tooltip, Legend, BarChart, CartesianGrid, ComposedChart } from 'recharts';
import { formatCurrency } from '../utils';
import UpcomingBills from './UpcomingBills';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF4560'];

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-3 glass-card text-sm rounded-lg shadow-lg">
           <p className="font-bold mb-2 text-lg">{label}</p>
           {payload.map((pld: any, index: number) => (
             <div key={index} style={{ color: pld.fill }}>
               <p>{`${pld.name}: ${formatCurrency(pld.value)}`}</p>
             </div>
           ))}
        </div>
      );
    }
    return null;
};
  
const PieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        const fill = payload[0].fill;
        return (
            <div className="p-3 glass-card text-sm rounded-lg shadow-lg">
                <div className="font-bold mb-2 text-lg" style={{ color: fill }}>{data.name}</div>
                <div className="grid grid-cols-[auto,1fr] gap-x-4">
                    <span className="text-muted-foreground">Betrag:</span>
                    <span className="text-right font-mono font-semibold text-foreground">{formatCurrency(data.value)}</span>
                    <span className="text-muted-foreground">Anteil:</span>
                    <span className="text-right font-mono font-semibold text-foreground">{data.percent.toFixed(1)}%</span>
                </div>
            </div>
        );
    }
    return null;
};

const BudgetOverview: React.FC = () => {
    const { budgetOverviewData } = useReportsData();
    const { filters } = useAppState();
    const dispatch = useAppDispatch();

    const handleBudgetClick = (categoryId: string) => {
        dispatch({
            type: 'UPDATE_FILTERS',
            payload: { categoryId: filters.categoryId === categoryId ? null : categoryId },
        });
    };

    if (budgetOverviewData.length === 0) {
        return <p className="text-sm text-muted-foreground">Keine Budgets für diesen Zeitraum festgelegt.</p>;
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
                const tooltipId = `budget-tooltip-sidebar-${item.id}`;

                const tooltipContent = (
                    <>
                        <div className="font-bold mb-2 text-lg">{item.name}</div>
                        <div className="grid grid-cols-[auto,1fr] gap-x-3 text-xs">
                            <span className="text-muted-foreground">Budget:</span>
                            <span className="text-right font-mono font-semibold">{formatCurrency(item.budget)}</span>
                            <span className="text-muted-foreground">Ausgegeben:</span>
                            <span className="text-right font-mono font-semibold">{formatCurrency(item.spent)}</span>
                        </div>
                        <hr className="border-border/20 my-1.5" />
                        <div className={`grid grid-cols-[auto,1fr] gap-x-3 text-xs font-bold ${isOverBudget ? 'text-destructive' : 'text-success'}`}>
                            {isOverBudget ? (
                                <>
                                    <span>Überschritten:</span>
                                    <span className="text-right font-mono">{formatCurrency(Math.abs(remaining))}</span>
                                </>
                            ) : (
                                <>
                                    <span>Verbleibend:</span>
                                    <span className="text-right font-mono">{formatCurrency(remaining)}</span>
                                </>
                            )}
                        </div>
                    </>
                );

                return (
                    <div
                        key={item.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => handleBudgetClick(item.id)}
                        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleBudgetClick(item.id)}
                        aria-pressed={isActive}
                        aria-label={`Budget für ${item.name}: ${item.percentage.toFixed(0)}% verbraucht. Klicken zum Filtern.`}
                        aria-describedby={tooltipId}
                        className={`group relative p-2 -m-2 rounded-lg cursor-pointer transition-all ${isActive ? 'bg-primary/10 ring-2 ring-primary' : 'hover:bg-secondary/50'} ${isAnyActive && !isActive ? 'opacity-50 hover:opacity-100' : ''}`}
                    >
                        <div className="animate-fade-in" style={{ animationDelay: `${budgetOverviewData.indexOf(item) * 50}ms` }}>
                            <div
                                id={tooltipId}
                                role="tooltip"
                                className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-52 p-3
                                           bg-popover text-popover-foreground rounded-lg shadow-xl 
                                           opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-300 
                                           pointer-events-none z-10"
                            >
                                {tooltipContent}
                                <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0
                                            border-x-8 border-x-transparent
                                            border-t-8 border-t-[hsl(var(--popover))]"></div>
                            </div>

                            <div className="flex justify-between items-center mb-1">
                                <h4 className="font-medium text-sm truncate pr-2">{item.name}</h4>
                                <div className={`flex items-center text-sm font-semibold ${isOverBudget ? 'text-destructive' : 'text-muted-foreground'}`}>
                                    {isOverBudget && <AlertCircle className="mr-1 h-4 w-4 animate-pulse-destructive" />}
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
                                <span className="font-medium">{formatCurrency(item.spent)}</span>
                                <span>von {formatCurrency(item.budget)}</span>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

const MonthlyReport = memo(() => {
    const { expenseDataForPieChart } = useReportsData();
    const { filters, categories } = useAppState();
    const dispatch = useAppDispatch();
    
    const totalExpenses = useMemo(() => expenseDataForPieChart.reduce((sum, item) => sum + item.value, 0), [expenseDataForPieChart]);
    const dataWithPercent = useMemo(() => expenseDataForPieChart.map(item => ({...item, percent: totalExpenses > 0 ? (item.value / totalExpenses) * 100 : 0})), [expenseDataForPieChart, totalExpenses]);
    const categoryNameToIdMap = useMemo(() => new Map(categories.map(c => [c.name, c.id])), [categories]);

    const handlePieClick = useCallback((data: any) => {
        const clickedCategoryId = categoryNameToIdMap.get(data.name);
        if (clickedCategoryId) {
            // Toggle filter
            if (clickedCategoryId === filters.categoryId) {
                dispatch({ type: 'UPDATE_FILTERS', payload: { categoryId: null } });
            } else {
                dispatch({ type: 'UPDATE_FILTERS', payload: { categoryId: clickedCategoryId } });
            }
        }
    }, [dispatch, filters.categoryId, categoryNameToIdMap]);

    return (
        <div className="space-y-6">
            <div>
                <h4 className="font-semibold mb-2">Ausgaben nach Kategorie</h4>
                {dataWithPercent.length > 0 ? (
                    <div style={{ width: '100%', height: 200 }}>
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie data={dataWithPercent} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#8884d8" labelLine={false} onClick={handlePieClick}>
                                    {dataWithPercent.map((entry, index) => {
                                        const entryCategoryId = categoryNameToIdMap.get(entry.name);
                                        const isActive = filters.categoryId === entryCategoryId;
                                        const isAnyActive = !!filters.categoryId;

                                        return (
                                            <Cell 
                                                key={`cell-${index}`}
                                                fill={COLORS[index % COLORS.length]}
                                                style={{
                                                    cursor: 'pointer',
                                                    opacity: isAnyActive && !isActive ? 0.3 : 1,
                                                    transition: 'opacity 0.2s ease',
                                                }}
                                            />
                                        );
                                    })}
                                </Pie>
                                <Tooltip content={<PieTooltip />} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                ) : <p className="text-sm text-muted-foreground">Keine Ausgabendaten für diesen Zeitraum.</p>}
            </div>
             <div>
                <h4 className="font-semibold mb-2">Budgetübersicht</h4>
                <BudgetOverview />
            </div>
        </div>
    )
});

const CashflowAnalysis = memo(() => {
    const { cashflowData } = useReportsData();

    if (cashflowData.every(d => d.Einnahmen === 0 && d.Ausgaben === 0)) {
        return <p className="text-sm text-muted-foreground text-center py-8">Nicht genügend Daten für eine Cashflow-Analyse vorhanden.</p>
    }

    return (
        <div>
            <h4 className="font-semibold mb-4">Cashflow der letzten 12 Monate</h4>
             <div style={{ width: '100%', height: 250 }}>
                <ResponsiveContainer>
                    <ComposedChart data={cashflowData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)" />
                        <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `€${Number(value)/1000}k`} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--secondary))' }}/>
                        <Legend wrapperStyle={{fontSize: "12px"}} />
                        <Bar dataKey="Einnahmen" fill="hsl(var(--success))" barSize={20} />
                        <Bar dataKey="Ausgaben" fill="hsl(var(--warning))" barSize={20} />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
});

const ProjectTracker = memo(() => {
    const { projectReportData } = useReportsData();

    return (
        <div className="space-y-6">
            {projectReportData.length > 0 ? projectReportData.map(p => (
                <div key={p.name}>
                    <div className="flex justify-between items-baseline mb-2">
                        <h4 className="font-semibold text-sm">{p.name}</h4>
                        <span className={`font-bold text-lg ${p.profit >= 0 ? 'text-success' : 'text-destructive'}`}>{formatCurrency(p.profit)}</span>
                    </div>
                     <div style={{ width: '100%', height: 150 }}>
                        <ResponsiveContainer>
                            <BarChart data={p.data} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)" />
                                <XAxis type="number" tickFormatter={(value) => formatCurrency(value as number)} fontSize={12} />
                                <YAxis type="category" dataKey="name" width={80} fontSize={12} />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--secondary))' }}/>
                                <Bar dataKey="value" barSize={20}>
                                     {p.data.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={index === 0 ? 'hsl(var(--success))' : 'hsl(var(--warning))'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )) : <p className="text-sm text-muted-foreground">Noch keine Projekte angelegt.</p>}
        </div>
    )
});

const GoalTracker = memo(() => {
    const { goals } = useAppState();
    return (
        <div className="space-y-6">
            {goals.length > 0 ? goals.map(goal => {
                const { name, currentAmount, targetAmount } = goal;
                const percentage = Math.max(0, Math.min((currentAmount / targetAmount) * 100, 100));
                const remainingAmount = targetAmount - currentAmount;
                const isGoalReached = remainingAmount <= 0;

                return (
                    <div key={goal.id}>
                        <div className="flex justify-between items-center mb-2">
                            <h4 className="font-semibold text-sm">{name}</h4>
                            <span className="text-sm font-semibold text-muted-foreground">{formatCurrency(targetAmount)}</span>
                        </div>
                        
                        <div className="relative w-full bg-secondary rounded-full h-5">
                            <div
                                className="bg-primary h-5 rounded-full flex items-center justify-end px-2 transition-all duration-500"
                                style={{ width: `${percentage}%` }}
                            >
                                {percentage > 15 && (
                                    <span className="text-xs font-bold text-primary-foreground">
                                        {Math.floor(percentage)}%
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="mt-2 text-sm space-y-1">
                            <div className="flex justify-between text-muted-foreground">
                                <span>Gespart:</span>
                                <span className="font-semibold text-foreground">{formatCurrency(currentAmount)}</span>
                            </div>
                            
                            {isGoalReached ? (
                                <div className="text-center font-bold text-success pt-1 text-base">
                                    🎉 Ziel erreicht!
                                </div>
                            ) : (
                                <div className="flex justify-between text-muted-foreground">
                                    <span>Verbleibend:</span>
                                    <span className="font-semibold text-foreground">{formatCurrency(remainingAmount)}</span>
                                </div>
                            )}
                        </div>
                    </div>
                );
            }) : <p className="text-sm text-muted-foreground">Noch keine Ziele angelegt.</p>}
        </div>
    )
});

const TABS = [
    { name: 'Bericht', icon: BarChartHorizontal, component: MonthlyReport },
    { name: 'Rechnungen', icon: Receipt, component: UpcomingBills },
    { name: 'Cashflow', icon: TrendingUp, component: CashflowAnalysis },
    { name: 'Projekte', icon: Briefcase, component: ProjectTracker },
    { name: 'Ziele', icon: Target, component: GoalTracker },
];

const RightSidebar: React.FC = () => {
    const { activeSidebarTab } = useAppState();
    const dispatch = useAppDispatch();
    const setActiveTab = (tabName: string) => dispatch({ type: 'SET_ACTIVE_SIDEBAR_TAB', payload: tabName });
    const exportRef = useRef<HTMLDivElement>(null);

    const ActiveComponent = TABS.find(tab => tab.name === activeSidebarTab)?.component || (() => null);
    const isExportable = useMemo(() => ['Bericht', 'Projekte', 'Cashflow'].includes(activeSidebarTab), [activeSidebarTab]);

    const handleExport = useCallback(() => {
        if (exportRef.current) {
            const svgElement = exportRef.current.querySelector('svg');
            if (svgElement) {
                const svgString = new XMLSerializer().serializeToString(svgElement);
                const blob = new Blob([svgString], { type: 'image/svg+xml' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `klaro-chart-${activeSidebarTab.toLowerCase()}.svg`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            }
        }
    }, [activeSidebarTab]);
    
    return (
        <aside className="sticky top-24 space-y-6">
            <div className="glass-card rounded-2xl p-4">
                 <div className="flex justify-between items-center mb-4">
                    <div className="p-1 bg-secondary rounded-xl flex items-center flex-wrap">
                        {TABS.map(tab => (
                            <button
                                key={tab.name}
                                onClick={() => setActiveTab(tab.name)}
                                className={`flex-1 whitespace-nowrap py-2 px-3 text-sm font-semibold flex items-center justify-center rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background
                                ${activeSidebarTab === tab.name
                                    ? 'bg-card shadow-sm text-primary'
                                    : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                <tab.icon className="mr-2 h-5 w-5"/>
                                {tab.name}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={handleExport}
                        disabled={!isExportable}
                        className="p-2 rounded-md text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="Diagramm exportieren"
                        title={isExportable ? "Als SVG exportieren" : "Kein exportierbares Diagramm"}
                    >
                        <FileDown className="h-5 w-5" />
                    </button>
                </div>
                <div ref={exportRef} className="p-2">
                    <ActiveComponent />
                </div>
            </div>
        </aside>
    );
};

export default RightSidebar;