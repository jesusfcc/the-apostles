"use client";

import { IS_TESTNET } from "~/lib/config";
import { APP_URL } from "~/lib/constants";

interface SuccessScreenProps {
  imageBase64: string;
  txHash: string;
  tokenURI: string | null;
  imageURI: string | null;
  onReset: () => void;
}

export default function SuccessScreen({
  imageBase64,
  txHash,
  tokenURI,
  imageURI,
  onReset,
}: SuccessScreenProps) {
  const explorerBase = IS_TESTNET
    ? "https://sepolia.basescan.org"
    : "https://basescan.org";
  const explorerUrl = `${explorerBase}/tx/${txHash}`;

  const truncatedHash = `${txHash.slice(0, 6)}...${txHash.slice(-4)}`;

  const shareText = encodeURIComponent("I just minted my AI Easter Egg! \u{1F95A}");
  const shareEmbed = encodeURIComponent(APP_URL);
  const shareUrl = `https://warpcast.com/~/compose?text=${shareText}&embeds[]=${shareEmbed}`;

  return (
    <div className="flex-1 flex flex-col items-center justify-center py-6">
      {/* Heading */}
      <h2 className="text-vintage-black font-bold text-2xl text-center mb-4 tracking-wide">
        Your egg has been minted!
      </h2>

      {/* Egg image card (slightly larger than preview) */}
      <div className="border-2 border-vintage-black p-2 bg-paper max-w-[300px] w-full mb-4">
        <img
          src={`data:image/png;base64,${imageBase64}`}
          alt="Your minted Easter egg"
          className="w-full h-auto"
        />
      </div>

      {/* Line divider */}
      <div className="w-full flex justify-center my-4">
        <img src="/assets/Line15.png" alt="" className="w-20 h-auto" />
      </div>

      {/* Transaction info */}
      <div className="text-center space-y-2 mb-6">
        <a
          href={explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-vintage-black/70 text-sm font-mono underline underline-offset-2 hover:text-vintage-black transition-colors"
        >
          tx: {truncatedHash}
        </a>

        {imageURI && (
          <div>
            <a
              href={imageURI}
              target="_blank"
              rel="noopener noreferrer"
              className="text-vintage-black/50 text-xs underline underline-offset-2 hover:text-vintage-black/70 transition-colors"
            >
              View on Arweave
            </a>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="w-full max-w-xs space-y-3">
        {/* Share on Warpcast */}
        <a
          href={shareUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full py-4 border-2 border-vintage-black bg-vintage-black text-paper font-bold text-lg tracking-widest text-center"
        >
          SHARE ON WARPCAST
        </a>

        {/* Mint another */}
        <button
          onClick={onReset}
          className="w-full py-3 border-2 border-vintage-black bg-paper text-vintage-black font-bold text-sm tracking-widest"
        >
          MINT ANOTHER
        </button>
      </div>
    </div>
  );
}
