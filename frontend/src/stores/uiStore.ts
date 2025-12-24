// UI Store - Estado de la interfaz (sidebar, modales, etc.)
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface UIStore {
  sidebarExpanded: boolean;
  toggleSidebar: () => void;
  setSidebarExpanded: (expanded: boolean) => void;
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      sidebarExpanded: true,
      toggleSidebar: () => set((state) => ({ sidebarExpanded: !state.sidebarExpanded })),
      setSidebarExpanded: (expanded: boolean) => set({ sidebarExpanded: expanded }),
    }),
    {
      name: 'ui-preferences', // localStorage key
      storage: createJSONStorage(() => localStorage),
    }
  )
);

