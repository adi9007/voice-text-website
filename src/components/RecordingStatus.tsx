
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Volume2 } from 'lucide-react';

interface RecordingStatusProps {
  recordingDuration: number;
  audioLevel: number;
  confidence: number;
}

const RecordingStatus = ({ recordingDuration, audioLevel, confidence }: RecordingStatusProps) => {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="bg-gradient-to-r from-red-50 to-pink-50 border-red-200 animate-pulse">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-red-700 font-medium">Recording</span>
          </div>
          <span className="text-red-600 font-mono text-sm">
            {formatDuration(recordingDuration)}
          </span>
        </div>
        
        <div className="mt-3 space-y-2">
          <div className="flex items-center space-x-2">
            <Volume2 className="h-4 w-4 text-red-600" />
            <Progress value={audioLevel} className="flex-1 h-2" />
          </div>
          <div className="text-xs text-red-600">
            Confidence: {confidence.toFixed(0)}%
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RecordingStatus;
