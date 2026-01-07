import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Transaction, CreatorEarnings, WithdrawalRequest } from '@/types';
import { creatorApi } from '@/services/api';

interface TemplateEarning {
  templateId: string;
  templateName: string;
  earnings: number;
  uses: number;
}

interface EarningsState {
  totalEarnings: number;
  thisMonthEarnings: number;
  lastMonthEarnings: number;
  pendingWithdrawal: number;
  availableBalance: number;
  transactions: Transaction[];
  withdrawalRequests: WithdrawalRequest[];
  templateEarnings: TemplateEarning[];
  monthlyTrend: { month: string; amount: number }[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchEarnings: () => Promise<void>;
  fetchTransactions: (page?: number, limit?: number) => Promise<void>;
  fetchWithdrawals: (page?: number, limit?: number) => Promise<void>;
  requestWithdrawal: (amount: number, method: "bank" | "upi", bankDetails?: any, upiId?: string) => Promise<boolean>;
  updateEarnings: (updates: Partial<CreatorEarnings>) => void;
  getTransactionsByType: (type: Transaction['type']) => Transaction[];
  getRecentTransactions: (limit?: number) => Transaction[];
}

export const useEarningsStore = create<EarningsState>()(
  persist(
    (set, get) => ({
      totalEarnings: 0,
      thisMonthEarnings: 0,
      lastMonthEarnings: 0,
      pendingWithdrawal: 0,
      availableBalance: 0,
      transactions: [],
      withdrawalRequests: [],
      templateEarnings: [],
      monthlyTrend: [],
      isLoading: false,
      error: null,

      fetchEarnings: async () => {
        set({ isLoading: true, error: null });
        try {
          const data = await creatorApi.getEarnings();
          set({
            totalEarnings: data.totalEarnings || 0,
            thisMonthEarnings: data.thisMonthEarnings || 0,
            lastMonthEarnings: data.lastMonthEarnings || 0,
            pendingWithdrawal: data.pendingWithdrawal || 0,
            availableBalance: data.availableBalance || 0,
            templateEarnings: data.templateEarnings || [],
            monthlyTrend: data.monthlyTrend || [],
            isLoading: false,
          });
        } catch (error: any) {
          console.error('Failed to fetch earnings:', error);
          set({
            isLoading: false,
            error: error.message || 'Failed to fetch earnings'
          });
        }
      },

      fetchTransactions: async (page = 1, limit = 20) => {
        set({ isLoading: true, error: null });
        try {
          const data = await creatorApi.getTransactions(page, limit);
          const transactions = (data.transactions || []).map((t: any) => ({
            id: t.id,
            userId: t.userId || '',
            type: t.type,
            amount: t.amount,
            balanceAfter: t.balanceAfter || 0,
            description: t.description,
            relatedTemplateId: t.relatedTemplateId,
            createdAt: t.createdAt,
          }));
          set({ transactions, isLoading: false });
        } catch (error: any) {
          console.error('Failed to fetch transactions:', error);
          set({
            isLoading: false,
            error: error.message || 'Failed to fetch transactions'
          });
        }
      },

      fetchWithdrawals: async (page = 1, limit = 20) => {
        set({ isLoading: true, error: null });
        try {
          const data = await creatorApi.getWithdrawals(page, limit);
          const withdrawals = (data.withdrawals || []).map((w: any) => ({
            id: w.id,
            creatorId: w.creatorId || '',
            amount: w.amount,
            status: w.status,
            method: w.method,
            bankDetails: w.bankDetails,
            upiId: w.upiId,
            requestedAt: w.requestedAt,
            processedAt: w.processedAt,
            transactionId: w.transactionId,
          }));
          set({ withdrawalRequests: withdrawals, isLoading: false });
        } catch (error: any) {
          console.error('Failed to fetch withdrawals:', error);
          set({
            isLoading: false,
            error: error.message || 'Failed to fetch withdrawals'
          });
        }
      },

      requestWithdrawal: async (amount, method, bankDetails, upiId) => {
        set({ isLoading: true, error: null });
        try {
          await creatorApi.requestWithdrawal({ amount, method, bankDetails, upiId });

          // Refresh earnings data after withdrawal
          await get().fetchEarnings();
          await get().fetchWithdrawals();

          set({ isLoading: false });
          return true;
        } catch (error: any) {
          console.error('Withdrawal request failed:', error);
          set({
            isLoading: false,
            error: error.message || 'Withdrawal request failed'
          });
          return false;
        }
      },

      updateEarnings: (updates) => set((state) => ({
        ...updates,
      })),

      getTransactionsByType: (type) => {
        return get().transactions.filter(transaction => transaction.type === type);
      },

      getRecentTransactions: (limit = 10) => {
        return get().transactions.slice(0, limit);
      }
    }),
    {
      name: 'rupantar-earnings',
      partialize: (state) => ({
        totalEarnings: state.totalEarnings,
        thisMonthEarnings: state.thisMonthEarnings,
        lastMonthEarnings: state.lastMonthEarnings,
      }),
    }
  )
);