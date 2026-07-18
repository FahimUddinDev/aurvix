'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  isSidebarCollapsed: boolean;
  isDarkMode: boolean;
  locale: 'en' | 'bn';
  toggleSidebar: () => void;
  toggleDarkMode: () => void;
  setLocale: (locale: 'en' | 'bn') => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      isSidebarCollapsed: false,
      isDarkMode: false,
      locale: 'en',

      toggleSidebar: () => set((s) => ({ isSidebarCollapsed: !s.isSidebarCollapsed })),

      toggleDarkMode: () =>
        set((s) => {
          const next = !s.isDarkMode;
          document.documentElement.classList.toggle('dark', next);
          return { isDarkMode: next };
        }),

      setLocale: (locale) => set({ locale }),
    }),
    {
      name: 'aurevix-ui',
      partialize: (state) => ({
        isSidebarCollapsed: state.isSidebarCollapsed,
        isDarkMode: state.isDarkMode,
        locale: state.locale,
      }),
    },
  ),
);
