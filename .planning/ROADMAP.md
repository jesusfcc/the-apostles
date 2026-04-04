# Roadmap: Easter Egg Mint

## Overview

Build a Warplets-style AI-generated NFT pipeline: Farcaster PFP → trait extraction → personalized egg image → mint on Base. Includes burn/evolve mechanics for future egg evolution.

## Phases

- [x] **Phase 1: Scaffold + Infra** - Copy main-apostole boilerplate, set up new app shell
- [x] **Phase 2: Trait Extraction + Image Gen Pipeline** - Gemini integration for traits and egg generation
- [x] **Phase 3: Mint Flow** - ERC721 contract, IPFS upload, mint transaction
- [ ] **Phase 4: UI/UX** - Full app screens with /frontend-design skill
- [ ] **Phase 5: Burn + Evolve** - Burn NFT, re-generate evolved egg, lineage tracking

## Phase Details

### Phase 1: Scaffold + Infra
**Goal**: Empty app shell with auth + wallet working
**Depends on**: Nothing
**Requirements**: R1
**Success Criteria** (what must be TRUE):
  1. New Next.js app at easter-egg-mint/ builds clean
  2. Wagmi + Farcaster wallet connectors configured
  3. Neynar + Supabase clients set up
  4. Tailwind theme matches main-apostole aesthetic
**Plans**: 1 plan

Plans:
- [x] 01-01: Scaffold app from main-apostole boilerplate

### Phase 2: Trait Extraction + Image Gen Pipeline
**Goal**: Given a PFP URL → get consistent trait JSON + personalized egg image
**Depends on**: Phase 1
**Requirements**: R2, R3
**Success Criteria** (what must be TRUE):
  1. /api/extract-traits accepts PFP URL, returns 8-trait JSON
  2. /api/generate-egg accepts traits, returns personalized egg base64
  3. Traits cached in Supabase per FID
  4. Single-source-image technique used (only base egg to Nano Banana 2)
**Plans**: 1 plan

Plans:
- [x] 02-01: Build Gemini integration, trait schema, API routes

### Phase 3: Mint Flow
**Goal**: User can mint their generated egg as ERC721 on Base
**Depends on**: Phase 2
**Requirements**: R4
**Success Criteria** (what must be TRUE):
  1. ERC721 contract deployed on Base (or testnet)
  2. Generated egg image uploaded to IPFS with trait metadata
  3. User can execute mint transaction via wagmi
  4. Minting/success/failed states handled
**Plans**: 2 plans

Plans:
- [x] 03-01-PLAN.md — ERC721 contract + Arweave upload pipeline (Irys + metadata)
- [x] 03-02-PLAN.md — Client-side mint hook + contract config

### Phase 4: UI/UX
**Goal**: Polished end-to-end mobile-first flow matching vintage aesthetic
**Depends on**: Phase 3
**Requirements**: R6
**Success Criteria** (what must be TRUE):
  1. Connect → Generate → Preview → Mint → Success flow works
  2. Mobile-first design matching main-apostole vintage aesthetic
  3. Loading states for trait extraction and image generation
  4. Share functionality after minting
**Plans**: 2 plans

Plans:
- [ ] 04-01-PLAN.md — App shell, state machine, Connect + Generate screens
- [ ] 04-02-PLAN.md — Preview, Mint, Success screens + share functionality

### Phase 5: Burn + Evolve
**Goal**: Users can burn egg → get evolved version with lineage tracking
**Depends on**: Phase 4
**Requirements**: R5
**Success Criteria** (what must be TRUE):
  1. Burn function works on contract
  2. Stored trait JSON fetched and modified with evolution params
  3. New egg generated from evolved traits
  4. Evolved NFT minted with lineage reference
**Plans**: TBD

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Scaffold + Infra | 1/1 | Complete | 2026-04-04 |
| 2. Trait + Image Gen | 1/1 | Complete | 2026-04-04 |
| 3. Mint Flow | 2/2 | Complete | 2026-04-04 |
| 4. UI/UX | 0/2 | In progress | - |
| 5. Burn + Evolve | 0/? | Not started | - |
