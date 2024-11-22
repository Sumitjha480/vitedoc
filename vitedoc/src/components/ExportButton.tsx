import { useState } from "react";
import { Download } from "lucide-react";
import { useDocsStore } from "../store/docs";
import { Document, Packer, Paragraph, TextRun } from "docx";
import { jsPDF } from "jspdf";

interface ExportButtonProps {
  docId: string;
}

export default function ExportButton({ docId }: ExportButtonProps) {
  const [showOptions, setShowOptions] = useState(false);
  const doc = useDocsStore((state) => state.docs.find((d) => d.id === docId));
  const [isExporting, setIsExporting] = useState(false);

  if (!doc) return null;

  const handleExport = async (format: "docx" | "pdf") => {
    setIsExporting(true);
    try {
      if (format === "docx") {
        console.log("export as doc");
        // Create docx document
        const document = new Document({
          sections: [
            {
              properties: {},
              children: doc.pages
                .map((page) => {
                  // Convert HTML content to plain text (basic conversion)
                  const tempDiv = window.document.createElement("div");
                  tempDiv.innerHTML = page.content;
                  const text = tempDiv.textContent || "";

                  return text.split("\n").map(
                    (line) =>
                      new Paragraph({
                        children: [new TextRun(line.trim())],
                        pageBreakBefore: true,
                      })
                  );
                })
                .flat(),
            },
          ],
        });

        console.log("document created");
        try {
          // Generate and download docx
          const blob = await Packer.toBlob(document);
          const url = URL.createObjectURL(blob);
          console.log("Document exported successfully:", url);
          const a = window.document.createElement("a");
          a.href = url;
          a.download = `${doc.title || "document"}.docx`;
          window.document.body.appendChild(a);
          a.click();
          window.document.body.removeChild(a);
          URL.revokeObjectURL(url);
        } catch (error) {
          console.error("Error creating DOCX:", error);
          throw new Error("Failed to create DOCX file");
        }
      } else {
        // Create PDF
        const pdf = new jsPDF();
        doc.pages.forEach((page, index) => {
          if (index > 0) {
            pdf.addPage();
          }

          // Convert HTML content to plain text (basic conversion)
          const tempDiv = document.createElement("div");
          tempDiv.innerHTML = page.content;
          const text = tempDiv.textContent || "";

          pdf.text(text, 20, 20, {
            maxWidth: 170,
          });
        });

        pdf.save(`${doc.title || "document"}.pdf`);
      }

      setShowOptions(false);
    } catch (error) {
      console.error("Error exporting document:", error);
      alert("Error exporting document. Please try again.");
    } finally{
      setIsExporting(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowOptions(!showOptions)}
        className="flex items-center space-x-2 p-2 hover:bg-gray-200 rounded-lg"
      >
        <Download className="w-5 h-5" />
        <span>Export</span>
      </button>

      {showOptions && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
          <button
            onClick={() => handleExport("docx")}
            className="w-full px-4 py-2 text-left hover:bg-gray-100"
            disabled={isExporting}
          >
            {isExporting ? 'Exporting...' : 'Export as Word (.docx)'}
          </button>
          <button
            onClick={() => handleExport("pdf")}
            className="w-full px-4 py-2 text-left hover:bg-gray-100"
            disabled={isExporting}
          >
            {isExporting ? 'Exporting...' : 'Export as PDF'}
          </button>
        </div>
      )}
    </div>
  );
}
