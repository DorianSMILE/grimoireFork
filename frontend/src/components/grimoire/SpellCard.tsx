import { useEffect, useRef } from 'react';

export interface SpellCardProps {
  html: string;
  lvl5Origin?: string | null;
}

export function SpellCard({ html, lvl5Origin }: SpellCardProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = wrapperRef.current;
    if (!root || !lvl5Origin) return;
    const cardEl = root.querySelector('.spell-card') as HTMLElement | null;
    const win = window as Window & {
      attachLvl5CardEffects?: (card: HTMLElement, origin: string) => void;
    };
    if (cardEl && typeof win.attachLvl5CardEffects === 'function') {
      win.attachLvl5CardEffects(cardEl, lvl5Origin);
    }
  }, [html, lvl5Origin]);

  return (
    <div
      ref={wrapperRef}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
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
