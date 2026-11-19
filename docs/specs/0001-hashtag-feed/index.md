# 0001. Hashtag Feed Page and API Endpoint

**Date**: 2026-11-19
**Status**: Accepted

## Summary

This decision defines the architecture for the dedicated hashtag feed feature. It introduces a page at `/hashtag/[tag]` and a matching API route at `/api/posts/hashtag/[tag]`. Users who click trending hashtags in the sidebar will see a chronological infinite feed of matching posts. This resolves the current 404 issue when clicking trending topics without requiring any database schema changes.

## Requirements

**User stories**:
- As a signed in user, I want to click any trending hashtag in the sidebar so that I can see all posts containing that tag.
- As a signed in user, I want to scroll through matching posts smoothly using infinite scrolling so that I can discover relevant discussions.

**Acceptance criteria**:
- **AC-1**: Navigating to `/hashtag/[tag]` loads the hashtag feed page with an authenticated session check via `validateRequest()`.
- **AC-2**: The page displays a top header banner with the hashtag title (`#${cleanTag}`) and the total matching post count formatted using `formatNumber` (`${formatNumber(count)} ${count === 1 ? "post" : "posts"}`). Page metadata title is set to `Posts tagged #${cleanTag}`.
- **AC-3**: The page includes `TrendsSidebar` on the right side for desktop screens, matching the layout of the home and search pages.
- **AC-4**: An API route at `GET /api/posts/hashtag/[tag]` sanitizes the tag parameter, returns a 400 status if empty, and queries paginated posts containing `#` followed by the cleaned tag name using case insensitive matching.
- **AC-5**: The API returns posts sorted by creation date descending, including attachments, author details, like counts, and bookmark states.
- **AC-6**: The API supports cursor based pagination with `pageSize = 10`, returning `nextCursor` when more posts exist.
- **AC-7**: Empty state displays the friendly copy `"No posts found with this hashtag."` when no posts match.
- **AC-8**: Unauthenticated requests to either the page or the API endpoint return an unauthorized response (401 status for the API, redirect to login for the page).

## Decision

**Chosen option**: Option 1: Case insensitive post content substring search.

The application queries existing post records directly using Prisma case insensitive search, exposing a dedicated API route and feed page matching existing platform conventions.

## Rationale

See [rationale.md](./rationale.md) for full context, options considered, and decision rationale.

## Feature design

**Data model sketch**:
Reuses the existing `Post` table from `prisma/schema.prisma` without schema modifications:
- Table: `posts`
- Filter: `where: { content: { contains: '#' + cleanTag, mode: 'insensitive' } }`
- Order: `orderBy: { createdAt: 'desc' }`
- Relational inclusions: `getPostDataInclude(loggedInUserId)`

**State transitions**:
Not applicable. Posts in the feed are read only entities.

**API surface**:
| Endpoint | Method | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| `/api/posts/hashtag/[tag]` | GET | `tag:string` (path, await params), `cursor:string` (query opt) | `posts:PostData[]`, `nextCursor:string\|null` | session cookie | 400 Bad Request (empty tag), 401 Unauthorized, 500 Server Error |

**Value sourcing**:
| Action | Value produced / displayed | Source |
|---|---|---|
| Sanitize input | `cleanTag` | `decodeURIComponent(tag).replace(/^#+/, "").trim()` |
| Page metadata | Page title | `Posts tagged #${cleanTag}` |
| Load page | Tag string in title banner | `#${cleanTag}` rendered from sanitized route parameter |
| Load page | Total matching post count | Prisma query `prisma.post.count` where content contains `#` + `cleanTag` |
| Load page | Count display label | `${formatNumber(count)} ${count === 1 ? "post" : "posts"}` using `formatNumber` from `@/lib/utils` |
| Fetch feed page | Cursor for next batch | URL search parameter `req.nextUrl.searchParams.get("cursor")` |
| Feed query hook | React Query cache key | `["post-feed", "hashtag", cleanTag]` |
| Render feed items | List of posts and interaction state | Prisma query `prisma.post.findMany` with `take: 11` using `getPostDataInclude` |
| Empty feed view | Empty state notice | Constant string: `"No posts found with this hashtag."` |

**Key invariants**:
- The tag parameter must be decoded with `decodeURIComponent` and sanitized by stripping all leading `#` symbols.
- If `cleanTag` is empty, the API must return a 400 status immediately, and the page component must call `notFound()`.
- Next.js 15 asynchronous route params rule: all route handlers and page components must handle `params` as a Promise and use `await params`.
- Unauthenticated requests must never access data.
- Deleted posts must never appear in the feed.

**Security model**:
- All requests require an active session validated by `validateRequest()`.
- Unauthenticated requests receive an HTTP 401 response from the API or a redirect to `/login` from the page.

**Configuration required**:
None. Reuses existing environment variables and database credentials.

**Critical test scenarios**:
- Happy path: User clicks `#nextjs` on sidebar, arrives at `/hashtag/nextjs`, and sees chronological posts containing `#nextjs`, verifies **AC-1**, **AC-2**, **AC-4**, **AC-5**.
- Pagination: Scrolling to the bottom loads the next batch of 10 posts using cursor pagination, verifies **AC-6**.
- Empty state: Visiting an unused tag displays `"No posts found with this hashtag."`, verifies **AC-7**.
- Empty tag validation: Requesting an empty or bare hash returns 400 in API or 404 in page, verifies **AC-4**.
- Auth/permission: Visiting without an active session cookie returns unauthorized or redirects to login, verifies **AC-8**.

## Build plan

1. [x] Create route handler `src/app/api/posts/hashtag/[tag]/route.ts` with Next.js 15 async params, tag sanitization, empty query guards, and cursor pagination, satisfies **AC-4**, **AC-5**, **AC-6**, **AC-8**
2. [x] Create client feed component `src/app/(main)/hashtag/[tag]/HashtagFeed.tsx` using `useInfiniteQuery` with key `["post-feed", "hashtag", cleanTag]` and empty state copy, satisfies **AC-4**, **AC-6**, **AC-7**
3. [x] Create server page `src/app/(main)/hashtag/[tag]/page.tsx` with async params, metadata, banner header with formatted post count, and `TrendsSidebar`, satisfies **AC-1**, **AC-2**, **AC-3**, **AC-8**
4. [x] Add automated test coverage in `scripts/test-all-endpoints.js` verifying hashtag endpoint query construction, tag sanitization, and 400 validation, satisfies **AC-4**, **AC-5**, **AC-6**, **AC-8**

## Consequences

**Positive**:
- Resolves the 404 broken link from the trending topics sidebar.
- Provides a clean user experience for exploring topics.
- Strictly adheres to Next.js 15 App Router conventions for route parameters.
- Requires zero schema migrations or changes to existing database records.

**Negative / tradeoffs**:
- Substring matching does not enforce strict word boundaries if tags share prefixes.

**Neutral**:
- Matches existing feed patterns and component styling.

## Follow-up

- [ ] Optional: Add sorting options (top posts by likes versus most recent) in a future slice.
