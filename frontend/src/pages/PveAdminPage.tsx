import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAlreadyAuthenticated } from '../services/api';

const NATIVE_SECRETS = [
  { value: '', label: 'Aucun (Optionnel)', icon: 'close', colorClass: 'text-muted' },
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

const MONSTER_SECRET_FILTERS = [
  { value: '', label: 'Tous les secrets', icon: 'filter_list', hex: '#94a3b8', iconClass: 'text-muted' },
  { value: 'Aucun', label: 'Sans secret', icon: 'close', hex: '#94a3b8', iconClass: 'text-muted' },
  {
    value: 'Secret du Chaos',
    label: 'Secret du Chaos',
    icon: 'local_fire_department',
    hex: '#ff0000',
    iconClass: 'text-red-500 text-lg',
  },
  {
    value: "Secret de l'Abondance",
    label: "Secret de l'Abondance",
    icon: 'eco',
    hex: '#10b981',
    iconClass: 'text-success',
  },
  {
    value: 'Secret de la Préservation',
    label: 'Secret de la Préservation',
    icon: 'foundation',
    hex: '#99674c',
    iconClass: 'text-brown-600 text-lg',
  },
  {
    value: 'Secret de la Sérénité',
    label: 'Secret de la Sérénité',
    icon: 'water_drop',
    hex: '#00e5cc',
    iconClass: 'text-cyan-400 text-lg',
  },
  {
    value: 'Secret de la Chasse',
    label: 'Secret de la Chasse',
    icon: 'visibility_off',
    hex: '#ed5677',
    iconClass: 'text-pink-500 text-lg',
  },
  {
    value: 'Secret du Carnage',
    label: 'Secret du Carnage',
    icon: 'explosion',
    hex: '#a70740',
    iconClass: 'text-rose-700 text-lg',
  },
  {
    value: 'Secret de la Joie',
    label: 'Secret de la Joie',
    icon: 'volcano',
    hex: '#b74c0b',
    iconClass: 'text-orange-700 text-lg',
  },
  {
    value: 'Secret du Savoir',
    label: 'Secret du Savoir',
    icon: 'psychology',
    hex: '#3b82f6',
    iconClass: 'text-info text-lg',
  },
  {
    value: 'Secret du Destin',
    label: 'Secret du Destin',
    icon: 'all_inclusive',
    hex: '#ffd700',
    iconClass: 'text-gold text-lg',
  },
  {
    value: "Secret de l'Éther",
    label: "Secret de l'Éther",
    icon: 'blur_on',
    hex: '#3b82f6',
    iconClass: 'text-blue-400 text-lg',
  },
  {
    value: 'Secret des Abysses',
    label: 'Secret des Abysses',
    icon: 'dark_mode',
    hex: '#c084fc',
    iconClass: 'text-purple-400 text-lg',
  },
];

const DUNGEON_SECRET_FILTERS = [
  { value: '', label: 'Tous les secrets', icon: 'filter_list', iconClass: 'text-muted' },
  { value: 'Aucun', label: 'Sans secret', icon: 'close', iconClass: 'text-muted' },
  {
    value: 'Secret du Chaos',
    label: 'Secret du Chaos',
    icon: 'local_fire_department',
    iconClass: 'text-danger icon-sm',
  },
  {
    value: "Secret de l'Abondance",
    label: "Secret de l'Abondance",
    icon: 'eco',
    iconClass: 'text-success',
  },
  {
    value: 'Secret de la Préservation',
    label: 'Secret de la Préservation',
    icon: 'foundation',
    iconClass: 'text-brown icon-sm',
  },
  {
    value: 'Secret de la Sérénité',
    label: 'Secret de la Sérénité',
    icon: 'water_drop',
    iconClass: 'text-teal icon-sm',
  },
  {
    value: 'Secret de la Chasse',
    label: 'Secret de la Chasse',
    icon: 'visibility_off',
    iconClass: 'text-crimson icon-sm',
  },
  {
    value: 'Secret du Carnage',
    label: 'Secret du Carnage',
    icon: 'explosion',
    iconClass: 'text-brut icon-sm',
  },
  {
    value: 'Secret de la Joie',
    label: 'Secret de la Joie',
    icon: 'volcano',
    iconClass: 'text-orange icon-sm',
  },
  {
    value: 'Secret du Savoir',
    label: 'Secret du Savoir',
    icon: 'psychology',
    iconClass: 'text-info',
  },
  {
    value: 'Secret du Destin',
    label: 'Secret du Destin',
    icon: 'all_inclusive',
    iconClass: 'text-gold icon-sm',
  },
  {
    value: "Secret de l'Éther",
    label: "Secret de l'Éther",
    icon: 'blur_on',
    iconClass: 'text-info icon-sm',
  },
  {
    value: 'Secret des Abysses',
    label: 'Secret des Abysses',
    icon: 'dark_mode',
    iconClass: 'text-purple-300 icon-sm',
  },
];

export function PveAdminPage() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Grimoire - Gestion PvE';

    if (!isAlreadyAuthenticated()) {
      navigate('/login', { replace: true });
      return;
    }

    let cancelled = false;

    async function bootPveAdmin() {
      const uiUrl = '/js/ui.js?v=2';
      const apiUrl = '/js/services/api.js';
      const authUrl = '/js/services/auth.js?v=29';
      const grimoireUrl = '/js/pages/grimoire.js';
      const pveAdminUrl = '/js/pages/pve-admin.js?v=8';

      await import(/* @vite-ignore */ uiUrl);
      const apiMod = await import(/* @vite-ignore */ apiUrl);
      (window as unknown as { api?: unknown }).api = apiMod;
      await import(/* @vite-ignore */ authUrl);
      await import(/* @vite-ignore */ grimoireUrl);
      if (typeof window.initPveAdminPage !== 'function') {
        await import(/* @vite-ignore */ pveAdminUrl);
      }
      if (!cancelled && typeof window.initPveAdminPage === 'function') {
        await window.initPveAdminPage();
      }
    }

    bootPveAdmin().catch((err) => {
      console.error('Erreur initialisation Admin PvE:', err);
    });

    return () => {
      cancelled = true;
      window.cleanupPveAdminPage?.();
    };
  }, [navigate]);

  return (
    <>
      <app-navbar active-page="pve-admin"></app-navbar>

      <main className="vault-container admin-container">
        <div
          className="hidden text-danger bg-red-glass border-red-glass p-4 rounded-lg mb-8 text-center"
          id="adminWarning"
        >
          <span className="material-symbols-outlined align-middle mr-2">error</span>
          Vous devez être administrateur pour accéder à cette page. Redirection en cours...
        </div>

        <div id="adminContent" className="hidden">
          {/* === MONSTRES === */}
          <div className="admin-split-layout">
            <section className="admin-section m-0 transition-all" id="monsterFormPanel">
              <div className="admin-section-header">
                <div className="admin-section-title">
                  <span className="material-symbols-outlined text-danger">pest_control</span>
                  Créer un Monstre
                </div>
              </div>
              <div className="admin-section-content">
                <form id="monsterForm">
                  <div className="form-grid">
                    <div className="form-group col-span-2">
                      <div className="flex items-end gap-4">
                        <div className="flex-1">
                          <label htmlFor="mName" className="flex-center flex-center-gap">
                            <span className="material-symbols-outlined text-lg text-slate-50">
                              badge
                            </span>
                            Nom du monstre
                          </label>
                          <input className="form-control" type="text" id="mName" required />
                        </div>
                        <div className="w-[100px] relative" id="mLevelContainer">
                          <label htmlFor="mDesc" className="flex-center flex-center-gap">
                            <span className="material-symbols-outlined text-lg text-info">
                              star_rate
                            </span>
                            Lvl
                          </label>

                          <div className="custom-select-wrapper" id="mLevelWrapper">
                            <div
                              className="custom-select-trigger custom-select-larger"
                              id="mLevelTrigger"
                            >
                              <span className="material-symbols-outlined cs-icon text-muted">
                                star
                              </span>
                              <span className="flex-1 text-center">1</span>
                            </div>
                            <div className="custom-select-options">
                              <div
                                className="custom-option"
                                onClick={() => window.selectLevelOption?.(1, '#94a3b8')}
                              >
                                <span className="material-symbols-outlined cs-icon text-muted">
                                  star
                                </span>{' '}
                                1
                              </div>
                              <div
                                className="custom-option"
                                onClick={() => window.selectLevelOption?.(2, '#10b981')}
                              >
                                <span className="material-symbols-outlined cs-icon text-success">
                                  star
                                </span>{' '}
                                2
                              </div>
                              <div
                                className="custom-option"
                                onClick={() => window.selectLevelOption?.(3, '#3b82f6')}
                              >
                                <span className="material-symbols-outlined cs-icon text-info">
                                  star
                                </span>{' '}
                                3
                              </div>
                              <div
                                className="custom-option"
                                onClick={() => window.selectLevelOption?.(4, '#a855f7')}
                              >
                                <span className="material-symbols-outlined cs-icon text-purple">
                                  star
                                </span>{' '}
                                4
                              </div>
                              <div
                                className="custom-option"
                                onClick={() => window.selectLevelOption?.(5, '#f59e0b')}
                              >
                                <span className="material-symbols-outlined cs-icon text-warning">
                                  star
                                </span>{' '}
                                5
                              </div>
                            </div>
                          </div>
                          <input type="hidden" id="mLevel" defaultValue="1" />
                        </div>
                      </div>
                    </div>
                    <div className="form-group col-span-2">
                      <label htmlFor="mHp" className="flex-center flex-center-gap">
                        <span className="material-symbols-outlined text-lg text-muted">
                          description
                        </span>
                        Description
                      </label>
                      <input className="form-control" type="text" id="mDesc" />
                    </div>
                    <div className="form-group">
                      <label htmlFor="mRegenHp" className="flex-center flex-center-gap">
                        <span className="material-symbols-outlined text-pink text-lg">
                          favorite
                        </span>
                        PV Max
                      </label>
                      <div className="flex-center gap-2">
                        <input
                          className="form-control min-w-[80px]"
                          type="number"
                          id="mHp"
                          defaultValue="100"
                          required
                        />
                        <div className="compact-badge">
                          <span className="text-xs text-muted"></span>
                          <input
                            className="form-control p-1 w-[85px]"
                            type="number"
                            id="mStartHpPct"
                            defaultValue="100"
                            title="% PV au début"
                            required
                          />
                          <span className="text-xs text-muted">%</span>
                        </div>
                      </div>
                    </div>
                    <div className="form-group">
                      <label htmlFor="mMana" className="flex-center flex-center-gap">
                        <span className="material-symbols-outlined text-pink text-lg">
                          healing
                        </span>
                        Régén. PV
                      </label>
                      <input
                        className="form-control"
                        type="number"
                        id="mRegenHp"
                        defaultValue="0"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="mRegenMana" className="flex-center flex-center-gap">
                        <span className="material-symbols-outlined text-lg text-info">
                          water_drop
                        </span>
                        Mana Max
                      </label>
                      <div className="flex-center gap-2">
                        <input
                          className="form-control min-w-[80px]"
                          type="number"
                          id="mMana"
                          defaultValue="0"
                          required
                        />
                        <div className="compact-badge">
                          <span className="text-xs text-muted"></span>
                          <input
                            className="form-control p-1 w-[85px]"
                            type="number"
                            id="mStartManaPct"
                            defaultValue="100"
                            title="% Mana au début"
                            required
                          />
                          <span className="text-xs text-muted">%</span>
                        </div>
                      </div>
                    </div>
                    <div className="form-group">
                      <label htmlFor="mRegenMana" className="flex-center flex-center-gap">
                        <span className="material-symbols-outlined text-lg text-sky-300">
                          opacity
                        </span>
                        Régén. Mana
                      </label>
                      <input
                        className="form-control"
                        type="number"
                        id="mRegenMana"
                        defaultValue="0"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="mStartShield" className="flex-center flex-center-gap">
                        <span className="material-symbols-outlined text-lg text-info">
                          security
                        </span>
                        Shield Départ
                      </label>
                      <input
                        className="form-control"
                        type="number"
                        id="mStartShield"
                        defaultValue="0"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label
                        htmlFor="mStartShieldDuration"
                        className="flex-center flex-center-gap"
                      >
                        <span className="material-symbols-outlined text-lg text-muted">
                          timer
                        </span>
                        Durée Shield Départ
                      </label>
                      <input
                        className="form-control"
                        type="number"
                        id="mStartShieldDuration"
                        defaultValue="0"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="mSpeed" className="flex-center flex-center-gap">
                        <span className="material-symbols-outlined text-lg text-warning">
                          bolt
                        </span>
                        Vitesse
                      </label>
                      <input
                        className="form-control"
                        type="number"
                        id="mSpeed"
                        defaultValue="10"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="mCrit" className="flex-center flex-center-gap">
                        <span className="material-symbols-outlined text-lg text-danger">
                          gps_fixed
                        </span>
                        Critique (%)
                      </label>
                      <input
                        className="form-control"
                        type="number"
                        id="mCrit"
                        defaultValue="5"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="mStrength" className="flex-center flex-center-gap">
                        <span className="material-symbols-outlined text-lg text-rose-500">
                          fitness_center
                        </span>
                        Force
                      </label>
                      <input
                        className="form-control"
                        type="number"
                        id="mStrength"
                        defaultValue="10"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="mPower" className="flex-center flex-center-gap">
                        <span className="material-symbols-outlined text-purple text-lg">
                          auto_awesome
                        </span>
                        Puissance
                      </label>
                      <input
                        className="form-control"
                        type="number"
                        id="mPower"
                        defaultValue="0"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="mArmor" className="flex-center flex-center-gap">
                        <span className="material-symbols-outlined text-info text-lg">
                          shield
                        </span>
                        Armure
                      </label>
                      <input
                        className="form-control"
                        type="number"
                        id="mArmor"
                        defaultValue="5"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="mResist" className="flex-center flex-center-gap">
                        <span className="material-symbols-outlined text-lg text-success">
                          shield
                        </span>
                        Résistance
                      </label>
                      <input
                        className="form-control"
                        type="number"
                        id="mResist"
                        defaultValue="5"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="mGold" className="flex-center flex-center-gap">
                        <span className="material-symbols-outlined text-lg text-orange">
                          monetization_on
                        </span>
                        Récompense Or
                      </label>
                      <input
                        className="form-control"
                        type="number"
                        id="mGold"
                        defaultValue="10"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="mXp" className="flex-center flex-center-gap">
                        <span className="material-symbols-outlined text-lg text-amber-300">
                          stars
                        </span>
                        Récompense XP
                      </label>
                      <input
                        className="form-control"
                        type="number"
                        id="mXp"
                        defaultValue="20"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="mutName" className="flex-center flex-center-gap">
                        <span className="material-symbols-outlined text-lg text-danger">
                          genetics
                        </span>
                        Type
                      </label>
                      <input type="hidden" id="mType" defaultValue="NORMAL" />
                      <div className="custom-select-wrapper" id="mTypeWrapper">
                        <div
                          className="custom-select-trigger custom-select-larger"
                          id="mTypeTrigger"
                        >
                          <span className="material-symbols-outlined cs-icon text-muted">
                            check_box_outline_blank
                          </span>
                          <span className="flex-1 text-left">Normal</span>
                          <span className="material-symbols-outlined text-muted pointer-events-none">
                            expand_more
                          </span>
                        </div>
                        <div className="custom-select-options">
                          <div
                            className="custom-option"
                            onClick={() =>
                              window.selectMonsterType?.(
                                'NORMAL',
                                'Normal',
                                'check_box_outline_blank',
                                '#94a3b8',
                              )
                            }
                          >
                            <span className="material-symbols-outlined cs-icon text-muted">
                              check_box_outline_blank
                            </span>
                            Normal
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="flex-center flex-center-gap">
                        <span className="material-symbols-outlined text-lg text-violet-500">
                          neurology
                        </span>
                        Comportement IA
                      </label>
                      <input type="hidden" id="mBehavior" defaultValue="NORMAL" />
                      <div className="custom-select-wrapper" id="mBehaviorWrapper">
                        <div
                          className="custom-select-trigger custom-select-larger"
                          id="mBehaviorTrigger"
                        >
                          <span className="material-symbols-outlined cs-icon text-muted">
                            check_box_outline_blank
                          </span>
                          <span className="flex-1 text-left">Normal</span>
                          <span className="material-symbols-outlined text-muted pointer-events-none">
                            expand_more
                          </span>
                        </div>
                        <div className="custom-select-options">
                          <div
                            className="custom-option"
                            onClick={() =>
                              window.selectMonsterBehavior?.(
                                'NORMAL',
                                'Normal',
                                'check_box_outline_blank',
                                '#94a3b8',
                              )
                            }
                          >
                            <span className="material-symbols-outlined cs-icon text-muted">
                              check_box_outline_blank
                            </span>
                            Normal
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="form-group col-span-2">
                      <label className="flex-center flex-center-gap">
                        <span className="material-symbols-outlined text-lg text-success">
                          explore
                        </span>
                        Voie Native (Secret)
                      </label>
                      <div className="custom-select-wrapper z-95" id="mNativeSecretWrapper">
                        <div className="custom-select-trigger p-3">
                          <span className="cs-label flex-center flex-center-gap">
                            <span className="material-symbols-outlined cs-icon text-slate-500 text-lg">
                              close
                            </span>
                            Aucun (Optionnel)
                          </span>
                          <span className="material-symbols-outlined text-slate-500 text-xl pointer-events-none">
                            expand_more
                          </span>
                        </div>
                        <div className="custom-select-options custom-options">
                          {NATIVE_SECRETS.map((sec) => (
                            <div
                              key={sec.value || 'none'}
                              className="custom-option"
                              data-value={sec.value}
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
                        <input type="hidden" id="mNativeSecret" defaultValue="" />
                      </div>
                    </div>
                    <div className="form-group col-span-2">
                      <label className="flex-center flex-center-gap">
                        <span className="material-symbols-outlined text-purple text-lg">
                          pets
                        </span>
                        Mutations (Optionnel)
                      </label>
                      <div
                        id="mMutationsContainer"
                        className="flex flex-wrap gap-2 bg-black/30 p-3 rounded-lg border-divider min-h-[48px]"
                      >
                        <span className="text-slate-500 text-sm italic">Chargement...</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex-center gap-4">
                    <button className="btn btn-primary" type="submit" id="btnSubmitMonster">
                      Créer le monstre
                    </button>
                    <button
                      className="btn btn-secondary hidden"
                      type="button"
                      id="btnCancelMonster"
                      onClick={() => window.cancelMonsterEdit?.()}
                    >
                      Annuler
                    </button>
                  </div>
                </form>
              </div>
            </section>

            <div className="relative h-full min-h-[600px]">
              <section className="admin-section absolute-panel-wrapper">
                <div className="admin-section-header flex-shrink-0">
                  <div className="admin-section-title">
                    <span className="material-symbols-outlined text-danger">
                      format_list_bulleted
                    </span>
                    Monstres Existants
                  </div>
                </div>
                <div className="admin-section-content panel-content-flex">
                  <div className="flex items-center gap-4 mb-6 flex-wrap flex-shrink-0">
                    <div className="flex-1 min-w-[200px] relative">
                      <span className="material-symbols-outlined text-muted absolute left-3 top-1/2 -translate-y-1/2 text-lg pointer-events-none">
                        search
                      </span>
                      <input
                        className="bg-black/20 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-sm w-full outline-none focus-border-primary"
                        type="text"
                        id="monsterSearch"
                        placeholder="Rechercher par nom..."
                        onInput={() => window.renderMonstersList?.()}
                      />
                    </div>
                    <div className="w-[140px] relative">
                      <div className="custom-select-wrapper h-full" id="mLevelFilterWrapper">
                        <div
                          className="custom-select-trigger custom-select-larger"
                          id="mLevelFilterTrigger"
                        >
                          <span className="material-symbols-outlined cs-icon text-muted">
                            filter_alt
                          </span>
                          <span className="flex-1 text-center">Lvl exact</span>
                        </div>
                        <div className="custom-select-options">
                          <div
                            className="custom-option"
                            onClick={() =>
                              window.selectFilterLevelOption?.(
                                '',
                                'Lvl exact',
                                '#94a3b8',
                                'filter_alt',
                              )
                            }
                          >
                            <span className="material-symbols-outlined cs-icon text-muted">
                              filter_alt
                            </span>
                            Tous
                          </div>
                          <div
                            className="custom-option"
                            onClick={() =>
                              window.selectFilterLevelOption?.(1, '1', '#94a3b8', 'star')
                            }
                          >
                            <span className="material-symbols-outlined cs-icon text-muted">
                              star
                            </span>{' '}
                            1
                          </div>
                          <div
                            className="custom-option"
                            onClick={() =>
                              window.selectFilterLevelOption?.(2, '2', '#10b981', 'star')
                            }
                          >
                            <span className="material-symbols-outlined cs-icon text-success">
                              star
                            </span>{' '}
                            2
                          </div>
                          <div
                            className="custom-option"
                            onClick={() =>
                              window.selectFilterLevelOption?.(3, '3', '#3b82f6', 'star')
                            }
                          >
                            <span className="material-symbols-outlined cs-icon text-info">
                              star
                            </span>{' '}
                            3
                          </div>
                          <div
                            className="custom-option"
                            onClick={() =>
                              window.selectFilterLevelOption?.(4, '4', '#a855f7', 'star')
                            }
                          >
                            <span className="material-symbols-outlined cs-icon text-purple">
                              star
                            </span>{' '}
                            4
                          </div>
                          <div
                            className="custom-option"
                            onClick={() =>
                              window.selectFilterLevelOption?.(5, '5', '#f59e0b', 'star')
                            }
                          >
                            <span className="material-symbols-outlined cs-icon text-warning">
                              star
                            </span>{' '}
                            5
                          </div>
                        </div>
                      </div>
                      <input type="hidden" id="monsterLevelFilter" defaultValue="" />
                    </div>
                    <div className="w-[260px] relative">
                      <div
                        className="custom-select-wrapper h-full"
                        id="mListSecretFilterWrapper"
                      >
                        <div
                          className="custom-select-trigger custom-select-larger"
                          id="mListSecretFilterTrigger"
                        >
                          <span className="material-symbols-outlined cs-icon text-muted">
                            filter_list
                          </span>
                          <span className="flex-1 text-left">Tous les secrets</span>
                          <span className="material-symbols-outlined text-muted pointer-events-none">
                            expand_more
                          </span>
                        </div>
                        <div className="custom-select-options">
                          {MONSTER_SECRET_FILTERS.map((sec) => (
                            <div
                              key={sec.value || 'all'}
                              className="custom-option"
                              onClick={() =>
                                window.selectMonsterSecretOption?.(
                                  sec.value,
                                  sec.label,
                                  sec.icon,
                                  sec.hex,
                                )
                              }
                            >
                              <span
                                className={`material-symbols-outlined cs-icon ${sec.iconClass}`}
                              >
                                {sec.icon}
                              </span>
                              {sec.label}
                            </div>
                          ))}
                        </div>
                      </div>
                      <input type="hidden" id="monsterSecretFilter" defaultValue="" />
                    </div>
                    <div className="w-[220px] relative">
                      <div className="custom-select-wrapper h-full" id="mSortWrapper">
                        <div
                          className="custom-select-trigger custom-select-larger"
                          id="mSortTrigger"
                        >
                          <span className="material-symbols-outlined cs-icon text-purple">
                            explore
                          </span>
                          <span className="flex-1 text-left">Secret (Défaut)</span>
                          <span className="material-symbols-outlined text-muted pointer-events-none">
                            expand_more
                          </span>
                        </div>
                        <div className="custom-select-options">
                          <div
                            className="custom-option"
                            onClick={() =>
                              window.selectSortOption?.(
                                'secret',
                                'Secret (Défaut)',
                                'explore',
                                '#a855f7',
                              )
                            }
                          >
                            <span className="material-symbols-outlined cs-icon text-purple">
                              explore
                            </span>
                            Secret (Défaut)
                          </div>
                          <div
                            className="custom-option"
                            onClick={() =>
                              window.selectSortOption?.(
                                'name_asc',
                                'Nom (A-Z)',
                                'sort_by_alpha',
                                '#94a3b8',
                              )
                            }
                          >
                            <span className="material-symbols-outlined cs-icon text-muted">
                              sort_by_alpha
                            </span>
                            Nom (A-Z)
                          </div>
                          <div
                            className="custom-option"
                            onClick={() =>
                              window.selectSortOption?.(
                                'name_desc',
                                'Nom (Z-A)',
                                'sort_by_alpha',
                                '#94a3b8',
                              )
                            }
                          >
                            <span className="material-symbols-outlined cs-icon text-muted text-lg -scale-y-100">
                              sort_by_alpha
                            </span>
                            Nom (Z-A)
                          </div>
                          <div
                            className="custom-option"
                            onClick={() =>
                              window.selectSortOption?.(
                                'lvl_desc',
                                'Niveau (Décroissant)',
                                'star',
                                '#f59e0b',
                              )
                            }
                          >
                            <span className="material-symbols-outlined cs-icon text-warning">
                              star
                            </span>
                            Niveau (Décroissant)
                          </div>
                          <div
                            className="custom-option"
                            onClick={() =>
                              window.selectSortOption?.(
                                'lvl_asc',
                                'Niveau (Croissant)',
                                'star',
                                '#3b82f6',
                              )
                            }
                          >
                            <span className="material-symbols-outlined cs-icon text-info">
                              star
                            </span>
                            Niveau (Croissant)
                          </div>
                        </div>
                      </div>
                      <input type="hidden" id="monsterSort" defaultValue="secret" />
                    </div>
                  </div>
                  <div
                    className="pve-grid flex-1 overflow-y-auto overflow-x-hidden min-h-0 pb-6 px-4 pt-5"
                    id="monstersList"
                  ></div>
                </div>
              </section>
            </div>
          </div>

          {/* === MUTATIONS === */}
          <div className="admin-split-layout">
            <section className="admin-section m-0 transition-all" id="mutationFormPanel">
              <div className="admin-section-header">
                <div className="admin-section-title">
                  <span className="material-symbols-outlined text-purple">pets</span>
                  Créer une Mutation
                </div>
              </div>
              <div className="admin-section-content">
                <form id="mutationForm">
                  <div className="form-grid">
                    <div className="form-group col-span-2">
                      <label className="flex-center flex-center-gap">
                        <span className="material-symbols-outlined text-purple text-lg">
                          badge
                        </span>{' '}
                        Nom de la mutation
                      </label>
                      <input
                        className="form-control"
                        type="text"
                        id="mutName"
                        placeholder="Ex: Griffes d'acier"
                        required
                      />
                    </div>
                    <div className="form-group col-span-2">
                      <label htmlFor="mutLevel" className="flex-center flex-center-gap">
                        <span className="material-symbols-outlined text-lg text-muted">
                          description
                        </span>
                        Description
                      </label>
                      <textarea
                        className="form-control"
                        id="mutDesc"
                        rows={2}
                        placeholder="Description courte..."
                        required
                      ></textarea>
                    </div>
                    <div className="form-group">
                      <label className="flex-center flex-center-gap">
                        <span className="material-symbols-outlined text-lg text-success">
                          star
                        </span>
                        Niveau
                      </label>
                      <input
                        className="form-control"
                        type="number"
                        id="mutLevel"
                        defaultValue="1"
                        min={1}
                        max={5}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="mutColor" className="flex-center flex-center-gap">
                        <span className="material-symbols-outlined text-gold text-lg">
                          palette
                        </span>{' '}
                        Couleur HEX
                      </label>
                      <input
                        className="form-control"
                        type="text"
                        id="mutColor"
                        defaultValue="#e879f9"
                        placeholder="#RRGGBB"
                      />
                    </div>
                    <div className="form-group col-span-2">
                      <label htmlFor="mutIcon" className="flex-center flex-center-gap">
                        <span className="material-symbols-outlined text-lg text-info">
                          add_reaction
                        </span>
                        Icone (Material)
                      </label>
                      <input
                        className="form-control"
                        type="text"
                        id="mutIcon"
                        defaultValue="pets"
                        placeholder="pets"
                      />
                    </div>
                  </div>
                  <div className="mt-3 flex-center gap-4">
                    <button
                      className="btn btn-primary bg-gradient-purple shadow-purple"
                      type="submit"
                      id="btnSubmitMutation"
                    >
                      Créer la mutation
                    </button>
                    <button
                      className="btn btn-secondary hidden"
                      type="button"
                      id="btnCancelMutation"
                      onClick={() => window.cancelMutationEdit?.()}
                    >
                      Annuler
                    </button>
                  </div>
                </form>
              </div>
            </section>

            <div className="relative h-full min-h-400">
              <section className="admin-section absolute-panel-wrapper">
                <div className="admin-section-header flex-shrink-0">
                  <div className="admin-section-title">
                    <span className="material-symbols-outlined text-purple">
                      format_list_bulleted
                    </span>
                    Mutations Existantes
                  </div>
                </div>
                <div className="admin-section-content panel-content-flex">
                  <div
                    className="pve-list custom-scrollbar flex-1 overflow-y-auto min-h-0 pr-4 -mr-2 pb-4"
                    id="mutationsList"
                  ></div>
                </div>
              </section>
            </div>
          </div>

          {/* === DONJONS === */}
          <div className="admin-split-layout">
            <section className="admin-section m-0 transition-all" id="dungeonFormPanel">
              <div className="admin-section-header">
                <div className="admin-section-title">
                  <span className="material-symbols-outlined text-danger">castle</span>
                  Créer un Donjon
                </div>
              </div>
              <div className="admin-section-content">
                <form id="dungeonForm">
                  <div className="form-grid">
                    <div className="form-group col-span-2">
                      <label htmlFor="dName">Nom du donjon</label>
                      <input className="form-control" type="text" id="dName" required />
                    </div>
                    <div className="form-group col-span-2">
                      <label htmlFor="dDesc">Description</label>
                      <input className="form-control" type="text" id="dDesc" />
                    </div>
                    <div className="form-group">
                      <label htmlFor="dLevel">Niveau Recommandé</label>
                      <input
                        className="form-control"
                        type="number"
                        id="dLevel"
                        defaultValue="1"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="dDifficulty">Difficulté (Crânes)</label>
                      <input
                        className="form-control"
                        type="number"
                        id="dDifficulty"
                        defaultValue="0"
                        min={0}
                        max={9}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="dMaxHeroes">Héros Maximum</label>
                      <input
                        className="form-control"
                        type="number"
                        id="dMaxHeroes"
                        defaultValue="1"
                        min={1}
                        max={4}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="dUnlockCost">Coût de dévérouillage (Or)</label>
                      <input
                        className="form-control"
                        type="number"
                        id="dUnlockCost"
                        defaultValue="0"
                        min={0}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="dEntryCost">Coût d&apos;Entrée (Or)</label>
                      <input
                        className="form-control"
                        type="number"
                        id="dEntryCost"
                        defaultValue="0"
                        min={0}
                      />
                    </div>
                    <div className="form-group col-span-2">
                      <label>Condition Alchimie (Secret requis et niveau)</label>
                      <div className="flex items-start gap-4">
                        <div
                          className="custom-select-wrapper z-90 flex-2"
                          id="dRequiredSecretWrapper"
                        >
                          <div className="custom-select-trigger">
                            <span className="cs-label">
                              <span className="material-symbols-outlined cs-icon text-muted">
                                close
                              </span>
                              Aucun (Optionnel)
                            </span>
                            <span className="material-symbols-outlined text-slate-500 text-xl">
                              expand_more
                            </span>
                          </div>
                          <div className="custom-select-options custom-options">
                            {NATIVE_SECRETS.map((sec) => (
                              <div
                                key={sec.value || 'none'}
                                className="custom-option"
                                data-value={sec.value}
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
                          <input type="hidden" id="dRequiredSecret" defaultValue="" />
                        </div>
                        <div className="flex-1">
                          <input
                            className="form-control"
                            type="number"
                            id="dRequiredSecretLevel"
                            defaultValue="1"
                            min={1}
                            placeholder="Niveau"
                            title="Niveau du secret"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="form-group col-span-2">
                      <label>Salles du Donjon (Ordre d&apos;exploration)</label>

                      <div className="mb-4 grid grid-cols-3 gap-3">
                        <button
                          className="pve-room-btn btn-room bg-red-glass border border-red-500/30 text-danger"
                          type="button"
                          onClick={() => window.addRoom?.('COMBAT')}
                        >
                          <span className="material-symbols-outlined text-lg">swords</span> +
                          Combat
                        </button>
                        <button
                          className="pve-room-btn btn-room bg-crimson-500/10 border border-crimson-500/30 text-crimson"
                          type="button"
                          onClick={() => window.addRoom?.('BOSS')}
                        >
                          <span className="material-symbols-outlined text-lg">skull</span> +
                          Boss
                        </button>
                        <button
                          className="pve-room-btn btn-room bg-amber-500/10 border border-amber-500/30 text-amber"
                          type="button"
                          onClick={() => window.addRoom?.('TREASURE')}
                        >
                          <span className="material-symbols-outlined text-lg">
                            shopping_bag
                          </span>{' '}
                          + Trésor
                        </button>
                        <button
                          className="pve-room-btn btn-room bg-purple-glass border border-purple-500/30 text-purple"
                          type="button"
                          onClick={() => window.addRoom?.('ALTERATION')}
                        >
                          <span className="material-symbols-outlined text-lg">blur_on</span> +
                          Altération
                        </button>
                        <button
                          className="pve-room-btn btn-room bg-emerald-500/10 border border-emerald-500/30 text-emerald"
                          type="button"
                          onClick={() => window.addRoom?.('RENCONTRE')}
                        >
                          <span className="material-symbols-outlined text-lg">
                            storefront
                          </span>{' '}
                          + Rencontre
                        </button>
                        <button
                          className="pve-room-btn btn-room bg-red-600/5 border border-red-600/20 text-red-400"
                          type="button"
                          onClick={() => window.addRoom?.('PIEGE')}
                        >
                          <span className="material-symbols-outlined text-lg">warning</span> +
                          Piège
                        </button>
                        <button
                          className="pve-room-btn btn-room bg-amber-500/5 border border-amber-500/30 text-gold"
                          type="button"
                          onClick={() => window.addRoom?.('PORTE_ETRANGE')}
                        >
                          <span className="material-symbols-outlined text-lg">
                            door_front
                          </span>{' '}
                          + Porte Étrange
                        </button>
                      </div>

                      <div
                        id="selectedRoomsContainer"
                        className="flex flex-col gap-3 p-4 rounded-lg bg-black/20 border border-dashed border-white/10 min-h-[100px]"
                      >
                        <div
                          className="text-muted text-center py-8 text-[0.85rem]"
                          id="emptyRoomsMsg"
                        >
                          Le donjon est vide. Ajoutez des salles.
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex-center gap-4">
                    <button className="btn btn-primary" type="submit" id="btnSubmitDungeon">
                      Créer le donjon
                    </button>
                    <button
                      className="btn btn-secondary hidden"
                      type="button"
                      id="btnCancelDungeon"
                      onClick={() => window.cancelDungeonEdit?.()}
                    >
                      Annuler
                    </button>
                  </div>
                </form>
              </div>
            </section>

            <div className="relative h-full min-h-400">
              <section className="admin-section absolute-panel-wrapper">
                <div className="admin-section-header flex-shrink-0 flex-between flex-center flex-wrap gap-2">
                  <div className="admin-section-title">
                    <span className="material-symbols-outlined text-danger">map</span>
                    Donjons Existants
                  </div>
                  <div className="flex gap-2">
                    <div className="custom-select-wrapper w-[250px] z-100">
                      <div className="custom-select-trigger">
                        <span className="cs-label">
                          <span className="material-symbols-outlined cs-icon text-muted">
                            filter_list
                          </span>
                          Tous les secrets
                        </span>
                        <span className="material-symbols-outlined icon-sm">expand_more</span>
                      </div>
                      <div className="custom-select-options custom-options">
                        {DUNGEON_SECRET_FILTERS.map((sec) => (
                          <div
                            key={sec.value || 'all'}
                            className="custom-option"
                            data-value={sec.value}
                          >
                            <span
                              className={`material-symbols-outlined cs-icon ${sec.iconClass}`}
                            >
                              {sec.icon}
                            </span>
                            {sec.label}
                          </div>
                        ))}
                      </div>
                      <input type="hidden" id="dungeonSecretFilter" defaultValue="" />
                    </div>
                    <div className="custom-select-wrapper w-[140px] z-100">
                      <div className="custom-select-trigger">
                        <span className="cs-label">
                          <span className="material-symbols-outlined cs-icon text-muted">
                            filter_alt
                          </span>
                          Lvl exact
                        </span>
                        <span className="material-symbols-outlined icon-sm">expand_more</span>
                      </div>
                      <div className="custom-select-options custom-options">
                        <div className="custom-option" data-value="">
                          <span className="material-symbols-outlined cs-icon text-muted">
                            filter_alt
                          </span>
                          Tous
                        </div>
                        <div className="custom-option" data-value="1">
                          <span className="material-symbols-outlined cs-icon text-muted">
                            star
                          </span>{' '}
                          1
                        </div>
                        <div className="custom-option" data-value="2">
                          <span className="material-symbols-outlined cs-icon text-success">
                            star
                          </span>{' '}
                          2
                        </div>
                        <div className="custom-option" data-value="3">
                          <span className="material-symbols-outlined cs-icon text-info">
                            star
                          </span>{' '}
                          3
                        </div>
                        <div className="custom-option" data-value="4">
                          <span className="material-symbols-outlined cs-icon text-purple">
                            star
                          </span>{' '}
                          4
                        </div>
                        <div className="custom-option" data-value="5">
                          <span className="material-symbols-outlined cs-icon text-warning">
                            star
                          </span>{' '}
                          5
                        </div>
                      </div>
                      <input type="hidden" id="dungeonLevelFilter" defaultValue="" />
                    </div>
                  </div>
                </div>
                <div className="admin-section-content panel-content-flex">
                  <div
                    className="pve-grid flex-1 overflow-y-auto overflow-x-hidden min-h-0 pb-6 px-4 pt-5"
                    id="dungeonsList"
                  ></div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>

      <div className="pve-notif" id="pveNotif"></div>
    </>
  );
}
