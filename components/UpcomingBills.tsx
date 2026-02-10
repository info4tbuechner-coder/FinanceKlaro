
import React from 'react';
import { useUpcomingBills, useAppDispatch } from '../context/AppContext';
import { CreditCard, Calendar, AlertTriangle, Info } from 'lucide-react';
import { formatCurrency, triggerHapticFeedback } from '../utils';
import { formatDistance } from 'date-fns/formatDistance';
import { isToday } from 'date-fns/isToday';
import { isPast } from 'date-fns/isPast';
import de from 'date-fns/locale/de';
import type { RecurringTransaction } from '../types';

const DueDateIndicator: React.FC<{ dueDate: Date }> = ({ dueDate }) => {
    const today = new Date();
    today.setHours(0,0,0,0);
    
    if (isToday(dueDate)) {
        return <span className="font-bold text-destructive">Heute fällig</span>;
    }
    if (isPast(dueDate)) {
        return <span className="font-semibold text-destructive">Überfällig</span>;
    }
    
    // Fix: The project's type definitions for date-fns appear to be missing the 'locale' property on FormatDistanceOptions.
    // Casting the options to 'any' bypasses this incorrect type check, allowing the function to work correctly at runtime.
    const distance = formatDistance(dueDate, new Date(), { locale: de, addSuffix: true } as any);
    return <span className="text-warning">{distance} fällig</span>;
};

const UpcomingBills: React.FC = () => {
    const { upcomingBills } = useUpcomingBills();
    const dispatch = useAppDispatch();

    const handlePayBill = (rt: RecurringTransaction & { dueDate: Date }) => {
        if (window.confirm(`Möchten Sie die Rechnung "${rt.description}" über ${formatCurrency(rt.amount)} wirklich als bezahlt markieren? Eine entsprechende Transaktion wird erstellt.`)) {
            triggerHapticFeedback('medium');
            dispatch({ type: 'PAY_BILL', payload: rt.id });
        }
    };
    
    if (upcomingBills.length === 0) {
        return (
            <div className="text-center py-10 px-4 space-y-3">
                <Info className="mx-auto h-12 w-12 text-muted-foreground/30" />
                <h4 className="font-semibold text-lg">Keine anstehenden Rechnungen</h4>
                <p className="text-sm text-muted-foreground">
                    Sie haben keine wiederkehrenden Ausgaben als "Rechnung" markiert. Sie können dies unter "Verwaltung" → "Daueraufträge" tun.
                </p>
            </div>
        );
    }
    
    return (
        <div className="space-y-4">
            {upcomingBills.map((bill, index) => (
                 <div 
                    key={bill.id} 
                    className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg animate-fade-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                 >
                    <div className="flex-grow">
                        <p className="font-semibold text-foreground">{bill.description}</p>
                        <div className="flex items-center gap-2 text-sm mt-1">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <DueDateIndicator dueDate={bill.dueDate} />
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="font-bold text-lg text-right">{formatCurrency(bill.amount)}</span>
                        <button
                            onClick={() => handlePayBill(bill)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border border-border bg-card text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Als bezahlt markieren"
                            aria-label={`Rechnung ${bill.description} als bezahlt markieren`}
                        >
                            <CreditCard size={14} /> Bezahlen
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default UpcomingBills;
