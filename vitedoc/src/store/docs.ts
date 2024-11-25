import { create } from 'zustand';

interface Annotation {
  id: string;
  content: string;
  pageId: string;
  createdAt: Date;
  position: {
    start: number;
    end: number;
  };
}

interface Page {
  id: string;
  content: string;
  annotations: Annotation[];
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
  deleteAnnotation: (docId: string, pageId: string, annotationId: string) => void;
  setActiveDoc: (id: string) => void;
  setActivePage: (docId: string, pageId: string) => void;
  saveDocument: (docId: string) => Promise<void>;
  addAnnotation: (docId: string, pageId: string, annotation: Omit<Annotation, 'id'>) => void;
  importDocument: (title: string, pages: { content: string; comments: Comment[] }[]) => void;
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
          annotations: [],
        }
      ],
      activePage: 'page-1',
    },
  ],
  activeDoc: '1',
    addDoc: (existingDoc?: Partial<Doc>) =>
      set((state) => {
        const newDoc = {
          id: existingDoc?.id || Date.now().toString(),
          title: existingDoc?.title || 'Untitled',
          pages: existingDoc?.pages || [{ id: 'page-1', content: '', annotations: [] }],
          activePage: existingDoc?.activePage || 'page-1',
        };
        // Remove any existing doc with same ID if it exists
        const filteredDocs = state.docs.filter(d => d.id !== newDoc.id);
        return {
          docs: [...filteredDocs, newDoc],
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
            annotations: [],
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
addAnnotation: (docId: string, pageId: string, annotation: Omit<Annotation, 'id'>) =>
    set((state) => ({
      docs: state.docs.map((doc) =>
        doc.id === docId
          ? {
              ...doc,
              pages: doc.pages.map((page) =>
                page.id === pageId
                  ? {
                      ...page,
                      annotations: [
                        ...page.annotations,
                        { ...annotation, id: Date.now().toString() },
                      ],
                    }
                  : page
              ),
            }
          : doc
      ),
    })),

    deleteAnnotation: (docId: string, pageId: string, annotationId: string) =>
      set((state) => ({
        docs: state.docs.map((doc) =>
          doc.id === docId
            ? {
                ...doc,
                pages: doc.pages.map((page) =>
                  page.id === pageId
                    ? {
                        ...page,
                        annotations: page.annotations.filter((a) => a.id !== annotationId),
                      }
                    : page
                ),
              }
            : doc
        ),
      })),
      
  importDocument: (title, pages) =>
    set((state) => {
      const newDoc = {
        id: Date.now().toString(),
        title,
        pages: pages.map((page, index) => ({
          id: `page-${index + 1}`,
          content: page.content,
          comments: page.comments,
        })),
        activePage: 'page-1',
      };
      return {
        docs: [...state.docs, newDoc],
        activeDoc: newDoc.id,
      };
    }),

  saveDocument: async (docId: string) => {
    const state = useDocsStore.getState();
    const doc = state.docs.find(d => d.id === docId);
    if (!doc) {
      console.error('Document not found:', docId);
      throw new Error('Document not found');
    }

    // Combine all pages content into one document
    const combinedContent = doc.pages.map(page => page.content).join('\n');
    
    if (!combinedContent.trim()) {
      console.error('Empty document content');
      throw new Error('Document content cannot be empty');
    }

    try {
      const endpoint = '/api/save-vitedoc';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: doc.title,
          content: combinedContent,
          annotations: doc.pages.flatMap(page => 
            (page.annotations || []).map(ann => ({
              ...ann,
              pageId: page.id,
              createdAt: ann.createdAt || new Date()
            }))
          )
        }),
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Save response not OK:', response.status, errorData);
        throw new Error(errorData.error || 'Failed to save document');
      }

      const result = await response.json();
      console.log('Document saved successfully:', result);
      return result;
    } catch (error) {
      console.error('Error saving document:', error);
      throw error;
    }
  },
}));