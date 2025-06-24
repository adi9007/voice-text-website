
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Square } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface QuickActionsProps {
  transcription: string;
  onClear: () => void;
}

const QuickActions = ({ transcription, onClear }: QuickActionsProps) => {
  const { toast } = useToast();

  const downloadTranscription = () => {
    if (!transcription.trim()) {
      toast({
        title: "No Transcription",
        description: "There's no transcription to download yet.",
        variant: "destructive",
      });
      return;
    }

    const blob = new Blob([transcription], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcription-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Download Complete",
      description: "Transcription has been saved to your downloads folder.",
    });
  };

  return (
    <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
      <CardHeader>
        <CardTitle className="text-purple-900">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <Button
          onClick={downloadTranscription}
          disabled={!transcription.trim()}
          variant="outline"
          className="w-full border-purple-300 hover:bg-purple-50"
          size="sm"
        >
          <Download className="h-4 w-4 mr-2" />
          Download (Ctrl+D)
        </Button>
        <Button
          onClick={onClear}
          disabled={!transcription.trim()}
          variant="outline"
          className="w-full border-purple-300 hover:bg-purple-50"
          size="sm"
        >
          <Square className="h-4 w-4 mr-2" />
          Clear (Ctrl+Shift+C)
        </Button>
      </CardContent>
    </Card>
  );
};

export default QuickActions;
