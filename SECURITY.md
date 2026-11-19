# Security policy

This repository is the source of the static website https://gmtoolshub.com/ (GM AI Tools HUB).
The site has no database, login or admin panel. Its tools run in the visitor's browser.

## Reporting a vulnerability or a scam

Please email asmarkniazi@gmail.com with:
- the page address or the account/number involved,
- what you saw, and screenshots if you can.

Please do not publish details before the problem is fixed. The public contact file is at
https://gmtoolshub.com/.well-known/security.txt and the safety guide is at
https://gmtoolshub.com/security/.

## What is protected

- No secrets are stored in the repository. API keys live in GitHub Actions secrets.
- Every page ships a Content-Security-Policy, a strict referrer policy and an anti-framing guard.
- Third-party code is limited to Google AdSense and Google Analytics (after consent).
