import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAlreadyAuthenticated } from '../services/api';

export function VaultPage() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Salle des Coffres — Grimoire';

    if (!isAlreadyAuthenticated()) {
      navigate('/login', { replace: true });
      return;
    }

    let cancelled = false;

    async function bootVault() {
      const uiUrl = '/js/ui.js?v=2';
      const authUrl = '/js/services/auth.js?v=32';
      const vaultUrl = '/js/pages/vault.js?v=110';

      await import(/* @vite-ignore */ uiUrl);
      await import(/* @vite-ignore */ authUrl);
      if (typeof window.initVaultPage !== 'function') {
        await import(/* @vite-ignore */ vaultUrl);
      }
      if (!cancelled && typeof window.initVaultPage === 'function') {
        await window.initVaultPage();
      }
    }

    bootVault().catch((err) => {
      console.error('Erreur initialisation Coffres:', err);
    });

    return () => {
      cancelled = true;
      window.cleanupVaultPage?.();
    };
  }, [navigate]);

  const handleConsommableToggle = (checked: boolean) => {
    if (checked) {
      const anomalieCheckbox = document.getElementById(
        'filterAnomalieOnly',
      ) as HTMLInputElement | null;
      if (anomalieCheckbox) anomalieCheckbox.checked = false;
    }
    window.filterVault?.();
  };

  const handleAnomalieToggle = (checked: boolean) => {
    if (checked) {
      const consCheckbox = document.getElementById(
        'filterConsommableOnly',
      ) as HTMLInputElement | null;
      if (consCheckbox) consCheckbox.checked = false;
    }
    window.filterVault?.();
  };

  return (
    <>
      <div className="fox-cycle">
        <div className="fox"></div>
      </div>

      {/* État non connecté */}
      <div
        id="vaultAuthLocked"
        className="hidden flex flex-col items-center justify-center h-[80vh] text-center text-white"
      >
        <span className="material-symbols-outlined text-crit mb-4 text-[4rem]">lock</span>
        <h1 className="mb-4 text-[2rem] font-outfit">Veuillez vous connecter</h1>
        <p className="text-muted max-w-[400px] mb-8 text-[1.1rem]">
          Vous devez être connecté pour accéder à cette page.
        </p>
      </div>

      {/* État Coffres Bloqués */}
      <div
        id="vaultFeatureLocked"
        className="hidden flex flex-col items-center justify-center h-[80vh] text-center text-white"
      >
        <span className="material-symbols-outlined text-crit mb-4 text-[4rem]">lock</span>
        <h1 className="mb-4 text-[2rem] font-outfit">Coffres Bloqués</h1>
        <p className="text-muted max-w-[400px] mb-8 text-[1.1rem]">
          Vous devez débloquer la Salle des Coffres pour y accéder. L&apos;accès coûte 50 or.
        </p>
        <button
          type="button"
          onClick={() => window.promptUnlockFeature?.('vault', 'Coffres', 50)}
          className="bg-success text-white border-0 py-3 px-6 rounded-lg font-semibold font-outfit cursor-pointer text-[1.1rem] shadow-success transition-all hover:bg-emerald-600"
        >
          Débloquer pour 50{' '}
          <span className="material-symbols-outlined text-[1.2rem] align-middle text-gold">
            monetization_on
          </span>
        </button>
      </div>

      <main className="vault-main" id="vaultMain">
        {/* Toolbar */}
        <div className="vault-toolbar">
          <div className="flex-1 flex gap-4">
            <div className="search-bar flex-1">
              <span className="material-symbols-outlined text-muted text-xl">search</span>
              <input
                type="text"
                id="searchItemName"
                placeholder="Rechercher un objet..."
                aria-label="Rechercher un objet"
                onInput={() => window.filterVault?.()}
              />
            </div>
            <div className="search-bar flex-1 max-w-[250px] hidden" id="searchOwnerContainer">
              <span className="material-symbols-outlined text-muted text-xl">person_search</span>
              <input
                type="text"
                id="searchOwnerName"
                placeholder="Nom de compte..."
                aria-label="Nom de compte"
                onInput={() => window.filterVault?.()}
              />
            </div>
            <button
              type="button"
              className="btn btn-primary vault-btn-create hidden"
              id="btnCreateVaultEq"
              onClick={() => window.openCreateEqModal?.()}
            >
              <span className="material-symbols-outlined icon-md">add_circle</span>
              Forger un Objet
            </button>
            <button
              type="button"
              className="btn vault-btn-create bg-gradient-purple hidden"
              id="btnCreateAnomalie"
              onClick={() => window.openCreateAnomalieModal?.()}
            >
              <span className="material-symbols-outlined icon-md">star</span>
              Créer une Anomalie
            </button>
          </div>

          <div className="filter-group">
            <span className="material-symbols-outlined text-muted text-xl">filter_list</span>

            {/* Custom Select Slot */}
            <div className="custom-select-wrapper w-[160px] z-100">
              <div className="custom-select-trigger">
                <span className="cs-label">
                  <span className="material-symbols-outlined cs-icon text-muted">category</span>{' '}
                  Équipements
                </span>
                <span className="material-symbols-outlined">expand_more</span>
              </div>
              <div className="custom-select-options">
                <div className="custom-option" data-value="">
                  <span className="material-symbols-outlined cs-icon text-muted">category</span>{' '}
                  Équipements
                </div>
                <div className="custom-option" data-value="CASQUE">
                  <span className="material-symbols-outlined cs-icon flip-icon text-power">
                    masks
                  </span>{' '}
                  Casque
                </div>
                <div className="custom-option" data-value="PLASTRON">
                  <span className="material-symbols-outlined cs-icon text-mana">shield</span>{' '}
                  Plastron
                </div>
                <div className="custom-option" data-value="ANNEAU">
                  <span className="material-symbols-outlined cs-icon text-warning">diamond</span>{' '}
                  Anneau
                </div>
                <div className="custom-option" data-value="BOTTES">
                  <span className="material-symbols-outlined cs-icon text-success">footprint</span>{' '}
                  Bottes
                </div>
                <div className="custom-option" data-value="CAPE">
                  <span className="material-symbols-outlined cs-icon text-pv">carpenter</span> Cape
                </div>
                <div className="custom-option" data-value="ARME">
                  <span className="material-symbols-outlined cs-icon text-crit">swords</span> Armes
                  (Toutes)
                </div>
                <div className="custom-option" data-value="ARME_DEUX_MAINS">
                  <span className="material-symbols-outlined cs-icon text-crit">swords</span> Arme
                  2M
                </div>
                <div className="custom-option" data-value="ARME_GAUCHE">
                  <span className="material-symbols-outlined cs-icon text-crit">colorize</span> Arme
                  1M
                </div>
                <div className="custom-option" data-value="ARME_DROITE">
                  <span className="material-symbols-outlined cs-icon text-crit">security</span> Arme
                  Sec.
                </div>
              </div>
              <input type="hidden" id="filterSlot" defaultValue="" />
            </div>

            {/* Custom Select Rarity */}
            <div className="custom-select-wrapper w-[150px] z-99">
              <div className="custom-select-trigger">
                <span className="cs-label">
                  <span className="material-symbols-outlined cs-icon text-muted">star</span>{' '}
                  Raretés
                </span>
                <span className="material-symbols-outlined">expand_more</span>
              </div>
              <div className="custom-select-options">
                <div className="custom-option" data-value="">
                  <span className="material-symbols-outlined cs-icon text-muted">star</span>{' '}
                  Raretés
                </div>
                <div className="custom-option" data-value="COMMUN">
                  <span className="material-symbols-outlined cs-icon text-muted">trip_origin</span>{' '}
                  Commun
                </div>
                <div className="custom-option" data-value="INHABITUEL">
                  <span className="material-symbols-outlined cs-icon text-success">
                    radio_button_checked
                  </span>{' '}
                  Inhabituel
                </div>
                <div className="custom-option" data-value="RARE">
                  <span className="material-symbols-outlined cs-icon text-mana">adjust</span> Rare
                </div>
                <div className="custom-option" data-value="MYTHIQUE">
                  <span className="material-symbols-outlined cs-icon text-orange">diamond</span>{' '}
                  Mythique
                </div>
                <div className="custom-option" data-value="LEGENDAIRE">
                  <span className="material-symbols-outlined cs-icon text-warning">
                    workspace_premium
                  </span>{' '}
                  Légendaire
                </div>
                <div className="custom-option" data-value="EPIQUE">
                  <span className="material-symbols-outlined cs-icon text-crit">whatshot</span>{' '}
                  Épique
                </div>
                <div className="custom-option" data-value="RELIQUE">
                  <span className="material-symbols-outlined cs-icon text-power">webhook</span>{' '}
                  Relique
                </div>
                <div className="custom-option" data-value="MAUDIT">
                  <span className="material-symbols-outlined cs-icon text-maudit">skull</span>{' '}
                  Maudit
                </div>
              </div>
              <input type="hidden" id="filterRarity" defaultValue="" />
            </div>

            {/* Custom Select Status */}
            <div className="custom-select-wrapper w-[140px] z-98">
              <div className="custom-select-trigger">
                <span className="cs-label">
                  <span className="material-symbols-outlined cs-icon text-success">
                    check_circle
                  </span>{' '}
                  Disponible
                </span>
                <span className="material-symbols-outlined">expand_more</span>
              </div>
              <div className="custom-select-options">
                <div className="custom-option" data-value="">
                  <span className="material-symbols-outlined cs-icon text-muted">all_match</span>{' '}
                  Disponibilité
                </div>
                <div className="custom-option" data-value="EQUIPPED">
                  <span className="material-symbols-outlined cs-icon text-mana">person</span> Équipé
                </div>
                <div className="custom-option" data-value="AVAILABLE">
                  <span className="material-symbols-outlined cs-icon text-success">
                    check_circle
                  </span>{' '}
                  Disponible
                </div>
              </div>
              <input type="hidden" id="filterStatus" defaultValue="AVAILABLE" />
            </div>

            <div className="divider-vertical"></div>

            <span className="material-symbols-outlined text-muted text-lg">sort</span>

            {/* Custom Select Sort */}
            <div className="custom-select-wrapper w-[160px] z-97">
              <div className="custom-select-trigger">
                <span className="cs-label">
                  <span className="material-symbols-outlined cs-icon text-warning">stars</span>{' '}
                  Rareté (Meilleurs)
                </span>
                <span className="material-symbols-outlined">expand_more</span>
              </div>
              <div className="custom-select-options">
                <div className="custom-option" data-value="name_asc">
                  <span className="material-symbols-outlined cs-icon text-muted">
                    sort_by_alpha
                  </span>{' '}
                  Nom (A-Z)
                </div>
                <div className="custom-option" data-value="name_desc">
                  <span className="material-symbols-outlined cs-icon text-muted">
                    sort_by_alpha
                  </span>{' '}
                  Nom (Z-A)
                </div>
                <div className="custom-option" data-value="rarity_desc">
                  <span className="material-symbols-outlined cs-icon text-warning">stars</span>{' '}
                  Rareté (Meilleurs)
                </div>
                <div className="custom-option" data-value="rarity_asc">
                  <span className="material-symbols-outlined cs-icon text-muted">stars</span> Rareté
                  (Pires)
                </div>
                <div className="custom-option" data-value="weight_desc">
                  <span className="material-symbols-outlined cs-icon text-crit">scale</span> Poids
                  (Lourds)
                </div>
                <div className="custom-option" data-value="weight_asc">
                  <span className="material-symbols-outlined cs-icon text-success">scale</span>{' '}
                  Poids (Légers)
                </div>
                <div className="custom-option" data-value="not_lootable_first">
                  <span className="material-symbols-outlined cs-icon text-warning">
                    explore_off
                  </span>{' '}
                  Jamais lootables d&apos;abord
                </div>
                <div className="custom-option" data-value="lootable_first">
                  <span className="material-symbols-outlined cs-icon text-mana">explore</span>{' '}
                  Lootables d&apos;abord
                </div>
                <div className="custom-option" data-value="craftable_first">
                  <span className="material-symbols-outlined cs-icon text-info">science</span>{' '}
                  Craftables d&apos;abord
                </div>
                <div className="custom-option" data-value="not_craftable_first">
                  <span className="material-symbols-outlined cs-icon text-muted">science_off</span>{' '}
                  Non craftables d&apos;abord
                </div>
              </div>
              <input type="hidden" id="sortVault" defaultValue="rarity_desc" />
            </div>

            <div className="divider-vertical"></div>

            <div className="type-toggles flex gap-2">
              <label className="type-toggle" title="Afficher uniquement les consommables">
                <input
                  type="checkbox"
                  id="filterConsommableOnly"
                  onChange={(e) => handleConsommableToggle(e.target.checked)}
                />
                <span className="toggle-btn cons">
                  <span className="material-symbols-outlined text-crit-light text-lg">
                    inventory_2
                  </span>
                  Consommables
                </span>
              </label>
              <label className="type-toggle" title="Afficher uniquement les anomalies">
                <input
                  type="checkbox"
                  id="filterAnomalieOnly"
                  onChange={(e) => handleAnomalieToggle(e.target.checked)}
                />
                <span className="toggle-btn ano">
                  <span className="material-symbols-outlined text-lg text-pv">star</span> Anomalies
                </span>
              </label>
              <label
                className="type-toggle hidden"
                id="filterNonLootableContainer"
                title="Afficher uniquement les objets jamais lootables en donjon (Admin)"
              >
                <input
                  type="checkbox"
                  id="filterNonLootableOnly"
                  onChange={() => window.filterVault?.()}
                />
                <span className="toggle-btn non-loot">
                  <span className="material-symbols-outlined text-warning text-lg">
                    explore_off
                  </span>
                  Non lootables
                </span>
              </label>
              <label
                className="type-toggle"
                id="filterCraftableContainer"
                title="Afficher uniquement les objets craftables en Alchimie"
              >
                <input
                  type="checkbox"
                  id="filterCraftableOnly"
                  onChange={() => window.filterVault?.()}
                />
                <span className="toggle-btn craft">
                  <span className="material-symbols-outlined text-info text-lg">science</span>
                  Craftables
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Grid */}
        <div className="vault-grid" id="vaultGrid">
          <app-loader message="Chargement des coffres..."></app-loader>
        </div>
      </main>

      {/* Create/Edit Equipment Modal */}
      <div className="vault-modal-overlay" id="equipCreateModal">
        <div className="equip-modal modal-md">
          <div className="equip-modal-header">
            <div className="equip-modal-title">
              <span className="material-symbols-outlined text-success">build</span>
              <span id="equipModalTitle">Forger un objet</span>
            </div>
            <button
              type="button"
              className="equip-modal-close"
              onClick={() => window.closeCreateEqModal?.()}
            >
              <span className="material-symbols-outlined text-2xl">close</span>
            </button>
          </div>

          <div className="equip-modal-body">
            <div className="equip-create-section">
              <div className="eq-create-row mb-4">
                <div className="form-group justify-start items-start m-0">
                  <label
                    className="target-toggle-container shop-mode w-max"
                    title="Si activé, cet objet sera vendu dans la boutique"
                  >
                    <input className="target-radio" type="checkbox" id="eqAvailableInShop" />
                    <div className="target-icon-wrap shop-icon">
                      <span className="material-symbols-outlined text-xl">storefront</span>
                    </div>
                    <div className="target-text shop-text">
                      Boutique
                      <span className="target-text-sub">En vente</span>
                    </div>
                  </label>
                </div>
              </div>
              <div className="eq-create-row quad">
                <div className="eq-create-field col-span-2">
                  <label htmlFor="eqName">Nom</label>
                  <input type="text" id="eqName" placeholder="Ex: Casque de Fer" />
                </div>
                <div className="eq-create-field">
                  <label>Slot</label>
                  <div className="custom-select-wrapper" id="eqSlotWrapper" tabIndex={0}>
                    <div className="custom-select-trigger" id="eqSlotTrigger">
                      <span className="cs-label" id="eqSlotLabel">
                        Type
                      </span>
                      <span className="material-symbols-outlined cs-arrow text-lg">
                        expand_more
                      </span>
                    </div>
                    <div className="custom-select-options" id="eqSlotOptions"></div>
                    <input type="hidden" id="eqSlot" defaultValue="" />
                  </div>
                </div>
                <div className="eq-create-field">
                  <label>Rareté</label>
                  <div className="custom-select-wrapper" id="eqRarityWrapper" tabIndex={0}>
                    <div className="custom-select-trigger" id="eqRarityTrigger">
                      <span className="cs-label" id="eqRarityLabel">
                        <span className="cs-icon text-muted font-bold">C</span> Commun
                      </span>
                      <span className="material-symbols-outlined cs-arrow text-lg">
                        expand_more
                      </span>
                    </div>
                    <div className="custom-select-options" id="eqRarityOptions">
                      <div
                        className="custom-option rarity-COMMUN"
                        data-value="COMMUN"
                        data-color="#94a3b8"
                        data-letter="C"
                      >
                        <span className="cs-icon text-muted font-bold">C</span> Commun
                      </div>
                      <div
                        className="custom-option rarity-INHABITUEL"
                        data-value="INHABITUEL"
                        data-color="#22c55e"
                        data-letter="I"
                      >
                        <span className="cs-icon text-success font-bold">I</span> Inhabituel
                      </div>
                      <div
                        className="custom-option rarity-RARE"
                        data-value="RARE"
                        data-color="#3b82f6"
                        data-letter="R"
                      >
                        <span className="cs-icon text-mana font-bold">R</span> Rare
                      </div>
                      <div
                        className="custom-option rarity-MYTHIQUE"
                        data-value="MYTHIQUE"
                        data-color="#f97316"
                        data-letter="M"
                      >
                        <span className="cs-icon text-orange font-bold">M</span> Mythique
                      </div>
                      <div
                        className="custom-option rarity-LEGENDAIRE"
                        data-value="LEGENDAIRE"
                        data-color="#eab308"
                        data-letter="L"
                      >
                        <span className="cs-icon text-warning font-bold">L</span> Légendaire
                      </div>
                      <div
                        className="custom-option rarity-EPIQUE"
                        data-value="EPIQUE"
                        data-color="#ef4444"
                        data-letter="E"
                      >
                        <span className="cs-icon text-crit font-bold">E</span> Épique (Max 1)
                      </div>
                      <div
                        className="custom-option rarity-RELIQUE"
                        data-value="RELIQUE"
                        data-color="#a855f7"
                        data-letter="R"
                      >
                        <span className="cs-icon text-power font-bold">R</span> Relique (Max 1)
                      </div>
                      <div
                        className="custom-option rarity-MAUDIT"
                        data-value="MAUDIT"
                        data-color="#7f1d1d"
                        data-letter="M"
                      >
                        <span className="cs-icon text-maudit font-bold">M</span> Maudit
                      </div>
                    </div>
                    <input type="hidden" id="eqRarity" defaultValue="COMMUN" />
                  </div>
                </div>
                <div className="eq-create-field consumable-category-field hidden">
                  <label>Catégorie (Consom.)</label>
                  <div
                    className="custom-select-wrapper"
                    id="eqConsumableCategoryWrapper"
                    tabIndex={0}
                  >
                    <div className="custom-select-trigger" id="eqConsumableCategoryTrigger">
                      <span className="cs-label" id="eqConsumableCategoryLabel">
                        <span className="material-symbols-outlined cs-icon text-muted">
                          inventory_2
                        </span>
                        Autre
                      </span>
                      <span className="material-symbols-outlined cs-arrow text-lg">
                        expand_more
                      </span>
                    </div>
                    <div className="custom-select-options" id="eqConsumableCategoryOptions"></div>
                    <input type="hidden" id="eqConsumableCategory" defaultValue="AUTRE" />
                  </div>
                </div>
              </div>

              <div
                className="hidden eq-create-row mb-4 bg-purple-glass border-dashed p-3 rounded-lg"
                id="eqSpecialEffectRow"
              >
                <div className="eq-create-field">
                  <div className="flex items-center">
                    <label id="eqSpecialEffectLabelTitle" className="text-power">
                      Effet Spécial
                    </label>
                    <span id="eqSpecialEffectInfoContainer"></span>
                  </div>
                  <div className="custom-select-wrapper" id="eqSpecialEffectWrapper" tabIndex={0}>
                    <div className="custom-select-trigger border-purple" id="eqSpecialEffectTrigger">
                      <span className="cs-label" id="eqSpecialEffectLabel">
                        <span className="material-symbols-outlined cs-icon text-muted">
                          not_interested
                        </span>
                        Aucun
                      </span>
                      <span className="material-symbols-outlined cs-arrow text-lg">
                        expand_more
                      </span>
                    </div>
                    <div className="custom-select-options" id="eqSpecialEffectOptions">
                      <div className="custom-option effect-NONE" data-value="NONE">
                        <span className="material-symbols-outlined cs-icon text-muted">
                          not_interested
                        </span>
                        Aucun
                      </div>
                      <div className="custom-option effect-LIFESTEAL" data-value="LIFESTEAL">
                        <span className="material-symbols-outlined cs-icon text-crit">
                          water_drop
                        </span>{' '}
                        Vol de Vie (%)
                      </div>
                      <div className="custom-option effect-THORNS" data-value="THORNS">
                        <span className="material-symbols-outlined cs-icon text-warning">
                          explosion
                        </span>
                        Épines (Renvoi dégâts %)
                      </div>
                      <div className="custom-option effect-MANA_SHIELD" data-value="MANA_SHIELD">
                        <span className="material-symbols-outlined cs-icon text-mana">shield</span>
                        Bouclier de Mana (%)
                      </div>
                      <div className="custom-option effect-CHEAT_DEATH" data-value="CHEAT_DEATH">
                        <span className="material-symbols-outlined cs-icon text-pv-100">
                          self_improvement
                        </span>
                        Ange Gardien (X% PV MAX)
                      </div>
                      <div className="custom-option effect-CRIT_DAMAGE" data-value="CRIT_DAMAGE">
                        <span className="material-symbols-outlined cs-icon text-orange">
                          local_fire_department
                        </span>
                        Dégâts Critiques Bonus (%)
                      </div>
                      <div
                        className="custom-option effect-CURSED_MANA_DRAIN"
                        data-value="CURSED_MANA_DRAIN"
                      >
                        <span className="material-symbols-outlined cs-icon text-dark">opacity</span>{' '}
                        Famine (Drain de mana par tour)
                      </div>
                      <div
                        className="custom-option effect-CURSED_HP_LOSS_ON_MANA"
                        data-value="CURSED_HP_LOSS_ON_MANA"
                      >
                        <span className="material-symbols-outlined cs-icon text-dark">
                          heart_broken
                        </span>
                        Brèche spirituelle (- hp % mana)
                      </div>
                      <div
                        className="custom-option effect-CURSED_MAGIC_DAMAGE_REDUCTION"
                        data-value="CURSED_MAGIC_DAMAGE_REDUCTION"
                      >
                        <span className="material-symbols-outlined cs-icon text-dark">
                          psychology
                        </span>{' '}
                        Folie (% dégâts magique -)
                      </div>
                      <div
                        className="custom-option effect-CURSED_PHYSICAL_DAMAGE_REDUCTION"
                        data-value="CURSED_PHYSICAL_DAMAGE_REDUCTION"
                      >
                        <span className="material-symbols-outlined cs-icon text-dark">
                          sword_rose
                        </span>
                        Faiblesse (% dégâts physique -)
                      </div>
                      <div
                        className="custom-option effect-CURSED_VULNERABILITY"
                        data-value="CURSED_VULNERABILITY"
                      >
                        <span className="material-symbols-outlined cs-icon text-dark">gpp_bad</span>
                        Vulnérabilité (Dégâts subis % +)
                      </div>
                      <div
                        className="custom-option effect-CURSED_HEALING_REDUCTION"
                        data-value="CURSED_HEALING_REDUCTION"
                      >
                        <span className="material-symbols-outlined cs-icon text-dark">healing</span>{' '}
                        Chair putréfiée (Soins % -)
                      </div>
                      <div className="custom-option effect-EXECUTION" data-value="EXECUTION">
                        <span className="material-symbols-outlined cs-icon text-crit">swords</span>
                        Exécution (% Phy)
                      </div>
                      <div
                        className="custom-option effect-MAGIC_OVERLOAD"
                        data-value="MAGIC_OVERLOAD"
                      >
                        <span className="material-symbols-outlined cs-icon text-power">
                          electric_bolt
                        </span>
                        Surcharge (% Mag mana Act)
                      </div>
                      <div className="custom-option effect-VITAL_ARCANE" data-value="VITAL_ARCANE">
                        <span className="material-symbols-outlined cs-icon text-mana">
                          change_circle
                        </span>
                        Arcane Vitale (Régen X% mana)
                      </div>
                      <div
                        className="custom-option effect-OVERHEAL_SHIELD"
                        data-value="OVERHEAL_SHIELD"
                      >
                        <span className="material-symbols-outlined cs-icon text-success">
                          security
                        </span>
                        Bouclier vital (% Surplus Soin en Bouclier)
                      </div>
                      <div className="custom-option effect-CAPILLARITY" data-value="CAPILLARITY">
                        <span className="material-symbols-outlined cs-icon text-mana">
                          water_drop
                        </span>
                        Capillarité (% Vol Mana)
                      </div>
                      <div
                        className="custom-option effect-CURSED_MANA_TAX"
                        data-value="CURSED_MANA_TAX"
                      >
                        <span className="material-symbols-outlined cs-icon text-dark">weight</span>
                        Incantations Lourdes (Coût Mana % +)
                      </div>
                      <div
                        className="custom-option effect-CURSED_DEFAILANCE"
                        data-value="CURSED_DEFAILANCE"
                      >
                        <span className="material-symbols-outlined cs-icon text-dark">shield</span>
                        Défaillance (% Malus Rés/Arm)
                      </div>
                      <div
                        className="custom-option effect-CURSED_BURNING_BLOOD"
                        data-value="CURSED_BURNING_BLOOD"
                      >
                        <span className="material-symbols-outlined cs-icon text-dark">
                          local_fire_department
                        </span>
                        Sang Brûlant (Brûlure X dégâts)
                      </div>
                    </div>
                    <input type="hidden" id="eqSpecialEffect" defaultValue="NONE" />
                  </div>
                </div>
                <div className="eq-create-field">
                  <label
                    htmlFor="eqSpecialEffectValue"
                    id="eqSpecialEffectValueTitle"
                    className="text-power"
                  >
                    Puissance (Valeur)
                  </label>
                  <input
                    type="number"
                    id="eqSpecialEffectValue"
                    defaultValue={0}
                    className="border-purple"
                  />
                </div>
              </div>

              <div className="eq-create-row quad">
                <div className="eq-create-field">
                  <label htmlFor="eqHp" className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-pv text-base align-bottom">
                      favorite
                    </span>{' '}
                    PV
                  </label>
                  <input type="number" id="eqHp" defaultValue={0} />
                </div>
                <div className="eq-create-field">
                  <label htmlFor="eqMana" className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-mana text-base align-bottom">
                      water_drop
                    </span>{' '}
                    Mana
                  </label>
                  <input type="number" id="eqMana" defaultValue={0} />
                </div>
                <div className="eq-create-field non-consumable-stat">
                  <label htmlFor="eqPower" className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-power text-base align-bottom">
                      auto_awesome
                    </span>{' '}
                    Puissance
                  </label>
                  <input type="number" id="eqPower" defaultValue={0} />
                </div>
                <div className="eq-create-field non-consumable-stat">
                  <label htmlFor="eqStr" className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-physic text-base align-bottom">
                      fitness_center
                    </span>{' '}
                    Force
                  </label>
                  <input type="number" id="eqStr" defaultValue={0} />
                </div>
              </div>

              <div className="eq-create-row quad non-consumable-stat">
                <div className="eq-create-field">
                  <label htmlFor="eqArmor" className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-armor text-base align-bottom">
                      shield
                    </span>{' '}
                    Armure
                  </label>
                  <input type="number" id="eqArmor" defaultValue={0} />
                </div>
                <div className="eq-create-field">
                  <label htmlFor="eqRes" className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-resist text-base align-bottom">
                      shield
                    </span>{' '}
                    Résistance
                  </label>
                  <input type="number" id="eqRes" defaultValue={0} />
                </div>
                <div className="eq-create-field">
                  <label htmlFor="eqSpeed" className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-speed text-base align-bottom">
                      bolt
                    </span>{' '}
                    Vitesse
                  </label>
                  <input type="number" id="eqSpeed" defaultValue={0} />
                </div>
                <div className="eq-create-field">
                  <label htmlFor="eqCrit" className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-crit text-base align-bottom">
                      gps_fixed
                    </span>{' '}
                    Critique
                  </label>
                  <input type="number" id="eqCrit" defaultValue={0} />
                </div>
              </div>

              <div className="eq-create-row non-consumable-stat">
                <div className="eq-create-field">
                  <label htmlFor="eqRegenHp" className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-resist text-base align-bottom">
                      healing
                    </span>{' '}
                    Régen PV / tour
                  </label>
                  <input
                    type="number"
                    id="eqRegenHp"
                    defaultValue={0}
                    placeholder="Positif ou Négatif"
                  />
                </div>
                <div className="eq-create-field">
                  <label htmlFor="eqRegenMana" className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-mana text-base align-bottom">
                      cyclone
                    </span>{' '}
                    Régen Mana / tour
                  </label>
                  <input
                    type="number"
                    id="eqRegenMana"
                    defaultValue={0}
                    placeholder="Positif ou Négatif"
                  />
                </div>
              </div>

              <div className="eq-create-row quad consumable-stat hidden">
                <div className="eq-create-field">
                  <label htmlFor="eqConsumableHpPercent" className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-pv text-base align-bottom">
                      percent
                    </span>{' '}
                    PV (Max)
                  </label>
                  <input type="number" id="eqConsumableHpPercent" defaultValue={0} />
                </div>
                <div className="eq-create-field">
                  <label htmlFor="eqConsumableManaPercent" className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-mana text-base align-bottom">
                      percent
                    </span>{' '}
                    Mana (Max)
                  </label>
                  <input type="number" id="eqConsumableManaPercent" defaultValue={0} />
                </div>
                <div className="eq-create-field">
                  <label htmlFor="eqConsumableMissingHpPercent" className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-pv-manquant text-base align-bottom">
                      heart_broken
                    </span>{' '}
                    PV (Manq)
                  </label>
                  <input type="number" id="eqConsumableMissingHpPercent" defaultValue={0} />
                </div>
                <div className="eq-create-field">
                  <label
                    htmlFor="eqConsumableMissingManaPercent"
                    className="flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-mana-manquant text-base align-bottom">
                      cyclone
                    </span>{' '}
                    Mana (Manq)
                  </label>
                  <input type="number" id="eqConsumableMissingManaPercent" defaultValue={0} />
                </div>
              </div>

              <div className="eq-create-row quad consumable-stat hidden mt-4">
                <div className="eq-create-field">
                  <label
                    htmlFor="eqConsumableBonusPhysicalDamagePercent"
                    className="flex items-center gap-1 text-xs"
                  >
                    <span className="material-symbols-outlined text-physic text-base align-bottom">
                      fitness_center
                    </span>
                    % Dégâts Phy (Buff)
                  </label>
                  <input
                    type="number"
                    id="eqConsumableBonusPhysicalDamagePercent"
                    defaultValue={0}
                  />
                </div>
                <div className="eq-create-field">
                  <label
                    htmlFor="eqConsumableBonusMagicalDamagePercent"
                    className="flex items-center gap-1 text-xs"
                  >
                    <span className="material-symbols-outlined text-power text-base align-bottom">
                      auto_awesome
                    </span>
                    % Dégâts Mag (Buff)
                  </label>
                  <input
                    type="number"
                    id="eqConsumableBonusMagicalDamagePercent"
                    defaultValue={0}
                  />
                </div>
                <div className="eq-create-field">
                  <label
                    htmlFor="eqConsumableBonusArmorFlat"
                    className="flex items-center gap-1 text-xs"
                  >
                    <span className="material-symbols-outlined text-armor text-base align-bottom">
                      shield
                    </span>
                    Armure (Buff)
                  </label>
                  <input type="number" id="eqConsumableBonusArmorFlat" defaultValue={0} />
                </div>
                <div className="eq-create-field">
                  <label
                    htmlFor="eqConsumableBonusResistanceFlat"
                    className="flex items-center gap-1 text-xs"
                  >
                    <span className="material-symbols-outlined text-resist text-base align-bottom">
                      shield
                    </span>
                    Résistance (Buff)
                  </label>
                  <input type="number" id="eqConsumableBonusResistanceFlat" defaultValue={0} />
                </div>
              </div>

              <div className="eq-create-row quad consumable-stat hidden mt-4">
                <div className="eq-create-field">
                  <label
                    htmlFor="eqConsumableBonusXpPercent"
                    className="flex items-center gap-1 text-xs"
                  >
                    <span className="material-symbols-outlined text-warning text-base align-bottom">
                      star
                    </span>
                    % XP Bonus (Buff)
                  </label>
                  <input type="number" id="eqConsumableBonusXpPercent" defaultValue={0} />
                </div>
                <div className="eq-create-field">
                  <label
                    htmlFor="eqConsumableDurationTurns"
                    className="flex items-center gap-1 text-xs"
                  >
                    <span className="material-symbols-outlined text-muted text-base align-bottom">
                      hourglass_bottom
                    </span>
                    Durée (Tours)
                  </label>
                  <input type="number" id="eqConsumableDurationTurns" defaultValue={0} />
                </div>
              </div>

              <div className="eq-create-row mb-4 hidden" id="eqBaseWeightRow">
                <div className="eq-create-field">
                  <label htmlFor="eqBaseWeight" className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-muted text-base align-bottom">
                      scale
                    </span>{' '}
                    Poids de base (Consommable)
                  </label>
                  <input type="number" step="0.1" id="eqBaseWeight" defaultValue={0} />
                </div>
              </div>

              <div className="eq-create-row mb-4 hidden" id="eqKeyBonusRow">
                <div className="eq-create-field">
                  <label htmlFor="eqKeyBonus" className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-gold text-base align-bottom">
                      diamond
                    </span>{' '}
                    Bonus de Butin (%)
                  </label>
                  <input type="number" id="eqKeyBonus" defaultValue={10} placeholder="10" />
                </div>
              </div>

              <div className="eq-weight-container weight-gauge-container">
                <div className="flex-between items-center mb-1">
                  <span className="text-sm text-slate-300 font-medium">
                    <span className="material-symbols-outlined text-base align-middle mr-1">
                      scale
                    </span>
                    Poids de l&apos;équipement
                  </span>
                  <span className="text-resist text-sm font-bold" id="eqWeightText">
                    0 / 0
                  </span>
                </div>
                <div className="gauge-track weight-gauge-track">
                  <div className="gauge-fill hp weight-gauge-fill" id="eqWeightFill"></div>
                </div>
              </div>

              <button
                type="button"
                id="submitEquipmentBtn"
                onClick={() => window.submitEquipment?.()}
                className="eq-create-btn btn btn-success w-full p-3 rounded-lg font-outfit font-semibold text-base flex-center justify-center gap-2 transition"
              >
                <span className="material-symbols-outlined text-lg">add</span>
                Forger
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Create Anomalie Modal */}
      <div className="vault-modal-overlay" id="anomalieCreateModal">
        <div className="equip-modal modal-sm">
          <div className="equip-modal-header">
            <div className="equip-modal-title">
              <span className="material-symbols-outlined text-power">star</span>
              <span id="anomalieModalTitle">Créer une Anomalie</span>
            </div>
            <button
              type="button"
              className="equip-modal-close"
              onClick={() => window.closeCreateAnomalieModal?.()}
            >
              <span className="material-symbols-outlined text-2xl">close</span>
            </button>
          </div>

          <div className="equip-modal-body">
            <div className="equip-create-section">
              <div className="eq-create-field mb-4">
                <label htmlFor="anomalieName">Nom de l&apos;Anomalie</label>
                <input type="text" id="anomalieName" placeholder="ex: Cœur de Ténèbres" />
              </div>

              <div className="eq-create-field mb-4">
                <label htmlFor="anomalieDescription">Description de l&apos;Anomalie</label>
                <textarea
                  id="anomalieDescription"
                  placeholder="Une relique impie imprégnée d'une aura mystique..."
                ></textarea>
              </div>

              <div className="eq-create-field mb-4">
                <label>Type de Spiritualité</label>
                <div
                  className="custom-select-wrapper"
                  id="anomalieSpiritualiteWrapper"
                  tabIndex={0}
                >
                  <div className="custom-select-trigger" id="anomalieSpiritualiteTrigger">
                    <span className="cs-label" id="anomalieSpiritualiteLabel">
                      <span className="material-symbols-outlined cs-icon text-fuchsia-500">
                        dark_mode
                      </span>
                      Ténèbres
                    </span>
                    <span className="material-symbols-outlined cs-arrow text-lg">expand_more</span>
                  </div>
                  <div className="custom-select-options" id="anomalieSpiritualiteOptions">
                    <div className="custom-option" data-value="TENEBRES">
                      <span className="material-symbols-outlined cs-icon text-fuchsia-500">
                        dark_mode
                      </span>
                      Ténèbres
                    </div>
                    <div className="custom-option" data-value="ESPRIT">
                      <span className="material-symbols-outlined cs-icon text-mana">blur_on</span>
                      Esprit
                    </div>
                    <div className="custom-option" data-value="KARMA">
                      <span className="material-symbols-outlined cs-icon text-warning">
                        all_inclusive
                      </span>
                      Karma
                    </div>
                    <div className="custom-option" data-value="VIOLENCE">
                      <span className="material-symbols-outlined cs-icon text-crimson">
                        explosion
                      </span>{' '}
                      Violence
                    </div>
                    <div className="custom-option" data-value="TRAHISON">
                      <span className="material-symbols-outlined cs-icon text-pv">
                        visibility_off
                      </span>
                      Trahison
                    </div>
                    <div className="custom-option" data-value="SURETE">
                      <span className="material-symbols-outlined cs-icon text-teal">
                        water_drop
                      </span>{' '}
                      Sûreté
                    </div>
                    <div className="custom-option" data-value="RAISON">
                      <span className="material-symbols-outlined cs-icon text-mana">
                        psychology
                      </span>{' '}
                      Raison
                    </div>
                    <div className="custom-option" data-value="DESTRUCTION">
                      <span className="material-symbols-outlined cs-icon text-crit">
                        local_fire_department
                      </span>
                      Destruction
                    </div>
                    <div className="custom-option" data-value="CREATION">
                      <span className="material-symbols-outlined cs-icon text-success">eco</span>
                      Création
                    </div>
                    <div className="custom-option" data-value="CONVICTION">
                      <span className="material-symbols-outlined cs-icon text-speed">volcano</span>
                      Conviction
                    </div>
                    <div className="custom-option" data-value="CONSOLIDATION">
                      <span className="material-symbols-outlined cs-icon text-brown">
                        foundation
                      </span>
                      Consolidation
                    </div>
                  </div>
                  <input type="hidden" id="anomalieSpiritualite" defaultValue="TENEBRES" />
                </div>
              </div>

              <div className="eq-create-field mb-4">
                <label>Catégorie de l&apos;Anomalie</label>
                <div className="custom-select-wrapper" id="anomalieCategoryWrapper" tabIndex={0}>
                  <div className="custom-select-trigger" id="anomalieCategoryTrigger">
                    <span className="cs-label" id="anomalieCategoryLabel">
                      <span className="material-symbols-outlined cs-icon text-muted">category</span>{' '}
                      Autre
                    </span>
                    <span className="material-symbols-outlined cs-arrow text-lg">expand_more</span>
                  </div>
                  <div className="custom-select-options" id="anomalieCategoryOptions"></div>
                  <input type="hidden" id="anomalieCategory" defaultValue="AUTRE" />
                </div>
              </div>

              <div className="mb-6 flex-between bg-black/20 p-4 rounded-lg border border-purple-500/20">
                <div className="flex flex-col gap-1">
                  <span className="text-sm text-slate-50 font-medium flex-center-gap">
                    <span
                      className="material-symbols-outlined text-fuchsia-500 text-lg"
                      id="anomalieMagicToggleIcon"
                    >
                      star
                    </span>
                    <span id="anomalieMagicToggleText">Magique</span>
                  </span>
                  <span className="text-muted text-xs">
                    Désactivez pour en faire un Matériau.
                  </span>
                </div>
                <label className="magic-toggle-switch" htmlFor="anomalieMagicToggle">
                  <input
                    className="magic-toggle-input"
                    type="checkbox"
                    id="anomalieMagicToggle"
                    aria-label="Statut magique"
                    defaultChecked
                    onChange={(e) => window.onAnomalieMagicToggleChange?.(e.currentTarget)}
                  />
                  <span className="anomalie-slider-bg">
                    <span className="anomalie-slider-thumb"></span>
                  </span>
                </label>
              </div>

              <div className="eq-create-field mb-6">
                <label>Niveau</label>
                <div className="custom-select-wrapper" id="anomalieLevelWrapper" tabIndex={0}>
                  <div className="custom-select-trigger" id="anomalieLevelTrigger">
                    <span className="cs-label" id="anomalieLevelLabel">
                      <span className="material-symbols-outlined cs-icon text-success">
                        looks_one
                      </span>{' '}
                      Niveau 1
                    </span>
                    <span className="material-symbols-outlined cs-arrow text-lg">expand_more</span>
                  </div>
                  <div className="custom-select-options" id="anomalieLevelOptions">
                    <div className="custom-option" data-value="1">
                      <span className="material-symbols-outlined cs-icon text-success">
                        looks_one
                      </span>{' '}
                      Niveau 1
                    </div>
                    <div className="custom-option" data-value="2">
                      <span className="material-symbols-outlined cs-icon text-mana">
                        looks_two
                      </span>{' '}
                      Niveau 2
                    </div>
                    <div className="custom-option" data-value="3">
                      <span className="material-symbols-outlined cs-icon text-power">looks_3</span>
                      Niveau 3
                    </div>
                  </div>
                  <input type="hidden" id="anomalieLevel" defaultValue="1" />
                </div>
              </div>

              <button
                type="button"
                id="submitAnomalieBtn"
                onClick={() => window.submitAnomalie?.()}
                className="eq-create-btn w-full p-4 rounded-lg bg-purple-500 text-white border-0 font-outfit font-semibold text-base cursor-pointer flex-center gap-2 transition-colors hover:bg-purple-600"
              >
                <span className="material-symbols-outlined text-lg" id="submitAnomalieBtnIcon">
                  add
                </span>
                <span id="submitAnomalieBtnText">Créer l&apos;Anomalie</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
