import React from 'react';
import useReportsData from '../../hooks/useReportsData';
import { Sankey, Tooltip, ResponsiveContainer } from 'recharts';
import { BarChart } from 'lucide-react';

const AnalysisModal: React.FC = () => {
    const { sankeyData } = useReportsData();

    return (
        <div className="space-y-6">
            <div className="text-center">
                <h4 className="font-bold text-xl">Cashflow Visualisierung</h4>
                <p className="text-sm text-muted-foreground mt-1">Woher kommt mein Geld und wohin fließt es?</p>
            </div>
            {sankeyData.links.length > 0 ? (
                <div className="p-4 bg-secondary/10 rounded-3xl border border-border/20">
                    <ResponsiveContainer width="100%" height={450} debounce={1}>
                        <Sankey data={sankeyData} nodePadding={50} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                            <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                        </Sankey>
                    </ResponsiveContainer>
                </div>
            ) : (
                <div className="text-center py-20 text-muted-foreground bg-secondary/10 rounded-3xl border border-dashed border-border/40">
                    <BarChart className="mx-auto h-12 w-12 opacity-20 mb-4" />
                    Keine ausreichenden Daten für Analyse verfügbar.
                </div>
            )}
        </div>
    );
};

export default AnalysisModal;
