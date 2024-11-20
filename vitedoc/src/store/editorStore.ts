import { create } from 'zustand';
import { nanoid } from 'nanoid';

export interface Page {
  id: string;
  content: string;
  title: string;
}

interface EditorStore {
  pages: Page[];
  currentPageId: string;
  addPage: () => void;
  updatePageContent: (pageId: string, content: string) => void;
  updatePageTitle: (pageId: string, title: string) => void;
  setCurrentPage: (pageId: string) => void;
}

export const useEditorStore = create<EditorStore>((set) => ({
  pages: [{ id: nanoid(), content: '', title: 'Untitled' }],
  currentPageId: '',
  addPage: () => {
    set((state) => ({
      pages: [...state.pages, { id: nanoid(), content: '', title: 'Untitled' }],
    }));
  },
  updatePageContent: (pageId, content) => {
    set((state) => ({
      pages: state.pages.map((page) =>
        page.id === pageId ? { ...page, content } : page
      ),
    }));
  },
  updatePageTitle: (pageId, title) => {
    set((state) => ({
      pages: state.pages.map((page) =>
        page.id === pageId ? { ...page, title } : page
      ),
    }));
  },
  setCurrentPage: (pageId) => {
    set({ currentPageId: pageId });
  },
}));