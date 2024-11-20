import { create } from 'zustand';

interface Page {
  id: string;
  content: string;
}

interface Doc {
  id: string;
  title: string;
  pages: Page[];
  activePage: string;
}

interface DocsStore {
  docs: Doc[];
  activeDoc: string | null;
  addDoc: () => void;
  addPage: (docId: string) => void;
  updateDoc: (id: string, updates: Partial<Omit<Doc, 'pages'>>) => void;
  updatePage: (docId: string, pageId: string, content: string) => void;
  setActiveDoc: (id: string) => void;
  setActivePage: (docId: string, pageId: string) => void;
  saveDocument: (docId: string) => Promise<void>;
}

export const useDocsStore = create<DocsStore>((set) => ({
  docs: [
    {
      id: '1',
      title: 'Welcome',
      pages: [
        {
          id: 'page-1',
          content: '<h1>Welcome to TipTap Docs</h1><p>Start typing to create your document...</p>',
        }
      ],
      activePage: 'page-1',
    },
  ],
  activeDoc: '1',
  addDoc: () =>
    set((state) => {
      const newDoc = {
        id: Date.now().toString(),
        title: 'Untitled',
        pages: [{ id: 'page-1', content: '' }],
        activePage: 'page-1',
      };
      return {
        docs: [...state.docs, newDoc],
        activeDoc: newDoc.id,
      };
    }),
  addPage: (docId: string) =>
    set((state) => ({
      docs: state.docs.map((doc) => {
        if (doc.id === docId) {
          const newPage = {
            id: `page-${doc.pages.length + 1}`,
            content: '',
          };
          return {
            ...doc,
            pages: [...doc.pages, newPage],
            activePage: newPage.id,
          };
        }
        return doc;
      }),
    })),
  updateDoc: (id, updates) =>
    set((state) => ({
      docs: state.docs.map((doc) =>
        doc.id === id ? { ...doc, ...updates } : doc
      ),
    })),
  updatePage: (docId, pageId, content) =>
    set((state) => ({
      docs: state.docs.map((doc) =>
        doc.id === docId
          ? {
              ...doc,
              pages: doc.pages.map((page) =>
                page.id === pageId ? { ...page, content } : page
              ),
            }
          : doc
      ),
    })),
  setActiveDoc: (id) => set({ activeDoc: id }),
  setActivePage: (docId, pageId) =>
    set((state) => ({
      docs: state.docs.map((doc) =>
        doc.id === docId ? { ...doc, activePage: pageId } : doc
      ),
    })),
saveDocument: async (docId: string) => {
    const state = useDocsStore.getState();
    const doc = state.docs.find(d => d.id === docId);
    if (!doc) return;

    // Combine all pages content into one document
    const combinedContent = doc.pages.map(page => page.content).join('\n');

    try {
      const response = await fetch('/api/save-vitedoc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: doc.title,
          content: combinedContent
        }),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to save document');
      }

      const result = await response.json();
      console.log('Document saved:', result);
    } catch (error) {
      console.error('Error saving document:', error);
      throw error;
    }
  },
}));