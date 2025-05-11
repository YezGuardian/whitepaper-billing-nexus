
import { useRef, useState } from 'react';
import { usePDF } from 'react-to-pdf';

export function useReactToPdf({ filename = 'document.pdf' }: { filename?: string } = {}) {
  const targetRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  
  // Use the proper hook from react-to-pdf with correct options
  const { toPDF } = usePDF({
    filename,
    // PDF generation options are specified at the root level
    format: 'a4',
    orientation: 'portrait',
    margin: {
      top: '20mm',
      right: '20mm',
      bottom: '20mm',
      left: '20mm',
    },
    hotfix: { px_to_mm: 0.36 }
  });

  const generatePdf = async () => {
    try {
      setLoading(true);
      // Pass correct options to toPDF function - it expects an Options object or undefined
      // We're using targetRef directly in the component that renders the PDF content
      await toPDF(targetRef);
    } catch (error) {
      console.error('Failed to generate PDF:', error);
    } finally {
      setLoading(false);
    }
  };

  return { toPDF: generatePdf, targetRef, loading };
}
