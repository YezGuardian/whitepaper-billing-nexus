
import { useRef, useState } from 'react';
import { usePDF } from 'react-to-pdf';
import { supabase } from '@/integrations/supabase/client';

export function useReactToPdf({ filename = 'document.pdf' }: { filename?: string } = {}) {
  const targetRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  
  // Initialize the usePDF hook without options
  const { toPDF } = usePDF();

  const generatePdf = async () => {
    try {
      setLoading(true);
      
      if (!targetRef.current) {
        throw new Error('Target ref is not available');
      }
      
      // Pass the configuration as proper options to toPDF
      const blob = await toPDF({
        filename,
        page: {
          // Pass the element directly as an option
          element: targetRef.current,
          format: [210, 297], // A4 dimensions in mm
          orientation: 'portrait',
          margin: {
            top: '20mm',
            right: '20mm',
            bottom: '20mm',
            left: '20mm',
          },
        },
        canvas: {
          // Add any canvas options here
          mimeType: 'image/png',
          qualityRatio: 1,
        },
      });
      
      // Check if blob exists before proceeding
      if (!blob) {
        throw new Error('Failed to generate PDF');
      }
      
      // Generate unique filename with timestamp
      const timestamp = new Date().getTime();
      const uniqueFilename = `${filename.replace('.pdf', '')}_${timestamp}.pdf`;
      
      // Upload to Supabase storage
      const { data, error } = await supabase.storage
        .from('pdfs')
        .upload(uniqueFilename, blob, {
          contentType: 'application/pdf',
          cacheControl: '3600'
        });
      
      if (error) {
        throw error;
      }
      
      // Get public URL for the uploaded file
      const { data: urlData } = supabase.storage
        .from('pdfs')
        .getPublicUrl(uniqueFilename);
      
      setDownloadUrl(urlData.publicUrl);
      
      // Auto-download the file
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = uniqueFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      return urlData.publicUrl;
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { toPDF: generatePdf, targetRef, loading, downloadUrl };
}
