# Website audit — 30 September 2026

Scope: the static Kabivio website, its local assets, four translations, enquiry flow and publishing configuration. No backend, account system or payment processing exists in this project.

## Changes
- Fresh links/reloads now start at the hero even when an old shared URL contains a section fragment. Internal navigation and browser history continue to work. Scroll reset stops once the visitor interacts.
- Cached pages retain the observers/tools needed by the booking controls, interactive cabin and reveal animations when returning through browser Back/Forward.
- Past preferred dates are rejected, with localized errors and a date minimum based on Europe/Berlin. Today's date and an omitted preference are accepted.
- A restrictive meta CSP blocks unexpected scripts/resources and native form submissions. The planner is inert until initialization succeeds, so a script failure cannot fall back to submitting addresses in a GET URL. A visible no-JavaScript contact fallback is included.
- Referrer policy is no-referrer. Existing text-only rendering, fixed WhatsApp recipient and encoded message construction were verified. Package radios now reference their validation error.
- Added repeatable regression tests, pinned test-only dependencies and a lockfile.

## Validation
- 131 DOM/unit tests passed (0 failures), including 108 full combinations of language/package/electricity/count.
- JavaScript syntax checks passed for all four runtime scripts.
- Four languages at 320, 390, 768 and 1280 CSS-pixel widths: no horizontal page overflow or broken images observed. Representative mobile and desktop layouts reviewed visually.
- Local Chrome and the in-app browser: initial section URL, reload from a scrolled page, internal links, package selection, validation, review and language switching checked.
- Chrome Back/Forward preserved a partially completed form; the cabin controls and translations still worked after return. Reload returned to scrollY 0.
- Real-browser form checks: missing required address/power fields, past date, valid future date, literal HTML-like notes, 2 × Intensive = EUR 298 and exact WhatsApp draft encoding. Keyboard tab focus remained visible.
- No application warnings/errors or CSP violations observed in tested browser sessions.
- Static checks found no duplicate IDs, missing referenced assets, broken in-page targets, missing translation keys, unsafe new-tab links or matches for common credential patterns in website source.
- npm advisory audit reported 0 known vulnerabilities across 39 development dependencies; there are 0 production dependencies. Audit date: 30 September 2026.

## Boundaries and remaining launch work
This is a point-in-time code and browser review, not a guarantee that every possible defect or vulnerability has been eliminated. Responsive testing used desktop browser viewports, not a physical iPhone/Safari or a screen reader. Actual WhatsApp sending and mobile-app handoff were not performed; tests verified the destination and prepared message without sending enquiries. Copy behavior was tested with a clipboard stub; OS permission-dependent clipboard behavior can vary.

GitHub Pages controls HTTP response headers. Meta CSP cannot supply frame-ancestors or replace a full server-header configuration; this audit does not claim server-level anti-framing, account-security or penetration-test coverage. No invasive tests were run against GitHub or WhatsApp.

The website remains a pre-launch review version (noindex). Business registration, insurance, final legal/privacy details and actual appointment availability still require the owner's completion. This review does not change those business facts.

## Technical references
- [MDN: CSP form-action](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/form-action)
- [MDN: CSP style-src](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/style-src)
- [Chrome: back/forward cache lifecycle](https://web.dev/articles/bfcache)
