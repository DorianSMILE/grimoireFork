import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAlreadyAuthenticated } from '../services/api';

export function DungeonsPage() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Grimoire - Donjons';

    if (!isAlreadyAuthenticated()) {
      navigate('/login', { replace: true });
      return;
    }

    let cancelled = false;

    async function bootDungeons() {
      const uiUrl = '/js/ui.js?v=2';
      const authUrl = '/js/services/auth.js?v=32';
      const dungeonsUrl = '/js/pages/dungeons.js?v=21';

      await import(/* @vite-ignore */ uiUrl);
      await import(/* @vite-ignore */ authUrl);
      if (typeof window.initDungeonsPage !== 'function') {
        await import(/* @vite-ignore */ dungeonsUrl);
      }
      if (!cancelled && typeof window.initDungeonsPage === 'function') {
        await window.initDungeonsPage();
      }
    }

    bootDungeons().catch((err) => {
      console.error('Erreur initialisation Donjons:', err);
    });

    return () => {
      cancelled = true;
      window.cleanupDungeonsPage?.();
    };
  }, [navigate]);

  return (
    <>
      <main className="vault-container w-full max-w-[1200px] mx-auto p-8">
        <div
          className="text-danger hidden bg-red-500/10 border border-red-500/30 p-4 rounded-lg mb-8 text-center"
          id="authWarning"
        >
          <span className="material-symbols-outlined align-middle mr-2">error</span>
          Vous devez être connecté pour entrer dans un donjon.
        </div>

        <div id="dungeonsContent" className="init-hidden">
          <div className="flex items-center gap-6 mb-2">
            <h2 className="font-outfit text-[2rem] m-0 leading-none">
              <span className="logo-text-gradient logo-dungeon">Exploration</span>
            </h2>
            <button
              type="button"
              onClick={() => window.openJoinLobbyModal?.()}
              className="btn-lobby-join"
            >
              <span className="material-symbols-outlined text-[1rem]">group_add</span>
              Rejoindre un lobby Co-op
            </button>
          </div>
          <p className="text-muted mb-6">
            Choisissez un donjon à affronter. La mort n&apos;est qu&apos;un léger contretemps.
          </p>

          <div className="tabs-header init-hidden" id="dungeonsTabs">
            {/* Rempli par JS */}
          </div>

          <app-loader id="loadingDungeonsMsg" message="Chargement des donjons..."></app-loader>

          <div id="dungeonsSectionsContainer">{/* Rempli par JS */}</div>

          <div id="noDungeonsMsg" className="text-muted hidden">
            Aucun donjon disponible pour le moment.
          </div>
        </div>

        <div id="prepInterface" className="init-hidden">
          <div className="prep-header">
            <div>
              <h2 className="mb-2 font-outfit text-[2rem] text-slate-50 flex items-center gap-2">
                <span className="material-symbols-outlined logo-icon-gradient logo-dungeon text-[2.5rem]">
                  swords
                </span>
                <span className="logo-text-gradient logo-dungeon" id="prepDungeonTitle">
                  Préparation
                </span>
              </h2>
              <div id="prepDungeonDesc" className="text-muted">
                Préparez votre équipe et votre équipement avant de plonger.
              </div>
            </div>
            <button
              id="btnClosePrep"
              type="button"
              onClick={() => window.closePrepInterface?.()}
              className="btn-retour border border-white/10 text-slate-50 py-3 px-6 rounded-lg cursor-pointer flex items-center gap-2 font-inter"
            >
              <span className="material-symbols-outlined text-xl">arrow_back</span> Retour
            </button>
          </div>

          <div className="prep-layout">
            {/* Colonne Gauche : Sélection Personnage */}
            <div>
              <h3 className="font-outfit text-xl text-slate-50 mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-sky-500">group</span> Sélection du
                Héros
                <span className="text-muted text-sm font-normal ml-auto" id="heroCountDisplay">
                  (0 / 1)
                </span>
              </h3>
              <div id="prepCharList">{/* Rempli par JS */}</div>
            </div>

            {/* Colonne Centrale : Aperçu des Stats et Equipement */}
            <div id="prepStatsEquipSection">
              <h3 className="font-outfit text-xl text-slate-50 mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-purple">analytics</span>{' '}
                Statistiques Totales
              </h3>

              <div className="stat-grid hidden" id="prepStatGrid">
                {/* Rempli par JS */}
              </div>
              <div
                id="prepStatEmpty"
                className="flex items-center justify-center h-[194px] w-full text-center text-muted p-4 bg-black/20 rounded-xl border border-dashed border-white/10 mb-8"
              >
                Veuillez sélectionner un personnage pour voir ses statistiques.
              </div>

              <h3 className="mb-4 font-outfit text-xl text-slate-50 flex items-center gap-2 justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-warning">shield</span> Équipement
                  Actuel
                </div>
                <a
                  href="/armory"
                  id="btnArmoryPrepLink"
                  className="btn-armory-link is-hidden"
                  title="Modifier l'équipement dans l'Armurerie"
                >
                  <span className="material-symbols-outlined btn-armory-icon">edit</span>
                  <span>Modifier</span>
                  <span className="material-symbols-outlined btn-armory-arrow">open_in_new</span>
                </a>
              </h3>
              <div id="prepEquipList">
                <div className="text-muted text-sm">Aucun équipement à afficher.</div>
              </div>
            </div>

            {/* Colonne Droite : Consommable & Bouton d'entrée */}
            <div>
              <div id="prepInventorySection">
                <h3 className="font-outfit text-xl text-slate-50 mb-6 flex items-center gap-2 justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-success">inventory_2</span>
                    Inventaire
                  </div>
                </h3>

                <div className="mb-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="consumable-filter cursor-pointer py-1 px-2 rounded-lg text-xs font-semibold border border-red-500/40 bg-red-500/10 text-red-300 flex items-center gap-[0.3rem] opacity-40 transition-all"
                    onClick={(e) => window.toggleConsumableFilter?.(e.currentTarget, 'hp')}
                  >
                    <span className="material-symbols-outlined text-sm">favorite</span> HP
                  </button>
                  <button
                    type="button"
                    className="consumable-filter cursor-pointer py-1 px-2 rounded-lg text-xs font-semibold border border-blue-500/40 bg-blue-500/10 text-blue-300 flex items-center gap-[0.3rem] opacity-40 transition-all"
                    onClick={(e) => window.toggleConsumableFilter?.(e.currentTarget, 'mana')}
                  >
                    <span className="material-symbols-outlined text-sm">water_drop</span> Mana
                  </button>
                  <button
                    type="button"
                    className="consumable-filter cursor-pointer py-1 px-2 rounded-lg text-xs font-semibold border border-orange-500/40 bg-orange-500/10 text-orange-300 flex items-center gap-[0.3rem] opacity-40 transition-all"
                    onClick={(e) => window.toggleConsumableFilter?.(e.currentTarget, 'dmg')}
                  >
                    <span className="material-symbols-outlined text-sm">fitness_center</span>{' '}
                    Dégâts
                  </button>
                  <button
                    type="button"
                    className="consumable-filter cursor-pointer py-1 px-2 rounded-lg text-xs font-semibold border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 flex items-center gap-[0.3rem] opacity-40 transition-all"
                    onClick={(e) => window.toggleConsumableFilter?.(e.currentTarget, 'def')}
                  >
                    <span className="material-symbols-outlined text-sm">shield</span> Protection
                  </button>
                  <button
                    type="button"
                    className="consumable-filter cursor-pointer py-1 px-2 rounded-lg text-xs font-semibold border border-yellow-500/40 bg-yellow-500/10 text-yellow-300 flex items-center gap-[0.3rem] opacity-40 transition-all"
                    onClick={(e) => window.toggleConsumableFilter?.(e.currentTarget, 'xp')}
                  >
                    <span className="material-symbols-outlined text-sm">star</span> XP
                  </button>
                  <button
                    type="button"
                    className="consumable-filter cursor-pointer py-1 px-2 rounded-lg text-xs font-semibold border border-purple-500/40 bg-purple-500/10 text-purple-300 flex items-center gap-[0.3rem] opacity-40 transition-all"
                    onClick={(e) => window.toggleConsumableFilter?.(e.currentTarget, 'util')}
                  >
                    <span className="material-symbols-outlined text-sm">construction</span> Util
                  </button>
                </div>
                <div id="prepWeightCounter"></div>
                <div
                  id="prepConsumableList"
                  className="mb-8 max-h-[250px] overflow-y-auto overflow-x-hidden pr-2"
                >
                  {/* Rempli par JS */}
                </div>
              </div>

              <div
                id="prepRoomsSection"
                className="bg-red-600/5 p-6 rounded-xl border border-red-600/20 mb-6 relative"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="text-sm text-red-300 font-semibold uppercase tracking-[1px]">
                    Ennemis détectés
                  </div>
                  <div
                    className="relative flex items-center justify-center z-50"
                    onMouseEnter={(e) => window.showPrepLootDropdown?.(e.currentTarget)}
                    onMouseLeave={(e) => window.hidePrepLootDropdown?.(e.currentTarget)}
                  >
                    <div
                      id="prepLootTooltipTrigger"
                      className="hidden w-7 h-7 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 items-center justify-center cursor-help transition-all hover:bg-amber-500/20"
                    >
                      <span className="material-symbols-outlined text-[1rem]">shield</span>
                    </div>
                    <div id="prepLootDropdown" className="global-tooltip prep-loot-dropdown"></div>
                  </div>
                </div>
                <div className="text-danger font-medium" id="prepMonstersList">
                  {/* Rempli par JS */}
                </div>
              </div>

              <div id="prepAnomaliesList" className="prep-anomalies-box">
                {/* Rempli par JS */}
              </div>

              {/* Co-op Toggle */}
              <div className="mb-4" id="coopToggleSection">
                <label className="target-toggle-container coop-mode w-full" htmlFor="coopModeToggle">
                  <input
                    className="target-radio"
                    type="checkbox"
                    id="coopModeToggle"
                    onChange={() => window.onCoopToggleChange?.()}
                  />
                  <div className="target-icon-wrap coop-icon">
                    <span className="material-symbols-outlined text-xl">group</span>
                  </div>
                  <div className="target-text coop-text flex-1">
                    Mode Co-op
                    <span className="target-text-sub">
                      Jouez à deux dans le même donjon, tour par tour.
                    </span>
                  </div>
                </label>
              </div>

              <button
                type="button"
                className="btn-fight opacity-50 cursor-not-allowed"
                id="btnEnterDungeon"
                onClick={() => window.startCombat?.()}
              >
                <span className="material-symbols-outlined">swords</span>
                ENTRER DANS LE DONJON
              </button>

              <button
                type="button"
                className="btn-fight btn-coop-lobby hidden opacity-50 cursor-not-allowed"
                id="btnCreateLobby"
                onClick={() => window.createCoopLobby?.()}
              >
                <span className="material-symbols-outlined">group</span>
                CRÉER LE LOBBY CO-OP
              </button>
            </div>
          </div>
        </div>
        <div className="character-agis"></div>
      </main>

      {/* Overlay Lobby Attente (Co-op hôte) */}
      <div
        id="lobbyWaitingOverlay"
        className="lobby-waiting-overlay"
        onClick={() => window.cancelCoopLobby?.()}
      >
        <div className="lobby-modal" onClick={(e) => e.stopPropagation()}>
          <div className="lobby-modal-icon">⚔️</div>
          <h3 className="lobby-modal-title">Lobby Co-op Créé !</h3>
          <p className="lobby-modal-subtitle">Partagez ce code à votre allié :</p>
          <div className="lobby-short-code-container">
            <span id="lobbyShortCode" className="lobby-short-code">
              ------
            </span>
            <button
              type="button"
              onClick={() => window.copyLobbyCode?.()}
              id="btnCopyLobbyCode"
              title="Copier le code"
              className="btn-copy-lobby-code"
            >
              <span className="material-symbols-outlined">content_copy</span>
            </button>
          </div>

          <div id="lobbyCostWarning" className="lobby-cost-warning init-hidden">
            ⚠️ Vous paierez <strong id="lobbyCostAmount">0</strong> Or au moment de lancer le
            donjon.
          </div>

          {/* Aperçu en direct des choix de l'allié */}
          <div id="lobbyGuestPreview" className="init-hidden"></div>

          <div id="lobbyWaitingStatus" className="lobby-waiting-status">
            <span className="material-symbols-outlined">autorenew</span>
            En attente du joueur 2...
          </div>
          <button
            type="button"
            onClick={() => window.cancelCoopLobby?.()}
            className="btn-lobby-cancel"
          >
            <span className="material-symbols-outlined">close</span>
            Annuler le lobby
          </button>
        </div>
      </div>

      {/* Modal Rejoindre un lobby co-op */}
      <div id="joinLobbyModal" className="join-lobby-modal">
        {/* Backdrop */}
        <div
          className="join-lobby-backdrop"
          onClick={() => window.closeJoinLobbyModal?.()}
        ></div>

        {/* Center Panel: Hero Selection & Lobby Info */}
        <div className="join-lobby-panel">
          {/* Header */}
          <div className="join-lobby-header">
            <div className="join-lobby-header-top">
              <h3 className="join-lobby-title">
                <span className="material-symbols-outlined text-sky-400">group_add</span>
                Rejoindre un Co-op
              </h3>
              <button
                type="button"
                onClick={() => window.closeJoinLobbyModal?.()}
                className="join-lobby-close-btn"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <p className="join-lobby-subtitle">
              Entrez le code à 6 caractères partagé par votre allié.
            </p>

            <div className="join-lobby-code-row">
              <input
                id="joinLobbyCodeInput"
                type="text"
                maxLength={6}
                placeholder="EX: A3F7K2"
                className="join-lobby-code-input"
              />
              <button
                type="button"
                onClick={() => window.pasteLobbyCode?.()}
                title="Coller le code"
                className="btn-paste-lobby-code"
              >
                <span className="material-symbols-outlined">content_paste</span>
              </button>
            </div>

            <div id="joinLobbyInfoContainer" className="join-lobby-info-box">
              {/* Info injected by JS */}
            </div>
            <div id="joinLobbyErrorMsg" className="join-lobby-error-msg"></div>
          </div>

          {/* Corps scrollable : héros */}
          <div className="join-lobby-chars-scroll custom-scrollbar">
            <div className="join-lobby-chars-label">
              <span className="material-symbols-outlined text-[0.9rem] text-indigo-400">
                group
              </span>
              Vos héros
            </div>
            <div id="joinLobbyCharSelect">{/* rempli par JS */}</div>
          </div>

          {/* Footer fixe */}
          <div className="join-lobby-footer">
            <button
              type="button"
              onClick={() => window.closeJoinLobbyModal?.()}
              className="btn-join-lobby-cancel"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={() => window.submitJoinLobby?.()}
              id="btnSubmitJoin"
              className="btn-join-lobby-submit"
            >
              <span className="material-symbols-outlined text-[1.1rem]">login</span>
              Rejoindre
            </button>
          </div>
        </div>

        {/* Right Panel: Consumables (drawer droit) */}
        <div id="joinLobbyConsomablesSection" className="join-lobby-consumables-drawer">
          <div className="join-lobby-consumables-header">
            <div className="join-lobby-consumables-title-row">
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[1.2rem] text-emerald">
                  inventory_2
                </span>
                Consomables
              </span>
              <span id="joinConsomableWeight" className="join-lobby-consumables-weight">
                0 / 0
              </span>
            </div>
            <p className="join-lobby-consumables-sub">
              Sélectionnez les objets pour la partie.
            </p>
          </div>
          <div className="join-lobby-consumables-body">
            <div id="joinConsomableList">{/* rempli par JS */}</div>
          </div>
        </div>
      </div>

      {/* Notification Toast */}
      <div
        id="dungeonNotif"
        className="dungeon-notif-element fixed bottom-8 right-8 bg-emerald-500 text-white py-4 px-8 rounded-xl font-medium font-outfit translate-y-[100px] opacity-0 transition-all duration-300 z-[9999]"
      >
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-xl" id="dungeonNotifIcon">
            error
          </span>
          <span id="dungeonNotifText">Action réussie</span>
        </div>
      </div>

      {/* Unlock Dungeon Modal */}
      <div className="unlock-overlay" id="unlockModal">
        <div className="unlock-modal">
          <div className="unlock-modal-icon">
            <span className="material-symbols-outlined text-gold text-[2.2rem]">lock_open</span>
          </div>
          <div className="unlock-modal-title">Débloquer ce donjon ?</div>
          <div className="unlock-modal-desc">
            Ce dévérouillage est <strong className="text-slate-50">définitif</strong> pour votre
            compte. Vous n’aurez plus jamais à payer ce coût.
          </div>
          <div className="unlock-modal-cost">
            <span className="material-symbols-outlined text-[1.3rem]">monetization_on</span>
            <span id="unlockModalCost">0</span> Or
          </div>
          <div className="unlock-modal-actions">
            <button
              type="button"
              className="unlock-btn-cancel"
              onClick={() => window.closeUnlockModal?.()}
            >
              Annuler
            </button>
            <button type="button" className="unlock-btn-confirm" id="unlockModalConfirmBtn">
              <span className="material-symbols-outlined text-lg">lock_open</span>
              Débloquer
            </button>
          </div>
        </div>
      </div>

      {/* Entry Cost Modal */}
      <div className="entry-overlay" id="entryModal">
        <div className="entry-modal">
          <div className="entry-modal-icon">
            <span className="material-symbols-outlined text-danger text-[2.2rem]">swords</span>
          </div>
          <div className="unlock-modal-title">Entrer dans le donjon ?</div>
          <div className="unlock-modal-desc">
            Le coût d&apos;entrée sera déduit de votre Or. Ce coût est prélevé à{' '}
            <strong className="text-slate-50">chaque tentative</strong>.
          </div>
          <div className="unlock-modal-cost border-red-600/25 bg-red-600/10 text-red-300">
            <span className="material-symbols-outlined text-[1.3rem]">monetization_on</span>
            <span id="entryModalCost">0</span> Or
          </div>
          <div className="unlock-modal-actions">
            <button
              type="button"
              className="unlock-btn-cancel"
              onClick={() => window.closeEntryModal?.()}
            >
              Annuler
            </button>
            <button type="button" className="entry-btn-confirm" id="entryModalConfirmBtn">
              <span className="material-symbols-outlined text-lg">swords</span>
              Payer &amp; Entrer
            </button>
          </div>
        </div>
      </div>

      {/* Hero Equipment Tooltip */}
      <div id="heroEquipmentTooltip" className="hero-equipment-tooltip">
        <div id="heroEquipmentTooltipContent" className="hero-equipment-tooltip-content"></div>
      </div>
    </>
  );
}
