import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAlreadyAuthenticated } from '../services/api';

declare global {
  interface Window {
    toggleArmoryPanel?: (panel: 'taverne' | 'armory') => void;
    expandArmoryPanel?: (panel: 'taverne' | 'armory') => void;
  }
}

export function ArmoryPage() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Armurerie — Grimoire';

    if (!isAlreadyAuthenticated()) {
      navigate('/login', { replace: true });
      return;
    }

    let cancelled = false;

    async function bootArmory() {
      const armoryCssLink = document.querySelector<HTMLLinkElement>(
        'link[href*="/styles/pages/armory.css"]'
      );
      const targetCssHref = '/styles/pages/armory.css?v=1786180000016';
      if (armoryCssLink && !armoryCssLink.href.endsWith(targetCssHref)) {
        armoryCssLink.href = targetCssHref;
      }

      const uiUrl = '/js/ui.js?v=2';
      const authUrl = '/js/services/auth.js?v=32';
      const spiderUrl = '/js/pages/hero-spider.js?v=19';
      const armoryUrl = '/js/pages/armory.js?v=123';

      await import(/* @vite-ignore */ uiUrl);
      await import(/* @vite-ignore */ authUrl);
      await import(/* @vite-ignore */ spiderUrl);
      await import(/* @vite-ignore */ armoryUrl);
      if (!cancelled && typeof window.initArmoryPage === 'function') {
        await window.initArmoryPage();
      }
    }

    bootArmory().catch((err) => {
      console.error('Erreur initialisation Armurerie:', err);
    });

    return () => {
      cancelled = true;
      window.hideGlobalTooltip?.(true);
      window.GrimoireTutorial?.stop?.();
    };
  }, [navigate]);

  return (
    <>
      <div className="armory-main" id="armoryMain">
        {/* Barre latérale repliée : Taverne (affichée quand la Taverne est pliée à gauche) */}
        <button
          type="button"
          id="taverneCollapsedDock"
          className="armory-collapsed-dock dock-left is-hidden"
          onClick={() => window.toggleArmoryPanel?.('taverne')}
          title="Déplier la Taverne (Recrutement)"
        >
          <span className="armory-dock-expand-icon">
            <span className="material-symbols-outlined">chevron_right</span>
          </span>
          <span className="material-symbols-outlined text-warning text-xl">
            sports_bar
          </span>
          <span className="armory-dock-label">Taverne</span>
          <span className="armory-dock-badge" id="taverneDockLimitBadge">
            -/-
          </span>
        </button>

        {/* Colonne Gauche : Taverne (Formulaire de Création) */}
        <div className="armory-form-panel" id="charFormPanel">
          <div className="armory-panel-header" id="formTitle">
            <div className="armory-panel-title" id="formTitleText">
              <span className="material-symbols-outlined">sports_bar</span>
              Taverne — Recrutement
            </div>
            <div className="armory-panel-controls">
              <div className="armory-limit-pill" id="charLimitContainer">
                <span className="text-muted text-sm font-medium" id="charLimitText">
                  -/-
                </span>
              </div>
              <button
                type="button"
                id="btnCollapseTaverne"
                className="armory-panel-toggle-btn is-fold-btn"
                onClick={() => window.toggleArmoryPanel?.('taverne')}
                title="Plier la Taverne sur le côté gauche"
              >
                <span className="material-symbols-outlined">chevron_left</span>
                <span>Plier</span>
              </button>
            </div>
          </div>

          <div className="taverne-workspace">
            {/* Sous-colonne Sélection (Nom, Roue en étoile, Spiritualité, Actions) */}
            <div className="taverne-selection-col">
              {/* 1. Identité du Héros */}
              <div className="armory-form-card">
                <div className="armory-field">
                  <label className="armory-field-label" htmlFor="charName">
                    <span className="armory-step-badge">1</span>
                    <span className="material-symbols-outlined text-warning">
                      badge
                    </span>
                    <span>Nom du personnage</span>
                  </label>
                  <input
                    type="text"
                    id="charName"
                    className="armory-name-input"
                    placeholder="Ex: Aldric le Sage, Sombria..."
                    required
                  />
                </div>
              </div>

              {/* 2 & 3. Panneau unifié : Voie (Roue en étoile) & Spiritualité */}
              <div className="armory-form-card armory-affiliations-card">
                <div className="armory-affiliations-grid">
                  {/* Colonne Gauche : Voie */}
                  <div className="armory-affil-voie-col">
                    <div className="armory-field">
                      <div className="armory-field-header">
                        <label className="armory-field-label" htmlFor="charVoie">
                          <span className="armory-step-badge">2</span>
                          <span className="material-symbols-outlined text-purple">
                            route
                          </span>
                          <span>Voie</span>
                        </label>
                        <div className="flex items-center gap-2">
                          <span
                            className="armory-info-chip cursor-help hidden"
                            id="charVoieInfoIcon"
                            data-child-tooltip="true"
                            data-prefer-top=""
                            onMouseEnter={(e) =>
                              window.showGlobalTooltip?.(e.currentTarget)
                            }
                            onMouseLeave={() => window.hideGlobalTooltip?.()}
                          >
                            <span className="material-symbols-outlined text-sm">info</span>
                            <span>Passif</span>
                            <template className="tooltip-data"></template>
                          </span>
                        </div>
                      </div>

                      <div
                        className="voie-star-wheel-wrapper"
                        id="charVoieWrapper"
                        role="radiogroup"
                        aria-label="Roue astrale des Voies"
                        tabIndex={0}
                      >
                        <div className="voie-star-stage">
                          <div className="voie-star-top-crown" title="Voie sélectionnée">
                            <span className="material-symbols-outlined">keyboard_double_arrow_down</span>
                          </div>
                          <div className="voie-star-ring" id="charVoieOptions"></div>
                          <div className="voie-star-center" id="charVoieLabel">
                            <span className="material-symbols-outlined voie-star-center-icon text-muted">
                              explore
                            </span>
                            <span className="voie-star-center-title">Choisir une Voie</span>
                          </div>
                        </div>
                        <input type="hidden" id="charVoie" defaultValue="" />
                      </div>
                    </div>

                    <div className="armory-field hidden">
                      <label htmlFor="charExperience">
                        <span className="material-symbols-outlined text-purple">
                          star
                        </span>
                        Expérience
                      </label>
                      <input
                        type="number"
                        id="charExperience"
                        min={0}
                        defaultValue={0}
                      />
                    </div>
                  </div>

                  {/* Colonne Droite : Spiritualité (Triangle Mystique à 3 choix) */}
                  <div className="armory-affil-spirit-col">
                    <div className="armory-field flex-1">
                      <div className="armory-field-header">
                        <label className="armory-field-label" htmlFor="charSpirit">
                          <span className="armory-step-badge">3</span>
                          <span className="material-symbols-outlined text-orange-400">
                            psychology
                          </span>
                          <span>Spiritualité</span>
                        </label>
                        <div className="flex items-center gap-2">
                          <span
                            className="armory-info-chip armory-info-chip-spirit cursor-help hidden"
                            id="charSpiritInfoIcon"
                            data-child-tooltip="true"
                            data-prefer-top=""
                            onMouseEnter={(e) =>
                              window.showGlobalTooltip?.(e.currentTarget)
                            }
                            onMouseLeave={() => window.hideGlobalTooltip?.()}
                          >
                            <span className="material-symbols-outlined text-sm">info</span>
                            <span>Passif</span>
                            <template className="tooltip-data"></template>
                          </span>
                        </div>
                      </div>

                      <div
                        className="spirit-triangle-wrapper"
                        id="charSpiritWrapper"
                        role="radiogroup"
                        aria-label="Triangle mystique des Spiritualités"
                        tabIndex={0}
                      >
                        <div className="spirit-triangle-stage" id="charSpiritStage">
                          <div className="spirit-triangle-ring" id="charSpiritOptions"></div>
                          <div className="spirit-triangle-center" id="charSpiritLabel">
                            <span className="material-symbols-outlined spirit-triangle-center-icon text-muted">
                              change_history
                            </span>
                            <span className="spirit-triangle-center-title">Choisir</span>
                          </div>
                        </div>
                        <input type="hidden" id="charSpirit" defaultValue="" />
                      </div>
                    </div>

                    <div className="armory-field hidden">
                      <label htmlFor="charSpiritExperience">
                        <span className="material-symbols-outlined text-orange-400">
                          star
                        </span>
                        Expérience Spirituelle
                      </label>
                      <input
                        type="number"
                        id="charSpiritExperience"
                        min={0}
                        defaultValue={0}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats Admin */}
              <div className="flex flex-col gap-5 hidden" id="baseStatsSection">
                <div className="armory-section-title">
                  <span className="material-symbols-outlined text-success">
                    monitoring
                  </span>
                  Statistiques de Base
                </div>

                <div className="armory-form-row">
                  <div className="armory-field">
                    <label htmlFor="charHp">
                      <span className="material-symbols-outlined text-pink">
                        favorite
                      </span>
                      PV Max
                    </label>
                    <input type="number" id="charHp" min={1} defaultValue={100} />
                  </div>
                  <div className="armory-field">
                    <label htmlFor="charMana">
                      <span className="material-symbols-outlined text-info">
                        water_drop
                      </span>
                      Mana Max
                    </label>
                    <input type="number" id="charMana" min={0} defaultValue={100} />
                  </div>
                </div>

                <div className="armory-form-row quad">
                  <div className="armory-field">
                    <label htmlFor="charPower">
                      <span className="material-symbols-outlined text-purple">
                        auto_awesome
                      </span>
                      Puissance
                    </label>
                    <input type="number" id="charPower" min={0} defaultValue={10} />
                  </div>
                  <div className="armory-field">
                    <label htmlFor="charStrength">
                      <span className="material-symbols-outlined text-rose-500">
                        fitness_center
                      </span>
                      Force
                    </label>
                    <input
                      type="number"
                      id="charStrength"
                      min={0}
                      defaultValue={10}
                    />
                  </div>
                  <div className="armory-field">
                    <label htmlFor="charArmor">
                      <span className="material-symbols-outlined text-info">
                        shield
                      </span>
                      Armure
                    </label>
                    <input type="number" id="charArmor" min={0} defaultValue={5} />
                  </div>
                  <div className="armory-field">
                    <label htmlFor="charResistance">
                      <span className="material-symbols-outlined text-success">
                        shield
                      </span>
                      Résistance
                    </label>
                    <input
                      type="number"
                      id="charResistance"
                      min={0}
                      defaultValue={5}
                    />
                  </div>
                </div>

                <div className="armory-form-row">
                  <div className="armory-field">
                    <label htmlFor="charSpeed">
                      <span className="material-symbols-outlined text-warning">
                        bolt
                      </span>
                      Vitesse
                    </label>
                    <input type="number" id="charSpeed" min={0} defaultValue={1} />
                  </div>
                  <div className="armory-field">
                    <label htmlFor="charCrit">
                      <span className="material-symbols-outlined text-danger">
                        gps_fixed
                      </span>
                      Critique (%)
                    </label>
                    <input
                      type="number"
                      id="charCrit"
                      min={0}
                      max={100}
                      defaultValue={5}
                    />
                  </div>
                </div>

                <div className="armory-form-row">
                  <div className="armory-field">
                    <label htmlFor="charRegenHp">
                      <span className="material-symbols-outlined text-pink">
                        healing
                      </span>
                      Régen PV
                    </label>
                    <input type="number" id="charRegenHp" min={0} defaultValue={2} />
                  </div>
                  <div className="armory-field">
                    <label htmlFor="charRegenMana">
                      <span className="material-symbols-outlined text-info">
                        cyclone
                      </span>
                      Régen Mana
                    </label>
                    <input
                      type="number"
                      id="charRegenMana"
                      min={0}
                      defaultValue={4}
                    />
                  </div>
                </div>
              </div>

              {/* Boutons Forger / Annuler */}
              <div className="flex items-center gap-[0.6rem]">
                <button
                  className="armory-submit-btn"
                  type="button"
                  id="submitBtn"
                  onClick={() => window.submitPersonnage?.()}
                >
                  <span className="material-symbols-outlined text-lg">
                    person_add
                  </span>
                  Forger le Personnage
                </button>
                <button
                  className="armory-nav-link hidden"
                  type="button"
                  id="cancelBtn"
                  onClick={() => window.resetForm?.()}
                >
                  Annuler
                </button>
              </div>
            </div>

            {/* Sous-colonne Profil & Toile des spécificités (Toile + Modificateurs + Passifs) */}
            <div className="taverne-profile-col">
              <div id="armorySpiderSection" className="armory-spider-section is-visible">
                <div className="armory-spider-header">
                  <div className="armory-spider-title-wrap">
                    <span className="material-symbols-outlined text-cyan-400">
                      hub
                    </span>
                    <span className="armory-spider-title">
                      Profil &amp; Spécificités du Héros
                    </span>
                    <span
                      className="material-symbols-outlined text-purple text-lg cursor-help hidden"
                      id="spiderVoieInfoIcon"
                      data-child-tooltip="true"
                      data-prefer-top=""
                      onMouseEnter={(e) =>
                        window.showGlobalTooltip?.(e.currentTarget)
                      }
                      onMouseLeave={() => window.hideGlobalTooltip?.()}
                    >
                      info
                      <template className="tooltip-data"></template>
                    </span>
                    <span
                      className="material-symbols-outlined text-orange-400 text-lg cursor-help hidden"
                      id="spiderSpiritInfoIcon"
                      data-child-tooltip="true"
                      data-prefer-top=""
                      onMouseEnter={(e) =>
                        window.showGlobalTooltip?.(e.currentTarget)
                      }
                      onMouseLeave={() => window.hideGlobalTooltip?.()}
                    >
                      info
                      <template className="tooltip-data"></template>
                    </span>
                  </div>
                </div>

                <div className="armory-spider-body">
                  <canvas
                    id="armorySpiderCanvas"
                    className="armory-spider-canvas"
                    width={290}
                    height={255}
                  ></canvas>
                  <div id="armorySpecBadges" className="armory-spider-badges">
                    <span className="text-xs text-muted font-italic">
                      Sélectionnez une Voie sur l&apos;étoile pour révéler ses spécificités
                    </span>
                  </div>
                </div>

                {/* Modificateurs de Départ intégrés au Profil */}
                <div className="armory-voie-mods-block taverne-profile-mods">
                  <div className="armory-sub-label">
                    <span className="material-symbols-outlined text-success">
                      bar_chart
                    </span>
                    <span>Modificateurs de Départ</span>
                  </div>
                  <div className="armory-voie-mods-box" id="voieStatsDiff">
                    <div className="armory-mods-empty">
                      <span className="material-symbols-outlined">tune</span>
                      <span>Sélectionnez une voie sur l&apos;étoile pour voir ses bonus et malus.</span>
                    </div>
                  </div>
                </div>

                {/* Aperçu direct des passifs de Voie et Spiritualité */}
                <div className="taverne-passives-preview" id="tavernePassivesPreview">
                  <div className="taverne-passive-empty">
                    <span className="material-symbols-outlined">auto_stories</span>
                    <span>Les passifs de votre Voie et de votre Spiritualité s&apos;afficheront ici.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Colonne Droite : Armurerie (Liste des Personnages) */}
        <div className="flex flex-col" id="armoryRosterCol">
          <div
            className="armory-list-panel flex-1 flex m-0 flex-col max-h-[calc(100vh-140px)]"
            id="charListPanel"
          >
            <div className="armory-panel-header">
              <div className="armory-panel-title">
                <span className="material-symbols-outlined text-info">
                  shield
                </span>
                <span>Armurerie — Personnages</span>
                <span className="armory-roster-count-pill" id="armoryRosterCount">
                  0
                </span>
              </div>
              <div className="armory-panel-controls">
                <button
                  className="armory-nav-link text-sm"
                  type="button"
                  onClick={() => window.loadPersonnages?.()}
                >
                  <span className="material-symbols-outlined text-base">
                    refresh
                  </span>
                  Actualiser
                </button>
                <button
                  type="button"
                  id="btnCollapseArmory"
                  className="armory-panel-toggle-btn is-fold-btn"
                  onClick={() => window.toggleArmoryPanel?.('armory')}
                  title="Plier l'Armurerie sur le côté droit"
                >
                  <span>Plier</span>
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>
              </div>
            </div>

            <div className="mb-4 flex gap-2 flex-wrap bg-black/20 p-[0.8rem] rounded-lg border border-white/5">
              {/* User Filter Input (hidden by default, for admins) */}
              <div
                className="armory-field flex-1 hidden min-w-[150px]"
                id="searchOwnerContainer"
              >
                <label className="text-[0.7rem] text-slate-500 mb-1 block">
                  <span className="material-symbols-outlined text-md align-bottom">
                    person_search
                  </span>{' '}
                  Nom de compte
                </label>
                <input
                  className="w-full text-sm py-[0.35rem] px-2 bg-black/30 border border-white/10 rounded-md"
                  type="text"
                  id="searchOwner"
                  placeholder="Ex: Admin..."
                  onInput={() => window.filterPersonnages?.()}
                />
              </div>
              <div className="armory-field flex-05 min-w-[150px]">
                <label className="text-[0.7rem] text-slate-500 mb-1 block">
                  <span className="material-symbols-outlined text-md align-bottom">
                    search
                  </span>{' '}
                  Prénom
                </label>
                <input
                  className="w-full text-sm py-[0.35rem] px-2 bg-black/30 border border-white/10 rounded-md"
                  type="text"
                  id="searchName"
                  placeholder="Ex: Lancelot..."
                  onInput={() => window.filterPersonnages?.()}
                />
              </div>
              <div className="armory-field flex-1 min-w-[120px]">
                <label className="text-[0.7rem] text-slate-500 mb-1 block">
                  <span className="material-symbols-outlined text-md align-bottom">
                    route
                  </span>{' '}
                  Voie
                </label>
                <div
                  className="custom-select-wrapper"
                  id="searchVoieWrapper"
                  tabIndex={0}
                >
                  <div className="custom-select-trigger" id="searchVoieTrigger">
                    <span className="cs-label" id="searchVoieLabel">
                      <span className="material-symbols-outlined cs-icon text-muted">
                        trip_origin
                      </span>{' '}
                      Toutes
                    </span>
                    <span className="material-symbols-outlined cs-arrow text-lg">
                      expand_more
                    </span>
                  </div>
                  <div className="custom-select-options" id="searchVoieOptions">
                    <div className="custom-option" data-value="">
                      <span className="material-symbols-outlined cs-icon text-muted">
                        trip_origin
                      </span>{' '}
                      Toutes
                    </div>
                  </div>
                  <input type="hidden" id="searchVoie" defaultValue="" />
                </div>
              </div>
              <div className="armory-field flex-1 min-w-[120px]">
                <label className="text-[0.7rem] text-slate-500 mb-1 block">
                  <span className="material-symbols-outlined text-md align-bottom">
                    psychology
                  </span>{' '}
                  Spiritualité
                </label>
                <div
                  className="custom-select-wrapper"
                  id="searchSpiritWrapper"
                  tabIndex={0}
                >
                  <div
                    className="custom-select-trigger"
                    id="searchSpiritTrigger"
                  >
                    <span className="cs-label" id="searchSpiritLabel">
                      <span className="material-symbols-outlined cs-icon text-muted">
                        trip_origin
                      </span>{' '}
                      Toutes
                    </span>
                    <span className="material-symbols-outlined cs-arrow text-lg">
                      expand_more
                    </span>
                  </div>
                  <div
                    className="custom-select-options"
                    id="searchSpiritOptions"
                  >
                    <div className="custom-option" data-value="">
                      <span className="material-symbols-outlined cs-icon text-muted">
                        trip_origin
                      </span>{' '}
                      Toutes
                    </div>
                  </div>
                  <input type="hidden" id="searchSpirit" defaultValue="" />
                </div>
              </div>
            </div>

            <div className="armory-characters-grid" id="personnagesList">
              <app-loader message="Chargement des personnages..."></app-loader>
            </div>
          </div>
        </div>

        {/* Barre latérale repliée : Armurerie (affichée quand l'Armurerie est pliée à droite) */}
        <button
          type="button"
          id="armoryCollapsedDock"
          className="armory-collapsed-dock dock-right is-hidden"
          onClick={() => window.toggleArmoryPanel?.('armory')}
          title="Déplier l'Armurerie (Personnages)"
        >
          <span className="armory-dock-expand-icon">
            <span className="material-symbols-outlined">chevron_left</span>
          </span>
          <span className="material-symbols-outlined text-info text-xl">
            shield
          </span>
          <span className="armory-dock-label">Armurerie</span>
          <span className="armory-dock-badge" id="armoryDockCountBadge">
            0
          </span>
        </button>
      </div>

      {/* Equipment Modal */}
      <div
        className="equip-modal-overlay"
        id="equipModalOverlay"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            window.closeEquipModal?.();
          }
        }}
      >
        <div className="equip-modal">
          <div className="equip-modal-header">
            <div className="equip-modal-title flex items-center gap-3">
              <div id="equipModalAvatar" className="equip-modal-avatar">
                <span className="material-symbols-outlined text-warning">
                  shield
                </span>
              </div>
              <div className="equip-modal-header-info">
                <span id="equipModalTitle">Équipement</span>
                <div
                  id="equipModalAffiliations"
                  className="equip-modal-affiliations"
                ></div>
              </div>
            </div>
            <button
              className="equip-modal-close"
              type="button"
              onClick={() => window.closeEquipModal?.()}
            >
              <span className="material-symbols-outlined text-2xl">close</span>
            </button>
          </div>

          <div className="equip-modal-body">
            {/* Grille des 6 slots */}
            <div className="equip-slots-grid" id="equipSlotsContainer"></div>
          </div>
        </div>
      </div>

      <div className="blacksmith-cycle">
        <div className="blacksmith work2"></div>
        <div className="blacksmith work1"></div>
        <div className="blacksmith bored"></div>
      </div>

      {/* Spécificités Modal */}
      <div
        className="equip-modal-overlay"
        id="specModalOverlay"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            window.closeSpecModal?.();
          }
        }}
      >
        <div className="equip-modal max-w-[540px]">
          <div className="equip-modal-header">
            <div className="equip-modal-title flex items-center gap-2 flex-wrap">
              <span className="material-symbols-outlined text-cyan-400">
                hub
              </span>
              <span id="specModalTitle" className="font-bold text-white"></span>
              <div
                id="specModalAffiliationBadges"
                className="char-card-badges flex items-center gap-1.5 flex-wrap"
              ></div>
            </div>
            <button
              className="equip-modal-close"
              type="button"
              onClick={() => window.closeSpecModal?.()}
            >
              <span className="material-symbols-outlined text-2xl">close</span>
            </button>
          </div>

          <div className="equip-modal-body flex flex-col items-center gap-3">
            <canvas
              id="specModalCanvas"
              className="armory-spider-canvas"
              width={280}
              height={250}
            ></canvas>
            <div id="specModalBadges" className="armory-spider-badges"></div>
          </div>
        </div>
      </div>

      {/* Notification */}
      <div className="armory-notif" id="armoryNotif"></div>
    </>
  );
}
