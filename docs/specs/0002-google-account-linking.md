# 0002. Link Google OAuth to Existing Credential Accounts

**Date**: 2026-11-19
**Status**: Accepted

## Summary

This enhancement enables users who registered using the standard email and password form to sign in using Google social login with the same email address. The Google OAuth callback route inspects the verified email returned by Google and connects the Google identifier to the matching user record. The user keeps their existing credentials intact and can sign in through either method.

## Context

Users frequently register on the platform using a standard username, email, and password combination. When returning later, many users instinctively click the Sign in with Google button using their Google account associated with that same email address.

Currently, the Google OAuth callback only queries for an existing user by Google identifier (`googleId`). Because an account created through standard form signup has a null Google identifier, the callback fails to recognize the user and attempts to create a duplicate account. This either fails on unique email constraints or provisions an unwanted secondary account with a random username suffix.

Connecting existing credential accounts to Google OAuth automatically based on a verified email removes sign in friction and preserves user history, authored posts, followers, and direct chats.

## Requirements

**User stories**:
- As a registered user who signed up with email and password, I want to sign in with my Google account using that same email so that I can log in with one click without entering my password.
- As a user logging in with Google, I want my existing profile data and followers preserved so that my account identity remains unified.
- As a security conscious platform, I want to ensure accounts only link when Google certifies the email address as verified so that account takeover is prevented.

**Acceptance criteria**:
- **AC-1**: When an existing user who registered with email and password signs in with Google, and Google returns `verified_email === true` matching their account, the application links the Google identifier to their user record and creates an authenticated session.
- **AC-2**: When linking an account, the user's existing display name and bio remain unchanged, and the profile avatar is populated from Google only if the user does not already have an avatar.
- **AC-3**: When a user signs in with Google whose Google identifier is already linked, the application creates an authenticated session immediately without unnecessary database updates.
- **AC-4**: When a new user signs in with Google whose Google identifier and email do not exist in the database, and `verified_email === true`, the application creates a new user record with their email, Google identifier, display name, and avatar, registers the user in Stream Chat, and creates an authenticated session.
- **AC-5**: If Google returns an unverified email address or if the email field is missing, the application blocks automatic linking and new user creation, and redirects to `/login?error=unverified_email`.
- **AC-6**: If the OAuth callback encounters missing state cookies, invalid verifiers, user consent cancellation, or provider errors, the application clears OAuth cookies, redirects the user to `/login?error=...`, and renders an informative alert on the login form.
- **AC-7**: If a matching email address is found in the database but already has a different Google identifier assigned, the application blocks the request and redirects to `/login?error=account_collision`.
- **AC-8**: All email lookups against the database use case insensitive matching.
- **AC-9**: Google avatar image host `lh3.googleusercontent.com` is configured in `next.config.mjs` so Google avatars render without image loader exceptions.

## Options considered

### Option 1: Automatic linking on verified email

The application extracts the verified email address from the Google user profile. If a local user exists with that verified email, the application immediately updates their `googleId` and starts an authenticated session.

**Pros**:
- Frictionless user experience with one click sign in.
- Safe against account takeover because Google guarantees email verification on their accounts.
- Preserves the user's existing password hash so either login method remains valid.

**Cons**:
- If a user's Google account itself was compromised, the attacker gains entry to the local account without re-entering the local password.

### Option 2: Prompt for local password confirmation before linking

When an email match is found during the Google OAuth callback, the user is redirected to an interstitial page asking for their local account password before the Google identifier is connected.

**Pros**:
- Highest security against compromised external OAuth accounts.

**Cons**:
- Disrupts the convenience of social login and confuses users who chose Google specifically because they forgot their password.
- Requires building a temporary linking session state and a dedicated confirmation UI.

### Option 3: Require manual account linking in user settings only

Disallow linking during login entirely. Users must sign in with their password first, navigate to account settings, and explicitly click a Link Google Account button.

**Pros**:
- Zero ambiguity regarding user intent.

**Cons**:
- Does not solve the primary failure point where a user attempts to sign in via Google from the login page.
- Frustrates users with generic account collision errors.

## Decision

**Chosen option**: Option 1: Automatic linking on verified email

Link Google accounts automatically when Google confirms the email address is verified, preserving local password credentials and existing profile data.

## Rationale

Option 1 provides the expected standard behavior across consumer web applications. Because Google verifies email addresses on Google accounts, matching an account by verified email is secure and avoids unnecessary friction. Users who choose social login expect instant access without being redirected to secondary password forms. Preserving the existing password hash ensures users maintain the freedom to sign in with either their password or their Google account at any time.

## Feature design

**Data model sketch**:

No database schema migrations are needed. The existing Prisma schema already contains all necessary fields on the `User` and `Session` models:

```prisma
model User {
  id           String    @id
  username     String    @unique
  displayName  String
  email        String?   @unique
  passwordHash String?
  googleId     String?   @unique
  avatarUrl    String?
  bio          String?
  createdAt    DateTime  @default(now())
  sessions     Session[]
}

model Session {
  id        String   @id
  userId    String
  expiresAt DateTime
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

**API surface**:

| Endpoint | Method | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| `/api/auth/callback/google` | GET | `code`, `state`, optional `error` query parameters; `state`, `code_verifier` cookies | HTTP 302 redirect to `/` or `/login?error=...` | Public (OAuth callback) | 302 redirect to login with error parameter |

**Value sourcing**:

| Action | Value produced / displayed | Source |
|---|---|---|
| Userinfo request | `googleUser.id`, `googleUser.name`, `googleUser.email`, `googleUser.verified_email`, `googleUser.picture` | Google userinfo endpoint response payload typed explicitly |
| Account lookup by Google ID | `existingUserByGoogleId` | Database query `findUnique` on `User.googleId` |
| Account lookup by email | `existingUserByEmail` | Database query `findFirst` on `User.email` using case insensitive equals |
| Account link update | Updated `User.googleId` and optional `User.avatarUrl` | Derived from `googleUser.id` and `googleUser.picture` |
| Session creation | Session ID and session cookie | Lucia session created from verified user identifier |
| Error parameter | `error` string query parameter | Callback failure branch redirect |
| Error banner text | Human readable alert text | Mapped from `error` prop in login page |

**Error mapping for UI**:
- `unverified_email`: "Your Google email address is not verified. Please verify your email with Google or log in with your password."
- `account_collision`: "This email is already connected to a different Google account. Please sign in with your password."
- `oauth_cancelled`: "Google sign in was cancelled."
- `oauth_error`: "Failed to sign in with Google. Please try again."

**Key invariants**:
- The user's `passwordHash` is never modified or erased during the account linking process.
- Account linking and new user registration require `googleUser.verified_email === true` strictly.
- If an existing user already has a custom `avatarUrl`, it is not overwritten by the Google picture.
- If a user record matching the email already has a different `googleId` stored, linking is refused to prevent silent account re-binding.
- OAuth temporary cookies (`state` and `code_verifier`) are cleaned up on callback completion across all exit paths.

**Security model**:
- Account takeover is prevented by requiring `googleUser.verified_email === true` and non empty email before linking or registering.
- Lucia session cookies use `httpOnly: true`, `sameSite: "lax"`, and `secure: true` in production environments.
- State and code verifier parameters prevent cross site request forgery and authorization code interception attacks.

**Configuration required**:
- `next.config.mjs`: Add `lh3.googleusercontent.com` to `images.remotePatterns` to allow rendering Google profile pictures without runtime errors.

**Critical test scenarios**:
- Happy path account link: User registered with email and password signs in with Google using matching verified email; verifies **AC-1**, **AC-2**, **AC-8**.
- Repeat sign in: User with previously linked `googleId` signs in with Google; verifies **AC-3**.
- New user sign in: User with no matching Google ID or email signs in with Google; verifies **AC-4**, **AC-9**.
- Unverified email protection: Google returns unverified email address, linking and signup are blocked and redirected; verifies **AC-5**.
- OAuth error recovery: State mismatch or user cancellation triggers redirect to `/login?error=...` with cookie deletion; verifies **AC-6**.
- Collision guard: Matching email already linked to a different Google ID redirects to `/login?error=account_collision`; verifies **AC-7**.

## Build plan

1. [x] Add `lh3.googleusercontent.com` to `images.remotePatterns` in `next.config.mjs`, satisfies **AC-9**.
2. [x] Update Google userinfo typing and request to fetch `id`, `name`, `email`, `verified_email`, and `picture` in `src/app/api/auth/callback/google/route.ts`, satisfies **AC-1**, **AC-4**.
3. [x] Implement strict verification checks (`verified_email === true`), cookie deletion, and error redirects in `src/app/api/auth/callback/google/route.ts`, satisfies **AC-5**, **AC-6**.
4. [x] Implement existing user lookup by case insensitive email, collision guard, and account linking update in `src/app/api/auth/callback/google/route.ts`, satisfies **AC-1**, **AC-2**, **AC-7**, **AC-8**.
5. [x] Ensure new user creation stores `email` and `avatarUrl` alongside `googleId` and Stream Chat registration, satisfies **AC-4**.
6. [x] Update `src/app/(auth)/login/page.tsx` and `LoginForm.tsx` to read search parameters and render the error alert banner with friendly error copy, satisfies **AC-6**, **AC-7**.
7. [x] Verify the complete authentication and linking loop across both credential and Google sign in flows, satisfies **AC-1**, **AC-2**, **AC-3**, **AC-4**, **AC-5**, **AC-6**, **AC-7**, **AC-8**, **AC-9**.

## Migration plan

**Strategy**: no migration needed
**Phases**:
1. Deploy code updates to `next.config.mjs`, the Google OAuth callback route, and the login page error handling.
**Rollback**: Revert code changes to previous callback implementation. No schema changes or data rollbacks are required.
**Risks**: None. Existing database records and password hashes are untouched.

## Consequences

**Positive**:
- Users who signed up with email and password can log in seamlessly with Google using the same email address.
- Eliminates duplicate accounts and unique constraint errors on duplicate emails.
- Preserves user profile customization, post history, and follower connections.
- Automatically saves email and profile pictures for new Google OAuth registrations.
- Configures Google image domain so avatars render safely in `<UserAvatar />`.
- Clean error messaging informs users when a conflict or unverified email occurs.

**Negative / tradeoffs**:
- If a user's Google account is compromised, the attacker can access the platform account linked to that email without knowing the local password.

**Neutral**:
- Users can continue signing in with their password whenever they choose because password hashes remain intact.
