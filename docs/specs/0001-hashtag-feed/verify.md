# Verify: Hashtag Feed · spec 0001 · updated 2026-11-19
_Steps derived from spec 0001 acceptance criteria. /check verify runs these; /test locks the durable ones._

## UI / manual
- [ ] Log in and navigate to `/hashtag/nextjs` → verify the page renders a top header displaying `#nextjs` with total post count and TrendsSidebar on the right → AC-1, AC-2, AC-3
- [ ] Scroll down the hashtag feed → verify that more posts load smoothly via infinite scroll container → AC-6
- [ ] Navigate to an unused hashtag like `/hashtag/emptytest123` → verify the feed displays "No posts found with this hashtag." → AC-7
- [ ] In an unauthenticated incognito window, navigate to `/hashtag/nextjs` → verify user is shown unauthorized notice or redirected to login → AC-8

## Commands
- [x] `node --env-file=.env scripts/test-all-endpoints.js` → verify test 21 passes with valid tag sanitization and Prisma query construction → AC-4, AC-5, AC-6, AC-8
- [x] `npx.cmd tsc --noEmit` → verify 0 TypeScript compiler errors across all new files → AC-1, AC-4
- [x] `node scripts/verify-hashtag-runtime.js` → verify runtime tag sanitization, empty tag guard, and banner pluralization formatting → AC-2, AC-4, AC-7

## Acceptance-criteria coverage
- AC-1: covered by UI navigation step
- AC-2: covered by UI header banner check
- AC-3: covered by UI sidebar rendering check
- AC-4: covered by test-all-endpoints.js test 21 and API route
- AC-5: covered by test-all-endpoints.js test 21 query includes
- AC-6: covered by infinite scroll UI step and cursor pagination test
- AC-7: covered by empty hashtag navigation step
- AC-8: covered by unauthenticated browser and endpoint checks
