import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAlreadyAuthenticated } from '../services/api';

interface SecretMeta {
  name: string;
  icon: string;
  themeClass: string;
}

const DEFAULT_SECRETS_META: SecretMeta[] = [
  { name: 'Secret du Chaos', icon: 'local_fire_department', themeClass: 'secret-theme-chaos' },
  { name: "Secret de l'Abondance", icon: 'eco', themeClass: 'secret-theme-abondance' },
  { name: 'Secret de la Préservation', icon: 'foundation', themeClass: 'secret-theme-preservation' },
  { name: 'Secret de la Sérénité', icon: 'water_drop', themeClass: 'secret-theme-serenite' },
  { name: 'Secret de la Chasse', icon: 'visibility_off', themeClass: 'secret-theme-chasse' },
  { name: 'Secret du Carnage', icon: 'explosion', themeClass: 'secret-theme-carnage' },
  { name: 'Secret de la Joie', icon: 'volcano', themeClass: 'secret-theme-joie' },
  { name: 'Secret du Savoir', icon: 'psychology', themeClass: 'secret-theme-savoir' },
  { name: 'Secret du Destin', icon: 'all_inclusive', themeClass: 'secret-theme-destin' },
  { name: "Secret de l'Éther", icon: 'blur_on', themeClass: 'secret-theme-ether' },
  { name: 'Secret des Abysses', icon: 'dark_mode', themeClass: 'secret-theme-abysses' },
];

interface SecretsUserData {
  unlockedSecrets?: Record<string, number>;
  claimedSecretRewards?: string[];
  claimableSecretRewards?: string[];
}

type GlobalSecretsWindow = Window & {
  currentUser?: SecretsUserData | null;
  checkAuthStatus?: () => Promise<void>;
  globalFetch?: (url: string, options?: RequestInit) => Promise<Response>;
  showNotif?: (message: string, isError?: boolean) => void;
};

export function SecretsPage() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState<SecretsUserData | null | undefined>(undefined);

  useEffect(() => {
    document.title = 'Mes Secrets - Grimoire';

    if (!isAlreadyAuthenticated()) {
      navigate('/login', { replace: true });
      return;
    }

    let cancelled = false;
    let secretAudio: HTMLAudioElement | null = null;
    const win = window as GlobalSecretsWindow;

    function handleAuthLoaded() {
      if (cancelled) return;
      setUserData(win.currentUser ? { ...win.currentUser } : null);
    }

    window.addEventListener('authLoaded', handleAuthLoaded);

    async function bootSecrets() {
      const uiUrl = '/js/ui.js?v=2';
      const authUrl = '/js/services/auth.js?v=30';

      await import(/* @vite-ignore */ uiUrl);
      await import(/* @vite-ignore */ authUrl);

      if (cancelled) return;

      secretAudio = new Audio('/sons/secret.mp3');
      secretAudio.play().catch((e) => console.log('Autoplay bloqué par le navigateur :', e));

      if (typeof win.checkAuthStatus === 'function') {
        await win.checkAuthStatus();
      } else if (win.currentUser !== undefined) {
        handleAuthLoaded();
      }
    }

    bootSecrets().catch((err) => {
      console.error('Erreur initialisation Mes Secrets:', err);
    });

    return () => {
      cancelled = true;
      if (secretAudio) {
        secretAudio.pause();
        secretAudio.currentTime = 0;
        secretAudio = null;
      }
      window.removeEventListener('authLoaded', handleAuthLoaded);
    };
  }, [navigate]);

  const handleClaimSecretReward = async (
    event: React.MouseEvent<HTMLDivElement>,
    secretName: string,
    level: number,
  ) => {
    const win = window as GlobalSecretsWindow;
    const fetchFn = win.globalFetch ?? fetch;
    const clientX = event.clientX;
    const clientY = event.clientY;

    try {
      const res = await fetchFn(
        `/api/secrets/claim/${encodeURIComponent(secretName)}/${level}`,
        { method: 'POST' },
      );

      if (res.ok) {
        const data = (await res.json()) as { reward?: number };

        if (data.reward) {
          const floating = document.createElement('div');
          floating.innerText = `+${data.reward} Or`;
          floating.className =
            'floating-gold font-bold text-yellow-400 drop-shadow-md text-xl pointer-events-none fixed z-[9999] ease-out';
          floating.style.left = `${clientX}px`;
          floating.style.top = `${clientY}px`;
          document.body.appendChild(floating);

          floating.getBoundingClientRect();
          floating.classList.add('is-fading');

          setTimeout(() => floating.remove(), 3000);
        }

        const audio = new Audio('/sons/pieces.mp3');
        audio.play().catch(() => {});

        if (typeof win.checkAuthStatus === 'function') {
          await win.checkAuthStatus();
        }
      } else {
        const err = (await res.json().catch(() => ({}))) as { message?: string; error?: string };
        const msg = err.message || err.error || 'Erreur lors de la récupération de la récompense.';
        if (typeof win.showNotif === 'function') {
          win.showNotif(msg, true);
        }
      }
    } catch {
      if (typeof win.showNotif === 'function') {
        win.showNotif('Erreur de connexion avec le serveur.', true);
      }
    }
  };

  const renderGridContent = () => {
    if (userData === undefined) {
      return (
        <p className="text-muted text-center col-span-full">Chargement de vos secrets...</p>
      );
    }

    if (userData === null) {
      return (
        <p className="text-red-500 text-center col-span-full">
          Veuillez vous connecter pour voir vos secrets.
        </p>
      );
    }

    const secrets = userData.unlockedSecrets || {};
    const secretNames = Object.keys(secrets).sort((a, b) => a.localeCompare(b));

    if (secretNames.length === 0) {
      return (
        <div className="col-span-full text-center p-12 bg-black/30 rounded-xl border border-dashed border-white/10">
          <span className="material-symbols-outlined mb-4 text-[3rem] text-slate-500">
            key_off
          </span>
          <h3 className="mb-2 text-slate-300">Aucun secret dévoilé</h3>
          <p className="text-muted text-sm">
            Pratiquez l&apos;alchimie pour percer les mystères de ce monde.
          </p>
        </div>
      );
    }

    const claimed = userData.claimedSecretRewards || [];
    const claimable = userData.claimableSecretRewards || [];

    return secretNames.map((name) => {
      const level = secrets[name] || 1;
      const meta = DEFAULT_SECRETS_META.find(
        (s) => s.name.toLowerCase() === name.toLowerCase(),
      ) || { name, icon: 'key', themeClass: 'secret-theme-default' };

      const badges = [];
      for (let i = 1; i <= level; i++) {
        const key = `${name}:${i}`;
        const isClaimed = claimed.includes(key);
        const isClaimable = claimable.includes(key);

        if (isClaimed) {
          badges.push(
            <div
              key={i}
              className="secret-badge claimed"
              title={`Niveau ${i} terminé et récompensé`}
            >
              <span className="material-symbols-outlined text-sm">check_circle</span> {i}
            </div>,
          );
        } else if (isClaimable) {
          badges.push(
            <div
              key={i}
              className="secret-badge claimable"
              onClick={(e) => handleClaimSecretReward(e, name, i)}
              title={`Cliquez pour récupérer la récompense du niveau ${i} !`}
            >
              <span className="material-symbols-outlined text-sm animate-pulse">stars</span> {i}
            </div>,
          );
        } else {
          badges.push(
            <div
              key={i}
              className="secret-badge locked"
              title={`Terminez tous les donjons de niveau ${i} liés à ce secret pour obtenir la récompense.`}
            >
              <span className="material-symbols-outlined text-sm">lock</span> {i}
            </div>,
          );
        }
      }

      return (
        <div key={name} className={`secret-card ${meta.themeClass}`}>
          <div className="secret-icon">
            <span className="material-symbols-outlined text-[3rem]">{meta.icon}</span>
          </div>
          <div className="flex flex-col gap-2 items-center">
            <h3 className="secret-name">{name}</h3>
            <span className="secret-level">Niveau {level}</span>
            <div className="flex gap-2 justify-center mt-3 flex-wrap">{badges}</div>
          </div>
        </div>
      );
    });
  };

  return (
    <>
      <app-navbar active-page="secret"></app-navbar>

      <main className="block">
        <div className="secrets-main">
          <div className="secrets-grid" id="secretsGrid">
            {renderGridContent()}
          </div>
        </div>
        <aside className="hub-nav-sidebar" aria-label="Navigation profil">
          <div className="hub-tabs-container">
            <a href="/secrets" className="hub-tab-btn tab-secrets active" title="Mes Secrets">
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
