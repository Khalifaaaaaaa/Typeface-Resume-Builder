# Typeface Resume Builder

Typeface Resume is a privacy-first, no-login, no-subscription, single-page resume builder that converts Markdown into clean, ATS-friendly resumes.

## Current phase

Phase 7 complete: SEO, Monetization & Trust.

This phase adds improved HTML metadata, Open Graph and Twitter/X preview tags, clearer privacy-first trust copy, and a static native ad placeholder in the right-side panel only.

## What it does

- Write or paste resume content in Markdown.
- Preview the resume live on a professional paper canvas.
- Switch between five resume standards:
  - Harvard Executive
  - Jake’s Layout / Tech Standard
  - McKinsey Functional
  - Wall Street Investment Banking
  - Academic CV
- Export through the browser print dialog using Save as PDF.
- Keep resume content client-side.

## Privacy model

Typeface Resume does not add a backend, login, database, upload flow, server-side PDF generator, Puppeteer process, or AI API.

Resume content stays in the user’s browser. Local autosave uses browser local storage only.

## Monetization placeholder

The right panel includes one clean static native ad placeholder. It is intentionally non-functional for now:

- No ad scripts are loaded.
- No tracking code is added.
- The placeholder is outside the resume preview.
- The placeholder is hidden during print/PDF export.

## Tech stack

- Vite
- React
- TypeScript
- Plain CSS
- Browser-native `window.print()` export

## Local development

```bash
npm install
npm run dev