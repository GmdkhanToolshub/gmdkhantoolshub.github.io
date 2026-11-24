# Payments security checklist (status as of 2026-11-24)
Legend: DONE = implemented and covered by a test or direct check. YOU = needs your action at deployment. OPEN = not done.

| Area | Control | Status |
|---|---|---|
| HTTPS | Cookies are `Secure`; HSTS header sent; API must be served over HTTPS by Cloudflare | DONE in code; YOU: use the https custom domain |
| Authentication | Admin email + password, PBKDF2-SHA256 (100,000 iterations, Workers limit), per-user salt, 12+ character minimum at setup | DONE |
| Brute force | 8 login attempts per IP per minute; account locked 15 minutes after 5 wrong passwords | DONE (tested) |
| Sessions | Random 256-bit token, only its SHA-256 stored, HttpOnly + Secure + SameSite cookie, 8-hour expiry, deleted on logout | DONE (tested) |
| Authorization | Roles owner, finance, viewer enforced on the server for every admin route | DONE (tested) |
| CSRF | Per-session token required on every admin write plus Origin check and CORS allow-list | DONE (tested) |
| Server-side pricing | Price, discount, trial and total computed from the database; client values ignored | DONE (tested) |
| Never trust screenshots | Receipt upload sets "awaiting verification" only; admin must confirm the exact amount to approve | DONE (tested) |
| Webhook security | HMAC-SHA256 signature, constant-time compare, idempotency table, amount and currency must match the order, replay of the same event ignored | DONE for the generic webhook (tested); YOU/DEV: adapt to your provider's scheme |
| Idempotency / double approval | Conditional updates on payment status; second approval returns 409 | DONE (tested) |
| File uploads | 3 MB limit, content sniffed by magic bytes (JPG, PNG, WEBP, PDF), stored privately, served only to signed-in admins with `Content-Security-Policy: sandbox` and `nosniff`, max 5 receipts per order | DONE (tested) |
| XSS | Frontend builds the DOM with `textContent`; API returns JSON with `default-src 'none'` CSP; CSV cells beginning with = + - @ are neutralised | DONE (tested for CSV) |
| SQL injection | All queries use bound parameters; LIKE input escaped | DONE (tested with %) |
| Rate limiting | D1-backed per-IP limits on orders, receipts, coupons, login, setup, order lookup | DONE (tested for orders) |
| Secrets | None in the repository; `.dev.vars` is git-ignored; secrets via `wrangler secret put` | DONE; YOU: set them |
| Card data | Never handled or stored. Card/wallet disabled until a hosted provider is configured | DONE |
| Audit logging | Logins, approvals, rejections, refunds, settings changes, exports, receipt views | DONE (tested) |
| Data encryption | D1 and R2 are encrypted at rest by Cloudflare; no extra application-level encryption | Provider-level only |
| Privacy | Privacy policy section for checkout added; customer order key kept in URL fragment | DONE; YOU: review wording and retention period |
| Refund / terms | Existing Refund, Terms and Subscription pages are linked from checkout | DONE; YOU: confirm they match how you sell |
| Reconciliation | CSV export and dashboard; admin approval requires the received amount | DONE; manual monthly bank reconciliation recommended |
| Backups | D1 export is not scheduled | OPEN: schedule `wrangler d1 export` |
| Admin MFA | Not implemented | OPEN: protect `/admin-payments/` and the admin API routes with Cloudflare Access (free tier) for MFA |
| PCI DSS | No compliance claimed. Using a hosted payment page keeps card data off your servers | n/a |
| Runtime verification | Tests ran on SQLite stand-ins, not on workerd/D1/R2 | OPEN: run a deployed smoke test |
