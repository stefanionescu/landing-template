<!-- markdownlint-disable extended-ascii -->

# How to Work in This Project

These rules apply to all files in the landing-template repository.

## Contents

- [Thinking Before Coding](#thinking-before-coding)
- [Project Architecture](#project-architecture)
  - [Runtime Requirements](#runtime-requirements)
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
  - [Build Output (`dist/`)](#build-output-dist)
  - [SEO Generation](#seo-generation)
- [Deployment and Routing](#deployment-and-routing)
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

This is a static landing page template. There is no framework, no bundler, no TypeScript. Pages are plain HTML templates filled by a Node.js build script that reads config and content files. The output is a `dist/` directory containing static HTML ready for deployment (Cloudflare Pages or any static host).

### Runtime Requirements

- Node.js `>=20.0.0 <21.0.0`
- Bun `>=1.2.7` (package manager)
- Python 3 for repo-local Semgrep/Lizard bootstrapping
- `curl` and `tar` for repo-local CLI downloads

### Directory Map

```text
assets/               Static assets (favicons, fonts, images, videos)
build/                Build scripts (Node.js)
  lib/                Build utilities (paths, file copying)
    copy.js           Dist cleaning and file/directory copying
    paths.js          ROOT_DIR and DIST_DIR path resolution
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
dist/                 Build output (generated, not checked in)
functions/            Edge functions (Cloudflare Pages middleware)
linting/              Custom lint rules, configs, and scripts
  .tools/             Repo-local pinned CLI cache (bootstrapped, ignored by git)
  bin/                Repo-local tool wrappers used by lint/hooks/security scripts
  config/             Linting configuration files (html/, security/)
  css-dead.mjs        Dead CSS detection
  html-copy.mjs       HTML copy validation
  install/            Tool bootstrap helpers for repo-local lint/security CLIs
  license/            License checking
  links/              Link checking (internal and external)
  lizard/             Code complexity analysis (Lizard runner)
  markdownlint/       Markdownlint overrides
  package/            package.json linting and integrity checks
  security/           Security scanning (gitleaks/, osv/ runners)
  semgrep/            Semgrep rules and runner
  shell/              Shell script quality tools (naming, length, docs, etc.)
pages/                HTML templates (source)
  landing/            Landing page template
    template.html     Landing page HTML template
  legal/              Legal page template
    template.html     Legal page HTML template
rules/                Agent rules (this file)
shared/               Browser-runtime JS shared across pages
  analytics.js        Analytics bootstrapping
  consent.js          Cookie/tracking consent logic
  seo.js              Runtime SEO metadata injection
```

### Where Things Go

| What you are adding                         | Where it goes                 |
| ------------------------------------------- | ----------------------------- |
| Favicon files                               | `assets/favicons/`            |
| Font files (woff, woff2)                    | `assets/fonts/`               |
| Images (png, jpg, svg, webp)                | `assets/images/`              |
| Videos (mp4, webm)                          | `assets/videos/`              |
| Site name, URLs, emails, OG metadata        | `config/site.js`              |
| Landing page content (hero, features, CTAs) | `config/pages/<slug>.js`      |
| Legal page metadata (title, path)           | `config/legal.js`             |
| Legal page body text                        | `content/<name>.md`           |
| Privacy policy prose                        | `content/privacy.md`          |
| Terms of service prose                      | `content/terms.md`            |
| Analytics provider config                   | `config/analytics.js`         |
| Dev server constants                        | `config/server.js`            |
| Landing page HTML structure                 | `pages/landing/template.html` |
| Legal page HTML structure                   | `pages/legal/template.html`   |
| Shared browser-runtime utilities            | `shared/`                     |
| Build logic                                 | `build/steps/`                |
| Build utilities (paths, copying)            | `build/lib/`                  |
| 404 page                                    | `404.html` (project root)     |
| Global stylesheet                           | `styles.css` (project root)   |
| Dev server                                  | `server.js` (project root)    |
| Edge functions                              | `functions/`                  |
| Lint rules and configs                      | `linting/`                    |

## Config and Content Separation

This project separates structured data (config) from prose (content). Mixing them defeats the purpose.

### Site Config

`config/site.js` is the single source of truth for site-wide settings: base URL, site name, organization name, email addresses, OG metadata, Twitter card settings, navigation links, user-facing copy, and schema.org configuration.

This file uses a dual-environment pattern. It exports via `module.exports` for Node.js (build scripts) and sets `window.LANDING_SITE` for browser runtime. Both paths must stay in sync.

### Page Configs

Each landing page has a config file in `config/pages/`. The filename (minus `.js`) becomes the page slug. The config defines the page title, description, path, hero content, CTA labels and URLs, and feature cards.

Page configs also use the dual-environment pattern: `module.exports` for build, `window.LANDING_PAGE` for browser.

Optional page config properties:

- `published`: set to `false` to build the page but exclude it from the sitemap.
- `navigation`: array of `{ label, href }` objects to override the site-level navigation for this page.

### Legal Content

Legal page prose (privacy policy, terms of service) lives in `content/` as markdown files. The filename must match the key in `config/legal.js`. The build script reads the markdown, parses it into HTML, and injects it into the legal template.

`config/legal.js` holds only metadata for legal pages: title, description, and URL path. The body text lives in `content/`, not in config.

### User-Facing Copy

All user-facing text that appears in landing page templates (navigation labels, section titles, footer text) is defined in `config/site.js` under the `copy.landing` object. The build script requires all of the following keys to be present and non-empty:

`navAriaLabel`, `featuresSectionTitle`, `contactSectionTitle`, `contactTextPrefix`, `contactTextSuffix`, `footerOperatedBy`, `footerTermsLabel`, `footerPrivacyLabel`

Do not hardcode user-facing strings in HTML templates. Templates use `{{PLACEHOLDER}}` tokens that the build replaces with values from config.

### Placeholders

Two placeholder systems exist:

1. **Build-time placeholders** (`{{PLACEHOLDER}}`): used in HTML templates. The build script replaces them with escaped values from config. Defined and consumed in `build/steps/landing.js` and `build/steps/legal.js`. This includes `{{BUILD_VERSION}}`, a timestamp generated at build time and injected into both landing and legal pages.

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

Landing pages use `pages/landing/template.html` as their HTML structure. The build script reads each config file in `config/pages/`, fills the template with config values, and writes the result to `dist/pages/landing/<slug>/index.html`.

Generated `index.html` files are build output inside `dist/`. Edit the template or the config, not the generated files.

### Legal Pages

Legal pages use `pages/legal/template.html`. The build reads `config/legal.js` for metadata and `content/<name>.md` for body text, parses the markdown, and writes to `dist/pages/legal/<name>/index.html`.

Edit the template, the config, or the content markdown. Do not edit generated `index.html` files.

### Error Pages

`404.html` lives at the project root. This is required by static hosting platforms (Cloudflare Pages, Netlify, etc.) that look for a root-level `404.html`. Do not move it into a subdirectory.

### Adding a New Landing Page

1. Create `config/pages/<slug>.js` with the page config (title, description, path, hero, features, CTAs). Follow the dual-environment export pattern.
2. Run `bun run build`. The build script creates `dist/pages/landing/<slug>/index.html` automatically.
3. Update `config/site.js` navigation if the page should appear in the nav.
4. Add a redirect rule to `_redirects` if the page needs a clean URL (e.g., `/<slug> /pages/landing/<slug>/ 200`).

### Adding a New Legal Page

1. Add an entry to `config/legal.js` with title, description, and path.
2. Create `content/<name>.md` with the page body. The filename must match the key in `config/legal.js`.
3. Run `bun run build`. The build script creates `dist/pages/legal/<name>/index.html` automatically.
4. Add a redirect rule to `_redirects` (e.g., `/<name> /pages/legal/<name>/ 200`).
5. Update navigation or footer links if needed.

## Shared Scripts

`shared/` contains browser-runtime JavaScript loaded by page templates:

- `seo.js`: reads `window.LANDING_SITE` and `window.LANDING_PAGE` at runtime to set meta tags, OG tags, canonical URL, and JSON-LD schema. Note that landing pages also get build-time SEO tags (see [SEO Generation](#seo-generation)).
- `analytics.js`: bootstraps analytics providers (Mixpanel, GA) based on `config/analytics.js` and consent state.
- `consent.js`: handles cookie/tracking consent. Stores user preference in `localStorage` under `landing_template_consent`.

These scripts run in the browser. They read from `window.*` globals set by config scripts loaded earlier in the page. They must not use Node.js APIs.

## Build Pipeline

`build/index.js` orchestrates the build. It runs these steps in order:

1. **Clean and copy**: `build/lib/copy.js` deletes `dist/`, recreates it, and copies root files and directories (`styles.css`, `robots.txt`, `favicon.ico`, `site.webmanifest`, `_headers`, `_redirects`, `404.html`, `assets/`, `shared/`, `config/`) into `dist/`.
2. **Landing pages**: `build/steps/landing.js` generates all landing pages from configs and template into `dist/pages/landing/<slug>/index.html`.
3. **Legal pages**: `build/steps/legal.js` generates all legal pages from configs, content, and template into `dist/pages/legal/<name>/index.html`.
4. **Sitemap**: `build/steps/sitemap.js` generates `dist/sitemap.xml` from the pages produced by steps 2 and 3.

Run the build with `bun run build`. The build is fast and deterministic: same inputs produce same outputs.

When adding a new page type (not a new page, but an entirely new category of pages), create a new build step in `build/steps/`, wire it into `build/index.js`, and feed its sitemap entries into the sitemap step.

### Build Output (`dist/`)

The build writes all output to `dist/`. This directory mirrors the deployment structure:

```text
dist/
  404.html
  styles.css
  robots.txt
  favicon.ico
  site.webmanifest
  sitemap.xml
  _headers
  _redirects
  assets/             (copied from root)
  shared/             (copied from root)
  config/             (copied from root)
  pages/
    landing/<slug>/index.html   (generated)
    legal/<name>/index.html     (generated)
```

`dist/` is not checked into git. Never edit files inside `dist/` directly.

### SEO Generation

Landing pages get SEO meta tags at both build time and runtime:

- **Build time**: `build/steps/landing.js` generates `<title>`, `<meta>` (description, OG, Twitter), `<link rel="canonical">`, and `<script type="application/ld+json">` inside `<!-- SEO:START -->...<!-- SEO:END -->` markers.
- **Runtime**: `shared/seo.js` reads `window.LANDING_SITE` and `window.LANDING_PAGE` globals and updates meta tags dynamically.

Legal pages get SEO tags at build time only (`{{PAGE_TITLE}}`, `{{META_DESCRIPTION}}`, `{{CANONICAL_URL}}` placeholders in the template).

## Deployment and Routing

The primary deployment target is Cloudflare Pages. The `dist/` directory is the deployment root.

### Redirects (`_redirects`)

Clean URLs are mapped to internal page paths using 200 (rewrite) rules:

- `/` rewrites to `/pages/landing/default/`
- `/privacy` rewrites to `/pages/legal/privacy/`
- `/terms` rewrites to `/pages/legal/terms/`

When adding a new page, add its redirect rule here.

### Middleware (`functions/_middleware.js`)

Blocks direct public access to `/pages/*` paths and returns a 404. This prevents users from accessing the internal directory structure. All pages must be accessed through their clean URL via `_redirects`.

### Security Headers (`_headers`)

Applied to all responses: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Robots-Tag: index, follow`.

### Caching (`_headers`)

- Static assets (`/assets/*`, `/*.css`, `/*.js`, `/shared/*`, `/config/*`): immutable, 1 year.
- Metadata (`/robots.txt`, `/sitemap.xml`, `/site.webmanifest`): 1 day.

## Styles

A single `styles.css` at the project root contains all styles. There is no CSS preprocessor, no CSS modules, no per-component stylesheets.

When adding styles for a new section or component, add them to `styles.css`. Follow the existing naming conventions (BEM-like class names: `site-header`, `hero-section`, `feature-card`, `legal-page`, etc.).

## Root-Level Files

These files must stay at the project root:

| File               | Purpose                               |
| ------------------ | ------------------------------------- |
| `404.html`         | Error page (required by static hosts) |
| `styles.css`       | Global stylesheet                     |
| `server.js`        | Development server                    |
| `favicon.ico`      | Legacy browser favicon fallback       |
| `robots.txt`       | Search engine crawl directives        |
| `site.webmanifest` | PWA manifest                          |
| `_headers`         | Cloudflare Pages response headers     |
| `_redirects`       | Cloudflare Pages redirect rules       |
| `package.json`     | Dependencies and scripts              |

`sitemap.xml` is a build output generated in `dist/`, not a root-level source file.

Do not move these files. Static hosting platforms and browsers expect them at specific paths.

## Development Workflow

1. Read the relevant code. Understand what you are changing and where it fits.
2. Make the change in the correct location (config, content, template, build, shared, or styles).
3. Run `bun run build` to regenerate pages.
4. Run `bun run lint` to check for violations.
5. Review the generated output in `dist/` if you changed config or content.
6. Commit with a conventional commit message.

After finishing work, always run `bun run lint`. Do not skip this step.

## Code Style

### JavaScript Conventions

- Use `var` declarations in files that run in both Node.js and browser (config files, shared scripts). This is intentional for broad compatibility.
- Config files that run in both environments use the dual-export pattern:

  ```js
  var config = {
    /* ... */
  };
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = config;
  }
  if (typeof window !== 'undefined') {
    window.LANDING_SITE = config;
  }
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

| What changed                                             | Scope     |
| -------------------------------------------------------- | --------- |
| Pages, config, content, build, shared, styles, templates | `landing` |
| Git hooks (`.githooks/`)                                 | `hooks`   |
| Lint rules and configs (`linting/`)                      | `linting` |
| Root config files, CLAUDE.md, rules, docs                | `root`    |
| Dependency additions or updates                          | `deps`    |

### Splitting Commits

Each commit should be a single logical change. Do not lump unrelated changes into one commit.

- A content change is one commit.
- A config change is one commit (unless it is part of the same content change).
- A lint/formatting fix is its own commit, separate from logic changes.
- A dependency update is its own commit.

## Git Hooks

Hooks are installed from `.githooks/`. Run `bun run setup:hooks` to set them up.
That command also bootstraps the pinned repo-local CLI tools used by hooks, lint, and security
scans under `linting/.tools/`.

### Hook Directory Structure

```text
.githooks/
  pre-commit          Hook entry point: pre-commit orchestrator
  commit-msg          Hook entry point: commitlint check
  pre-push            Hook entry point: pre-push orchestrator
  hooks/
    global/           Shared checks run by commit and push hooks
      lint.sh         Mode-based: lint:code+knip+typos+pkg (commit), markdown+links (push)
      security.sh     Mode-based: env guard (commit), security:scan+license (push)
    self/             Hooks self-checks (lint, security, format, quality)
  lib/                Shared utilities (runtime.sh, setup.sh)
  .jscpd/             JSCPD config for hook shell scripts
  knip.json           Knip config for hooks
```

### Pre-Commit

Runs on every `git commit`. Executes these checks:

1. **Env guard**: blocks staged production environment files.
2. **Code lint** (`lint:code`): ESLint, Stylelint, HTMLHint, html-validate, JSCPD, Madge, PurgeCSS, Linkinator, Prettier check.
3. **Knip**: unused/dead code detection.
4. **Typos**: spell checking.
5. **Package lint** (`lint:pkg`): package.json validation.
6. **Hooks self-checks** (parallel): lint, security, format, and quality checks on the hook scripts themselves.

### Commit-Msg

Runs commitlint against the commit message. Rejects messages that do not follow conventional commit format.

### Pre-Push

Runs on `git push`. Executes these checks:

1. **Markdown lint**: markdownlint on all markdown files.
2. **External link checking**: validates external URLs referenced in the project.
3. **Security scans**: Gitleaks, OSV, and Semgrep.
4. **License checking**: validates dependency licenses.
5. **Hooks quality**: self-quality check on hook scripts.

### If a Hook Fails

Fix the issue. Do not bypass the hook. The hook caught something real.

## Linting

Run `bun run lint` to check everything. Run `bun run lint:fix` to auto-fix what can be auto-fixed.
Run `bun run setup:tooling` once after cloning if the repo-local CLI cache has not been bootstrapped yet.

Linting is a gate, not a suggestion. Every commit must pass lint.

Never weaken, disable, or bypass any linting rule unless explicitly asked. This includes all tools listed below.
Do not add runtime self-healing downloads to lint commands. Bootstrap pinned local tools first, then run lint.

### Lint Tools

| Tool                | What it checks                                                                 | Script                              |
| ------------------- | ------------------------------------------------------------------------------ | ----------------------------------- |
| ESLint              | JavaScript code quality                                                        | `lint:js`                           |
| Stylelint           | CSS rules                                                                      | `lint:css`                          |
| HTMLHint            | HTML best practices                                                            | `lint:html:hint`                    |
| html-validate       | HTML spec compliance (templates and generated)                                 | `lint:html:validate`                |
| Prettier            | Code formatting                                                                | `format:check`                      |
| JSCPD               | Copy-paste / duplication                                                       | `lint:cpd`                          |
| Madge               | Circular dependencies                                                          | `lint:circular`                     |
| Knip                | Unused/dead code                                                               | `lint:knip`                         |
| PurgeCSS / css-dead | Dead CSS rules                                                                 | `lint:css-dead`                     |
| Linkinator          | Internal and external links                                                    | `lint:links`, `lint:links:external` |
| markdownlint        | Markdown formatting                                                            | `lint:md`                           |
| Semgrep             | Static analysis / security patterns                                            | `lint:semgrep`                      |
| Lizard              | Code complexity                                                                | `lint:complexity`                   |
| ShellCheck          | Shell script correctness                                                       | `lint:sh:check`                     |
| shfmt               | Shell script formatting                                                        | `lint:sh:format`                    |
| typos               | Spell checking                                                                 | `lint:typos`                        |
| license-checker     | Dependency license validation                                                  | `lint:license`                      |
| Custom HTML copy    | HTML copy validation                                                           | `lint:html:copy`                    |
| Custom package lint | package.json structure and integrity                                           | `lint:pkg`, `lint:sanity`           |
| Custom shell tools  | Shell naming, length, docs, structure, unused functions, disable justification | `lint:sh:*`                         |

### JSCPD Thresholds

JSCPD thresholds are frozen. Never change them for any reason.

| Config                       | Threshold | Scope                |
| ---------------------------- | --------- | -------------------- |
| `.jscpd/*.json` (root)       | 4%        | JS, CSS, Bash source |
| `.githooks/.jscpd/bash.json` | 20%       | Hook shell scripts   |

If JSCPD reports duplication above the threshold, refactor the duplicated code. Do not raise the threshold to make the check pass.

## Security Scanning

Run `bun run security:scan` to run all security scans (Gitleaks, OSV, Semgrep).
Security scans use the pinned repo-local tooling cache in `linting/.tools/`. Bootstrap it with
`bun run setup:tooling` or `bun run setup:hooks` before relying on those scans.

Run security scans after:

- Adding or updating dependencies.
- Touching environment variable handling or analytics configuration.
- Any change where you are not certain there is no security impact.

## Protected Files

The following files must never be modified unless the user explicitly asks:

- `.license-checker.json`

## Scope Discipline

Do what was asked. Do not expand scope. Do not add features, refactor surrounding code, or "improve" things that were not requested. If you find something unrelated that needs fixing, mention it. Do not silently fix it unless it is trivial and in a file you are already editing.
