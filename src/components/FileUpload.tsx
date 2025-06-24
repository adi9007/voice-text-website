
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileAudio, Upload, Play, Pause, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FileUploadProps {
  onTranscriptionUpdate: (text: string) => void;
  isSpeechRecognitionSupported: boolean;
}

const FileUpload = ({ onTranscriptionUpdate, isSpeechRecognitionSupported }: FileUploadProps) => {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isPlayingFile, setIsPlayingFile] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { toast } = useToast();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const validTypes = ['audio/wav', 'audio/mp3', 'audio/mpeg', 'audio/ogg', 'audio/webm'];
      if (!validTypes.includes(file.type)) {
        toast({
          title: "Invalid File Type",
          description: "Please upload a valid audio file (WAV, MP3, OGG, WebM).",
          variant: "destructive",
        });
        return;
      }

      setAudioFile(file);
      onTranscriptionUpdate('\n--- File Upload: ' + file.name + ' ---\n');
      toast({
        title: "File Uploaded",
        description: `${file.name} uploaded successfully. Click 'Transcribe File' to process.`,
      });
    }
  };

  const transcribeFile = () => {
    if (!audioFile) {
      toast({
        title: "No File Selected",
        description: "Please upload an audio file first.",
        variant: "destructive",
      });
      return;
    }

    if (!isSpeechRecognitionSupported) {
      toast({
        title: "Not Supported",
        description: "Speech recognition is not supported in your browser.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    
    const audioUrl = URL.createObjectURL(audioFile);
    audioRef.current = new Audio(audioUrl);
    
    toast({
      title: "File Transcription",
      description: "Play the audio file and start live recording simultaneously for transcription. Direct file processing requires additional setup.",
      variant: "default",
    });
    
    setIsProcessing(false);
  };

  const toggleFilePlayback = () => {
    if (!audioRef.current) return;

    if (isPlayingFile) {
      audioRef.current.pause();
      setIsPlayingFile(false);
    } else {
      audioRef.current.play();
      setIsPlayingFile(true);
      
      audioRef.current.onended = () => {
        setIsPlayingFile(false);
      };
    }
  };

  const clearFile = () => {
    setAudioFile(null);
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlayingFile(false);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-green-900">
          <FileAudio className="h-5 w-5" />
          File Upload
        </CardTitle>
        <CardDescription>
          Upload audio files for transcription
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={handleFileUpload}
            className="hidden"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            className="w-full border-green-300 hover:bg-green-50"
          >
            <Upload className="h-4 w-4 mr-2" />
            Choose Audio File
          </Button>
          
          {audioFile && (
            <div className="space-y-2">
              <div className="text-sm text-green-700 bg-green-100 p-2 rounded border border-green-200">
                📁 {audioFile.name}
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={toggleFilePlayback}
                  variant="outline"
                  size="sm"
                  className="flex-1 border-green-300 hover:bg-green-50"
                >
                  {isPlayingFile ? (
                    <>
                      <Pause className="h-4 w-4 mr-1" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-1" />
                      Play
                    </>
                  )}
                </Button>
                <Button
                  onClick={transcribeFile}
                  disabled={isProcessing}
                  size="sm"
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <Zap className="h-4 w-4 mr-1" />
                  Transcribe
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default FileUpload;
