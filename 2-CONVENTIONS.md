# 2 — Conventions and tags

Rule numbers (e.g. **rule 9**) refer to the checker in `check/rules/`. "Error" fails CI; "warn" is reported but passes. The AI review rule ids (`ai-*`) refer to `check/ai/rules/`.

Contents: [Architecture](#1-architecture) · [Editables](#2-editable-elements) · [Keys](#3-keys) · [Sections](#4-sections) · [Links & roles](#5-links-and-roles) · [Chrome](#6-navbar-and-footer-chrome) · [Socials](#7-socials) · [Brand tokens](#8-brand-and-colour-tokens) · [Forms](#9-forms) · [Maps](#10-maps) · [Carousels](#11-carousels) · [Other modes](#12-video-icons-multi-state-scheduling) · [Reserved](#13-reserved-namespace-never-author) · [Plumbing](#14-plumbing) · [Rule index](#15-rule-index)

---

## 1. Architecture

From `@ohhwells/conventions` (installed in the starter under `node_modules/@ohhwells/conventions/`, loaded by its `CLAUDE.md`):

- **Section components receive content as typed props. They never fetch it, never import it, never hardcode it.** Literal display text, image URLs or link targets inside JSX belong in a content file.
- Content: one file per page in `src/content/<page>.ts`. Each section entry is `{ layout: '<key>' as const, content: { … } satisfies <LayoutContent> }`. The page resolves `XLayouts[content.x.layout].component` and renders it with `content` and a `sectionId`.
- Sections: `src/components/sections/<Type>/` with `<Type>.types.ts` (shared fields), `index.ts` (the layout registry, `{ key: { component, defaults } }`), and `layouts/<TypeLayout>/` holding `.tsx`, `.types.ts` (extends the shared type, never duplicates its fields), `.defaults.ts`, `.styles.css`.
- Layout keys come from `node_modules/@ohhwells/conventions/templates/layout-archetypes.md`. Do not invent keys. Shared fields of an archetype must stay as defined; if a layout needs more (a CTA, an image), add them as **optional** fields on the layout's own type, which is what the starter's `CTACentered` does.
- **Start a new section from the starter's own sections** (`starter/src/components/sections/*` in this repo, or the same folder in your copy): they carry every tag this document requires. The package's `templates/reference-layouts/` are structure-only: no `data-ohw-*` attributes, no `sectionId` prop, raw `<img>`. If you copy one, you tag it from scratch following §2–§5. (The `ohhwells-scaffold` CLI mentioned in that package's docs is not shipped in version 1.0.2.)
- Adding a section to a page whose content type lives in `src/types/content.ts`: extend that page's type with a `{ layout, content }` entry and add the data in `src/content/<page>.ts`; the page passes `content` and a `sectionId`.
- App Router only (`src/app/`). No `pages/`.
- No hardcoded colours or font names where a token exists (see §8).

---

## 2. Editable elements

Both attributes on the **same element** (**rule 1**, error; a key applied through a conditional spread is a warn — it is unkeyed on the falsy branch).

```tsx
<h1 data-ohw-editable="text" data-ohw-key="hero-headline" data-ohw-max-length="80">{content.headline}</h1>
```

Modes the bridge understands (**rule 3**: anything else is an error and is coerced to rich text at runtime):

| `data-ohw-editable` | Put it on | What the owner / AI can do |
|---|---|---|
| `text` | any text element | rewrite with inline formatting (bold, italic, alignment, lists) |
| `plain` | any text element | rewrite text only; saves `innerText` |
| `image` | `<img>` / Next `<Image>` | replace `src` |
| `bg-image` | a container styled with `backgroundImage` | replace the background URL |
| `video` | `<video>` | replace `src`; autoplay/mute persist under derived keys `<key>__ohw_autoplay` / `<key>__ohw_muted` |
| `icon` | a `<span>` wrapping an inline SVG or glyph | swap the glyph (sized to the slot, colour via `currentColor`) |
| `map` | a Google-Maps `<iframe>` + `data-ohw-map-query` | rewrite the address (§10) |
| `form` | `<form>` | field/success editing through the form toolbar (§9) |
| `link` | — | accepted by the bridge, but links are authored with `data-ohw-href-key` (§5), not this mode |

Guidance:

- `text` for headlines, subheads and body copy. `plain` for single-word micro-labels (eyebrows, names, roles) where pasted formatting would break the layout. Link labels must be `text` (§5). (`ai-mode-choice`, info.)
- `data-ohw-max-length="N"` shows a live counter in the editor. Headlines 60–80, subheads 120–160, body: omit.
- **Array-rendered content** (paragraphs split from one string, mapped list items): tag the **wrapper**, not each child. See `AboutSplit.tsx` (`about-body`).
- **Never nest an editable inside a `text` or `plain` editable** (**rule 4**, error): the outer one writes `innerHTML` and wipes the inner one. A `bg-image` or `image` container holding editable text is fine.
- **Key every image** (**rule 5**, warn): an unkeyed `<img>`/`<Image>` is invisible to the AI and unavailable to generated sections. Images inside an `image`/`bg-image`/`icon` editable are exempt.
- Do not rely on inline `style` on the editable element for text content; the editor saves and restores `innerHTML`. CSS classes are fine. Inline `text-align` **inside** an editable is a special case: the owner's own toolbar alignment is stored that way, and it deliberately outranks anything the style store writes above it (whoever aligned last wins). So an AI alignment ask CLEARS the inline `text-align` under the nodes it targets, as a one-time content edit. Align text with a class, not an inline style inside an editable, or a prompt may strip it.
- Editables the bridge owns inside a React component that re-renders (state, timers, animation frames) get reset by React. Memoize the element (`useMemo`) or keep it out of the re-rendering subtree. (`ai-rerender-wipes-editables`, warn.)

---

## 3. Keys

- kebab-case (**rule 2**, warn otherwise). Scheme: `{section}-{field}`; list items `{section}-item-{i}-{field}` (`services-item-${i}-title`).
- **Stored content is one flat map per site, keyed by `data-ohw-key`.** There is no per-page scoping. Two elements with the same key, on the same page or on different pages, always show the same stored value; editing one edits the other. So keys must be **unique across the whole site** (**rule 2**, error). The one deliberate exception: the desktop navbar and the mobile drawer share their keys so both stay in step, and the checker excuses duplicates when both files are chrome (§6).
- **Rule 2 only compares literal keys.** A computed key (`` `${sectionId}-title` ``) is skipped as "unique by construction". That is true only if you make it true: the checker cannot tell you that a section component with **literal** keys (`services-item-${i}-title`) rendered on two pages puts both placements on one stored value.
- **A section component placed on more than one page** therefore has to choose: derive every key (and `ohwKey`) from the `sectionId` prop (`` `${sectionId}-item-${i}-title` ``) so each placement is edited independently, or keep literal keys only when both placements are meant to be the same content. Decide it; do not inherit it. `{section}` in the scheme above means the placement id in the first case and the section type in the second.
- **Stable forever.** Renaming a key, href-key or section id orphans every saved owner edit under the old name and the live site reverts to template defaults for it. Treat any rename as a data-loss event. (`ai-key-rename-data-loss`, warn.)
- **Dynamic routes** (**rule 22**, error): a file under `[slug]/` renders once per URL but content is stored per key. Every `data-ohw-key`, `data-ohw-href-key`, `data-ohw-section`, `ohwKey` and `sectionId` in such a file must be an expression that mentions the route param (`team-bio-${member.slug}-name`). A literal or an index-only key (`${i}`) is one shared value across every page of the route. Shared components used by dynamic pages must derive their keys from the `sectionId` prop rather than hardcoding a prefix.
- Never author keys starting with `__ohw_` (**rule 17**, error).

---

## 4. Sections

Every top-level section root carries both attributes (**rule 9**: missing label is a warn; non-kebab id is a warn):

```tsx
<section data-ohw-section={sectionId} data-ohw-section-label="Services">
```

- The attribute is `data-ohw-section`. `data-ohw-section-container` is a different, bridge-injected attribute; never write it.
- Ids are the anchors for section-scoped prompts, generate/delete/style targeting, reorder and style overrides. Two pages reporting the same id are **one section** to the editor: styling either restyles both.
- Therefore a section component takes a **`sectionId` prop** and each page passes a unique one (`<Hero sectionId="home-hero" …/>`). **Rule 9** errors when: the same `sectionId="literal"` is passed on two or more pages; a component under `sections/`, `layout/`, `site/` or `ui/` hardcodes `data-ohw-section="x"` and is rendered by two or more pages; or it falls back with `sectionId ?? 'x'` and two or more pages pass nothing.
- Header and footer sections are named **exactly** `navbar` and `footer` (**rule 10**, error otherwise). They are shared site-wide on purpose, are undeletable, and survive whole-page AI generation. `global-navbar`/`global-footer` are tolerated by the id-collision check only; use the exact names.
- **Every editable sits inside a section** (**rule 11**, warn; checked in `page.tsx` and `layout.tsx`, where "no section ancestor in this file" means none at all). An editable outside any `data-ohw-section` silently widens every prompt on it to whole-page scope. A landmark (`header`/`nav`/`footer`/`aside`) or a component receiving a `sectionId=` prop counts as a section root.
- Labels are what the owner sees in the section list and what the model receives as the section name. Missing label ⇒ title-cased id. Two placements of the same layout may share a label ("Team" on both pages); only the ids must differ. One section per region a user would point at and say "restyle that"; no ids on trivial wrappers. (`ai-section-granularity`, info.)
- Section soft-delete, order and duplication (`__ohw_section_order`, `data-ohw-section-removed`, `data-ohw-instance`, `::<instanceId>` key suffixes) are bridge-managed. Author nothing.
- **Repeated items** (cards, pricing tiers, FAQ rows, team members, feature lists) can be added and removed by prompt without regenerating the section (bridge ≥ 0.1.136). The bridge finds a group structurally — no extra markup — when: (a) each item is one wrapper element, all siblings under one parent, same tag and same **first** class token (a state modifier as a later token, like `plan-card plan-card--featured`, is fine); (b) every item's keys carry an item identifier as its own segment in the same position — a number (`pricing-plan-1-name`, `pricing-plan-2-name`; 0- or 1-based both work, and an href key numbered differently from the content keys is tolerated as long as every item follows the same scheme), or a slug (`class-foundation-name`, `class-sculpt-name`) as long as the slug is not the key's LAST segment (a trailing varying segment reads as different slots of one thing, `founder-name`/`founder-role`, and never groups) — numeric indexing remains the convention for new templates, slug detection exists for older ones; (c) each item holds at least one editable. A lone item still counts when it carries the `card` class and its key has exactly one numeric segment. A name/role pair inside one item is not a group. New items are DOM clones of an existing item rekeyed to the next number (a slug-indexed clone gets a synthetic `x<n>` segment in the slug's place), so per-index styling (`:nth-child(2)`) applies by position — the intended "template look". Items inside a carousel are never groups. State lives in `__ohw_items`; the bridge stamps `data-ohw-item`, `data-ohw-item-clone`, `data-ohw-item-removed` and `data-ohw-item-surface` (rule 17: never author them). The `card` class (rule 15) also makes the item the target of the "card background colour" style.

---

## 5. Links and roles

Destination on the anchor, label on an inner span, label mode **`text`**:

```tsx
<Link href={item.href} data-ohw-href-key={`nav-${i}-href`}>
  <span data-ohw-editable="text" data-ohw-key={`nav-${i}-label`}>{item.label}</span>
</Link>
```

- A `plain` label under an href-keyed link is an error (**rule 6**): the bridge only recognises a link as a nav item when its label is `text`. Logo roots and social links are exempt (they carry no text label).
- **Tag every nav and footer menu item**, not just the CTA (**rule 7**, warn, chrome files): a link without `data-ohw-href-key` cannot be seen or rewired by the AI and cannot be reordered. Pure `href="#…"` anchors, logos and socials are exempt.
- Two classes of link, decided by what the element is:
  - **Reorderable items** — nav menu links, footer column links (inside `data-ohw-footer-col`), socials. Href-key only, **no role**; a role would break reorder.
  - **Fixed links** — section CTAs, pricing buttons, legal links, back-to-top, inline body links, tel/mailto contact links. Trio: `data-ohw-href-key` + `data-ohw-role="button"` + `data-ohw-drag-disabled="true"`. Without the role the bridge gives the link drag/duplicate/delete machinery. **Rule 23** (error) flags href-keyed links with no role in non-chrome files; inside chrome files the call is the AI review's (`ai-link-affordance-intent`, warn).
- The starter's `Button` renders the trio for you: `<Button href={content.ctaHref} ohwKey="hero-cta">` ⇒ `hero-cta-href` on the link, `data-ohw-role="button"`, `data-ohw-drag-disabled="true"`, and `<span data-ohw-editable="text" data-ohw-key="hero-cta-label">`. Omit `ohwKey` for submit/onClick buttons.
- Header CTA: `data-ohw-role="navbar-button"` + `data-ohw-drag-disabled="true"` (**rule 8** warns when the pair is incomplete). Logo root: `data-ohw-role="logo"`.
- **At least one `button`/`navbar-button` role must exist in the template** (**rule 8**, error): `update_style` alignment finds the button's row through it and generated sections derive the template's button radius from it. No `logo` role is a warn. Roles emitted from an object spread (`{'data-ohw-role': 'button'}`) count.
- A button's `data-ohw-href-key` is also its identity in the per-button style record (`__ohw_button_assignments`): both the editor's button Style panel and a prompt ("change this button to secondary") move that one button between the site's three looks — primary, secondary, ghost — by that key. A CTA with no href-key can be styled by neither. Prompt-driven variant changes need bridge **0.1.149**.
- Generated hrefs are allowlisted to the site's real page paths and `#anchors`; internal links should use real routes.

---

## 6. Navbar and footer chrome

"Chrome files" to the checker: anything under `components/layout/` or a file named `Navbar|Nav|MobileMenu|MobileNav|Footer|Menu.tsx`.

- Keep the starter's markup hooks exactly as shipped; the bridge reads all of them: `data-ohw-nav-root`, `data-ohw-nav-container`, `data-ohw-nav-group`, `data-ohw-nav-children`, `data-ohw-nav-caret`, `data-ohw-nav-open`, `data-ohw-nav-drawer` (mobile), `data-ohw-footer-links`, `data-ohw-footer-col="<n>"`, `data-ohw-socials-row`, `data-ohw-wordmark`. `NavDropdownTemplate` (a hidden `data-ohw-nav-dropdown-template` group) is the clone source the bridge copies when the owner creates a dropdown; keep it in both the navbar and the mobile drawer.
- Desktop navbar and mobile drawer render the same keys (`nav-${i}-href` / `nav-${i}-label`, `nav-cta-href` / `nav-cta-label`) on purpose; both carry `data-ohw-section="navbar"`.
- Logo (`Wordmark.tsx`): anchor with `data-ohw-role="logo"` + `data-ohw-href-key="nav-logo-href"` (+ `data-ohw-placeholder=""` while the name is a placeholder), containing `<img data-ohw-editable="image" data-ohw-key="nav-logo-image">` and `<span data-ohw-editable="plain" data-ohw-key="nav-logo-text" data-ohw-wordmark="">`. Footer mirrors it with `footer-logo-href`, `footer-logo`, `footer-logo-text`. Do not add a `src` to the logo `<img>` unless the content provides one; the bridge sets it for uploads.
- Footer keys in the starter: `footer-tagline`, `footer-0-heading`, `footer-0-${i}-href` / `-label`, `footer-social-${i}-href` / `-label`, `footer-copyright`.

---

## 7. Socials

Socials are **inferred**, not declared with a mode. The bridge treats a link as a social when either:

- its `data-ohw-href-key` contains a `social`/`socials` segment or a platform-name segment (`instagram`, `facebook`, `fb`, `linkedin`, `twitter`, `tiktok`, `youtube`, `threads`, `whatsapp`, `telegram`, `pinterest`, `snapchat`, `discord`, `behance`, `dribbble`, `vimeo`, `spotify`, `github`, `reddit`, `medium`, `twitch`), or
- the anchor contains exactly one `data-ohw-editable="icon"` element.

Requirements: actually **render** the socials from content (declared-but-unrendered socials are invisible to the editor and the AI); wrap the row in `data-ohw-socials-row`; give each link its own href-key following the scheme above; put the glyph in an editable `icon` span and keep the template's own drawings (the bridge only swaps glyphs when the owner picks one). Order and icon/text display are bridge-managed (`__ohw_socials_order`, `__ohw_socials_display`).

---

## 8. Brand and colour tokens

Three tiers, all read at runtime:

1. `--ohw-brand-*` (`primary`, `accent`, `light`, `dark`, `surface`, `border`, `muted`) — written by the bridge on `<html>` when a brand override applies. **Never define these.**
2. `--brand-*` — the template contract. Required (**rule 12**, error if any is never defined): `--brand-primary`, `--brand-accent`, `--brand-background`, `--brand-text`, `--brand-surface`, `--brand-border`, `--brand-font-heading`, `--brand-font-body`. The starter also emits `--brand-text-muted`, `--brand-on-primary`, `--brand-secondary` and more.
3. `--color-*` / `--font-*` — baked tokens that generated AI sections and the scheduling widget read. Required (**rule 14**, warn): `--color-primary`, `--color-accent`, `--font-body`, `--font-display`. The starter also emits `--color-light`, `--color-dark`, `--radius`, `--fs-section-h2`, `--font-weight-heading`.

Each brand colour is emitted as the override-with-fallback chain (**rule 13**, error if no source contains `var(--ohw-brand-`); `BrandProvider.tsx` does this from `content/brand.ts`:

```
--brand-primary: var(--ohw-brand-primary, #0F0F0F);
```

- Route **all** component CSS through `--brand-*` (colour) and `--brand-font-heading` / `--brand-font-body` (type). A hex literal in CSS is a warn (**rule 12**) unless it sits inside a `var(--x, #fallback)` on the same line. Comment lines are ignored.
- Fonts are **loaded** in `src/lib/fonts.ts` (`next/font`) and **named** in `content/brand.ts`. Changing one without the other leaves the browser on the fallback family.
- Surfaces styled with literals or private token ramps stay fixed when the owner changes their brand; that is a bug unless the surface is deliberately neutral (image-backed hero, monochrome footer). (`ai-brand-var-dead-routing`, warn.)
- **Card components carry the bare `card` class token** (**rule 15**, warn): the corner-style rule targets `:is(.card, [data-ohw-card])`. `card-sticker`-style names do not match. The starter's `Card.tsx` does this.
- Keep the brand kit complete: the editor only sends the current brand to the AI when the full `{ palette: { dark, primary, accent, light }, fonts: { heading, body } }` shape resolves. In the starter these come from `content/brand.ts` (`text` → dark, `background` → light).

---

## 9. Forms

Ship the minimal contract; the bridge does the rest at page load:

```tsx
<form data-ohw-editable="form" data-ohw-key="contact-form">
  <Input name="email" placeholder="Your email" type="email" required />
  <Button type="submit">Send</Button>
</form>
```

- The form needs its key (**rule 1**): without one the bridge never submits it.
- Every data input/textarea/select has a **`name`** (**rule 16**, error): the bridge keys fields by name; unnamed fields get an unstable generated key. `type="submit|button|hidden|reset"` are exempt.
- Do not tag inputs; do not author labels. The bridge injects `data-ohw-form-field`, `data-ohw-field-type` and a `<label data-ohw-field-label data-ohw-key="<field>-label">` per field, on plain page load as well as in the editor. Those injected keys are how AI style prompts reach form fields.
- Placeholder-only designs (pill newsletter forms, sr-only labels): the injected label would break the layout. Guard with CSS scoped to that form: `.my-form [data-ohw-field-label] { display: none !important; }`. Never "fix" it by unkeying. (`ai-form-label-visual-damage`, warn.)
- Reserved derived keys: `<formKey>-fields`, `<formKey>-success`. Do not collide with them.

---

## 10. Maps

The address is the editable value. Build `src` and `data-ohw-map-query` from the same string:

```tsx
const address = content.address;
<iframe
  data-ohw-editable="map"
  data-ohw-key="contact-map"
  data-ohw-map-query={address}
  src={`https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`}
/>
```

- `map` without `data-ohw-map-query` is an error (**rule 3**).
- A key naming a map (`…-map`, `map-…`) with any other mode is an error, and any string literal in source shaped like `[… map …]` (placeholder copy standing in for a map) is an error (**rule 21**). Ship a real embed or nothing.

---

## 11. Carousels

Contract from the bridge's `docs/editable-carousels.md`, enforced mechanically by **rule 24**:

```tsx
'use client';
import { useOhwCarousel } from '@ohhwells/bridge';

export function Gallery({ content }) {
  const { images, bind } = useOhwCarousel('studio-gallery', content.images);
  return (
    <div {...bind}>
      {images.map((img, i) => (
        <div key={i} data-ohw-carousel-slide={i}>
          <Image src={img.src} alt={img.alt} fill unoptimized />
        </div>
      ))}
    </div>
  );
}
```

- `'use client'` at the top (error), `{...bind}` spread on the slide container (error), a unique kebab-case key (duplicate = error, non-kebab = warn), `data-ohw-carousel-slide={i}` on each slide (warn if absent from the file).
- Render from `images` (the hook's array), **never** the raw prop; otherwise edits save but never show. (`ai-carousel-contract-intent`, warn.)
- No `.slice(0, n)` on the list (warn); the layout must handle any count because add/delete is supported.
- `next/image` slides need `unoptimized` (warn): uploaded slides come from hosts outside `next.config`.
- Items are `{ src, alt }` only; extra fields are dropped on the first edit. v1 supports replace/add/delete/alt; no reordering, images only.
- Slides carry **no** per-image `data-ohw-editable`; the carousel owns them. Two projections of one list (background stack + thumbnail rail): only the primary container takes `{...bind}`.
- Manual form without the hook: container stamped with `data-ohw-carousel`, `data-ohw-key` (error if missing) and `data-ohw-carousel-value={JSON.stringify(images)}` (warn if missing).

---

## 12. Video, icons, multi-state, scheduling

- **Video**: `<video data-ohw-editable="video" data-ohw-key="hero-video">`. Autoplay/mute state rides the derived keys listed in §2.
- **Icons**: `<span data-ohw-editable="icon" data-ohw-key="services-item-0-icon"><svg …/></span>`. The span owns its glyph; an `<img>` inside it needs no separate key.
- **Multi-state blocks** (form success/error views): `data-ohw-editable-state="default,success"` on the container, `data-ohw-state-view="success"` on each state wrapper.
- **Scheduling**: mount the bridge's `SchedulingWidget` (exported from `@ohhwells/bridge`). It renders its own `data-ohw-section="scheduling-*"` and reads your `--color-*` / `--brand-*` tokens. No other authoring.

---

## 13. Reserved namespace — never author

**Rule 17** (error) flags all of these:

- Keys starting with `__ohw_`.
- Attributes: `data-ohw-instance`, `data-ohw-section-removed`, `data-ohw-ai-generated`, `data-ohw-ai-removed`, `data-ohw-ai-replaced-by`, `data-ohw-ai-template-hidden`, `data-ai-section`, `data-ohw-card`, `data-ohw-section-container`, `data-ohw-selected`, `data-ohw-hovered`, `data-ohw-editing`, `data-ohw-social-item`, `data-ohw-placeholder-edit`, `data-ohw-empty-label`, `data-ohw-can-drag`, `data-ohw-item-dragging`, `data-ohw-footer-press-drag`, `data-ohw-item`, `data-ohw-item-clone`, `data-ohw-item-removed`, `data-ohw-item-surface`.
- Whole families by prefix: `data-ohw-style-*`, `data-ohw-field-*`, `data-ohw-form-*`.

Dual-purpose attributes you **do** author, for their documented purpose only: `data-ohw-socials-row`, `data-ohw-footer-col`, `data-ohw-map-query`, `data-ohw-placeholder` (logo placeholder state, via the Wordmark pattern).

---

## 14. Plumbing

**Rule 18** on `src/app/layout.tsx`: the file exists (error); it loads the bridge styles via `import '@ohhwells/bridge/styles'` or a synced static `ohhwells-bridge.css` link (error); `<OhhwellsBridge />` is wrapped in `<Suspense>` (error); the `#ohw-loader` first-paint loader is present (warn).

**Rule 19**: `.env.example` exists and mentions `NEXT_PUBLIC_FLOWOPS_API_URL` (warn).

**Rule 20**: `@ohhwells/bridge` is a dependency (error) and its exact pin matches the newest pin across the repo (warn). The pin is the AI feature gate; keep it current and redeploy after bumps.

**Rule 25: page CRUD.** The editor can duplicate, rename, delete and add blank pages. Those pages have no folder under `src/app/`, so the template must route them itself. The starter ships all three pieces; copy them as they are.

- `src/middleware.ts`, one line (error if missing or not running `sitePagesMiddleware`):
  ```ts
  export { sitePagesMiddleware as middleware, sitePagesMiddlewareConfig as config } from '@ohhwells/bridge/pages';
  ```
  It serves a renamed page at its new URL (with a 307 from the old one) and hides a deleted page. If the template needs its own middleware, call `sitePagesMiddleware(request)` from it rather than replacing it.
- `src/app/[...page]/page.tsx` calling `renderCatchAllPage` (error if missing). `renderDuplicate` must import the source page **relatively** (`` import(`../${sourceSegment}/page`) ``, `import('../page')` for the homepage). webpack builds that import's context module only from a real relative prefix, so an `@/app/…` alias import passes the build and fails at runtime (error).
- `src/components/layout/Breadcrumb.tsx`, the blank page's header: the bridge's `EmptySection` inside the template's own section wrapper. Its keys carry the page id (`` `hero-${pageId}-title` ``), never the path, so edits survive a rename. Wrap it in a section class the template actually defines: the starter's `page-section` is not in every template (ledger reuses its `page-header` band).

---

## 15. Rule index

| # | Checks | Level |
|---|---|---|
| 1 | `data-ohw-editable` without `data-ohw-key` on the same element | error (warn if the key is conditional) |
| 2 | Duplicate `data-ohw-key` across reachable files; non-kebab key | error / warn |
| 3 | Unknown editable mode; `map` without `data-ohw-map-query` | error |
| 4 | `text`/`plain` editable wrapping another editable | error |
| 5 | `<img>`/`<Image>` with no key (outside an image/bg-image/icon editable) | warn |
| 6 | Href-keyed link whose label is `plain` (non-logo, non-social) | error |
| 7 | Chrome-file link without `data-ohw-href-key` (non-logo, non-`#`, non-social) | warn |
| 8 | No `button`/`navbar-button` role in the template; no `logo` role; `navbar-button` without `drag-disabled` | error / warn / warn |
| 9 | Missing section label; non-kebab id; same section id on two or more pages | warn / warn / error |
| 10 | No section named exactly `navbar` / `footer` | error |
| 11 | Editable in `page.tsx`/`layout.tsx` with no section ancestor | warn |
| 12 | Required `--brand-*` var never defined; hex in CSS outside a `var()` fallback | error / warn |
| 13 | No `var(--ohw-brand-*, …)` chain anywhere | error |
| 14 | Missing `--color-primary`, `--color-accent`, `--font-body`, `--font-display` | warn |
| 15 | No element carries the bare `card` class token | warn |
| 16 | Data input inside a `form` editable without `name` | error |
| 17 | Bridge-injected attribute or `__ohw_` key authored | error |
| 18 | Root layout: bridge styles, `<Suspense>` around the bridge, `#ohw-loader` | error / error / warn |
| 19 | `.env.example` missing or silent on `NEXT_PUBLIC_FLOWOPS_API_URL` | warn |
| 20 | No `@ohhwells/bridge` dependency; pin behind sibling templates | error / warn |
| 21 | Map-named key with a non-`map` mode; bracket map placeholder copy | error |
| 22 | Key/href-key/section/`ohwKey`/`sectionId` in a `[param]` route not interpolating the param | error |
| 23 | Href-keyed link in a non-chrome file with no role (non-social) | error |
| 24 | Carousel: no `'use client'`, no `{...bind}`, duplicate key / missing slide marker, `.slice` cap, `next/image` without `unoptimized`, incomplete manual container | error / warn |
| 25 | No `sitePagesMiddleware` in `src/middleware.ts`; no `[...page]` catch-all calling `renderCatchAllPage`; catch-all importing through `@/` | error |

AI review rules (advisory; `warn` or `info`):

| id | Judges |
|---|---|
| `ai-should-be-editable` | Visible owner-specific copy (names, prices, hours, addresses) rendered without a key |
| `ai-link-affordance-intent` | Fixed link vs reorderable item, especially in chrome files |
| `ai-mode-choice` | `text`/`plain`/`icon`/`image`/`bg-image` fit for what the element is |
| `ai-section-granularity` | Regions missing their own section; over-sectioning; label quality |
| `ai-brand-var-dead-routing` | `--brand-*` defined but a visually significant surface uses literals |
| `ai-form-label-visual-damage` | Forms where the injected label will break a placeholder-only design |
| `ai-carousel-contract-intent` | Rendering from the raw prop, fixed-count layouts, extra slide fields, double `{...bind}` |
| `ai-rerender-wipes-editables` | Bridge-owned editables inside re-rendering components |
| `ai-key-rename-data-loss` | Key/section-id renames and deviations that invite one |
| `ai-false-positive-triage` | One verdict per deterministic finding: `real`, `false-positive`, `uncertain` |
