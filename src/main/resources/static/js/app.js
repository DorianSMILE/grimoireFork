import { state } from './utils/state.js';
import * as constants from './utils/constants.js';
import * as api from './services/api.js';
import * as particles from './components/particles.js';
import * as animations from './components/animations.js';
import * as filters from './utils/filters.js?v=2';
import * as grimoire from './pages/grimoire.js?v=1786180000235';
import * as forge from './pages/forge.js';
import * as ui from './ui.js?v=2';

window.state = state;
// Ne pas écraser le booléen window.isAdmin (géré par auth.js) avec la fonction api.isAdmin
const { isAdmin: _isAdminFn, ...apiExports } = api;
Object.assign(window, apiExports);
Object.assign(window, particles);
Object.assign(window, animations);
Object.assign(window, filters);
Object.assign(window, grimoire);
Object.assign(window, forge);
Object.assign(window, ui);

function bindSelectListeners() {
    const bindChange = (id, handler) => {
        const el = document.getElementById(id);
        if (el && !el.dataset.boundGrimoireChange) {
            el.dataset.boundGrimoireChange = 'true';
            el.addEventListener('change', handler);
        }
    };

    bindChange('niveau', () => forge.updateRankTitle());
    bindChange('voieSelect', () => forge.handleAffinityChange('voie'));
    bindChange('spiritSelect', () => forge.handleAffinityChange('spirit'));
    bindChange('mutationSelect', () => forge.handleAffinityChange('mutation'));
    bindChange('filterMutation', () => grimoire.renderFilteredSpells());
    bindChange('filterEffect', () => grimoire.renderFilteredSpells());
    bindChange('filterLevel', () => grimoire.renderFilteredSpells());
    bindChange('sortBy', () => grimoire.renderFilteredSpells());
}

function applyAdminLayout() {
    const user = window.currentUser;
    const isAdminUser = Boolean(api.isAdmin(user));
    window.isAdmin = isAdminUser;

    const forgePanel = document.getElementById('spellForgePanel');
    const mainEl = document.querySelector('main.grimoire-main');
    const filterMutationAdminContainer = document.getElementById('filterMutationAdminContainer');

    if (isAdminUser) {
        if (forgePanel) {
            forgePanel.classList.remove('is-hidden', 'init-hidden');
        }
        if (mainEl) {
            mainEl.classList.remove('single-col');
        }
        if (filterMutationAdminContainer) {
            filterMutationAdminContainer.classList.remove('is-hidden', 'init-hidden');
            filterMutationAdminContainer.style.display = 'block';
        }
    } else {
        if (forgePanel) {
            forgePanel.classList.add('is-hidden');
        }
        if (mainEl) {
            mainEl.classList.add('single-col');
        }
        if (filterMutationAdminContainer) {
            filterMutationAdminContainer.classList.add('is-hidden');
            filterMutationAdminContainer.style.display = 'none';
        }
    }
}

export async function initGrimoirePage() {
    bindSelectListeners();
    applyAdminLayout();
    ui.updateDisplayModeUI();
    ui.initResizeObserver();

    if (typeof window.checkAuthStatus === 'function') {
        await window.checkAuthStatus();
    }

    applyAdminLayout();

    // Charger d'abord les métadonnées d'enums (GLOBAL_SRC_LABELS, GLOBAL_STAT_LABELS)
    // avant de construire les selects et les cartes de sorts
    await constants.initMeta();
    await api.fetchMeta();
    await api.loadSpells();
}

window.initGrimoirePage = initGrimoirePage;
