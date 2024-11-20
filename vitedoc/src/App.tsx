import { useState} from 'react';
import Editor from './components/Editor';
import Sidebar from './components/Sidebar';
import PageTabs from './components/PageTabs';
import { useDocsStore } from './store/docs';
import { Menu, Save, ArrowLeft } from 'lucide-react';

function App() {
  const { docs, activeDoc, updateDoc } = useDocsStore();
  const currentDoc = docs.find((doc) => doc.id === activeDoc);
  const [showSidebar, setShowSidebar] = useState(true);

  const handleContentChange = (content: string) => {
    if (activeDoc && currentDoc) {
      useDocsStore.getState().updatePage(activeDoc, currentDoc.activePage, content);
    }
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (activeDoc) {
      updateDoc(activeDoc, { title: e.target.value });
    }
  };

  const currentPage = currentDoc?.pages.find(
    (page) => page.id === currentDoc.activePage
  );

  return (
    <div className="flex h-screen bg-white">
      {showSidebar && <Sidebar onToggle={() => setShowSidebar(!showSidebar)} />}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="border-b border-gray-200 p-4 flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => window.location.href = '/documents'}
              className="p-1 hover:bg-gray-100 rounded-lg"
              title="Back to Documents"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            {!showSidebar && (
              <button
                onClick={() => setShowSidebar(true)}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}
          </div>
          <input
            type="text"
            value={currentDoc?.title || ''}
            onChange={handleTitleChange}
            className="text-xl font-semibold bg-transparent border-none outline-none flex-1"
            placeholder="Untitled"
          />
          <button
            onClick={async () => {
              if (activeDoc) {
                try {
                  await useDocsStore.getState().saveDocument(activeDoc);
                  alert('Document saved successfully!');
                } catch (error) {
                  alert('Failed to save document');
                }
              }
            }}
            className="flex items-center space-x-2 px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Save className="w-4 h-4" />
            <span>Save</span>
          </button>
        </header>
        {currentDoc && <PageTabs docId={currentDoc.id} />}
        <main className="flex-1 overflow-auto p-6 bg-gray-50">
          <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm p-8">
            {currentPage && currentDoc && (
              <Editor
                content={currentPage.content}
                onChange={handleContentChange}
                docId={currentDoc.id}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;