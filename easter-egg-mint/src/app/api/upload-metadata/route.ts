import { NextRequest, NextResponse } from "next/server";
import { uploadToArweave, uploadJsonToArweave } from "~/lib/arweave";
import { buildMetadata } from "~/lib/metadata";
import type { EggTraits } from "~/lib/traits";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageBase64, traits, fid } = body as {
      imageBase64: string;
      traits: EggTraits;
      fid: number;
    };

    // Validate required fields
    if (!imageBase64 || !traits || !fid) {
      return NextResponse.json(
        { error: "Missing required fields: imageBase64, traits, fid" },
        { status: 400 }
      );
    }

    // Step 1: Upload image to Arweave
    const imageBuffer = Buffer.from(imageBase64, "base64");
    const imageURI = await uploadToArweave(imageBuffer, "image/png");

    // Step 2: Build metadata JSON
    const metadata = buildMetadata(fid, traits, imageURI);

    // Step 3: Upload metadata to Arweave
    const tokenURI = await uploadJsonToArweave(metadata);

    return NextResponse.json({ tokenURI, imageURI });
  } catch (error) {
    console.error("Upload metadata error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 }
    );
  }
}
