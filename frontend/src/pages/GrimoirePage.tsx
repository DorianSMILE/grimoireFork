import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SpellEditingPreview } from '../components/grimoire/SpellCard';
import { SpellFilterBar } from '../components/grimoire/SpellFilterBar';
import { SpellForgePanel } from '../components/grimoire/SpellForgePanel';
import { isAlreadyAuthenticated } from '../services/api';

export function GrimoirePage() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Grimoire des Sorts';

    if (!isAlreadyAuthenticated()) {
      navigate('/login', { replace: true });
      return;
    }

    let cancelled = false;

    async function bootGrimoire() {
      const authUrl = '/js/services/auth.js?v=32';
      const appUrl = '/js/app.js?v=16';
      await import(/* @vite-ignore */ authUrl);
      if (typeof window.initGrimoirePage !== 'function') {
        await import(/* @vite-ignore */ appUrl);
      }
      if (!cancelled && typeof window.initGrimoirePage === 'function') {
        await window.initGrimoirePage();
      }
    }

    bootGrimoire().catch((err) => {
      console.error('Erreur initialisation Grimoire:', err);
    });

    return () => {
      cancelled = true;
      if (typeof window.hideGlobalTooltip === 'function') {
        window.hideGlobalTooltip(true);
      }
    };
  }, [navigate]);

  return (
    <>
      <main className="grimoire-main single-col">
        <div className="magic-rock"></div>

        {/* Colonne Gauche : Paramètres de Base du Sort */}
        <SpellForgePanel />

        {/* Colonne Droite : Liste des Sorts Existants */}
        <div className="panel">
          <div className="panel-title">
            <span>Grimoire des Sorts</span>
            <div className="flex-center gap-2">
              <button
                className="btn btn-secondary items-center gap-1 text-sm p-[0.8rem] inline-flex"
                type="button"
                id="btnToggleDisplayMode"
                onClick={() => window.toggleDisplayMode?.()}
                title="Basculer entre le mode défilement (hauteur de la Forge) et le mode étendu (tous les sorts)"
              >
                <span
                  className="material-symbols-outlined text-lg leading-none"
                  id="toggleDisplayIcon"
                >
                  unfold_less
                </span>
                <span id="toggleDisplayText">Mode Scroll</span>
              </button>
              <button
                className="btn btn-secondary text-sm p-[0.8rem]"
                type="button"
                onClick={() => window.loadSpells?.(true)}
              >
                Actualiser
              </button>
            </div>
          </div>

          {/* Barre de Filtres et Tris Premium */}
          <SpellFilterBar />

          <div className="spells-list" id="createdSpellsContainer">
            <app-loader message="Chargement des sorts..."></app-loader>
          </div>
        </div>
      </main>

      {/* Aperçu du sort en cours d'édition (Flottant) */}
      <SpellEditingPreview />
    </>
  );
}
