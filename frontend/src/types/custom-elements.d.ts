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
    initDungeonsPage?: () => Promise<void>;
    cleanupDungeonsPage?: () => void;
    openJoinLobbyModal?: () => Promise<void>;
    closeJoinLobbyModal?: () => void;
    closePrepInterface?: () => void;
    toggleConsumableFilter?: (btn: HTMLElement, category: string) => void;
    onCoopToggleChange?: () => void;
    startCombat?: () => Promise<void>;
    createCoopLobby?: () => Promise<void>;
    cancelCoopLobby?: () => Promise<void>;
    copyLobbyCode?: () => void;
    pasteLobbyCode?: () => Promise<void>;
    submitJoinLobby?: () => Promise<void>;
    closeUnlockModal?: () => void;
    closeEntryModal?: () => void;
    showPrepLootDropdown?: (el: HTMLElement) => void;
    hidePrepLootDropdown?: (el: HTMLElement) => void;
    initVaultPage?: () => Promise<void>;
    cleanupVaultPage?: () => void;
    filterVault?: () => void;
    openCreateEqModal?: () => void;
    closeCreateEqModal?: () => void;
    openCreateAnomalieModal?: () => void;
    closeCreateAnomalieModal?: () => void;
    submitEquipment?: () => Promise<void>;
    submitAnomalie?: () => Promise<void>;
    onAnomalieMagicToggleChange?: (el?: HTMLInputElement) => void;
    promptUnlockFeature?: (featureId: string, featureName: string, cost: number) => void;
    GrimoireTutorial?: { stop?: () => void };
  }
}
