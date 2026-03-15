# Clerk Next.js Setup Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the Clerk auth integration by fixing `ClerkProvider` position, adding auth UI header components, and tightening the middleware matcher.

**Architecture:** Clerk is already partially wired — the package is installed and middleware protects `/admin` routes. Two files need changes: `app/layout.tsx` (provider position + auth header) and `middleware.ts` (matcher pattern).

**Tech Stack:** Next.js 16 App Router, `@clerk/nextjs@^7.0.4`, TypeScript, Tailwind CSS v4

---

## Current State

| Item | Status | Notes |
|------|--------|-------|
| `@clerk/nextjs` installed | ✅ | v7.0.4 |
| `middleware.ts` exists | ✅ | Uses `clerkMiddleware` + admin route protection |
| `ClerkProvider` in layout | ⚠️ | Wraps `<html>`, spec requires inside `<body>` |
| Auth UI header | ❌ | Missing `<Show>`, `<UserButton>`, `<SignInButton>`, `<SignUpButton>` |
| Middleware matcher | ⚠️ | Current pattern misses static file exclusions for some types |

---

## File Structure

- **Modify:** `app/layout.tsx` — move `ClerkProvider` inside `<body>`, add auth header
- **Modify:** `middleware.ts` — update matcher to spec's comprehensive pattern

---

## Chunk 1: Fix Layout and Auth UI

### Task 1: Fix `ClerkProvider` position and add auth header in `app/layout.tsx`

**Files:**
- Modify: `app/layout.tsx`

**Context:** `ClerkProvider` currently wraps `<html>`. Per spec, it must live inside `<body>`. We also need a `<header>` with conditional auth buttons.

**What the file looks like now:**
```tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>         // ← wraps <html>, needs to move inside <body>
      <html lang="en" ...>
        <head>...</head>
        <body ...>
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}
```

**What it should look like after:**
```tsx
import { ClerkProvider, SignInButton, SignUpButton, Show, UserButton } from "@clerk/nextjs";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <head>
        {/* Google Analytics scripts stay here */}
      </head>
      <body className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-950 dark:text-white antialiased">
        <ClerkProvider>
          <header className="flex justify-end items-center px-4 py-2 border-b border-zinc-200 dark:border-zinc-800">
            <Show when="signed-out">
              <SignInButton />
              <SignUpButton />
            </Show>
            <Show when="signed-in">
              <UserButton />
            </Show>
          </header>
          {children}
        </ClerkProvider>
      </body>
    </html>
  )
}
```

- [ ] **Step 1: Update imports in `app/layout.tsx`**

  Add `SignInButton`, `SignUpButton`, `Show`, `UserButton` to the existing `@clerk/nextjs` import:

  ```tsx
  import { ClerkProvider, SignInButton, SignUpButton, Show, UserButton } from '@clerk/nextjs'
  ```

- [ ] **Step 2: Move `ClerkProvider` inside `<body>` and add auth header**

  The full updated `app/layout.tsx`:

  ```tsx
  import type { Metadata } from 'next'
  import { Geist, Geist_Mono } from 'next/font/google'
  import { ClerkProvider, SignInButton, SignUpButton, Show, UserButton } from '@clerk/nextjs'
  import Script from 'next/script'
  import './globals.css'

  const geistSans = Geist({
    variable: '--font-geist-sans',
    subsets: ['latin'],
  })

  const geistMono = Geist_Mono({
    variable: '--font-geist-mono',
    subsets: ['latin'],
  })

  export const metadata: Metadata = {
    title: 'Fuck Doug Ford — Ontario Accountability Dashboard',
    description: 'Tracking Ontario Government bills, MPPs, and scandals that affect Toronto. ProPublica-style transparency journalism.',
    keywords: ['Ontario', 'Doug Ford', "Queen's Park", 'Toronto', 'legislature', 'bills', 'accountability'],
  }

  export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
      <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
        <head>
          <Script
            src="https://www.googletagmanager.com/gtag/js?id=G-HS9JW4JFQS"
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-HS9JW4JFQS');
            `}
          </Script>
        </head>
        <body className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-950 dark:text-white antialiased">
          <ClerkProvider>
            <header className="flex justify-end items-center gap-2 px-4 py-2 border-b border-zinc-200 dark:border-zinc-800">
              <Show when="signed-out">
                <SignInButton />
                <SignUpButton />
              </Show>
              <Show when="signed-in">
                <UserButton />
              </Show>
            </header>
            {children}
          </ClerkProvider>
        </body>
      </html>
    )
  }
  ```

- [ ] **Step 3: Verify the app builds without TypeScript errors**

  Run: `npm run build`

  Expected: Build succeeds. If `Show` is not in the installed version, check `@clerk/nextjs` exports — it ships in v7+.

- [ ] **Step 4: Spot-check in dev**

  Run: `npm run dev`

  Open `http://localhost:3000`. Expected:
  - Header appears at top with Sign In / Sign Up buttons
  - App renders normally (no hydration errors in console)
  - Navigate to `/admin` — should redirect to Clerk sign-in (middleware protection still works)

- [ ] **Step 5: Commit**

  ```bash
  git add app/layout.tsx
  git commit -m "feat: move ClerkProvider inside body, add auth header with Show/SignInButton/SignUpButton/UserButton"
  ```

---

## Chunk 2: Update Middleware Matcher

### Task 2: Update `middleware.ts` matcher pattern

**Files:**
- Modify: `middleware.ts`

**Context:** The current matcher `['/((?!_next|.*\\..*).*)']` only excludes `_next` and files with extensions. The spec's pattern is more precise — it excludes specific static asset extensions (images, fonts, icons, etc.) and explicitly includes `/(api|trpc)(.*)`.

**Current:**
```ts
export const config = {
  matcher: ['/((?!_next|.*\\..*).*)'],
}
```

**Target:**
```ts
export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
```

Note: The rest of `middleware.ts` (admin route protection) stays unchanged.

- [ ] **Step 1: Update matcher in `middleware.ts`**

  Full updated file:

  ```ts
  import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

  const isAdminRoute = createRouteMatcher(['/admin(.*)', '/api/admin(.*)'])

  export default clerkMiddleware((auth, req) => {
    if (isAdminRoute(req)) auth.protect()
  })

  export const config = {
    matcher: [
      '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
      '/(api|trpc)(.*)',
    ],
  }
  ```

- [ ] **Step 2: Verify admin protection still works**

  Run: `npm run dev`

  Navigate to `http://localhost:3000/admin` while signed out. Expected: Clerk redirects to sign-in. Navigate to `http://localhost:3000/api/admin/bills-search` while signed out. Expected: 401 or redirect.

- [ ] **Step 3: Commit**

  ```bash
  git add middleware.ts
  git commit -m "chore: update clerk middleware matcher to spec pattern"
  ```

---

## Verification Checklist

Before declaring done, confirm all five spec rules pass:

- [ ] `clerkMiddleware()` used in `middleware.ts` ✓
- [ ] `ClerkProvider` is inside `<body>` in `app/layout.tsx` ✓
- [ ] Imports only from `@clerk/nextjs` or `@clerk/nextjs/server` ✓
- [ ] App Router only (no `_app.tsx`, no `pages/`) ✓
- [ ] `<Show>` used instead of deprecated `<SignedIn>`/`<SignedOut>` ✓
