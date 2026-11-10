import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAlreadyAuthenticated } from '../services/api';

export function HuntingPage() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Grimoire - Tableau de Chasse';

    if (!isAlreadyAuthenticated()) {
      navigate('/login', { replace: true });
      return;
    }

    let cancelled = false;

    async function bootHunting() {
      const uiUrl = '/js/ui.js?v=2';
      const authUrl = '/js/services/auth.js?v=29';
      const huntingUrl = '/js/pages/hunting.js?v=9';

      await import(/* @vite-ignore */ uiUrl);
      await import(/* @vite-ignore */ authUrl);
      if (typeof window.initHuntingPage !== 'function') {
        await import(/* @vite-ignore */ huntingUrl);
      }
      if (!cancelled && typeof window.initHuntingPage === 'function') {
        await window.initHuntingPage();
      }
    }

    bootHunting().catch((err) => {
      console.error('Erreur initialisation Tableau de Chasse:', err);
    });

    return () => {
      cancelled = true;
      window.cleanupHuntingPage?.();
    };
  }, [navigate]);

  return (
    <>
      <app-navbar active-page="hunting"></app-navbar>

      <main className="hunting-container w-full max-w-[1200px] mx-auto p-8">
        <div className="flex items-center gap-4 mb-2">
          <h2 className="font-outfit text-[2rem] m-0 leading-none">
            <span className="logo-text-gradient logo-hunting">Tableau de Chasse</span>
          </h2>
        </div>
        <p className="text-muted mb-8">
          Relevez les défis pour grimper dans le classement et remporter des récompenses.
        </p>

        {/* ═══════ DAILY ═══════ */}
        <section className="quest-section" id="dailySection">
          <div className="quest-header">
            <span className="quest-badge daily">
              <span className="material-symbols-outlined">today</span>
              Défi Journalier
            </span>
            <span className="quest-timer" id="dailyTimer"></span>
          </div>

          <div className="quest-card" id="dailyCard">
            <div className="quest-card-loading">
              <span className="material-symbols-outlined spin">progress_activity</span>
              Chargement…
            </div>
          </div>
        </section>

        {/* ═══════ PREVIOUS DAILY (if claimable) ═══════ */}
        <section className="quest-section is-hidden" id="previousDailySection">
          <div className="quest-header">
            <span className="quest-badge daily faded">
              <span className="material-symbols-outlined">history</span>
              Défi Journalier Précédent
            </span>
            <span className="text-muted text-sm">Récompense récupérable</span>
          </div>

          <div className="quest-card" id="previousDailyCard"></div>
        </section>

        {/* ═══════ WEEKLY ═══════ */}
        <section className="quest-section" id="weeklySection">
          <div className="quest-header">
            <span className="quest-badge weekly">
              <span className="material-symbols-outlined">date_range</span>
              Défi Hebdomadaire
            </span>
            <span className="quest-timer" id="weeklyTimer"></span>
          </div>

          <div className="quest-card" id="weeklyCard">
            <div className="quest-card-loading">
              <span className="material-symbols-outlined spin">progress_activity</span>
              Chargement…
            </div>
          </div>
        </section>

        {/* ═══════ PREVIOUS WEEKLY (if claimable) ═══════ */}
        <section className="quest-section is-hidden" id="previousWeeklySection">
          <div className="quest-header">
            <span className="quest-badge weekly faded">
              <span className="material-symbols-outlined">history</span>
              Défi Hebdo Précédent
            </span>
            <span className="text-muted text-sm">Récompense récupérable</span>
          </div>

          <div className="quest-card" id="previousWeeklyCard"></div>
        </section>
      </main>
    </>
  );
}
