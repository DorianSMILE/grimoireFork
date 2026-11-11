function injectSpeculationRules() {
    if (document.getElementById('grimoireSpeculationRules')) return;
    if (!HTMLScriptElement.supports || !HTMLScriptElement.supports('speculationrules')) return;

    const specScript = document.createElement('script');
    specScript.type = 'speculationrules';
    specScript.id = 'grimoireSpeculationRules';
    specScript.textContent = JSON.stringify({
        prefetch: [
            {
                source: 'list',
                urls: [
                    '/grimoire',
                    '/armory',
                    '/dungeons',
                    '/vault',
                    '/shop',
                    '/alchemy',
                    '/hunting',
                    '/achievements',
                    '/secrets',
                    '/dungeon-stats'
                ],
                eagerness: 'moderate'
            }
        ]
    });
    document.head.appendChild(specScript);
}

const NAVBAR_PAGE_CONFIG = {
    'grimoire': { icon: 'auto_awesome', cls: 'logo-grimoire', title: 'Grimoire', subtitle: 'Ne pas prononcer à voix haute le nom des sorts...' },
    'armory': { icon: 'shield', cls: 'logo-armory', title: 'Armurerie', subtitle: 'Préparez votre équipement...' },
    'dungeon': { icon: 'swords', cls: 'logo-dungeon', title: 'Donjons', subtitle: 'Préparez-vous au combat...' },
    'dungeons': { icon: 'swords', cls: 'logo-dungeon', title: 'Donjons', subtitle: 'Préparez-vous au combat...' },
    'vault': { icon: 'money_bag', cls: 'logo-vault', title: 'Coffres', subtitle: 'Un butin bien mérité.' },
    'shop': { icon: 'storefront', cls: 'logo-shop', title: 'Boutique', subtitle: "Touché c'est acheté !" },
    'alchemy': { icon: 'science', cls: 'logo-alchemy', title: 'Alchimie', subtitle: 'Mélangez vos ingrédients...' },
    'hunting': { icon: 'trophy', cls: 'logo-hunting', title: 'Tableau de Chasse', subtitle: 'Relevez les défis…' },
    'secret': { icon: 'key', cls: 'logo-secret', title: 'Mes Secrets', subtitle: 'Savoir mystique...' },
    'dungeon-stats': { icon: 'insights', cls: 'logo-dungeon', title: 'Statistiques PvE', subtitle: 'Analyse des performances...' },
    'achievements': { icon: 'emoji_events', cls: 'logo-achievements', title: 'Succès', subtitle: 'Vos trophées et titres glorieux...' },
    'admin': { icon: 'admin_panel_settings', cls: 'logo-admin', title: 'Administration', subtitle: 'Section restreinte.' },
    'shop-admin': { icon: 'settings', cls: 'logo-admin', title: 'Admin Boutique', subtitle: 'Gestion de la boutique' },
    'pve-admin': { icon: 'admin_panel_settings', cls: 'logo-admin', title: 'Admin PvE', subtitle: 'Gestion des donjons' },
    'alchemy-admin': { icon: 'science', cls: 'logo-admin', title: 'Admin Alchimie', subtitle: 'Gestion des recettes' }
};

const AUTH_CACHE_KEY = 'grimoire_cached_user_v1';
let sharedHeaderEl = null;

function getCachedUserSnapshot() {
    if (window.currentUser) return window.currentUser;
    if (localStorage.getItem('isLikelyLoggedIn') !== 'true') return null;
    try {
        const raw = localStorage.getItem(AUTH_CACHE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (parsed && parsed.username) {
            window.currentUser = parsed;
            window.isAdmin = Boolean(parsed.roles && parsed.roles.some(r => r.authority === 'ADMIN' || r.authority === 'ROLE_ADMIN'));
            return parsed;
        }
    } catch (_) {}
    return null;
}

function updateNavBadgeEl(id, count) {
    const badge = document.getElementById(id);
    if (!badge) return;
    const num = Number(count) || 0;
    if (num > 0) {
        const str = String(num);
        if (badge.textContent !== str) badge.textContent = str;
        badge.classList.add('block');
        badge.classList.remove('hidden');
    } else {
        badge.classList.remove('block');
        badge.classList.add('hidden');
    }
}

function applyNavbarFeatureLock(el, isUnlocked, featureName, cost, featureId, originalHref) {
    if (!el) return;
    el.href = originalHref;

    if (isUnlocked) {
        el.classList.remove('is-feature-locked');
        el.removeAttribute('onclick');
        const lockIcon = el.querySelector('.feature-lock-icon');
        if (lockIcon) lockIcon.remove();
    } else {
        el.classList.add('is-feature-locked');
        el.setAttribute('onclick', `event.preventDefault(); promptUnlockFeature('${featureId}', '${featureName}', ${cost})`);
        if (!el.querySelector('.feature-lock-icon')) {
            el.insertAdjacentHTML('beforeend', '<span class="material-symbols-outlined feature-lock-icon text-sm text-error ml-auto">lock</span>');
        }
    }
}

function ensureLoggedInAuthDom(container) {
    if (container.querySelector('#navUserProfileLink')) return;
    container.innerHTML = `
        <a id="navUserProfileLink" class="flex-center-gap no-underline text-sm px-2 py-1 rounded transition-all nav-user-profile-link" href="/secrets">
            <span class="material-symbols-outlined text-lg text-success">account_circle</span>
            <div class="nav-user-col">
                <span id="navUserName" class="nav-user-name">...</span>
                <span id="navUserTitle" class="nav-active-title is-hidden"></span>
            </div>
            <span id="navSecretBadge" class="nav-badge hidden">0</span>
        </a>
        <div id="navUserGoldWrap" class="flex-center font-bold text-amber text-sm nav-user-gold-wrap" title="Monnaie">
            <span class="material-symbols-outlined text-lg">monetization_on</span>
            <span id="navUserGold" class="nav-user-gold-val">0.0</span>
        </div>
        <button id="navLogoutBtn" type="button" class="flex-center text-xs text-error rounded px-2 py-1 cursor-pointer font-family-inherit transition-all nav-logout-btn" onclick="logout()" title="Déconnexion">
            <span class="material-symbols-outlined icon-sm">logout</span>
        </button>
    `;
}

window.syncNavbarWithUser = function syncNavbarWithUser(data, animateGold = false, prevGold = 0) {
    const container = document.getElementById('authNavContainer');
    const isLikelyLoggedIn = localStorage.getItem('isLikelyLoggedIn') === 'true';

    if (!isLikelyLoggedIn && !data) {
        if (container && !container.querySelector('#navGuestLoginLink')) {
            container.innerHTML = `
                <a id="navGuestLoginLink" class="font-medium text-info no-underline text-sm px-2 py-1 rounded bg-info-glass transition-all" href="/login">
                    Se connecter
                </a>
                <a class="font-medium text-success no-underline text-sm px-2 py-1 rounded bg-success-glass transition-all" href="/register">
                    S'inscrire
                </a>
            `;
        }
        return;
    }

    if (container) {
        ensureLoggedInAuthDom(container);
    }

    if (!data) return;

    const nameEl = document.getElementById('navUserName');
    if (nameEl && data.username && nameEl.textContent !== data.username) {
        nameEl.textContent = data.username;
    }

    const titleEl = document.getElementById('navUserTitle');
    if (titleEl) {
        if (data.activeTitle) {
            const formattedTitle = `« ${data.activeTitle} »`;
            if (titleEl.textContent !== formattedTitle) titleEl.textContent = formattedTitle;
            titleEl.title = `Titre équipé : ${data.activeTitle}`;
            titleEl.classList.remove('is-hidden');
        } else {
            titleEl.textContent = '';
            titleEl.classList.add('is-hidden');
        }
    }

    updateNavBadgeEl('navSecretBadge', data.claimableSecretRewardsCount || 0);

    const goldEl = document.getElementById('navUserGold');
    if (goldEl) {
        const currentGold = data.monnaie !== undefined ? +Number(data.monnaie) : 0;
        if (animateGold && prevGold !== currentGold && typeof window.animateGoldValue === 'function') {
            window.animateGoldValue(goldEl, prevGold, currentGold, 1000);
        } else {
            const formattedGold = Number(currentGold).toFixed(1);
            if (goldEl.textContent !== formattedGold) {
                goldEl.textContent = formattedGold;
            }
        }
    }

    const isAdmin = Boolean(data.roles && data.roles.some(r => r.authority === 'ADMIN' || r.authority === 'ROLE_ADMIN'));
    window.isAdmin = isAdmin;

    ['adminShopLink', 'adminPvELink', 'adminAlchemyLink'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.classList.toggle('init-hidden', !isAdmin);
            el.classList.toggle('is-hidden', !isAdmin);
        }
    });

    const filterMutationAdminContainer = document.getElementById('filterMutationAdminContainer');
    if (filterMutationAdminContainer) {
        filterMutationAdminContainer.classList.toggle('init-hidden', !isAdmin);
        filterMutationAdminContainer.classList.toggle('is-hidden', !isAdmin);
    }

    document.querySelectorAll('.nav-vault').forEach(el => applyNavbarFeatureLock(el, Boolean(data.unlockedVault), 'Coffres', 50, 'vault', '/vault'));
    document.querySelectorAll('.nav-alchemy').forEach(el => applyNavbarFeatureLock(el, Boolean(data.unlockedAlchemy), 'Alchimie', 150, 'alchemy', '/alchemy'));
    document.querySelectorAll('.nav-shop').forEach(el => applyNavbarFeatureLock(el, Boolean(data.unlockedShop), 'Boutique', 75, 'shop', '/shop'));

    updateNavBadgeEl('navDungeonBadge', data.unseenDungeonsCount || 0);
    updateNavBadgeEl('navHuntingBadge', data.huntingClaimable || 0);
    updateNavBadgeEl('navAlchemyBadge', data.unseenAlchemyCount || 0);
    updateNavBadgeEl('navArmoryBadge', data.availableCharacterSlots || 0);
};

class AppNavbar extends HTMLElement {
    static get observedAttributes() {
        return ['active-page'];
    }

    constructor() {
        super();
    }

    connectedCallback() {
        const activePage = this.getAttribute('active-page') || 'grimoire';
        if (sharedHeaderEl) {
            if (this.firstElementChild !== sharedHeaderEl) {
                this.replaceChildren(sharedHeaderEl);
            }
            this.updateActiveState(activePage);
        } else if (!this.querySelector('header.top-header')) {
            this.render(activePage);
        } else {
            this.updateActiveState(activePage);
        }
        window.syncNavbarWithUser(getCachedUserSnapshot(), false);
        injectSpeculationRules();

        // Dispatche un événement pour auth.js qui peut maintenant s'attacher à #authNavContainer
        document.dispatchEvent(new Event('navbar-loaded'));
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'active-page' && oldValue !== newValue && this.querySelector('header.top-header')) {
            this.updateActiveState(newValue || 'grimoire');
        }
    }

    updateActiveState(activePage) {
        const config = NAVBAR_PAGE_CONFIG[activePage] || NAVBAR_PAGE_CONFIG['grimoire'];
        const iconEl = this.querySelector('.logo-icon-gradient');
        const titleEl = this.querySelector('.logo-text-gradient');
        const subtitleEl = this.querySelector('.page-subtitle');

        if (iconEl) {
            iconEl.className = `material-symbols-outlined logo-icon-gradient ${config.cls}`;
            iconEl.textContent = config.icon;
        }
        if (titleEl) {
            titleEl.className = `logo-text-gradient ${config.cls}`;
            titleEl.textContent = config.title;
        }
        if (subtitleEl) {
            subtitleEl.textContent = config.subtitle;
        }

        const linkMap = {
            '.nav-grimoire': activePage === 'grimoire',
            '.nav-armory': activePage === 'armory',
            '.nav-dungeon': activePage === 'dungeon' || activePage === 'dungeons',
            '.nav-vault': activePage === 'vault',
            '.nav-shop': activePage === 'shop',
            '.nav-alchemy': activePage === 'alchemy',
            '.nav-hunting': activePage === 'hunting',
            '#adminShopLink': activePage === 'shop-admin',
            '#adminPvELink': activePage === 'pve-admin',
            '#adminAlchemyLink': activePage === 'alchemy-admin'
        };

        Object.entries(linkMap).forEach(([selector, isActive]) => {
            const el = this.querySelector(selector);
            if (el) {
                el.classList.toggle('active', Boolean(isActive));
            }
        });
    }

    render(activePage) {
        const config = NAVBAR_PAGE_CONFIG[activePage] || NAVBAR_PAGE_CONFIG['grimoire'];

        // On n'utilise PAS le Shadow DOM ici exprès, pour que auth.js et les CSS globaux s'appliquent !
        this.innerHTML = `
        <header class="top-header">
            <div class="page-logo-container">
                <div class="page-logo">
                    <span class="material-symbols-outlined logo-icon-gradient ${config.cls}">${config.icon}</span>
                    <span class="logo-text-gradient ${config.cls}">${config.title}</span>
                </div>
                <div class="page-subtitle">${config.subtitle}</div>
            </div>
            <div class="header-actions">
                
                <a href="/grimoire" class="top-nav-link nav-grimoire ${activePage === 'grimoire' ? 'active' : ''}">
                    <span class="material-symbols-outlined">auto_awesome</span> Grimoire
                </a>
                <a href="/armory" class="top-nav-link nav-armory ${activePage === 'armory' ? 'active' : ''}">
                    <span class="material-symbols-outlined">shield</span> Armurerie
                    <span id="navArmoryBadge" class="nav-badge hidden">0</span>
                </a>
                <a href="/dungeons" class="top-nav-link nav-dungeon ${activePage === 'dungeon' || activePage === 'dungeons' ? 'active' : ''}">
                    <span class="material-symbols-outlined">swords</span> Donjons
                    <span id="navDungeonBadge" class="nav-badge hidden">0</span>
                </a>
                <a href="/vault" class="top-nav-link nav-vault ${activePage === 'vault' ? 'active' : ''}">
                    <span class="material-symbols-outlined">money_bag</span> Coffres
                </a>
                <a href="/shop" class="top-nav-link nav-shop ${activePage === 'shop' ? 'active' : ''}">
                    <span class="material-symbols-outlined">storefront</span> Boutique
                </a>
                <a href="/alchemy" class="top-nav-link nav-alchemy ${activePage === 'alchemy' ? 'active' : ''}">
                    <span class="material-symbols-outlined">science</span> Alchimie
                    <span id="navAlchemyBadge" class="nav-badge hidden">0</span>
                </a>
                <a href="/hunting" class="top-nav-link nav-hunting ${activePage === 'hunting' ? 'active' : ''}">
                    <span class="material-symbols-outlined">trophy</span> Chasse
                    <span id="navHuntingBadge" class="nav-badge hidden">0</span>
                </a>
                
                <a href="/shop-admin" id="adminShopLink" class="top-nav-link nav-admin init-hidden ${activePage === 'shop-admin' ? 'active' : ''}">
                    <span class="material-symbols-outlined">settings</span> Admin Boutique
                </a>
                <a href="/pve-admin" id="adminPvELink" class="top-nav-link nav-admin init-hidden ${activePage === 'pve-admin' ? 'active' : ''}">
                    <span class="material-symbols-outlined">admin_panel_settings</span> Admin PvE
                </a>
                <a href="/alchemy-admin" id="adminAlchemyLink" class="top-nav-link nav-admin init-hidden ${activePage === 'alchemy-admin' ? 'active' : ''}">
                    <span class="material-symbols-outlined">science</span> Admin Alchimie
                </a>

                <div id="authNavContainer" class="nav-auth-container"></div>
            </div>
        </header>
        `;
        sharedHeaderEl = this.querySelector('header.top-header');
    }
}

customElements.define('app-navbar', AppNavbar);

// Keep-alive server ping (inactivité > 2min hors combat)
let lastUserActivity = Date.now();
['mousemove', 'keydown', 'click', 'scroll', 'touchstart'].forEach(evt => {
    document.addEventListener(evt, () => { lastUserActivity = Date.now(); }, { passive: true });
});

setInterval(() => {
    if (window.location.pathname.includes('/combat')) return;
    
    // Si inactivité >= 2 minutes
    if (Date.now() - lastUserActivity >= 120000) {
        if (window.currentUser && typeof window.globalFetch === 'function') {
            window.globalFetch('/api/auth/me').catch(() => {});
        }
        // Reset the timer so it only pings once every 2 minutes of continuous inactivity
        lastUserActivity = Date.now();
    }
}, 30000);

// === GESTIONNAIRE GLOBAL DES NOTIFICATIONS DE SUCCÈS ===
(function () {
    const achievementQueue = [];
    let isShowingToast = false;
    let toastTimeout = null;

    function getOrCreateContainer() {
        let container = document.getElementById('achievementToastContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'achievementToastContainer';
            container.className = 'achievement-toast-container';
            document.body.appendChild(container);
        }
        return container;
    }

    function createToastElement(achieve, onDismiss) {
        const wrapper = document.createElement('div');
        wrapper.className = 'achievement-toast-wrapper';

        // 1. Top banner
        const banner = document.createElement('div');
        banner.className = 'achievement-toast-banner';

        const bannerTitle = document.createElement('div');
        bannerTitle.className = 'achievement-toast-banner-title';
        const trophyIcon = document.createElement('span');
        trophyIcon.className = 'material-symbols-outlined text-sm';
        trophyIcon.textContent = 'emoji_events';
        const bannerTxt = document.createElement('span');
        bannerTxt.textContent = 'Haut-Fait Débloqué !';
        bannerTitle.appendChild(trophyIcon);
        bannerTitle.appendChild(bannerTxt);

        const closeBtn = document.createElement('button');
        closeBtn.type = 'button';
        closeBtn.className = 'achievement-toast-close';
        closeBtn.title = 'Fermer';
        const closeIcon = document.createElement('span');
        closeIcon.className = 'material-symbols-outlined';
        closeIcon.textContent = 'close';
        closeBtn.appendChild(closeIcon);
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            onDismiss();
        });

        banner.appendChild(bannerTitle);
        banner.appendChild(closeBtn);

        // 2. Card matching achievements.html (.achievement-card.unlocked)
        const card = document.createElement('div');
        card.className = 'achievement-card unlocked';
        card.addEventListener('click', () => {
            onDismiss();
        });

        // Header: icon + category + title
        const header = document.createElement('div');
        header.className = 'achievement-card-header';

        const iconBox = document.createElement('div');
        iconBox.className = 'achievement-icon-box';
        const iconSpan = document.createElement('span');
        iconSpan.className = 'material-symbols-outlined';
        iconSpan.textContent = achieve.icon || 'emoji_events';
        iconBox.appendChild(iconSpan);

        const titleArea = document.createElement('div');
        titleArea.className = 'achievement-title-area';

        const catTag = document.createElement('div');
        catTag.className = 'achievement-category-tag';
        catTag.textContent = achieve.categoryLabel || 'Combat & Donjons';

        const nameH3 = document.createElement('h3');
        nameH3.className = 'achievement-name';
        nameH3.textContent = achieve.label || achieve.title || 'Succès';

        titleArea.appendChild(catTag);
        titleArea.appendChild(nameH3);

        header.appendChild(iconBox);
        header.appendChild(titleArea);

        // Description
        const descP = document.createElement('p');
        descP.className = 'achievement-desc';
        descP.textContent = achieve.description || '';

        // Progress
        const progDiv = document.createElement('div');
        progDiv.className = 'achievement-card-progress';

        const labelsDiv = document.createElement('div');
        labelsDiv.className = 'progress-labels';
        const progTxt = document.createElement('span');
        progTxt.textContent = 'Complété !';
        const pctTxt = document.createElement('span');
        pctTxt.textContent = '100%';
        labelsDiv.appendChild(progTxt);
        labelsDiv.appendChild(pctTxt);

        const trackDiv = document.createElement('div');
        trackDiv.className = 'card-progress-bar';
        const fillDiv = document.createElement('div');
        fillDiv.className = 'card-progress-fill is-full';
        trackDiv.appendChild(fillDiv);

        progDiv.appendChild(labelsDiv);
        progDiv.appendChild(trackDiv);

        // Footer / Reward & Status
        const footer = document.createElement('div');
        footer.className = 'achievement-card-footer';

        if (achieve.rewardTitle) {
            const rewardTag = document.createElement('div');
            rewardTag.className = 'achievement-reward-tag';
            const rewardIcon = document.createElement('span');
            rewardIcon.className = 'material-symbols-outlined text-sm';
            rewardIcon.textContent = 'military_tech';
            const rewardTxt = document.createElement('span');
            rewardTxt.textContent = `Titre : « ${achieve.rewardTitle} »`;
            rewardTag.appendChild(rewardIcon);
            rewardTag.appendChild(rewardTxt);
            footer.appendChild(rewardTag);
        } else {
            const emptySpan = document.createElement('span');
            footer.appendChild(emptySpan);
        }

        const statusBadge = document.createElement('div');
        statusBadge.className = 'achievement-status-badge status-unlocked';
        const checkIcon = document.createElement('span');
        checkIcon.className = 'material-symbols-outlined text-sm';
        checkIcon.textContent = 'check_circle';
        const checkTxt = document.createElement('span');
        checkTxt.textContent = 'Débloqué';
        statusBadge.appendChild(checkIcon);
        statusBadge.appendChild(checkTxt);
        footer.appendChild(statusBadge);

        card.appendChild(header);
        card.appendChild(descP);
        card.appendChild(progDiv);
        card.appendChild(footer);

        wrapper.appendChild(banner);
        wrapper.appendChild(card);
        return wrapper;
    }

    function processQueue() {
        if (achievementQueue.length === 0) {
            isShowingToast = false;
            return;
        }

        isShowingToast = true;
        const achieve = achievementQueue.shift();
        const container = getOrCreateContainer();
        container.innerHTML = '';

        let dismissed = false;
        function dismiss() {
            if (dismissed) return;
            dismissed = true;
            if (toastTimeout) {
                clearTimeout(toastTimeout);
                toastTimeout = null;
            }
            container.classList.remove('is-visible');
            setTimeout(() => {
                container.innerHTML = '';
                processQueue();
            }, 350);
        }

        const el = createToastElement(achieve, dismiss);
        container.appendChild(el);

        requestAnimationFrame(() => {
            container.classList.add('is-visible');
        });

        toastTimeout = setTimeout(() => {
            dismiss();
        }, 5000);
    }

    window.showAchievementToast = function (achieve) {
        if (!achieve) return;
        achievementQueue.push(achieve);
        if (!isShowingToast) {
            processQueue();
        }
    };

    let isChecking = false;
    window.checkAchievementNotifications = async function () {
        if (isChecking) return;
        if (!window.currentUser && !localStorage.getItem('accessToken')) return;
        if (typeof window.globalFetch !== 'function') return;

        isChecking = true;
        try {
            const res = await window.globalFetch('/api/achievements/pending-notifications', { silent: true });
            if (res && res.ok) {
                const list = await res.json();
                if (Array.isArray(list) && list.length > 0) {
                    list.forEach(a => window.showAchievementToast(a));
                    await window.globalFetch('/api/achievements/acknowledge', { method: 'POST', silent: true }).catch(() => {});
                }
            }
        } catch (e) {
            // Silently ignore poll errors
        } finally {
            isChecking = false;
        }
    };

    window.addEventListener('authLoaded', () => {
        setTimeout(window.checkAchievementNotifications, 800);
    });

    setInterval(() => {
        window.checkAchievementNotifications();
    }, 15000);
})();
