# Landing Template

Production-ready starter for basic websites and landing pages.

## What You Get

- Static page generation from reusable HTML templates (`build/` + `config/pages/*.js`)
- Built-in SEO generation (meta tags + Open Graph + JSON-LD)
- Optional analytics integration points (Google Analytics + Mixpanel) with consent gating
- Legal page generation from Markdown (`content/terms.md`, `content/privacy.md`)
- Cloudflare Pages-ready routing and headers (`_redirects`, `_headers`, `functions/_middleware.js`)
- Strict linting, formatting, complexity, duplication, and security scanning
- Git hooks for commit/push quality gates

## Prerequisites

- Node.js `>=20.0.0 <21.0.0`
- [Bun](https://bun.sh) `>=1.2.7`

## Quick Start

```bash
bun install
npm run setup:hooks
npm run build
npm run start
```

Open: `http://localhost:3001`

## Repository Layout

- `404.html`: Not-found page template
- `_headers`: Cloudflare response headers
- `_redirects`: Cloudflare route rewrites
- `assets/`: Static assets (images, videos, favicons, fonts)
- `build/`: Static page generation scripts
- `config/`: Site, page, analytics, server, legal config
- `content/`: Markdown/legal content
- `functions/`: Cloudflare Pages middleware
- `linting/`: Custom lint/security tooling and configs
- `pages/landing/template.html`: Main landing page template
- `pages/landing/default/`: Generated default landing output
- `pages/legal/template.html`: Legal page template
- `shared/`: Shared browser utilities (SEO, analytics, consent)
- `styles.css`: Global styling for landing + legal + 404 pages
- `.githooks/`: Commit/push hooks and helper scripts

### Notes on Empty Folders

`assets/` includes `.gitkeep` files so the structure stays visible even before you add custom files.

## Build Pipeline

`npm run build` performs three steps:

1. Generate landing pages from `pages/landing/template.html` using each file in `config/pages/*.js`
1. Generate legal pages from Markdown (`content/*.md`) into `pages/legal/*/index.html`
1. Generate `sitemap.xml` from published pages

Generated files:

- `pages/landing/<slug>/index.html`
- `pages/legal/<slug>/index.html`
- `sitemap.xml`

## How to Add a New Landing Page

1. Copy a page config:

```bash
cp config/pages/default.js config/pages/pricing.js
```

1. Update `config/pages/pricing.js`:

- `path` (for example `'/pricing'`)
- `title` and `description`
- hero text and CTA fields
- `features` array
- `published` (`false` until ready)

1. Add route to `_redirects`:

```text
/pricing /pages/landing/pricing/ 200
```

1. Rebuild:

```bash
npm run build
```

## Navigation Setup

- Global nav defaults live in `config/site.js` (`navigation` array)
- Per-page nav override can be added in each `config/pages/*.js` (`navigation` array)
- The build step renders nav links into `{{NAV_LINKS}}` in `pages/landing/template.html`

## SEO Setup

- Site-level defaults: `config/site.js`
- Page-level metadata: `config/pages/*.js`
- Build injects SEO tags directly into generated HTML
- Runtime `shared/seo.js` keeps tags in sync when page config loads in browser

## Analytics Setup (Optional)

By default, tracking is disabled.

`config/analytics.js` already includes stub defaults and merge logic.

To enable tracking, set values before `shared/analytics.js` executes (for example in template head):

```html
<script>
  window.ANALYTICS_CONFIG = {
    mixpanel: 'YOUR_MIXPANEL_TOKEN',
    ga: 'G-XXXXXXXXXX',
  };
</script>
```

- Consent is handled by `shared/consent.js`
- Analytics initialize only after accepted consent
- CTA click tracking works automatically on elements with `data-track-cta`

## Legal Content

- Edit `content/privacy.md` and `content/terms.md`
- Template placeholders supported in markdown:
  - `{{ORG_NAME}}`
  - `{{BASE_URL}}`
  - `{{ADMIN_EMAIL}}`
  - `{{PRIVACY_EMAIL}}`
  - `{{CONTACT_EMAIL}}`

## Assets and Favicon

- Put your favicon at repo root: `favicon.ico`
- Add marketing assets inside `assets/` (images/videos/fonts/favicons)
- Update references in templates/config as needed
- `404.html` includes favicon usage as reference

## Quality and Security Commands

```bash
npm run lint
npm run lint:fix
npm run format
npm run format:check
npm run security:scan
```

### Hook Setup

```bash
npm run setup:hooks
```

Hooks run lint/security checks on commit and push. Bypass options are listed by `setup:hooks` output.

## Deployment

### Cloudflare Pages

- Build command: `npm run build`
- Output directory: repository root (`/`)
- Routing controlled by `_redirects`
- Security/caching headers controlled by `_headers`
- Middleware logic in `functions/_middleware.js`

### Any Static Host

- Upload repository after running `npm run build`
- Replicate rewrite rules from `_redirects`
- Serve generated HTML and static assets as plain files
