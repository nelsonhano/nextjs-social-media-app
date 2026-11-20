# Verify: Modern UI Revamp with White Glass Card Styling · spec 0003 · updated 2026-11-19
_Steps derived from spec 0003 acceptance criteria. /check verify runs these; /test locks the durable ones._

## UI / manual
- [x] Load the main feed on desktop and mobile: verify every card renders with frosted white glass styling, backdrop blur, subtle borders, and soft shadows over the ambient background → AC-1
- [x] Toggle between light and dark themes: verify the ambient mesh renders soft pastel orbs in light mode and vibrant neon glows in dark mode with high contrast readability → AC-2
- [x] Inspect top brand header: verify floating glass navbar with stylized Glimo logo, notification bell with unread badge counter, search input, and profile avatar → AC-3
- [x] View stories tray: verify current user avatar with add story badge alongside followed users with vibrant gradient rings → AC-4
- [x] Tap an avatar in the stories tray: verify animated story viewer modal opens showing recent image post, caption, progress indicator, and profile link → AC-5
- [x] Tap your story add badge: verify Create Post modal dialog opens with user avatar, privacy selector, and media picker → AC-5, AC-9
- [x] Tap For you and Following feed tabs: verify smooth active pill switching and separate feed content loading → AC-6
- [x] Inspect post card anatomy: verify follow pill button beside author name (or post options dropdown for own post), sky blue hashtags, and like and comment badge counters → AC-7
- [x] View posts with 1, 2, 3, or 4 images: verify responsive rounded 24px media grid collage without distortion or awkward clipping → AC-7
- [x] Tap share action on post card: verify native share sheet opens on mobile devices or link copied toast displays → AC-7
- [x] View mobile layout: verify floating rounded pill bottom navigation bar with 5 slots (Home, Search, Center Pink Action, Bookmarks, Messages) → AC-8
- [x] Tap central coral pink create button: verify frosted glass Create Post modal opens with text area and media attachments → AC-9
- [x] Refresh feed: verify shimmering frosted glass skeleton cards render with zero layout shift during query fetching → AC-10

## Commands
- [x] `cmd /c npx tsc --noEmit` → verify 0 TypeScript compiler errors across all new and modified components → AC-1, AC-3, AC-4, AC-5, AC-6, AC-7, AC-8, AC-9, AC-10
- [x] `cmd /c npm run lint` → verify 0 ESLint warnings or errors across the project → AC-1, AC-3, AC-7, AC-8
- [x] `cmd /c node scripts/verify-modern-ui-revamp.js` → verify all 10 acceptance criteria across stylesheets, components, and layout (10/10 passing) → AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-7, AC-8, AC-9, AC-10
- [x] `cmd /c node --test tests/modern-ui-glass-revamp.test.js` → verify all 16 unit and integration assertions pass (16/16 passing) → AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-7, AC-8, AC-9, AC-10
- [x] `cmd /c node --test tests/hashtag-feed.test.js tests/google-account-linking.test.js tests/modern-ui-glass-revamp.test.js` → verify all 51 project tests pass cleanly → AC-1, AC-7

## Acceptance-criteria coverage
- AC-1: covered by `.glass-card` and `.bg-card` utilities in `globals.css` and all card components
- AC-2: covered by adaptive ambient gradient mesh in `layout.tsx` for light and dark themes
- AC-3: covered by floating frosted glass header in `Navbar.tsx` with logo, search, and notification badge
- AC-4: covered by `StoriesTray.tsx` and `/api/stories` route with vibrant gradient rings
- AC-5: covered by `StoryViewerModal.tsx` showing visual attachments, progress bar, and user profile link
- AC-6: covered by rounded category pill tabs in `page.tsx` for For you and Following
- AC-7: covered by `Post.tsx` with follow pill, sky blue hashtags, rounded media collage, and badge counters
- AC-8: covered by `FloatingBottomNav.tsx` with 5 fixed slots and active route indicator
- AC-9: covered by `CreatePostModal.tsx` triggered from central coral pink button and story add badge
- AC-10: covered by `PostsLoadingSkeleton.tsx` with shimmering frosted glass skeleton cards
