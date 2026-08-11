'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDropzone } from 'react-dropzone';

type UploadState = 'idle' | 'uploading' | 'complete';

type VideoUploadDropzoneProps = {
  onFileSelected?: (file: File, previewUrl: string) => void;
  onClear?: () => void;
};

export function VideoUploadDropzone({ onFileSelected, onClear }: VideoUploadDropzoneProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [duration, setDuration] = useState<number | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  useEffect(() => {
    if (uploadState !== 'uploading') {
      return;
    }

    const interval = window.setInterval(() => {
      setUploadProgress((currentProgress) => {
        const nextProgress = currentProgress + Math.max(4, Math.floor(Math.random() * 14));

        if (nextProgress >= 100) {
          window.clearInterval(interval);
          setUploadState('complete');
          return 100;
        }

        return nextProgress;
      });
    }, 180);

    return () => window.clearInterval(interval);
  }, [uploadState]);

  const resetPreview = useCallback(() => {
    setUploadedFile(null);
    setUploadProgress(0);
    setUploadState('idle');
    setDuration(null);
    onClear?.();

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  }, [onClear, previewUrl]);

  const handleDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];

    if (!file) {
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    const nextPreviewUrl = URL.createObjectURL(file);

    setUploadedFile(file);
    setPreviewUrl(nextPreviewUrl);
    setUploadProgress(0);
    setUploadState('uploading');
    setDuration(null);
    onFileSelected?.(file, nextPreviewUrl);
  }, [onFileSelected, previewUrl]);

  const handleLoadedMetadata = useCallback((event: React.SyntheticEvent<HTMLVideoElement>) => {
    const mediaDuration = event.currentTarget.duration;

    if (Number.isFinite(mediaDuration)) {
      setDuration(mediaDuration);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    accept: {
      'video/mp4': ['.mp4'],
      'video/quicktime': ['.mov']
    },
    maxFiles: 1,
    multiple: false,
    onDropAccepted: handleDrop
  });

  const formattedSize = useMemo(() => {
    if (!uploadedFile) {
      return null;
    }

    const units = ['B', 'KB', 'MB', 'GB'];
    let size = uploadedFile.size;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex += 1;
    }

    return `${size.toFixed(size >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
  }, [uploadedFile]);

  const formattedDuration = useMemo(() => {
    if (duration === null) {
      return null;
    }

    const totalSeconds = Math.round(duration);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  }, [duration]);

  return (
    <div className="mx-auto flex min-h-[24rem] w-full max-w-4xl flex-col rounded-[1.5rem] border border-dashed border-cyan-300/30 bg-slate-950/65 px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:min-h-[30rem] sm:px-6 sm:py-6 lg:px-8">
      <div
        {...getRootProps()}
        className="flex min-h-[20rem] flex-1 flex-col items-center justify-center rounded-[1.25rem] border border-dashed border-cyan-300/25 bg-slate-950/55 px-4 py-8 text-center transition hover:border-cyan-300/45 hover:bg-slate-950/75 sm:min-h-[26rem] sm:px-6 sm:py-10"
      >
        <input {...getInputProps()} />

        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-cyan-300/30 bg-cyan-400/10 text-cyan-200 shadow-[0_0_40px_rgba(34,211,238,0.15)]">
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            className="h-10 w-10"
            stroke="currentColor"
            strokeWidth="1.7"
          >
            <path d="M12 16V4" strokeLinecap="round" strokeLinejoin="round" />
            <path d="m7 9 5-5 5 5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M4 16.5V19a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <p className="text-sm font-medium uppercase tracking-[0.35em] text-cyan-200/80">
          Upload your video
        </p>
        <h2 className="mt-4 text-3xl font-semibold text-white sm:text-4xl">
          {isDragActive ? 'Drop your MP4 or MOV file here' : 'Drag a file in to start captioning'}
        </h2>
        <p className="mt-4 max-w-md text-sm leading-6 text-slate-300 sm:text-base">
          Drag and drop an MP4 or MOV file. We’ll prepare a transcript, sync timing, and generate captions you can review before export.
        </p>

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            open();
          }}
          className="mt-8 rounded-full bg-cyan-400 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
        >
          Choose video
        </button>

        {uploadedFile ? (
          <div className="mt-8 w-full max-w-2xl rounded-2xl border border-white/10 bg-white/5 p-4 text-left">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-white">{uploadedFile.name}</p>
                <p className="mt-1 text-xs text-slate-400">
                  {formattedSize ? `Size: ${formattedSize}` : 'Size unavailable'}
                  {formattedDuration ? ` · Duration: ${formattedDuration}` : ' · Duration loading...'}
                </p>
              </div>

              {uploadState !== 'complete' ? (
                <p className="text-xs font-medium uppercase tracking-[0.28em] text-cyan-200/80">
                  Uploading {uploadProgress}%
                </p>
              ) : (
                <p className="text-xs font-medium uppercase tracking-[0.28em] text-emerald-300">
                  Ready
                </p>
              )}
            </div>

            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-sky-400 transition-all duration-200"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>

            <button
              type="button"
              onClick={resetPreview}
              className="mt-4 text-xs font-medium text-slate-300 transition hover:text-white"
            >
              Clear file
            </button>
          </div>
        ) : null}

        {uploadState === 'complete' && previewUrl ? (
          <div className="mt-8 w-full max-w-3xl overflow-hidden rounded-2xl border border-white/10 bg-black/30 p-3 text-left">
            <video
              key={previewUrl}
              src={previewUrl}
              controls
              playsInline
              preload="metadata"
              onLoadedMetadata={handleLoadedMetadata}
              className="aspect-video w-full rounded-xl bg-black"
            />
            <div className="mt-3 flex items-center justify-between gap-4 px-1 text-xs text-slate-400">
              <span>HTML5 video preview</span>
              <span>{formattedDuration ? `Duration: ${formattedDuration}` : 'Reading duration...'}</span>
            </div>
          </div>
        ) : null}

        {!uploadedFile ? (
          <p className="mt-4 text-xs text-slate-400">
            No file uploaded yet. Max recommended length: 10 minutes.
          </p>
        ) : null}
      </div>

      {uploadState === 'uploading' ? (
        <p className="mt-4 text-center text-xs text-slate-400">
          Preparing upload and generating a preview...
        </p>
      ) : null}
    </div>
  );
}
