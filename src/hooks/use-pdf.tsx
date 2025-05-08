
import { useRef, useState } from 'react';
import ReactToPdf from 'react-to-pdf';

export function useReactToPdf({ filename = 'document.pdf' }: { filename?: string } = {}) {
  const targetRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);

  const toPDF = async () => {
    if (!targetRef.current) return;
    
    try {
      setLoading(true);
      // Using the default export from react-to-pdf
      await ReactToPdf({
        element: targetRef.current,
        options: {
          filename: filename,
          page: {
            margin: 20,
            format: 'a4',
          },
        },
      });
    } catch (error) {
      console.error('Failed to generate PDF:', error);
    } finally {
      setLoading(false);
    }
  };

  return { toPDF, targetRef, loading };
}
