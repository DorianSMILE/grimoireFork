import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAlreadyAuthenticated } from '../services/api';

export function AlchemyAdminPage() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Admin Alchimie - Grimoire';

    if (!isAlreadyAuthenticated()) {
      navigate('/login', { replace: true });
      return;
    }

    let cancelled = false;

    async function bootAlchemyAdmin() {
      const uiUrl = '/js/ui.js?v=2';
      const authUrl = '/js/services/auth.js?v=32';
      const alchemyAdminUrl = '/js/pages/alchemy-admin.js?v=2';

      await import(/* @vite-ignore */ uiUrl);
      await import(/* @vite-ignore */ authUrl);
      if (typeof window.initAlchemyAdminPage !== 'function') {
        await import(/* @vite-ignore */ alchemyAdminUrl);
      }
      if (!cancelled && typeof window.initAlchemyAdminPage === 'function') {
        await window.initAlchemyAdminPage();
      }
    }

    bootAlchemyAdmin().catch((err) => {
      console.error('Erreur initialisation Admin Alchimie:', err);
    });

    return () => {
      cancelled = true;
      window.cleanupAlchemyAdminPage?.();
    };
  }, [navigate]);

  return (
    <>
      <div
        id="alchemyAdminWarning"
        className="hidden flex flex-col items-center justify-center h-[80vh] text-center text-white"
      >
        <span className="material-symbols-outlined text-crit mb-4 text-[4rem]">gpp_bad</span>
        <h1 className="mb-4 text-[2rem] font-outfit">Accès Refusé</h1>
        <p className="text-muted max-w-[400px] mb-8 text-[1.1rem]">
          Vous n&apos;avez pas les droits d&apos;administrateur nécessaires pour accéder à la
          configuration de l&apos;alchimie.
        </p>
      </div>

      <main className="block" id="alchemyAdminContent">
        <div className="flex flex-row justify-center items-stretch gap-8 mx-auto my-8 w-full max-w-[1400px]">
          <div className="panel flex-1 flex flex-col" id="recipePanel">
            <div className="panel-title">
              <span className="material-symbols-outlined text-info">science</span>
              Créer/Éditer une Recette Alchimique
            </div>

            <form id="recipeForm" className="flex flex-col gap-2">
              <input type="hidden" id="recipeId" defaultValue="" />
              <div className="form-row">
                <div className="form-group flex-1">
                  <label htmlFor="recipeName">Nom de la recette</label>
                  <input
                    type="text"
                    id="recipeName"
                    required
                    placeholder="Ex: Transmutation Majeure"
                  />
                </div>
                <div className="form-group flex-2">
                  <label htmlFor="recipeDesc">Description</label>
                  <input
                    type="text"
                    id="recipeDesc"
                    placeholder="Ex: Convertit des anomalies en golem."
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="costGold" className="text-amber mb-1 text-sm">
                    <span className="material-symbols-outlined icon-sm align-middle">
                      monetization_on
                    </span>{' '}
                    Coût Or
                  </label>
                  <input type="number" id="costGold" defaultValue="0" min={0} step="0.1" />
                </div>
                <div className="form-group">
                  <label htmlFor="costSpirit" className="text-emerald mb-1 text-sm">
                    <span className="material-symbols-outlined icon-sm align-middle">star</span>{' '}
                    Coût XP Spirit
                  </label>
                  <input type="number" id="costSpirit" defaultValue="0" min={0} />
                </div>
              </div>

              <hr className="my-1 border-divider" />

              <div className="form-group m-0">
                <label>Ingrédients : Anomalies</label>
                <div className="req-list mb-1" id="reqAnomaliesList"></div>
                <button
                  className="btn btn-secondary w-full text-sm p-1"
                  type="button"
                  onClick={() => window.addRequirement?.('anomalie')}
                >
                  + Ajouter Anomalie
                </button>
              </div>
              <div className="form-group m-0">
                <label>Ingrédients : Consommables</label>
                <div className="req-list mb-1" id="reqConsumablesList"></div>
                <button
                  className="btn btn-secondary w-full text-sm p-1"
                  type="button"
                  onClick={() => window.addRequirement?.('consumable')}
                >
                  + Ajouter Consommable
                </button>
              </div>

              <hr className="my-1 border-divider" />

              <div className="panel-title text-base mb-0 pb-0 border-none">
                <span className="material-symbols-outlined text-purple">auto_awesome</span> Résultat
              </div>

              <div className="form-row mb-0">
                <div className="form-group flex-1">
                  <label>Type de récompense</label>
                  <div className="custom-select-wrapper z-10">
                    <div className="custom-select-trigger">
                      <span className="cs-label text-sm">
                        <span className="material-symbols-outlined cs-icon text-purple">star</span>{' '}
                        Donner Anomalie
                      </span>
                      <span className="material-symbols-outlined text-muted icon-sm">
                        expand_more
                      </span>
                    </div>
                    <div className="custom-select-options custom-options">
                      <div className="custom-option" data-value="GIVE_ANOMALY">
                        <span className="material-symbols-outlined cs-icon text-purple">star</span>{' '}
                        Donner Anomalie
                      </div>
                      <div className="custom-option" data-value="GIVE_CONSUMABLE">
                        <span className="material-symbols-outlined cs-icon text-success">
                          inventory_2
                        </span>
                        Donner Consommable
                      </div>
                      <div className="custom-option" data-value="GIVE_EQUIPMENT">
                        <span className="material-symbols-outlined cs-icon text-warning">
                          shield
                        </span>
                        Donner Equipement
                      </div>
                      <div className="custom-option" data-value="UNLOCK_FEATURE">
                        <span className="material-symbols-outlined cs-icon text-warning">key</span>{' '}
                        Secret
                      </div>
                      <div className="custom-option" data-value="GIVE_SPIRIT_XP">
                        <span className="material-symbols-outlined cs-icon text-mana">
                          self_improvement
                        </span>
                        Gagner XP Spiritualité
                      </div>
                    </div>
                    <input type="hidden" id="rewardType" defaultValue="GIVE_ANOMALY" />
                  </div>
                </div>
                <div className="form-group flex-2" id="rewardNameContainer">
                  <label htmlFor="rewardName">Nom de l&apos;objet (Résultat)</label>
                  <input type="text" id="rewardName" required placeholder="Ex: Potion" />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="rewardQty">Quantité</label>
                  <input type="number" id="rewardQty" defaultValue="1" min={1} />
                </div>
                <div className="form-group">
                  <label htmlFor="rewardLevel" id="rewardLevelLabel">
                    Niveau du Secret
                  </label>
                  <input type="number" id="rewardLevel" defaultValue="1" min={1} />
                </div>
              </div>

              <div className="mt-2 flex gap-2">
                <button className="btn flex-1 p-2" type="submit">
                  Enregistrer la recette
                </button>
                <button
                  className="btn btn-danger flex-1 p-2 hidden"
                  type="button"
                  id="cancelEditBtn"
                  onClick={() => window.cancelEdit?.()}
                >
                  Annuler l&apos;édition
                </button>
              </div>
              <div className="mt-2 font-bold text-center text-sm" id="formMsg"></div>
            </form>
          </div>

          <div className="flex-1 relative">
            <div className="panel absolute inset-0 flex flex-col m-0">
              <div className="panel-title flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-purple">auto_awesome</span>
                  Recettes Existantes
                </div>
              </div>

              <div className="filters-container mb-4 flex gap-2">
                <div className="flex-1">
                  <input
                    className="form-control m-0 p-2 text-sm w-full"
                    type="text"
                    id="searchRecipeName"
                    placeholder="Rechercher par nom..."
                    onInput={() => window.renderRecipesList?.()}
                  />
                </div>
                <div className="custom-select-wrapper flex-1 z-20">
                  <div className="custom-select-trigger">
                    <span className="cs-label text-sm">Toutes les recettes</span>
                    <span className="material-symbols-outlined text-muted icon-sm">
                      expand_more
                    </span>
                  </div>
                  <div className="custom-select-options custom-options">
                    <div className="custom-option" data-value="">
                      <span className="material-symbols-outlined cs-icon text-muted">
                        filter_list_off
                      </span>
                      Toutes les recettes
                    </div>
                    <div className="custom-option" data-value="GIVE_ANOMALY">
                      <span className="material-symbols-outlined cs-icon text-purple">star</span>{' '}
                      Anomalie
                    </div>
                    <div className="custom-option" data-value="GIVE_CONSUMABLE">
                      <span className="material-symbols-outlined cs-icon text-success">
                        inventory_2
                      </span>
                      Consommable
                    </div>
                    <div className="custom-option" data-value="GIVE_EQUIPMENT">
                      <span className="material-symbols-outlined cs-icon text-warning">
                        shield
                      </span>
                      Equipement
                    </div>
                    <div className="custom-option" data-value="UNLOCK_FEATURE">
                      <span className="material-symbols-outlined cs-icon text-warning">key</span>{' '}
                      Secret
                    </div>
                    <div className="custom-option" data-value="GIVE_SPIRIT_XP">
                      <span className="material-symbols-outlined cs-icon text-mana">
                        self_improvement
                      </span>{' '}
                      XP Spiritualité
                    </div>
                  </div>
                  <input type="hidden" id="filterRewardType" defaultValue="" />
                </div>
              </div>

              <div
                className="flex-1 flex flex-col gap-4 overflow-y-auto pr-2 min-h-0"
                id="recipesList"
              >
                Chargement...
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
