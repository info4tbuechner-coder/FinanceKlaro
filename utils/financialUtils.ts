import type { Liability } from '../types';

interface Debt extends Liability {
  balance: number;
}

interface MonthlyPaymentDetail {
  liabilityId: string;
  payment: number;
  principal: number;
  interest: number;
  remainingBalance: number;
}

interface MonthlyBreakdown {
  month: number;
  payments: MonthlyPaymentDetail[];
  totalPayment: number;
  totalInterest: number;
  totalPrincipal: number;
  totalRemainingBalance: number;
}

export interface DebtPaydownPlan {
  totalMonths: number;
  totalInterestPaid: number;
  totalPrincipalPaid: number;
  monthlyBreakdown: MonthlyBreakdown[];
}

export const calculateDebtPaydownPlan = (
  liabilities: Liability[],
  strategy: 'avalanche' | 'snowball',
  extraPayment: number
): DebtPaydownPlan => {
  let debts: Debt[] = JSON.parse(JSON.stringify(liabilities
    .filter(l => l.type === 'debt' && l.initialAmount > l.paidAmount)
    .map(l => ({...l, balance: l.initialAmount - l.paidAmount}))
  ));

  if (debts.length === 0) {
    return { totalMonths: 0, totalInterestPaid: 0, totalPrincipalPaid: 0, monthlyBreakdown: [] };
  }

  const monthlyBreakdown: MonthlyBreakdown[] = [];
  let month = 0;
  let totalInterestPaid = 0;
  const totalPrincipal = debts.reduce((sum, d) => sum + d.balance, 0);

  const sortDebts = (d: Debt[]) => {
    if (strategy === 'avalanche') {
      return [...d].sort((a, b) => b.interestRate - a.interestRate || a.balance - b.balance);
    } else { // snowball
      return [...d].sort((a, b) => a.balance - b.balance || b.interestRate - a.interestRate);
    }
  };

  while (debts.some(d => d.balance > 0) && month < 600) { // Safety break at 50 years
    month++;
    let extraPaymentPool = extraPayment;
    const monthlyPayments: MonthlyPaymentDetail[] = [];
    let freedUpMinimums = 0;

    // 1. Pay minimums and calculate interest
    debts.forEach(debt => {
        if (debt.balance <= 0) {
            freedUpMinimums += debt.minMonthlyPayment;
            return;
        }

        const interest = debt.balance * (debt.interestRate / 100 / 12);
        const minPayment = debt.minMonthlyPayment;
        
        let payment = minPayment;
        if (debt.balance + interest < payment) {
            payment = debt.balance + interest;
            freedUpMinimums += minPayment - payment;
        }

        const principal = payment - interest;
        debt.balance -= principal;

        monthlyPayments.push({
            liabilityId: debt.id,
            payment: payment,
            principal: principal,
            interest: interest,
            remainingBalance: debt.balance
        });
    });

    extraPaymentPool += freedUpMinimums;

    // 2. Apply extra payments according to strategy
    const sorted = sortDebts(debts);
    for (const debt of sorted) {
        if (debt.balance <= 0 || extraPaymentPool <= 0) continue;

        const extraPay = Math.min(extraPaymentPool, debt.balance);
        debt.balance -= extraPay;
        extraPaymentPool -= extraPay;

        const existingPayment = monthlyPayments.find(p => p.liabilityId === debt.id);
        if (existingPayment) {
            existingPayment.payment += extraPay;
            existingPayment.principal += extraPay;
            existingPayment.remainingBalance = debt.balance;
        }
    }
    
    const totalPayment = monthlyPayments.reduce((sum, p) => sum + p.payment, 0);
    const totalInterest = monthlyPayments.reduce((sum, p) => sum + p.interest, 0);
    const totalPrincipal = monthlyPayments.reduce((sum, p) => sum + p.principal, 0);
    const totalRemainingBalance = debts.reduce((sum, d) => sum + d.balance, 0);

    totalInterestPaid += totalInterest;

    monthlyBreakdown.push({
      month,
      payments: monthlyPayments,
      totalPayment,
      totalInterest,
      totalPrincipal,
      totalRemainingBalance,
    });
    
    debts = debts.filter(d => d.balance > 0.005); // Filter out paid debts
  }

  return {
    totalMonths: month,
    totalInterestPaid,
    totalPrincipalPaid: totalPrincipal,
    monthlyBreakdown,
  };
};
