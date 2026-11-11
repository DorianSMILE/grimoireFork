window.initAppMeta = async function () {
    const { initMeta } = await import('../utils/constants.js');
    return initMeta();
};

function isOnDungeonsPage() {
    return window.location.pathname === '/dungeons' || window.location.pathname.includes('/dungeons.html');
}
if (isOnDungeonsPage()) {
    localStorage.removeItem('activeCombatId');
}

const activeCombatId = localStorage.getItem('activeCombatId');
if (activeCombatId && 
    !window.location.pathname.includes('/combat') && 
    !window.location.pathname.includes('/login.html') && 
    window.location.pathname !== '/login' &&
    !window.location.pathname.includes('/register.html') &&
    window.location.pathname !== '/register' &&
    !isOnDungeonsPage()) {
    console.warn('Active combat session found in localStorage, redirecting to combat page.');
    window.location.href = '/combat';
}

function isValidToken(token) {
    return typeof token === 'string' && token.trim().length > 0 && token !== 'null' && token !== 'undefined';
}

let accessToken = localStorage.getItem('accessToken');
if (!isValidToken(accessToken)) {
    accessToken = null;
    localStorage.removeItem('accessToken');
}

const currentPath = window.location.pathname;
const isAuthPage = currentPath.includes('/login.html') || currentPath.includes('/register.html') || currentPath === '/login' || currentPath === '/register';

if (!isAuthPage) {
    const isLikely = localStorage.getItem('isLikelyLoggedIn') === 'true';
    if (!isLikely || !accessToken) {
        window.location.replace('/login');
    }
} else {
    const isLikely = localStorage.getItem('isLikelyLoggedIn') === 'true';
    if (isLikely && isValidToken(accessToken)) {
        window.location.replace('/armory');
    }
}

const AUTH_CACHE_KEY = 'grimoire_cached_user_v1';

function hydrateCachedUser() {
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

hydrateCachedUser();

window.setAccessToken = function (token) {
    window._lastAuthFetchAt = 0;
    if (isValidToken(token)) {
        accessToken = token;
        localStorage.setItem('accessToken', token);
    } else {
        accessToken = null;
        localStorage.removeItem('accessToken');
        localStorage.removeItem(AUTH_CACHE_KEY);
    }
};

window.animateGoldValue = function(element, start, end, duration) {
    if (!element) return;
    const isGain = end >= start;
    const range = end - start;
    let startTime = null;

    element.classList.remove('is-gold-gain', 'is-gold-loss');
    element.classList.add(isGain ? 'is-gold-gain' : 'is-gold-loss');

    function step(timestamp) {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        
        const easeProgress = progress * (2 - progress);
        const current = start + (range * easeProgress);
        
        element.textContent = Number(current).toFixed(1);
        
        if (progress < 1) {
            window.requestAnimationFrame(step);
        } else {
            element.textContent = Number(end).toFixed(1);
            setTimeout(() => {
                element.classList.remove('is-gold-gain', 'is-gold-loss');
            }, 200);
        }
    }
    window.requestAnimationFrame(step);
};

window.globalFetch = async function (url, options = {}) {
    if (!options.headers) options.headers = {};
    if (!isValidToken(accessToken)) {
        const stored = localStorage.getItem('accessToken');
        if (isValidToken(stored)) {
            accessToken = stored;
        } else {
            accessToken = null;
            localStorage.removeItem('accessToken');
        }
    }
    if (isValidToken(accessToken) && !options.headers['Authorization']) {
        options.headers['Authorization'] = `Bearer ${accessToken}`;
    }

    try {
        let res = await fetch(url, options);

        if (res.status === 401 && !url.includes('/api/auth/refresh') && !url.includes('/api/auth/login') && !url.includes('/api/auth/register')) {
            // Attempt token refresh — dedup concurrent refreshes
            if (!window._refreshingToken) {
                window._refreshingToken = fetch('/api/auth/refresh', { method: 'POST', credentials: 'same-origin' })
                    .then(async (refreshRes) => {
                        if (refreshRes.ok) {
                            const data = await refreshRes.json();
                            if (isValidToken(data.token)) {
                                accessToken = data.token;
                                localStorage.setItem('accessToken', data.token);
                                return true;
                            }
                            return false;
                        }
                        if (refreshRes.status >= 500) {
                            throw new Error("Erreur serveur, réessayez plus tard.");
                        }
                        return false;
                    })
                    .finally(() => {
                        // Clear after a short delay so concurrent awaits all resolve first
                        setTimeout(() => { window._refreshingToken = null; }, 200);
                    });
            }

            const refreshSuccess = await window._refreshingToken;

            if (refreshSuccess) {
                // Retry with the latest token (may have been set by another concurrent refresh)
                if (isValidToken(accessToken)) {
                    options.headers['Authorization'] = `Bearer ${accessToken}`;
                }
                res = await fetch(url, options);
            } else {
                if (!url.includes('/api/auth/me') && !url.includes('/api/alchemy/recipes') && !url.includes('/api/meta/all') && !url.includes('/api/achievements/') && !url.includes('/api/anomalies')) {
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('refreshToken');
                    localStorage.removeItem('isLikelyLoggedIn');
                    if (!window.isRedirectingToLogin) {
                        window.isRedirectingToLogin = true;
                        window.location.href = '/login';
                    }
                    await new Promise(() => {}); // Halt execution
                }
                throw new Error('Session expirée');
            }
        } else if (res.status === 403) {
            let errorMsg = 'Accès refusé';
            let parsedData = null;
            try {
                const text = await res.text();
                try {
                    parsedData = JSON.parse(text);
                    errorMsg = parsedData.message || parsedData.error || text || errorMsg;
                } catch (e) {
                    errorMsg = text || errorMsg;
                }
            } catch (e2) {}

            let isInCombat = errorMsg && errorMsg.toLowerCase().includes('combat');

            // If error message was generic (e.g. Spring Boot default "Forbidden"), query /api/pve/combat/current
            if (!isInCombat && isValidToken(accessToken) && !url.includes('/api/pve/combat/') && !isOnDungeonsPage()) {
                try {
                    const curRes = await fetch('/api/pve/combat/current', {
                        headers: { 'Authorization': `Bearer ${accessToken}` }
                    });
                    if (curRes.ok) {
                        const curData = await curRes.json();
                        if (curData && curData.sessionId) {
                            isInCombat = true;
                            localStorage.setItem('activeCombatId', curData.sessionId);
                        }
                    }
                } catch (e) {}
            }

            if (isInCombat && !isOnDungeonsPage()) {
                console.warn('Redirecting to combat page due to active combat session', url);
                if (parsedData && parsedData.activeCombatSessionId) {
                    localStorage.setItem('activeCombatId', parsedData.activeCombatSessionId);
                }
                window.location.href = '/combat';
                await new Promise(() => {}); // Halt execution
            }

            // Pour un 403 générique, on ne redirige PAS vers login (car 403 = authentifié mais pas les droits)
            throw new Error(errorMsg);
        }

        if (!res.ok) {
            if (res.status === 401 && !url.includes('/api/auth/me') && !url.includes('/api/alchemy/recipes') && !url.includes('/api/meta/all') && !url.includes('/api/achievements/') && !url.includes('/api/anomalies')) {
                console.warn('Redirecting to login due to 401', url);
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('isLikelyLoggedIn');
                if (!window.isRedirectingToLogin) {
                    window.isRedirectingToLogin = true;
                    window.location.href = '/login';
                }
                await new Promise(() => {}); // Halt execution
            }
            let errorMsg = "Erreur serveur";
            try {
                const text = await res.text();
                try {
                    const data = JSON.parse(text);
                    errorMsg = data.message || data.error || text || errorMsg;
                } catch (e) {
                    errorMsg = text || errorMsg;
                }
            } catch (e2) { }
            throw new Error(errorMsg);
        }

        const method = (options.method || 'GET').toUpperCase();
        if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method) &&
            !url.includes('/api/achievements/acknowledge') &&
            !url.includes('/api/achievements/pending-notifications')) {
            window._lastAuthFetchAt = 0;
            if (window._achievementDebounceTimer) clearTimeout(window._achievementDebounceTimer);
            window._achievementDebounceTimer = setTimeout(() => {
                if (typeof window.checkAchievementNotifications === 'function') {
                    window.checkAchievementNotifications();
                }
            }, 600);
        } else if (method === 'GET') {
            if ((url.includes('/api/pve/dungeons') && window.currentUser && window.currentUser.unseenDungeonsCount > 0) ||
                (url.includes('/api/alchemy/recipes') && window.currentUser && window.currentUser.unseenAlchemyCount > 0)) {
                window._lastAuthFetchAt = 0;
            }
        }

        return res;
    } catch (error) {
        const isPassiveUrl = url.includes('/api/auth/me') ||
            url.includes('/api/alchemy/recipes') ||
            url.includes('/api/meta/all') ||
            url.includes('/api/achievements/') ||
            url.includes('/api/anomalies');
        if (!options.silent && !isPassiveUrl) {
            if (typeof showNotif !== 'undefined') {
                showNotif(error.message, true);
            } else if (typeof alert !== 'undefined') {
                if (window.ui) ui.showNotif(error.message, true);
                else console.error(error.message);
            }
        }
        throw error;
    }
};

window.formatRichText = function (text) {
    if (!text) return '';
    return text
        .replace(/\[c=(.*?)\](.*?)\[\/c\]/g, '<strong class="text-$1">$2</strong>')
        .replace(/\[b\](.*?)\[\/b\]/g, '<strong>$1</strong>')
        .replace(/\[ul\](.*?)\[\/ul\]/gs, '<ul class="list-disc mt-1 mb-1 pl-5">$1</ul>')
        .replace(/\[li\](.*?)\[\/li\]/g, '<li>$1</li>')
        .replace(/\n/g, '<br>');
};

document.addEventListener('DOMContentLoaded', () => {
    try {
        if (sessionStorage.getItem('grimoire_html_cache_v9') !== '1') {
            sessionStorage.setItem('grimoire_html_cache_v9', '1');
            sessionStorage.removeItem('grimoire_app_meta_v1');
            sessionStorage.removeItem('grimoire_app_meta_v2');
            ['/dungeons', '/armory', '/shop', '/combat', '/js/components/tutorial.js?v=9', '/styles/ui/tutorial.css?v=3'].forEach(u => {
                fetch(u, { cache: 'reload', credentials: 'same-origin' }).catch(() => {});
            });
        }
    } catch (_) {}

    const isReactAuthRoute = window.location.pathname === '/login' || window.location.pathname === '/register';
    const loginForm = !isReactAuthRoute ? document.getElementById('loginForm') : null;
    const registerForm = !isReactAuthRoute ? document.getElementById('registerForm') : null;

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const errorDiv = document.getElementById('authError');
            errorDiv.style.display = 'none';

            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;

            try {
                const res = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'same-origin',
                    body: JSON.stringify({ username, password })
                });

                const data = await res.json();

                if (!res.ok) {
                    errorDiv.innerText = data.message || "Erreur de connexion";
                    errorDiv.style.display = 'block';
                } else {
                    if (data.token) {
                        window.setAccessToken(data.token);
                    }
                    localStorage.setItem('isLikelyLoggedIn', 'true');
                    
                    // Check if user has an active combat session
                    try {
                        const currentSessionRes = await fetch('/api/pve/combat/current', {
                            headers: { 'Authorization': `Bearer ${data.token}` }
                        });
                        if (currentSessionRes.ok) {
                            const sessionData = await currentSessionRes.json();
                            if (sessionData && sessionData.sessionId) {
                                localStorage.setItem('activeCombatId', sessionData.sessionId);
                                window.location.href = '/combat';
                                return;
                            }
                        }
                    } catch (e) {
                        console.warn("Could not check active combat session on login", e);
                    }
                    
                    window.location.href = '/armory';
                }
            } catch (err) {
                errorDiv.innerText = "Erreur de communication avec le serveur";
                errorDiv.style.display = 'block';
            }
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const errorDiv = document.getElementById('authError');
            const successDiv = document.getElementById('authSuccess');
            errorDiv.style.display = 'none';
            successDiv.style.display = 'none';

            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;

            if (password !== confirmPassword) {
                errorDiv.innerText = "Les mots de passe ne correspondent pas";
                errorDiv.style.display = 'block';
                return;
            }

            try {
                const res = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'same-origin',
                    body: JSON.stringify({ username, password })
                });

                const data = await res.json();

                if (!res.ok) {
                    errorDiv.innerText = data.message || "Erreur lors de l'inscription";
                    errorDiv.style.display = 'block';
                } else {
                    if (data.token) {
                        window.setAccessToken(data.token);
                    }
                    localStorage.setItem('isLikelyLoggedIn', 'true');
                    successDiv.innerText = data.message || "Inscription réussie ! Redirection vers l'armurerie...";
                    successDiv.style.display = 'block';
                    setTimeout(() => {
                        window.location.href = '/armory';
                    }, 1000);
                }
            } catch (err) {
                errorDiv.innerText = "Erreur de communication avec le serveur";
                errorDiv.style.display = 'block';
            }
        });
    }

    const authNavContainer = document.getElementById('authNavContainer');
    if (authNavContainer) {
        checkAuthStatus();
    }
});

window.checkAuthStatus = async function checkAuthStatus(force = false) {
    if (localStorage.getItem('isLikelyLoggedIn') !== 'true') {
        localStorage.removeItem(AUTH_CACHE_KEY);
        window.currentUser = null;
        window.isAdmin = false;
        window._lastAuthFetchAt = 0;
        if (typeof window.syncNavbarWithUser === 'function') {
            window.syncNavbarWithUser(null, false);
        }
        window.dispatchEvent(new Event('authLoaded'));
        return;
    }

    const cached = hydrateCachedUser();
    if (cached && typeof window.syncNavbarWithUser === 'function') {
        window.syncNavbarWithUser(cached, false);
    }

    if (!force && window.currentUser && window._lastAuthFetchAt && (Date.now() - window._lastAuthFetchAt < 120000)) {
        if (!window.location.pathname.includes('/combat') &&
            !window.location.pathname.includes('/login.html') &&
            window.location.pathname !== '/login' &&
            !window.location.pathname.includes('/register.html') &&
            window.location.pathname !== '/register' &&
            !isOnDungeonsPage() &&
            window.currentUser.activeCombatSessionId) {
            localStorage.setItem('activeCombatId', window.currentUser.activeCombatSessionId);
            window.location.href = '/combat';
            return;
        }
        window.dispatchEvent(new Event('authLoaded'));
        return;
    }

    if (window._authFetchPromise) {
        return window._authFetchPromise;
    }

    window._authFetchPromise = (async () => {
        try {
            const res = await globalFetch('/api/auth/me', { credentials: 'same-origin' });
            if (res.ok) {
                const data = await res.json();
                const hadPrevGold = Boolean(window._lastAuthFetchAt && window.currentUser && window.currentUser.monnaie !== undefined);
                const prevGold = hadPrevGold ? +Number(window.currentUser.monnaie) : (+Number(data.monnaie) || 0);
                const currentGold = data.monnaie !== undefined ? +Number(data.monnaie) : 0;

                window.previousGold = prevGold;
                window.currentUser = data;
                window.isAdmin = Boolean(data.roles && data.roles.some(r => r.authority === 'ADMIN' || r.authority === 'ROLE_ADMIN'));
                window._lastAuthFetchAt = Date.now();
                try {
                    localStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(data));
                } catch (_) {}

                // Redirection automatique si une session de combat est toujours en cours (pré-calculé par /api/auth/me)
                if (!window.location.pathname.includes('/combat') &&
                    !window.location.pathname.includes('/login.html') &&
                    window.location.pathname !== '/login' &&
                    !window.location.pathname.includes('/register.html') &&
                    window.location.pathname !== '/register' &&
                    !isOnDungeonsPage() &&
                    data.activeCombatSessionId) {
                    console.warn("Active combat session found via /api/auth/me, redirecting to /combat");
                    localStorage.setItem('activeCombatId', data.activeCombatSessionId);
                    window.location.href = '/combat';
                    return;
                }

                if (typeof window.syncNavbarWithUser === 'function') {
                    window.syncNavbarWithUser(data, hadPrevGold && prevGold !== currentGold, prevGold);
                }
                window.dispatchEvent(new Event('authLoaded'));
            } else {
                localStorage.removeItem('isLikelyLoggedIn');
                localStorage.removeItem(AUTH_CACHE_KEY);
                window.currentUser = null;
                window.isAdmin = false;
                window._lastAuthFetchAt = 0;
                if (typeof window.syncNavbarWithUser === 'function') {
                    window.syncNavbarWithUser(null, false);
                }
                window.dispatchEvent(new Event('authLoaded'));
            }
        } catch (e) {
            localStorage.removeItem('isLikelyLoggedIn');
            localStorage.removeItem(AUTH_CACHE_KEY);
            window.currentUser = null;
            window.isAdmin = false;
            window._lastAuthFetchAt = 0;
            if (typeof window.syncNavbarWithUser === 'function') {
                window.syncNavbarWithUser(null, false);
            }
            window.dispatchEvent(new Event('authLoaded'));
        } finally {
            window._authFetchPromise = null;
        }
    })();

    return window._authFetchPromise;
};

window.logout = async function () {
    if (typeof window.showModal === 'function') {
        const confirmed = await window.showModal({
            title: 'Déconnexion',
            body: 'Voulez-vous vraiment vous déconnecter ?',
            confirmText: 'Me déconnecter',
            confirmStyle: 'danger'
        });
        if (!confirmed) return;
    } else {
        if (!confirm('Voulez-vous vraiment vous déconnecter ?')) return;
    }

    try {
        localStorage.removeItem('isLikelyLoggedIn');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('activeCombatId');
        localStorage.removeItem(AUTH_CACHE_KEY);
        window.currentUser = null;
        window.isAdmin = false;
        window._lastAuthFetchAt = 0;
        await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
        window.location.replace('/login');
    } catch (e) {
        console.error("Logout failed", e);
        window.location.replace('/login');
    }
};

window.addEventListener('authLoaded', () => {
    if (typeof window.syncNavbarWithUser === 'function' && window.currentUser) {
        window.syncNavbarWithUser(window.currentUser, false);
    }
});

document.addEventListener('navbar-loaded', () => {
    const cached = hydrateCachedUser();
    if (typeof window.syncNavbarWithUser === 'function') {
        window.syncNavbarWithUser(cached, false);
    }
});

function applyFeatureLock(el, isUnlocked, featureName, cost, featureId, originalHref) {
    el.href = originalHref;

    if (isUnlocked) {
        el.style.opacity = '1';
        el.style.cursor = 'pointer';
        el.removeAttribute('onclick');
        const lockIcon = el.querySelector('.feature-lock-icon');
        if (lockIcon) lockIcon.remove();
    } else {
        el.style.opacity = '0.7';
        el.style.cursor = 'not-allowed';
        el.setAttribute('onclick', `event.preventDefault(); promptUnlockFeature('${featureId}', '${featureName}', ${cost})`);

        if (!el.querySelector('.feature-lock-icon')) {
            el.insertAdjacentHTML('beforeend', '<span class="material-symbols-outlined feature-lock-icon text-sm text-error ml-auto">lock</span>');
        }
    }
}

function injectUnlockModal() {
    if (document.getElementById('globalUnlockOverlay')) return;

    const style = document.createElement('style');
    style.innerHTML = `
        .global-unlock-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.7);
            backdrop-filter: blur(8px);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.3s ease;
        }
        .global-unlock-modal .is-hidden {
            display: none !important;
        }
        .global-unlock-overlay.active {
            opacity: 1;
            pointer-events: all;
        }
        .global-unlock-modal {
            background: linear-gradient(145deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.95));
            border: 1px solid rgba(245, 158, 11, 0.3);
            border-radius: 20px;
            padding: 2.5rem;
            max-width: 420px;
            width: 90%;
            text-align: center;
            box-shadow: 0 25px 60px rgba(0, 0, 0, 0.5), 0 0 80px rgba(245, 158, 11, 0.1);
            transform: scale(0.85) translateY(20px);
            transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .global-unlock-overlay.active .global-unlock-modal {
            transform: scale(1) translateY(0);
        }
        .global-unlock-modal-icon {
            width: 72px;
            height: 72px;
            border-radius: 50%;
            background: linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(217, 119, 6, 0.1));
            border: 2px solid rgba(245, 158, 11, 0.4);
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 1.5rem;
            animation: unlock-pulse 2s ease-in-out infinite;
        }
        .global-unlock-modal-title {
            font-size: 1.5rem;
            font-weight: 700;
            font-family: 'Outfit', sans-serif;
            color: #f8fafc;
            margin-bottom: 0.8rem;
        }
        .global-unlock-modal-desc {
            font-size: 0.95rem;
            color: #94a3b8;
            line-height: 1.5;
            margin-bottom: 1.5rem;
        }
        .global-unlock-modal-cost {
            display: inline-flex;
            align-items: center;
            gap: 0.4rem;
            background: rgba(245, 158, 11, 0.1);
            color: #f59e0b;
            padding: 0.6rem 1.2rem;
            border-radius: 12px;
            font-size: 1.2rem;
            font-weight: 700;
            font-family: 'Outfit', sans-serif;
            margin-bottom: 2rem;
            border: 1px solid rgba(245, 158, 11, 0.3);
        }
        .global-unlock-modal-actions {
            display: flex;
            gap: 1rem;
        }
        .global-unlock-btn-cancel {
            flex: 1;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            color: #f8fafc;
            padding: 0.8rem;
            border-radius: 12px;
            font-weight: 600;
            font-family: 'Outfit', sans-serif;
            cursor: pointer;
            transition: all 0.2s ease;
        }
        .global-unlock-btn-cancel:hover {
            background: rgba(255, 255, 255, 0.1);
            transform: translateY(-2px);
        }
        .global-unlock-btn-confirm {
            flex: 1;
            background: linear-gradient(135deg, #f59e0b, #d97706);
            border: none;
            color: #0f172a;
            padding: 0.8rem;
            border-radius: 12px;
            font-weight: 700;
            font-family: 'Outfit', sans-serif;
            cursor: pointer;
            transition: all 0.2s ease;
            box-shadow: 0 4px 15px rgba(245, 158, 11, 0.3);
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 0.5rem;
        }
        .global-unlock-btn-confirm:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(245, 158, 11, 0.4);
        }
        @keyframes unlock-pulse {
            0%, 100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.3); }
            50% { box-shadow: 0 0 0 15px rgba(245, 158, 11, 0); }
        }
    `;
    document.head.appendChild(style);

    const overlay = document.createElement('div');
    overlay.className = 'global-unlock-overlay';
    overlay.id = 'globalUnlockOverlay';
    overlay.innerHTML = `
        <div class="global-unlock-modal">
            <div class="global-unlock-modal-icon">
                <span class="material-symbols-outlined text-amber" style="font-size: 2.2rem;" id="globalUnlockIcon">lock_open</span>
            </div>
            <div class="global-unlock-modal-title" id="globalUnlockTitle">Débloquer ?</div>
            <div class="global-unlock-modal-desc" id="globalUnlockDesc">Ce dévérouillage est <strong class="text-white">définitif</strong> pour votre compte. Vous n'aurez plus jamais à payer ce coût.</div>
            <div class="global-unlock-modal-cost" id="globalUnlockCostBox">
                <span class="material-symbols-outlined" style="font-size: 1.3rem;">monetization_on</span>
                <span id="globalUnlockCost">0</span> Or
            </div>
            <div class="global-unlock-modal-actions">
                <button class="global-unlock-btn-cancel" id="globalUnlockCancel">Annuler</button>
                <button class="global-unlock-btn-confirm" id="globalUnlockConfirm">
                    <span class="material-symbols-outlined text-lg">lock_open</span>
                    Débloquer
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
}

window.promptUnlockFeature = function (featureId, featureName, cost) {
    if (!window.currentUser) {
        if (typeof showNotif !== 'undefined') showNotif("Veuillez vous connecter pour débloquer cette fonctionnalité.", true);
        else ui.showNotif("Veuillez vous connecter pour débloquer cette fonctionnalité.", true);
        return;
    }

    injectUnlockModal();

    const overlay = document.getElementById('globalUnlockOverlay');
    document.getElementById('globalUnlockTitle').textContent = `Débloquer ${featureName} ?`;
    document.getElementById('globalUnlockCost').textContent = cost;
    const descEl = document.getElementById('globalUnlockDesc');
    const costBoxEl = document.getElementById('globalUnlockCostBox');
    const confirmBtnEl = document.getElementById('globalUnlockConfirm');
    const cancelBtnEl = document.getElementById('globalUnlockCancel');

    if (featureId === 'shop') {
        document.getElementById('globalUnlockTitle').textContent = 'Boutique Verrouillée';
        document.getElementById('globalUnlockIcon').textContent = 'storefront';
        if (descEl) {
            descEl.textContent = (window.currentUser && window.currentUser.shopLockMessage)
                || 'Terminez plus de donjons libres avant de débloquer la boutique.';
        }
        if (costBoxEl) costBoxEl.classList.add('is-hidden');
        if (confirmBtnEl) confirmBtnEl.classList.add('is-hidden');
        if (cancelBtnEl) cancelBtnEl.textContent = 'Compris';
    } else {
        if (descEl) {
            descEl.innerHTML = 'Ce dévérouillage est <strong class="text-white">définitif</strong> pour votre compte. Vous n\'aurez plus jamais à payer ce coût.';
        }
        if (costBoxEl) costBoxEl.classList.remove('is-hidden');
        if (confirmBtnEl) confirmBtnEl.classList.remove('is-hidden');
        if (cancelBtnEl) cancelBtnEl.textContent = 'Annuler';
    }

    if (featureId === 'vault') {
        document.getElementById('globalUnlockIcon').textContent = 'money_bag';
    } else if (featureId === 'alchemy') {
        document.getElementById('globalUnlockIcon').textContent = 'science';
    } else {
        document.getElementById('globalUnlockIcon').textContent = (featureId === 'shop') ? 'storefront' : 'lock_open';
    }

    overlay.classList.add('active');

    const confirmBtn = document.getElementById('globalUnlockConfirm');
    const cancelBtn = document.getElementById('globalUnlockCancel');

    const cleanup = () => {
        overlay.classList.remove('active');
        confirmBtn.replaceWith(confirmBtn.cloneNode(true));
        cancelBtn.replaceWith(cancelBtn.cloneNode(true));
    };

    cancelBtn.addEventListener('click', cleanup);

    document.getElementById('globalUnlockConfirm').addEventListener('click', async function () {
        const btn = this;
        const originalHtml = btn.innerHTML;
        btn.innerHTML = '<span class="material-symbols-outlined animate-spin">autorenew</span>';
        btn.disabled = true;

        try {
            await window.globalFetch('/api/auth/unlock/' + featureId, {
                method: 'POST',
                credentials: 'same-origin'
            });
            window.location.reload();
        } catch (error) {
            btn.innerHTML = originalHtml;
            btn.disabled = false;
            cleanup();
        }
    });
};
