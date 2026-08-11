import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import type { CaptionPosition, CaptionStylePreset } from '@/lib/captionStyles';
import { buildAssSubtitleFile } from '@/lib/render-ass';
import type { WordTimestamp } from '@/components/caption-canvas-renderer';

export const runtime = 'nodejs';

const ffmpegPath = process.env.FFMPEG_PATH ?? ffmpegStatic ?? 'ffmpeg';
ffmpeg.setFfmpegPath(ffmpegPath);

function isCaptionPosition(value: unknown): value is CaptionPosition {
  return value === 'top' || value === 'center' || value === 'bottom';
}

function isCaptionStylePreset(value: unknown): value is CaptionStylePreset {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.name === 'string'
    && typeof candidate.fontFamily === 'string'
    && typeof candidate.fontSize === 'number'
    && typeof candidate.color === 'string'
    && typeof candidate.strokeColor === 'string'
    && typeof candidate.strokeWidth === 'number'
    && typeof candidate.animation === 'string'
    && isCaptionPosition(candidate.position)
  );
}

function isWordTimestampArray(value: unknown): value is WordTimestamp[] {
  return Array.isArray(value)
    && value.every((entry) => entry
      && typeof entry === 'object'
      && typeof (entry as Record<string, unknown>).word === 'string'
      && typeof (entry as Record<string, unknown>).start === 'number'
      && typeof (entry as Record<string, unknown>).end === 'number');
}

function escapeFilterPath(filePath: string) {
  return filePath
    .replace(/\\/g, '/')
    .replace(/:/g, '\\:')
    .replace(/'/g, "\\'")
    .replace(/,/g, '\\,')
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]');
}

function getDownloadFilename(originalName: string) {
  const ext = path.extname(originalName).toLowerCase();

  if (ext === '.mov' || ext === '.mp4') {
    return `captioned-video${ext}`;
  }

  return 'captioned-video.mp4';
}

function getContentType(filename: string) {
  if (filename.endsWith('.mov')) {
    return 'video/quicktime';
  }

  return 'video/mp4';
}

async function renderVideoWithCaptions({
  inputPath,
  outputPath,
  subtitlePath
}: {
  inputPath: string;
  outputPath: string;
  subtitlePath: string;
}) {
  await new Promise<void>((resolve, reject) => {
    ffmpeg(inputPath)
      .videoFilters(`subtitles='${escapeFilterPath(subtitlePath)}'`)
      .outputOptions([
        '-map 0:v:0',
        '-map 0:a?',
        '-map_metadata 0',
        '-map_chapters 0',
        '-c:v libx264',
        '-preset slow',
        '-crf 18',
        '-pix_fmt yuv420p',
        '-c:a copy',
        '-movflags +faststart'
      ])
      .on('error', reject)
      .on('end', () => resolve())
      .save(outputPath);
  });
}

export async function POST(request: Request) {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'caption-render-'));
  const cleanup = async () => {
    await rm(tempDir, { recursive: true, force: true });
  };

  try {
    const formData = await request.formData();
    const video = formData.get('video');
    const wordTimestampsRaw = formData.get('wordTimestamps');
    const styleRaw = formData.get('style');

    if (!(video instanceof File)) {
      return Response.json({ error: 'Provide a video file in the video form field.' }, { status: 400 });
    }

    if (typeof wordTimestampsRaw !== 'string' || typeof styleRaw !== 'string') {
      return Response.json(
        { error: 'Provide wordTimestamps and style JSON fields with the render request.' },
        { status: 400 }
      );
    }

    let parsedTimestamps: unknown;
    let parsedStyle: unknown;

    try {
      parsedTimestamps = JSON.parse(wordTimestampsRaw);
      parsedStyle = JSON.parse(styleRaw);
    } catch {
      return Response.json({ error: 'Render request contained invalid JSON.' }, { status: 400 });
    }

    if (!isWordTimestampArray(parsedTimestamps)) {
      return Response.json({ error: 'wordTimestamps must be an array of { word, start, end } objects.' }, { status: 400 });
    }

    if (!isCaptionStylePreset(parsedStyle)) {
      return Response.json({ error: 'style must be a valid caption preset object.' }, { status: 400 });
    }

    const inputExt = path.extname(video.name).toLowerCase() || '.mp4';
    const outputFilename = getDownloadFilename(video.name);
    const inputPath = path.join(tempDir, `input${inputExt}`);
    const subtitlePath = path.join(tempDir, 'captions.ass');
    const outputPath = path.join(tempDir, outputFilename);

    await writeFile(inputPath, Buffer.from(await video.arrayBuffer()));
    await writeFile(subtitlePath, buildAssSubtitleFile(parsedTimestamps, parsedStyle));

    try {
      await renderVideoWithCaptions({ inputPath, outputPath, subtitlePath });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown FFmpeg error.';
      return Response.json(
        {
          error:
            `FFmpeg render failed: ${message}. `
            + 'If a local binary is not available, set FFMPEG_PATH or install ffmpeg-static.'
        },
        { status: 502 }
      );
    }

    const rendered = await readFile(outputPath);
    const filename = getDownloadFilename(video.name);
    const contentType = getContentType(filename);
    const response = new Response(rendered, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'X-Rendered-By': 'ffmpeg'
      }
    });

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown render error.';
    return Response.json({ error: message }, { status: 500 });
  } finally {
    await cleanup();
  }
}
