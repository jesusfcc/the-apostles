---
phase: 03-mint-flow
plan: 01
subsystem: smart-contract, arweave-upload
tags: [solidity, erc721, arweave, irys, nextjs-api]
dependency_graph:
  requires: [traits.ts, config.ts]
  provides: [EasterEgg.sol, arweave.ts, metadata.ts, upload-metadata-route]
  affects: [03-02 mint hook will call upload-metadata and contract]
tech_stack:
  added: ["@irys/sdk", "OpenZeppelin v5 ERC721URIStorage"]
  patterns: [lazy-init, server-only-upload]
key_files:
  created:
    - contracts/src/EasterEgg.sol
    - contracts/script/DeployEasterEgg.s.sol
    - contracts/test/EasterEgg.t.sol
    - easter-egg-mint/src/lib/arweave.ts
    - easter-egg-mint/src/lib/metadata.ts
    - easter-egg-mint/src/app/api/upload-metadata/route.ts
  modified: []
key_decisions:
  - Arweave via Irys instead of Pinata for permanent decentralized storage
  - base-eth token for Irys payments (pay with ETH on Base)
  - Custom error types (AlreadyMinted, NotTokenOwner) instead of require strings
metrics:
  duration: ~2 min
  completed: 2026-04-04
---

# Phase 3 Plan 01: ERC721 Contract + Arweave Upload Pipeline Summary

ERC721URIStorage contract with one-per-address mint and burn, plus Irys-based Arweave upload pipeline for permanent NFT metadata storage.

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | EasterEgg.sol contract + deploy script + tests | 6cb0979 | contracts/src/EasterEgg.sol, contracts/script/DeployEasterEgg.s.sol, contracts/test/EasterEgg.t.sol |
| 2 | Arweave upload client + metadata builder + API route | 54b69b1 | easter-egg-mint/src/lib/arweave.ts, easter-egg-mint/src/lib/metadata.ts, easter-egg-mint/src/app/api/upload-metadata/route.ts |

## What Was Built

### Smart Contract (Task 1)
- **EasterEgg.sol**: ERC721URIStorage + Ownable, public `mint(tokenURI)` with one-per-address guard, `burn(tokenId)` for Phase 5, `totalSupply()` view
- **DeployEasterEgg.s.sol**: Foundry deploy script reading PRIVATE_KEY from env
- **5 passing tests**: mint, duplicate-revert, burn, non-owner-burn-revert, multiple-minters

### Upload Pipeline (Task 2)
- **arweave.ts**: Lazy-init Irys client (node2.irys.xyz, base-eth token), exports `uploadToArweave()` and `uploadJsonToArweave()` returning permanent `https://arweave.net/{id}` URLs
- **metadata.ts**: `buildMetadata(fid, traits, imageURI)` producing OpenSea-standard JSON with all 8 EggTraits as attributes
- **POST /api/upload-metadata**: Accepts `{imageBase64, traits, fid}`, chains image upload -> metadata build -> metadata upload, returns `{tokenURI, imageURI}`

## Deviations from Plan

### Planned Change: Arweave instead of Pinata
The plan originally mentioned Pinata/IPFS but was updated to use Arweave via Irys SDK for permanent decentralized storage. This was a pre-execution decision, not a runtime deviation.

No other deviations -- plan executed as written.

## Verification Results

- `forge build` -- compilation successful
- `forge test` -- 5/5 tests pass
- `npx tsc --noEmit` -- zero type errors
- All 6 new files exist at specified paths
