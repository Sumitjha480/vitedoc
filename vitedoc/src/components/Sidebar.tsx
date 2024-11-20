import { FileText, Plus, Menu } from 'lucide-react';
import { useDocsStore } from '../store/docs';

export default function Sidebar({ onToggle }: { onToggle: () => void }) {
  const { docs, activeDoc, addDoc, setActiveDoc } = useDocsStore();

  return (
    <div className="w-64 bg-gray-50 border-r border-gray-200 h-screen p-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <button onClick={onToggle} className="p-1 hover:bg-gray-200 rounded-lg">
            <Menu className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-semibold">My Documents</h2>
        </div>
        <button
          onClick={addDoc}
          className="p-2 hover:bg-gray-200 rounded-full transition-colors"
          title="New document"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>
      <div className="space-y-2">
        {docs.map((doc) => (
          <button
            key={doc.id}
            onClick={() => setActiveDoc(doc.id)}
            className={`flex items-center space-x-2 w-full p-2 rounded-lg transition-colors ${
              activeDoc === doc.id ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span className="truncate text-left">{doc.title || 'Untitled'}</span>
          </button>
        ))}
      </div>
    </div>
  );
}