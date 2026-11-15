# MVP registration and administrator review

Run `npm run dev`, then open http://localhost:3000/signup.

1. Choose email (Gmail or another address) or an Ethiopian mobile number. Supported mobile formats: `09xxxxxxxx`, `07xxxxxxxx`, `+2519xxxxxxxx`, `+2517xxxxxxxx`, or nine digits beginning with 7/9.
2. Enter the one-time code. Codes expire after ten minutes, lock after five incorrect attempts, and are consumed once. Resends have a 60-second cooldown plus target and request-origin limits.
3. Set a password and complete the profile. The browser receives an opaque, HttpOnly session cookie; only a hash of its random token is stored in SQLite. Password setup requires a separate ten-minute server-issued cookie; a submitted profile ID grants no access.
4. At `/verification`, enter a legal name and residential address, choose Fayda FIN (12 digits), FAN (16 digits), or another government photo ID, then upload the ID and a portrait. JPEG/PNG only, up to 3 MB each. The ID number field retains only its final four characters. Full ID numbers may remain visible in the uploaded document image.
5. An administrator reviews the submission. Pending and rejected users cannot use inbox, saved listings, viewing actions, listing creation, or payment initialization. Rejected users see the review note and can resubmit. Approved users can enter the service.

## Local testing and live delivery

The local `.env.local` uses `AUTH_DELIVERY_MODE=console`. The registration page explicitly displays a **local test code**, and sends no email or SMS. No code is logged to the server console. Console delivery is disabled in production regardless of that setting.

For live delivery, copy the variable names from `.env.example` into your deployment's secret settings:

- Set `AUTH_DELIVERY_MODE=provider`.
- Configure `RESEND_API_KEY` and `AUTH_EMAIL_FROM` using a verified sending domain.
- Configure `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_FROM_NUMBER` using a sender permitted for Ethiopian destinations. Confirm Ethiopia is enabled in Twilio geographic permissions and test on actual destination networks. An API acceptance is not a delivery guarantee.
- Set a stable `IDENTITY_ENCRYPTION_KEY` generated with `openssl rand -hex 32`. Back it up securely: rotating or losing it without re-encrypting documents makes existing images unreadable.
- Set `DATABASE_URL` consistently for the application and Prisma CLI. Example local migration: `DATABASE_URL=file:/absolute/path/to/dev.db npx prisma migrate deploy`.
- Use HTTPS in production; production session cookies require it.
- Only enable `TRUST_PROXY=true` when your reverse proxy overwrites `X-Forwarded-For`. Without a trusted proxy, OTP requests share a conservative global origin limit.

Missing provider credentials cause an explicit delivery error. The app does not silently pretend to have sent a real code. This implementation does not check whether an email mailbox exists in advance; successfully receiving and entering the code proves access. Gmail is supported through email verification and through Google sign-in.

## Administrator setup

No default admin account or password is shipped. Register the administrator's email, verify its code, and set a password. Then the trusted operator runs:

```sh
node --env-file-if-exists=.env.local scripts/grant-admin.mjs admin@example.com
```

The script requires an existing email-verified account. It grants admin access and records the grant in the audit table. Sign in and visit `/admin`.

The dashboard shows account counts, pending/approved identities and listing counts, searchable/paginated users, contact verification status, full user profiles, encrypted document previews, approve/reject actions with required review notes, and decision history. Admin authorization is checked on pages, document requests, and review mutations. Administrators cannot review their own identity.

Document images live encrypted with AES-256-GCM in the SQLite database, outside the public asset directory. The document route permits only the owner or an administrator and returns `private, no-store` responses. Address, identity number suffix, and identity images are not rendered on public profile pages. The optional public avatar URL is separate from the private portrait.

## Fayda scope

This MVP performs **manual document review**. Uploading a Fayda card does not authenticate it against Ethiopia's national identity service. Official authentication requires a separate approved relying-party/eSignet integration: https://www.id.gov.et/authentication . No simulated official verification is performed. Approval indicates an AddisRoom administrator reviewed the supplied documents, not a government validation or broker license check.

Legacy sessions containing profile IDs are no longer accepted. Legacy `verified` flags are cleared by the migration; old accounts must verify their contact and submit identity documents.

## Validation

```sh
node scripts/test-auth.mjs
npx tsc --noEmit
```

The regression suite applies the real migrations to a disposable SQLite database, runs real authentication/identity actions with mocked Next.js request state, and tests Ethiopian number validation, SMS/email OTPs, expiry, lockout, replay, throttling, forged/expired sessions, password setup authorization, encrypted documents and tampering, document authorization, approval gates, rejection/resubmission/approval, audit history, and provider request/error handling. Provider HTTP calls are mocked; live deliverability must be checked with configured accounts.

Browser checks cover signup through identity upload, pending access restrictions, admin access restrictions, private image rendering, rejection/resubmission, approval, and approved access to the inbox.

## Reference design and admin operations

The home/search UI follows the supplied blue-and-white screenshots: centered hero, keyword search, neighborhood/radius, bedrooms/property type, price bounds, a full-width search button, and two-column desktop listing cards. Rent/buy, area bounds, furnished filtering, sorting, and map view remain available. Advanced inputs stay in the form when collapsed; reversed ranges are blocked before submission. Mobile layouts stack fields and contain wide admin tables.

Admin sections:

- `/admin`: account metrics and identity queue.
- `/admin/agents`: approve/revoke a separate staff-reviewed agent badge. Identity must be approved before granting it; it is not a broker license check.
- `/admin/sponsorships`: create, activate, deactivate, or delete sponsor banners. Only one banner can occupy the live slot, enforced by a database unique constraint. Optional URLs require HTTPS. No banner is shown until a sponsor is active.
- `/admin/users`: search profiles and suspend/restore accounts. Suspension revokes existing sessions, blocks password/OTP access, and hides the owner's listings. Administrators cannot suspend admin accounts or change their own access.
- `/admin/listings`: search listings and remove/restore them with a required moderation reason. Removal archives rather than erases the listing, preserving messages and payments. Archived listings are hidden from search, home, saved results, and public detail access. Owners and staff can still inspect them.

Server-provisioned administrators receive super-admin access in this migration. The operator's `grant-admin.mjs` command also provisions super admins. Only super admins can grant/revoke regular admin access through the dashboard. Super-admin changes remain operator-only. Every account, badge, sponsor, and moderation action is audited.

The regression suite also checks role escalation restrictions, session revocation on suspension, sponsor lifecycle and URL validation, single-live-banner behavior, broker badge eligibility, listing archive/restore, and combined search filters. Browser tests cover sponsorship publication/deactivation, badge controls, user suspension/restoration, listing removal/restoration, mobile overflow, filter validation, combined results, and Amharic rendering. Temporary fixtures were removed after testing.


## Email-first signup and Google sign-in

The signup page starts with **full name and email address**. It sends a six-digit verification code, then asks the user to enter it before creating a password. An Ethiopian SMS alternative remains available. The code-entry screen supports requesting a replacement after a 60-second cooldown. Local test mode explicitly says that no email was sent.

Both signup and login also offer **Continue with Google**. To enable it:

1. Create a Google Cloud OAuth client of type **Web application** and configure its consent screen.
2. Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env.local` or deployment secrets.
3. Register the exact authorized callback URI `http://localhost:3000/api/auth/google/callback` for local development. For production, use your HTTPS domain followed by `/api/auth/google/callback`.
4. Set `NEXT_PUBLIC_APP_URL` to the same application origin and restart the server (rebuild for deployment).
5. For a Google app in testing mode, add the intended test users in Google Cloud.

Google sign-in uses an authorization code with PKCE, single-use state bound to an HttpOnly cookie, and nonce verification. Google's official `google-auth-library` validates the ID token's signature, issuer, audience, and expiration. The account is stored using Google's stable `sub` identifier. Google-authoritative Gmail and verified Workspace emails can link to an existing account with the same email; otherwise the ordinary email-code flow must prove current mailbox access. Google sign-in does not grant admin access or identity approval, and suspended accounts are rejected. Google users can later set a local password by proving their email through the email-code flow.

A Gmail/Workspace Google sign-in already verifies email ownership, so it does not ask for a second emailed code. The separate name-and-email registration path always requires the emailed code. Google cancellation, invalid state/tokens, and missing configuration return a clear retry/email-signup option. Real Google sign-in and real email delivery require external credentials and are not simulated by local test mode.

The regression tests mock Google's token exchange/verification boundary (no live Google calls), checking PKCE parameters, state/nonce mismatch, replay, invalid-token handling, third-party email restrictions, suspension, new accounts, and existing-account linking. Complete a live sign-in with a Google Cloud test user after configuring credentials.

Google references: https://developers.google.com/identity/openid-connect/openid-connect and https://developers.google.com/identity/gsi/web/guides/verify-google-id-token .
