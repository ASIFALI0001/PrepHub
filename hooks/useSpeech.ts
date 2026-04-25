"use client";

import { useCallback, useRef, useState } from "react";

export type SpeechState = "idle" | "speaking" | "listening";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySpeechRecognition = any;

function getSpeechRecognition(): AnySpeechRecognition | null {
  if (typeof window === "undefined") return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function useSpeech() {
  const [state, setState] = useState<SpeechState>("idle");
  const recognitionRef = useRef<AnySpeechRecognition>(null);

  const speak = useCallback((text: string): Promise<void> => {
    return new Promise((resolve) => {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.rate = 0.95;
      utter.pitch = 1;
      utter.volume = 1;

      const voices = window.speechSynthesis.getVoices();
      const preferred =
        voices.find((v) => v.lang === "en-US" && (v.name.includes("Google") || v.name.includes("Natural"))) ??
        voices.find((v) => v.lang.startsWith("en")) ??
        null;
      if (preferred) utter.voice = preferred;

      utter.onstart = () => setState("speaking");
      utter.onend = () => { setState("idle"); resolve(); };
      utter.onerror = () => { setState("idle"); resolve(); };

      setState("speaking");
      window.speechSynthesis.speak(utter);
    });
  }, []);

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis.cancel();
    setState("idle");
  }, []);

  // Continuous listen — calls onChunk for each recognised phrase, stays on until stopListening()
  const startListening = useCallback((onChunk: (text: string) => void) => {
    const SpeechRec = getSpeechRecognition();
    if (!SpeechRec) return;

    // Stop any existing session first
    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      recognitionRef.current.stop();
    }

    const rec = new SpeechRec();
    rec.lang = "en-US";
    rec.continuous = true;
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    rec.onstart = () => setState("listening");

    // Auto-restart on unexpected end (browser stops after ~60s of silence)
    rec.onend = () => {
      if (recognitionRef.current === rec) {
        try { rec.start(); } catch { /* already stopped */ }
      }
    };

    rec.onresult = (e: SpeechRecognitionEvent) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) {
          const chunk = e.results[i][0].transcript.trim();
          if (chunk) onChunk(chunk);
        }
      }
    };

    rec.onerror = (e: SpeechRecognitionErrorEvent) => {
      if (e.error === "no-speech") return; // ignore silence gaps
      setState("idle");
    };

    recognitionRef.current = rec;
    try { rec.start(); } catch { /* ignore */ }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.onend = null; // prevent auto-restart
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setState("idle");
  }, []);

  return { state, speak, stopSpeaking, startListening, stopListening };
}
