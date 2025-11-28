const VoiceService = {
    speak: (text, lang = 'en-US') => {
        if (!window.speechSynthesis) {
            console.error("Speech synthesis not supported");
            return;
        }

        // Cancel any ongoing speech
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        utterance.rate = 1.0; // Normal speed
        utterance.pitch = 1.0;

        // Select a voice if possible (prefer Google voices or native high quality)
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(v =>
            v.lang.startsWith(lang) && (v.name.includes('Google') || v.name.includes('Premium'))
        );

        if (preferredVoice) {
            utterance.voice = preferredVoice;
        }

        window.speechSynthesis.speak(utterance);
    },

    stop: () => {
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
    }
};

export default VoiceService;
