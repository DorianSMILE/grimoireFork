import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAlreadyAuthenticated } from '../services/api';

export function AlchemyPage() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Grimoire - Alchimie';

    if (!isAlreadyAuthenticated()) {
      navigate('/login', { replace: true });
      return;
    }

    let cancelled = false;

    async function bootAlchemy() {
      const uiUrl = '/js/ui.js?v=2';
      const authUrl = '/js/services/auth.js?v=32';
      const alchemyUrl = '/js/pages/alchemy.js?v=1786180000004';

      await import(/* @vite-ignore */ uiUrl);
      await import(/* @vite-ignore */ authUrl);
      if (typeof window.initAlchemyPage !== 'function') {
        await import(/* @vite-ignore */ alchemyUrl);
      }
      if (!cancelled && typeof window.initAlchemyPage === 'function') {
        await window.initAlchemyPage();
      }
    }

    bootAlchemy().catch((err) => {
      console.error('Erreur initialisation Alchimie:', err);
    });

    return () => {
      cancelled = true;
      window.cleanupAlchemyPage?.();
    };
  }, [navigate]);

  return (
    <>
      <main className="block">
        {/* État non connecté */}
        <div
          id="alchemyAuthLocked"
          className="is-hidden flex flex-col items-center justify-center h-[60vh] text-center text-white"
        >
          <span className="material-symbols-outlined text-crit mb-4 text-[4rem]">lock</span>
          <h1 className="mb-4 text-[2rem] font-outfit">Veuillez vous connecter</h1>
          <p className="text-muted max-w-[400px] mb-8 text-[1.1rem]">
            Vous devez être connecté pour accéder à cette page.
          </p>
        </div>

        {/* État Alchimie Bloquée */}
        <div
          id="alchemyFeatureLocked"
          className="is-hidden flex flex-col items-center justify-center h-[60vh] text-center text-white"
        >
          <span className="material-symbols-outlined text-crit mb-4 text-[4rem]">lock</span>
          <h1 className="mb-4 text-[2rem] font-outfit">Alchimie Bloquée</h1>
          <p className="text-muted max-w-[400px] mb-8 text-[1.1rem]">
            Vous devez débloquer l&apos;Alchimie pour y accéder. L&apos;accès coûte 150 or.
          </p>
          <button
            type="button"
            onClick={() => window.promptUnlockFeature?.('alchemy', 'Alchimie', 150)}
            className="bg-success text-white border-0 py-3 px-6 rounded-lg font-semibold font-outfit cursor-pointer text-[1.1rem] shadow-success transition-all hover:bg-emerald-600"
          >
            Débloquer pour 150{' '}
            <span className="material-symbols-outlined text-[1.2rem] align-middle text-gold">
              monetization_on
            </span>
          </button>
        </div>

        <div
          className="alchemy-main max-w-[1400px] my-8 mx-auto flex-row gap-8 items-stretch justify-center h-[calc(100vh-160px)]"
          id="alchemyMain"
        >
          {/* Left Panel: Recipes List */}
          <div className="panel flex-1 max-w-[450px] flex flex-col">
            <div className="panel-title">
              <div className="flex items-center gap-[10px]">
                <span className="material-symbols-outlined text-emerald-500">menu_book</span>
                Recettes Alchimique
              </div>
            </div>

            <div className="filters-container mb-4 flex gap-2">
              <input
                className="form-control m-0 p-[0.6rem] text-[0.85rem]"
                type="text"
                id="searchRecipeName"
                placeholder="Rechercher par nom..."
                aria-label="Rechercher par nom"
                onInput={() => window.renderRecipesList?.()}
              />
              <div className="custom-select-wrapper flex-1 z-20">
                <div className="custom-select-trigger p-[0.6rem] text-[0.85rem] h-full box-border">
                  <span className="cs-label">
                    <span className="material-symbols-outlined cs-icon text-emerald-400">
                      inventory_2
                    </span>{' '}
                    Consommable
                  </span>
                  <span className="material-symbols-outlined text-muted text-[18px]">
                    expand_more
                  </span>
                </div>
                <div className="custom-select-options custom-options">
                  <div className="custom-option" data-value="">
                    <span className="material-symbols-outlined cs-icon text-muted">apps</span>{' '}
                    Toutes
                  </div>
                  <div className="custom-option" data-value="NOUVEAUTE">
                    <span className="material-symbols-outlined cs-icon text-error">
                      fiber_new
                    </span>{' '}
                    Nouveauté
                  </div>
                  <div className="custom-option" data-value="GIVE_ANOMALY">
                    <span className="material-symbols-outlined cs-icon text-purple-400">
                      flare
                    </span>{' '}
                    Anomalie
                  </div>
                  <div className="custom-option selected" data-value="GIVE_CONSUMABLE">
                    <span className="material-symbols-outlined cs-icon text-emerald-400">
                      inventory_2
                    </span>{' '}
                    Consommable
                  </div>
                  <div className="custom-option" data-value="GIVE_EQUIPMENT">
                    <span className="material-symbols-outlined cs-icon text-amber-500">
                      shield
                    </span>{' '}
                    Équipement
                  </div>
                  <div className="custom-option" data-value="UNLOCK_FEATURE">
                    <span className="material-symbols-outlined cs-icon text-sky-400">key</span>{' '}
                    Secret
                  </div>
                  <div className="custom-option" data-value="GIVE_SPIRIT_XP">
                    <span className="material-symbols-outlined cs-icon text-pink-400">
                      auto_awesome
                    </span>{' '}
                    Spiritualité
                  </div>
                </div>
                <input type="hidden" id="filterRewardType" defaultValue="GIVE_CONSUMABLE" />
              </div>
            </div>

            <div
              className="custom-scrollbar flex-1 flex flex-col gap-4 overflow-y-auto pr-2"
              id="playerRecipesList"
            >
              <app-loader message="Chargement du Grimoire Alchimique..."></app-loader>
            </div>
          </div>

          {/* Right Panel: Cauldron */}
          <div
            className="alchemy-panel custom-scrollbar flex-2 flex flex-col items-center min-h-0"
            id="cauldronPanel"
          >
            <div className="text-center text-muted m-auto">
              <span className="material-symbols-outlined text-6xl text-emerald-500/30">
                experiment
              </span>
              <p className="mt-4">
                Sélectionnez une recette dans le grimoire à gauche pour l&apos;étudier.
              </p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
