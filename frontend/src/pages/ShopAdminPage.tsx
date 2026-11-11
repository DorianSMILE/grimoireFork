import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAlreadyAuthenticated } from '../services/api';

const REQUIRED_SECRETS = [
  { value: '', label: 'Aucun', icon: 'close', colorClass: 'text-muted' },
  {
    value: 'Secret du Chaos',
    label: 'Secret du Chaos',
    icon: 'local_fire_department',
    colorClass: 'text-danger',
  },
  {
    value: "Secret de l'Abondance",
    label: "Secret de l'Abondance",
    icon: 'eco',
    colorClass: 'text-success',
  },
  {
    value: 'Secret de la Préservation',
    label: 'Secret de la Préservation',
    icon: 'foundation',
    colorClass: 'text-brown',
  },
  {
    value: 'Secret de la Sérénité',
    label: 'Secret de la Sérénité',
    icon: 'water_drop',
    colorClass: 'text-teal',
  },
  {
    value: 'Secret de la Chasse',
    label: 'Secret de la Chasse',
    icon: 'visibility_off',
    colorClass: 'text-pink',
  },
  {
    value: 'Secret du Carnage',
    label: 'Secret du Carnage',
    icon: 'explosion',
    colorClass: 'text-crimson',
  },
  {
    value: 'Secret de la Joie',
    label: 'Secret de la Joie',
    icon: 'volcano',
    colorClass: 'text-amber',
  },
  {
    value: 'Secret du Savoir',
    label: 'Secret du Savoir',
    icon: 'psychology',
    colorClass: 'text-info',
  },
  {
    value: 'Secret du Destin',
    label: 'Secret du Destin',
    icon: 'all_inclusive',
    colorClass: 'text-gold',
  },
  {
    value: "Secret de l'Éther",
    label: "Secret de l'Éther",
    icon: 'blur_on',
    colorClass: 'text-info',
  },
  {
    value: 'Secret des Abysses',
    label: 'Secret des Abysses',
    icon: 'dark_mode',
    colorClass: 'text-purple-400',
  },
];

export function ShopAdminPage() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Grimoire - Gestion Boutique';

    if (!isAlreadyAuthenticated()) {
      navigate('/login', { replace: true });
      return;
    }

    let cancelled = false;

    async function bootShopAdmin() {
      const uiUrl = '/js/ui.js?v=2';
      const authUrl = '/js/services/auth.js?v=32';
      const shopAdminUrl = '/js/pages/shop-admin.js?v=102';

      await import(/* @vite-ignore */ uiUrl);
      await import(/* @vite-ignore */ authUrl);
      if (typeof window.initShopAdminPage !== 'function') {
        await import(/* @vite-ignore */ shopAdminUrl);
      }
      if (!cancelled && typeof window.initShopAdminPage === 'function') {
        await window.initShopAdminPage();
      }
    }

    bootShopAdmin().catch((err) => {
      console.error('Erreur initialisation Admin Boutique:', err);
    });

    return () => {
      cancelled = true;
      window.cleanupShopAdminPage?.();
    };
  }, [navigate]);

  const handleSelectRequiredSecret = (
    value: string,
    label: string,
    icon: string,
    colorClass: string,
  ) => {
    const input = document.getElementById('eqRequiredSecret') as HTMLInputElement | null;
    if (input) input.value = value;
    const labelEl = document.getElementById('eqRequiredSecretLabel');
    if (labelEl) {
      labelEl.innerHTML = `<span class="material-symbols-outlined cs-icon ${colorClass}">${icon}</span> ${label}`;
    }
  };

  return (
    <>
      <h2 id="shopAdminDenied" className="is-hidden text-error text-center mt-12">
        Accès Refusé : Réservé aux Admins
      </h2>

      <main className="vault-main" id="shopAdminMain">
        <div className="panel">
          <div className="page-header">
            <div className="page-header-content">
              <div className="page-header-icon warning">
                <span className="material-symbols-outlined text-3xl">settings</span>
              </div>
              <div>
                <h2 className="page-header-title text-2xl">Gestion de la Boutique</h2>
                <div className="page-header-subtitle">
                  Création et gestion des articles pour la boutique
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                className="px-4 py-2 flex items-center gap-2 font-semibold cursor-pointer border-none rounded-lg bg-amber-500 text-slate-800 transition-all shadow-[0_4px_12px_rgba(245,158,11,0.2)]"
                id="btnCreateVaultEq"
                onClick={() => window.openCreateEqModal?.()}
              >
                <span className="material-symbols-outlined text-xl">add</span>
                Forger un article
              </button>
            </div>
          </div>

          <div className="mt-4" id="vaultGrid">
            <div className="text-muted font-italic">Chargement des articles...</div>
          </div>
        </div>

        {/* Section paliers d'amélioration */}
        <div className="panel mt-4">
          <div className="page-header">
            <div className="page-header-content">
              <div className="page-header-icon purple">
                <span className="material-symbols-outlined text-3xl">upgrade</span>
              </div>
              <div>
                <h2 className="page-header-title text-2xl">Paliers d&apos;amélioration</h2>
                <div className="page-header-subtitle">
                  Configurer les conditions de déblocage de chaque niveau boutique
                </div>
              </div>
            </div>
            <button
              type="button"
              className="px-4 py-2 flex items-center gap-2 font-semibold cursor-pointer border-none rounded-lg transition-all shadow-lg btn-purple-gradient"
              id="btnCreateUpgrade"
              onClick={() => window.openCreateUpgradeModal?.()}
            >
              <span className="material-symbols-outlined text-xl">add</span>
              Nouveau palier
            </button>
          </div>
          <div className="mt-4" id="upgradesGrid">
            <div className="text-muted font-italic">Chargement...</div>
          </div>
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
                <div className="form-group m-0 items-start justify-start">
                  <label
                    className="target-toggle-container shop-mode w-max"
                    htmlFor="eqAvailableInShop"
                    title="Si activé, cet objet sera vendu dans la boutique"
                  >
                    <input
                      className="target-radio"
                      type="checkbox"
                      id="eqAvailableInShop"
                      defaultChecked
                    />
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
                        <span className="cs-icon text-speed font-bold">M</span> Mythique
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
                    <div
                      className="custom-select-options"
                      id="eqConsumableCategoryOptions"
                    ></div>
                    <input type="hidden" id="eqConsumableCategory" defaultValue="AUTRE" />
                  </div>
                </div>
              </div>

              <div className="eq-create-row mb-4">
                <div className="form-group col-span-2 m-0">
                  <label>Secret requis pour apparaître en boutique (Optionnel)</label>
                  <div className="flex items-start gap-4">
                    <div
                      className="custom-select-wrapper z-90 flex-2"
                      id="eqRequiredSecretWrapper"
                    >
                      <div className="custom-select-trigger">
                        <span className="cs-label" id="eqRequiredSecretLabel">
                          <span className="material-symbols-outlined cs-icon text-muted">
                            close
                          </span>
                          Aucun
                        </span>
                        <span className="material-symbols-outlined text-slate-500 text-xl">
                          expand_more
                        </span>
                      </div>
                      <div className="custom-select-options custom-options">
                        {REQUIRED_SECRETS.map((sec) => (
                          <div
                            key={sec.value || 'NONE'}
                            className="custom-option"
                            data-value={sec.value}
                            onClick={() =>
                              handleSelectRequiredSecret(
                                sec.value,
                                sec.label,
                                sec.icon,
                                sec.colorClass,
                              )
                            }
                          >
                            <span
                              className={`material-symbols-outlined cs-icon ${sec.colorClass}`}
                            >
                              {sec.icon}
                            </span>
                            {sec.label}
                          </div>
                        ))}
                      </div>
                      <input type="hidden" id="eqRequiredSecret" defaultValue="" />
                    </div>
                    <div className="flex-1">
                      <input
                        className="form-control min-h-[42px]"
                        type="number"
                        id="eqRequiredSecretLevel"
                        defaultValue="1"
                        min="1"
                        placeholder="Niveau"
                        title="Niveau du secret"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div
                className="eq-create-row mb-4 p-3 rounded-lg hidden bg-purple-500/5 border border-dashed border-purple-500/30"
                id="eqSpecialEffectRow"
              >
                <div className="eq-create-field">
                  <div className="flex items-center">
                    <label className="text-power" id="eqSpecialEffectLabelTitle">
                      Effet Spécial
                    </label>
                    <span id="eqSpecialEffectInfoContainer"></span>
                  </div>
                  <div className="custom-select-wrapper" id="eqSpecialEffectWrapper" tabIndex={0}>
                    <div
                      className="custom-select-trigger border-purple-400/30"
                      id="eqSpecialEffectTrigger"
                    >
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
                        <span className="material-symbols-outlined cs-icon text-dark">opacity</span>
                        Famine (Drain de mana par tour)
                      </div>
                      <div
                        className="custom-option effect-CURSED_HP_LOSS_ON_MANA"
                        data-value="CURSED_HP_LOSS_ON_MANA"
                      >
                        <span className="material-symbols-outlined cs-icon text-dark">
                          heart_broken
                        </span>
                        Brèche spirituelle (- hp % en mana Act.)
                      </div>
                      <div
                        className="custom-option effect-CURSED_MAGIC_DAMAGE_REDUCTION"
                        data-value="CURSED_MAGIC_DAMAGE_REDUCTION"
                      >
                        <span className="material-symbols-outlined cs-icon text-dark">
                          psychology
                        </span>
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
                        <span className="material-symbols-outlined cs-icon text-dark">
                          gpp_bad
                        </span>
                        Vulnérabilité (Dégâts subis % +)
                      </div>
                      <div
                        className="custom-option effect-CURSED_HEALING_REDUCTION"
                        data-value="CURSED_HEALING_REDUCTION"
                      >
                        <span className="material-symbols-outlined cs-icon text-dark">
                          healing
                        </span>
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
                    className="text-power"
                    id="eqSpecialEffectValueTitle"
                  >
                    Puissance (Valeur)
                  </label>
                  <input
                    type="number"
                    id="eqSpecialEffectValue"
                    defaultValue="0"
                    className="border-purple-400/30"
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
                  <input type="number" id="eqHp" defaultValue="0" />
                </div>
                <div className="eq-create-field">
                  <label htmlFor="eqMana" className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-mana text-base align-bottom">
                      water_drop
                    </span>{' '}
                    Mana
                  </label>
                  <input type="number" id="eqMana" defaultValue="0" />
                </div>
                <div className="eq-create-field non-consumable-stat">
                  <label htmlFor="eqPower" className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-power text-base align-bottom">
                      auto_awesome
                    </span>{' '}
                    Puissance
                  </label>
                  <input type="number" id="eqPower" defaultValue="0" />
                </div>
                <div className="eq-create-field non-consumable-stat">
                  <label htmlFor="eqStr" className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-base align-bottom text-physic">
                      fitness_center
                    </span>{' '}
                    Force
                  </label>
                  <input type="number" id="eqStr" defaultValue="0" />
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
                  <input type="number" id="eqArmor" defaultValue="0" />
                </div>
                <div className="eq-create-field">
                  <label htmlFor="eqRes" className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-resist text-base align-bottom">
                      shield
                    </span>{' '}
                    Résistance
                  </label>
                  <input type="number" id="eqRes" defaultValue="0" />
                </div>
                <div className="eq-create-field">
                  <label htmlFor="eqSpeed" className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-speed text-base align-bottom">
                      bolt
                    </span>{' '}
                    Vitesse
                  </label>
                  <input type="number" id="eqSpeed" defaultValue="0" />
                </div>
                <div className="eq-create-field">
                  <label htmlFor="eqCrit" className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-crit text-base align-bottom">
                      gps_fixed
                    </span>{' '}
                    Critique
                  </label>
                  <input type="number" id="eqCrit" defaultValue="0" />
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
                    defaultValue="0"
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
                    defaultValue="0"
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
                  <input type="number" id="eqConsumableHpPercent" defaultValue="0" />
                </div>
                <div className="eq-create-field">
                  <label htmlFor="eqConsumableManaPercent" className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-mana text-base align-bottom">
                      percent
                    </span>{' '}
                    Mana (Max)
                  </label>
                  <input type="number" id="eqConsumableManaPercent" defaultValue="0" />
                </div>
                <div className="eq-create-field">
                  <label
                    htmlFor="eqConsumableMissingHpPercent"
                    className="flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-base align-bottom text-pv-manquant">
                      heart_broken
                    </span>{' '}
                    PV (Manq)
                  </label>
                  <input type="number" id="eqConsumableMissingHpPercent" defaultValue="0" />
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
                  <input type="number" id="eqConsumableMissingManaPercent" defaultValue="0" />
                </div>
              </div>
              <div className="eq-create-row quad consumable-stat hidden mt-4">
                <div className="eq-create-field">
                  <label
                    htmlFor="eqConsumableBonusPhysicalDamagePercent"
                    className="flex items-center gap-1 text-[0.85rem]"
                  >
                    <span className="material-symbols-outlined text-physic text-base align-bottom">
                      fitness_center
                    </span>
                    % Dégâts Phy
                  </label>
                  <input
                    type="number"
                    id="eqConsumableBonusPhysicalDamagePercent"
                    defaultValue="0"
                  />
                </div>
                <div className="eq-create-field">
                  <label
                    htmlFor="eqConsumableBonusMagicalDamagePercent"
                    className="flex items-center gap-1 text-[0.85rem]"
                  >
                    <span className="material-symbols-outlined text-power text-base align-bottom">
                      auto_awesome
                    </span>
                    % Dégâts Mag
                  </label>
                  <input
                    type="number"
                    id="eqConsumableBonusMagicalDamagePercent"
                    defaultValue="0"
                  />
                </div>
                <div className="eq-create-field">
                  <label
                    htmlFor="eqConsumableBonusArmorFlat"
                    className="flex items-center gap-1 text-[0.85rem]"
                  >
                    <span className="material-symbols-outlined text-armor text-base align-bottom">
                      shield
                    </span>
                    Armure
                  </label>
                  <input type="number" id="eqConsumableBonusArmorFlat" defaultValue="0" />
                </div>
                <div className="eq-create-field">
                  <label
                    htmlFor="eqConsumableBonusResistanceFlat"
                    className="flex items-center gap-1 text-[0.85rem]"
                  >
                    <span className="material-symbols-outlined text-resist text-base align-bottom">
                      shield
                    </span>
                    Résistance
                  </label>
                  <input type="number" id="eqConsumableBonusResistanceFlat" defaultValue="0" />
                </div>
              </div>
              <div className="eq-create-row quad consumable-stat hidden mt-4">
                <div className="eq-create-field">
                  <label
                    htmlFor="eqConsumableBonusXpPercent"
                    className="flex items-center gap-1 text-[0.85rem]"
                  >
                    <span className="material-symbols-outlined text-warning text-base align-bottom">
                      star
                    </span>
                    % XP Bonus
                  </label>
                  <input type="number" id="eqConsumableBonusXpPercent" defaultValue="0" />
                </div>
                <div className="eq-create-field">
                  <label
                    htmlFor="eqConsumableDurationTurns"
                    className="flex items-center gap-1 text-[0.85rem]"
                  >
                    <span className="material-symbols-outlined text-muted text-base align-bottom">
                      hourglass_bottom
                    </span>
                    Durée (Tours)
                  </label>
                  <input type="number" id="eqConsumableDurationTurns" defaultValue="0" />
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
                  <input type="number" step="0.1" id="eqBaseWeight" defaultValue="0" />
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
                  <input type="number" id="eqKeyBonus" defaultValue="10" placeholder="10" />
                </div>
              </div>

              <div className="eq-weight-container mb-4 p-3 rounded-lg bg-black/20 border border-white/5">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-slate-300 font-medium text-sm">
                    <span className="material-symbols-outlined text-base align-middle mr-1">
                      scale
                    </span>
                    Poids de l&apos;équipement
                  </span>
                  <span className="text-resist font-bold text-sm" id="eqWeightText">
                    0 / 0
                  </span>
                </div>
                <div className="gauge-track h-[6px] bg-white/10 rounded-[3px] overflow-hidden">
                  <div
                    className="gauge-fill hp h-full w-0 transition-all duration-300"
                    id="eqWeightFill"
                  ></div>
                </div>
              </div>

              <div className="eq-create-field mb-4">
                <label className="text-speed flex items-center justify-between">
                  <span>
                    <span className="material-symbols-outlined text-base align-bottom mr-[0.2rem]">
                      auto_awesome
                    </span>{' '}
                    Prix en Anomalies (Optionnel, Cumulatif)
                  </span>
                  <button
                    className="flex items-center gap-1 text-sm cursor-pointer rounded bg-purple-500/20 border border-purple-500/40 text-purple-300 py-[2px] px-2"
                    type="button"
                    id="addAnomalyPriceBtn"
                  >
                    <span className="material-symbols-outlined text-base">add</span> Ajouter
                  </button>
                </label>
                <div className="mt-2 flex flex-col gap-2" id="priceAnomaliesContainer">
                  {/* Rows injected via JS */}
                </div>
                <div className="text-muted mt-1 text-xs">
                  Les anomalies s&apos;ajoutent au prix en Or (paiement cumulatif).
                </div>
              </div>

              <div className="eq-price-container mb-6 p-3 rounded-lg bg-amber-500/5 border border-dashed border-amber-500/30">
                <div className="flex-between flex-center">
                  <span className="text-slate-300 font-medium text-sm">
                    <span className="material-symbols-outlined text-speed text-base align-middle mr-1">
                      payments
                    </span>
                    Prix en boutique
                  </span>
                  <span
                    className="text-speed flex items-center gap-1 font-bold text-lg"
                    id="eqPriceText"
                  >
                    0 <span className="material-symbols-outlined text-xl">monetization_on</span>
                  </span>
                </div>
              </div>

              <button
                className="eq-create-btn text-white p-3 flex items-center justify-center w-full gap-2 font-semibold text-base cursor-pointer border-none rounded-lg bg-emerald-500 font-outfit transition-colors duration-200"
                type="button"
                id="submitEquipmentBtn"
                onClick={() => window.submitEquipment?.()}
              >
                <span className="material-symbols-outlined text-xl">add</span>
                Forger
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
