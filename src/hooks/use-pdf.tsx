
import { useRef, useState } from 'react';
import { usePDF } from 'react-to-pdf';

export function useReactToPdf({ filename = 'document.pdf' }: { filename?: string } = {}) {
  const targetRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  
  // Use the proper hook from react-to-pdf with correct options
  const { toPDF } = usePDF({
    filename,
    // The correct approach is to use the options format required by react-to-pdf v2
  });

  const generatePdf = async () => {
    if (!targetRef.current) return;
    
    try {
      setLoading(true);
      // Pass the target ref to toPDF when it's called
      await toPDF(targetRef.current);
    } catch (error) {
      console.error('Failed to generate PDF:', error);
    } finally {
      setLoading(false);
    }
  };

  return { toPDF: generatePdf, targetRef, loading };
}
