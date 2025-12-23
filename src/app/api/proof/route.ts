import { NextRequest, NextResponse } from "next/server";
import { getNeynarClient } from "~/lib/neynar";
import { NATIVE_TOKEN_ADDRESS } from "~/lib/contract";

const MIN_NEYNAR_SCORE = parseFloat(process.env.MIN_NEYNAR_SCORE || "0.5");
const MAX_MINT_PER_WALLET = parseInt(process.env.MAX_MINT_PER_WALLET || "10", 10);

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

  const fidNumber = parseInt(fid, 10);
  if (isNaN(fidNumber)) {
    return NextResponse.json(
      { error: "Invalid FID format" },
      { status: 400 }
    );
  }

  try {
    // Fetch user from Neynar to check their score
    const client = getNeynarClient();
    const usersResponse = await client.fetchBulkUsers({ fids: [fidNumber] });
    const user = usersResponse.users[0];

    if (!user) {
      console.log(`User not found for FID: ${fid}`);
      return NextResponse.json(
        {
          error: "User not found",
          isEligible: false,
        },
        { status: 404 }
      );
    }

    // Check Neynar score
    const neynarScore = user.experimental?.neynar_user_score ?? 0;

    console.log(`Neynar score check for FID ${fid}:`, {
      username: user.username,
      score: neynarScore,
      minRequired: MIN_NEYNAR_SCORE,
      address,
    });

    if (neynarScore < MIN_NEYNAR_SCORE) {
      return NextResponse.json({
        isEligible: false,
        error: `Your Neynar score (${neynarScore.toFixed(2)}) is below the minimum required (${MIN_NEYNAR_SCORE})`,
        score: neynarScore,
        minScore: MIN_NEYNAR_SCORE,
      });
    }

    // User is eligible - return empty proof for public mint
    return NextResponse.json({
      isEligible: true,
      score: neynarScore,
      // Empty proof for public mint
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
