import { Upload } from 'lucide-react';
import { useDocsStore } from '../store/docs';
import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.js`;

export default function ImportButton() {
  const importDocument = useDocsStore((state) => state.importDocument);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      let content: string;
      const isPdf = file.type === 'application/pdf';
      
      if (isPdf) {

        //FIX IT
        //import for pdf is not working

        const arrayBuffer = await file.arrayBuffer();
        console.log('ArrayBuffer length:', arrayBuffer.byteLength);
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        console.log('Loading PDF...:', loadingTask);
        console.log('Promise:', loadingTask);
        const pdf = await loadingTask.promise;
        console.log('PDF loaded:', pdf);
        // const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const numPages = pdf.numPages;
        const pages = [];
        
        for (let i = 1; i <= numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items
          .filter((item: any) => item.str && item.str.trim())
          .map((item: any) => item.str)
          .join(' ');
          pages.push({
            content: `<div>${pageText.split('\n')
              .filter(line => line.trim())
              .map(line => `<p>${line}</p>`)
              .join('')}</div>`,
            comments: []
          });
          // const pageText = textContent.items
          //   .map((item: any) => item.str)
          //   .join(' ');
          // pages.push({
          //   content: `<div>${pageText.split('\n').map(line => 
          //     line.trim() ? `<p>${line}</p>` : ''
          //   ).join('')}</div>`,
          //   comments: []
          // });
        }
        
        importDocument(file.name.replace(/\.pdf$/, ''), pages);
      } else {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer });
        const pages = result.value.split('<hr>').map(pageContent => ({
          content: pageContent,
          comments: []
        }));
        
        importDocument(file.name.replace(/\.docx$/, ''), pages);
      }
    } catch (error) {
      console.error('Error importing document:', error);
      alert('Error importing document. Please try again.');
    }
  };

  return (
    <label className="flex items-center space-x-2 p-2 hover:bg-gray-200 rounded-lg cursor-pointer">
      <Upload className="w-5 h-5" />
      <span>Import Document</span>
      <input
        type="file"
        accept=".docx,.pdf"
        onChange={handleFileUpload}
        className="hidden"
      />
    </label>
  );
}