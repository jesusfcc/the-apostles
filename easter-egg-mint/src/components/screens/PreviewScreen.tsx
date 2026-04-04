"use client";

import type { EggTraits } from "~/lib/traits";

interface PreviewScreenProps {
  traits: EggTraits;
  imageBase64: string;
  onMint: () => void;
  onRegenerate: () => void;
}

const DISPLAY_TRAITS: (keyof EggTraits)[] = [
  "pattern",
  "texture",
  "mood",
  "style",
  "vibe",
  "signatureSymbol",
];

export default function PreviewScreen({
  traits,
  imageBase64,
  onMint,
  onRegenerate,
}: PreviewScreenProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-6">
      {/* Egg image card */}
      <div className="border-2 border-vintage-black p-2 bg-paper max-w-[280px] w-full">
        <img
          src={`data:image/png;base64,${imageBase64}`}
          alt="Your generated Easter egg"
          className="w-full h-auto"
        />
      </div>

      {/* Line divider */}
      <div className="w-full flex justify-center my-5">
        <img src="/assets/Line15.png" alt="" className="w-20 h-auto" />
      </div>

      {/* Color dots */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-6 h-6 rounded-full border border-vintage-black"
          style={{ backgroundColor: traits.dominantColor }}
          title={`Dominant: ${traits.dominantColor}`}
        />
        <div
          className="w-6 h-6 rounded-full border border-vintage-black"
          style={{ backgroundColor: traits.secondaryColor }}
          title={`Secondary: ${traits.secondaryColor}`}
        />
      </div>

      {/* Trait pills */}
      <div className="flex flex-wrap justify-center gap-2 mb-6 max-w-[300px]">
        {DISPLAY_TRAITS.map((key) => (
          <span
            key={key}
            className="bg-vintage-black/10 text-vintage-black text-xs px-3 py-1 rounded-full"
          >
            {traits[key]}
          </span>
        ))}
      </div>

      {/* Mint button */}
      <div className="w-full max-w-xs">
        <button
          onClick={onMint}
          className="w-full py-4 border-2 border-vintage-black bg-vintage-black text-paper font-bold text-lg tracking-widest"
        >
          MINT THIS EGG
        </button>
      </div>

      {/* Regenerate link */}
      <button
        onClick={onRegenerate}
        className="mt-4 text-vintage-black/60 text-sm underline underline-offset-2 hover:text-vintage-black/80 transition-colors"
      >
        Regenerate
      </button>
    </div>
  );
}
