import { useEffect } from 'react';
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useNavigate,
} from 'react-router-dom';
import { ArmoryPage } from './pages/ArmoryPage';
import { GrimoirePage } from './pages/GrimoirePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';

const SPA_ROUTES = new Set([
  '/',
  '/index.html',
  '/grimoire',
  '/armory',
  '/armory.html',
  '/login',
  '/login.html',
  '/register',
  '/register.html',
]);

function SpaLinkInterceptor() {
  const navigate = useNavigate();

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
        return;
      }
      const target = e.target as HTMLElement | null;
      const anchor = target?.closest?.('a') as HTMLAnchorElement | null;
      if (!anchor || anchor.target || anchor.hasAttribute('download')) {
        return;
      }
      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('http') || href.startsWith('#') || anchor.hasAttribute('onclick')) {
        return;
      }
      const url = new URL(href, window.location.origin);
      if (url.origin === window.location.origin && SPA_ROUTES.has(url.pathname)) {
        e.preventDefault();
        navigate(url.pathname + url.search);
      }
    }

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [navigate]);

  return null;
}

export function App() {
  return (
    <BrowserRouter>
      <SpaLinkInterceptor />
      <Routes>
        <Route path="/" element={<Navigate to="/grimoire" replace />} />
        <Route path="/index.html" element={<Navigate to="/grimoire" replace />} />
        <Route path="/grimoire" element={<GrimoirePage />} />
        <Route path="/armory" element={<ArmoryPage />} />
        <Route path="/armory.html" element={<Navigate to="/armory" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/login.html" element={<Navigate to="/login" replace />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/register.html" element={<Navigate to="/register" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
