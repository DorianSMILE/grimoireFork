import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAlreadyAuthenticated } from '../services/api';

export function ShopPage() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Grimoire - Boutique';

    if (!isAlreadyAuthenticated()) {
      navigate('/login', { replace: true });
      return;
    }

    let cancelled = false;

    async function bootShop() {
      const uiUrl = '/js/ui.js?v=2';
      const authUrl = '/js/services/auth.js?v=29';
      const shopUrl = '/js/pages/shop.js?v=9';

      await import(/* @vite-ignore */ uiUrl);
      await import(/* @vite-ignore */ authUrl);
      if (typeof window.initShopPage !== 'function') {
        await import(/* @vite-ignore */ shopUrl);
      }
      if (!cancelled && typeof window.initShopPage === 'function') {
        await window.initShopPage();
      }
    }

    bootShop().catch((err) => {
      console.error('Erreur initialisation Boutique:', err);
    });

    return () => {
      cancelled = true;
      window.cleanupShopPage?.();
    };
  }, [navigate]);

  return (
    <>
      <app-navbar active-page="shop"></app-navbar>

      {/* État Boutique Verrouillée */}
      <div
        id="shopFeatureLocked"
        className="is-hidden flex flex-col items-center justify-center h-[70vh] text-center text-white"
      >
        <span className="material-symbols-outlined text-crit mb-4 text-[4rem]">lock</span>
        <h1 className="mb-4 text-[2rem] font-outfit">Boutique Verrouillée</h1>
        <p id="shopLockMessage" className="text-muted max-w-[420px] mb-8 text-[1.1rem]">
          Terminez plus de donjons libres avant de débloquer la boutique.
        </p>
      </div>

      <div className="vault-main shop-main">
        {/* Panneau amélioration marchand : fixed à droite, indépendant du layout boutique */}
        <aside className="shop-sidebar">
          <div className="panel upgrade-panel-wrapper is-hidden" id="shopUpgradePanel">
            {/* Rempli dynamiquement par renderUpgradePanel() */}
          </div>
        </aside>

        <div className="panel">
          <div className="page-header mb-2">
            <div className="page-header-content">
              <div className="page-header-icon success">
                <span className="material-symbols-outlined text-[1.8rem]">storefront</span>
              </div>
              <div>
                <h2 className="page-header-title flex items-center gap-[10px]">
                  Boutique du Jour
                  <span id="shopLevelBadge" className="shop-level-badge"></span>
                </h2>
                <div className="page-header-subtitle">
                  Ces objets changent tous les jours à minuit.
                </div>
              </div>
            </div>
          </div>

          <div className="shop-showcase" id="shopGrid">
            <app-loader message="Chargement de la boutique..."></app-loader>
          </div>

          <div className="page-header mt-1 mb-2">
            <div className="page-header-content">
              <div className="page-header-icon warning">
                <span className="material-symbols-outlined text-[1.8rem]">local_offer</span>
              </div>
              <div>
                <h2 className="page-header-title">Offres Spéciales &amp; Consomables</h2>
                <div className="page-header-subtitle">
                  Promotions et objets utiles pour les expéditions.
                </div>
              </div>
            </div>
          </div>

          <div className="shop-showcase" id="specialsGrid">
            <app-loader message="Chargement des offres..."></app-loader>
          </div>
        </div>
      </div>
    </>
  );
}
