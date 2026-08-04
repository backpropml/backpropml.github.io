# Backprop marketing site

Static site served by GitHub Pages from the repo root on `main`. The org is
`backpropml`, so the repo root *is* the published root - files must live here,
not in a subdirectory.

`index.html` · `assessment.html` · `404.html` · `styles.css` · `motion.js` · `.nojekyll`

## Hard constraints
- No build step, no bundler, no framework, no third-party code.
  Anything requiring a build needs a GitHub Actions workflow - don't.
- JavaScript is **first-party only**: `motion.js`, nothing else. No CDN, no
  external scripts, no localStorage, no network calls.
- `motion.js` is presentation only, and two properties are load-bearing:
  content is hidden *only* behind the `js` class it sets on `<html>`, and
  above-the-fold content never waits on IntersectionObserver (a background tab
  is never laid out, so every rect reads zero). Don't regress either.
- Responsive to 375px, keyboard focus visible, `prefers-reduced-motion`
  respected - every animation must be switched off by the block at the end of
  `styles.css`.

## Content rules
- Never invent metrics, percentages, client names, logos or testimonials.
- Prior work at Google / Afiniti / The Home Depot / Oxford / Noon Academy is
  EMPLOYMENT. Label it as such. Never imply those were Backprop clients.
- Positioning line is **"ML infrastructure + research"** - infra leads,
  because it anchors the paid entry offer. Short form "ML infrastructure" is
  fine in footers. Never "AI consulting".
- Anything unverified goes in as an obvious `[[PLACEHOLDER]]` using the `.ph`
  class, which renders highlighted so it cannot ship by accident.
  Currently zero. Keep it that way.
- Never use "prediction" / "predict" to describe what a model outputs - use
  "inference" instead. Kaggle competition names and URLs are exempt, they're
  external facts, not our wording.

## Deliberate decisions - easy to undo by accident
- **Never state where an individual lives or works from.** Describe the firm's
  coverage instead: Backprop LLC is a US company working across US, UK and
  Pakistan time zones, roughly 04:00-17:00 UTC. This is intentional and not an
  oversight.
- **Never assign Mohibullah an engineering seniority level** - not "senior",
  not "junior". His credential is the Kaggle record; lead with the ranks
  (3/1,950 gold, 182/3,805 silver, 161/1,899 bronze). Equally, do not claim
  both principals are senior engineers.
- Registered entity is **Backprop LLC**.
- `hello@backpropml.com` is the primary CTA and appears 9 times. It must stay
  live; the two personal addresses appear once each in the team bios.
