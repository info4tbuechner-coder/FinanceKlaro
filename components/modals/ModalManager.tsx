import React, { useCallback, lazy, Suspense } from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { Modal } from '../ui';
import { LoaderCircle } from 'lucide-react';

const TransactionModal      = lazy(() => import('./TransactionModal'));
const SmartScanModal        = lazy(() => import('./SmartScanModal'));
const CategoryManagerModal  = lazy(() => import('./CategoryManagerModal'));
const TagManagerModal       = lazy(() => import('./TagManagerModal'));
const LiabilityManagerModal = lazy(() => import('./LiabilityManagerModal'));
const AnalysisModal         = lazy(() => import('./AnalysisModal'));

const ModalFallback = () => (
    <div className="flex items-center justify-center py-16">
        <LoaderCircle className="h-8 w-8 animate-spin text-primary opacity-60" />
    </div>
);

const ModalManager: React.FC = () => {
    const { activeModal } = useAppState();
    const dispatch = useAppDispatch();
    const closeModal = useCallback(() => dispatch({ type: 'CLOSE_MODAL' }), [dispatch]);

    if (!activeModal) return null;

    const getModalProps = () => {
        switch (activeModal.type) {
            case 'ADD_TRANSACTION':
                return { title: "Neuer Eintrag", content: <TransactionModal />, size: 'md' as const };
            case 'EDIT_TRANSACTION':
                return { title: "Eintrag bearbeiten", content: <TransactionModal transaction={activeModal.data} />, size: 'md' as const };
            case 'SMART_SCAN':
                return { title: "KI Beleg-Scan", content: <SmartScanModal />, size: 'lg' as const };
            case 'MANAGE_CATEGORIES':
                return { title: "Kategorien", content: <CategoryManagerModal />, size: 'lg' as const };
            case 'MANAGE_TAGS':
                return { title: "Tags verwalten", content: <TagManagerModal />, size: 'md' as const };
            case 'MANAGE_LIABILITIES':
                return { title: "Verbindlichkeiten", content: <LiabilityManagerModal />, size: 'lg' as const };
            case 'ANALYSIS':
                return { title: "Cashflow Analyse", content: <AnalysisModal />, size: 'xl' as const };
            default:
                return { title: "Info", content: <div className="p-10 text-center text-muted-foreground">In Kürze verfügbar…</div>, size: 'md' as const };
        }
    };

    const { title, content, size } = getModalProps();

    return (
        <Modal title={title} onClose={closeModal} size={size}>
            <Suspense fallback={<ModalFallback />}>
                {content}
            </Suspense>
        </Modal>
    );
};

export default ModalManager;
