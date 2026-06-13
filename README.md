# Typeface Resume Builder

Typeface Resume Builder is a privacy-first, no-login, single-page resume builder that converts Markdown into a clean ATS-friendly resume preview and exports through the browser print dialog.

## Current phase

Phase 6 Professional Polish is implemented.

## What is included

- Vite + React + TypeScript static frontend
- Clean three-pane workspace
  - Left: Markdown editor
  - Center: live resume preview
  - Right: template controls and export
- Five resume standard buttons
  - Harvard Executive
  - Jake’s Layout / Tech Standard
  - McKinsey Functional
  - Wall Street Investment Banking
  - Academic CV
- Template buttons swap the preview root class only
- Resume-specific Markdown parser
  - Header and contact line detection
  - Section grouping
  - Entry grouping
  - Resume-friendly date and metadata layout
  - Skills line formatting
  - Bullets, numbered lists, dividers, links, bold, italics, and inline code
- Phase 3 resume template styling
  - Harvard Executive: balanced corporate layout with strong black section hierarchy
  - Jake’s Layout / Tech Standard: compact technical layout with clean divider lines
  - McKinsey Functional: consulting-style hierarchy with polished achievement spacing
  - Wall Street Investment Banking: ultra-compact, data-dense one-page-oriented layout
  - Academic CV: formal research-friendly layout with multi-page-friendly spacing
- Phase 5 print/export refinements
  - Latest Markdown syncs before printing
  - Browser-native print / Save as PDF flow using `window.print()`
  - Print CSS hides editor, controls, toolbar, and app chrome
  - Print CSS renders only the resume sheet
  - Page-break rules reduce clipped sections and orphaned headings
- Phase 6 professional polish
  - Cleaner Markdown guidance
  - Better local save status
  - Two-step sample reset safeguard
  - Ctrl/Cmd + Enter print shortcut from the editor
  - More refined right-panel helper text
  - Improved accessibility labels and focus states
  - Lightweight transitions only
- Sample resume Markdown
- Local autosave for Markdown and selected template
- Responsive layout for smaller screens
- Draggable preview canvas with touchpad scrolling support

## Intentional UI decision

The Phase 4 formatting controls were removed from the forward path because they made the interface feel cramped. The app is staying focused and minimal: Markdown input, live preview, template selection, export, and privacy-first helper actions.

## Supported Markdown structure

```md
# Your Name

City, Country | email@example.com | linkedin.com/in/example

## Summary

Short professional summary.

## Experience

### Role Title | Company Name | 2022–Present

- Achievement bullet with metrics.
- Achievement bullet with impact.

## Skills

Languages: TypeScript, JavaScript, Python

Tools: Git, Figma, Playwright