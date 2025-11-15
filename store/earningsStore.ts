import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Transaction, CreatorEarnings, WithdrawalRequest } from '@/types';

interface EarningsState {
  totalEarnings: number;
  thisMonthEarnings: number;
  lastMonthEarnings: number;
  pendingWithdrawal: number;
  transactions: Transaction[];
  withdrawalRequests: WithdrawalRequest[];
  earnings: CreatorEarnings;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => void;
  requestWithdrawal: (amount: number, method: "bank" | "upi", bankDetails?: CreatorEarnings['bankDetails'], upiId?: string) => void;
  updateEarnings: (updates: Partial<CreatorEarnings>) => void;
  getTransactionsByType: (type: Transaction['type']) => Transaction[];
  getRecentTransactions: (limit?: number) => Transaction[];
}

export const useEarningsStore = create<EarningsState>()(
  persist(
    (set, get) => ({
      totalEarnings: 12840.55,
      thisMonthEarnings: 980.10,
      lastMonthEarnings: 855.00,
      pendingWithdrawal: 0,
      transactions: [
        {
          id: "txn_1",
          userId: "user_123",
          type: "creator_earning",
          amount: 25.50,
          balanceAfter: 12840.55,
          description: "Earnings from template usage",
          relatedTemplateId: "template_1",
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        },
        {
          id: "txn_2",
          userId: "user_123",
          type: "creator_earning",
          amount: 18.75,
          balanceAfter: 12815.05,
          description: "Earnings from template usage",
          relatedTemplateId: "template_2",
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        },
        {
          id: "txn_3",
          userId: "user_123",
          type: "creator_earning",
          amount: 32.25,
          balanceAfter: 12796.30,
          description: "Earnings from template usage",
          relatedTemplateId: "template_3",
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
        },
      ],
      withdrawalRequests: [],
      earnings: {
        totalEarnings: 12840.55,
        thisMonthEarnings: 980.10,
        lastMonthEarnings: 855.00,
        pendingWithdrawal: 0,
      },
      
      addTransaction: (transactionData) => set((state) => {
        const newTransaction: Transaction = {
          ...transactionData,
          id: `txn_${Date.now()}`,
          createdAt: new Date().toISOString(),
        };
        
        return {
          transactions: [newTransaction, ...state.transactions],
        };
      }),
      
      requestWithdrawal: (amount, method, bankDetails, upiId) => set((state) => {
        const newRequest: WithdrawalRequest = {
          id: `withdrawal_${Date.now()}`,
          creatorId: "creator_123",
          amount,
          status: "pending",
          method,
          bankDetails: method === "bank" ? bankDetails : undefined,
          upiId: method === "upi" ? upiId : undefined,
          requestedAt: new Date().toISOString(),
        };
        
        // Add withdrawal transaction
        const withdrawalTransaction: Transaction = {
          id: `txn_${Date.now()}`,
          userId: "creator_123",
          type: "withdrawal",
          amount: -amount,
          balanceAfter: state.totalEarnings - amount,
          description: method === "upi" 
            ? `Withdrawal to UPI: ${upiId}`
            : `Withdrawal to ${bankDetails?.bankName || "Bank Account"}`,
          createdAt: new Date().toISOString(),
        };
        
        return {
          withdrawalRequests: [...state.withdrawalRequests, newRequest],
          pendingWithdrawal: state.pendingWithdrawal + amount,
          totalEarnings: state.totalEarnings - amount,
          transactions: [withdrawalTransaction, ...state.transactions],
        };
      }),
      
      updateEarnings: (updates) => set((state) => ({
        earnings: { ...state.earnings, ...updates },
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
    }
  )
);