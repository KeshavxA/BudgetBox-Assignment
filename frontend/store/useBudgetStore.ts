import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Budget fields
export type BudgetData = {
  income: number;
  monthlyBills: number;
  food: number;
  transport: number;
  subscriptions: number;
  miscellaneous: number;
};

type SyncStatus = 'Local Only' | 'Sync Pending' | 'Synced';

interface BudgetState {
  data: BudgetData;
  status: SyncStatus;
  updateField: (field: keyof BudgetData, value: number) => void;
  setSyncStatus: (status: SyncStatus) => void;
  loadFromServer: (data: BudgetData) => void;
}

export const useBudgetStore = create<BudgetState>()(
  persist(
    (set) => ({
      data: {
        income: 0,
        monthlyBills: 0,
        food: 0,
        transport: 0,
        subscriptions: 0,
        miscellaneous: 0,
      },
      status: 'Local Only',

      // Auto-save field value instantly
      updateField: (field, value) =>
        set((state) => ({
          data: { ...(state as any).data, [field]: value },
          status: 'Sync Pending',
        })),

      setSyncStatus: (status) => set({ status }),

      loadFromServer: (serverData) =>
        set({
          data: { ...(serverData as BudgetData) },
          status: 'Synced',
        }),
    }),
    {
      name: 'budget-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
 