import { useRef, useCallback, useEffect, useState } from 'react';

export function useAudio(speed: number) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [frenchVoice, setFrenchVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!('speechSynthesis' in window)) return;

    const findVoice = () => {
      const voices = speechSynthesis.getVoices();
      const french = voices.find((v) => v.lang.startsWith('fr-FR'))
        ?? voices.find((v) => v.lang.startsWith('fr'));
      if (french) setFrenchVoice(french);
    };

    findVoice();
    speechSynthesis.addEventListener('voiceschanged', findVoice);
    return () => speechSynthesis.removeEventListener('voiceschanged', findVoice);
  }, []);

  const playAudio = useCallback(
    async (text: string, audioFile?: string) => {
      // Stop any playing audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if ('speechSynthesis' in window) speechSynthesis.cancel();

      // Try MP3 first
      if (audioFile) {
        try {
          const audio = new Audio(audioFile);
          audio.playbackRate = speed;
          audio.addEventListener('ended', () => setPlaying(false));
          audio.addEventListener('pause', () => setPlaying(false));
          audioRef.current = audio;
          setPlaying(true);
          await audio.play();
          return;
        } catch {
          setPlaying(false);
          // Fall through to TTS
        }
      }

      // TTS fallback
      if (frenchVoice) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.voice = frenchVoice;
        utterance.rate = speed;
        utterance.lang = 'fr-FR';
        utterance.addEventListener('end', () => setPlaying(false));
        utterance.addEventListener('error', () => setPlaying(false));
        setPlaying(true);
        speechSynthesis.speak(utterance);
      }
    },
    [speed, frenchVoice]
  );

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if ('speechSynthesis' in window) speechSynthesis.cancel();
    setPlaying(false);
  }, []);

  useEffect(() => {
    return () => { stop(); };
  }, [stop]);

  return { playAudio, stop, playing, hasTTS: !!frenchVoice };
}
