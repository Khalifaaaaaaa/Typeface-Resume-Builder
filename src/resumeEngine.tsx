import type { ReactNode } from 'react';

type SectionKind =
  | 'summary'
  | 'education'
  | 'experience'
  | 'projects'
  | 'skills'
  | 'certifications'
  | 'publications'
  | 'awards'
  | 'other';

type HeadingBlock = {
  kind: 'heading';
  level: number;
  content: string;
};

type ParagraphBlock = {
  kind: 'paragraph';
  content: string;
};

type ListBlock = {
  kind: 'list';
  ordered: boolean;
  items: string[];
};

type RuleBlock = {
  kind: 'rule';
};

type ResumeBlock = HeadingBlock | ParagraphBlock | ListBlock | RuleBlock;

type ResumeEntry = {
  title: string;
  blocks: ResumeBlock[];
};

type ResumeSection = {
  title: string;
  kind: SectionKind;
  introBlocks: ResumeBlock[];
  entries: ResumeEntry[];
};

function isBlockBoundary(line: string): boolean {
  return (
    line.length === 0 ||
    /^(#{1,6})\s+/.test(line) ||
    /^[-*]\s+/.test(line) ||
    /^\d+\.\s+/.test(line) ||
    /^---+$/.test(line)
  );
}

function isSafeUrl(url: string): boolean {
  const normalized = url.trim().toLowerCase();

  return (
    normalized.startsWith('https://') ||
    normalized.startsWith('http://') ||
    normalized.startsWith('mailto:') ||
    normalized.startsWith('tel:')
  );
}

function getSectionKind(title: string): SectionKind {
  const normalized = title.trim().toLowerCase();

  if (normalized.includes('summary') || normalized.includes('profile') || normalized.includes('objective')) {
    return 'summary';
  }

  if (normalized.includes('education')) {
    return 'education';
  }

  if (normalized.includes('experience') || normalized.includes('employment') || normalized.includes('work')) {
    return 'experience';
  }

  if (normalized.includes('project')) {
    return 'projects';
  }

  if (normalized.includes('skill') || normalized.includes('technical')) {
    return 'skills';
  }

  if (normalized.includes('certification') || normalized.includes('license')) {
    return 'certifications';
  }

  if (normalized.includes('publication') || normalized.includes('research')) {
    return 'publications';
  }

  if (normalized.includes('award') || normalized.includes('honor')) {
    return 'awards';
  }

  return 'other';
}

function parseBlocks(markdown: string): ResumeBlock[] {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const blocks: ResumeBlock[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index].trim();

    if (!line) {
      index += 1;
      continue;
    }

    const headingMatch = /^(#{1,6})\s+(.+)$/.exec(line);

    if (headingMatch) {
      blocks.push({
        kind: 'heading',
        level: headingMatch[1].length,
        content: headingMatch[2].trim(),
      });

      index += 1;
      continue;
    }

    if (/^---+$/.test(line)) {
      blocks.push({ kind: 'rule' });
      index += 1;
      continue;
    }

    if (/^[-*]\s+/.test(line)) {
      const items: string[] = [];

      while (index < lines.length && /^[-*]\s+/.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(/^[-*]\s+/, '').trim());
        index += 1;
      }

      blocks.push({
        kind: 'list',
        ordered: false,
        items,
      });

      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = [];

      while (index < lines.length && /^\d+\.\s+/.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(/^\d+\.\s+/, '').trim());
        index += 1;
      }

      blocks.push({
        kind: 'list',
        ordered: true,
        items,
      });

      continue;
    }

    const paragraphLines = [line];
    index += 1;

    while (index < lines.length && !isBlockBoundary(lines[index].trim())) {
      paragraphLines.push(lines[index].trim());
      index += 1;
    }

    blocks.push({
      kind: 'paragraph',
      content: paragraphLines.join(' '),
    });
  }

  return blocks;
}

function parseInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /(\*\*[^*]+\*\*|\*[^*\n]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    const token = match[0];

    if (token.startsWith('**') && token.endsWith('**')) {
      nodes.push(<strong key={`${match.index}-strong`}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith('*') && token.endsWith('*')) {
      nodes.push(<em key={`${match.index}-em`}>{token.slice(1, -1)}</em>);
    } else if (token.startsWith('`') && token.endsWith('`')) {
      nodes.push(<code key={`${match.index}-code`}>{token.slice(1, -1)}</code>);
    } else {
      const linkMatch = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(token);

      if (linkMatch) {
        const [, label, href] = linkMatch;

        if (isSafeUrl(href)) {
          nodes.push(
            <a key={`${match.index}-link`} href={href} target="_blank" rel="noreferrer">
              {label}
            </a>,
          );
        } else {
          nodes.push(label);
        }
      }
    }

    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
}

function renderContactContent(text: string): ReactNode {
  const parts = text
    .split('|')
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length <= 1) {
    return parseInline(text);
  }

  return parts.map((part, index) => (
    <span className="resume-contact-part" key={`${part}-${index}`}>
      {parseInline(part)}
      {index < parts.length - 1 ? <span className="resume-contact-separator">|</span> : null}
    </span>
  ));
}

function renderSkillParagraph(content: string, key: string): ReactNode {
  const skillMatch = /^([^:]{2,48}):\s*(.+)$/.exec(content);

  if (!skillMatch) {
    return (
      <p className="resume-paragraph" key={key}>
        {parseInline(content)}
      </p>
    );
  }

  return (
    <p className="resume-skill-line" key={key}>
      <strong>{skillMatch[1]}:</strong> <span>{parseInline(skillMatch[2])}</span>
    </p>
  );
}

function renderBlock(block: ResumeBlock, key: string, sectionKind: SectionKind = 'other'): ReactNode {
  if (block.kind === 'paragraph') {
    if (sectionKind === 'skills') {
      return renderSkillParagraph(block.content, key);
    }

    return (
      <p className="resume-paragraph" key={key}>
        {parseInline(block.content)}
      </p>
    );
  }

  if (block.kind === 'list') {
    const ListTag = block.ordered ? 'ol' : 'ul';

    return (
      <ListTag className={`resume-list ${block.ordered ? 'resume-numbered-list' : ''}`} key={key}>
        {block.items.map((item, itemIndex) => (
          <li key={`${key}-item-${itemIndex}`}>{parseInline(item)}</li>
        ))}
      </ListTag>
    );
  }

  if (block.kind === 'rule') {
    return <hr className="resume-rule" key={key} />;
  }

  return (
    <h4 className="resume-subheading" key={key}>
      {parseInline(block.content)}
    </h4>
  );
}

function renderEntryHeader(title: string): ReactNode {
  const parts = title
    .split('|')
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length >= 2) {
    const main = parts[0];
    const date = parts[parts.length - 1];
    const meta = parts.length > 2 ? parts.slice(1, -1).join(' · ') : '';

    return (
      <header className="resume-entry-header">
        <div className="resume-entry-main">
          <h3 className="resume-entry-title">{parseInline(main)}</h3>
          {meta ? <p className="resume-entry-meta">{parseInline(meta)}</p> : null}
        </div>
        <p className="resume-entry-date">{parseInline(date)}</p>
      </header>
    );
  }

  return (
    <header className="resume-entry-header resume-entry-header-simple">
      <div className="resume-entry-main">
        <h3 className="resume-entry-title">{parseInline(title)}</h3>
      </div>
    </header>
  );
}

function buildSections(blocks: ResumeBlock[], startIndex: number): ResumeSection[] {
  const sections: ResumeSection[] = [];
  let activeSection: ResumeSection | null = null;
  let activeEntry: ResumeEntry | null = null;

  for (let index = startIndex; index < blocks.length; index += 1) {
    const block = blocks[index];

    if (block.kind === 'heading' && block.level === 2) {
      activeSection = {
        title: block.content,
        kind: getSectionKind(block.content),
        introBlocks: [],
        entries: [],
      };

      activeEntry = null;
      sections.push(activeSection);
      continue;
    }

    if (block.kind === 'heading' && block.level >= 3) {
      if (!activeSection) {
        activeSection = {
          title: 'Additional Information',
          kind: 'other',
          introBlocks: [],
          entries: [],
        };

        sections.push(activeSection);
      }

      activeEntry = {
        title: block.content,
        blocks: [],
      };

      activeSection.entries.push(activeEntry);
      continue;
    }

    if (!activeSection) {
      activeSection = {
        title: 'Resume',
        kind: 'other',
        introBlocks: [],
        entries: [],
      };

      sections.push(activeSection);
    }

    if (activeEntry) {
      activeEntry.blocks.push(block);
    } else {
      activeSection.introBlocks.push(block);
    }
  }

  return sections;
}

export function renderResumeMarkdown(markdown: string): ReactNode[] {
  const blocks = parseBlocks(markdown);

  if (blocks.length === 0) {
    return [
      <p className="empty-preview" key="empty">
        Start typing Markdown on the left to build your resume preview.
      </p>,
    ];
  }

  const nameBlockIndex = blocks.findIndex((block) => block.kind === 'heading' && block.level === 1);
  const firstSectionIndex = blocks.findIndex((block) => block.kind === 'heading' && block.level === 2);
  const headerBlocksEnd = firstSectionIndex >= 0 ? firstSectionIndex : blocks.length;
  const contentStartIndex = firstSectionIndex >= 0 ? firstSectionIndex : 0;
  const nodes: ReactNode[] = [];

  if (nameBlockIndex >= 0 && blocks[nameBlockIndex].kind === 'heading') {
    const contactBlocks = blocks
      .slice(nameBlockIndex + 1, headerBlocksEnd)
      .filter((block): block is ParagraphBlock | ListBlock | RuleBlock => block.kind !== 'heading');

    nodes.push(
      <header className="resume-header" key="resume-header">
        <h1 className="resume-name">{parseInline(blocks[nameBlockIndex].content)}</h1>
        {contactBlocks.map((block, index) => {
          if (block.kind === 'paragraph') {
            return (
              <p className="resume-contact-line" key={`contact-${index}`}>
                {renderContactContent(block.content)}
              </p>
            );
          }

          return renderBlock(block, `contact-block-${index}`);
        })}
      </header>,
    );
  }

  const sections = buildSections(blocks, contentStartIndex);

  sections.forEach((section, sectionIndex) => {
    nodes.push(
      <section
        className={`resume-section resume-section-${section.kind}`}
        data-section-kind={section.kind}
        key={`section-${section.title}-${sectionIndex}`}
      >
        <h2 className="resume-section-title">{parseInline(section.title)}</h2>

        {section.introBlocks.length > 0 ? (
          <div className="resume-section-intro">
            {section.introBlocks.map((block, blockIndex) =>
              renderBlock(block, `section-${sectionIndex}-intro-${blockIndex}`, section.kind),
            )}
          </div>
        ) : null}

        {section.entries.map((entry, entryIndex) => (
          <article className="resume-entry" key={`section-${sectionIndex}-entry-${entryIndex}`}>
            {renderEntryHeader(entry.title)}
            {entry.blocks.length > 0 ? (
              <div className="resume-entry-body">
                {entry.blocks.map((block, blockIndex) =>
                  renderBlock(
                    block,
                    `section-${sectionIndex}-entry-${entryIndex}-block-${blockIndex}`,
                    section.kind,
                  ),
                )}
              </div>
            ) : null}
          </article>
        ))}
      </section>,
    );
  });

  if (nodes.length === 0) {
    return [
      <p className="empty-preview" key="empty-fallback">
        Add a resume heading like # Your Name to begin.
      </p>,
    ];
  }

  return nodes;
}