
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Mic, MicOff, Upload, Download, FileAudio, Play, Pause, Square, Volume2, Keyboard, Zap } from 'lucide-react';
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
  const [audioLevel, setAudioLevel] = useState(0);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [confidence, setConfidence] = useState(0);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const finalTranscriptRef = useRef('');
  const lastProcessedIndexRef = useRef(0);
  const recordingStartTimeRef = useRef<number>(0);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Check if speech recognition is supported
  const isSpeechRecognitionSupported = () => {
    return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Space bar to start/stop recording
      if (event.code === 'Space' && event.ctrlKey && !event.repeat) {
        event.preventDefault();
        if (isRecording) {
          stopRecording();
        } else {
          startRecording();
        }
      }
      
      // Ctrl+D to download
      if (event.ctrlKey && event.key === 'd' && !event.repeat) {
        event.preventDefault();
        downloadTranscription();
      }
      
      // Ctrl+Shift+C to clear
      if (event.ctrlKey && event.shiftKey && event.key === 'C' && !event.repeat) {
        event.preventDefault();
        clearTranscription();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRecording, transcription]);

  // Initialize speech recognition
  useEffect(() => {
    console.log('Initializing speech recognition...');
    console.log('Speech recognition supported:', isSpeechRecognitionSupported());
    
    if (isSpeechRecognitionSupported()) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      if (recognitionRef.current) {
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
          console.log('Speech recognition result received');
          let interimTranscript = '';
          let newFinalTranscript = '';

          // Only process results from the last processed index onwards
          for (let i = lastProcessedIndexRef.current; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            const resultConfidence = event.results[i][0].confidence || 0;
            console.log('Processing result index:', i, 'Transcript:', transcript, 'isFinal:', event.results[i].isFinal);
            
            if (event.results[i].isFinal) {
              newFinalTranscript += transcript + ' ';
              lastProcessedIndexRef.current = i + 1;
              setConfidence(resultConfidence * 100);
            } else {
              interimTranscript += transcript;
              setConfidence(resultConfidence * 100);
            }
          }

          // Update final transcript only if we have new final results
          if (newFinalTranscript) {
            finalTranscriptRef.current += newFinalTranscript;
            console.log('Updated final transcript:', finalTranscriptRef.current);
          }

          // Set the display transcription (final + interim)
          setTranscription(finalTranscriptRef.current + interimTranscript);
          
          // Simulate audio level animation
          setAudioLevel(Math.random() * 100);
        };

        recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
          console.error('Speech recognition error:', event.error, event.message);
          toast({
            title: "Speech Recognition Error",
            description: `Error: ${event.error}. ${event.message || 'Please try again.'}`,
            variant: "destructive",
          });
          setIsRecording(false);
          setIsProcessing(false);
          if (durationIntervalRef.current) {
            clearInterval(durationIntervalRef.current);
          }
        };

        recognitionRef.current.onend = () => {
          console.log('Speech recognition ended');
          setIsRecording(false);
          setIsProcessing(false);
          setAudioLevel(0);
          if (durationIntervalRef.current) {
            clearInterval(durationIntervalRef.current);
          }
        };

        recognitionRef.current.onstart = () => {
          console.log('Speech recognition started');
          setIsProcessing(false);
          // Reset the processed index when starting a new recording session
          lastProcessedIndexRef.current = 0;
          recordingStartTimeRef.current = Date.now();
          setRecordingDuration(0);
          
          // Start duration timer
          durationIntervalRef.current = setInterval(() => {
            setRecordingDuration(Math.floor((Date.now() - recordingStartTimeRef.current) / 1000));
          }, 1000);
          
          toast({
            title: "Recording Started",
            description: "Speak clearly into your microphone. Use Ctrl+Space to stop.",
          });
        };
      }
    } else {
      console.log('Speech recognition not supported');
    }
  }, [toast]);

  // Start live recording
  const startRecording = async () => {
    console.log('Start recording button clicked');
    
    if (!isSpeechRecognitionSupported()) {
      toast({
        title: "Not Supported",
        description: "Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('Requesting microphone access...');
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('Microphone access granted');
      
      setIsRecording(true);
      setIsProcessing(true);
      
      // Reset tracking variables for new recording
      lastProcessedIndexRef.current = 0;
      finalTranscriptRef.current = transcription ? transcription + '\n--- New Recording ---\n' : '--- New Recording ---\n';
      setTranscription(finalTranscriptRef.current);
      
      if (recognitionRef.current) {
        console.log('Starting speech recognition...');
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
    console.log('Stop recording button clicked');
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);
    setIsProcessing(false);
    setAudioLevel(0);
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
    }
    toast({
      title: "Recording Stopped",
      description: `Transcription completed successfully. Duration: ${recordingDuration}s`,
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
    finalTranscriptRef.current = '';
    lastProcessedIndexRef.current = 0;
    setAudioFile(null);
    setRecordingDuration(0);
    setConfidence(0);
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

  // Format duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex flex-col">
      {/* Full Screen Header */}
      <div className="bg-white/90 backdrop-blur-md shadow-lg border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Mic className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Speech-to-Text Studio
                </h1>
                <p className="text-gray-600">
                  Professional real-time transcription
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {!isSpeechRecognitionSupported() && (
                <Badge variant="destructive">
                  Not Supported
                </Badge>
              )}
              <div className="flex items-center space-x-2 text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-lg">
                <Keyboard className="h-4 w-4" />
                <span>Ctrl+Space: Record</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Left Panel - Controls */}
        <div className="w-80 bg-white/80 backdrop-blur-md shadow-lg border-r border-white/20 flex flex-col">
          <div className="p-6 space-y-6">
            {/* Recording Status */}
            {isRecording && (
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
                  
                  {/* Audio Level Visualization */}
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
            )}

            {/* Live Recording Controls */}
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
                      onClick={startRecording}
                      disabled={isProcessing || !isSpeechRecognitionSupported()}
                      className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                      size="lg"
                    >
                      <Mic className="h-5 w-5 mr-2" />
                      Start Recording
                    </Button>
                  ) : (
                    <Button 
                      onClick={stopRecording}
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

            {/* File Upload */}
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

            {/* Quick Actions */}
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
                  onClick={clearTranscription}
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
          </div>
        </div>

        {/* Right Panel - Transcription Area */}
        <div className="flex-1 flex flex-col">
          <div className="p-6 flex-1 flex flex-col">
            {/* Transcription Stats */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <Badge variant="outline" className="bg-white/80">
                  {transcription.length} characters
                </Badge>
                <Badge variant="outline" className="bg-white/80">
                  {transcription.trim().split(/\s+/).filter(word => word.length > 0).length} words
                </Badge>
                {isRecording && (
                  <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                    Live Recording
                  </Badge>
                )}
              </div>
            </div>

            {/* Main Transcription Area */}
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
                  onChange={(e) => setTranscription(e.target.value)}
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

          {/* Bottom Status Bar */}
          <div className="bg-white/90 backdrop-blur-md border-t border-white/20 px-6 py-3">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div className="flex items-center space-x-4">
                <span>Status: {isRecording ? 'Recording...' : isProcessing ? 'Processing...' : 'Ready'}</span>
                {isRecording && (
                  <span className="text-red-600">Duration: {formatDuration(recordingDuration)}</span>
                )}
              </div>
              <div className="flex items-center space-x-4">
                <span>Language: English (US)</span>
                <span>Browser: {isSpeechRecognitionSupported() ? '✅ Compatible' : '❌ Not Supported'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
