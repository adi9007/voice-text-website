
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

interface TranscriptionAreaProps {
  transcription: string;
  isRecording: boolean;
  onTranscriptionChange: (value: string) => void;
}

const TranscriptionArea = ({ transcription, isRecording, onTranscriptionChange }: TranscriptionAreaProps) => {
  const wordCount = transcription.trim().split(/\s+/).filter(word => word.length > 0).length;

  return (
    <div className="flex-1 flex flex-col">
      <div className="p-6 flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <Badge variant="outline" className="bg-white/80">
              {transcription.length} characters
            </Badge>
            <Badge variant="outline" className="bg-white/80">
              {wordCount} words
            </Badge>
            {isRecording && (
              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                Live Recording
              </Badge>
            )}
          </div>
        </div>

        <Card className="flex-1 bg-white/90 backdrop-blur-sm shadow-xl border-white/20">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Transcription Results</span>
              <div className="text-sm text-gray-500">
                Real-time speech-to-text
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col p-6">
            <Textarea
              value={transcription}
              onChange={(e) => onTranscriptionChange(e.target.value)}
              placeholder="Your transcribed text will appear here in real-time... 

🎤 Click 'Start Recording' or press Ctrl+Space to begin
📁 Upload an audio file to transcribe
⌨️ Use keyboard shortcuts for quick actions

Start speaking clearly into your microphone for the best results!"
              className="flex-1 min-h-[500px] resize-none text-lg leading-relaxed border-0 focus:ring-0 bg-transparent"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TranscriptionArea;
