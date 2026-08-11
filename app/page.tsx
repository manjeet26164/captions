import { CaptionStylePicker } from '@/components/caption-style-picker';
import { CaptionWorkspace } from '@/components/caption-workspace';

const highlights = [
  'Upload any short-form or long-form clip',
  'Generate clean, timed captions with one click',
  'Export a creator-ready subtitle file'
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(56,189,238,0.16),_transparent_32%),linear-gradient(180deg,#07111f_0%,#050816_58%,#02040b_100%)] text-white">
      <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12 xl:px-12">
        <div className="mx-auto max-w-3xl text-center lg:max-w-4xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 backdrop-blur">
            <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_18px_rgba(34,211,238,0.9)]" />
            AI caption generation for modern video teams
          </div>

          <h1 className="mt-6 text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl xl:text-7xl">
            Turn raw video into polished captions in seconds.
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg lg:text-xl">
            Caption App helps creators and editors upload a clip, generate accurate subtitles, and move from rough cut to publish-ready output faster.
          </p>
        </div>

        <ul className="mx-auto mt-8 grid max-w-4xl gap-3 text-sm text-slate-200 sm:grid-cols-3 sm:gap-4 sm:text-base">
          {highlights.map((item) => (
            <li
              key={item}
              className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur"
            >
              <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.8)]" />
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 pb-10 sm:px-6 lg:px-8 xl:px-12">
        <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
          <CaptionWorkspace />

          <div className="w-full lg:pt-2">
            <CaptionStylePicker />
          </div>
        </div>
      </section>
    </main>
  );
}
