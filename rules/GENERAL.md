<!-- markdownlint-disable extended-ascii -->

# How to Work in This Project

These rules apply to all files in the landing-template repository.

## Contents

- [Thinking Before Coding](#thinking-before-coding)
- [Project Architecture](#project-architecture)
  - [Directory Map](#directory-map)
  - [Where Things Go](#where-things-go)
- [Config and Content Separation](#config-and-content-separation)
  - [Site Config](#site-config)
  - [Page Configs](#page-configs)
  - [Legal Content](#legal-content)
  - [User-Facing Copy](#user-facing-copy)
  - [Placeholders](#placeholders)
- [Assets](#assets)
- [Pages and Templates](#pages-and-templates)
  - [Landing Pages](#landing-pages)
  - [Legal Pages](#legal-pages)
  - [Error Pages](#error-pages)
  - [Adding a New Landing Page](#adding-a-new-landing-page)
  - [Adding a New Legal Page](#adding-a-new-legal-page)
- [Shared Scripts](#shared-scripts)
- [Build Pipeline](#build-pipeline)
- [Styles](#styles)
- [Root-Level Files](#root-level-files)
- [Development Workflow](#development-workflow)
- [Code Style](#code-style)
  - [JavaScript Conventions](#javascript-conventions)
  - [HTML Conventions](#html-conventions)
- [Commits](#commits)
- [Git Hooks](#git-hooks)
- [Linting](#linting)
- [Security Scanning](#security-scanning)
- [Protected Files](#protected-files)
- [Scope Discipline](#scope-discipline)

## Thinking Before Coding

Read the relevant code before touching it. Understand the existing patterns, the data flow, and why things are structured the way they are. This is a static site with a specific separation of concerns. Content, config, templates, and build logic each live in their own place. Respect that separation.

Before making a change, ask:

- Does this belong in config, content, a template, or a build script?
- Will the build pipeline pick this up automatically, or do I need to wire it in?
- Am I putting user-facing text where it belongs?

## Project Architecture

This is a static landing page template. There is no framework, no bundler, no TypeScript. Pages are plain HTML templates filled by a Node.js build script that reads config and content files. The output is static HTML ready for deployment (Cloudflare Pages or any static host).

### Directory Map

```text
assets/               Static assets (favicons, fonts, images, videos)
build/                Build scripts (Node.js)
  steps/              Per-concern build steps (landing, legal, sitemap)
config/               All configuration
  pages/              Per-page content and metadata
  site.js             Site-wide config (name, URLs, emails, copy, OG, schema)
  legal.js            Legal page metadata (title, description, path)
  analytics.js        Analytics provider defaults and config
  server.js           Dev server constants
content/              Long-form prose (markdown)
  privacy.md          Privacy policy body
  terms.md            Terms of service body
functions/            Edge functions (Cloudflare Pages middleware)
linting/              Custom lint rules, configs, and scripts
pages/                HTML templates and generated output
  landing/            Landing page template and generated pages
    template.html     Landing page HTML template
    default/          Generated: default landing page
  legal/              Legal page template and generated pages
    template.html     Legal page HTML template
    privacy/          Generated: privacy page
    terms/            Generated: terms page
rules/                Agent rules (this file)
shared/               Browser-runtime JS shared across pages
  analytics.js        Analytics bootstrapping
  consent.js          Cookie/tracking consent logic
  seo.js              Runtime SEO metadata injection
```

### Where Things Go

| What you are adding                  | Where it goes                              |
| ------------------------------------ | ------------------------------------------ |
| Favicon files                        | `assets/favicons/`                         |
| Font files (woff, woff2)             | `assets/fonts/`                            |
| Images (png, jpg, svg, webp)         | `assets/images/`                           |
| Videos (mp4, webm)                   | `assets/videos/`                           |
| Site name, URLs, emails, OG metadata | `config/site.js`                           |
| Landing page content (hero, features, CTAs) | `config/pages/<slug>.js`            |
| Legal page metadata (title, path)    | `config/legal.js`                          |
| Legal page body text                 | `content/<name>.md`                        |
| Privacy policy prose                 | `content/privacy.md`                       |
| Terms of service prose               | `content/terms.md`                         |
| Analytics provider config            | `config/analytics.js`                      |
| Landing page HTML structure          | `pages/landing/template.html`              |
| Legal page HTML structure            | `pages/legal/template.html`                |
| Shared browser-runtime utilities     | `shared/`                                  |
| Build logic                          | `build/steps/`                             |
| 404 page                             | `404.html` (project root)                  |
| Global stylesheet                    | `styles.css` (project root)                |
| Dev server                           | `server.js` (project root)                 |
| Edge functions                       | `functions/`                               |
| Lint rules and configs               | `linting/`                                 |

## Config and Content Separation

This project separates structured data (config) from prose (content). Mixing them defeats the purpose.

### Site Config

`config/site.js` is the single source of truth for site-wide settings: base URL, site name, organization name, email addresses, OG metadata, Twitter card settings, navigation links, user-facing copy, and schema.org configuration.

This file uses a dual-environment pattern. It exports via `module.exports` for Node.js (build scripts) and sets `window.LANDING_SITE` for browser runtime. Both paths must stay in sync.

### Page Configs

Each landing page has a config file in `config/pages/`. The filename (minus `.js`) becomes the page slug. The config defines the page title, description, path, hero content, CTA labels and URLs, and feature cards.

Page configs also use the dual-environment pattern: `module.exports` for build, `window.LANDING_PAGE` for browser.

### Legal Content

Legal page prose (privacy policy, terms of service) lives in `content/` as markdown files. The filename must match the key in `config/legal.js`. The build script reads the markdown, parses it into HTML, and injects it into the legal template.

`config/legal.js` holds only metadata for legal pages: title, description, and URL path. The body text lives in `content/`, not in config.

### User-Facing Copy

All user-facing text that appears in landing page templates (navigation labels, section titles, footer text) is defined in `config/site.js` under the `copy.landing` object. The build script requires all keys in this object to be present and non-empty.

Do not hardcode user-facing strings in HTML templates. Templates use `{{PLACEHOLDER}}` tokens that the build replaces with values from config.

### Placeholders

Two placeholder systems exist:

1. **Build-time placeholders** (`{{PLACEHOLDER}}`): used in HTML templates. The build script replaces them with escaped values from config. Defined and consumed in `build/steps/landing.js` and `build/steps/legal.js`.

2. **Content placeholders** (`{{ORG_NAME}}`, `{{BASE_URL}}`, `{{ADMIN_EMAIL}}`, `{{PRIVACY_EMAIL}}`, `{{CONTACT_EMAIL}}`): used in markdown content files and legal config. Replaced by `build/steps/legal.js` at build time using values from `config/site.js`.

When adding a new placeholder, define it in the appropriate build step and document which config value it resolves to.

## Assets

All static assets live under `assets/`, organized by type:

- `assets/favicons/` for favicon files (favicon.ico at root is the legacy browser fallback)
- `assets/fonts/` for web font files
- `assets/images/` for images (including the OG image referenced in `config/site.js`)
- `assets/videos/` for video files

Do not put assets anywhere else. Do not create new top-level directories for asset types.

## Pages and Templates

### Landing Pages

Landing pages use `pages/landing/template.html` as their HTML structure. The build script reads each config file in `config/pages/`, fills the template with config values, and writes the result to `pages/landing/<slug>/index.html`.

Generated `index.html` files are build output. Edit the template or the config, not the generated files.

### Legal Pages

Legal pages use `pages/legal/template.html`. The build reads `config/legal.js` for metadata and `content/<name>.md` for body text, parses the markdown, and writes to `pages/legal/<name>/index.html`.

Edit the template, the config, or the content markdown. Do not edit generated `index.html` files.

### Error Pages

`404.html` lives at the project root. This is required by static hosting platforms (Cloudflare Pages, Netlify, etc.) that look for a root-level `404.html`. Do not move it into a subdirectory.

### Adding a New Landing Page

1. Create `config/pages/<slug>.js` with the page config (title, description, path, hero, features, CTAs). Follow the dual-environment export pattern.
2. Run `bun run build`. The build script creates `pages/landing/<slug>/index.html` automatically.
3. Update `config/site.js` navigation if the page should appear in the nav.

### Adding a New Legal Page

1. Add an entry to `config/legal.js` with title, description, and path.
2. Create `content/<name>.md` with the page body. The filename must match the key in `config/legal.js`.
3. Run `bun run build`. The build script creates `pages/legal/<name>/index.html` automatically.
4. Update navigation or footer links if needed.

## Shared Scripts

`shared/` contains browser-runtime JavaScript loaded by page templates:

- `seo.js`: reads `window.LANDING_SITE` and `window.LANDING_PAGE` at runtime to set meta tags, OG tags, canonical URL, and JSON-LD schema.
- `analytics.js`: bootstraps analytics providers (Mixpanel, GA) based on `config/analytics.js` and consent state.
- `consent.js`: handles cookie/tracking consent.

These scripts run in the browser. They read from `window.*` globals set by config scripts loaded earlier in the page. They must not use Node.js APIs.

## Build Pipeline

`build/index.js` orchestrates the build. It runs three steps in order:

1. `build/steps/landing.js`: generates all landing pages from configs and template.
2. `build/steps/legal.js`: generates all legal pages from configs, content, and template.
3. `build/steps/sitemap.js`: generates `sitemap.xml` from the pages produced by steps 1 and 2.

Run the build with `bun run build`. The build is fast and deterministic: same inputs produce same outputs.

When adding a new page type (not a new page, but an entirely new category of pages), create a new build step in `build/steps/`, wire it into `build/index.js`, and feed its sitemap entries into the sitemap step.

## Styles

A single `styles.css` at the project root contains all styles. There is no CSS preprocessor, no CSS modules, no per-component stylesheets.

When adding styles for a new section or component, add them to `styles.css`. Follow the existing naming conventions (BEM-like class names: `site-header`, `hero-section`, `feature-card`, `legal-page`, etc.).

## Root-Level Files

These files must stay at the project root:

| File               | Purpose                                      |
| ------------------ | -------------------------------------------- |
| `404.html`         | Error page (required by static hosts)        |
| `styles.css`       | Global stylesheet                            |
| `server.js`        | Development server                           |
| `favicon.ico`      | Legacy browser favicon fallback              |
| `robots.txt`       | Search engine crawl directives               |
| `sitemap.xml`      | Generated sitemap (build output)             |
| `site.webmanifest` | PWA manifest                                 |
| `_headers`         | Cloudflare Pages response headers            |
| `_redirects`       | Cloudflare Pages redirect rules              |
| `package.json`     | Dependencies and scripts                     |

Do not move these files. Static hosting platforms and browsers expect them at specific paths.

## Development Workflow

1. Read the relevant code. Understand what you are changing and where it fits.
2. Make the change in the correct location (config, content, template, build, shared, or styles).
3. Run `bun run build` to regenerate pages.
4. Run `bun run lint` to check for violations.
5. Review the generated output if you changed config or content.
6. Commit with a conventional commit message.

After finishing work, always run `bun run lint`. Do not skip this step.

## Code Style

### JavaScript Conventions

- Use `var` declarations in files that run in both Node.js and browser (config files, shared scripts). This is intentional for broad compatibility.
- Config files that run in both environments use the dual-export pattern:

  ```js
  var config = { /* ... */ };
  if (typeof module !== 'undefined' && module.exports) { module.exports = config; }
  if (typeof window !== 'undefined') { window.LANDING_SITE = config; }
  ```

- Build scripts (under `build/`) are Node.js only and use `require`/`module.exports`.
- No TypeScript, no ES modules in source files, no bundler.
- ESLint and Prettier enforce formatting. Do not fight the formatter.

### HTML Conventions

- Templates use `{{PLACEHOLDER}}` tokens for dynamic content. The build escapes all values.
- Templates are validated by HTMLHint and html-validate. Keep them valid.
- Do not inline JavaScript or CSS in templates. Use external files.

## Commits

This repo uses [Conventional Commits](https://www.conventionalcommits.org/) enforced by commitlint.

### Format

```text
type(scope): lowercase subject
```

### Required Types

`feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`

### Required Scopes

`landing`, `hooks`, `linting`, `root`, `deps`

Every commit must have a scope from the list above.

### Rules

- Subject must be lowercase.
- Subject must not be empty.
- Subject max length: 100 characters.
- Header max length: 120 characters.
- Body line max length: 200 characters.

### Scope Selection

| What changed                              | Scope      |
| ----------------------------------------- | ---------- |
| Pages, config, content, build, shared, styles, templates | `landing`  |
| Git hooks (`.githooks/`)                  | `hooks`    |
| Lint rules and configs (`linting/`)       | `linting`  |
| Root config files, AGENTS.md, rules, docs | `root`     |
| Dependency additions or updates           | `deps`     |

### Splitting Commits

Each commit should be a single logical change. Do not lump unrelated changes into one commit.

- A content change is one commit.
- A config change is one commit (unless it is part of the same content change).
- A lint/formatting fix is its own commit, separate from logic changes.
- A dependency update is its own commit.

## Git Hooks

Hooks are installed from `.githooks/`. Run `bun run setup:hooks` to set them up.

### Pre-Commit

Runs on every `git commit`. Checks global lint, banned terms, typos, and package.json lint.

### Commit-Msg

Runs commitlint against the commit message. Rejects messages that do not follow conventional commit format.

### Pre-Push

Runs on `git push`. Checks security scans (Gitleaks, OSV), Semgrep, and markdownlint.

### If a Hook Fails

Fix the issue. Do not bypass the hook. The hook caught something real.

## Linting

Run `bun run lint` to check everything. Run `bun run lint:fix` to auto-fix what can be auto-fixed.

Linting is a gate, not a suggestion. Every commit must pass lint.

Never weaken, disable, or bypass any linting rule unless explicitly asked. This includes ESLint, Stylelint, HTMLHint, html-validate, markdownlint, Semgrep, JSCPD, ShellCheck, and custom rules under `linting/`.

### JSCPD Thresholds

JSCPD thresholds are frozen. Never change them for any reason.

| Config                      | Threshold | Scope                |
| --------------------------- | --------- | -------------------- |
| `.jscpd/*.json` (root)      | 4%        | JS, CSS, Bash source |
| `.githooks/.jscpd/bash.json`| 20%       | Hook shell scripts   |

If JSCPD reports duplication above the threshold, refactor the duplicated code. Do not raise the threshold to make the check pass.

## Security Scanning

Run `bun run security:scan` to run all security scans (Gitleaks, OSV, Semgrep).

Run security scans after:

- Adding or updating dependencies.
- Touching environment variable handling or analytics configuration.
- Any change where you are not certain there is no security impact.

## Protected Files

The following files must never be modified unless the user explicitly asks:

- `.license-checker.json`

## Scope Discipline

Do what was asked. Do not expand scope. Do not add features, refactor surrounding code, or "improve" things that were not requested. If you find something unrelated that needs fixing, mention it. Do not silently fix it unless it is trivial and in a file you are already editing.
