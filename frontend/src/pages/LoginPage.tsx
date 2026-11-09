import { FormEvent, useEffect, useState } from 'react';
import { isAlreadyAuthenticated, loginApi } from '../services/api';

export function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    document.title = 'Connexion — Grimoire';
    if (isAlreadyAuthenticated()) {
      window.location.replace('/armory.html');
    }
  }, []);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const result = await loginApi({ username, password });

      if (!result.ok) {
        setErrorMessage(result.message || 'Erreur de connexion');
        setIsSubmitting(false);
        return;
      }

      if (result.activeCombatSessionId) {
        window.location.href = '/combat.html';
        return;
      }

      window.location.href = '/armory.html';
    } catch {
      setErrorMessage('Erreur de communication avec le serveur');
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="ambient-light"></div>
      <div className="ambient-light-2"></div>

      <div className="auth-container">
        <div className="auth-header">
          <div className="auth-logo">
            <span className="material-symbols-outlined">auto_stories</span>
            Grimoire
          </div>
          <div className="auth-subtitle">
            Accéder à votre sauvegarde et vos personnages
          </div>
        </div>

        <div
          className={`auth-error ${errorMessage ? 'block' : 'is-hidden'}`}
          id="authError"
        >
          {errorMessage}
        </div>

        <form className="auth-form" id="loginForm" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="username">Nom d&apos;utilisateur</label>
            <input
              type="text"
              id="username"
              required
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
          <div className="auth-field">
            <label htmlFor="password">Mot de passe</label>
            <input
              type="password"
              id="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
          <button
            className={`auth-btn ${isSubmitting ? 'opacity-80' : ''}`}
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <div className="auth-footer">
          Nouveau ici ? <a href="/register.html">Créer un compte</a>
        </div>
      </div>
    </div>
  );
}
