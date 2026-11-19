# Next.js 15 Social Media Platform

## Stack

- **Language / Runtime**: TypeScript, Node.js
- **Framework**: Next.js 15 (App Router), React 19
- **Key dependencies**: Prisma ORM, Lucia Auth, Tailwind CSS, TanStack React Query, Stream Chat, Uploadthing
- **Package manager**: npm

## Build approach

Tracer Bullet, vertical end to end slices, thin but complete through every layer (mirrored from docs/scope/scope.md)

## Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run linter
npm run lint

# Check TypeScript types
npx tsc --noEmit
```

## Specs

Stored in `docs/specs/`. Format: `docs/specs/NNNN-title.md`.

## Rules

- Use Server Components by default; add 'use client' directive only when using browser events or state hooks
- Authenticate requests with validateRequest() imported from src/auth.ts
- Validate client inputs using Zod validation schemas located in src/lib/validation.ts
- Query database records through the singleton Prisma client in src/lib/prisma.ts
- Batch dependent database writes like post reactions and notifications with prisma.$transaction
- Use cursor based pagination returning nextCursor for infinite scroll timelines
- Reuse relational selectors like getPostDataInclude and getUserDataSelect from src/lib/types.ts

## Context files

- [src/app/api/AGENTS.md](src/app/api/AGENTS.md): REST API route handlers, cursor pagination, and database query patterns

_Drafted by /audit from the repo, worth a quick human pass. Edit freely: once a line stops matching this draft, later runs treat it as curated and will flag rather than overwrite it._
