import { pageState } from './combat-state.js';
import { initMultiSSE } from './combat-socket.js';
import { updateUI } from './combat-ui.js?v=1786180000231';
import * as ui from '../ui.js?v=1786180000231';
import { getSpellEffectsSummaryHtml } from '../pages/grimoire.js?v=1786180000231';
import { getVoieButtonColor, getSpiritButtonColor } from '../utils/filters.js';


export async function fetchCombatEquipments(sessionId) {
    if (!sessionId) return;
    try {
        const res = await globalFetch(`/api/pve/combat/${sessionId}/equipments`, { silent: true });
        if (res && res.ok) {
            pageState.combatEquipments = await res.json();
        } else {
            pageState.combatEquipments = pageState.combatEquipments || {};
        }
    } catch (e) {
        console.warn("Erreur récupération des équipements:", e);
        pageState.combatEquipments = pageState.combatEquipments || {};
    }
}


export async function loadAnomaliesCombat() {
    const needTemplates = !window.allAnomaliesCombat || !Array.isArray(window.allAnomaliesCombat) || window.allAnomaliesCombat.length === 0;
    const tasks = [];

    if (needTemplates) {
        tasks.push(
            globalFetch('/api/anomalies/all-templates', { silent: true })
                .then(async res => {
                    if (res.ok) {
                        const data = await res.json();
                        if (Array.isArray(data)) window.allAnomaliesCombat = data;
                    }
                })
                .catch(e => {
                    console.error("Failed to load anomalies templates:", e);
                    window.allAnomaliesCombat = [];
                })
        );
    }

    tasks.push(
        globalFetch('/api/anomalies', { silent: true })
            .then(async resUser => {
                if (resUser.ok) {
                    const dataUser = await resUser.json();
                    if (Array.isArray(dataUser)) window.myGlobalAnomalies = dataUser;
                }
            })
            .catch(e => {
                console.error("Failed to load user anomalies:", e);
                window.myGlobalAnomalies = [];
            })
    );

    await Promise.all(tasks);
}

export async function resumeCombat(savedSessionId) {
    try {
        const res = await globalFetch(`/api/pve/combat/${savedSessionId}/resume`, { method: 'POST' });
        if (!res.ok) {
            localStorage.removeItem('activeCombatId');
            if (typeof showNotif !== 'undefined') window.showNotif("Combat introuvable ou expiré.", true);
            else ui.showNotif("Combat introuvable ou expiré.", true);
            window.location.href = '/dungeons.html';
            return;
        }
        const data = await res.json();
        pageState.sessionId = data.sessionId;
        pageState.isMulti = (data.multi === true);

        if (pageState.isMulti) {
            initMultiSSE(savedSessionId);
        }

        data.players.forEach(p => {
            pageState.previousPlayerXP[p.id] = p.experience;
            pageState.previousPlayerSpiritXP[p.id] = p.spiritualiteExperience || 0;
        });

        await fetchCombatEquipments(savedSessionId);

        updateUI(data);
    } catch (e) {
        console.error(e);
        localStorage.removeItem('activeCombatId');
        window.location.href = '/dungeons.html';
    }
}

let isStartingCombatInProgress = false;

export async function startCombat(characterIds, dungeonId, consumableIds) {
    if (isStartingCombatInProgress) return;
    isStartingCombatInProgress = true;
    try {
        let fetchUrl = `/api/pve/combat/start?characterIds=${characterIds}&dungeonId=${dungeonId}`;
        if (consumableIds) {
            fetchUrl += `&consumableIds=${consumableIds}`;
        }

        const res = await globalFetch(fetchUrl, {
            method: 'POST'
        });

        if (!res.ok) {
            let errText = "Erreur lors de l'initialisation du donjon.";
            try {
                const text = await res.text();
                if (text) errText = text;
            } catch(e) {}
            if (typeof showNotif !== 'undefined') window.showNotif(errText, true);
            else ui.showNotif(errText, true);
            window.location.href = '/dungeons.html';
            return;
        }

        const data = await res.json();
        pageState.sessionId = data.sessionId;
        localStorage.setItem('activeCombatId', pageState.sessionId);

        // Nettoyer l'URL pour éviter de relancer le donjon au F5
        window.history.replaceState({}, document.title, window.location.pathname);

        // Initialize previous XP for the first room
        data.players.forEach(p => {
            pageState.previousPlayerXP[p.id] = p.experience;
            pageState.previousPlayerSpiritXP[p.id] = p.spiritualiteExperience || 0;
        });

        await fetchCombatEquipments(pageState.sessionId);

        updateUI(data);
    } catch (e) {
        console.error(e);
        const msg = e.message || "Erreur de connexion.";
        if (typeof showNotif !== 'undefined') window.showNotif(msg, true);
        else if (window.ui) ui.showNotif(msg, true);

        setTimeout(() => {
            window.location.href = '/dungeons.html';
        }, 3000);
    } finally {
        isStartingCombatInProgress = false;
    }
}
