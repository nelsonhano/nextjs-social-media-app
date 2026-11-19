# 0001 Rationale: Hashtag Feed Page and API Endpoint

## Context

The application sidebar currently queries the database for popular hashtags and displays them as clickable links pointing to `/hashtag/[tag]`. However, that page does not exist yet, resulting in a 404 error when clicked.

Users need a way to explore community conversations around specific topics. Building this feature requires deciding how posts matching a hashtag are queried, where the API endpoint and frontend page live, how the feed handles pagination, and how access permissions are enforced.

Not building this feature leaves a broken link visible on every main page of the social network.

## Options considered

### Option 1: Case insensitive post content substring search (Chosen)

Query post records directly with Prisma using `where: { content: { contains: '#' + cleanTag, mode: 'insensitive' } }`.

**Pros**:
- Works immediately with the existing schema and requires zero database migrations.
- Reuses the standard `getPostDataInclude` query pattern and `PostsPage` type.
- Fast to implement and test using the Tracer Bullet build approach.

**Cons**:
- Substring matching can match partial words if a tag is a prefix of another word.

### Option 2: Redirect to search page

Redirect requests from `/hashtag/[tag]` directly to `/search?q=%23tag`.

**Pros**:
- Reuses the existing search page with minimal new code.

**Cons**:
- Loses the dedicated hashtag header banner and topic count.
- Confuses search results with general text queries rather than a focused topic feed.

### Option 3: Dedicated Hashtag and PostHashtag database tables

Create normalized `Hashtag` and join tables in PostgreSQL, populating them when posts are submitted.

**Pros**:
- Provides indexed relational lookups and exact word boundary guarantees.

**Cons**:
- Requires database migration and backfilling existing posts.
- Adds unnecessary architectural complexity for the current application scale.

## Rationale

Option 1 provides the cleanest and fastest path to production. It completely fixes the broken navigation link, integrates seamlessly with the existing `PostsPage` format, and avoids database migration downtime. If post volume grows significantly in the future, transitioning to full text search indexes or normalized tables can be handled as a separate optimization.
