# Payments end-to-end test report (2026-11-24)

## Method and honest scope
- **Automated:** `npm test` runs 58 checks against the real Worker code (`src/index.js`). The database is SQLite through `node:sqlite` (same SQL dialect as D1) and receipts go to an in-memory file store, because the Cloudflare local runtime (workerd) cannot start on the build machine ("spawn UNKNOWN", blocked by the OS). Result: **58 passed, 0 failed.**
- **Browser:** the static site and the real Worker API were served together (`test/dev-server.mjs`) and driven in a Chromium-based browser through the real pages.
- **Not covered:** real D1/R2/workerd behaviour, a real card gateway or wallet, real bank transfers, real email delivery, Firefox/Safari, real phones.

## Lifecycle checklist from the brief
| # | Step | Result |
|---|---|---|
| 1 | Customer selects a paid product (Pakistan Salary Tax Pack, Rs 2,499) | Pass (browser) |
| 2 | Customer enters details | Pass (browser, validation tested) |
| 3 | Order generated with unique reference | Pass (GM-FD7X5NBR in browser) |
| 4 | Discount calculated correctly | Pass: code WELCOME10 gave Rs 2,249.10; flat and percent coupons, expired, wrong-product and used-up codes tested |
| 5 | Payment method chosen | Pass: bank transfer enabled; card and wallet shown "Not available yet" and refused by the server |
| 6 | Payment submitted | Pass: receipt uploaded with transaction reference; order became "awaiting verification", NOT paid |
| 7 | Administrator verifies | Pass: admin console showed the order, receipt and prefilled amount; approval with a wrong amount refused; correct amount approved |
| 8 | Order status updates | Pass: order paid; customer page switched to "Payment verified" with all four steps complete |
| 9 | Customer confirmation | Pass on the order page. Email confirmation is coded (Resend) but untested |
| 10 | Administrator sees the transaction | Pass: dashboard, order list, search, detail, audit log, CSV export |

## Failure cases
Failed payment event, duplicate webhook delivery, second success event with a new id, wrong webhook amount, bad signature, unknown order, webhook disabled without secret: all pass. Invalid receipts (text file renamed to PNG, oversized, missing transaction number, no token): refused. Incorrect amount at approval: refused. Expired orders: refuse receipts and are swept to "expired". Unauthorized admin access: anonymous, wrong password, lockout, viewer actions, finance refund, missing CSRF token, foreign Origin: all refused. Rate limiting on orders returns 429. Coupon use is counted only when payment is approved.

## Layout and states
- Checkout, order page and admin console have no sideways scroll at 375px width. Subscription checkout shows 14-day trial, Rs 0 due today, next renewal date, recurring amount and an unticked consent box.
- With the committed configuration (no `apiBase`), all three pages say "Online checkout is not switched on yet" and offer the WhatsApp order option. No fake payment form is shown.

## Still to do before real money
Deploy the Worker, run the smoke test on the live Worker, enter your real bank details in the admin console, connect a card or wallet provider if wanted, and enable Cloudflare Access for admin MFA.

## Addendum: reasoning test and certificates (2026-11-24)
- `node test/reasoning.mjs`: 23 checks pass (server scoring, weighting, skipped answers, double submit, wrong token, malformed answers, time limit, answer-free public bank, inactive product, attempt validation, single-use attempt, certificate NOT issued by receipt alone, issued on admin approval and on webhook payment, idempotent issuance, public verification, revocation, 100% coupon, rate limit). `npm test` now runs both suites: 58 + 23 = 81 checks, all passing.
- Puzzle quality: all 50 generated puzzles (20 practice, 30 certified) pass an independent solver that checks the missing piece is uniquely determined, and every puzzle has 8 distinct options.
- Browser run through the real pages: Home page quiz started in place and scored (16 of 20 correct gave 81/100, matching the hand calculation); certified attempt scored on the server (25 of 30 gave 84/100); certificate order placed, receipt uploaded, admin approved, order page showed the certificate link, and the verification page showed "Valid certificate" with the right name, score, level and ID. No sideways scroll at 375px on the test, certificate and Home pages.
- Not covered: the same limits as above (real Cloudflare runtime, real payment), and the certified answer key used in the browser run was the local private key.
