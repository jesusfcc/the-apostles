---
phase: 04-ui-ux
plan: 01
subsystem: ui-screens
tags: [state-machine, connect, generate, farcaster-sdk, wagmi]
dependency_graph:
  requires: []
  provides: [useEggFlow, App, ConnectScreen, GenerateScreen]
  affects: [easter-egg-mint/src/app/page.tsx]
tech_stack:
  added: []
  patterns: [state-machine-hook, auto-connect, two-phase-loading, safe-area-insets]
key_files:
  created:
    - easter-egg-mint/src/hooks/useEggFlow.ts
    - easter-egg-mint/src/components/App.tsx
    - easter-egg-mint/src/components/AppLoader.tsx
    - easter-egg-mint/src/components/screens/ConnectScreen.tsx
    - easter-egg-mint/src/components/screens/GenerateScreen.tsx
  modified:
    - easter-egg-mint/src/app/page.tsx
    - easter-egg-mint/public/assets/ (5 design assets copied)
decisions:
  - Client-side AppLoader wrapper needed for Next.js App Router (ssr:false in Server Components not allowed)
  - Custom bottom border design instead of footer.png (text divider with tracking-widest)
  - Side borders use object-fill to stretch full height of content area
metrics:
  duration: ~12 min
  completed: 2026-04-04
---

# Phase 4 Plan 01: App Shell + Connect/Generate Screens Summary

State machine hook driving connect/generate flow with auto-wallet-connect, two-phase AI generation loading, and ornate vintage borders from main-apostole assets.

## What Was Built

### useEggFlow Hook
Linear state machine managing the full mint flow: connect -> generate -> preview -> minting -> success -> error. Uses useState for simplicity. Stores traits, imageBase64, txHash, tokenURI, imageURI, and error. Exposes transition callbacks: onConnected, onGenerated, onMetadataUploaded, onMinted, onError, reset.

### App.tsx Shell
Root client component with Farcaster SDK safe area insets. Renders ornate header border (header.png), side borders (side-left.png, side-right.png), Line5 bottom divider, and a custom text-based footer (not footer.png). Switches rendered screen based on useEggFlow state. Calls sdk.actions.ready() and one-time addMiniApp() prompt.

### ConnectScreen
Auto-connects via farcasterFrame connector (Warpcast) or coinbaseWallet (Base App, clientFid 309857). Shows spinner during auto-connect attempt. Falls back to manual "CONNECT WALLET" button after 3 seconds. Displays Farcaster username when available.

### GenerateScreen
Displays user PFP (120x120 rounded-full with vintage border) and username. "GENERATE YOUR EGG" button triggers two sequential API calls: POST /api/extract-traits ("Analyzing your PFP...") then POST /api/generate-egg ("Creating your egg..."). Error state shows message with "TRY AGAIN" button. Success transitions to preview state.

### AppLoader
Client component wrapper for next/dynamic with ssr:false (required by Next.js App Router which disallows ssr:false in Server Components).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] next/dynamic ssr:false in Server Component**
- **Found during:** Build verification
- **Issue:** Next.js App Router does not allow `ssr: false` with `next/dynamic` in Server Components
- **Fix:** Created AppLoader client component wrapper that handles the dynamic import
- **Files modified:** easter-egg-mint/src/components/AppLoader.tsx (new), easter-egg-mint/src/app/page.tsx
- **Commit:** 59de6ff

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | ca24855 | State machine hook, app shell with ornate borders |
| 2 | c6357b9 | Connect and generate screens with vintage aesthetic |
| fix | 59de6ff | Move dynamic import to client component for App Router |

## Verification

- `npx tsc --noEmit` -- passed (no type errors)
- `npm run build` -- passed (successful production build)
- App.tsx imports and renders ConnectScreen/GenerateScreen based on useEggFlow state
- page.tsx uses AppLoader client wrapper with dynamic import

## Self-Check: PASSED

All 5 created files verified on disk. All 3 commits verified in git history.
