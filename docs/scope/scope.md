# Scope: Next.js 15 Social Media Platform

A full stack social network web application for sharing posts, following friends, exchanging direct messages, and discovering trending topics.

**Build approach:** Tracer Bullet (vertical slices where each feature is built end to end through every layer).
**Workflow:** Beta (after develop, check verify, then test). The project default level of rigor. /architect is the recommended first stop for a feature with a real decision, but skippable when you already know the build. Any feature can carry its own tag to do more or less.

_These are recommendations to keep your build orderly, not requirements. Skip anything that does not fit: if you already know how to build a feature, use /develop and skip /architect. You decide when a feature is done._

## At a glance

| # | Feature | Phase | Status |
|---|---------|-------|--------|
| 1 | Stack and architecture | Foundation | existing |
| 2 | Coding standards and tooling | Foundation | in-progress |
| 3 | Data model and schema | Foundation | existing |
| 4 | Design system and UI foundation | Foundation | existing |
| 5 | Authentication and session management | Slice 1 | existing |
| 6 | Post publishing and rich text editor | Slice 2 | existing |
| 7 | Multi feed timeline and pagination | Slice 3 | existing |
| 8 | Social reactions: likes and bookmarks | Slice 4 | existing |
| 9 | Comments discussion thread | Slice 5 | existing |
| 10 | User profiles and follower network | Slice 6 | existing |
| 11 | Notifications engine | Slice 7 | existing |
| 12 | Full text search and trending topics | Slice 8 | in-progress |
| 13 | Real time direct chat | Slice 9 | existing |
| 14 | Media storage and cleanup cron | Slice 10 | existing |
| 15 | Dedicated hashtag feed page | Slice 11 | done |
| 16 | Email verification and password reset | Slice 12 | planned |

## Foundations

### 1. Stack and architecture · existing
Next.js 15 with App Router, React 19, TypeScript, Tailwind CSS, Lucide icons, and TanStack React Query.
**Done when:** the project builds cleanly, routes load as server components, and client state hydrates properly.
code in `./`

### 2. Coding standards and tooling · in-progress
Code linting, Prettier formatting with Tailwind plugin, and automated test runners.
**Done when:** AGENTS.md captures conventions and lint or typecheck run with zero errors.
- [x] Capture conventions and architecture: `/audit`
- [x] TypeScript type checking verification
- [ ] End to end automated test suite setup: `/test`
code in `package.json`

### 3. Data model and schema · existing
PostgreSQL database schema managed via Prisma ORM with relational mapping and cascade deletions.
**Done when:** user, session, follow, post, post media, comment, like, bookmark, and notification tables are declared and synchronized.
code in `prisma/schema.prisma`

### 4. Design system and UI foundation · existing
Modern themeable UI components built on Radix UI primitives with dark and light mode support.
**Done when:** dialogs, dropdowns, tooltips, tabs, buttons, and responsive sidebars render accessible states.
code in `src/components/ui/`

## Slice 1: Authentication and Session Management

### 5. Authentication and session management · existing
Local credential signup and login using Argon2id password hashing, Lucia session cookies, and Google OAuth flow.
**Done when:** users can register, sign in securely, persist authenticated sessions across requests, and log out.
code in `src/auth.ts` and `src/app/(auth)/`

## Slice 2: Post Publishing and Rich Text Editor

### 6. Post publishing and rich text editor · existing
Rich text post creation with Tiptap editor, placeholder support, link parsing, and media attachments.
**Done when:** users can write formatted posts, attach uploaded images or videos, and publish them to the database.
code in `src/components/posts/editor/`

## Slice 3: Multi Feed Timeline and Pagination

### 7. Multi feed timeline and pagination · existing
Cursor based infinite scrolling feeds for general community posts, followed users, and saved bookmarks.
**Done when:** feeds stream posts in batches of 10, handle empty or loading skeletons, and advance smoothly on scroll.
code in `src/app/api/posts/` and `src/components/posts/`

## Slice 4: Social Reactions: Likes and Bookmarks

### 8. Social reactions: likes and bookmarks · existing
Instant optimistic like toggle with counter updates, personal bookmarking, and automated notification triggers.
**Done when:** clicking like or bookmark reflects instantly in UI, persists to database, and notifies post author.
code in `src/app/api/posts/[postId]/likes/` and `src/app/api/posts/[postId]/bookmark/`

## Slice 5: Comments Discussion Thread

### 9. Comments discussion thread · existing
Expandable comments section under each post with input validation, ascending order display, deletion, and author notifications.
**Done when:** users can write comments, read chronological discussion, delete their own comments, and see comment counters change.
code in `src/components/comments/` and `src/app/api/posts/[postId]/comments/`

## Slice 6: User Profiles and Follower Network

### 10. User profiles and follower network · existing
Public profile pages with bio and avatar editing, follow or unfollow toggles, follower counts, and hover preview tooltips.
**Done when:** visiting a username displays user details and authored posts, and following increments followers and sends alerts.
code in `src/app/(main)/users/[username]/` and `src/app/api/users/`

## Slice 7: Notifications Engine

### 11. Notifications engine · existing
Activity center alerting users about new likes, comments, and follows, with unread badge counter and mark as read action.
**Done when:** unread counts appear on navigation icon, notification items link to sources, and opening page marks items read.
code in `src/app/(main)/notifications/` and `src/app/api/notifications/`

## Slice 8: Full Text Search and Trending Topics

### 12. Full text search and trending topics · in-progress
Full text query matching against post content and usernames, plus sidebar calculating trending hashtags using PostgreSQL regular expression queries.
**Done when:** search bar displays matching posts and sidebar surfaces top five hashtags (hashtag detail page currently pending).
- [x] Full text search endpoint and page: `src/app/api/search/route.ts`
- [x] Trending topics calculation query: `src/components/TrendsSidebar.tsx`
- [ ] Connect hashtag links to a dedicated hashtag feed view: `/develop hashtag page`
code in `src/app/api/search/` and `src/components/TrendsSidebar.tsx`

## Slice 9: Real Time Direct Chat

### 13. Real time direct chat · existing
Integrated Stream Chat client providing channels, instant messaging, unread message badges, and new conversation dialogs.
**Done when:** authenticated users receive Stream tokens, open chat windows, and exchange messages with other members.
code in `src/app/(main)/messages/` and `src/lib/stream.ts`

## Slice 10: Media Storage and Cleanup Cron

### 14. Media storage and cleanup cron · existing
Uploadthing integration for profile avatars and post media attachments, with a secure route to delete orphaned uploads.
**Done when:** media files upload directly to storage, avatar updates remove old images, and unused uploads get pruned.
code in `src/app/api/uploadthing/` and `src/app/api/clear-uploads/`

## Planned Next Slices

### 15. Dedicated hashtag feed page · done
Page displaying all posts matching a clicked trending hashtag from the sidebar.
**Done when:** clicking a hashtag navigates to `/hashtag/[tag]` and displays an infinite scroll feed of matching posts.
- [x] Design it (spec): `/architect hashtag feed`
- [x] Build it: /develop hashtag feed
  - [x] API route with async params, tag sanitization, and cursor pagination (AC-4, AC-5, AC-6, AC-8)
  - [x] Client feed component with infinite scroll and empty state (AC-4, AC-6, AC-7)
  - [x] Server page with async params, banner header, and sidebar (AC-1, AC-2, AC-3, AC-8)
  - [x] Automated integration test coverage for hashtag queries (AC-4, AC-5, AC-6, AC-8)
- [x] Verify it: `/check verify hashtag feed`
- [x] Test it: `/test hashtag feed`
Spec [0001](../specs/0001-hashtag-feed/index.md) · code in `src/app/(main)/hashtag/[tag]/`

### 16. Email verification and password reset · planned
Automated email verification link on signup and secure password reset flow for forgotten credentials.
**Done when:** unverified users confirm email addresses and password reset links allow updating forgotten passwords.
- [ ] Design it (spec): `/architect password reset`

## Deferred
Out of scope for current build pass, recorded so the plan stays transparent.
- Push notifications via web push or mobile tokens
- User blocking and mute lists
- Content moderation and report flagging system
- Direct video transcoding and adaptive streaming

## Legend

**Feature lifecycle**: the scope updates as a feature moves; each row shows status and ownership:

| State | Set by | The feature shows |
|---|---|---|
| `planned` | `/scope` | one box: `Design it (spec): /architect <feature>` |
| `in-progress` | `/architect` or `/develop` | milestones rolling up from spec or partial code to complete |
| `existing` | `/scope` (brownfield) | pre-workflow complete feature with code pointer |
| `done` | you, when you decide it is | verified and tested working code |
