import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Transaction } from '@/types';
import { walletApi } from '@/services/api';

interface WalletState {
  balance: number;
  totalEarned: number;
  totalSpent: number;
  transactions: Transaction[];
  dailyLoginClaimed: boolean;
  dailyStreak: number;
  adsWatchedToday: number;
  lastLoginDate: string;
  isLoading: boolean;

  fetchWalletData: () => Promise<void>;
  addPoints: (amount: number, type: Transaction['type'], description: string) => Promise<void>;
  deductPoints: (amount: number, type: Transaction['type'], description: string) => void;
  claimDailyLogin: () => Promise<void>;
  watchAd: () => Promise<void>;
  resetDailyLimits: () => void;
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set, get) => ({
      balance: 0,
      totalEarned: 0,
      totalSpent: 0,
      transactions: [],
      dailyLoginClaimed: false,
      dailyStreak: 0,
      adsWatchedToday: 0,
      lastLoginDate: new Date().toISOString().split('T')[0],
      isLoading: false,

      fetchWalletData: async () => {
        set({ isLoading: true });
        try {
          // Fetch balance and transactions in parallel
          const [balanceData, transactionsData] = await Promise.all([
            walletApi.getBalance().catch(() => ({ balance: 0, totalEarned: 0, totalSpent: 0 })),
            walletApi.getTransactions().catch(() => ({ transactions: [] }))
          ]);

          set({
            balance: balanceData.balance || 0,
            totalEarned: balanceData.totalEarned || 0,
            totalSpent: balanceData.totalSpent || 0,
            transactions: transactionsData.transactions || [],
            isLoading: false
          });
        } catch (error) {
          console.error('Failed to fetch wallet data:', error);
          set({ isLoading: false });
        }
      },

      addPoints: async (amount, type, description) => {
        // Optimistic update
        const state = get();
        const newBalance = state.balance + amount;

        try {
          // Call API to add points (if endpoint exists, otherwise we rely on backend logic for specific actions)
          // For manual points addition (e.g. ads, daily login), we use specific endpoints
          if (type === 'daily_login' || type === 'ad_watch') {
            // These are handled by specific methods below
            return;
          }

          // For generic add points (dev/test), we might use the walletApi.addPoints
          await walletApi.addPoints(amount, description);

          // Refresh data
          await get().fetchWalletData();
        } catch (error) {
          console.error('Failed to add points:', error);
          // Revert optimistic update if we did one (not implemented here for simplicity, relying on fetch)
        }
      },

      deductPoints: (amount, type, description) => {
        // Optimistic update for UI responsiveness
        const state = get();
        const newBalance = Math.max(0, state.balance - amount);
        const transaction: Transaction = {
          id: `temp_${Date.now()}`,
          userId: 'current_user',
          type,
          amount: -amount,
          balanceAfter: newBalance,
          description,
          createdAt: new Date().toISOString(),
        };

        set({
          balance: newBalance,
          totalSpent: state.totalSpent + amount,
          transactions: [transaction, ...state.transactions],
        });

        // We expect the actual operation (e.g., generation) to sync the wallet later
        // or we can trigger a fetch after a delay
        setTimeout(() => {
          get().fetchWalletData();
        }, 2000);
      },

      claimDailyLogin: async () => {
        const state = get();
        const today = new Date().toISOString().split('T')[0];

        if (!state.dailyLoginClaimed && state.lastLoginDate !== today) {
          try {
            await walletApi.addPoints(3, 'Daily login bonus');
            set({
              dailyLoginClaimed: true,
              dailyStreak: state.dailyStreak + 1,
              lastLoginDate: today,
            });
            await get().fetchWalletData();
          } catch (error) {
            console.error('Failed to claim daily login:', error);
          }
        }
      },

      watchAd: async () => {
        const state = get();
        if (state.adsWatchedToday < 5) {
          try {
            await walletApi.addPoints(6, 'Watched reward ad');
            set({ adsWatchedToday: state.adsWatchedToday + 1 });
            await get().fetchWalletData();
          } catch (error) {
            console.error('Failed to record ad watch:', error);
          }
        }
      },

      resetDailyLimits: () => {
        set({ dailyLoginClaimed: false, adsWatchedToday: 0 });
      },
    }),
    {
      name: 'rupantar-wallet',
    }
  )
);
