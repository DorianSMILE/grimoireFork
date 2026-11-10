import { useEffect } from 'react';
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import { ArmoryPage } from './pages/ArmoryPage';
import { AchievementsPage } from './pages/AchievementsPage';
import { AlchemyAdminPage } from './pages/AlchemyAdminPage';
import { AlchemyPage } from './pages/AlchemyPage';
import { CombatPage } from './pages/CombatPage';
import { DungeonsPage } from './pages/DungeonsPage';
import { DungeonStatsPage } from './pages/DungeonStatsPage';
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
  '/dungeon-stats',
  '/dungeon-stats.html',
  '/achievements',
  '/achievements.html',
  '/combat',
  '/combat.html',
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

function RedirectWithSearch({ to }: { to: string }) {
  const location = useLocation();
  return <Navigate to={`${to}${location.search}${location.hash}`} replace />;
}

export function App() {
  return (
    <BrowserRouter>
      <SpaLinkInterceptor />
      <Routes>
        <Route path="/" element={<RedirectWithSearch to="/grimoire" />} />
        <Route path="/index.html" element={<RedirectWithSearch to="/grimoire" />} />
        <Route path="/grimoire" element={<GrimoirePage />} />
        <Route path="/armory" element={<ArmoryPage />} />
        <Route path="/armory.html" element={<RedirectWithSearch to="/armory" />} />
        <Route path="/dungeons" element={<DungeonsPage />} />
        <Route path="/dungeons.html" element={<RedirectWithSearch to="/dungeons" />} />
        <Route path="/vault" element={<VaultPage />} />
        <Route path="/vault.html" element={<RedirectWithSearch to="/vault" />} />
        <Route path="/shop" element={<ShopPage />} />
        <Route path="/shop.html" element={<RedirectWithSearch to="/shop" />} />
        <Route path="/alchemy" element={<AlchemyPage />} />
        <Route path="/alchemy.html" element={<RedirectWithSearch to="/alchemy" />} />
        <Route path="/hunting" element={<HuntingPage />} />
        <Route path="/hunting.html" element={<RedirectWithSearch to="/hunting" />} />
        <Route path="/shop-admin" element={<ShopAdminPage />} />
        <Route path="/shop-admin.html" element={<RedirectWithSearch to="/shop-admin" />} />
        <Route path="/pve-admin" element={<PveAdminPage />} />
        <Route path="/pve-admin.html" element={<RedirectWithSearch to="/pve-admin" />} />
        <Route path="/alchemy-admin" element={<AlchemyAdminPage />} />
        <Route path="/alchemy-admin.html" element={<RedirectWithSearch to="/alchemy-admin" />} />
        <Route path="/secrets" element={<SecretsPage />} />
        <Route path="/secrets.html" element={<RedirectWithSearch to="/secrets" />} />
        <Route path="/dungeon-stats" element={<DungeonStatsPage />} />
        <Route path="/dungeon-stats.html" element={<RedirectWithSearch to="/dungeon-stats" />} />
        <Route path="/achievements" element={<AchievementsPage />} />
        <Route path="/achievements.html" element={<RedirectWithSearch to="/achievements" />} />
        <Route path="/combat" element={<CombatPage />} />
        <Route path="/combat.html" element={<RedirectWithSearch to="/combat" />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/login.html" element={<RedirectWithSearch to="/login" />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/register.html" element={<RedirectWithSearch to="/register" />} />
      </Routes>
    </BrowserRouter>
  );
}
