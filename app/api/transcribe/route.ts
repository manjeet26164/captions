import Groq from 'groq-sdk';
import ffmpegStatic from 'ffmpeg-static';
import ffmpeg from 'fluent-ffmpeg';
import { createReadStream } from 'node:fs';
import { mkdtemp, rm, stat, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const MAX_AUDIO_BYTES = 25 * 1024 * 1024;
const AUDIO_BITRATES_KBPS = [64, 48, 32, 24];

if (ffmpegStatic) {
  ffmpeg.setFfmpegPath(ffmpegStatic as string);
}

export const runtime = 'nodejs';

type TranscriptWord = {
  word: string;
  start: number;
  end: number;
};

function getApiKey() {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    throw new Error('missing_api_key');
  }

  return apiKey;
}

function toTranscriptWords(value: unknown): TranscriptWord[] {
  if (!Array.isArray(value)) {
    throw new Error('Groq did not return a JSON array.');
  }

  return value.map((entry) => {
    if (!entry || typeof entry !== 'object') {
      throw new Error('Invalid transcript entry returned by Groq.');
    }

    const candidate = entry as Record<string, unknown>;
    const word = candidate.word;
    const start = candidate.start;
    const end = candidate.end;

    if (typeof word !== 'string' || typeof start !== 'number' || typeof end !== 'number') {
      throw new Error('Invalid transcript entry returned by Groq.');
    }

    return { word, start, end };
  });
}

type GroqVerboseTranscription = {
  text?: string;
  words?: TranscriptWord[];
  segments?: Array<{
    words?: TranscriptWord[];
  }>;
};

function getAudioFormatName(filename: string) {
  return filename.toLowerCase().endsWith('.mov') ? 'm4a' : 'mp3';
}

async function extractAudioTrack(
  inputPath: string,
  outputPath: string,
  bitrateKbps: number
) {
  await new Promise<void>((resolve, reject) => {
    ffmpeg(inputPath)
      .noVideo()
      .audioChannels(1)
      .audioFrequency(16000)
      .audioBitrate(`${bitrateKbps}k`)
      .format(outputPath.toLowerCase().endsWith('.m4a') ? 'ipod' : 'mp3')
      .on('error', reject)
      .on('end', () => resolve())
      .save(outputPath);
  });
}

async function getCompressedAudioFile(inputPath: string, tempDir: string, originalName: string) {
  const audioExtension = getAudioFormatName(originalName) === 'm4a' ? '.m4a' : '.mp3';

  for (const bitrateKbps of AUDIO_BITRATES_KBPS) {
    const audioPath = path.join(tempDir, `audio-${bitrateKbps}${audioExtension}`);

    await extractAudioTrack(inputPath, audioPath, bitrateKbps);

    const audioStats = await stat(audioPath);

    if (audioStats.size <= MAX_AUDIO_BYTES) {
      return audioPath;
    }
  }

  throw new Error('The extracted audio is still larger than 25MB. Please upload a shorter video.');
}

function extractTranscriptWords(response: GroqVerboseTranscription): TranscriptWord[] {
  if (Array.isArray(response.words) && response.words.length > 0) {
    return toTranscriptWords(response.words);
  }

  const segmentWords = response.segments?.flatMap((segment) => segment.words ?? []) ?? [];

  if (segmentWords.length > 0) {
    return toTranscriptWords(segmentWords);
  }

  throw new Error('Groq did not return word-level timestamps.');
}

export async function POST(request: Request) {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'caption-transcribe-'));

  try {
    const formData = await request.formData();
    const uploaded = formData.get('file') ?? formData.get('video');

    if (!(uploaded instanceof File)) {
      return Response.json(
        { error: 'Provide a video file in the file or video form field.' },
        { status: 400 }
      );
    }

    if (!['video/mp4', 'video/quicktime'].includes(uploaded.type) && !/\.(mp4|mov)$/i.test(uploaded.name)) {
      return Response.json(
        { error: 'Only .mp4 and .mov files are supported.' },
        { status: 400 }
      );
    }

    let apiKey: string;

    try {
      apiKey = getApiKey();
    } catch (error) {
      if (error instanceof Error && error.message === 'missing_api_key') {
        return Response.json(
          {
            error: 'Missing GROQ_API_KEY. Add it to .env.local before calling /api/transcribe.'
          },
          { status: 500 }
        );
      }

      throw error;
    }

    const client = new Groq({ apiKey });

    try {
      const inputPath = path.join(tempDir, `input${path.extname(uploaded.name) || '.mp4'}`);
      await writeFile(inputPath, Buffer.from(await uploaded.arrayBuffer()));

      const audioPath = await getCompressedAudioFile(inputPath, tempDir, uploaded.name);

      const audioStats = await stat(audioPath);
      if (audioStats.size > MAX_AUDIO_BYTES) {
        return Response.json(
          {
            error: 'The extracted audio is still larger than 25MB. Please upload a shorter video.'
          },
          { status: 413 }
        );
      }

      // Groq's free tier does not require billing setup.
      const transcription = (await client.audio.transcriptions.create({
        model: 'whisper-large-v3-turbo',
        file: createReadStream(audioPath),
        response_format: 'verbose_json',
        timestamp_granularities: ['word']
      })) as GroqVerboseTranscription;

      const transcript = extractTranscriptWords(transcription);

      return Response.json(transcript);
    } catch (error) {
      if (error instanceof Error && /larger than 25MB/i.test(error.message)) {
        return Response.json({ error: error.message }, { status: 413 });
      }

      const message = error instanceof Error ? error.message : 'Unknown Groq transcription error.';

      return Response.json(
        { error: `Groq transcription failed: ${message}` },
        { status: 502 }
      );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown transcription error.';

    if (message !== 'missing_api_key') {
      return Response.json({ error: message }, { status: 500 });
    }

    return Response.json({ error: message }, { status: 500 });
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}