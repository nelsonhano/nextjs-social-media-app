# API Route Handlers

## Overview

REST API route handlers powering feeds, social interactions, notifications, search, and user data. All endpoints run as Next.js route handlers querying PostgreSQL via Prisma.

## Key files

| File | Owns |
|---|---|
| `src/app/api/posts/for-you/route.ts` | Community feed with cursor pagination |
| `src/app/api/posts/following/route.ts` | Followed users feed |
| `src/app/api/posts/[postId]/likes/route.ts` | Like toggle and notifications |
| `src/app/api/posts/[postId]/comments/route.ts` | Chronological comments thread |
| `src/app/api/users/[userId]/followers/route.ts` | Follow and unfollow actions |
| `src/app/api/notifications/route.ts` | User activity notifications |
| `src/app/api/search/route.ts` | Case insensitive content and username search |
| `src/app/api/clear-uploads/route.ts` | Scheduled orphaned media cleanup |

## Conventions

- Authenticate protected routes using validateRequest() from auth.ts
- Use cursor based pagination returning nextCursor when posts length exceeds pageSize
- Wrap multi model updates in prisma.$transaction, especially when creating notifications
- Use shared query helpers like getPostDataInclude and getUserDataSelect from src/lib/types.ts
- Return standard JSON responses with proper HTTP status codes (401 Unauthorized, 404 Not Found, 500 Server Error)

## Gotchas

- In Next.js 15, route handler params object must be handled carefully in asynchronous contexts
- Never execute long running external network requests inside database transactions
- Clear uploads endpoint requires Authorization Bearer token matching CRON_SECRET

_Drafted by /audit from the repo, worth a quick human pass. Edit freely: once a line stops matching this draft, later runs treat it as curated and will flag rather than overwrite it._
