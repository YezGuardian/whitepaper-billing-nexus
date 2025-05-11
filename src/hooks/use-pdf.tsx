
import { useRef, useState } from 'react';
import { usePDF } from 'react-to-pdf';

export function useReactToPdf({ filename = 'document.pdf' }: { filename?: string } = {}) {
  const targetRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  
  // Use the proper hook from react-to-pdf with the correct options structure
  const { toPDF } = usePDF({
    filename,
    // Pass targetRef to the hook
    targetRef,
    options: {
      format: 'a4',
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
      // The toPDF function from react-to-pdf v2 expects 0-1 arguments
      // We pass the ref in the options when creating the hook, not here
      await toPDF();
    } catch (error) {
      console.error('Failed to generate PDF:', error);
    } finally {
      setLoading(false);
    }
  };

  return { toPDF: generatePdf, targetRef, loading };
}
