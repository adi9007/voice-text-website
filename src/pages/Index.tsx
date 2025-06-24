
import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Mic, Keyboard } from 'lucide-react';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import RecordingStatus from '@/components/RecordingStatus';
import LiveRecordingControls from '@/components/LiveRecordingControls';
import FileUpload from '@/components/FileUpload';
import QuickActions from '@/components/QuickActions';
import TranscriptionArea from '@/components/TranscriptionArea';
import StatusBar from '@/components/StatusBar';

const Index = () => {
  const [transcription, setTranscription] = useState('');
  
  const {
    isRecording,
    isProcessing,
    confidence,
    audioLevel,
    recordingDuration,
    isSpeechRecognitionSupported,
    startRecording,
    stopRecording,
    finalTranscript
  } = useSpeechRecognition();

  // Update transcription when speech recognition provides new results
  useEffect(() => {
    if (finalTranscript) {
      setTranscription(finalTranscript);
    }
  }, [finalTranscript]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space' && event.ctrlKey && !event.repeat) {
        event.preventDefault();
        if (isRecording) {
          stopRecording();
        } else {
          startRecording(transcription);
        }
      }
      
      if (event.ctrlKey && event.key === 'd' && !event.repeat) {
        event.preventDefault();
        // Download handled by QuickActions component
      }
      
      if (event.ctrlKey && event.shiftKey && event.key === 'C' && !event.repeat) {
        event.preventDefault();
        clearTranscription();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRecording, transcription, startRecording, stopRecording]);

  const handleStartRecording = () => {
    startRecording(transcription);
  };

  const handleFileTranscriptionUpdate = (text: string) => {
    setTranscription(prev => prev + text);
  };

  const clearTranscription = () => {
    setTranscription('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex flex-col">
      {/* Header */}
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
              <RecordingStatus 
                recordingDuration={recordingDuration}
                audioLevel={audioLevel}
                confidence={confidence}
              />
            )}

            {/* Live Recording Controls */}
            <LiveRecordingControls
              isRecording={isRecording}
              isProcessing={isProcessing}
              isSpeechRecognitionSupported={isSpeechRecognitionSupported()}
              onStartRecording={handleStartRecording}
              onStopRecording={stopRecording}
            />

            {/* File Upload */}
            <FileUpload
              onTranscriptionUpdate={handleFileTranscriptionUpdate}
              isSpeechRecognitionSupported={isSpeechRecognitionSupported()}
            />

            {/* Quick Actions */}
            <QuickActions
              transcription={transcription}
              onClear={clearTranscription}
            />
          </div>
        </div>

        {/* Right Panel - Transcription Area */}
        <TranscriptionArea
          transcription={transcription}
          isRecording={isRecording}
          onTranscriptionChange={setTranscription}
        />
      </div>

      {/* Bottom Status Bar */}
      <StatusBar
        isRecording={isRecording}
        isProcessing={isProcessing}
        recordingDuration={recordingDuration}
        isSpeechRecognitionSupported={isSpeechRecognitionSupported()}
      />
    </div>
  );
};

export default Index;
