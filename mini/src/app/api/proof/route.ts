import { NextRequest, NextResponse } from "next/server";
import { getNeynarClient } from "~/lib/neynar";
import { NATIVE_TOKEN_ADDRESS } from "~/lib/contract";
import { getProofForAddress } from "~/lib/allowlist";

const MIN_NEYNAR_SCORE = parseFloat(process.env.MIN_NEYNAR_SCORE || "0.5");
const MAX_MINT_PER_WALLET = parseInt(process.env.MAX_MINT_PER_WALLET || "10", 10);

interface ProofResponse {
  isEligible: boolean;
  isAllowlisted?: boolean;
  score?: number;
  minScore?: number;
  error?: string;
  proof: string[];
  quantityLimitPerWallet: string;
  pricePerToken: string;
  currency: string;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const fid = searchParams.get("fid");
  const address = searchParams.get("address");

  if (!fid) {
    return NextResponse.json(
      { error: "FID parameter is required" },
      { status: 400 }
    );
  }

  if (!address) {
    return NextResponse.json(
      { error: "Address parameter is required" },
      { status: 400 }
    );
  }

  const fidNumber = parseInt(fid, 10);
  if (isNaN(fidNumber)) {
    return NextResponse.json(
      { error: "Invalid FID format" },
      { status: 400 }
    );
  }

  try {
    // Fetch user from Neynar for score check
    const client = getNeynarClient();
    const usersResponse = await client.fetchBulkUsers({ fids: [fidNumber] });
    const user = usersResponse.users[0];

    if (!user) {
      return NextResponse.json(
        { error: "User not found", isEligible: false },
        { status: 404 }
      );
    }

    const neynarScore = user.experimental?.neynar_user_score ?? 0;

    // Check if connected wallet is on the allowlist
    const { proof, entry } = getProofForAddress(address);

    if (entry && proof.length > 0) {
      console.log(`[Proof] Allowlist: ${address} (FID: ${fid})`);
      return NextResponse.json<ProofResponse>({
        isEligible: true,
        isAllowlisted: true,
        score: neynarScore,
        proof,
        quantityLimitPerWallet: entry.maxClaimable.toString(),
        pricePerToken: entry.price.toString(),
        currency: NATIVE_TOKEN_ADDRESS,
      });
    }

    // Not on allowlist - check Neynar score for public mint
    if (neynarScore < MIN_NEYNAR_SCORE) {
      return NextResponse.json<ProofResponse>({
        isEligible: false,
        isAllowlisted: false,
        error: `Neynar score (${neynarScore.toFixed(2)}) below minimum (${MIN_NEYNAR_SCORE})`,
        score: neynarScore,
        minScore: MIN_NEYNAR_SCORE,
        proof: [],
        quantityLimitPerWallet: "0",
        pricePerToken: "0",
        currency: NATIVE_TOKEN_ADDRESS,
      });
    }

    // Eligible for public mint
    console.log(`[Proof] Public mint: ${address} (FID: ${fid}, score: ${neynarScore})`);
    return NextResponse.json<ProofResponse>({
      isEligible: true,
      isAllowlisted: false,
      score: neynarScore,
      proof: [],
      quantityLimitPerWallet: MAX_MINT_PER_WALLET.toString(),
      pricePerToken: "0",
      currency: NATIVE_TOKEN_ADDRESS,
    });
  } catch (error) {
    console.error("Error checking eligibility:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
