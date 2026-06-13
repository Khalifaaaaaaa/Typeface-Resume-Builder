import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
} from 'react';
import { renderResumeMarkdown } from './resumeEngine';
import { sampleMarkdown } from './sampleResume';

type TemplateId = 'harvard' | 'jake' | 'mckinsey' | 'wallstreet' | 'academic';

type SaveStatus = 'Saved locally' | 'Saving…';

type ResumeTemplate = {
  id: TemplateId;
  name: string;
  shortName: string;
  description: string;
};

type TrustPoint = {
  label: string;
  copy: string;
};

type PanState = {
  active: boolean;
  startX: number;
  startY: number;
  scrollLeft: number;
  scrollTop: number;
  pageScrollLeft: number;
  pageScrollTop: number;
};

const STORAGE_KEYS = {
  markdown: 'typeface-resume-markdown',
  template: 'typeface-resume-template',
};

const RESET_CONFIRM_MS = 2400;

const templates: ResumeTemplate[] = [
  {
    id: 'harvard',
    name: 'Harvard Executive',
    shortName: 'Harvard',
    description: 'Clean corporate structure with strong headings and right-aligned dates.',
  },
  {
    id: 'jake',
    name: "Jake’s Layout / Tech Standard",
    shortName: 'Jake’s',
    description: 'Compact technical format with divider lines and project-friendly density.',
  },
  {
    id: 'mckinsey',
    name: 'McKinsey Functional',
    shortName: 'McKinsey',
    description: 'Polished consulting hierarchy for achievement-heavy bullets.',
  },
  {
    id: 'wallstreet',
    name: 'Wall Street Investment Banking',
    shortName: 'Wall Street',
    description: 'Ultra-compact layout for data-dense one-page resumes.',
  },
  {
    id: 'academic',
    name: 'Academic CV',
    shortName: 'Academic',
    description: 'Serif-led format for education, research, publications, and teaching.',
  },
];

const trustPoints: TrustPoint[] = [
  {
    label: 'Local editing',
    copy: 'Resume text is kept in this browser through local storage.',
  },
  {
    label: 'No account wall',
    copy: 'No login, subscription, upload flow, or checkout gate.',
  },
  {
    label: 'Native export',
    copy: 'PDFs are created through your browser print dialog.',
  },
  {
    label: 'No AI pipeline',
    copy: 'No AI API reads, rewrites, or stores your resume.',
  },
];

function isTemplateId(value: string | null): value is TemplateId {
  return templates.some((template) => template.id === value);
}

function getInitialMarkdown(): string {
  if (typeof window === 'undefined') {
    return sampleMarkdown;
  }

  return window.localStorage.getItem(STORAGE_KEYS.markdown) ?? sampleMarkdown;
}

function getInitialTemplate(): TemplateId {
  if (typeof window === 'undefined') {
    return 'harvard';
  }

  const savedTemplate = window.localStorage.getItem(STORAGE_KEYS.template);
  return isTemplateId(savedTemplate) ? savedTemplate : 'harvard';
}

function App() {
  const [markdown, setMarkdown] = useState(getInitialMarkdown);
  const [previewMarkdown, setPreviewMarkdown] = useState(markdown);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId>(getInitialTemplate);
  const [copyLabel, setCopyLabel] = useState('Copy Markdown');
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('Saved locally');
  const [isPanning, setIsPanning] = useState(false);
  const [resetConfirming, setResetConfirming] = useState(false);

  const resetTimerRef = useRef<number | null>(null);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const panStateRef = useRef<PanState>({
    active: false,
    startX: 0,
    startY: 0,
    scrollLeft: 0,
    scrollTop: 0,
    pageScrollLeft: 0,
    pageScrollTop: 0,
  });

  const selectedTemplateDetails =
    templates.find((template) => template.id === selectedTemplate) ?? templates[0];

  const renderedResume = useMemo(() => renderResumeMarkdown(previewMarkdown), [previewMarkdown]);

  const stats = useMemo(() => {
    const words = markdown.trim() ? markdown.trim().split(/\s+/).length : 0;
    const sections = markdown.match(/^##\s+/gm)?.length ?? 0;
    const entries = markdown.match(/^###\s+/gm)?.length ?? 0;

    return {
      words,
      sections,
      entries,
      characters: markdown.length,
    };
  }, [markdown]);

  const isMarkdownEmpty = markdown.trim().length === 0;

  useEffect(() => {
    const previewTimer = window.setTimeout(() => {
      setPreviewMarkdown(markdown);
    }, 90);

    return () => {
      window.clearTimeout(previewTimer);
    };
  }, [markdown]);

  useEffect(() => {
    setSaveStatus('Saving…');

    const saveTimer = window.setTimeout(() => {
      window.localStorage.setItem(STORAGE_KEYS.markdown, markdown);
      setSaveStatus('Saved locally');
    }, 450);

    return () => {
      window.clearTimeout(saveTimer);
    };
  }, [markdown]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.template, selectedTemplate);
  }, [selectedTemplate]);

  useEffect(() => {
    const syncPreviewBeforePrint = () => {
      setPreviewMarkdown(markdown);
    };

    window.addEventListener('beforeprint', syncPreviewBeforePrint);

    return () => {
      window.removeEventListener('beforeprint', syncPreviewBeforePrint);
    };
  }, [markdown]);

  useEffect(() => {
    return () => {
      if (resetTimerRef.current) {
        window.clearTimeout(resetTimerRef.current);
      }
    };
  }, []);

  const handlePrint = () => {
    setPreviewMarkdown(markdown);

    window.setTimeout(() => {
      window.print();
    }, 60);
  };

  const handleCopyMarkdown = async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopyLabel('Copied');
    } catch {
      setCopyLabel('Copy failed');
    }

    window.setTimeout(() => {
      setCopyLabel('Copy Markdown');
    }, 1400);
  };

  const handleResetSample = () => {
    if (!resetConfirming && markdown.trim() !== sampleMarkdown.trim()) {
      setResetConfirming(true);

      if (resetTimerRef.current) {
        window.clearTimeout(resetTimerRef.current);
      }

      resetTimerRef.current = window.setTimeout(() => {
        setResetConfirming(false);
      }, RESET_CONFIRM_MS);

      return;
    }

    setMarkdown(sampleMarkdown);
    setPreviewMarkdown(sampleMarkdown);
    setResetConfirming(false);

    if (resetTimerRef.current) {
      window.clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
    }
  };

  const endPan = (event: ReactPointerEvent<HTMLDivElement>) => {
    panStateRef.current.active = false;
    setIsPanning(false);

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) {
      return;
    }

    const target = event.target as HTMLElement;

    if (target.closest('a')) {
      return;
    }

    const frame = frameRef.current;
    const pageScroller = document.scrollingElement ?? document.documentElement;

    if (!frame) {
      return;
    }

    panStateRef.current = {
      active: true,
      startX: event.clientX,
      startY: event.clientY,
      scrollLeft: frame.scrollLeft,
      scrollTop: frame.scrollTop,
      pageScrollLeft: pageScroller.scrollLeft,
      pageScrollTop: pageScroller.scrollTop,
    };

    setIsPanning(true);
    event.currentTarget.setPointerCapture(event.pointerId);
    event.preventDefault();
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const frame = frameRef.current;
    const panState = panStateRef.current;

    if (!frame || !panState.active) {
      return;
    }

    const pageScroller = document.scrollingElement ?? document.documentElement;
    const deltaX = event.clientX - panState.startX;
    const deltaY = event.clientY - panState.startY;

    frame.scrollLeft = panState.scrollLeft - deltaX;
    frame.scrollTop = panState.scrollTop - deltaY;
    pageScroller.scrollLeft = panState.pageScrollLeft - deltaX;
    pageScroller.scrollTop = panState.pageScrollTop - deltaY;
  };

  const handleWheel = (event: ReactWheelEvent<HTMLDivElement>) => {
    if (event.ctrlKey) {
      return;
    }

    const frame = frameRef.current;
    const pageScroller = document.scrollingElement ?? document.documentElement;

    if (!frame) {
      return;
    }

    const horizontalDelta = event.shiftKey ? event.deltaY : event.deltaX;
    const verticalDelta = event.deltaY;

    frame.scrollLeft += horizontalDelta;
    frame.scrollTop += verticalDelta;
    pageScroller.scrollLeft += horizontalDelta;
    pageScroller.scrollTop += verticalDelta;

    event.preventDefault();
  };

  const handleEditorKeyDown = (event: ReactKeyboardEvent<HTMLTextAreaElement>) => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      handlePrint();
    }
  };

  return (
    <main className="app-shell">
      <header className="topbar no-print">
        <div className="brand-mark" aria-hidden="true">
          T
        </div>

        <div className="brand-copy">
          <p className="eyebrow">Typeface Resume</p>
          <h1>Markdown to ATS-ready resume</h1>
        </div>

        <div className="topbar-status">
          <span className="status-dot" aria-hidden="true" />
          Client-side only
        </div>
      </header>

      <section className="workspace" aria-label="Typeface Resume workspace">
        <aside className="pane editor-pane no-print" aria-label="Markdown editor pane">
          <div className="pane-header">
            <div>
              <p className="eyebrow">Input</p>
              <h2>Markdown editor</h2>
            </div>

            <span className={`autosave-pill ${saveStatus === 'Saving…' ? 'is-saving' : ''}`}>
              {saveStatus}
            </span>
          </div>

          <div className="editor-hint" aria-label="Markdown guidance">
            <span># Name</span>
            <span>## Section</span>
            <span>### Role | Company | Date</span>
            <span>- Impact bullet</span>
          </div>

          <div className="editor-shell">
            {isMarkdownEmpty ? (
              <div className="empty-editor-helper" aria-hidden="true">
                Start with <strong># Your Name</strong>, then add sections like{' '}
                <strong>## Experience</strong>.
              </div>
            ) : null}

            <textarea
              className="markdown-editor"
              value={markdown}
              onChange={(event) => setMarkdown(event.target.value)}
              onKeyDown={handleEditorKeyDown}
              spellCheck="true"
              aria-label="Resume Markdown editor"
            />
          </div>

          <div className="editor-footer">
            <span>{stats.words} words</span>
            <span>{stats.sections} sections</span>
            <span>{stats.entries} entries</span>
            <span>{stats.characters} characters</span>
          </div>
        </aside>

        <section className="preview-pane" aria-label="Live resume preview pane">
          <div className="preview-toolbar no-print">
            <div>
              <p className="eyebrow">Live Preview</p>
              <h2>{selectedTemplateDetails.name}</h2>
            </div>

            <button
              className="secondary-button"
              type="button"
              onClick={handlePrint}
              title="Print or save as PDF. Shortcut: Ctrl/Cmd + Enter in the editor."
            >
              Print / Save PDF
            </button>
          </div>

          <div
            ref={frameRef}
            className={`paper-frame ${isPanning ? 'is-panning' : ''}`}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={endPan}
            onPointerCancel={endPan}
            onWheel={handleWheel}
            role="region"
            aria-label="Draggable resume preview canvas"
          >
            <article
              id="resume-preview"
              className={`resume-sheet theme-${selectedTemplate}`}
              aria-label={`Resume preview using ${selectedTemplateDetails.name}`}
            >
              {renderedResume}
            </article>
          </div>
        </section>

        <aside className="pane controls-pane no-print" aria-label="Resume controls pane">
          <div className="pane-header">
            <div>
              <p className="eyebrow">Controls</p>
              <h2>Resume standard</h2>
            </div>
          </div>

          <div className="template-list" role="list" aria-label="Template selector">
            {templates.map((template) => (
              <button
                className={`template-button template-${template.id} ${
                  selectedTemplate === template.id ? 'is-active' : ''
                }`}
                type="button"
                key={template.id}
                onClick={() => setSelectedTemplate(template.id)}
                aria-pressed={selectedTemplate === template.id}
              >
                <span>{template.name}</span>
                <small>{template.description}</small>
              </button>
            ))}
          </div>

          <div className="control-card export-card">
            <p className="eyebrow">Export</p>
            <h3>Browser-native PDF</h3>
            <p>
              Opens your browser print dialog. Choose “Save as PDF”. Only the resume sheet
              prints.
            </p>
            <button className="primary-button" type="button" onClick={handlePrint}>
              Print / Save PDF
            </button>
            <p className="microcopy">Shortcut: Ctrl/Cmd + Enter while editing.</p>
          </div>

          <div className="control-actions">
            <button className="secondary-button" type="button" onClick={handleCopyMarkdown}>
              {copyLabel}
            </button>

            <button
              className={`ghost-button ${resetConfirming ? 'is-warning' : ''}`}
              type="button"
              onClick={handleResetSample}
            >
              {resetConfirming ? 'Click again to reset' : 'Reset sample'}
            </button>
          </div>

          <div className="trust-card">
            <p className="eyebrow">Trust</p>
            <h3>Private by default</h3>
            <ul className="trust-list">
              {trustPoints.map((point) => (
                <li key={point.label}>
                  <strong>{point.label}</strong>
                  <span>{point.copy}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="ad-card" role="complementary" aria-label="Sponsored placeholder">
            <p className="eyebrow">Sponsored</p>
            <div className="ad-card-body">
              <span>Native ad placeholder</span>
              <p>Reserved for one clean static sponsor placement. No ad script is loaded yet.</p>
            </div>
          </div>

          <div className="privacy-card">
            <p className="eyebrow">Privacy</p>
            <p>
              No login, uploads, database, server PDF generation, or AI API calls. Your resume
              text stays in this browser.
            </p>
          </div>

          <div className="usage-card" aria-label="Preview navigation tip">
            <p>Scroll normally over the paper, or click and drag to pan the preview.</p>
          </div>
        </aside>
      </section>
    </main>
  );
}

export default App;