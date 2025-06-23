
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Mic, MicOff, Upload, Download, FileAudio, Play, Pause, Square } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onstart: (() => void) | null;
  onend: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

const Index = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isPlayingFile, setIsPlayingFile] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { toast } = useToast();

  // Check if speech recognition is supported
  const isSpeechRecognitionSupported = () => {
    return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
  };

  // Initialize speech recognition
  useEffect(() => {
    if (isSpeechRecognitionSupported()) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      if (recognitionRef.current) {
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
          let finalTranscript = '';
          let interimTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript + ' ';
            } else {
              interimTranscript += transcript;
            }
          }

          setTranscription(prev => {
            const lines = prev.split('\n');
            const lastLine = lines[lines.length - 1];
            const otherLines = lines.slice(0, -1);
            
            if (finalTranscript) {
              return [...otherLines, lastLine + finalTranscript].join('\n');
            } else {
              return [...otherLines, lastLine + interimTranscript].join('\n');
            }
          });
        };

        recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
          console.error('Speech recognition error:', event.error);
          toast({
            title: "Speech Recognition Error",
            description: `Error: ${event.error}. ${event.message || 'Please try again.'}`,
            variant: "destructive",
          });
          setIsRecording(false);
          setIsProcessing(false);
        };

        recognitionRef.current.onend = () => {
          setIsRecording(false);
          setIsProcessing(false);
        };

        recognitionRef.current.onstart = () => {
          setIsProcessing(false);
          toast({
            title: "Recording Started",
            description: "Speak clearly into your microphone. Transcription will appear in real-time.",
          });
        };
      }
    }
  }, [toast]);

  // Start live recording
  const startRecording = async () => {
    if (!isSpeechRecognitionSupported()) {
      toast({
        title: "Not Supported",
        description: "Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      setIsRecording(true);
      setIsProcessing(true);
      setTranscription(prev => prev + '\n--- New Recording ---\n');
      
      if (recognitionRef.current) {
        recognitionRef.current.start();
      }
    } catch (error) {
      console.error('Microphone access error:', error);
      toast({
        title: "Microphone Access Denied",
        description: "Please allow microphone access to use live transcription.",
        variant: "destructive",
      });
      setIsRecording(false);
      setIsProcessing(false);
    }
  };

  // Stop live recording
  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);
    setIsProcessing(false);
    toast({
      title: "Recording Stopped",
      description: "Transcription completed successfully.",
    });
  };

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file type
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
      setTranscription(prev => prev + '\n--- File Upload: ' + file.name + ' ---\n');
      toast({
        title: "File Uploaded",
        description: `${file.name} uploaded successfully. Click 'Transcribe File' to process.`,
      });
    }
  };

  // Transcribe uploaded file
  const transcribeFile = () => {
    if (!audioFile) {
      toast({
        title: "No File Selected",
        description: "Please upload an audio file first.",
        variant: "destructive",
      });
      return;
    }

    if (!isSpeechRecognitionSupported()) {
      toast({
        title: "Not Supported",
        description: "Speech recognition is not supported in your browser.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    
    // Create audio element to play the file
    const audioUrl = URL.createObjectURL(audioFile);
    audioRef.current = new Audio(audioUrl);
    
    // Note: Direct file transcription requires more complex setup with Web Audio API
    // For now, we'll simulate the process and guide users to play the file while recording
    toast({
      title: "File Transcription",
      description: "Play the audio file and start live recording simultaneously for transcription. Direct file processing requires additional setup.",
      variant: "default",
    });
    
    setIsProcessing(false);
  };

  // Play/pause uploaded audio file
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

  // Download transcription
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

  // Clear transcription
  const clearTranscription = () => {
    setTranscription('');
    setAudioFile(null);
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlayingFile(false);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    toast({
      title: "Cleared",
      description: "Transcription and audio files have been cleared.",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center py-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Speech-to-Text Transcription Tool
          </h1>
          <p className="text-lg text-gray-600">
            Convert audio files or live speech to text with real-time transcription
          </p>
          {!isSpeechRecognitionSupported() && (
            <Badge variant="destructive" className="mt-2">
              Speech Recognition Not Supported in This Browser
            </Badge>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Live Recording Card */}
          <Card className="bg-white/80 backdrop-blur-sm shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mic className="h-5 w-5" />
                Live Recording
              </CardTitle>
              <CardDescription>
                Record speech directly from your microphone for real-time transcription
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                {!isRecording ? (
                  <Button 
                    onClick={startRecording}
                    disabled={isProcessing || !isSpeechRecognitionSupported()}
                    className="flex-1"
                  >
                    <Mic className="h-4 w-4 mr-2" />
                    Start Recording
                  </Button>
                ) : (
                  <Button 
                    onClick={stopRecording}
                    variant="destructive"
                    className="flex-1"
                  >
                    <MicOff className="h-4 w-4 mr-2" />
                    Stop Recording
                  </Button>
                )}
              </div>
              
              {isRecording && (
                <div className="flex items-center justify-center p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-center gap-2 text-red-600">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium">Recording in progress...</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* File Upload Card */}
          <Card className="bg-white/80 backdrop-blur-sm shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileAudio className="h-5 w-5" />
                File Upload
              </CardTitle>
              <CardDescription>
                Upload an audio file (WAV, MP3, OGG, WebM) for transcription
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
                  className="w-full"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Choose Audio File
                </Button>
                
                {audioFile && (
                  <div className="space-y-2">
                    <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                      Selected: {audioFile.name}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={toggleFilePlayback}
                        variant="outline"
                        size="sm"
                        className="flex-1"
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
                        className="flex-1"
                      >
                        Transcribe File
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Transcription Results */}
        <Card className="bg-white/80 backdrop-blur-sm shadow-lg">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Transcription Results</CardTitle>
                <CardDescription>
                  Your speech-to-text transcription will appear here
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={downloadTranscription}
                  disabled={!transcription.trim()}
                  variant="outline"
                  size="sm"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
                <Button
                  onClick={clearTranscription}
                  disabled={!transcription.trim()}
                  variant="outline"
                  size="sm"
                >
                  <Square className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Textarea
              value={transcription}
              onChange={(e) => setTranscription(e.target.value)}
              placeholder="Transcribed text will appear here... Start recording or upload an audio file to begin."
              className="min-h-[300px] resize-none"
            />
            {transcription && (
              <div className="mt-2 text-sm text-gray-500">
                Characters: {transcription.length} | Words: {transcription.trim().split(/\s+/).filter(word => word.length > 0).length}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="bg-blue-50/80 backdrop-blur-sm shadow-lg border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900">Instructions</CardTitle>
          </CardHeader>
          <CardContent className="text-blue-800 space-y-2">
            <p><strong>Live Recording:</strong> Click "Start Recording" and speak clearly. Transcription appears in real-time.</p>
            <p><strong>File Upload:</strong> Upload an audio file, play it, and start recording simultaneously for transcription.</p>
            <p><strong>Browser Support:</strong> Works best in Chrome, Edge, and Safari. Requires microphone permissions.</p>
            <p><strong>Tips:</strong> Speak clearly, avoid background noise, and ensure stable internet connection for best results.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;
