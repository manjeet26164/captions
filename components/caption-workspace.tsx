'use client';

import { useCallback, useState } from 'react';
import { CaptionCanvasRenderer, type WordTimestamp } from '@/components/caption-canvas-renderer';
import { VideoUploadDropzone } from '@/components/video-upload-dropzone';

type TranscribeResponse = WordTimestamp[] | { error?: string };

export function CaptionWorkspace() {
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [wordTimestamps, setWordTimestamps] = useState<WordTimestamp[]>([]);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcribeError, setTranscribeError] = useState<string | null>(null);

  const handleFileSelected = useCallback(async (file: File, previewUrl: string) => {
    setSourceFile(file);
    setVideoSrc(previewUrl);
    setWordTimestamps([]);
    setIsTranscribing(true);
    setTranscribeError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData
      });

      const payload = (await response.json()) as TranscribeResponse;

      if (!response.ok) {
        const errorMessage = !Array.isArray(payload) && typeof payload === 'object' && payload?.error
          ? payload.error
          : 'Transcription failed.';
        throw new Error(errorMessage);
      }

      if (!Array.isArray(payload)) {
        throw new Error('Transcription response was not an array.');
      }

      setWordTimestamps(payload);
    } catch (error) {
      setTranscribeError(error instanceof Error ? error.message : 'Unable to transcribe the uploaded video.');
    } finally {
      setIsTranscribing(false);
    }
  }, []);

  const handleReset = useCallback(() => {
    setVideoSrc(null);
    setSourceFile(null);
    setWordTimestamps([]);
    setIsTranscribing(false);
    setTranscribeError(null);
  }, []);

  return (
    <div className="space-y-6">
      <VideoUploadDropzone onFileSelected={handleFileSelected} onClear={handleReset} />

      {videoSrc ? (
        <div className="space-y-3">
          {isTranscribing ? (
            <div className="rounded-2xl border border-cyan-300/20 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-100">
              Transcribing video and preparing caption timeline...
            </div>
          ) : null}

          {transcribeError ? (
            <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
              {transcribeError}
            </div>
          ) : null}

          <CaptionCanvasRenderer videoSrc={videoSrc} sourceFile={sourceFile} wordTimestamps={wordTimestamps} />
        </div>
      ) : (
        <div className="rounded-[1.75rem] border border-white/10 bg-slate-950/55 p-6 text-sm text-slate-300">
          Upload a video to generate a transcript and preview the captioned canvas here.
        </div>
      )}
    </div>
  );
}
