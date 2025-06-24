
import { useRef, useEffect, useState } from 'react';
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

export const useSpeechRecognition = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [confidence, setConfidence] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [recordingDuration, setRecordingDuration] = useState(0);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const finalTranscriptRef = useRef('');
  const lastProcessedIndexRef = useRef(0);
  const recordingStartTimeRef = useRef<number>(0);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  const isSpeechRecognitionSupported = () => {
    return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
  };

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

          if (newFinalTranscript) {
            finalTranscriptRef.current += newFinalTranscript;
            console.log('Updated final transcript:', finalTranscriptRef.current);
          }

          setAudioLevel(Math.random() * 100);
          
          return {
            finalTranscript: finalTranscriptRef.current,
            interimTranscript
          };
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
          lastProcessedIndexRef.current = 0;
          recordingStartTimeRef.current = Date.now();
          setRecordingDuration(0);
          
          durationIntervalRef.current = setInterval(() => {
            setRecordingDuration(Math.floor((Date.now() - recordingStartTimeRef.current) / 1000));
          }, 1000);
          
          toast({
            title: "Recording Started",
            description: "Speak clearly into your microphone. Use Ctrl+Space to stop.",
          });
        };
      }
    }
  }, [toast]);

  const startRecording = async (currentTranscription: string) => {
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
      await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('Microphone access granted');
      
      setIsRecording(true);
      setIsProcessing(true);
      
      lastProcessedIndexRef.current = 0;
      finalTranscriptRef.current = currentTranscription ? currentTranscription + '\n--- New Recording ---\n' : '--- New Recording ---\n';
      
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

  return {
    isRecording,
    isProcessing,
    confidence,
    audioLevel,
    recordingDuration,
    isSpeechRecognitionSupported,
    startRecording,
    stopRecording,
    finalTranscript: finalTranscriptRef.current
  };
};
