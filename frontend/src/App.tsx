import { useEffect } from 'react';
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useNavigate,
} from 'react-router-dom';
import { ArmoryPage } from './pages/ArmoryPage';
import { AlchemyAdminPage } from './pages/AlchemyAdminPage';
import { AlchemyPage } from './pages/AlchemyPage';
import { DungeonsPage } from './pages/DungeonsPage';
import { GrimoirePage } from './pages/GrimoirePage';
import { HuntingPage } from './pages/HuntingPage';
import { LoginPage } from './pages/LoginPage';
import { PveAdminPage } from './pages/PveAdminPage';
import { RegisterPage } from './pages/RegisterPage';
import { SecretsPage } from './pages/SecretsPage';
import { ShopAdminPage } from './pages/ShopAdminPage';
import { ShopPage } from './pages/ShopPage';
import { VaultPage } from './pages/VaultPage';

const SPA_ROUTES = new Set([
  '/',
  '/index.html',
  '/grimoire',
  '/armory',
  '/armory.html',
  '/dungeons',
  '/dungeons.html',
  '/vault',
  '/vault.html',
  '/shop',
  '/shop.html',
  '/alchemy',
  '/alchemy.html',
  '/hunting',
  '/hunting.html',
  '/shop-admin',
  '/shop-admin.html',
  '/pve-admin',
  '/pve-admin.html',
  '/alchemy-admin',
  '/alchemy-admin.html',
  '/secrets',
  '/secrets.html',
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
        <Route path="/dungeons" element={<DungeonsPage />} />
        <Route path="/dungeons.html" element={<Navigate to="/dungeons" replace />} />
        <Route path="/vault" element={<VaultPage />} />
        <Route path="/vault.html" element={<Navigate to="/vault" replace />} />
        <Route path="/shop" element={<ShopPage />} />
        <Route path="/shop.html" element={<Navigate to="/shop" replace />} />
        <Route path="/alchemy" element={<AlchemyPage />} />
        <Route path="/alchemy.html" element={<Navigate to="/alchemy" replace />} />
        <Route path="/hunting" element={<HuntingPage />} />
        <Route path="/hunting.html" element={<Navigate to="/hunting" replace />} />
        <Route path="/shop-admin" element={<ShopAdminPage />} />
        <Route path="/shop-admin.html" element={<Navigate to="/shop-admin" replace />} />
        <Route path="/pve-admin" element={<PveAdminPage />} />
        <Route path="/pve-admin.html" element={<Navigate to="/pve-admin" replace />} />
        <Route path="/alchemy-admin" element={<AlchemyAdminPage />} />
        <Route path="/alchemy-admin.html" element={<Navigate to="/alchemy-admin" replace />} />
        <Route path="/secrets" element={<SecretsPage />} />
        <Route path="/secrets.html" element={<Navigate to="/secrets" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/login.html" element={<Navigate to="/login" replace />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/register.html" element={<Navigate to="/register" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
