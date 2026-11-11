import { useEffect } from 'react';

export function CombatPage() {
  useEffect(() => {
    document.title = 'Grimoire — Combat';
    document.body.classList.add('is-combat-page');
    let cancelled = false;

    const win = window as Window & { __reactCombatMounted?: boolean };
    win.__reactCombatMounted = true;

    async function bootstrapCombat() {
      try {
        const importDynamic = new Function('url', 'return import(url)') as (
          url: string
        ) => Promise<unknown>;

        await importDynamic('/js/services/auth.js?v=32');
        if (cancelled) return;

        await importDynamic('/js/combat/combat-state.js?v=1786180000239');
        if (cancelled) return;

        if (typeof window.initCombatPage === 'function') {
          await window.initCombatPage();
        }
      } catch (err) {
        console.error('Failed to load Combat page scripts:', err);
      }
    }

    bootstrapCombat();

    return () => {
      cancelled = true;
      win.__reactCombatMounted = false;
      document.body.classList.remove('is-combat-page');
      if (typeof window.cleanupCombatPage === 'function') {
        window.cleanupCombatPage();
      }
    };
  }, []);

  return (
    <div className="combat-page-root">
      <div className="combat-header">
        <div className="flex items-center gap-6">
          <div className="page-logo">
            <span className="material-symbols-outlined logo-icon-gradient logo-dungeon">
              swords
            </span>
            <span className="logo-text-gradient logo-dungeon" id="headerDungeonName">
              Combat en cours...
            </span>
          </div>

          <div
            id="bossChallengesContainer"
            className="flex gap-2 items-center flex-wrap justify-start max-w-[40vw]"
          ></div>
        </div>

        <div className="flex items-center gap-6 flex-wrap justify-end">
          <div
            id="bossBuffsContainer"
            className="flex gap-2 items-center flex-wrap justify-end max-w-[40vw]"
          ></div>

          <button
            id="btnCombatEmotes"
            className="combat-emotes-btn is-hidden"
            type="button"
            title="Émotes & Communication"
          >
            <span className="material-symbols-outlined">add_reaction</span>
            <span className="combat-emotes-btn-label">Émotes</span>
          </button>

          <div className="flex items-center gap-2 bg-white/5 py-1 px-3 rounded-lg border border-white/10">
            <span
              className="material-symbols-outlined text-emerald cursor-pointer text-[1.4rem] select-none"
              id="musicToggleBtn"
              onClick={() => window.toggleMusic?.()}
              title="Couper/Activer la musique"
            >
              volume_up
            </span>
            <input
              className="text-emerald w-[80px] cursor-pointer"
              type="range"
              id="musicVolumeSlider"
              min="0"
              max="100"
              defaultValue="50"
              onChange={(e) => window.changeMusicVolume?.(e.currentTarget.value)}
              title="Volume"
            />
          </div>

          <div className="font-outfit text-muted">
            Tour <span id="turnCounter" className="text-slate-50 font-semibold">1</span>
          </div>
        </div>

        <div id="multiTurnBanner" className="multi-turn-banner"></div>
      </div>

      <div className="combat-arena relative overflow-hidden" id="arena">
        {/* Combat Main Side Panel (During combat) */}
        <div
          id="combatMainSidePanelWrapper"
          className="absolute inset-y-0 left-0 w-[320px] -translate-x-full transition-transform duration-300 pointer-events-auto"
        >
          <div className="custom-scrollbar w-full h-full bg-slate-900/95 border-r border-white/10 p-6 flex flex-col overflow-y-auto relative pointer-events-auto">
            <div id="combatMainInventoryContent" className="h-full flex flex-col">
              <h3 className="text-emerald mb-4 text-xl text-center font-outfit flex items-center justify-center gap-2">
                <span className="material-symbols-outlined">inventory_2</span> Inventaire
                <span className="inventory-weight-display text-muted text-sm font-normal"></span>
              </h3>
              <div id="combatMainInventoryList" className="flex flex-col gap-[0.8rem]"></div>
            </div>

            <div id="combatMainMapContent" className="h-full flex flex-col hidden">
              <h3 className="text-blue-400 mb-4 text-xl text-center font-outfit flex items-center justify-center gap-2">
                <span className="material-symbols-outlined">map</span> Carte du Donjon
              </h3>
              <div id="combatMainMapList" className="flex flex-col gap-[0.8rem] relative"></div>
            </div>
          </div>

          <div className="absolute -right-10 top-1/2 -translate-y-1/2 flex flex-col gap-1 pointer-events-auto">
            <div
              id="combatMainInventoryTabBtn"
              className="text-emerald w-10 h-[80px] bg-slate-900/95 border border-l-0 border-white/10 rounded-r-lg flex items-center justify-center cursor-pointer shadow-[5px_0_10px_rgba(0,0,0,0.3)] transition-all opacity-100 hover:opacity-100"
              onClick={() => window.toggleSidePanel?.('combatMain', 'inventory')}
            >
              <span className="material-symbols-outlined">inventory_2</span>
            </div>
            <div
              id="combatMainMapTabBtn"
              className="text-blue-400 w-10 h-[80px] bg-slate-900/95 border border-l-0 border-white/10 rounded-r-lg flex items-center justify-center cursor-pointer shadow-[5px_0_10px_rgba(0,0,0,0.3)] transition-all opacity-50 hover:opacity-100"
              onClick={() => window.toggleSidePanel?.('combatMain', 'map')}
            >
              <span className="material-symbols-outlined">map</span>
            </div>
          </div>
        </div>

        <div className="combat-grid-container" id="playersContainer"></div>

        {/* Combat Log */}
        <div className="combat-log-container retracted" id="combatLogContainerWrapper">
          <button
            className="w-full flex justify-center items-center gap-2 px-4 py-2 bg-slate-900/90 hover:bg-slate-800 border border-white/20 rounded-full shadow-lg backdrop-blur-sm transition-all text-slate-200"
            id="combatLogToggleBtn"
            type="button"
            onClick={() => window.toggleCombatLog?.()}
          >
            <span className="material-symbols-outlined text-[1.2rem]">history</span>
            <span className="font-outfit font-medium text-sm">Journal de combat</span>
          </button>
          <div className="combat-log mt-3 is-hidden" id="combatLog">
            <div className="log-entry log-generic">
              <span className="material-symbols-outlined log-entry-icon log-icon-generic animate-spin">
                progress_activity
              </span>
              <span className="log-entry-text">Chargement du combat...</span>
            </div>
          </div>
        </div>

        {/* Enemies */}
        <div className="combat-grid-container" id="enemiesContainer"></div>

        {/* Room Event Overlay (Treasure/Event) */}
        <div className="event-overlay" id="eventOverlay">
          <div
            id="eventSidePanelWrapper"
            className="absolute inset-y-0 left-0 w-[320px] z-20 -translate-x-full transition-transform duration-300"
          >
            <div className="custom-scrollbar w-full h-full bg-slate-900/95 border-r border-white/10 p-6 flex flex-col overflow-y-auto relative">
              <div id="eventInventoryContent" className="h-full flex flex-col">
                <h3 className="text-emerald mb-4 text-xl text-center font-outfit flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined">inventory_2</span> Inventaire
                  <span className="inventory-weight-display text-muted text-sm font-normal"></span>
                </h3>
                <div id="eventOverlayInventoryList" className="flex flex-col gap-[0.8rem]"></div>
              </div>

              <div id="eventMapContent" className="h-full flex flex-col hidden">
                <h3 className="text-blue-400 mb-4 text-xl text-center font-outfit flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined">map</span> Carte du Donjon
                </h3>
                <div id="eventMapList" className="flex flex-col gap-[0.8rem] relative"></div>
              </div>
            </div>

            <div className="absolute -right-10 top-1/2 -translate-y-1/2 flex flex-col gap-1">
              <div
                id="eventInventoryTabBtn"
                className="text-emerald w-10 h-[80px] bg-slate-900/95 border border-l-0 border-white/10 rounded-r-lg flex items-center justify-center cursor-pointer shadow-[5px_0_10px_rgba(0,0,0,0.3)] transition-all opacity-100 hover:opacity-100"
                onClick={() => window.toggleSidePanel?.('event', 'inventory')}
              >
                <span className="material-symbols-outlined">inventory_2</span>
              </div>
              <div
                id="eventMapTabBtn"
                className="text-blue-400 w-10 h-[80px] bg-slate-900/95 border border-l-0 border-white/10 rounded-r-lg flex items-center justify-center cursor-pointer shadow-[5px_0_10px_rgba(0,0,0,0.3)] transition-all opacity-50 hover:opacity-100"
                onClick={() => window.toggleSidePanel?.('event', 'map')}
              >
                <span className="material-symbols-outlined">map</span>
              </div>
            </div>
          </div>

          <div
            id="eventModalWrapper"
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[99999] w-[90%] flex flex-row items-stretch justify-center gap-6"
          >
            <div
              className="flex flex-col items-center justify-start bg-slate-900/80 border border-white/10 rounded-2xl p-8 md:p-12 shadow-2xl w-full overflow-y-auto custom-scrollbar"
              id="eventModalContainer"
            >
              <span
                className="material-symbols-outlined text-amber mb-4 text-[5rem] flex-shrink-0"
                id="eventIcon"
              >
                money_bag
              </span>
              <div className="result-title mb-4 text-[3rem] flex-shrink-0" id="eventTitle">
                Trésor !
              </div>
              <p
                className="text-muted text-xl mb-8 max-w-[600px] text-center flex-shrink-0"
                id="eventDesc"
              >
                Vous avez trouvé un trésor.
              </p>

              <div
                id="eventLootContainer"
                className="hidden gap-4 flex-wrap justify-center mb-8 w-full"
              ></div>

              <div id="eventActionContainer" className="flex gap-4">
                <button
                  className="action-btn treasure hidden"
                  id="btnOpenChest"
                  type="button"
                  onClick={() => window.openChest?.()}
                >
                  <span className="material-symbols-outlined">lock_open</span> Ouvrir le coffre
                </button>
                <button
                  className="action-btn epic hidden"
                  id="btnOpenChestKey"
                  type="button"
                  onClick={() => window.openChest?.(true)}
                >
                  <span className="material-symbols-outlined">vpn_key</span> Ouvrir (Clé : +10% de
                  butin)
                </button>
                <button
                  className="action-btn info hidden"
                  id="btnContinueEvent"
                  data-next-room-btn="true"
                  data-orig-text="Continuer"
                  type="button"
                >
                  Continuer
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Combat Victory Overlay */}
        <div className="event-overlay" id="combatVictoryOverlay">
          <div
            id="combatVictorySidePanelWrapper"
            className="absolute inset-y-0 left-0 w-[320px] z-20 -translate-x-full transition-transform duration-300"
          >
            <div className="custom-scrollbar w-full h-full bg-slate-900/95 border-r border-white/10 p-6 flex flex-col overflow-y-auto relative">
              <div id="combatVictoryInventoryContent" className="h-full flex flex-col">
                <h3 className="text-emerald mb-4 text-xl text-center font-outfit flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined">inventory_2</span> Inventaire
                  <span className="inventory-weight-display text-muted text-sm font-normal"></span>
                </h3>
                <div
                  id="combatVictoryInventoryList"
                  className="flex flex-col gap-[0.8rem]"
                ></div>
              </div>

              <div id="combatVictoryMapContent" className="h-full flex flex-col hidden">
                <h3 className="text-blue-400 mb-4 text-xl text-center font-outfit flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined">map</span> Carte du Donjon
                </h3>
                <div
                  id="combatVictoryMapList"
                  className="flex flex-col gap-[0.8rem] relative"
                ></div>
              </div>
            </div>

            <div className="absolute -right-10 top-1/2 -translate-y-1/2 flex flex-col gap-1">
              <div
                id="combatVictoryInventoryTabBtn"
                className="text-emerald w-10 h-[80px] bg-slate-900/95 border border-l-0 border-white/10 rounded-r-lg flex items-center justify-center cursor-pointer shadow-[5px_0_10px_rgba(0,0,0,0.3)] transition-all opacity-100 hover:opacity-100"
                onClick={() => window.toggleSidePanel?.('combatVictory', 'inventory')}
              >
                <span className="material-symbols-outlined">inventory_2</span>
              </div>
              <div
                id="combatVictoryMapTabBtn"
                className="text-blue-400 w-10 h-[80px] bg-slate-900/95 border border-l-0 border-white/10 rounded-r-lg flex items-center justify-center cursor-pointer shadow-[5px_0_10px_rgba(0,0,0,0.3)] transition-all opacity-50 hover:opacity-100"
                onClick={() => window.toggleSidePanel?.('combatVictory', 'map')}
              >
                <span className="material-symbols-outlined">map</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center justify-start bg-slate-900/80 border border-white/10 rounded-2xl p-8 md:p-12 fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[99999] max-w-[1000px] w-[90%] min-h-[400px] shadow-2xl max-h-[95vh] overflow-y-auto custom-scrollbar">
            <span className="material-symbols-outlined text-emerald mb-4 text-[5rem] flex-shrink-0">
              emoji_events
            </span>
            <div className="result-title text-emerald mb-4 text-[3rem] flex-shrink-0">
              Victoire !
            </div>
            <p
              className="text-muted text-xl mb-8 max-w-[600px] text-center flex-shrink-0"
              id="combatVictoryDesc"
            ></p>
            <div
              id="combatVictoryXpContainer"
              className="flex gap-4 flex-wrap justify-center mb-8 w-full"
            ></div>
            <button
              className="action-btn bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
              id="btnVictoryContinue"
              data-next-room-btn="true"
              data-orig-text="Continuer l'exploration"
              type="button"
              onClick={() => window.nextRoom?.()}
            >
              Continuer l&apos;exploration
            </button>
          </div>
        </div>

        {/* Result Overlay */}
        <div className="result-overlay" id="resultOverlay">
          <div className="result-title" id="resultTitle">
            VICTOIRE
          </div>
          <p className="text-muted text-xl mb-8" id="resultDesc">
            Le donjon a été complété.
          </p>

          <div id="resultTip" className="result-tip is-hidden">
            <div className="result-tip-header">
              <span className="material-symbols-outlined">lightbulb</span> TIPS
            </div>
            <div id="resultTipText" className="result-tip-text"></div>
          </div>

          <div className="flex gap-4 justify-center mt-8">
            <a
              className="action-btn no-underline"
              id="btnQuitCombatToDungeons"
              href="/dungeons"
              onClick={(e) => {
                if (window.exitCombatToDungeons) {
                  window.exitCombatToDungeons(e.nativeEvent);
                }
              }}
            >
              Retourner à la page des donjons
            </a>
            <a
              className="action-btn no-underline bg-amber-500/20 text-amber-400 border-amber-500/40 hover:bg-amber-500/30 flex items-center gap-1.5 is-hidden"
              id="retryDungeonBtn"
              href="#"
              title="Ouvrir l'écran de lancement de ce donjon"
            >
              <span className="material-symbols-outlined text-lg">restart_alt</span>
              Relancer le donjon
            </a>
          </div>
        </div>
      </div>

      <div className="combat-spells-panel" id="combatSpellsPanel">
        <div className="csp-sidebar">
          <button
            className="csp-tab active"
            data-target="VOIE"
            type="button"
            onClick={() => window.switchSpellTab?.('VOIE')}
          >
            <span className="material-symbols-outlined">explore</span>
            Voies (<span id="countVOIE">0</span>)
          </button>
          <button
            className="csp-tab"
            data-target="SPIRIT"
            type="button"
            onClick={() => window.switchSpellTab?.('SPIRIT')}
          >
            <span className="material-symbols-outlined">auto_awesome</span>
            Spiritualités (<span id="countSPIRIT">0</span>)
          </button>

          <div className="mt-4 border-t border-white/10 pt-4 flex flex-col gap-4">
            <div className="filter-group flex-wrap justify-start mb-2">
              <span className="filter-label">Type:</span>
              <button
                id="combatSpellTypeFilterBtn"
                type="button"
                onClick={() => window.toggleCombatSpellTypeFilter?.()}
                className="flex-shrink-0 flex items-center justify-center bg-slate-900/80 border border-white/10 text-slate-200 rounded-md cursor-pointer outline-none hover:bg-slate-800"
                title="Filtrer par type : Tous"
              >
                <div className="relative w-full h-full csp-type-filter-icons">
                  <span className="material-symbols-outlined absolute text-amber-400 csp-type-icon-instant">
                    bolt
                  </span>
                  <span className="material-symbols-outlined absolute text-blue-400 csp-type-icon-banal">
                    hourglass_empty
                  </span>
                  <span className="material-symbols-outlined absolute text-purple-400 csp-type-icon-channeled">
                    cyclone
                  </span>
                </div>
              </button>
            </div>
          </div>
        </div>

        <div className="csp-center-col">
          <div className="csp-main" id="spellsContainer"></div>
        </div>

        <div className="csp-sidebar csp-sidebar-right">
          <button
            className="action-btn attack mb-2 w-full justify-center whitespace-nowrap"
            id="btnAttack"
            type="button"
            onClick={() => window.initiateCombatCast?.(null)}
            disabled
          >
            <span className="material-symbols-outlined">swords</span>
            Attaque
          </button>

          <div className="flex-1"></div>

          <button
            className="action-btn bg-purple-500/20 text-purple-400 border-purple-500/40 w-full justify-center whitespace-nowrap"
            id="btnEndTurn"
            type="button"
            onClick={() => window.endTurn?.()}
          >
            <span className="material-symbols-outlined">hourglass_top</span>
            Fin de Tour
          </button>
          <button
            className="action-btn flee w-full justify-center whitespace-nowrap"
            id="btnFlee"
            type="button"
            onClick={() => window.promptFlee?.()}
          >
            <span className="material-symbols-outlined">directions_run</span>
            Fuir
          </button>
        </div>
      </div>

      <div className="combat-notif" id="combatNotif">
        <span className="material-symbols-outlined notif-icon">info</span>
        <span id="combatNotifText"></span>
      </div>

      <div className="context-menu hidden" id="targetContextMenu"></div>

      <div id="heroEquipmentTooltip">
        <div id="heroEquipmentTooltipContent"></div>
      </div>

      <div id="combatEmotesPopover" className="combat-emotes-popover is-hidden">
        <div className="combat-emotes-popover-header">
          <span className="material-symbols-outlined">add_reaction</span>
          <span>Émotes &amp; Communication</span>
        </div>
        <div id="combatEmotesGrid" className="combat-emotes-grid"></div>
      </div>

      <div id="combatPingMenu" className="combat-ping-menu is-hidden">
        <div className="combat-ping-menu-header" id="combatPingMenuTitle"></div>
        <div className="combat-ping-menu-items" id="combatPingMenuItems"></div>
      </div>

      <div id="eventOverlayHeroesStats"></div>
    </div>
  );
}
