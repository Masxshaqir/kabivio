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

Run any static file server in this directory to preview locally.


## Publishing updates

Keep every website change synchronized with this GitHub repository. A change is complete only after GitHub Pages has deployed it and the public site has been checked. Do not leave completed updates only in a local preview.


## Three-step enquiry
The planner separates package and truck selection, the cleaning address and power availability, and a final editable review. Going back preserves the current entries. Each stage validates its required fields. Package and address edits refresh the estimate and the WhatsApp message. The site only prepares an enquiry; the customer opens WhatsApp and sends the message there. Final price and appointments require separate confirmation.

Before publishing changes to this flow, check all four languages, mobile layouts, required address and power fields, quantity limits, back/edit/reset, and consistency between the review and the prepared WhatsApp message. Never send test enquiries to the business.
