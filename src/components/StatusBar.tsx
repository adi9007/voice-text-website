
interface StatusBarProps {
  isRecording: boolean;
  isProcessing: boolean;
  recordingDuration: number;
  isSpeechRecognitionSupported: boolean;
}

const StatusBar = ({ isRecording, isProcessing, recordingDuration, isSpeechRecognitionSupported }: StatusBarProps) => {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
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
          <span>Browser: {isSpeechRecognitionSupported ? '✅ Compatible' : '❌ Not Supported'}</span>
        </div>
      </div>
    </div>
  );
};

export default StatusBar;
