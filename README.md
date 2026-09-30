# Kabivio — website review

A responsive, four-language preview for Marcus Shaqir’s planned mobile truck cabin cleaning business in Frankfurt am Main, Offenbach, Hanau and nearby areas.

## Review the website

Open the GitHub Pages link in this repository’s About section. Use the language selector for German, English, Turkish or Arabic.

Please review mobile usability, text clarity, package selection, animations and the WhatsApp enquiry flow. You can leave feedback in this repository’s Issues.

The form requires the cleaning location’s city, street, five-digit German postal code, and house or company building number. These fields are included in the WhatsApp draft. It also asks whether a power socket is available, a power supply is needed, or the customer is unsure. This answer is required and included in the WhatsApp message addressed to the business contact. Power arrangements are confirmed before the appointment. The visitor chooses whether to send it. No message, booking or payment is created automatically. Prices are provisional planning prices.

This is a pre-launch review version. It does not establish that business registration, insurance, final legal disclosures or appointment availability have been completed. The cabin artwork is an AI-generated illustration, not a customer vehicle.

## Files and hosting

The website is plain HTML, CSS and JavaScript. No build step or API key is required. GitHub Pages serves the main branch from the repository root. All images and fonts are included; no third-party font request is required.

- `index.html`: page layout and content
- `translations.js`: German, English, Turkish and Arabic copy
- `app.js`: language switching and enquiry preparation
- `motion.js`: interactive cabin areas and motion controls
- `style.css` and `motion.css`: layout, responsive styling and animation
- `fonts.css` and `.woff2` files: self-hosted Manrope and Noto Sans Arabic fonts
- `cabin-motion.jpg`: illustrative cabin artwork

Font licenses are included in `manrope-OFL.txt` and `notosansarabic-OFL.txt`. The website respects the device’s reduced-motion preference with animations running automatically otherwise.

Run any static file server in this directory to preview locally. Development dependencies are only used by the regression tests; the published site still has no runtime packages or build step.


## Publishing updates

Keep every website change synchronized with this GitHub repository. A change is complete only after GitHub Pages has deployed it and the public site has been checked. Do not leave completed updates only in a local preview.


## Three-step enquiry
The planner separates package and truck selection, the cleaning address and power availability, and a final editable review. Going back preserves the current entries. Each stage validates its required fields. Package and address edits refresh the estimate and the WhatsApp message. The site only prepares an enquiry; the customer opens WhatsApp and sends the message there. Final price and appointments require separate confirmation.

Before publishing changes to this flow, check all four languages, mobile layouts, required address and power fields, quantity limits, back/edit/reset, and consistency between the review and the prepared WhatsApp message. Never send test enquiries to the business.


## Navigation and privacy safeguards
Fresh visits and reloads start at the top, including old links ending in `#planner` or `#services`. Section links still work after the page opens. Browser Back/Forward preserves its normal behavior and unfinished enquiries when the browser restores the page from memory. Share https://masxshaqir.github.io/kabivio/ without a section fragment.

`navigation.js` runs in the head before anchors can scroll the page. It does not reset the position after the visitor starts interacting. Page lifecycle handlers preserve animation and form observers during back/forward caching. Preferred dates are checked against today's date in Europe/Berlin, including when an enquiry is revalidated.

A restrictive Content Security Policy permits only local scripts, styles, fonts and images (plus the data-URL favicon), blocks network requests from scripts and native form submission, and disables embedded frames/objects. The form stays inert until its JavaScript initializes successfully. Customer text is inserted using textContent and encoded into a fixed-recipient WhatsApp link. No enquiry data is saved to browser storage. A no-referrer policy and noopener links limit information shared when leaving the site.

## Regression tests
Use Node.js 20 or newer and pnpm. Install with `pnpm install --frozen-lockfile --ignore-scripts`, then run `pnpm test`. The lockfile pins the test dependencies. These commands are for development only.

The suite covers 131 cases: all four languages, all three packages and electricity options, truck counts 1/2/20, invalid inputs, past dates, postcode digit normalization, literal rendering of HTML-like notes, review/message consistency, back/edit/reset, clipboard denial/download fallback, reduced-motion behavior, page lifecycle and navigation rules. It does not contact WhatsApp or create bookings.

Before deployment, also test the real browser at 320, 390, 768 and 1280 CSS pixels, confirm fresh links/reloads start at the top, and check internal navigation, keyboard focus, animation, Back/Forward and console errors. Browser/device testing remains necessary; DOM tests do not emulate Safari or visual layout.

See AUDIT.md for the latest review scope, results and limitations.
