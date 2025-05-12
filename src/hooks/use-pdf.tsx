
import { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { supabase } from '@/integrations/supabase/client';

export function useReactToPdf({ filename = 'document.pdf' }: { filename?: string } = {}) {
  const targetRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  
  const generatePdf = async () => {
    try {
      setLoading(true);
      
      if (!targetRef.current) {
        throw new Error('Target ref is not available');
      }
      
      // Use html2canvas to convert the DOM element to a canvas
      const canvas = await html2canvas(targetRef.current, {
        scale: 2, // Improves rendering quality
        useCORS: true, // Allows loading images from other domains
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      // Calculate dimensions for A4 page (297mm x 210mm at 72dpi)
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Create PDF with jsPDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/png');
      
      // Add image to PDF
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      
      // Generate blob
      const blob = pdf.output('blob');
      
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
      // Create a blob URL directly from the PDF output
      const pdfOutput = pdf.output('blob');
      const blobUrl = URL.createObjectURL(pdfOutput);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = uniqueFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the blob URL
      setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
      
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
