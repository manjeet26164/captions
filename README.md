# caption-app

AI-powered video caption generator built with Next.js 14, TypeScript, and Tailwind CSS.

## Environment setup

Create a `.env.local` file in the project root with your Gemini API key:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

## Get a Gemini API key from Google AI Studio

1. Open [Google AI Studio](https://aistudio.google.com/apikey).
2. Sign in with your Google account.
3. Click **Create API key**.
4. Choose or create a Google Cloud project when prompted.
5. Copy the generated key into `.env.local` as `GEMINI_API_KEY`.

## Transcription endpoint

`POST /api/transcribe`

Form field accepted:

```text
file
```

The endpoint accepts `.mp4` and `.mov` files, sends them to Gemini, and returns a JSON array of word-level timestamps.