"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Vapi from "@vapi-ai/web";

export type CallStatus = "idle" | "connecting" | "active" | "ending" | "ended" | "error";

export interface TranscriptLine {
  id: string;
  role: "user" | "assistant";
  text: string;
  final: boolean;
}

export interface VapiQuestion {
  id: string;
  text: string;
}

export interface RawTranscriptEntry {
  role: "user" | "assistant";
  text: string;
}

interface UseVapiOptions {
  onTranscriptReady?: (data: { transcript: RawTranscriptEntry[]; questions: VapiQuestion[] }) => void;
  onError?: (msg: string) => void;
}

function vapiErrToString(err: unknown): string {
  if (typeof err === "string") return err;
  if (err instanceof Error) return err.message;
  if (err && typeof err === "object") {
    const e = err as Record<string, unknown>;
    // Vapi wraps errors: { message: { message: [...], error, statusCode }, ... }
    const inner = e.message ?? e.error;
    if (inner && typeof inner === "object") {
      const i = inner as Record<string, unknown>;
      const msgs = i.message;
      if (Array.isArray(msgs) && msgs.length > 0) return String(msgs[0]);
      if (typeof i.error === "string") return i.error;
    }
    if (typeof inner === "string") return inner;
    try { return JSON.stringify(err); } catch { /* fall through */ }
  }
  return "Vapi call failed";
}


export function useVapi(questions: VapiQuestion[], options: UseVapiOptions = {}) {
  const vapiRef = useRef<Vapi | null>(null);
  const [status, setStatus] = useState<CallStatus>("idle");
  const [transcript, setTranscript] = useState<TranscriptLine[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const transcriptRef = useRef<TranscriptLine[]>([]);

  useEffect(() => {
    const publicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY;
    if (!publicKey) { console.error("[vapi] NEXT_PUBLIC_VAPI_PUBLIC_KEY not set"); return; }

    vapiRef.current = new Vapi(publicKey);
    const vapi = vapiRef.current;

    vapi.on("call-start", () => setStatus("active"));
    vapi.on("call-end", () => {
      setStatus("ended");
      setIsSpeaking(false);
      // Include all lines — both final and last partial (to not lose data if finalisation raced with call-end)
      const rawTranscript = transcriptRef.current
        .filter((l) => l.text.trim().length > 0)
        .map((l) => ({ role: l.role, text: l.text }));
      console.log(`[vapi] call ended — ${rawTranscript.length} transcript lines`);
      options.onTranscriptReady?.({ transcript: rawTranscript, questions });
    });
    vapi.on("speech-start", () => setIsSpeaking(true));
    vapi.on("speech-end", () => setIsSpeaking(false));

    const handleTranscriptMsg = (msg: Record<string, unknown>) => {
      const role: "user" | "assistant" = msg.role === "user" ? "user" : "assistant";
      const text: string = (msg.transcript as string) ?? "";
      // Vapi uses transcriptType: "partial" | "final", NOT msg.type
      const isFinal: boolean = msg.transcriptType === "final";
      if (!text.trim()) return;
      setTranscript((prev) => {
        const last = prev[prev.length - 1];
        let next: TranscriptLine[];
        if (last && last.role === role && !last.final) {
          next = [...prev.slice(0, -1), { ...last, text, final: isFinal }];
        } else {
          next = [...prev, { id: `${Date.now()}-${Math.random()}`, role, text, final: isFinal }];
        }
        transcriptRef.current = next;
        return next;
      });
    };

    // Vapi emits transcripts via "message" event (type:"transcript") AND a dedicated "transcript" event
    // Listen on both for maximum compatibility
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vapi.on("message" as any, (msg: any) => {
      if (msg?.type === "transcript") handleTranscriptMsg(msg);
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vapi.on("transcript" as any, (msg: any) => handleTranscriptMsg(msg));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vapi.on("error" as any, (err: any) => {
      console.error("[vapi] error", err);
      setStatus("error");
      options.onError?.(vapiErrToString(err));
    });

    return () => { vapi.stop(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startCall = useCallback(async (
    firstMessage: string,
    variableValues: Record<string, string>
  ) => {
    if (!vapiRef.current) return;
    const assistantId = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID;
    if (!assistantId) { options.onError?.("VAPI assistant ID not configured"); return; }

    setStatus("connecting");
    setTranscript([]);
    transcriptRef.current = [];

    try {
      // Only override firstMessage + variableValues — no model override to avoid 400
      await vapiRef.current.start(assistantId, {
        firstMessage,
        variableValues,
      } as never);
    } catch (err) {
      console.error("[vapi] start failed", err);
      setStatus("error");
      options.onError?.(vapiErrToString(err));
    }
  }, [options]);

  const endCall = useCallback(() => {
    setStatus("ending");
    vapiRef.current?.stop();
  }, []);

  return { status, transcript, isSpeaking, startCall, endCall };
}
