import React, { useState, useRef, useEffect } from 'react';
import CameraFeed from './components/CameraFeed';
import VoiceService from './services/VoiceService';
import AIService from './services/AIService';
import Settings from './components/Settings';
import { Mic, MicOff, Camera, Settings as SettingsIcon } from 'lucide-react';

// Speech recognition is causing crashes, so we mock it for now
// import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';

function App() {
    const cameraRef = useRef(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [lastResponse, setLastResponse] = useState("Tap the screen or ask a question.");
    const [isListening, setIsListening] = useState(false);
    const [showSettings, setShowSettings] = useState(false);

    // Load config from local storage on mount
    const [aiConfig, setAiConfig] = useState({
        provider: localStorage.getItem('ai_provider') || 'gemini',
        apiKey: localStorage.getItem('ai_api_key') || ''
    });

    // Mock speech recognition hooks
    const transcript = "";
    const listening = isListening;
    const browserSupportsSpeechRecognition = false; // Force false to avoid using the library
    const resetTranscript = () => { };

    useEffect(() => {
        // Welcome message
        VoiceService.speak("Vision Assistant ready. Tap the screen to describe what is in front of you.");
    }, []);

    const handleVoiceCommand = async (command) => {
        if (!command) return;
        console.log("Voice command:", command);
        processImage(command);
    };

    const processImage = async (query = "Describe what is in front of me.") => {
        if (isProcessing) return;

        if (!aiConfig.apiKey) {
            VoiceService.speak("Please set your API Key in settings first.");
            setShowSettings(true);
            return;
        }

        setIsProcessing(true);
        VoiceService.speak("Analyzing...");

        try {
            const imageBase64 = cameraRef.current?.captureFrame();
            if (!imageBase64) {
                VoiceService.speak("I cannot see anything. Please check the camera.");
                setIsProcessing(false);
                return;
            }

            const description = await AIService.analyzeImage(imageBase64, query, aiConfig);
            setLastResponse(description);
            VoiceService.speak(description);
        } catch (error) {
            console.error(error);
            VoiceService.speak("Sorry, something went wrong.");
            setLastResponse("Error: " + error.message);
        } finally {
            setIsProcessing(false);
            resetTranscript();
        }
    };

    const toggleListening = () => {
        VoiceService.speak("Voice commands are currently disabled to prevent crashes.");
        setIsListening(false);
    };

    const handleScreenTap = () => {
        if (showSettings) return; // Don't trigger if settings is open
        processImage();
    };

    return (
        <div className="relative w-full h-screen bg-black overflow-hidden" onClick={handleScreenTap}>
            {/* Camera Feed Layer */}
            <div className="absolute inset-0 z-0">
                <CameraFeed ref={cameraRef} isActive={true} />
            </div>

            {/* Settings Modal */}
            <Settings
                isOpen={showSettings}
                onClose={() => setShowSettings(false)}
                onSave={(newConfig) => setAiConfig(newConfig)}
            />

            {/* UI Overlay */}
            <div className="absolute inset-0 z-10 flex flex-col justify-between p-6 pointer-events-none">

                {/* Header / Status */}
                <div className="flex justify-between items-start pointer-events-auto">
                    <div className="bg-black/60 backdrop-blur-md p-3 rounded-xl text-white">
                        <h1 className="text-lg font-bold">Vision Assistant</h1>
                        <p className="text-sm text-gray-300">
                            {isProcessing ? "Processing..." : "Ready"}
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={(e) => { e.stopPropagation(); setShowSettings(true); }}
                            className="bg-black/60 backdrop-blur-md p-3 rounded-full text-white active:bg-gray-700"
                        >
                            <SettingsIcon className="w-6 h-6" />
                        </button>
                        <div className="bg-black/60 backdrop-blur-md p-3 rounded-full text-white">
                            <MicOff className="w-6 h-6 text-gray-400" />
                        </div>
                    </div>
                </div>

                {/* Center Response Area (High Contrast) */}
                <div className="flex-1 flex items-center justify-center">
                    {lastResponse && !showSettings && (
                        <div className="bg-black/70 backdrop-blur-md p-6 rounded-2xl max-w-sm text-center border border-white/10">
                            <p className="text-2xl font-medium text-white leading-relaxed">
                                {lastResponse}
                            </p>
                        </div>
                    )}
                </div>

                {/* Bottom Controls */}
                <div className="flex justify-center gap-6 pointer-events-auto pb-8">
                    <button
                        onClick={(e) => { e.stopPropagation(); processImage(); }}
                        className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform"
                        aria-label="Describe Scene"
                    >
                        <Camera className="w-8 h-8 text-black" />
                    </button>

                    <button
                        onClick={(e) => { e.stopPropagation(); toggleListening(); }}
                        className="w-20 h-20 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform bg-gray-600"
                        aria-label="Voice Command Disabled"
                    >
                        <MicOff className="w-8 h-8 text-white" />
                    </button>
                </div>
            </div>
        </div>
    );
}

export default App;
