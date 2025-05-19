
import { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

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
      
      // Skip Supabase storage upload which causes 403 error
      // Instead, directly create blob URL and download
      const blobUrl = URL.createObjectURL(blob);
      
      // Create download link
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = uniqueFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up blob URL
      setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
      
      return blobUrl;
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { toPDF: generatePdf, targetRef, loading, downloadUrl };
}
