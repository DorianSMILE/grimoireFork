import { state } from './state.js';

import { renderFilteredSpells } from '../pages/grimoire.js?v=1786180000244';

export function getVoieButtonColor(v) {
    const vNom = (v ? (typeof v === 'string' ? v : (v.nom || v.name || '')) : '').toLowerCase();
    if (vNom.includes('raison')) return '#3b82f6';
    if (vNom.includes('sûreté') || vNom.includes('surete')) return '#00e5cc';
    if (vNom.includes('trahison')) return '#ed5677';
    if (vNom.includes('consolidation')) return '#99674c';
    if (vNom.includes('conviction')) return '#b74c0b';
    if (vNom.includes('création') || vNom.includes('creation')) return '#10b981';
    if (vNom.includes('destruction')) return '#ff0000';
    if (vNom.includes('violence')) return '#a70740';
    return '#94a3b8';
}

export function getSpiritButtonColor(s) {
    const sNom = (s ? (typeof s === 'string' ? s : (s.nom || s.name || '')) : '').toLowerCase();
    if (sNom.includes('esprit')) return '#38bdf8';
    if (sNom.includes('ténèbres') || sNom.includes('tenebres')) return '#c084fc';
    if (sNom.includes('karma')) return '#e7d198';
    return '#a78bfa';
}

export function getVoieAffinityClass(v) {
    const vNom = (v ? (typeof v === 'string' ? v : (v.nom || v.name || '')) : '').toLowerCase();
    if (vNom.includes('raison')) return 'affinity-raison';
    if (vNom.includes('sûreté') || vNom.includes('surete')) return 'affinity-surete';
    if (vNom.includes('trahison')) return 'affinity-trahison';
    if (vNom.includes('consolidation')) return 'affinity-consolidation';
    if (vNom.includes('conviction')) return 'affinity-conviction';
    if (vNom.includes('création') || vNom.includes('creation')) return 'affinity-creation';
    if (vNom.includes('destruction')) return 'affinity-destruction';
    if (vNom.includes('violence')) return 'affinity-violence';
    return 'affinity-default';
}

export function getSpiritAffinityClass(s) {
    const sNom = (s ? (typeof s === 'string' ? s : (s.nom || s.name || '')) : '').toLowerCase();
    if (sNom.includes('esprit')) return 'affinity-esprit';
    if (sNom.includes('ténèbres') || sNom.includes('tenebres')) return 'affinity-tenebres';
    if (sNom.includes('karma')) return 'affinity-karma';
    return 'affinity-spirit-default';
}

export function getSpellAffinityClass(sp) {
    if (!sp) return 'affinity-default';
    if (sp.mutation) return 'affinity-mutation';
    if (sp.voie) return getVoieAffinityClass(sp.voie);
    if (sp.spiritualite) return getSpiritAffinityClass(sp.spiritualite);
    return 'affinity-default';
}

export function resetFilters() {
    state.selectedFilterVoieId = null;
    state.selectedFilterSpiritId = null;
    renderOriginButtons();

    const search = document.getElementById('filterSearch');
    if (search) search.value = '';
    const effect = document.getElementById('filterEffect');
    if (effect) {
        effect.value = 'ALL';
        effect.dispatchEvent(new Event('change'));
    }
    const level = document.getElementById('filterLevel');
    if (level) {
        level.value = 'ALL';
        level.dispatchEvent(new Event('change'));
    }
    const sort = document.getElementById('sortBy');
    if (sort) {
        sort.value = 'DEFAULT';
        sort.dispatchEvent(new Event('change'));
    }
    renderFilteredSpells();
}

export function renderOriginButtons() {
    const voiesContainer = document.getElementById('filterVoiesButtonsContainer');
    const spiritsContainer = document.getElementById('filterSpiritsButtonsContainer');

    // Voies – utilise la classe d'affinité dédiée à chaque voie (groupe radio partagé avec les spiritualités)
    if (voiesContainer && state.metaData.voies) {
        voiesContainer.innerHTML = state.metaData.voies.map(v => {
            const isSel = state.selectedFilterVoieId === v.id;
            const hex = getVoieButtonColor(v);
            const affinityClass = getVoieAffinityClass(v);
            const icon = getVoieIcon(v.nom);
            return `<button type="button" role="radio" aria-checked="${isSel}" class="origin-filter-btn ${affinityClass} ${isSel ? 'is-selected' : ''}" onclick="toggleFilterVoie(event, ${v.id}, '${hex}')"><span class="material-symbols-outlined origin-filter-btn-icon">${icon}</span>${v.nom}</button>`;
        }).join('');
    }

    // Spiritualités – applique la classe d'affinité dédiée à chaque spiritualité (groupe radio partagé avec les voies)
    if (spiritsContainer && state.metaData.spiritualites) {
        spiritsContainer.innerHTML = state.metaData.spiritualites.map(s => {
            const isSel = state.selectedFilterSpiritId === s.id;
            const hex = getSpiritButtonColor(s);
            const affinityClass = getSpiritAffinityClass(s);
            const icon = getSpiritIcon(s.nom);
            return `<button type="button" role="radio" aria-checked="${isSel}" class="origin-filter-btn ${affinityClass} ${isSel ? 'is-selected' : ''}" onclick="toggleFilterSpirit(event, ${s.id}, '${hex}')"><span class="material-symbols-outlined origin-filter-btn-icon">${icon}</span>${s.nom}</button>`;
        }).join('');
    }
}

export function toggleFilterVoie(event, id, hexColor) {
    if (event && hexColor && state.selectedFilterVoieId !== id) {
        const rect = event.currentTarget.getBoundingClientRect();
        createSparkles(rect.left + rect.width / 2, rect.top + rect.height / 2, hexColor);
    }
    if (state.selectedFilterVoieId === id) {
        state.selectedFilterVoieId = null;
    } else {
        state.selectedFilterVoieId = id;
        state.selectedFilterSpiritId = null;
    }
    renderOriginButtons();
    renderFilteredSpells();
    
    const container = document.getElementById('createdSpellsContainer');
    if (container) {
        container.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

export function toggleFilterSpirit(event, id, hexColor) {
    if (event && hexColor && state.selectedFilterSpiritId !== id) {
        const rect = event.currentTarget.getBoundingClientRect();
        createSparkles(rect.left + rect.width / 2, rect.top + rect.height / 2, hexColor);
    }
    if (state.selectedFilterSpiritId === id) {
        state.selectedFilterSpiritId = null;
    } else {
        state.selectedFilterSpiritId = id;
        state.selectedFilterVoieId = null;
    }
    renderOriginButtons();
    renderFilteredSpells();
    
    const container = document.getElementById('createdSpellsContainer');
    if (container) {
        container.scrollTo({ top: 0, behavior: 'smooth' });
    }
}




