
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mic, Square } from 'lucide-react';

interface LiveRecordingControlsProps {
  isRecording: boolean;
  isProcessing: boolean;
  isSpeechRecognitionSupported: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
}

const LiveRecordingControls = ({
  isRecording,
  isProcessing,
  isSpeechRecognitionSupported,
  onStartRecording,
  onStopRecording
}: LiveRecordingControlsProps) => {
  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-900">
          <Mic className="h-5 w-5" />
          Live Recording
        </CardTitle>
        <CardDescription>
          Real-time speech transcription with visual feedback
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          {!isRecording ? (
            <Button 
              onClick={onStartRecording}
              disabled={isProcessing || !isSpeechRecognitionSupported}
              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              size="lg"
            >
              <Mic className="h-5 w-5 mr-2" />
              Start Recording
            </Button>
          ) : (
            <Button 
              onClick={onStopRecording}
              variant="destructive"
              className="flex-1 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-200"
              size="lg"
            >
              <Square className="h-5 w-5 mr-2" />
              Stop Recording
            </Button>
          )}
        </div>
        
        <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
          💡 Use <kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">Ctrl + Space</kbd> to start/stop
        </div>
      </CardContent>
    </Card>
  );
};

export default LiveRecordingControls;
