"use client";

import { useState } from "react";
import InterviewModeSelector, { type InterviewMode } from "./InterviewModeSelector";
import InterviewSession from "./InterviewSession";
import VapiInterviewSession from "./VapiInterviewSession";
import type { IInterview } from "@/models/Interview";

interface Props {
  interview: IInterview & { _id: string };
  userName: string;
}

export default function InterviewModeWrapper({ interview, userName }: Props) {
  const [mode, setMode] = useState<InterviewMode | null>(null);

  // Already completed — go straight to mode selector (for retake)
  // For in-progress or pending, show mode selector first

  if (!mode) {
    return (
      <InterviewModeSelector
        interviewTitle={interview.title}
        questionCount={interview.questions.length}
        onSelect={setMode}
      />
    );
  }

  if (mode === "vapi") {
    return <VapiInterviewSession interview={interview} userName={userName} />;
  }

  return <InterviewSession interview={interview} />;
}
