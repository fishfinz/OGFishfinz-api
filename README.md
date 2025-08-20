# OGFishfinz API (Plug & Play)
- Auth (nonce/sign), Ownership (ERC721/1155)
- Season-aware Scores + Leaderboard
- Claims (badge NFT, tokenId defaults to current season)
- Anti-cheat run token: `/api/run/start` → returns `{ runToken, issuedAt }`, include in `/api/score/submit`

## Setup
1) Create Supabase → run `db_all_in_one.sql`
2) Set env vars (see `.env.example`)
3) Deploy (Vercel: include `vercel.json`), or run locally: `npm i && npm run dev`

