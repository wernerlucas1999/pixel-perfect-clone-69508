# Firmaway · Espresso — Design System

A brand + UI design system derived from the **Espresso** deck (May 2026). It captures Firmaway's color, typography, spacing, the asterisk/starburst motif, the wordmark, and the repeatable slide + product components so any surface — slides, web, product — draws from one source of truth.

## Sources

- `uploads/firmaway-tokens.json` — the original W3C-style design-token export (core + derived colors, type scale, spacing, radii, layout, component notes, verified contrast pairings).
- `uploads/firmaway-design-system.html` — the original single-file reference page the system was built from.
- `assets/firmaway-logo.png` + `firmaway-logo-light.png`, `firmaway-monogram.png` + `firmaway-monogram-light.png` — the **official Firmaway logos** (provided; trimmed to content on transparent grounds).
- `Firmaway Design System.dc.html` — a polished, interactive rebuild of that reference page (click-to-copy swatches, bilingual samples).

No production codebase or Figma file was provided; the deck-derived token export + reference page are the ground truth.

## Company / product context

Firmaway helps entrepreneurs and professionals in Latin America **cobrar, vender e invertir en el exterior** (get paid, sell, and invest abroad) — opening and operating a U.S. LLC, international accounts, and global collections without local bureaucracy. Copy runs primarily in **Spanish**, with **Portuguese** for the Brazil market. The Espresso deck is an internal monthly product/news update ("Novedades del mes").

---

## CONTENT FUNDAMENTALS

- **Languages:** Spanish first (rioplatense — "abrí", "operá", "mantené"), Portuguese for Brazil. Many surfaces show ES · PT side by side.
- **Tone:** Direct, plainspoken, reassuring. Sells *freedom from friction* — "más libres y simples los negocios". Benefit-led, not feature-led.
- **Voice:** Talks to the reader ("tu negocio"), collective "we" for the company. Confident, not hypey.
- **Casing:** Sentence case for body and titles; UPPERCASE only for eyebrows, captions/meta, and badge labels (with +2% tracking).
- **Emphasis:** Bold weight (700) on the key words inside a sentence — **never color** — so body copy stays readable.
- **Emoji:** Not used. The asterisk motif carries all the "spark."
- **Numbers/meta:** Terse, e.g. `07 — Mayo · Ezequiel`. Thousands use the ES/PT dot separator (`1.284`).

Example body: *"Firmaway ayuda a emprendedores y profesionales que buscan **cobrar**, **vender** e **invertir** en el exterior a liberarse de la burocracia local."*

Example accent: *"Hacemos más libres y simples los negocios." · "Tornamos os negócios mais livres e simples."*

---

## VISUAL FOUNDATIONS

- **Palette:** 5 core values. **Coral #F15A2F** leads (header bars, accents, floor blocks). **Charcoal-navy #31353E** anchors (body text, dividers, dark slides). **Cream #FEF1E0** is the room everything sits in (dominant background). **White** and **Ink #111317** belong to the line-art illustrations. Derived tints/shades (coral-700/300/100, navy-700/muted, cream-200, border) exist only for UI states.
- **Contrast is deliberate.** The palette is mid-toned so pairings matter: navy-on-cream (11:1, AAA) and white-on-navy (12.3:1, AAA) carry all text; white-on-coral (3.4:1) and coral-on-cream (3.0:1) are **large/bold only** — never body.
- **Type:** One family — **Raleway**. Weight + tracking create the condensed feel: display/H1 at 800–900 with −2 to −3% tracking; body at 400/1.6; accent phrases in italic 600 coral. (Raleway is normal-width; for a true narrow cut, pair a condensed sibling like Archivo Narrow for display and keep body on Raleway.)
- **Spacing:** 8-point rhythm (4 for fine tuning). Slides are a 1920×1080 (16:9) frame, ~5–6% safe margin each side, header-bar ≈68px, illustration/text split ≈45/55 flipped L↔R between slides for rhythm, body measure ~60ch.
- **Backgrounds:** Flat cream fields; **no gradients**, no photography, no texture. Full-bleed coral or navy blocks act as chapter breaks and "floor" bands.
- **Imagery:** Hand-drawn-feel **line-art illustrations** — ink-black outlines, flat coral/white/navy fills (e.g. the espresso cup). No photos.
- **Corners & cards:** Radii are restrained — `--r-md` (8px) for cards/demos, `--r-sm` (4px) for chips/notes, `--r-pill` for badges. Cards = white (or cream-200) surface + 1px `--border` hairline; shadows are used sparingly (a soft lift only on interactive hover, e.g. swatches).
- **Borders:** 1px `--fw-border` (#E4D3BE) hairlines on cream; dashed coral for layout/safe-margin guides.
- **Hover:** subtle lift (translateY −3px) + soft shadow on cards; links and nav shift to coral. **Press:** coral-700.
- **Animation:** minimal — short (.12–.2s) ease transitions, respects `prefers-reduced-motion`. No bounces.
- **Transparency/blur:** only the sticky topbar (cream @ 88% + 8px blur). Otherwise flat.

---

## ICONOGRAPHY

- **The signature mark is the six-arm asterisk / starburst.** It is the brand's one icon — used solo in header bars and cover corners, or clustered and scaled as ambient decoration. Ink-black is primary; coral for energy on cream; cream on navy; a **ghost coral @ ~12% opacity** works as a watermark. It lives as an inline SVG `<symbol id="fw-asterisk">` (see `assets/asterisk.svg` and the `Asterisk` component).
- **No general icon font** (no Lucide/Heroicons/Material) is defined by the source — the brand deliberately runs on the single asterisk plus type. If a product surface needs a utility icon set later, add one and document it here as an intentional addition.
- **Emoji / unicode icons:** not used.
- **Logo / wordmark:** The **official Firmaway logo** is provided in four bundled PNGs (transparent ground) via the `Logo` component — two lockups × two tones:
  - `full` — the horizontal `Firmaway.` wordmark; `monogram` — the compact `Fw.` mark. Both carry the tri-tone tab (coral / navy / cream segments) and the **coral period**.
  - `dark` tone = navy artwork for light/cream surfaces; `light` tone = cream artwork for navy/dark surfaces.
  - Files: `assets/firmaway-logo.png`, `firmaway-logo-light.png`, `firmaway-monogram.png`, `firmaway-monogram-light.png`.
  For inline, freely-scalable type, the typographic `Wordmark` component still exists (cream via `onDark`).

---

## Index / manifest

- `styles.css` — global entry (import this). `@import`s everything below.
- `tokens/` — `colors.css`, `typography.css`, `spacing.css`, `radii.css`, `fonts.css`.
- `guidelines/` — foundation specimen cards (Colors, Type, Spacing, Brand).
- `components/`
  - `brand/` — **Logo**, **Wordmark**, **Asterisk**
  - `content/` — **HeaderBar**, **BulletBlock**, **SectionDivider**
  - `data/` — **Badge**, **DataTable**
- `ui_kits/slides/` — sample Espresso slides (Title, Divider, Content).
- `assets/` — `asterisk.svg`, plus the four official logo PNGs (`firmaway-logo[-light].png`, `firmaway-monogram[-light].png`).
- `SKILL.md` — Agent-Skill wrapper for use in Claude Code.
- `Firmaway Design System.dc.html` — interactive reference page.

### Intentional additions
- **DataTable** and **Badge** extend the deck's inventory toward product UI (the deck only implied tables/status). Kept strictly on-palette; flag if you'd rather scope the system to slides only.

## Caveats
- **Fonts** are served from Google Fonts (Raleway), not self-hosted binaries. Drop `.woff2` files into `assets/fonts/` and swap `tokens/fonts.css` to self-host.
- The **official logos** are now included (full wordmark + `Fw.` monogram, each in dark & light tone); the espresso-cup illustration and asterisk are still reproduced as inline SVG in the brand's style, since no source vector art was provided for those.
