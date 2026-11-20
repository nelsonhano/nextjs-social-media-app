# Verify: Google Account Linking · spec 0002 · updated 2026-11-19
_Steps derived from spec 0002 acceptance criteria. /check verify runs these; /test locks the durable ones._

## UI / manual
- [ ] Navigate to `/login` with an existing credential account (e.g. `john@example.com`) → click "Sign in with Google" using verified Google account with same email → verify account links and redirects to `/` with authenticated session → AC-1, AC-8
- [ ] Navigate to user profile after linking → verify custom display name and bio are unchanged, and avatar is populated from Google if previously empty → AC-2
- [ ] Log out, then click "Sign in with Google" again → verify immediate session creation without redundant updates → AC-3
- [ ] Click "Sign in with Google" using a brand new Google account → verify new user is created in database and Stream Chat with email and avatar → AC-4, AC-9
- [ ] Attempt Google sign in with an unverified Google email → verify redirect to `/login?error=unverified_email` and alert message displays → AC-5, AC-6
- [ ] Click "Cancel" on Google consent screen → verify redirect to `/login?error=oauth_cancelled` and alert message displays → AC-6
- [ ] Attempt Google sign in where email is already linked to a different Google account → verify redirect to `/login?error=account_collision` and alert message displays → AC-7

## Commands
- [x] `cmd /c npx tsc --noEmit` → verify 0 TypeScript compiler errors across all new and modified files → AC-1, AC-4, AC-6, AC-9
- [x] `cmd /c npm run lint` → verify 0 ESLint warnings or errors across the project → AC-1, AC-6
- [x] `cmd /c node scripts/verify-google-account-linking.js` → verify all 9 acceptance criteria runtime logic paths pass (10/10 sub-tests passing) → AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-7, AC-8, AC-9
- [x] `cmd /c node scripts/test-all-endpoints.js` → verify all 21 full app database operations and auth endpoint models pass → AC-1, AC-3, AC-4

## Acceptance-criteria coverage
- AC-1: covered by test `AC-1 & AC-8: Links existing credential account matching verified email` and UI linking flow
- AC-2: covered by test `AC-2: Preserves existing custom avatar when linking Google account`
- AC-3: covered by test `AC-3: Repeat login with existing googleId logs in immediately`
- AC-4: covered by test `AC-4: Brand new user registers with Google email and avatar` and remotePatterns config
- AC-5: covered by test `AC-5: Unverified Google email redirects to error`
- AC-6: covered by test `AC-6: User consent cancellation and state mismatch redirect cleanly` and `page.tsx` error dictionary
- AC-7: covered by test `AC-7: Collision guard blocks linking if email has another googleId`
- AC-8: covered by test `AC-1 & AC-8: Links existing credential account matching verified email` (case-insensitive test)
- AC-9: covered by test `AC-9: next.config.mjs includes lh3.googleusercontent.com`
