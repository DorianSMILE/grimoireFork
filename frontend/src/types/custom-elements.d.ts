import 'react';

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'app-navbar': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & { 'active-page'?: string },
        HTMLElement
      >;
      'app-loader': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & { message?: string },
        HTMLElement
      >;
    }
  }
}

declare global {
  interface Window {
    initGrimoirePage?: () => Promise<void>;
    renderEffects?: () => void;
    toggleSpellTargetType?: () => void;
    updateViolenceLabel?: () => void;
    setViolenceType?: (isInspiration: boolean) => void;
    setKarmaAlignment?: (alignment: string) => void;
    addEffectPanel?: (effectType: string) => void;
    submitSpell?: () => void;
    toggleDisplayMode?: () => void;
    loadSpells?: (forceRefresh?: boolean) => Promise<void>;
    resetFilters?: () => void;
    renderFilteredSpells?: () => void;
    toggleSpellTypeFilter?: () => void;
    cancelEditSpell?: () => void;
    showGlobalTooltip?: (el: HTMLElement) => void;
    hideGlobalTooltip?: (immediate?: boolean) => void;
    initArmoryPage?: () => Promise<void>;
    submitPersonnage?: () => Promise<void>;
    resetForm?: () => void;
    loadPersonnages?: () => Promise<void>;
    filterPersonnages?: () => void;
    closeEquipModal?: () => void;
    closeSpecModal?: () => void;
    GrimoireTutorial?: { stop?: () => void };
  }
}
