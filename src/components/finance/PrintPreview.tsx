import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer } from 'lucide-react';

interface PrintPreviewProps {
  children: React.ReactNode;
  onBack: () => void;
}

export function PrintPreview({ children, onBack }: PrintPreviewProps) {
  return (
    <div className="print-preview-container">
      {/* Toolbar - hidden when printing */}
      <div className="no-print sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3 flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Quay lại
        </Button>
        <Button size="sm" onClick={() => window.print()}>
          <Printer className="h-4 w-4 mr-1" /> In
        </Button>
      </div>

      {/* Print content */}
      <div className="max-w-3xl mx-auto py-6 px-4">
        {children}
      </div>
    </div>
  );
}
