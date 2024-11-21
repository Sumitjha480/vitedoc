import { useEffect, useState } from 'react';
import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import { Bold, Italic, List, AlignLeft, AlignCenter, AlignRight, Highlighter, ChevronDown, ChevronUp, MessageSquare } from 'lucide-react';
import { useDocsStore } from '../store/docs';
import AnnotationPopover from './AnnotationPopover';
import { Annotation } from '../extensions/annotation';

const MenuButton = ({ onClick, active, children }: { onClick: () => void; active?: boolean; children: React.ReactNode }) => (
  <button
    onClick={onClick}
    className={`p-2 rounded hover:bg-gray-100 ${active ? 'text-blue-600' : 'text-gray-600'}`}
  >
    {children}
  </button>
);

export default function Editor({ content, onChange, docId }: { content: string; onChange: (content: string) => void; docId: string }) {
  const [showAnnotationPopover, setShowAnnotationPopover] = useState(false);
  const [annotationPosition, setAnnotationPosition] = useState({ top: 0, left: 0 });
  const { docs, setActivePage } = useDocsStore();
  const currentDoc = docs.find(doc => doc.id === docId);
  const currentPageIndex = currentDoc?.pages.findIndex(page => page.id === currentDoc.activePage) ?? 0;
  const currentPage = currentDoc?.pages[currentPageIndex];

  const editor = useEditor({
    extensions: [
      StarterKit,
      Highlight,
      Annotation,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Placeholder.configure({
        placeholder: 'Start writing...',
      }),
    ],
    content: content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Update editor content when switching pages
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [editor, content]);

  const navigateToPage = (direction: 'next' | 'prev') => {
    if (!currentDoc) return;
    
    // Save current page content before navigation
    if (editor) {
      onChange(editor.getHTML());
    }
    
    const newIndex = direction === 'next' 
      ? Math.min(currentPageIndex + 1, currentDoc.pages.length - 1)
      : Math.max(currentPageIndex - 1, 0);
    
    if (newIndex !== currentPageIndex) {
      setActivePage(docId, currentDoc.pages[newIndex].id);
    }
  };

  if (!editor || !currentDoc) {
    return null;
  }

  const isFirstPage = currentPageIndex === 0;
  const isLastPage = currentPageIndex === currentDoc.pages.length - 1;

  return (
    <div className="relative prose prose-lg max-w-none">
      {editor && (
        <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }}>
          <div className="flex items-center space-x-1 bg-white shadow-lg rounded-lg border p-1">
            <MenuButton
              onClick={() => editor.chain().focus().toggleBold().run()}
              active={editor.isActive('bold')}
            >
              <Bold className="w-4 h-4" />
            </MenuButton>
            <MenuButton
              onClick={() => editor.chain().focus().toggleItalic().run()}
              active={editor.isActive('italic')}
            >
              <Italic className="w-4 h-4" />
            </MenuButton>
            <MenuButton
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              active={editor.isActive('bulletList')}
            >
              <List className="w-4 h-4" />
            </MenuButton>
            <div className="w-px h-4 bg-gray-200 mx-1" />
            <MenuButton
              onClick={() => editor.chain().focus().setTextAlign('left').run()}
              active={editor.isActive({ textAlign: 'left' })}
            >
              <AlignLeft className="w-4 h-4" />
            </MenuButton>
            <MenuButton
              onClick={() => editor.chain().focus().setTextAlign('center').run()}
              active={editor.isActive({ textAlign: 'center' })}
            >
              <AlignCenter className="w-4 h-4" />
            </MenuButton>
            <MenuButton
              onClick={() => editor.chain().focus().setTextAlign('right').run()}
              active={editor.isActive({ textAlign: 'right' })}
            >
              <AlignRight className="w-4 h-4" />
            </MenuButton>
            <div className="w-px h-4 bg-gray-200 mx-1" />
            <MenuButton
              onClick={() => editor.chain().focus().toggleHighlight().run()}
              active={editor.isActive('highlight')}
            >
              <Highlighter className="w-4 h-4" />
            </MenuButton>
            <div className="w-px h-4 bg-gray-200 mx-1" />
            <MenuButton
              onClick={() => {
                const selection = window.getSelection();
                if (selection && !selection.isCollapsed) {
                  const range = selection.getRangeAt(0);
                  const rect = range.getBoundingClientRect();
                  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                  const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
                  
                  setAnnotationPosition({
                    top: rect.bottom + scrollTop + 10,
                    left: rect.left + scrollLeft + (rect.width / 2),
                  });
                  
                  setShowAnnotationPopover(true);
                }
              }}
              active={editor.isActive('annotation')}
            >
              <MessageSquare className="w-4 h-4" />
            </MenuButton>
          </div>
        </BubbleMenu>
      )}
      <EditorContent editor={editor} className="min-h-[500px] focus:outline-none" />
      {showAnnotationPopover && (
        <AnnotationPopover 
          editor={editor}
          isVisible={showAnnotationPopover}
          onClose={() => setShowAnnotationPopover(false)}
          position={annotationPosition}
        />
      )}
      
      <div className="fixed bottom-8 right-8 flex flex-col gap-2">
        {!isFirstPage && (
          <button
            onClick={() => navigateToPage('prev')}
            className="p-3 bg-white rounded-full shadow-lg hover:bg-gray-50 transition-colors"
            title="Previous page"
          >
            <ChevronUp className="w-5 h-5" />
          </button>
        )}
        {!isLastPage && (
          <button
            onClick={() => navigateToPage('next')}
            className="p-3 bg-white rounded-full shadow-lg hover:bg-gray-50 transition-colors"
            title="Next page"
          >
            <ChevronDown className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}