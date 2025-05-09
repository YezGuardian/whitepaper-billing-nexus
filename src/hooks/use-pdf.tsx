
import { useRef, useState } from 'react';
import { usePDF } from 'react-to-pdf';

export function useReactToPdf({ filename = 'document.pdf' }: { filename?: string } = {}) {
  const targetRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  
  // Use the proper hook from react-to-pdf with correct options
  const { toPDF } = usePDF({
    filename,
    // The correct property according to react-to-pdf API is not targetRef but a function
    // that returns the element
    targetRef: () => targetRef.current,
  });

  const generatePdf = async () => {
    if (!targetRef.current) return;
    
    try {
      setLoading(true);
      await toPDF();
    } catch (error) {
      console.error('Failed to generate PDF:', error);
    } finally {
      setLoading(false);
    }
  };

  return { toPDF: generatePdf, targetRef, loading };
}
