# Slate web app: status and backlog

Last updated 2026-11-13. Everything under "Built" is committed on `main`.

## Built
Sign in / sign up (email, Google), onboarding, For You (recommendations, streaming filter fields sent), Discover (rows, search, categories, film details), Collections (`getCollections`), Watch Later, History (edit / remove rating, undo "Not interested"), Friends (requests incl. Sent / cancel, search, friend profile + taste match, Leaderboard), Profile, Insights, Preferences, Letterboxd import, Account (name, password, delete account), footer + consent/analytics.

## Not built yet
- **Apple Sign-In on web** (Firebase OAuth provider flow). Apple-only accounts can't sign in on web today.
- **Notifications** (iOS has a Notifications feature).
- **Public profile / share pages** (iOS `PublicProfileView`, `ShareProfileButton`, deep links). Leaderboard rows for non-friends aren't clickable until this exists.
- **Letterboxd RSS sync / username connect** (CSV import exists).
- **Discover "Explore Slate" strip** and genre rows.
- **Collections:** share-progress cards, franchise icons/colors, un-watching a film (iOS can't either).
- **Account:** avatar upload (Storage rules unchecked), username change (needs `usernames/` claim swap).
- **Public "request account deletion" web page** (Google Play requires one if an Android app ships).
- **TV remote / arrow-key navigation.**
- Sign-in/sign-up screens have no Terms / Privacy links row.
- Privacy Policy wording for analytics and YouTube embeds hasn't been reviewed.
- After cancelling a sent friend request, that person stays hidden from Add-friend search until reload.
- Optional: replace the embedded trailer with a "Watch on YouTube" link.

## Not verified with a real signed-in account
Letterboxd import with a real CSV, Insights, Discover / film dialog, History edit / remove / undo, Watch Later detail, Account page + delete account (use a throwaway account), nav search, footer, row arrows, Collections, Leaderboard, 5-tab nav at 880px. Friends needs two accounts. Responsive pass at tablet / TV widths for Friends, Letterboxd, Watch Later, onboarding, sign-in.

## Backend items to raise (not changed from this repo)
- Orphan `friendRequests` after account deletion: rules let only the sender delete. Wanted: an auth-delete trigger cleaning everything, or a recipient-delete rule.
- Streaming filter (`streaming-filter` branch) not deployed yet; web already sends the fields.
- One-off reconcile of `userStats` counts for users who edited / deleted ratings on iOS before the server-side handling.
- Contact email on the marketing page and the app footer is `slateai09@gmail.com` (says "slateai").

## Product decisions pending
Insights unlock threshold (web 5 vs iOS 20); match-label tiers ("Worth checking" under 60%) need an all-platform decision; marketing "One account, every screen" uses screenshot #5.

## Deploy checklist (user only)
1. Vercel env vars: all 7 `VITE_FIREBASE_*` (incl. `VITE_FIREBASE_MEASUREMENT_ID`).
2. Firebase console > Authentication > Authorized domains: add the production domain.
3. Confirm `friendRequests` composite indexes are deployed (`firestore.indexes.json`, backend repo).
4. Push `main` (decide whether to squash or review first), then smoke-test on the preview URL with a real account.
