# Phase 3: Mint Flow - Research

**Researched:** 2026-03-31
**Domain:** ERC721 NFT minting on Base, IPFS metadata, wagmi transaction hooks
**Confidence:** HIGH

## Summary

Phase 3 connects the generated egg images (base64 from Phase 2) to on-chain NFTs. The flow is: upload egg image to IPFS via Pinata, construct ERC721 metadata JSON with trait attributes, upload metadata to IPFS, then mint via a simple ERC721 contract on Base using wagmi's `useWriteContract` hook.

The project already has Foundry set up in `/contracts/` with OpenZeppelin and thirdweb remappings, wagmi v2 configured for Base/Base Sepolia, and a reference `useMint.ts` hook in main-apostole that demonstrates the exact wagmi pattern needed. The simplest approach is a minimal ERC721URIStorage contract with an owner-controlled or open mint function, deployed via Foundry to Base Sepolia (then mainnet).

**Primary recommendation:** Deploy a simple OpenZeppelin ERC721URIStorage contract via the existing Foundry setup, use Pinata SDK (`pinata` npm package) for IPFS uploads from a Next.js API route, and mint using wagmi's `useWriteContract` + `useWaitForTransactionReceipt` pattern already proven in main-apostole.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| R4 | Upload generated egg image to IPFS | Pinata SDK `upload.public.base64()` for image, `upload.public.json()` for metadata |
| R4 | Mint ERC721 on Base with tokenURI pointing to IPFS metadata | OpenZeppelin ERC721URIStorage contract with `safeMint(to, tokenId, uri)` |
| R4 | Metadata includes trait JSON as on-chain attributes | Standard OpenSea attributes format mapping EggTraits to `trait_type`/`value` pairs |
| R4 | Show minting/success/failed states | wagmi `useWriteContract` + `useWaitForTransactionReceipt` hooks (same pattern as main-apostole) |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| OpenZeppelin Contracts | 5.x | ERC721URIStorage base contract | Industry standard, already in Foundry remappings |
| Foundry | existing | Contract compilation and deployment | Already configured in `/contracts/` |
| pinata | latest | IPFS upload (image + metadata JSON) | Current official Pinata SDK, has `base64()` method perfect for our use case |
| wagmi | ^2.14.12 | Mint transaction hooks | Already installed and configured |
| viem | ^2.23.6 | Contract ABI encoding, address utils | Already installed |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| None needed | - | - | Stack is already complete |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom ERC721 | Thirdweb Drop contract | More features but overkill; simple mint-with-URI is all we need |
| Pinata | nft.storage | nft.storage shut down its free tier; Pinata free tier still works (500 files, 1GB) |
| Pinata | Thirdweb Storage | Extra SDK dependency; Pinata is simpler for just IPFS |
| Foundry deploy | Hardhat | Foundry already configured in repo; no reason to switch |

**Installation:**
```bash
cd easter-egg-mint && npm install pinata
```

No new contract dependencies needed -- OpenZeppelin is already in the Foundry setup.

## Architecture Patterns

### Recommended Project Structure
```
easter-egg-mint/
  src/
    app/api/
      upload-metadata/route.ts   # Server-side: upload image+metadata to IPFS via Pinata
    hooks/
      useMintEgg.ts              # Client-side: wagmi mint hook
    lib/
      contract.ts                # ABI + address constants for EasterEgg contract
      pinata.ts                  # Pinata SDK init (server-only)
      metadata.ts                # Build ERC721 metadata JSON from EggTraits

contracts/
  src/
    EasterEgg.sol                # Simple ERC721URIStorage contract
  script/
    DeployEasterEgg.s.sol        # Foundry deploy script
```

### Pattern 1: Server-Side IPFS Upload
**What:** API route receives base64 image + traits, uploads both to Pinata, returns metadata CID
**When to use:** Always -- Pinata JWT must stay server-side
**Example:**
```typescript
// src/app/api/upload-metadata/route.ts
import { PinataSDK } from "pinata";
import { buildMetadata } from "~/lib/metadata";

const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT!,
  pinataGateway: process.env.NEXT_PUBLIC_PINATA_GATEWAY!,
});

export async function POST(request: Request) {
  const { imageBase64, traits, fid } = await request.json();

  // 1. Upload image to IPFS
  const imageUpload = await pinata.upload.public.base64(imageBase64);
  const imageURI = `ipfs://${imageUpload.cid}`;

  // 2. Build metadata JSON
  const metadata = buildMetadata(fid, traits, imageURI);

  // 3. Upload metadata to IPFS
  const metadataUpload = await pinata.upload.public.json(metadata);
  const tokenURI = `ipfs://${metadataUpload.cid}`;

  return Response.json({ tokenURI, imageURI });
}
```

### Pattern 2: ERC721 Metadata Format (OpenSea Standard)
**What:** JSON format that marketplaces understand
**When to use:** Building the metadata JSON before IPFS upload
**Example:**
```typescript
// src/lib/metadata.ts
import { EggTraits } from "~/lib/traits";

export function buildMetadata(fid: number, traits: EggTraits, imageURI: string) {
  return {
    name: `Easter Egg #${fid}`,
    description: `AI-generated Easter egg for Farcaster user ${fid}`,
    image: imageURI,
    external_url: `${process.env.NEXT_PUBLIC_APP_URL}`,
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
```

### Pattern 3: Mint Hook (wagmi v2)
**What:** Client-side hook wrapping `useWriteContract` + `useWaitForTransactionReceipt`
**When to use:** When user clicks "Mint" after preview
**Example:**
```typescript
// src/hooks/useMintEgg.ts
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { EASTER_EGG_ADDRESS, EASTER_EGG_ABI } from "~/lib/contract";
import { APP_CHAIN_ID } from "~/lib/config";

export function useMintEgg() {
  const {
    writeContractAsync,
    data: txHash,
    isPending,
    error: writeError,
    reset,
  } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess,
    isError: isConfirmError,
    error: confirmError,
  } = useWaitForTransactionReceipt({ hash: txHash });

  const mint = async (tokenURI: string) => {
    await writeContractAsync({
      address: EASTER_EGG_ADDRESS,
      abi: EASTER_EGG_ABI,
      functionName: "mint",
      args: [tokenURI],
      chainId: APP_CHAIN_ID,
    });
  };

  return {
    mint,
    isPending,
    isConfirming,
    isSuccess,
    isError: !!writeError || isConfirmError,
    error: writeError || confirmError,
    txHash,
    reset,
  };
}
```

### Pattern 4: Simple ERC721 Contract
**What:** Minimal ERC721URIStorage with public mint
**Example:**
```solidity
// contracts/src/EasterEgg.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract EasterEgg is ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;

    // One egg per address
    mapping(address => bool) public hasMinted;

    constructor() ERC721("Easter Egg", "EGG") Ownable(msg.sender) {}

    function mint(string calldata tokenURI) external {
        require(!hasMinted[msg.sender], "Already minted");
        hasMinted[msg.sender] = true;

        uint256 tokenId = _nextTokenId++;
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, tokenURI);
    }

    function totalSupply() external view returns (uint256) {
        return _nextTokenId;
    }
}
```

### Anti-Patterns to Avoid
- **Uploading to IPFS from client side:** Exposes Pinata JWT. Always use server-side API route.
- **Storing full image on-chain:** Way too expensive. Use IPFS for image, on-chain just stores the tokenURI.
- **Using tokenId = fid:** FIDs can be very large numbers; use sequential auto-incrementing tokenId instead. Map FID in metadata attributes if needed.
- **Skipping `useWaitForTransactionReceipt`:** Transaction submitted != confirmed. Must wait for receipt to show success.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| ERC721 token standard | Custom token contract | OpenZeppelin ERC721URIStorage | Battle-tested, handles all edge cases |
| IPFS pinning | Direct IPFS node interaction | Pinata SDK | Pinning persistence, gateway CDN, free tier sufficient |
| Transaction state management | Custom tx polling | wagmi `useWaitForTransactionReceipt` | Handles reorgs, confirmations, error states |
| NFT metadata format | Custom JSON schema | OpenSea metadata standard | Marketplace compatibility |
| Contract deployment | Manual bytecode deployment | Foundry `forge script` | Verification, deterministic deploys |

## Common Pitfalls

### Pitfall 1: Pinata JWT Exposure
**What goes wrong:** JWT used client-side, gets leaked
**Why it happens:** Trying to upload from browser directly
**How to avoid:** All Pinata uploads go through `/api/upload-metadata` server route
**Warning signs:** `NEXT_PUBLIC_PINATA_JWT` in env (should NOT be public)

### Pitfall 2: IPFS Gateway Mismatch
**What goes wrong:** tokenURI stored as `ipfs://CID` but frontend tries to render it directly
**Why it happens:** Browsers don't resolve `ipfs://` protocol
**How to avoid:** Store as `ipfs://CID` on-chain (standard), but resolve via Pinata gateway for display: `https://{gateway}/ipfs/{CID}`
**Warning signs:** Broken images in UI after minting

### Pitfall 3: Transaction Fails Silently in Farcaster Frame
**What goes wrong:** Mint transaction rejected but UI shows no feedback
**Why it happens:** Farcaster miniapp wallet connector has different error patterns than MetaMask
**How to avoid:** Catch errors from both `writeContractAsync` and the receipt hook; test in Warpcast dev tools
**Warning signs:** `isError` is true but no error message displayed

### Pitfall 4: Base64 Image Too Large for API Route
**What goes wrong:** Next.js API route returns 413 or times out
**Why it happens:** Generated egg images can be large; Next.js default body limit is 4MB
**How to avoid:** Ensure egg images are reasonable size (Gemini generates ~500KB-2MB); set `bodyParser` config if needed
**Warning signs:** Upload works locally but fails in production

### Pitfall 5: Contract Not Verified on BaseScan
**What goes wrong:** Users can't see contract source, reduces trust
**Why it happens:** Forgetting to verify after deployment
**How to avoid:** Use `forge verify-contract` after deploy, or `--verify` flag in deploy script
**Warning signs:** "Unverified contract" on BaseScan

### Pitfall 6: Missing Chain Switch
**What goes wrong:** User on wrong chain, transaction fails with cryptic error
**Why it happens:** wagmi doesn't auto-switch chains
**How to avoid:** Use `useSwitchChain` hook before mint, or set `chainId` in writeContract call (wagmi will prompt switch)
**Warning signs:** "Chain mismatch" or "wrong network" errors

## Code Examples

### Full Mint Flow (Client Side)
```typescript
// Component calling the mint flow
async function handleMint(imageBase64: string, traits: EggTraits) {
  setStatus("uploading");

  // 1. Upload to IPFS via server
  const res = await fetch("/api/upload-metadata", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageBase64, traits, fid }),
  });
  const { tokenURI } = await res.json();

  // 2. Mint on-chain
  setStatus("minting");
  await mint(tokenURI);
  // isConfirming/isSuccess states handled by hook
}
```

### Foundry Deploy Script
```solidity
// contracts/script/DeployEasterEgg.s.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/EasterEgg.sol";

contract DeployEasterEgg is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);
        EasterEgg egg = new EasterEgg();
        vm.stopBroadcast();
        console.log("EasterEgg deployed to:", address(egg));
    }
}
```

### Deploy Command
```bash
# Base Sepolia (testnet)
forge script script/DeployEasterEgg.s.sol --rpc-url https://sepolia.base.org --broadcast --verify

# Base Mainnet
forge script script/DeployEasterEgg.s.sol --rpc-url https://base.llamarpc.com --broadcast --verify
```

### Pinata Init (Server-Only)
```typescript
// src/lib/pinata.ts
import { PinataSDK } from "pinata";

let _pinata: PinataSDK | null = null;

export function getPinata(): PinataSDK {
  if (!_pinata) {
    _pinata = new PinataSDK({
      pinataJwt: process.env.PINATA_JWT!,
      pinataGateway: process.env.NEXT_PUBLIC_PINATA_GATEWAY!,
    });
  }
  return _pinata;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `@pinata/sdk` with `pinFileToIPFS` | `pinata` package with `upload.public.file()` / `.base64()` / `.json()` | 2024-2025 | Simpler API, base64 upload native |
| OpenZeppelin Counters.sol | Plain `uint256 _nextTokenId++` | OZ v5.x (2024) | Counters removed, use plain uint |
| `usePrepareContractWrite` + `useContractWrite` | `useWriteContract` (single hook) | wagmi v2 (2024) | Simpler API, prepare removed |
| nft.storage free tier | Pinata (nft.storage free tier ended) | 2024 | Must use Pinata or similar |

## Open Questions

1. **Free mint or paid mint?**
   - What we know: Contract shown above is free mint (no value required)
   - What's unclear: Whether there should be a mint fee
   - Recommendation: Start with free mint; add price later if needed. Budget constraint suggests keeping it simple.

2. **One egg per FID or per address?**
   - What we know: Contract uses `hasMinted[address]` for one-per-address
   - What's unclear: Should it be one per FID instead? (would need server-side check)
   - Recommendation: One per address on-chain (simpler), one per FID enforced at API level (server checks Supabase before uploading metadata)

3. **Testnet first or straight to mainnet?**
   - What we know: Config already supports `IS_TESTNET` toggle, Base Sepolia RPCs configured
   - What's unclear: Timeline pressure
   - Recommendation: Deploy to Base Sepolia first, switch to mainnet when ready. Contract is identical on both.

4. **Pinata free tier sufficient?**
   - What we know: Free tier = 500 files, 1GB. Each mint = 2 files (image + metadata JSON)
   - What's unclear: Expected number of mints
   - Recommendation: Free tier handles 250 mints. If expecting more, Picnic plan ($20/mo) gives 1M files. Well within $300 budget.

## Sources

### Primary (HIGH confidence)
- OpenZeppelin Contracts v5.x docs: ERC721URIStorage pattern -- https://docs.openzeppelin.com/contracts/5.x/erc721
- Pinata official docs: SDK upload methods (file, json, base64) -- https://docs.pinata.cloud/files/uploading-files
- Wagmi official docs: useWriteContract + useWaitForTransactionReceipt -- https://wagmi.sh/react/api/hooks/useWriteContract
- OpenSea metadata standards -- https://docs.opensea.io/docs/metadata-standards
- Existing codebase: `main-apostole/src/hooks/useMint.ts` (proven wagmi mint pattern)
- Existing codebase: `contracts/foundry.toml` (Foundry already configured)
- Existing codebase: `easter-egg-mint/src/lib/config.ts` (Base chain config with testnet toggle)

### Secondary (MEDIUM confidence)
- Pinata pricing: free tier 500 files/1GB -- https://pinata.cloud/pricing
- Base deployment guide via Foundry -- https://docs.base.org/cookbook/smart-contract-development/hardhat/deploy-with-hardhat

### Tertiary (LOW confidence)
- None -- all critical claims verified with official sources

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already installed or in existing Foundry setup
- Architecture: HIGH -- patterns directly adapted from main-apostole codebase
- Pitfalls: HIGH -- common NFT minting issues well-documented, verified with official docs

**Research date:** 2026-03-31
**Valid until:** 2026-04-30 (stable domain, no fast-moving APIs)
