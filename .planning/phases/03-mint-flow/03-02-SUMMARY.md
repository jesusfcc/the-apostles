---
phase: 03-mint-flow
plan: 02
subsystem: mint-hook, contract-config
tags: [wagmi, react-hooks, abi, typescript]
dependency_graph:
  requires: [contract.ts(config), EasterEgg.sol ABI]
  provides: [useMintEgg hook, EASTER_EGG_ABI, EASTER_EGG_ADDRESS]
  affects: [Phase 4 UI will call useMintEgg().mint(tokenURI)]
tech_stack:
  added: []
  patterns: [wagmi-v2-writeContractAsync, as-const-abi, env-var-contract-address]
key_files:
  created:
    - easter-egg-mint/src/lib/contract.ts
    - easter-egg-mint/src/hooks/useMintEgg.ts
  modified:
    - easter-egg-mint/src/lib/config.ts
key_decisions:
  - ABI extracted from Foundry output with only 7 relevant functions (keeps bundle small)
  - Contract address via NEXT_PUBLIC_NFT_CONTRACT_ADDRESS env var for testnet/mainnet switching
  - chainId enforcement in writeContract call to prompt network switch
metrics:
  duration: ~3 min
  completed: 2026-04-04
---

# Phase 3 Plan 02: Mint Hook + Contract Config Summary

Client-side wagmi mint hook with typed ABI from Foundry output and env-var-configurable contract address.

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Create contract.ts with ABI and address exports | 1c494c7 | easter-egg-mint/src/lib/contract.ts, easter-egg-mint/src/lib/config.ts |
| 2 | Create useMintEgg hook with full transaction lifecycle | da4b330 | easter-egg-mint/src/hooks/useMintEgg.ts |

## What Was Built

### Contract Config (Task 1)
- **contract.ts**: Exports `EASTER_EGG_ABI` as `const` assertion (7 functions: mint, burn, hasMinted, totalSupply, ownerOf, tokenURI, balanceOf) for full wagmi type inference. Re-exports `EASTER_EGG_ADDRESS` from config.
- **config.ts**: Updated `NFT_CONTRACT_ADDRESS` to read from `NEXT_PUBLIC_NFT_CONTRACT_ADDRESS` env var, defaulting to empty string until contract deploy.

### Mint Hook (Task 2)
- **useMintEgg.ts**: Wraps `useWriteContract` + `useWaitForTransactionReceipt`. Exposes `mint(tokenURI)`, `isPending`, `isConfirming`, `isSuccess`, `isError`, `error`, `txHash`, `reset`. Sets `chainId` to force correct network.

## Deviations from Plan

None -- plan executed exactly as written.

## Verification Results

- `npx tsc --noEmit` -- zero type errors after both tasks
- contract.ts exports EASTER_EGG_ABI (as const, 7 functions) and EASTER_EGG_ADDRESS
- useMintEgg.ts exports hook with all required transaction lifecycle states
- config.ts reads contract address from NEXT_PUBLIC_NFT_CONTRACT_ADDRESS env var
