# backpropml.github.io

Marketing site for **Backprop** - ML infrastructure.

Plain HTML and CSS. No build step, no bundler, no framework, no third-party code.
Served by GitHub Pages from the repo root on `main`.

## Files

| Path              | What it is                                                       |
| ----------------- | ---------------------------------------------------------------- |
| `index.html`      | Homepage: positioning, capabilities, the offer, approach, team, contact |
| `assessment.html` | Full scope of the production readiness assessment                 |
| `404.html`        | Not-found page (GitHub Pages serves this automatically)           |
| `styles.css`      | All styling. Light and dark via `prefers-color-scheme`            |
| `motion.js`       | Presentation only - see below. Safe to delete                      |
| `.nojekyll`       | Skips Jekyll processing                                           |
| `CLAUDE.md`       | Content and engineering constraints for anyone editing the site   |

## `motion.js`

The only JavaScript on the site. First-party, no dependencies, no storage, no
network, nothing that writes content. It drives:

- **Reveals** - sections and list items rise in as they enter the viewport.
- **Pointer** - writes `--mx` / `--my` so the CSS bloom follows the cursor, and
  `--rx` / `--ry` for the few-degree card tilt.
- **Scroll rails** - the top progress bar, the timeline's accent fill, and the
  sticky-header shadow.
- **Count-up** - replays the `$5,000` figure. The real value is in the HTML.
- **Scroll-spy** - marks the nav pill for the section in view.

The hero pipeline diagram is pure CSS/SVG animation and needs none of this.

### Two guarantees, both load-bearing

1. **Nothing is hidden unless this file runs.** The reveal rules are scoped to
   `html.js`, and that class is set on the script's first line. A blocked,
   failed or deleted script means no hiding - every word stays on the page.
2. **Above-the-fold copy never waits on a callback.** Content already on
   screen is revealed by direct measurement, not by IntersectionObserver.
   This matters: a tab opened in the background is not laid out, so every rect
   reads as zero - deciding from those numbers would file the whole page as
   "off screen" and strand it. `prime()` refuses to run before layout exists
   and retries on timers, `visibilitychange` and `pageshow`.

`prefers-reduced-motion` switches everything off in both layers: the listeners
are never attached, reveals fire immediately, and the CSS block at the end of
`styles.css` neutralizes every animation and transition.

**Delete `motion.js` and its `<script>` tags and the site loses its motion but
nothing else** - same content, same layout, same navigation.

## Local preview

```sh
python -m http.server 8000
# then open http://localhost:8000
```

Any static server works. There is nothing to compile.

## Before launch

Search both HTML files for `[[PLACEHOLDER` - every unverified claim is marked
inline and rendered in a yellow highlight so it cannot ship by accident.

The contact address `hello@backpropml.com` must exist and deliver before this
goes live. It appears in `index.html`, `assessment.html` and `404.html`.

## Custom domain

To serve from `backpropml.com` instead of `backpropml.github.io`:

1. Point DNS at GitHub Pages (four `A` records for the apex, or a `CNAME` for `www`).
2. Set the custom domain in **Settings → Pages** - GitHub writes the `CNAME` file itself.
3. Update the `<link rel="canonical">` and `og:url` tags in `index.html` and `assessment.html`.

Do not add a `CNAME` file before DNS resolves; it takes the site offline until it does.

## Content rules

Enforced on every change - see `CLAUDE.md`:

- No invented metrics, client names, logos or testimonials.
- Prior work at Google / Oxford / The Home Depot / Afiniti / Noon Academy is
  **employment**, labelled as such. Never implied to be Backprop client work.
- Positioning line is "ML infrastructure + research" (infra leads). Short form
  "ML infrastructure" is fine in footers. Never "AI consulting".
- Responsive to 375px, visible keyboard focus, `prefers-reduced-motion` respected.
