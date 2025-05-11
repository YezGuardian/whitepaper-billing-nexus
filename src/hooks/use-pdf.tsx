
import { useRef, useState } from 'react';
import { usePDF } from 'react-to-pdf';

export function useReactToPdf({ filename = 'document.pdf' }: { filename?: string } = {}) {
  const targetRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  
  // In react-to-pdf v2, targetRef is passed directly to the hook, not inside options
  const { toPDF } = usePDF({
    filename,
    targetRef,
    options: {
      // Only pass valid format options inside the options object
      format: [210, 297], // A4 dimensions in mm
      orientation: 'portrait',
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm',
      },
      hotfix: { px_to_mm: 0.36 }
    }
  });

  const generatePdf = async () => {
    try {
      setLoading(true);
      // The toPDF function from react-to-pdf v2 expects 0 arguments
      await toPDF();
    } catch (error) {
      console.error('Failed to generate PDF:', error);
    } finally {
      setLoading(false);
    }
  };

  return { toPDF: generatePdf, targetRef, loading };
}
