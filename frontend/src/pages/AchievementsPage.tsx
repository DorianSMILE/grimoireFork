import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAlreadyAuthenticated } from '../services/api';

export function AchievementsPage() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Succès - Grimoire';

    if (!isAlreadyAuthenticated()) {
      navigate('/login', { replace: true });
      return;
    }

    let cancelled = false;

    async function bootAchievements() {
      const uiUrl = '/js/ui.js?v=2';
      const authUrl = '/js/services/auth.js?v=32';
      const achievementsUrl = '/js/pages/achievements.js?v=1786180000041';

      await import(/* @vite-ignore */ uiUrl);
      await import(/* @vite-ignore */ authUrl);
      if (typeof window.initAchievementsPage !== 'function') {
        await import(/* @vite-ignore */ achievementsUrl);
      }
      if (!cancelled && typeof window.initAchievementsPage === 'function') {
        await window.initAchievementsPage();
      }
    }

    bootAchievements().catch((err) => {
      console.error('Erreur initialisation Succès:', err);
    });

    return () => {
      cancelled = true;
      window.cleanupAchievementsPage?.();
    };
  }, [navigate]);

  return (
    <>
      <main className="block">
        <div className="achievements-main">
          <div className="achievements-header">
            <div className="achievements-kpi-card">
              <div className="kpi-title">
                <span className="material-symbols-outlined text-warning">emoji_events</span>
                Progression des Succès
              </div>
              <div className="kpi-score-row">
                <span className="kpi-score-big" id="kpiScore">
                  0
                </span>
                <span className="kpi-score-total" id="kpiTotal">
                  / 0
                </span>
              </div>
              <div className="achievements-progress-track">
                <div className="achievements-progress-fill" id="kpiProgressBar"></div>
              </div>
              <span className="text-xs text-muted" id="kpiPercentage">
                0% complété
              </span>
            </div>

            <div className="achievements-title-card">
              <div className="title-card-title">
                <span className="material-symbols-outlined text-purple-400">military_tech</span>
                Titre Actif &amp; Distinctions
              </div>
              <div className="active-title-preview">
                <span className="text-xs text-muted">Affiché en jeu :</span>
                <span className="title-badge-gold" id="activeTitleBadge">
                  Aucun titre équipé
                </span>
              </div>
              <div className="title-picker-row">
                <div className="custom-select-wrapper title-custom-select" id="titleSelectWrapper">
                  <div className="custom-select-trigger" id="titleSelectTrigger">
                    <span className="cs-label" id="titleSelectLabel">
                      <span className="material-symbols-outlined cs-icon text-muted">
                        military_tech
                      </span>
                      <span>-- Aucun titre --</span>
                    </span>
                    <span className="material-symbols-outlined cs-arrow">expand_more</span>
                  </div>
                  <div
                    className="custom-select-options custom-scrollbar"
                    id="titleSelectOptions"
                  ></div>
                </div>
                <button
                  type="button"
                  className="btn-equip-title"
                  onClick={() => window.handleEquipTitle?.()}
                >
                  <span className="material-symbols-outlined text-sm">check</span>
                  Équiper
                </button>
              </div>
            </div>
          </div>

          <div className="achievements-filters" id="achievementsFilters"></div>

          <div className="achievements-grid" id="achievementsGrid">
            <div className="col-span-full">
              <app-loader message="Chargement de vos succès..."></app-loader>
            </div>
          </div>
        </div>

        <aside className="hub-nav-sidebar" aria-label="Navigation profil">
          <div className="hub-tabs-container">
            <a href="/secrets" className="hub-tab-btn tab-secrets" title="Mes Secrets">
              <span className="material-symbols-outlined hub-tab-icon">key</span>
              <span className="hub-tab-label">Secrets</span>
            </a>
            <a
              href="/dungeon-stats"
              className="hub-tab-btn tab-stats"
              title="Statistiques PvE"
            >
              <span className="material-symbols-outlined hub-tab-icon">insights</span>
              <span className="hub-tab-label">Stats</span>
            </a>
            <a
              href="/achievements"
              className="hub-tab-btn tab-achievements active"
              title="Succès & Titres"
            >
              <span className="material-symbols-outlined hub-tab-icon">emoji_events</span>
              <span className="hub-tab-label">Succès</span>
            </a>
          </div>
        </aside>
      </main>
    </>
  );
}
