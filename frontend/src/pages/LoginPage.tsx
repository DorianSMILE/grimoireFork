import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { isAlreadyAuthenticated, loginApi } from '../services/api';

export function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    document.title = 'Connexion — Grimoire';
    if (isAlreadyAuthenticated()) {
      navigate('/armory', { replace: true });
    }
  }, [navigate]);

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
        navigate('/combat', { replace: true });
        return;
      }

      navigate('/armory', { replace: true });
    } catch {
      setErrorMessage('Erreur de communication avec le serveur');
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="ambient-light" aria-hidden="true"></div>
      <div className="ambient-light-2" aria-hidden="true"></div>

      <section className="auth-container" aria-labelledby="loginTitle">
        <div className="auth-header">
          <h1 className="auth-logo" id="loginTitle">
            <span className="material-symbols-outlined" aria-hidden="true">
              auto_stories
            </span>
            Grimoire
          </h1>
          <p className="auth-subtitle">
            Accéder à votre sauvegarde et vos personnages
          </p>
        </div>

        <div
          className={`auth-error ${errorMessage ? 'block' : 'is-hidden'}`}
          id="authError"
          role="alert"
        >
          {errorMessage}
        </div>

        <form className="auth-form" id="loginForm" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="username">Nom d&apos;utilisateur</label>
            <input
              type="text"
              id="username"
              name="username"
              required
              autoComplete="username"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
              enterKeyHint="next"
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
              name="password"
              required
              autoComplete="current-password"
              enterKeyHint="done"
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
          Nouveau ici ? <Link to="/register">Créer un compte</Link>
        </div>
      </section>
    </main>
  );
}
