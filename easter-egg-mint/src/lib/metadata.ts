import type { EggTraits } from "~/lib/traits";

interface ERC721Metadata {
  name: string;
  description: string;
  image: string;
  external_url: string;
  attributes: Array<{ trait_type: string; value: string }>;
}

/**
 * Build OpenSea-standard ERC721 metadata JSON from egg traits.
 */
export function buildMetadata(
  fid: number,
  traits: EggTraits,
  imageURI: string
): ERC721Metadata {
  return {
    name: `Easter Egg #${fid}`,
    description: `AI-generated Easter egg for Farcaster user ${fid}`,
    image: imageURI,
    external_url: process.env.NEXT_PUBLIC_APP_URL || "",
    attributes: [
      { trait_type: "Dominant Color", value: traits.dominantColor },
      { trait_type: "Secondary Color", value: traits.secondaryColor },
      { trait_type: "Pattern", value: traits.pattern },
      { trait_type: "Texture", value: traits.texture },
      { trait_type: "Mood", value: traits.mood },
      { trait_type: "Style", value: traits.style },
      { trait_type: "Signature Symbol", value: traits.signatureSymbol },
      { trait_type: "Vibe", value: traits.vibe },
    ],
  };
}
