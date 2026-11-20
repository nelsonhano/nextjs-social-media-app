# 0003. Modern UI Revamp with White Glass Card Styling

**Date**: 2026-11-19
**Status**: Accepted

## Summary

This specification defines a comprehensive visual and layout redesign of the social media application to match modern mobile feed reference designs. Every card across the entire application receives a translucent white frosted glass aesthetic with backdrop blur, subtle borders, and soft elevation shadows. The interface introduces a floating brand header, an interactive stories tray with gradient rings, rounded category pill tabs, a follow button pill and rounded media collage on post cards, and a floating bottom pill navigation bar with a central coral pink create button.

## Context

The current user interface uses standard flat opaque white and dark gray cards with minimal depth and traditional desktop layout styling. The product vision requires a vibrant, modern mobile first social experience that matches two specific visual references provided by the user.

The first reference presents the Glimo mobile social feed, which features a stylized brand header, a horizontal stories tray with colorful gradient status rings, rounded category filter pills for feeds, post cards with follow action pills beside the author, rounded media grid collages, and a floating bottom navigation bar centered around an eye catching coral pink create action.

The second reference, based on LiveNova, defines the signature white frosted glass aesthetic. Translucent white glass surfaces with optical backdrop blur, delicate borders, and soft shadows float over a rich ambient background. The user explicitly required that every card in the entire application must have this white frosted glass effect.

Failing to standardize this visual revamp would lead to visual fragmentation, inconsistent card styling across different pages, poor contrast between text and background, and an experience that feels dated compared to contemporary social media platforms.

## Requirements

**User stories**:
- As a social media user, I want cards across the application to render with white frosted glass styling over an ambient background, so that the application looks modern, refined, and visually cohesive in both light and dark modes.
- As a user browsing the feed on mobile, I want a floating top header, horizontal stories tray, and pill category tabs, so that I can quickly explore new content and friend updates.
- As a user viewing a post card, I want to see the author with a follow pill button, a rounded media collage, and clear like and comment counter badges, so that I can easily engage with the content.
- As a mobile user, I want a floating bottom pill navigation bar with a prominent central create button, so that I can quickly create new posts and move between main tabs with one tap.

**Acceptance criteria**:
- **AC-1**: Every card throughout the application (feed posts, post editor, sidebars, menu bars, chat panels, and dialogs) renders with frosted white glass styling using backdrop blur, translucent fill, subtle white border, and soft elevation shadow.
- **AC-2**: The global page background renders an adaptive ambient gradient mesh (soft pastel orbs in light mode, vivid neon glows in dark mode) that provides rich color depth and high contrast behind the translucent glass cards.
- **AC-3**: The top navigation renders as a floating frosted glass brand header with stylized logo, search action trigger, notification bell with unread badge counter, and user profile avatar.
- **AC-4**: An interactive horizontal stories tray renders above the feed, displaying the current user avatar with an add story badge alongside followed users who have published visual posts in the last 24 hours with vibrant gradient rings.
- **AC-5**: Tapping an avatar in the stories tray opens an animated story viewer modal showing recent visual posts or status updates with a link to the user profile, while tapping the current user add badge opens the post creation dialog.
- **AC-6**: Feed category tabs render as rounded pill buttons with smooth active pill background indicator for switching between For you and Following feeds.
- **AC-7**: Post cards display author details with a follow pill button for non followed users (and a post options dropdown for the author), post text with highlighted blue hashtags, rounded 24px multi image grid collage (with responsive aspect ratios for 1, 2, 3, or 4 images), and bottom counter badges for likes and comments with bookmark and share actions.
- **AC-8**: Mobile navigation renders as a floating rounded pill bar above the bottom viewport edge with backdrop blur, active tab indicators, and a raised central coral pink create button across 5 fixed slots (Home, Search, Create, Bookmarks, Messages).
- **AC-9**: Tapping the central coral pink create button opens a white frosted glass Create Post modal dialog with text input, image attachment picker, privacy selector, and submission button.
- **AC-10**: Loading states and feed skeletons render as translucent frosted glass skeleton cards with soft shimmering pulse animation and rounded pill placeholders, preventing layout shifts.

## Options considered

### Option 1: Global CSS Glass Utility and Component Level Revamp

Define a shared global `.glass-card` utility and updated Tailwind card design tokens with backdrop blur, translucent background fill, subtle borders, and soft elevation shadows. Refactor navigation, feed tabs, post cards, stories, and editor components into cohesive modular units adhering to the modern mobile reference.

**Pros**:
- Guarantees complete visual consistency across every card in the application through centralized design tokens.
- Fully preserves server component boundaries and data fetching logic while updating the visual presentation layer.
- Clean separation between global styling utilities and individual UI components.

**Cons**:
- Requires updating several existing layout and card components in coordination.

### Option 2: Component by Component Inline Styling

Apply Tailwind utility classes directly to each component file individually without defining global CSS design tokens or shared glass utility classes.

**Pros**:
- Allows quick isolated experimentation on individual pages without touching global stylesheet files.

**Cons**:
- Leads to duplicated class chains, inconsistent blur radius or opacity across pages, and heavy maintenance overhead.
- Violates the mandate that every card throughout the application must uniformly share the white frosted glass effect.

### Option 3: Heavy Third Party Component Library Replacement

Replace the current Radix and Tailwind components with a dedicated glassmorphism UI component library.

**Pros**:
- Pre built glass widgets available out of the box.

**Cons**:
- Introduces large external dependencies and potential incompatibilities with Next.js 15 and React 19.
- Increases bundle size and complicates custom mobile navigation and stories behaviors.

## Decision

**Chosen option**: Option 1: Global CSS Glass Utility and Component Level Revamp

Standardize global frosted white glass tokens in the main stylesheet and Tailwind configuration, then update navigation, post cards, feed filters, and mobile bottom bar components following the reference images.

**Implementation skills**: `emil-design-eng` (component polish, invisible details), `animate` (fluid UI motion and spring interactions)

## Rationale

Option 1 provides the exact white frosted glass effect demanded across every application card while maintaining full control over responsive design and performance. By anchoring the glass styling in `globals.css` and Tailwind variables, every card (including future dialogs, sidebars, and widgets) automatically inherits the glass aesthetic. Modern CSS properties such as `backdrop-filter: blur(20px)` and semi transparent background values (`rgba(255, 255, 255, 0.75)` in light mode and `rgba(24, 24, 27, 0.65)` in dark mode) provide high fidelity frosted glass without requiring heavy runtime JavaScript libraries.

## Feature design

### CSS Design Tokens and Glass Utility

Global stylesheet rules added to `src/app/globals.css`:

```css
.glass-card {
  background-color: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.35);
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.08);
}

.dark .glass-card {
  background-color: rgba(24, 24, 27, 0.68);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.4);
}

.glass-pill {
  background-color: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.4);
}

.dark .glass-pill {
  background-color: rgba(39, 39, 42, 0.8);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.12);
}
```

Adaptive ambient page background in `src/app/(main)/layout.tsx`:

```tsx
<div className="relative min-h-screen bg-slate-50 dark:bg-slate-950 text-foreground overflow-x-hidden">
  {/* Ambient gradient mesh */}
  <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
    <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-purple-200/50 dark:bg-purple-600/25 blur-3xl" />
    <div className="absolute top-1/3 -right-40 h-[30rem] w-[30rem] rounded-full bg-blue-200/40 dark:bg-blue-600/20 blur-3xl" />
    <div className="absolute -bottom-40 left-1/3 h-[28rem] w-[28rem] rounded-full bg-pink-200/40 dark:bg-pink-600/20 blur-3xl" />
  </div>
  ...
</div>
```

### Component Architecture and Inventory

1. `src/app/(main)/Navbar.tsx`:
   - Floating rounded glass header on mobile and desktop.
   - Stylized brand logo (Glimo style with cursive pink accent).
   - Search button trigger opening search dialog or expanding search input.
   - Notification button with unread counter badge fetching from React Query or server count.
   - User profile button with avatar.

2. `src/components/stories/StoriesTray.tsx` and `StoryViewerModal.tsx`:
   - Horizontal carousel containing user story avatar with add badge plus followed users.
   - Data sourced by querying followed authors who have recent posts with attachments created in the last 24 hours.
   - Avatars wrapped in vibrant gradient borders (`bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 p-[2.5px] rounded-full`).
   - "LIVE" badge overlay for users actively streaming or with active Stream Chat presence.
   - Tapping the current user "Your story" avatar opens `CreatePostModal` to post a new visual update.
   - Tapping another user avatar opens `StoryViewerModal.tsx` showing their latest image attachment and caption with a direct link to their profile.

3. `src/app/(main)/ForYouFeed.tsx` and `FollowingFeed.tsx` with `FeedTabs.tsx`:
   - Category pill tabs: "For you" and "Following".
   - Active tab highlighted in black or high contrast pill with smooth transition.

4. `src/components/posts/Post.tsx`:
   - Header: Author avatar with gradient border option, author display name, username, timestamp.
   - Follow button pill: When viewing another user (`post.user.id !== user.id`), render `FollowButton` pill (`Follow` in solid black pill, or `Following` in subtle glass pill). When viewing own post (`post.user.id === user.id`), render `PostMoreButton` options dropdown.
   - Content: Text caption with blue hashtag links (`text-sky-500 hover:text-sky-600 dark:text-sky-400 font-medium hover:underline` linking to `/hashtag/${tag}`).
   - Media grid: Multi image collage with `rounded-2xl` corners supporting:
     - 1 image: `w-full max-h-[30rem] aspect-[16/9] object-cover rounded-2xl`
     - 2 images: 2 column grid `aspect-[4/3] gap-2 rounded-2xl`
     - 3 images: left column span 2 rows, right column 2 stacked items, `aspect-[4/3] gap-2 rounded-2xl`
     - 4 images: 2x2 grid `aspect-square gap-2 rounded-2xl`
     - More than 4 images: 4th slot displays `+N` count overlay
     - Videos: render standalone full width `aspect-video rounded-2xl`, not cropped in multi image collage
   - Engagement counters: Red heart pill badge ("120+ Likes"), comment pill badge ("65 Comments"), bookmark button, and share button.
   - Share button: triggers `navigator.share()` on mobile devices with fallback to `navigator.clipboard.writeText()` and a toast "Link copied to clipboard".

5. `src/app/(main)/MenuBar.tsx` and `FloatingBottomNav.tsx`:
   - Mobile: Floating rounded pill bar centered horizontally above bottom viewport edge (`fixed bottom-5 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-md`).
   - Feed container in `layout.tsx` adds `pb-28 sm:pb-5` to avoid obscuring bottom content.
   - 5 fixed slots:
     1. Home (`/`)
     2. Search / Explore (`/search`)
     3. Center Coral Pink Action (`+`, opens `CreatePostModal`, `bg-[#FF3B69] hover:bg-[#FF2D55] text-white shadow-lg shadow-pink-500/40 rounded-2xl p-3`)
     4. Bookmarks (`/bookmarks`)
     5. Messages (`/messages` with Stream unread badge)
   - Desktop: Side menu bar rendered in left column with `.glass-card` styling and rounded pill buttons.

6. `src/components/posts/editor/CreatePostModal.tsx`:
   - Frosted glass dialog triggered by central coral pink create button or user story add badge.
   - User avatar, privacy dropdown ("Public" default, "Followers only" marked coming soon), textarea input, media attachment upload previews, and post submission action submitting only valid schema fields.

### Value sourcing

| Action | Value produced / displayed | Source |
|---|---|---|
| Render stories tray | Current user story avatar and add icon | Logged in session user from `useSession` |
| Render followed stories | List of followed authors with visual posts in 24h | Sourced from recent posts query filtering authors with media attachments |
| Tap your story | Open create post dialog | UI state opening `CreatePostModal` |
| Open story viewer | Story slide image and author caption | Post media attachment from selected author post |
| Display post header | Follow button state or post more button | `post.user.followers` comparison against current user ID |
| Render media grid | 1 to 4 images with responsive ratios | `post.attachments.map(a => a.url)` |
| Render like badge | Like count and active heart status | `post._count.likes` and `post.likes.some(l => l.userId === user.id)` |
| Render comment badge | Comment count | `post._count.comments` |
| Share button | Native share sheet or clipboard copy | Web Share API `navigator.share` or clipboard write |
| Floating create button | Central coral pink button trigger | UI state trigger opening `CreatePostModal` |

### Key invariants

- Every card element must apply `.glass-card` or inherit translucent background with `backdrop-filter: blur(20px)`.
- Cards must maintain legible text contrast against both light and dark translucent backgrounds through adaptive foreground color tokens.
- The floating bottom navigation bar must float with clear bottom margin on mobile devices without obscuring post engagement actions (using `pb-28` container padding).
- The mobile create button must reliably open the post creation dialog without layout jump or full page navigation.
- The privacy dropdown in post creation must remain UI only until a database migration is introduced.

### Security model

- Visual revamp maintains all existing authentication and authorization policies: unauthenticated requests redirect to `/login` via `validateRequest()`.
- Post creation within the new modal dialog uses existing server action and API validation schemas (`createPostSchema` in `src/lib/validation.ts`).
- Media uploads continue using Uploadthing authenticated endpoints with size and type restrictions.

### Configuration required

No new environment variables or external credentials are required for this styling and layout revamp.

### Critical test scenarios

- Happy path: User loads mobile feed, views vibrant gradient backdrop behind white frosted glass post cards, scrolls through stories tray, switches category tabs, taps like counter, and opens post creation modal via central pink button, verifies **AC-1**, **AC-2**, **AC-4**, **AC-6**, **AC-7**, **AC-8**, **AC-9**.
- Media layout: Post with 1, 2, 3, or 4 images renders clean rounded 24px collage grid with specified aspect ratios without clipping or distortion, verifies **AC-7**.
- Responsive layout: Desktop viewport expands gracefully to three column layout with glass sidebars and wide feed, while mobile viewport docks floating pill navigation and top header with bottom padding, verifies **AC-3**, **AC-8**.
- Story interaction: Tapping a story avatar opens the animated story viewer modal with author details and close action, while tapping your story avatar opens post creation, verifies **AC-4**, **AC-5**.
- Loading state: Feed initial load renders translucent glass skeleton cards with shimmer pulse without content shift, verifies **AC-10**.

## Build plan

- [x] 1. Configure global frosted glass utility classes, adaptive ambient mesh backdrop, and updated card tokens in `src/app/globals.css` and `src/app/(main)/layout.tsx`, satisfies **AC-1**, **AC-2**.
- [x] 2. Redesign `Navbar.tsx` into a floating frosted glass brand header with stylized logo, notification counter, search trigger, and user profile avatar, satisfies **AC-3**.
- [x] 3. Create `src/components/stories/StoriesTray.tsx` and `StoryViewerModal.tsx` for horizontal stories display with gradient rings and modal viewer, satisfies **AC-4**, **AC-5**.
- [x] 4. Build category pill tabs in `src/app/(main)/page.tsx` for seamless feed switching between For you and Following, satisfies **AC-6**.
- [x] 5. Update `src/components/posts/Post.tsx` with follow button pill, rounded multi image collage grid (1, 2, 3, 4 images), hashtag styling, share action, and bottom counter badges, satisfies **AC-7**.
- [x] 6. Create `src/components/posts/editor/CreatePostModal.tsx` and `src/app/(main)/FloatingBottomNav.tsx` with floating bottom pill navigation (5 fixed slots) and coral pink create button, satisfies **AC-8**, **AC-9**.
- [x] 7. Create frosted glass loading skeleton components `src/components/posts/PostsLoadingSkeleton.tsx` for zero layout shift during query fetching, satisfies **AC-10**.

## Consequences

**Positive**:
- Premium, modern aesthetic matching top tier contemporary mobile social applications.
- Universal white frosted glass effect applied consistently across every card in both light and dark modes.
- Improved mobile ergonomics through floating bottom navigation and easily reachable central create action.
- Higher engagement through visual stories tray and prominent like and comment counter badges.

**Negative / tradeoffs**:
- `backdrop-filter: blur()` incurs a slight GPU compositing cost on older low powered mobile devices.
- Requires careful contrast auditing to ensure text remains accessible across varying ambient background colors.

**Neutral**:
- Desktop layout adapts glass sidebars while maintaining familiar multi column productivity workflow.

## Follow-up

- [ ] Add touch swipe gesture support for switching between story slides inside `StoryViewerModal.tsx`.
- [ ] Explore dynamic user status indicators for live streaming or audio spaces in story rings.

## Migration plan

**Strategy**: Strangler pattern in place
**Phases**:
1. Implement global CSS glass utilities and card design tokens in `globals.css` and `layout.tsx`.
2. Update navigation headers and floating bottom navigation components.
3. Update post cards, media grids, stories tray, and create post modal.
4. Verify all screens in light and dark modes across mobile and desktop viewports.
**Rollback**: Revert component commits to restore standard opaque card styling if regressions occur.
**Risks**: Blur rendering artifacts on unsupported browser versions, mitigated by CSS `@supports (backdrop-filter: blur(20px))` fallback rules.
