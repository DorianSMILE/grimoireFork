import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { isAlreadyAuthenticated, registerApi } from '../services/api';

export function RegisterPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    document.title = 'Inscription — Grimoire';
    if (isAlreadyAuthenticated()) {
      navigate('/armory', { replace: true });
    }
  }, [navigate]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (password !== confirmPassword) {
      setErrorMessage('Les mots de passe ne correspondent pas');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await registerApi({ username, password });

      if (!result.ok) {
        setErrorMessage(result.message || "Erreur lors de l'inscription");
        setIsSubmitting(false);
        return;
      }

      setSuccessMessage(
        result.message || "Inscription réussie ! Redirection vers l'armurerie..."
      );
      setTimeout(() => {
        navigate('/armory', { replace: true });
      }, 1000);
    } catch {
      setErrorMessage('Erreur de communication avec le serveur');
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-page auth-page-register">
      <div className="ambient-light" aria-hidden="true"></div>
      <div className="ambient-light-2" aria-hidden="true"></div>

      <section className="auth-container" aria-labelledby="registerTitle">
        <div className="auth-header">
          <h1 className="auth-logo" id="registerTitle">
            <span
              className="material-symbols-outlined text-emerald drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]"
              aria-hidden="true"
            >
              auto_stories
            </span>
            Grimoire
          </h1>
          <p className="auth-subtitle">Créer un nouveau compte</p>
        </div>

        <div
          className={`auth-error ${errorMessage ? 'block' : 'is-hidden'}`}
          id="authError"
          role="alert"
        >
          {errorMessage}
        </div>
        <div
          className={`auth-success ${successMessage ? 'block' : 'is-hidden'}`}
          id="authSuccess"
          role="status"
          aria-live="polite"
        >
          {successMessage}
        </div>

        <form className="auth-form" id="registerForm" onSubmit={handleSubmit}>
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
              minLength={3}
              maxLength={30}
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
              autoComplete="new-password"
              enterKeyHint="next"
              minLength={4}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
          <div className="auth-field">
            <label htmlFor="confirmPassword">Confirmer le mot de passe</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              required
              autoComplete="new-password"
              enterKeyHint="done"
              minLength={4}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
          <button
            className={`auth-btn ${isSubmitting ? 'opacity-80' : ''}`}
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Création...' : 'Créer le compte'}
          </button>
        </form>

        <div className="auth-footer">
          Déjà inscrit ? <Link to="/login">Se connecter</Link>
        </div>
      </section>
    </main>
  );
}
