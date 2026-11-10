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
    initShopPage?: () => Promise<void>;
    cleanupShopPage?: () => void;
    initAlchemyPage?: () => Promise<void>;
    cleanupAlchemyPage?: () => void;
    renderRecipesList?: () => void;
    craftSelected?: () => Promise<void>;
    initHuntingPage?: () => Promise<void>;
    cleanupHuntingPage?: () => void;
    initShopAdminPage?: () => Promise<void>;
    cleanupShopAdminPage?: () => void;
    openCreateUpgradeModal?: () => void;
    initPveAdminPage?: () => Promise<void>;
    cleanupPveAdminPage?: () => void;
    selectLevelOption?: (level: number | string, color: string) => void;
    selectMonsterType?: (value: string, label: string, icon: string, color: string) => void;
    selectMonsterBehavior?: (value: string, label: string, icon: string, color: string) => void;
    cancelMonsterEdit?: () => void;
    renderMonstersList?: () => void;
    selectFilterLevelOption?: (level: number | string, label: string, color: string, icon: string) => void;
    selectMonsterSecretOption?: (value: string, label: string, icon: string, color: string) => void;
    selectSortOption?: (value: string, label: string, icon: string, color: string) => void;
    cancelMutationEdit?: () => void;
    addRoom?: (type: string) => void;
    cancelDungeonEdit?: () => void;
    renderDungeonsList?: () => void;
    initAlchemyAdminPage?: () => Promise<void>;
    cleanupAlchemyAdminPage?: () => void;
    addRequirement?: (type: 'anomalie' | 'consumable', selectedName?: string, qty?: number) => void;
    cancelEdit?: () => void;
    GrimoireTutorial?: { stop?: () => void };
  }
}
