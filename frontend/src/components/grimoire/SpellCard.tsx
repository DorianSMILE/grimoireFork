import { useEffect, useRef } from 'react';

export interface SpellCardProps {
  html: string;
  lvl5Origin?: string | null;
}

const ALLOWED_ELEMENTS = new Set([
  'div',
  'span',
  'p',
  'b',
  'i',
  'strong',
  'em',
  'small',
  'button',
  'br',
  'hr',
]);

const ALLOWED_ATTRIBUTES = new Set([
  'class',
  'id',
  'title',
  'type',
  'role',
]);

function sanitizeNode(source: Node, doc: Document): Node | null {
  if (source.nodeType === Node.TEXT_NODE) {
    return doc.createTextNode(source.textContent ?? '');
  }
  if (source.nodeType !== Node.ELEMENT_NODE) {
    return null;
  }
  const el = source as Element;
  const tag = el.tagName.toLowerCase();
  if (!ALLOWED_ELEMENTS.has(tag)) {
    return null;
  }
  const clean = doc.createElement(tag);
  for (const attr of Array.from(el.attributes)) {
    const name = attr.name.toLowerCase();
    if (ALLOWED_ATTRIBUTES.has(name)) {
      clean.setAttribute(name, attr.value);
    }
  }
  for (const child of Array.from(el.childNodes)) {
    const cleanChild = sanitizeNode(child, doc);
    if (cleanChild) {
      clean.appendChild(cleanChild);
    }
  }
  return clean;
}

function safeSetCardHtml(container: HTMLElement, rawHtml: string): void {
  const elements = Array.from(ALLOWED_ELEMENTS);
  const attributes = Array.from(ALLOWED_ATTRIBUTES);
  const sanitizerHost = container as HTMLElement & {
    setHTML?: (
      input: string,
      options?: { sanitizer?: { elements: string[]; attributes: string[] } }
    ) => void;
  };
  if ('setHTML' in Element.prototype && typeof sanitizerHost.setHTML === 'function') {
    sanitizerHost.setHTML(rawHtml, { sanitizer: { elements, attributes } });
    return;
  }
  const parsed = new DOMParser().parseFromString(rawHtml, 'text/html');
  const fragment = document.createDocumentFragment();
  for (const child of Array.from(parsed.body.childNodes)) {
    const cleanChild = sanitizeNode(child, document);
    if (cleanChild) {
      fragment.appendChild(cleanChild);
    }
  }
  container.replaceChildren(fragment);
}

export function SpellCard({ html, lvl5Origin }: SpellCardProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = wrapperRef.current;
    if (!root) return;
    safeSetCardHtml(root, html);
    if (!lvl5Origin) return;
    const cardEl = root.querySelector('.spell-card') as HTMLElement | null;
    const win = window as Window & {
      attachLvl5CardEffects?: (card: HTMLElement, origin: string) => void;
    };
    if (cardEl && typeof win.attachLvl5CardEffects === 'function') {
      win.attachLvl5CardEffects(cardEl, lvl5Origin);
    }
  }, [html, lvl5Origin]);

  return <div ref={wrapperRef} />;
}

export function SpellEditingPreview() {
  return (
    <div className="editing-preview-container" id="editingSpellPreview">
      <div className="editing-preview-header">
        <div className="editing-preview-title">
          <span className="material-symbols-outlined text-lg">edit_note</span>
          <span>Sort en cours d&apos;édition</span>
        </div>
        <button
          className="btn-danger px-2 py-1 text-sm rounded"
          type="button"
          onClick={() => window.cancelEditSpell?.()}
          title="Annuler l'édition"
        >
          Annuler x
        </button>
      </div>
      <div id="editingSpellCardBody"></div>
    </div>
  );
}
