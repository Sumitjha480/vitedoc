import React from 'react';
import { useDocsStore } from '../store/docs';
import { X } from 'lucide-react';

interface AnnotationSidebarProps {
  onClose: () => void;
  editor: any; // TODO: Add proper type from @tiptap/react
}

export const AnnotationSidebar: React.FC<AnnotationSidebarProps> = ({ onClose, editor }) => {
  const { docs, activeDoc } = useDocsStore();
  const currentDoc = docs.find((doc) => doc.id === activeDoc);
  const currentPage = currentDoc?.pages.find(
    (page) => page.id === currentDoc.activePage
  );

  if (!currentPage) return null;

  return (
    <div className="w-80 border-l border-gray-200 bg-white h-full overflow-y-auto">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-semibold">Annotations</h2>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="p-4">
        {!currentPage.annotations || currentPage.annotations.length === 0 ? (
          <p className="text-gray-500 text-center">No annotations yet</p>
        ) : (
          <div className="space-y-4">
            {currentPage.annotations?.map((annotation) => (
              <div key={annotation.id} className="flex items-start gap-2 bg-gray-50 rounded-lg p-3">
                <div className="flex-1">
                  <div className="text-sm text-gray-600 mb-1">
                    {new Date(annotation.createdAt).toLocaleString()}
                  </div>
                  <div className="text-gray-900">{annotation.content}</div>
                </div>
                <button
                  onClick={() => {
                    if (currentDoc && editor) {
                      const from = annotation.position.start;
                      const to = annotation.position.end;
                      
                      // First remove the mark from the editor
                      editor
                        .chain()
                        .focus()
                        .setTextSelection({ from, to })
                        .removeAnnotation()
                        .run();
                      
                      // Then delete from the store
                      useDocsStore.getState().deleteAnnotation(currentDoc.id, currentPage.id, annotation.id);
                    }
                  }}
                  className="text-gray-400 hover:text-red-500 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};