import { useEffect, useRef, useState } from 'react';

// Speech recognition is built into Chrome and Edge. Other browsers simply don't show the button.
const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;

const LANGUAGES = [
  { code: 'hi-IN', label: 'हिन्दी' },
  { code: 'en-IN', label: 'English' },
];

const ERROR_TEXT = {
  'not-allowed': 'Microphone permission is blocked. Allow it in the browser address bar.',
  'service-not-allowed': 'Microphone permission is blocked. Allow it in the browser address bar.',
  'no-speech': 'No speech heard. Try again.',
  'audio-capture': 'No microphone found.',
  network: 'Speech recognition needs an internet connection.',
};

// Speaks a customer's voice note aloud and appends the words to the message box.
export default function VoiceInput({ onText }) {
  const [language, setLanguage] = useState('hi-IN');
  const [listening, setListening] = useState(false);
  const [error, setError] = useState('');
  const recognitionRef = useRef(null);

  useEffect(() => () => recognitionRef.current?.abort(), []);

  if (!Recognition) return null;

  function start() {
    const recognition = new Recognition();
    recognition.lang = language;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => onText(event.results[0][0].transcript);
    recognition.onerror = (event) => setError(ERROR_TEXT[event.error] || 'Could not understand. Try again.');
    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    setError('');
    setListening(true);
    recognition.start();
  }

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={listening ? () => recognitionRef.current?.stop() : start}
        className={`rounded-full px-3 py-1.5 text-sm font-medium ${
          listening ? 'animate-pulse bg-red-600 text-white' : 'border border-stone-300 bg-white text-stone-800 hover:bg-stone-50'
        }`}
      >
        {listening ? '● Listening… tap to stop' : '🎤 Speak the query'}
      </button>
      <select
        value={language}
        onChange={(event) => setLanguage(event.target.value)}
        disabled={listening}
        aria-label="Speech language"
        className="rounded-lg border border-stone-300 bg-white px-2 py-1.5 text-sm"
      >
        {LANGUAGES.map((item) => (
          <option key={item.code} value={item.code}>
            {item.label}
          </option>
        ))}
      </select>
      {error && <span className="text-xs text-red-700">{error}</span>}
    </div>
  );
}
