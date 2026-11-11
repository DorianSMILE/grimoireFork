import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAlreadyAuthenticated } from '../services/api';

export function DungeonStatsPage() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Grimoire - Statistiques des Donjons';

    if (!isAlreadyAuthenticated()) {
      navigate('/login', { replace: true });
      return;
    }

    let cancelled = false;

    async function bootDungeonStats() {
      const uiUrl = '/js/ui.js?v=2';
      const authUrl = '/js/services/auth.js?v=29';
      const dungeonStatsUrl = '/js/pages/dungeon-stats.js?v=3';

      await import(/* @vite-ignore */ uiUrl);
      await import(/* @vite-ignore */ authUrl);
      if (typeof window.initDungeonStatsPage !== 'function') {
        await import(/* @vite-ignore */ dungeonStatsUrl);
      }
      if (!cancelled && typeof window.initDungeonStatsPage === 'function') {
        await window.initDungeonStatsPage();
      }
    }

    bootDungeonStats().catch((err) => {
      console.error('Erreur initialisation Statistiques PvE:', err);
    });

    return () => {
      cancelled = true;
      window.cleanupDungeonStatsPage?.();
    };
  }, [navigate]);

  return (
    <>
      <app-navbar active-page="dungeon-stats"></app-navbar>

      <main className="w-full max-w-[1400px] mx-auto p-8 stats-main">
        <div className="flex items-center justify-between mb-8">
          <h2 className="font-outfit text-[2.5rem] m-0 leading-none flex items-center gap-3">
            <span className="material-symbols-outlined text-info stats-header-icon">insights</span>
            <span className="logo-text-gradient logo-dungeon">Statistiques PvE</span>
          </h2>
          <div className="flex items-center gap-4">
            <button
              type="button"
              id="resetTutorialsBtn"
              className="btn-reset-tutorials"
              onClick={() => window.resetTutorials?.()}
            >
              <span className="material-symbols-outlined text-info">restart_alt</span>
              <span>Réinitialiser les tutoriels</span>
            </button>
            <div
              className="custom-select-wrapper dungeon-selector w-[280px] z-50"
              id="dungeonSelectWrapper"
              tabIndex={0}
            >
              <div className="custom-select-trigger" id="dungeonSelectTrigger">
                <div className="cs-content" id="dungeonSelectContent">
                  Tous les donjons
                </div>
                <span className="material-symbols-outlined cs-arrow">expand_more</span>
              </div>
              <div className="custom-select-options max-h-[400px]" id="dungeonSelectOptions"></div>
            </div>
          </div>
        </div>

        <app-loader id="statsLoader" message="Analyse des archives..."></app-loader>

        <div id="statsContent" className="is-hidden">
          <div className="kpi-grid">
            <div className="kpi-card">
              <div className="kpi-icon">
                <span className="material-symbols-outlined">swords</span>
              </div>
              <div className="kpi-info">
                <div className="kpi-value" id="kpi-runs">
                  0
                </div>
                <div className="kpi-label">Participations Totales</div>
              </div>
            </div>
            <div className="kpi-card kpi-card-winrate">
              <div className="kpi-icon kpi-icon-winrate">
                <span className="material-symbols-outlined">emoji_events</span>
              </div>
              <div className="kpi-info">
                <div className="kpi-value" id="kpi-winrate">
                  0%
                </div>
                <div className="kpi-label">Taux de Victoire</div>
              </div>
            </div>
            <div className="kpi-card kpi-card-deathrate">
              <div className="kpi-icon kpi-icon-deathrate">
                <span className="material-symbols-outlined">skull</span>
              </div>
              <div className="kpi-info">
                <div className="kpi-value" id="kpi-deathrate">
                  0%
                </div>
                <div className="kpi-label">Taux de Mortalité</div>
              </div>
            </div>
            <div className="kpi-card kpi-card-multi">
              <div className="kpi-icon kpi-icon-multi">
                <span className="material-symbols-outlined">group</span>
              </div>
              <div className="kpi-info">
                <div className="kpi-value" id="kpi-multi">
                  0%
                </div>
                <div className="kpi-label">Runs en Co-op</div>
              </div>
            </div>
          </div>

          <div className="stats-grid">
            <div className="chart-card">
              <div className="chart-title">
                <span className="material-symbols-outlined text-info">donut_large</span>
                Répartition des Résultats
              </div>
              <div className="chart-container">
                <canvas id="outcomesChart"></canvas>
              </div>
            </div>

            <div className="chart-card">
              <div className="chart-title">
                <span className="material-symbols-outlined text-info">bar_chart</span>
                Répartition par Voie
              </div>
              <div className="chart-container">
                <canvas id="classesChart"></canvas>
              </div>
            </div>

            <div className="chart-card">
              <div className="chart-title">
                <span className="material-symbols-outlined text-info">psychology</span>
                Répartition par Spiritualité
              </div>
              <div className="chart-container">
                <canvas id="spiritualityChart"></canvas>
              </div>
            </div>
          </div>

          <h3 className="font-outfit text-xl mb-4 text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-info">history</span>
            Historique des 50 dernières participations
          </h3>
          <div className="runs-table-container">
            <table className="runs-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Donjon</th>
                  <th>Compte</th>
                  <th>Voie / Spé</th>
                  <th>Niveau</th>
                  <th>Résultat</th>
                  <th>État</th>
                  <th>Mode</th>
                </tr>
              </thead>
              <tbody id="runsTableBody"></tbody>
            </table>
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
              className="hub-tab-btn tab-stats active"
              title="Statistiques PvE"
            >
              <span className="material-symbols-outlined hub-tab-icon">insights</span>
              <span className="hub-tab-label">Stats</span>
            </a>
            <a
              href="/achievements"
              className="hub-tab-btn tab-achievements"
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
