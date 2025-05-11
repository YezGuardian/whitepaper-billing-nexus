
import { useRef, useState } from 'react';
import { usePDF } from 'react-to-pdf';

export function useReactToPdf({ filename = 'document.pdf' }: { filename?: string } = {}) {
  const targetRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  
  // Use the proper hook from react-to-pdf
  const { toPDF } = usePDF({
    filename,
  });

  const generatePdf = async () => {
    try {
      setLoading(true);
      // The toPDF function should receive an options object containing the targetRef
      // and any PDF generation options
      await toPDF(targetRef, {
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
    } catch (error) {
      console.error('Failed to generate PDF:', error);
    } finally {
      setLoading(false);
    }
  };

  return { toPDF: generatePdf, targetRef, loading };
}
