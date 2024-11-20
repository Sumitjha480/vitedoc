import { Plus } from 'lucide-react';
import { useDocsStore } from '../store/docs';

export default function PageTabs({ docId }: { docId: string }) {
  const doc = useDocsStore((state) => state.docs.find((d) => d.id === docId));
  const addPage = useDocsStore((state) => state.addPage);
  const setActivePage = useDocsStore((state) => state.setActivePage);

  if (!doc) return null;

  return (
    <div className="flex items-center space-x-2 border-b border-gray-200 px-4 bg-gray-50">
      <div className="flex-1 flex items-center space-x-2 overflow-x-auto py-2">
        {doc.pages.map((page, index) => (
          <button
            key={page.id}
            onClick={() => setActivePage(docId, page.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
              doc.activePage === page.id
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Page {index + 1}
          </button>
        ))}
      </div>
      <button
        onClick={() => addPage(docId)}
        className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
        title="Add new page"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}