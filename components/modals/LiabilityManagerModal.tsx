import React, { useState, useMemo, memo } from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { Liability, LiabilityType } from '../../types';
import { Search, Plus, X, Trash2, Landmark } from 'lucide-react';
import { formatCurrency, triggerHapticFeedback } from '../../utils';
import { FormGroup, Input, Button } from '../ui';

const LiabilityManagerModal: React.FC = memo(() => {
    const { liabilities } = useAppState();
    const dispatch = useAppDispatch();
    const [searchTerm, setSearchTerm] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [formData, setFormData] = useState<Omit<Liability, 'id' | 'paidAmount'>>({
        name: '', type: LiabilityType.DEBT, initialAmount: 0, interestRate: 0, minMonthlyPayment: 0
    });

    const filteredLiabilities = useMemo(() =>
        liabilities.filter(l => l.name.toLowerCase().includes(searchTerm.toLowerCase())),
        [liabilities, searchTerm]
    );

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: ['initialAmount', 'interestRate', 'minMonthlyPayment'].includes(name) ? parseFloat(value) : value
        }));
    };

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        triggerHapticFeedback('success');
        dispatch({ type: 'ADD_LIABILITY', payload: formData });
        setIsAdding(false);
        setFormData({ name: '', type: LiabilityType.DEBT, initialAmount: 0, interestRate: 0, minMonthlyPayment: 0 });
    };

    const handleDelete = (id: string) => {
        if (window.confirm("Möchten Sie diese Verbindlichkeit wirklich löschen?")) {
            triggerHapticFeedback('heavy');
            dispatch({ type: 'DELETE_LIABILITY', payload: id });
        }
    };

    return (
        <div className="space-y-6">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Suchen..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
            <div className="space-y-3">
                <div className="flex justify-between items-center px-1">
                    <h4 className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Liste ({filteredLiabilities.length})</h4>
                    <button onClick={() => setIsAdding(!isAdding)} className="text-primary hover:text-primary/80 transition-colors p-1">
                        {isAdding ? <X size={20} /> : <Plus size={20} />}
                    </button>
                </div>
                {isAdding && (
                    <form onSubmit={handleAdd} className="p-4 bg-primary/5 rounded-2xl border border-primary/20 space-y-4 animate-fade-in">
                        <FormGroup label="Name" htmlFor="l-name">
                            <Input id="l-name" name="name" value={formData.name} onChange={handleChange} required placeholder="Kredit, Darlehen..." />
                        </FormGroup>
                        <div className="grid grid-cols-2 gap-4">
                            <FormGroup label="Betrag" htmlFor="l-amount">
                                <Input id="l-amount" name="initialAmount" type="number" step="0.01" value={formData.initialAmount} onChange={handleChange} required />
                            </FormGroup>
                            <FormGroup label="Zinssatz (%)" htmlFor="l-interest">
                                <Input id="l-interest" name="interestRate" type="number" step="0.1" value={formData.interestRate} onChange={handleChange} required />
                            </FormGroup>
                        </div>
                        <FormGroup label="Min. Rate" htmlFor="l-min">
                            <Input id="l-min" name="minMonthlyPayment" type="number" step="0.01" value={formData.minMonthlyPayment} onChange={handleChange} required />
                        </FormGroup>
                        <Button type="submit" variant="primary" className="w-full">Erstellen</Button>
                    </form>
                )}
                <div className="space-y-2">
                    {filteredLiabilities.length > 0 ? filteredLiabilities.map(l => (
                        <div key={l.id} className="glass-card p-4 rounded-xl flex items-center justify-between group">
                            <div>
                                <h5 className="font-bold text-foreground flex items-center gap-2">
                                    <Landmark size={14} className="text-muted-foreground" /> {l.name}
                                </h5>
                                <div className="text-xs text-muted-foreground mt-1 flex gap-3">
                                    <span>Zinsen: {l.interestRate}%</span>
                                    <span>Rate: {formatCurrency(l.minMonthlyPayment)}</span>
                                </div>
                            </div>
                            <div className="text-right flex items-center gap-4">
                                <div>
                                    <p className="text-sm font-bold text-foreground">{formatCurrency(l.initialAmount - l.paidAmount)}</p>
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Restschuld</p>
                                </div>
                                <button onClick={() => handleDelete(l.id)} className="p-2 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    )) : (
                        <div className="text-center py-10 text-muted-foreground">Keine Verbindlichkeiten gefunden.</div>
                    )}
                </div>
            </div>
        </div>
    );
});

export default LiabilityManagerModal;
