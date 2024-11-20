import React, { useEffect, useRef, useState } from 'react';
import { Editor } from '@tiptap/react';
import { MessageSquare } from 'lucide-react';

interface AnnotationPopoverProps {
  editor: Editor;
  isVisible: boolean;
  onClose: () => void;
  position: { top: number; left: number };
}

export default function AnnotationPopover({ editor, isVisible, onClose, position }: AnnotationPopoverProps) {
  const [popoverPosition] = useState(position);
  const [annotation, setAnnotation] = useState('');
  const [selectedText, setSelectedText] = useState('');
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const selection = window.getSelection();
    if (selection) {
      setSelectedText(selection.toString().trim());
    }
    
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current && 
        !popoverRef.current.contains(event.target as Node) &&
        !(event.target as HTMLElement).closest('.ProseMirror')
      ) {
        onClose();
        setAnnotation('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const addAnnotation = () => {
    if (!annotation.trim() || !selectedText) return;

    editor.chain().focus().setMark('annotation', { comment: annotation }).run();
    setAnnotation('');
    onClose();
    setSelectedText('');
  };

  const handleTextareaClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  if (!isVisible || !selectedText) return null;

  return (
    <div
      ref={popoverRef}
      style={{
        position: 'fixed',
        top: `${position.top}px`,
        left: `${position.left}px`,
        transform: 'translateX(-50%)',
      }}
      className="bg-white rounded-lg shadow-lg p-3 z-50 min-w-[250px]"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-start gap-2">
        <MessageSquare className="w-5 h-5 text-blue-500 mt-2" />
        <textarea
          value={annotation}
          onChange={(e) => setAnnotation(e.target.value)}
          onClick={handleTextareaClick}
          onFocus={(e) => e.stopPropagation()}
          placeholder="Add a comment..."
          className="flex-1 p-2 border rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
          autoFocus
        />
      </div>
      <div className="flex justify-end gap-2 mt-2">
        <button
          onClick={() => {
            onClose();
            setAnnotation('');
          }}
          className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded"
        >
          Cancel
        </button>
        <button
          onClick={addAnnotation}
          className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Comment
        </button>
      </div>
    </div>
  );
}