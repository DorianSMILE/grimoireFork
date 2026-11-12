// ===== Armory Page JavaScript =====

function applyRbac() {
    if (!document.getElementById('charFormPanel')) return;

    const baseStats = document.getElementById('baseStatsSection');
    const xpField = document.getElementById('charExperience');
    const spiritExpField = document.getElementById('charSpiritExperience');
    const eqCreateSection = document.querySelector('.equip-create-section');
    const searchOwnerContainer = document.getElementById('searchOwnerContainer');

    if (window.isAdmin) {
        if (baseStats) baseStats.classList.remove('hidden');
        if (xpField && xpField.parentElement) xpField.parentElement.classList.remove('hidden');
        if (spiritExpField && spiritExpField.parentElement) spiritExpField.parentElement.classList.remove('hidden');
        if (eqCreateSection) eqCreateSection.classList.remove('hidden');
        if (searchOwnerContainer) searchOwnerContainer.classList.remove('hidden');
    } else {
        if (baseStats) baseStats.classList.add('hidden');
        if (xpField && xpField.parentElement) xpField.parentElement.classList.add('hidden');
        if (spiritExpField && spiritExpField.parentElement) spiritExpField.parentElement.classList.add('hidden');
        if (eqCreateSection) eqCreateSection.classList.add('hidden');
        if (searchOwnerContainer) searchOwnerContainer.classList.add('hidden');
    }

    // Re-render characters to apply button visibility rules
    if (pageState.personnages.length > 0) {
        renderPersonnages();
    }
}
window.addEventListener('authLoaded', applyRbac);
const pageState = {
    voies: [],
    spiritualites: [],
    personnages: [],
    editingId: null,
    equipModalPersoId: null,
    allEquipments: [],
    taverneCollapsed: false,
    armoryCollapsed: false,
    initialLayoutApplied: false
};
window.pageState = pageState;

function applyArmoryLayoutState() {
    const mainEl = document.getElementById('armoryMain');
    const formPanel = document.getElementById('charFormPanel');
    const rosterCol = document.getElementById('armoryRosterCol');
    const taverneDock = document.getElementById('taverneCollapsedDock');
    const armoryDock = document.getElementById('armoryCollapsedDock');

    const expandTaverneIcon = document.getElementById('btnExpandTaverneIcon');
    const expandTaverneLabel = document.getElementById('btnExpandTaverneLabel');
    const expandArmoryIcon = document.getElementById('btnExpandArmoryIcon');
    const expandArmoryLabel = document.getElementById('btnExpandArmoryLabel');

    if (!mainEl) return;

    if (pageState.armoryCollapsed && !pageState.taverneCollapsed) {
        mainEl.classList.add('is-taverne-expanded');
        mainEl.classList.remove('is-armory-expanded');
        if (formPanel) formPanel.classList.remove('is-hidden');
        if (rosterCol) rosterCol.classList.add('is-hidden');
        if (taverneDock) taverneDock.classList.add('is-hidden');
        if (armoryDock) armoryDock.classList.remove('is-hidden');

        if (expandTaverneIcon) expandTaverneIcon.textContent = 'close_fullscreen';
        if (expandTaverneLabel) expandTaverneLabel.textContent = 'Vue partagée';
    } else if (pageState.taverneCollapsed && !pageState.armoryCollapsed) {
        mainEl.classList.add('is-armory-expanded');
        mainEl.classList.remove('is-taverne-expanded');
        if (formPanel) formPanel.classList.add('is-hidden');
        if (rosterCol) rosterCol.classList.remove('is-hidden');
        if (taverneDock) taverneDock.classList.remove('is-hidden');
        if (armoryDock) armoryDock.classList.add('is-hidden');

        if (expandArmoryIcon) expandArmoryIcon.textContent = 'close_fullscreen';
        if (expandArmoryLabel) expandArmoryLabel.textContent = 'Vue partagée';
    } else {
        mainEl.classList.remove('is-taverne-expanded', 'is-armory-expanded');
        if (formPanel) formPanel.classList.remove('is-hidden');
        if (rosterCol) rosterCol.classList.remove('is-hidden');
        if (taverneDock) taverneDock.classList.add('is-hidden');
        if (armoryDock) armoryDock.classList.add('is-hidden');

        if (expandTaverneIcon) expandTaverneIcon.textContent = 'open_in_full';
        if (expandTaverneLabel) expandTaverneLabel.textContent = 'Grand format';
        if (expandArmoryIcon) expandArmoryIcon.textContent = 'open_in_full';
        if (expandArmoryLabel) expandArmoryLabel.textContent = 'Grand format';
    }
}

window.toggleArmoryPanel = function (panel) {
    if (panel === 'taverne') {
        if (pageState.taverneCollapsed) {
            pageState.taverneCollapsed = false;
        } else {
            pageState.taverneCollapsed = true;
            pageState.armoryCollapsed = false;
        }
    } else if (panel === 'armory') {
        if (pageState.armoryCollapsed) {
            pageState.armoryCollapsed = false;
        } else {
            pageState.armoryCollapsed = true;
            pageState.taverneCollapsed = false;
        }
    }
    applyArmoryLayoutState();
};

window.expandArmoryPanel = function (panel) {
    if (panel === 'taverne') {
        if (pageState.armoryCollapsed && !pageState.taverneCollapsed) {
            pageState.armoryCollapsed = false;
            pageState.taverneCollapsed = false;
        } else {
            pageState.armoryCollapsed = true;
            pageState.taverneCollapsed = false;
        }
    } else if (panel === 'armory') {
        if (pageState.taverneCollapsed && !pageState.armoryCollapsed) {
            pageState.taverneCollapsed = false;
            pageState.armoryCollapsed = false;
        } else {
            pageState.taverneCollapsed = true;
            pageState.armoryCollapsed = false;
        }
    }
    applyArmoryLayoutState();
};

// Replaced by window.SLOT_LABELS and window.CONSUMABLE_CATEGORIES


// ===== API =====

async function fetchMeta() {
    try {
        const res = await globalFetch('/api/spells-editor/meta');
        if (res) {
            const data = await res.json();
            pageState.voies = data.voies || [];
            pageState.spiritualites = data.spiritualites || [];
            populateSelects();
        }
    } catch (e) {
        console.error('Erreur chargement meta:', e);
    }
}

async function loadPersonnages() {
    try {
        const url = window.isAdmin ? '/api/personnages/all' : '/api/personnages';
        const res = await globalFetch(url);
        if (res) {
            let chars = await res.json();
            chars.sort((a, b) => (b.voieLevel || 1) - (a.voieLevel || 1));
            pageState.personnages = chars;
            renderPersonnages();
            await updateCharLimitUI();
        }
    } catch (e) {
        console.error('Erreur chargement personnages:', e);
    }
}

async function updateCharLimitUI() {
    try {
        const res = await globalFetch('/api/personnages/limit');
        if (res) {
            const data = await res.json();
            const limitContainer = document.getElementById('charLimitContainer');
            if (!limitContainer) return;

            const isMaxedOut = data.currentCharacters >= data.maxCharacters;
            const color = (isMaxedOut && !window.isAdmin) ? '#ef4444' : '#94a3b8';

            let html = `<span class="text-sm font-medium" style="color: ${color};">${data.currentCharacters}/${data.maxCharacters}</span>`;

            if (isMaxedOut && data.maxCharacters < 8 && !window.isAdmin) {
                const costs = { 2: 20, 3: 50, 4: 75, 5: 150, 6: 200, 7: 300 };
                const cost = costs[data.maxCharacters];
                html += `<button class="text-success ml-2 bg-success/20 border-success/40 rounded cursor-pointer px-1 py-0 flex-center" onclick="buyRosterSlot(${cost})" title="Acheter un emplacement pour ${cost} or"><span class="material-symbols-outlined text-sm">add</span></button>`;
            }

            limitContainer.innerHTML = html;
            const dockLimitBadge = document.getElementById('taverneDockLimitBadge');
            if (dockLimitBadge) {
                dockLimitBadge.textContent = `${data.currentCharacters}/${data.maxCharacters}`;
            }
            window.charLimitData = data;

            const availableSlots = Math.max(0, data.maxCharacters - data.currentCharacters);
            if (window.currentUser) {
                window.currentUser.availableCharacterSlots = availableSlots;
            }
            const armoryBadge = document.getElementById('navArmoryBadge');
            if (armoryBadge) {
                if (availableSlots > 0) {
                    armoryBadge.textContent = availableSlots;
                    armoryBadge.style.display = 'inline-block';
                } else {
                    armoryBadge.style.display = 'none';
                }
            }

            if (!pageState.initialLayoutApplied) {
                pageState.initialLayoutApplied = true;
                const urlParams = new URLSearchParams(window.location.search);
                const hasOpenEquip = !isNaN(parseInt(urlParams.get('openEquip'), 10));
                const isEquipTuto = Boolean(window.currentUser && window.currentUser.equipTutorialActive && pageState.personnages.length > 0);
                if (availableSlots > 0 && !hasOpenEquip && !isEquipTuto) {
                    pageState.armoryCollapsed = true;
                    pageState.taverneCollapsed = false;
                } else {
                    pageState.armoryCollapsed = false;
                    pageState.taverneCollapsed = false;
                }
                applyArmoryLayoutState();
            }

            updateSubmitButtonState();
        }
    } catch (e) {
        console.error('Erreur limite personnages:', e);
    }
}

function updateSubmitButtonState() {
    const submitBtn = document.getElementById('submitBtn');
    if (!submitBtn) return;

    submitBtn.disabled = false;
    if (pageState.editingId || window.isAdmin) {
        submitBtn.classList.remove('opacity-50', 'cursor-not-allowed', 'is-limit-reached');
    } else if (window.charLimitData) {
        const isMaxedOut = window.charLimitData.currentCharacters >= window.charLimitData.maxCharacters;
        if (isMaxedOut) {
            submitBtn.classList.add('opacity-50', 'is-limit-reached');
        } else {
            submitBtn.classList.remove('opacity-50', 'cursor-not-allowed', 'is-limit-reached');
        }
    }
}

window.buyRosterSlot = function (cost) {
    showModal({
        title: 'Agrandir le Roster ?',
        body: `Voulez-vous acheter un nouvel emplacement de personnage pour <strong class="text-gold">${cost}</strong> Or ?`,
        icon: 'shopping_cart',
        confirmText: 'Oui, acheter',
        onConfirm: async () => {
            try {
                const res = await globalFetch('/api/auth/unlock/roster', { method: 'POST' });
                if (res.ok) {
                    const data = await res.json();
                    showNotif(data.message);
                    // Update auth state so UI syncs
                    if (window.checkAuthStatus) {
                        await window.checkAuthStatus();
                    } else {
                        const u = await globalFetch('/api/auth/me').then(r => r.json());
                        window.currentUser = u;
                    }
                    await updateCharLimitUI();

                    const eqCreateSection = document.querySelector('.equip-create-section');
                    if (eqCreateSection && window.currentUser) eqCreateSection.classList.remove('hidden');
                } else {
                    const err = await res.json();
                    showNotif(err.message || "Erreur lors de l'achat", true);
                }
            } catch (e) {
                console.error(e);
                showNotif("Erreur réseau.", true);
            }
        }
    });
};

async function loadAllEquipments() {
    try {
        const url = window.isAdmin ? '/api/equipments/all' : '/api/equipments';
        const res = await globalFetch(url);
        if (res.ok) {
            const rawEquips = await res.json();
            // Filter out templates so they cannot be equipped, even for admins
            pageState.allEquipments = rawEquips.filter(e => !e.isTemplate);
        }
    } catch (e) {
        console.error('Erreur chargement de tous les équipements:', e);
        pageState.allEquipments = [];
    }
}

async function submitPersonnage() {
    if (typeof window.hideGlobalTooltip === 'function') {
        window.hideGlobalTooltip(true);
    }

    if (!pageState.editingId && !window.isAdmin && window.charLimitData) {
        if (window.charLimitData.currentCharacters >= window.charLimitData.maxCharacters) {
            showNotif(`Limite de personnages atteinte (${window.charLimitData.currentCharacters}/${window.charLimitData.maxCharacters}). Débloquez un emplacement (+) en haut du formulaire.`, true);
            return;
        }
    }

    const nameInput = document.getElementById('charName');
    const name = nameInput ? nameInput.value.trim() : '';
    if (!name) {
        showNotif('Le nom est obligatoire.', true);
        if (nameInput) nameInput.focus();
        return;
    }

    const activeWheelNode = document.querySelector('#charVoieOptions .voie-star-node.is-active');
    const checkedSpiritRadio = document.querySelector('#charSpiritOptions input[name="charSpiritRadio"]:checked');
    const selectedSpiritCard = document.querySelector('#charSpiritOptions .spirit-radio-card.is-selected input[name="charSpiritRadio"]');

    const voieIdVal = document.getElementById('charVoie')?.value || (activeWheelNode ? activeWheelNode.getAttribute('data-value') : '') || '';
    const spiritIdVal = document.getElementById('charSpirit')?.value || (checkedSpiritRadio ? checkedSpiritRadio.value : '') || (selectedSpiritCard ? selectedSpiritCard.value : '') || '';

    if (!pageState.editingId && (!voieIdVal || !spiritIdVal)) {
        if (!voieIdVal && !spiritIdVal) {
            showNotif('Une Voie et une Spiritualité sont obligatoires à la création.', true);
        } else if (!voieIdVal) {
            showNotif('Veuillez choisir une Voie sur la roue en étoile.', true);
        } else {
            showNotif('Veuillez choisir une Spiritualité (Esprit, Karma ou Ténèbres).', true);
        }
        return;
    }

    const dto = {
        id: pageState.editingId,
        name: name,
        healthMax: parseInt(document.getElementById('charHp').value) || 100,
        manaMax: parseInt(document.getElementById('charMana').value) || 100,
        power: parseInt(document.getElementById('charPower').value) || 0,
        strength: parseInt(document.getElementById('charStrength').value) || 0,
        armor: parseInt(document.getElementById('charArmor').value) || 0,
        resistance: parseInt(document.getElementById('charResistance').value) || 0,
        speed: parseInt(document.getElementById('charSpeed').value) || 0,
        crit: parseInt(document.getElementById('charCrit').value) || 0,
        regenHp: parseInt(document.getElementById('charRegenHp').value) || 0,
        regenMana: parseInt(document.getElementById('charRegenMana').value) || 0,
        voieId: voieIdVal || null,
        experience: parseInt(document.getElementById('charExperience').value) || 0,
        spiritualiteId: spiritIdVal || null,
        spiritualiteExperience: parseInt(document.getElementById('charSpiritExperience').value) || 0,
    };

    if (dto.voieId === '') dto.voieId = null;
    if (dto.spiritualiteId === '') dto.spiritualiteId = null;
    if (dto.voieId) dto.voieId = parseInt(dto.voieId);
    if (dto.spiritualiteId) dto.spiritualiteId = parseInt(dto.spiritualiteId);

    try {
        const res = await globalFetch('/api/personnages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dto)
        });
        if (res) {
            const data = await res.json();
            showNotif(data.message || 'Personnage sauvegardé !');
            if (data.redirectToDungeonTutorial) {
                if (window.GrimoireTutorial) window.GrimoireTutorial.stop();
                if (window.currentUser) window.currentUser.tutorialPhase = 'DUNGEON';
                setTimeout(() => { window.location.href = '/dungeons?tutorial=1'; }, 650);
                return;
            }
            resetForm(); await loadPersonnages();
        
        }
    } catch (e) {
        // globalFetch already calls showNotif with the specific error message
        console.error("Erreur lors de la sauvegarde:", e);
    }
}

window.deletePersonnage = function (id) {
    const p = pageState.personnages.find(p => p.id === id);
    if (!p) return;

    showModal({
        title: 'Supprimer ce personnage ?',
        body: `Voulez-vous vraiment supprimer définitivement <strong class="text-white">${p.name}</strong> ?<br><br>Cette action est irréversible.`,
        icon: 'warning',
        confirmText: 'Oui, supprimer',
        onConfirm: async () => {
            try {
                const res = await globalFetch(`/api/personnages/${id}`, { method: 'DELETE' });
                if (res.ok) {
                    showNotif('Personnage supprimé.');
                    if (pageState.editingId === id) resetForm(); await loadPersonnages();
                
                } else {
                    showNotif("Erreur lors de la suppression.", true);
                }
            } catch (e) {
                console.error(e);
                showNotif('Erreur réseau lors de la suppression.', true);
            }
        }
    });
}

// ===== Equipment API =====



async function equipItem(equipmentId, personnageId, targetSlot = null) {
    try {
        let url = `/api/equipments/${equipmentId}/equip/${personnageId}`;
        if (targetSlot) {
            url += `?targetSlot=${targetSlot}`;

        }
        const res = await globalFetch(url, { method: 'POST' });
        if (res) {
            const data = await res.json();
            showNotif(data.message);
            if (window.GrimoireTutorial && window.GrimoireTutorial.isActive() && window.GrimoireTutorial.getCurrentStep()?.name === 'EQUIP_SELECT_ITEM') {
                await window.GrimoireTutorial.complete(true);
            }
            await Promise.all([loadAllEquipments(), loadPersonnages()]);
    initArmoryTutorial();
            renderEquipModal();
        
        }
    } catch (e) {
        showNotif(e.message || 'Erreur lors de l\'équipement.', true);
    }
}

async function unequipItem(equipmentId) {
    try {
        const res = await globalFetch(`/api/equipments/${equipmentId}/unequip`, { method: 'POST' });
        if (res) {
            const data = await res.json();
            showNotif(data.message);
            if (window.GrimoireTutorial && window.GrimoireTutorial.isActive() && window.GrimoireTutorial.getCurrentStep()?.name === 'EQUIP_SELECT_ITEM') {
                await window.GrimoireTutorial.complete(true);
            }
            await Promise.all([loadAllEquipments(), loadPersonnages()]);
    initArmoryTutorial();
            renderEquipModal();
        
        }
    } catch (e) {
        showNotif(e.message || 'Erreur lors du déséquipement.', true);
    }
}

async function deleteEquipment(id) {
    const eq = pageState.allEquipments.find(e => e.id === id);
    if (!eq) return;

    api.deleteEquipmentAPI(id, {
        confirm: true,
        confirmTitle: "Déséquiper / Détruire ?",
        confirmBody: `Voulez-vous vraiment supprimer l'équipement <strong class="text-white">${eq.name}</strong> ?`,
        apiRoute: "/api/equipments/",
        onSuccess: async () => {
            if (window.GrimoireTutorial && window.GrimoireTutorial.isActive() && window.GrimoireTutorial.getCurrentStep()?.name === 'EQUIP_SELECT_ITEM') {
                await window.GrimoireTutorial.complete(true);
            }
            await Promise.all([loadAllEquipments(), loadPersonnages()]);
    initArmoryTutorial();
            renderEquipModal();
        
        }
    });
}
// ===== UI =====

// Helpers for icons and colors
function getVoieInfo(nom) {
    if (!nom) return { icon: 'trip_origin', color: '#94a3b8', nodeClass: 'voie-node-default', shortLabel: 'Aucune' };
    const n = nom.toLowerCase();
    const shortName = nom.replace(/^Voie de la\s+/i, '').replace(/^Voie de\s+/i, '').trim();
    if (n.includes('raison')) return { icon: 'psychology', color: '#3b82f6', nodeClass: 'voie-node-raison', shortLabel: shortName };
    if (n.includes('sûreté') || n.includes('surete')) return { icon: 'water_drop', color: '#00e5cc', nodeClass: 'voie-node-surete', shortLabel: shortName };
    if (n.includes('trahison')) return { icon: 'visibility_off', color: '#ed5677', nodeClass: 'voie-node-trahison', shortLabel: shortName };
    if (n.includes('consolidation')) return { icon: 'foundation', color: '#99674c', nodeClass: 'voie-node-consolidation', shortLabel: shortName };
    if (n.includes('conviction')) return { icon: 'volcano', color: '#b74c0b', nodeClass: 'voie-node-conviction', shortLabel: shortName };
    if (n.includes('création') || n.includes('creation')) return { icon: 'eco', color: '#10b981', nodeClass: 'voie-node-creation', shortLabel: shortName };
    if (n.includes('destruction')) return { icon: 'local_fire_department', color: '#ff0000', nodeClass: 'voie-node-destruction', shortLabel: shortName };
    if (n.includes('violence')) return { icon: 'explosion', color: '#a70740', nodeClass: 'voie-node-violence', shortLabel: shortName };
    return { icon: 'route', color: '#94a3b8', nodeClass: 'voie-node-default', shortLabel: shortName };
}

function getSpiritInfo(nom) {
    if (!nom) return { icon: 'trip_origin', color: '#94a3b8', cardClass: 'spirit-card-none', textClass: 'text-muted' };
    const n = nom.toLowerCase();
    if (n.includes('esprit')) return { icon: 'blur_on', color: '#38bdf8', cardClass: 'spirit-card-esprit', textClass: 'text-info' };
    if (n.includes('ténèbres') || n.includes('tenebres')) return { icon: 'dark_mode', color: '#c084fc', cardClass: 'spirit-card-tenebres', textClass: 'text-purple' };
    if (n.includes('karma')) return { icon: 'all_inclusive', color: '#e7d198', cardClass: 'spirit-card-karma', textClass: 'text-gold' };
    return { icon: 'psychology', color: '#a78bfa', cardClass: 'spirit-card-default', textClass: 'text-purple' };
}

function syncVoieWheelSelection(val, dispatchEvent = false) {
    const strVal = val !== undefined && val !== null ? String(val) : '';
    const hiddenInput = document.getElementById('charVoie');
    if (hiddenInput) {
        hiddenInput.value = strVal;
    }

    const ring = document.getElementById('charVoieOptions');
    const centerEl = document.getElementById('charVoieLabel');
    const total = pageState.voies.length || 8;
    let currentAngle = typeof pageState.voieWheelAngle === 'number' ? pageState.voieWheelAngle : 0;

    if (ring) {
        const nodes = ring.querySelectorAll('.voie-star-node');
        let activeIdx = -1;
        nodes.forEach((node, idx) => {
            const isMatch = String(node.getAttribute('data-value')) === strVal && strVal !== '';
            node.classList.toggle('is-active', isMatch);
            node.setAttribute('aria-checked', isMatch ? 'true' : 'false');
            if (isMatch) activeIdx = idx;
        });

        if (activeIdx >= 0 && total > 0) {
            const targetMod = -activeIdx * (360 / total);
            const delta = ((targetMod - currentAngle) % 360 + 540) % 360 - 180;
            currentAngle = currentAngle + delta;
            pageState.voieWheelAngle = currentAngle;
        }

        // Procedural rotation of the star wheel & counter-rotation of nodes so icons stay upright
        ring.style.transform = `rotate(${currentAngle}deg)`;
        const inners = ring.querySelectorAll('.voie-star-node-inner');
        inners.forEach(inner => {
            inner.style.transform = `rotate(${-currentAngle}deg)`;
        });
    }

    if (centerEl) {
        const selectedVoie = strVal ? pageState.voies.find(v => String(v.id) === strVal) : null;
        if (selectedVoie) {
            const info = getVoieInfo(selectedVoie.nom);
            centerEl.className = `voie-star-center is-selected ${info.nodeClass}`;
            centerEl.innerHTML = `
                <span class="material-symbols-outlined voie-star-center-icon">${info.icon}</span>
                <span class="voie-star-center-title">${info.shortLabel}</span>
                <span class="voie-star-center-sub">Voie active</span>
            `;
        } else {
            centerEl.className = 'voie-star-center';
            centerEl.innerHTML = `
                <span class="material-symbols-outlined voie-star-center-icon text-muted">explore</span>
                <span class="voie-star-center-title">Choisir une Voie</span>
            `;
        }
    }

    if (dispatchEvent) {
        if (typeof handleVoieSelectionChange === 'function') {
            handleVoieSelectionChange(strVal);
        }
        if (hiddenInput) {
            hiddenInput.dispatchEvent(new Event('change', { bubbles: true }));
        }
    }
}

window.selectVoieWheel = function (val) {
    if (typeof window.hideGlobalTooltip === 'function') {
        window.hideGlobalTooltip(true);
    }
    syncVoieWheelSelection(val, true);
};

function getVoieWheelOrderIndex(nom) {
    if (!nom) return 99;
    const clean = nom.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (clean.includes('raison')) return 0;
    if (clean.includes('trahison')) return 1;
    if (clean.includes('surete')) return 2;
    if (clean.includes('creation')) return 3;
    if (clean.includes('consolidation')) return 4;
    if (clean.includes('conviction')) return 5;
    if (clean.includes('destruction')) return 6;
    if (clean.includes('violence')) return 7;
    return 99;
}

function renderVoieStarWheel() {
    const ring = document.getElementById('charVoieOptions');
    if (!ring) return;

    const currentVal = String(document.getElementById('charVoie')?.value || '');
    const richFormatter = typeof formatRichText === 'function' ? formatRichText : (t => t || '');
    const orderedVoies = [...pageState.voies].sort((a, b) => getVoieWheelOrderIndex(a.nom) - getVoieWheelOrderIndex(b.nom));
    const total = orderedVoies.length || 1;

    // 8-pointed astral star SVG background inside the rotating wheel
    let html = `
        <svg class="voie-star-svg" viewBox="0 0 240 240" aria-hidden="true">
            <circle cx="120" cy="120" r="92" class="voie-star-orbit" />
            <circle cx="120" cy="120" r="62" class="voie-star-inner-orbit" />
            <polygon points="120,18 144,96 222,120 144,144 120,222 96,144 18,120 96,96" class="voie-star-poly-main" />
            <polygon points="48,48 136,88 192,48 152,136 192,192 104,152 48,192 88,104" class="voie-star-poly-alt" />
            <line x1="120" y1="26" x2="120" y2="214" class="voie-star-spoke" />
            <line x1="26" y1="120" x2="214" y2="120" class="voie-star-spoke" />
            <line x1="54" y1="54" x2="186" y2="186" class="voie-star-spoke" />
            <line x1="186" y1="54" x2="54" y2="186" class="voie-star-spoke" />
        </svg>
    `;

    orderedVoies.forEach((v, idx) => {
        const info = getVoieInfo(v.nom);
        const angleDeg = idx * (360 / total);
        const rad = (angleDeg - 90) * (Math.PI / 180);
        const radiusPct = 38.5;
        const leftPct = (50 + Math.cos(rad) * radiusPct).toFixed(2);
        const topPct = (50 + Math.sin(rad) * radiusPct).toFixed(2);
        const isSelected = currentVal === String(v.id);
        const passiveHtml = richFormatter(v.passiveDescription) || 'Passif spécifique.';
        const descHtml = v.description || 'Description générique.';

        html += `
            <button
                type="button"
                role="radio"
                aria-checked="${isSelected ? 'true' : 'false'}"
                class="voie-star-node ${info.nodeClass} ${isSelected ? 'is-active' : ''}"
                data-value="${v.id}"
                data-child-tooltip="true"
                data-prefer-top
                style="left: ${leftPct}%; top: ${topPct}%;"
                onclick="window.selectVoieWheel('${v.id}')"
                onmouseenter="showGlobalTooltip(this)"
                onmouseleave="hideGlobalTooltip()"
            >
                <span class="voie-star-node-inner">
                    <span class="voie-star-node-medallion">
                        <span class="material-symbols-outlined">${info.icon}</span>
                    </span>
                    <span class="voie-star-node-name">${info.shortLabel}</span>
                </span>
                <template class="tooltip-data">
                    <div class="text-sm font-medium mb-2 flex-center gap-1" style="color: ${info.color};">
                        <span class="material-symbols-outlined text-lg">${info.icon}</span>
                        ${v.nom}
                    </div>
                    <div class="text-xs text-slate-300 mb-2">${descHtml}</div>
                    <div class="flex-start-gap text-xs text-slate-200">
                        <span class="material-symbols-outlined text-md" style="color: ${info.color};">bolt</span>
                        <span class="font-italic whitespace-pre-wrap">${passiveHtml}</span>
                    </div>
                </template>
            </button>
        `;
    });

    ring.innerHTML = html;
    syncVoieWheelSelection(currentVal, false);
}

function syncSpiritRadioSelection(val, dispatchEvent = false) {
    const strVal = val !== undefined && val !== null ? String(val) : '';
    const hiddenInput = document.getElementById('charSpirit');
    if (hiddenInput) {
        hiddenInput.value = strVal;
    }

    const container = document.getElementById('charSpiritOptions');
    if (container) {
        const cards = container.querySelectorAll('.spirit-radio-card');
        cards.forEach(card => {
            const radio = card.querySelector('input[type="radio"]');
            const isMatch = radio && String(radio.value) === strVal;
            if (radio) radio.checked = Boolean(isMatch);
            card.classList.toggle('is-selected', Boolean(isMatch));
        });
    }

    const labelEl = document.getElementById('charSpiritLabel');
    if (labelEl) {
        if (strVal) {
            const s = pageState.spiritualites.find(x => String(x.id) === strVal);
            if (s) {
                const info = getSpiritInfo(s.nom);
                labelEl.innerHTML = `<span class="material-symbols-outlined cs-icon ${info.textClass}">${info.icon}</span> ${s.nom}`;
            }
        } else {
            labelEl.innerHTML = `<span class="material-symbols-outlined cs-icon text-muted">trip_origin</span> — Aucune —`;
        }
    }

    if (dispatchEvent) {
        if (typeof handleSpiritSelectionChange === 'function') {
            handleSpiritSelectionChange(strVal);
        }
        if (hiddenInput) {
            hiddenInput.dispatchEvent(new Event('change', { bubbles: true }));
        }
    }
}

window.selectSpiritRadio = function (val) {
    if (typeof window.hideGlobalTooltip === 'function') {
        window.hideGlobalTooltip(true);
    }
    syncSpiritRadioSelection(val, true);
};

function renderSpiritRadios() {
    const charSpiritOptions = document.getElementById('charSpiritOptions');
    if (!charSpiritOptions) return;

    const currentVal = String(document.getElementById('charSpirit')?.value || '');
    const richFormatter = typeof formatRichText === 'function' ? formatRichText : (t => t || '');

    let html = `
        <label class="spirit-radio-card spirit-card-none ${currentVal === '' ? 'is-selected' : ''}" onclick="window.selectSpiritRadio('')">
            <input type="radio" name="charSpiritRadio" class="spirit-radio-input" value="" ${currentVal === '' ? 'checked' : ''} />
            <span class="spirit-radio-icon-box">
                <span class="material-symbols-outlined">block</span>
            </span>
            <span class="spirit-radio-label">Aucune</span>
        </label>
    `;

    pageState.spiritualites.forEach(s => {
        const info = getSpiritInfo(s.nom);
        const sIdStr = String(s.id);
        const isSelected = currentVal === sIdStr;
        const passiveHtml = richFormatter(s.passiveDescription) || 'Passif spécifique.';
        const descHtml = s.description || 'Description générique.';

        html += `
            <label
                class="spirit-radio-card ${info.cardClass} ${isSelected ? 'is-selected' : ''}"
                data-child-tooltip="true"
                data-prefer-top
                onclick="window.selectSpiritRadio('${s.id}')"
                onmouseenter="showGlobalTooltip(this)"
                onmouseleave="hideGlobalTooltip()"
            >
                <input type="radio" name="charSpiritRadio" class="spirit-radio-input" value="${s.id}" ${isSelected ? 'checked' : ''} />
                <span class="spirit-radio-icon-box">
                    <span class="material-symbols-outlined">${info.icon}</span>
                </span>
                <span class="spirit-radio-label">${s.nom}</span>
                <span class="material-symbols-outlined spirit-radio-info-dot">info</span>
                <template class="tooltip-data">
                    <div class="text-sm font-medium mb-2 flex-center gap-1 ${info.textClass}">
                        <span class="material-symbols-outlined text-lg">${info.icon}</span>
                        ${s.nom}
                    </div>
                    <div class="text-xs text-slate-300 mb-2">${descHtml}</div>
                    <div class="flex-start-gap text-xs text-slate-200">
                        <span class="material-symbols-outlined text-md ${info.textClass}">bolt</span>
                        <span class="font-italic whitespace-pre-wrap">${passiveHtml}</span>
                    </div>
                </template>
            </label>
        `;
    });

    charSpiritOptions.innerHTML = html;
}

function populateSelects() {
    const searchVoieOptions = document.getElementById('searchVoieOptions');
    const searchSpiritOptions = document.getElementById('searchSpiritOptions');

    renderVoieStarWheel();

    if (searchVoieOptions) {
        searchVoieOptions.innerHTML = `<div class="custom-option" data-value=""><span class="material-symbols-outlined cs-icon text-muted">trip_origin</span> Toutes</div>`;
        pageState.voies.forEach(v => {
            const info = getVoieInfo(v.nom);
            searchVoieOptions.innerHTML += `<div class="custom-option" data-value="${v.id}"><span class="material-symbols-outlined cs-icon" style="color: ${info.color};">${info.icon}</span> ${v.nom}</div>`;
        });
    }

    renderSpiritRadios();

    if (searchSpiritOptions) {
        searchSpiritOptions.innerHTML = `<div class="custom-option" data-value=""><span class="material-symbols-outlined cs-icon text-muted">trip_origin</span> Toutes</div>`;
        pageState.spiritualites.forEach(s => {
            const info = getSpiritInfo(s.nom);
            searchSpiritOptions.innerHTML += `<div class="custom-option" data-value="${s.id}"><span class="material-symbols-outlined cs-icon" style="color: ${info.color};">${info.icon}</span> ${s.nom}</div>`;
        });
    }
}
function getVoieColor(nom) {
    if (!nom) return '#94a3b8';
    const vNom = nom.toLowerCase();
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

function getSpiritColor(nom) {
    if (!nom) return '#a78bfa';
    const sNom = nom.toLowerCase();
    if (sNom.includes('esprit')) return '#38bdf8';
    if (sNom.includes('ténèbres') || sNom.includes('tenebres')) return '#c084fc';
    if (sNom.includes('karma')) return '#e7d198';
    return '#a78bfa';
}

function buildCharBadgesHtml(p) {
    if (!p) return '';
    let badges = '';
    if (p.voie) {
        const vColor = getVoieColor(p.voie.nom);
        const vFull = pageState.voies.find(v => v.id == p.voie.id) || p.voie;
        const info = getVoieInfo(p.voie.nom);
        badges += `<span class="char-badge" style="color: ${vColor}; border-color: ${vColor}40; background: ${vColor}15; cursor: help;" onmouseenter="showGlobalTooltip(this)" onmouseleave="hideGlobalTooltip()">
            <span class="material-symbols-outlined text-xs">route</span>
            ${p.voie.nom}${p.voieLevel ? ' Lvl ' + p.voieLevel : ''}
            <template class="tooltip-data">
                <div class="text-sm font-medium mb-2 flex-center gap-1" style="color: ${info.color};">
                    <span class="material-symbols-outlined text-lg">${info.icon}</span>
                    ${vFull.nom}
                </div>
                <div class="text-xs text-slate-300 mb-2">${vFull.description || 'Description générique.'}</div>
                <div class="flex-start-gap text-xs text-slate-200">
                    <span class="material-symbols-outlined text-md" style="color: ${info.color};">bolt</span>
                    <span class="font-italic whitespace-pre-wrap">${formatRichText(vFull.passiveDescription) || 'Passif spécifique.'}</span>
                </div>
            </template>
        </span>`;
    }
    if (p.spiritualite) {
        const sColor = getSpiritColor(p.spiritualite.nom);
        const sFull = pageState.spiritualites.find(s => s.id == p.spiritualite.id) || p.spiritualite;
        const info = getSpiritInfo(p.spiritualite.nom);
        badges += `<span class="char-badge" style="color: ${sColor}; border-color: ${sColor}40; background: ${sColor}15; cursor: help;" onmouseenter="showGlobalTooltip(this)" onmouseleave="hideGlobalTooltip()">
            <span class="material-symbols-outlined text-xs">psychology</span>
            ${p.spiritualite.nom}${p.spiritualiteLevel ? ' Lvl ' + p.spiritualiteLevel : ''}
            <template class="tooltip-data">
                <div class="text-sm font-medium mb-2 flex-center gap-1" style="color: ${info.color};">
                    <span class="material-symbols-outlined text-lg">${info.icon}</span>
                    ${sFull.nom}
                </div>
                <div class="text-xs text-slate-300 mb-2">${sFull.description || 'Description générique.'}</div>
                <div class="flex-start-gap text-xs text-slate-200">
                    <span class="material-symbols-outlined text-md" style="color: ${info.color};">bolt</span>
                    <span class="font-italic whitespace-pre-wrap">${formatRichText(sFull.passiveDescription) || 'Passif spécifique.'}</span>
                </div>
            </template>
        </span>`;
    }
    if (!p.voie && !p.spiritualite) {
        badges = `<span class="font-italic text-muted text-xs">Aucune affiliation</span>`;
    }
    return badges;
}
window.buildCharBadgesHtml = buildCharBadgesHtml;

function filterPersonnages() {
    renderPersonnages();
}

function renderPersonnages() {
    const container = document.getElementById('personnagesList');
    if (!container) return;

    const totalCount = pageState.personnages.length;
    const rosterCountEl = document.getElementById('armoryRosterCount');
    if (rosterCountEl) rosterCountEl.textContent = String(totalCount);
    const dockCountEl = document.getElementById('armoryDockCountBadge');
    if (dockCountEl) dockCountEl.textContent = String(totalCount);

    // Filter logic
    const searchName = document.getElementById('searchName') ? document.getElementById('searchName').value.toLowerCase() : '';
    const searchOwner = document.getElementById('searchOwner') ? document.getElementById('searchOwner').value.toLowerCase() : '';
    const searchVoie = document.getElementById('searchVoie') ? document.getElementById('searchVoie').value : '';
    const searchSpirit = document.getElementById('searchSpirit') ? document.getElementById('searchSpirit').value : '';

    let filtered = pageState.personnages.filter(p => {
        const matchName = !searchName || (p.name && p.name.toLowerCase().includes(searchName));
        const matchOwner = !searchOwner || (p.ownerUsername && p.ownerUsername.toLowerCase().includes(searchOwner));
        const matchVoie = !searchVoie || (p.voie && p.voie.id == searchVoie);
        const matchSpirit = !searchSpirit || (p.spiritualite && p.spiritualite.id == searchSpirit);
        return matchName && matchOwner && matchVoie && matchSpirit;
    });

    // Sort logic: Sort by User then VoieLevel then Name for admins, else by VoieLevel then Name
    filtered.sort((a, b) => {
        if (window.isAdmin) {
            const uA = a.ownerUsername || '';
            const uB = b.ownerUsername || '';
            if (uA === uB) {
                const diff = (b.voieLevel || 1) - (a.voieLevel || 1);
                return diff !== 0 ? diff : a.name.localeCompare(b.name);
            }
            return uA.localeCompare(uB);
        } else {
            const diff = (b.voieLevel || 1) - (a.voieLevel || 1);
            return diff !== 0 ? diff : a.name.localeCompare(b.name);
        }
    });

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="armory-empty-state">
                <span class="material-symbols-outlined">person_off</span>
                Aucun personnage ne correspond à la recherche.
            </div>`;
        return;
    }

    container.innerHTML = filtered.map(p => {
        let badges = buildCharBadgesHtml(p);

        // Equipment summary
        const persoEquips = pageState.allEquipments.filter(e => e.personnage && e.personnage.id === p.id);
        let equipHtml = '';
        if (persoEquips.length > 0) {
            const slotOrder = ['CASQUE', 'PLASTRON', 'CAPE', 'BOTTES', 'ANNEAU_GAUCHE', 'ANNEAU_DROIT', 'ARME_GAUCHE', 'ARME_DROITE', 'ARME_DEUX_MAINS'];
            const sortedEquips = persoEquips.sort((a, b) => {
                const sNameA = typeof (a.slot?.name || a.slot) === 'object' ? a.slot?.name : a.slot;
                const sNameB = typeof (b.slot?.name || b.slot) === 'object' ? b.slot?.name : b.slot;
                return slotOrder.indexOf(sNameA) - slotOrder.indexOf(sNameB);
            });

            equipHtml = `<div style="display: flex; flex-direction: column; gap: 0.3rem;">`;
            for (let i = 0; i < sortedEquips.length; i += 4) {
                const chunk = sortedEquips.slice(i, i + 4);
                equipHtml += `<div class="char-equip-row">` + chunk.map(eq => {
                    const slotInfo = getSlotInfo(eq);

                    const eqStatsHtml = STAT_DEFS
                        .filter(s => eq[s.key] && eq[s.key] !== 0)
                        .map(s => {
                            const val = eq[s.key];
                            const isMalus = val < 0;
                            const sign = val > 0 ? '+' : '';
                            const suffix = s.isPercent ? '%' : '';
                            return `<div class="eq-stat-row ${isMalus ? 'malus' : ''}" title="${s.label}">
                                <div class="flex-center-gap">
                                    <span class="material-symbols-outlined text-sm" style="color:${isMalus ? '#ef4444' : s.color};">${s.icon}</span>
                                    ${s.label}
                                </div>
                                <span class="font-bold">${sign}${val}${suffix}</span>
                            </div>`;
                        }).join('');

                    let eqSpecialEffectHtml = '';
                    if (eq.specialEffect && eq.specialEffect !== 'NONE') {
                        const label = window.EFFECT_LABELS[eq.specialEffect] || eq.specialEffect;
                        const isCursed = eq.specialEffect.startsWith('CURSED_');
                        const icon = isCursed ? 'skull' : 'auto_awesome';
                        const color = isCursed ? '#9b2d2d' : '#c084fc';
                        const bg = isCursed ? 'rgba(156, 163, 175, 0.15)' : 'rgba(168, 85, 247, 0.1)';
                        const infoIcon = window.getEffectInfoIconHtml ? window.getEffectInfoIconHtml(eq.specialEffect) : '';
                        eqSpecialEffectHtml = `<div class="eq-stat-row ${isCursed ? 'border-cursed' : ''}" style="background: ${bg}; color: ${color}; gap: 0.5rem;">
                            <div class="flex-center-gap">
                                <span class="material-symbols-outlined text-sm">${icon}</span>
                                <span>${label} <span class="font-bold">${eq.specialEffectValue}</span></span>
                            </div>
                            ${infoIcon}
                        </div>`;
                    }

                    const rarityName = getRarityName(eq.rarity);
                    const rarityClass = rarityName ? `rarity-${rarityName}` : '';
                    let effectStar = '';
                    if (eq.specialEffect && eq.specialEffect !== 'NONE') {
                        effectStar = `<span class="material-symbols-outlined text-xs text-purple ml-1">auto_awesome</span>`;
                    }
                    return `<span class="char-equip-chip ${rarityClass}" onmouseenter="showGlobalTooltip(this)" onmouseleave="hideGlobalTooltip()" style="cursor: pointer;">
                        <span class="material-symbols-outlined ${slotInfo.extraClass || ''} text-sm" style="color: ${slotInfo.color};">${slotInfo.icon}</span>
                        ${eq.name}${effectStar}
                        <template class="tooltip-data">
                            <div class="${rarityClass} font-bold mb-1 text-base">${eq.name}</div>
                            <div class="eq-stats-container mt-2">
                                ${eqStatsHtml || '<div class="text-muted text-sm font-italic">Aucun bonus</div>'}
                                ${eqSpecialEffectHtml}
                            </div>
                        </template>
                    </span>`;
                }).join('') + `</div>`;
            }
            equipHtml += `</div>`;
        }

        return `
            <div class="char-card">
                <div class="char-card-header">
                    <div class="char-card-name">
                        <span class="material-symbols-outlined">person</span>
                        ${p.name}
                        ${window.isAdmin ? `<span class="text-xxs whitespace-nowrap" style="margin-left: 0.5rem; padding: 0.15rem 0.4rem; background: ${p.ownerUsername === window.currentUser?.username ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.1)'}; color: ${p.ownerUsername === window.currentUser?.username ? '#34d399' : '#cbd5e1'}; border-radius: 4px; border: 1px solid ${p.ownerUsername === window.currentUser?.username ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255, 255, 255, 0.1)'};"><span class="material-symbols-outlined align-middle text-xxs mr-1">account_circle</span>${p.ownerUsername}</span>` : ''}
                    </div>
                    <div class="char-card-actions">
                        <button class="char-btn-equip" onclick="openEquipModal(${p.id})" title="Gérer l'équipement">
                            <span class="material-symbols-outlined text-md">shield</span> Équiper
                        </button>
                        <button class="char-btn-spec" onclick="openSpecModal(${p.id})" title="Profil de voie & spécificités">
                            <span class="material-symbols-outlined text-md">hub</span> Profil
                        </button>
                        ${window.isAdmin ? `
                        <button class="char-btn-edit" onclick="editPersonnage(${p.id})" title="Éditer">
                            <span class="material-symbols-outlined text-md">edit</span> Éditer
                        </button>
                        ` : ''}
                        <button class="char-btn-delete" onclick="deletePersonnage(${p.id})" title="Supprimer">
                            <span class="material-symbols-outlined text-md">delete</span>
                        </button>
                    </div>
                </div>
                <div class="char-card-badges">${badges}</div>
                ${equipHtml}
                <div class="char-card-stats">
                    <span class="char-stat-chip"><span class="material-symbols-outlined text-pink">favorite</span>${p.totalHealthMax || p.healthMax} PV</span>
                    <span class="char-stat-chip"><span class="material-symbols-outlined text-info">water_drop</span>${p.totalManaMax || p.manaMax} Mana</span>
                    <span class="char-stat-chip"><span class="material-symbols-outlined text-purple">auto_awesome</span>${p.totalPower !== undefined ? p.totalPower : p.power} Pui</span>
                    <span class="char-stat-chip"><span class="material-symbols-outlined text-rose-500">fitness_center</span>${p.totalStrength !== undefined ? p.totalStrength : p.strength} For</span>
                    <span class="char-stat-chip"><span class="material-symbols-outlined text-blue">shield</span>${p.totalArmor !== undefined ? p.totalArmor : p.armor} Arm</span>
                    <span class="char-stat-chip"><span class="material-symbols-outlined text-success">shield</span>${p.totalResistance !== undefined ? p.totalResistance : p.resistance} Rés</span>
                    ${(p.totalSpeed !== undefined ? p.totalSpeed : p.speed) > 0 ? `<span class="char-stat-chip"><span class="material-symbols-outlined text-warning">bolt</span>${p.totalSpeed !== undefined ? p.totalSpeed : p.speed} Vit</span>` : ''}
                    ${(p.totalCrit !== undefined ? p.totalCrit : p.crit) > 0 ? `<span class="char-stat-chip"><span class="material-symbols-outlined text-red-500">gps_fixed</span>${p.totalCrit !== undefined ? p.totalCrit : p.crit}% Crit</span>` : ''}
                    ${(p.totalRegenHp !== undefined ? p.totalRegenHp : p.regenHp || 0) > 0 ? `<span class="char-stat-chip"><span class="material-symbols-outlined text-pink">healing</span>${p.totalRegenHp !== undefined ? p.totalRegenHp : p.regenHp} Régen PV</span>` : ''}
                    ${(p.totalRegenMana !== undefined ? p.totalRegenMana : p.regenMana || 0) > 0 ? `<span class="char-stat-chip"><span class="material-symbols-outlined text-cyan-400">dew_point</span>${p.totalRegenMana !== undefined ? p.totalRegenMana : p.regenMana} Régen Mana</span>` : ''}
                </div>
                <div class="char-xp-container">
                    <div class="char-xp-header">
                        <span>Expérience Voie</span>
                        <span>${p.experience} / ${p.nextLevelXp} XP</span>
                    </div>
                    <div class="char-xp-bar-bg">
                        <div class="char-xp-bar-fill-voie" style="width: ${p.nextLevelXp > p.currentLevelXp ? Math.min(100, Math.max(0, ((p.experience - p.currentLevelXp) / (p.nextLevelXp - p.currentLevelXp)) * 100)) : 100}%;"></div>
                    </div>
                    
                    <div class="char-xp-header mt-1">
                        <span>Expérience Spirituelle</span>
                        <span>${p.spiritualiteExperience} / ${p.nextLevelSpiritXp} XP</span>
                    </div>
                    <div class="char-xp-bar-bg">
                        <div class="char-xp-bar-fill-spirit" style="width: ${p.nextLevelSpiritXp > p.currentLevelSpiritXp ? Math.min(100, Math.max(0, ((p.spiritualiteExperience - p.currentLevelSpiritXp) / (p.nextLevelSpiritXp - p.currentLevelSpiritXp)) * 100)) : 100}%;"></div>
                    </div>
                </div>
            </div>`;
    }).join('');
}

function getVoieAvatarName(voie) {
    if (!voie) return null;
    const raw = typeof voie === 'string' ? voie : (voie.nom || voie.name || '');
    if (!raw) return null;
    const vNom = raw.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (vNom.includes('consolidation')) return 'consolidation';
    if (vNom.includes('conviction')) return 'conviction';
    if (vNom.includes('creation')) return 'creation';
    if (vNom.includes('destruction')) return 'destruction';
    if (vNom.includes('raison')) return 'raison';
    if (vNom.includes('surete')) return 'surete';
    if (vNom.includes('trahison')) return 'trahison';
    if (vNom.includes('violence')) return 'violence';
    return null;
}

// ===== Equipment Modal =====

async function openEquipModal(persoId) {
    pageState.equipModalPersoId = persoId;
    await Promise.all([loadAllEquipments(), loadPersonnages()]);
    initArmoryTutorial();
    const overlay = document.getElementById('equipModalOverlay');
    setTimeout(() => {
        if (window.GrimoireTutorial && window.GrimoireTutorial.isActive() && window.GrimoireTutorial.getCurrentStep()?.name === 'EQUIP_CLICK_BTN') {
            window.GrimoireTutorial.goToStepByName('EQUIP_SELECT_ITEM');
            setTimeout(() => window.GrimoireTutorial.reposition(), 220);
        }
    }, 60);
    overlay.classList.add('active');
    renderEquipModal();
}

function closeEquipModal() {
    if (window.GrimoireTutorial && window.GrimoireTutorial.isActive() && window.GrimoireTutorial.getCurrentStep()?.name === 'EQUIP_SELECT_ITEM') {
        return;
    }
    pageState.equipModalPersoId = null;
    document.getElementById('equipModalOverlay').classList.remove('active');
    const avatarEl = document.getElementById('equipModalAvatar');
    if (avatarEl) {
        avatarEl.innerHTML = '<span class="material-symbols-outlined text-warning">shield</span>';
        avatarEl.classList.remove('has-avatar');
    }
    const affilEl = document.getElementById('equipModalAffiliations');
    if (affilEl) {
        affilEl.innerHTML = '';
    }
}

function renderEquipModal() {
    const perso = pageState.personnages.find(p => p.id === pageState.equipModalPersoId);
    if (!perso) return;

    document.getElementById('equipModalTitle').textContent = `Équipement de ${perso.name}`;

    const avatarEl = document.getElementById('equipModalAvatar');
    if (avatarEl) {
        const avatarName = getVoieAvatarName(perso.voie);
        if (avatarName) {
            avatarEl.innerHTML = `<img src="/images/avatar/${avatarName}.png" alt="${avatarName}" class="equip-modal-avatar-img">`;
            avatarEl.classList.add('has-avatar');
        } else {
            avatarEl.innerHTML = '<span class="material-symbols-outlined text-warning">shield</span>';
            avatarEl.classList.remove('has-avatar');
        }
    }

    const affilEl = document.getElementById('equipModalAffiliations');
    if (affilEl) {
        affilEl.innerHTML = buildCharBadgesHtml(perso);
    }

    // Render slots
    const slotsContainer = document.getElementById('equipSlotsContainer');
    const slots = Object.keys(window.SLOT_LABELS).filter(s => s !== 'CONSOMMABLE' && s !== 'ANOMALIE' && s !== 'ARME_DEUX_MAINS' && s !== 'ARME' && s !== 'ANNEAU');
    const equippedItems = pageState.allEquipments.filter(e => e.personnage && e.personnage.id === perso.id);

    slotsContainer.innerHTML = slots.map(slotKey => {
        const slotInfo = window.SLOT_LABELS[slotKey];
        let equipped = equippedItems.find(e => e.slot === slotKey);
        const twoHanded = equippedItems.find(e => e.slot === 'ARME_DEUX_MAINS');

        if (slotKey === 'ARME_GAUCHE' && twoHanded) {
            equipped = twoHanded;
        }

        if (slotKey === 'ARME_DROITE' && twoHanded) {
            equipped = twoHanded;
        }

        if (equipped) {
            const statsChips = STAT_DEFS
                .filter(s => equipped[s.key] && equipped[s.key] !== 0)
                .map(s => {
                    const val = equipped[s.key];
                    const sign = val > 0 ? '+' : '';
                    const isMalus = val < 0;
                    const suffix = s.isPercent ? '%' : '';
                    return `<span class="eq-stat-mini ${isMalus ? 'malus' : ''}" title="${s.label}"><span class="material-symbols-outlined text-xs" style="color:${isMalus ? '#ef4444' : s.color};">${s.icon}</span>${sign}${val}${suffix}</span>`;
                })
                .join('');
            const rarityName = getRarityName(equipped.rarity);
            const rarityClass = rarityName ? `rarity-${rarityName}` : '';

            let specialEffectHtml = '';
            if (equipped.specialEffect && equipped.specialEffect !== 'NONE') {
                const label = window.EFFECT_LABELS[equipped.specialEffect] || equipped.specialEffect;
                const isCursed = equipped.specialEffect.startsWith('CURSED_');
                const icon = isCursed ? 'skull' : 'auto_awesome';
                const color = isCursed ? '#9b2d2d' : '#c084fc';
                const bg = isCursed ? 'rgba(156, 163, 175, 0.15)' : 'rgba(168, 85, 247, 0.1)';

                specialEffectHtml = `<div style="margin-top: 0.3rem; font-size: 0.7rem; color: ${color}; background: ${bg}; padding: 0.1rem 0.4rem; border-radius: 4px; display: inline-flex; align-items: center; gap: 0.2rem; border: ${isCursed ? '1px solid rgba(156, 163, 175, 0.2)' : 'none'};">
                    <span class="material-symbols-outlined text-xs">${icon}</span>
                    ${label} : ${equipped.specialEffectValue} ${window.getEffectInfoIconHtml ? window.getEffectInfoIconHtml(equipped.specialEffect) : ''}
                </div>`;
            }

            return `
                <div class="equip-slot-card equipped" data-slot="${slotKey}">
                    <div class="equip-slot-header">
                        <span class="equip-slot-label">
                            <span class="material-symbols-outlined text-lg ${slotInfo.extraClass || ''}" style="color: ${slotInfo.color};">${slotInfo.icon}</span>
                            ${slotInfo.label}
                        </span>
                        <button class="eq-unequip-btn" onclick="unequipItem(${equipped.id})" title="Retirer">
                            <span class="material-symbols-outlined text-sm">close</span>
                        </button>
                    </div>
                    <div class="equip-slot-item-name ${rarityClass}">${equipped.name}</div>
                    <div class="equip-slot-stats">
                        ${statsChips || '<span class="opacity-40">Aucun bonus</span>'}
                        ${specialEffectHtml}
                    </div>
                </div>`;
        } else {
            // Available items for this slot
            let available = pageState.allEquipments.filter(e => e.slot === slotKey && !e.personnage);

            // Special case for weapons: allow ARME_DEUX_MAINS in both weapon slots
            if (slotKey === 'ARME_GAUCHE' || slotKey === 'ARME_DROITE') {
                available = pageState.allEquipments.filter(e =>
                    (e.slot === slotKey || e.slot === 'ARME_DEUX_MAINS') && !e.personnage
                );
            }

            // Special case for rings: allow any ring in any ring slot
            if (slotKey === 'ANNEAU_GAUCHE' || slotKey === 'ANNEAU_DROIT') {
                available = pageState.allEquipments.filter(e =>
                    (e.slot === 'ANNEAU' || e.slot === 'ANNEAU_GAUCHE' || e.slot === 'ANNEAU_DROIT') && !e.personnage
                );
            }

            // Sort by rarity (descending) then by name
            const rarityOrder = {
                'COMMUN': 0,
                'INHABITUEL': 1,
                'RARE': 2,
                'MYTHIQUE': 3,
                'LEGENDAIRE': 4,
                'EPIQUE': 5,
                'RELIQUE': 6,
                'MAUDIT': 99
            };
            available.sort((a, b) => {
                const rA = a.rarity ? rarityOrder[getRarityName(a.rarity)] || 0 : 0;
                const rB = b.rarity ? rarityOrder[getRarityName(b.rarity)] || 0 : 0;
                if (rA !== rB) return rB - rA;
                return a.name.localeCompare(b.name);
            });

            // Filter out duplicates by name and rarity so they don't flood the list
            const uniqueAvailable = [];
            const seen = new Set();
            for (const item of available) {
                const rName = item.rarity ? (getRarityName(item.rarity)) : '';
                const key = item.name + '_' + rName;
                if (!seen.has(key)) {
                    seen.add(key);
                    uniqueAvailable.push(item);
                }
            }
            available = uniqueAvailable;

            let availableHtml = '';
            if (available.length > 0) {
                availableHtml = `
                <div class="custom-select-wrapper mt-2" tabindex="0">
                    <div class="custom-select-trigger text-xs px-3 py-2 border border-white/10 bg-black/20">
                        <span class="cs-label text-muted">Choisir un équipement...</span>
                        <span class="material-symbols-outlined cs-arrow text-muted text-lg">expand_more</span>
                    </div>
                    <div class="custom-select-options">
                        <div class="custom-option" data-value=""><span class="text-muted">Choisir...</span></div>
                        ${available.map(a => {
                    const aStatsChips = STAT_DEFS
                        .filter(s => a[s.key] && a[s.key] !== 0)
                        .map(s => {
                            const val = a[s.key];
                            const sign = val > 0 ? '+' : '';
                            const isMalus = val < 0;
                            const suffix = s.isPercent ? '%' : '';
                            return `<span class="eq-stat-mini ${isMalus ? 'malus' : ''}" title="${s.label}"><span class="material-symbols-outlined text-xs" style="color:${isMalus ? '#ef4444' : s.color};">${s.icon}</span>${sign}${val}${suffix}</span>`;
                        }).join('');

                    let aSpecialEffectHtml = '';
                    if (a.specialEffect && a.specialEffect !== 'NONE') {
                        const label = window.EFFECT_LABELS[a.specialEffect] || a.specialEffect;
                        const isCursed = a.specialEffect.startsWith('CURSED_');
                        const icon = isCursed ? 'skull' : 'auto_awesome';
                        const color = isCursed ? '#9b2d2d' : '#c084fc';
                        const bg = isCursed ? 'rgba(156, 163, 175, 0.15)' : 'rgba(168, 85, 247, 0.1)';

                        aSpecialEffectHtml = `<div style="margin-top: 0.3rem; font-size: 0.7rem; color: ${color}; background: ${bg}; padding: 0.1rem 0.4rem; border-radius: 4px; display: inline-flex; align-items: center; gap: 0.2rem; border: ${isCursed ? '1px solid rgba(156, 163, 175, 0.2)' : 'none'};">
                                    <span class="material-symbols-outlined text-xs">${icon}</span>
                                    ${label} : ${a.specialEffectValue} ${window.getEffectInfoIconHtml ? window.getEffectInfoIconHtml(a.specialEffect) : ''}
                                </div>`;
                    }

                    const aRarityName = getRarityName(a.rarity);
                    const aRarityLabel = typeof a.rarity === 'object' ? a.rarity?.label : a.rarity;

                    const tooltipHtml = `
                                <div class="tooltip-data hidden">
                                    <div class="${aRarityName ? 'rarity-' + aRarityName : ''} font-bold mb-1 text-base">${a.name} ${aRarityLabel ? '(' + aRarityLabel + ')' : ''}</div>
                                    <div class="equip-slot-stats flex-wrap">
                                        ${aStatsChips || '<span class="opacity-40">Aucun bonus</span>'}
                                        ${aSpecialEffectHtml}
                                    </div>
                                </div>
                            `;

                    return `
                                <div class="custom-option" data-value="${a.id}" onmouseenter="showGlobalTooltip(this)" onmouseleave="hideGlobalTooltip()">
                                    <span class="${aRarityName ? 'rarity-' + aRarityName : ''}">${a.name}</span>
                                    ${aRarityLabel ? '<span class="opacity-50 text-xxs ml-1">(' + aRarityLabel + ')</span>' : ''}
                                    ${(a.slot?.name || a.slot) === 'ARME_DEUX_MAINS' ? '<span class="font-bold text-error text-xxs ml-1">[2 Mains]</span>' : ''}
                                    ${tooltipHtml}
                                </div>
                            `;
                }).join('')}
                    </div>
                    <input type="hidden" class="eq-assign-hidden" data-perso-id="${perso.id}" data-slot="${slotKey}" value="">
                </div>`;
            } else {
                availableHtml = `<span class="font-italic text-xs text-slate-600">Aucun disponible</span>`;
            }

            return `
                <div class="equip-slot-card empty" data-slot="${slotKey}">
                    <div class="equip-slot-header">
                        <span class="equip-slot-label">
                            <span class="material-symbols-outlined ${slotInfo.extraClass || ''} opacity-50 text-lg" style="color: ${slotInfo.color};">${slotInfo.icon}</span>
                            ${slotInfo.label}
                        </span>
                    </div>
                    <div class="equip-slot-empty">Vide</div>
                    ${availableHtml}
                </div>`;
        }
    }).join('');
}

function updateTavernePassivesPreview() {
    const previewEl = document.getElementById('tavernePassivesPreview');
    if (!previewEl) return;

    const vId = document.getElementById('charVoie')?.value;
    const sId = document.getElementById('charSpirit')?.value;
    const v = vId ? pageState.voies.find(x => String(x.id) === String(vId)) : null;
    const s = sId ? pageState.spiritualites.find(x => String(x.id) === String(sId)) : null;

    if (!v && !s) {
        previewEl.innerHTML = `
            <div class="taverne-passive-empty">
                <span class="material-symbols-outlined">auto_stories</span>
                <span>Les passifs de votre Voie et de votre Spiritualité s'afficheront ici.</span>
            </div>
        `;
        return;
    }

    const richFormatter = typeof formatRichText === 'function' ? formatRichText : (t => t || '');
    let html = '';
    if (v) {
        const vInfo = getVoieInfo(v.nom);
        const passiveText = richFormatter(v.passiveDescription || v.description || 'Passif de voie.');
        html += `
            <div class="taverne-passive-card ${vInfo.nodeClass}">
                <div class="taverne-passive-header">
                    <span class="material-symbols-outlined">${vInfo.icon}</span>
                    <span>${v.nom}</span>
                </div>
                <div class="taverne-passive-body">${passiveText}</div>
            </div>
        `;
    }
    if (s) {
        const sInfo = getSpiritInfo(s.nom);
        const passiveText = richFormatter(s.passiveDescription || s.description || 'Passif spirituel.');
        html += `
            <div class="taverne-passive-card ${sInfo.cardClass}">
                <div class="taverne-passive-header ${sInfo.textClass}">
                    <span class="material-symbols-outlined">${sInfo.icon}</span>
                    <span>${s.nom}</span>
                </div>
                <div class="taverne-passive-body">${passiveText}</div>
            </div>
        `;
    }
    previewEl.innerHTML = html;
}

function editPersonnage(id) {
    pageState.editingId = id;
    const p = pageState.personnages.find(x => x.id === id);
    if (!p) return;

    if (pageState.taverneCollapsed) {
        pageState.taverneCollapsed = false;
        applyArmoryLayoutState();
    }

    document.getElementById('charFormPanel').classList.add('editing-mode');

    document.getElementById('charName').value = p.name;
    document.getElementById('charHp').value = p.healthMax || 100;
    document.getElementById('charMana').value = p.manaMax || 100;
    document.getElementById('charPower').value = p.power || 0;
    document.getElementById('charStrength').value = p.strength || 0;
    document.getElementById('charArmor').value = p.armor || 0;
    document.getElementById('charResistance').value = p.resistance || 0;
    document.getElementById('charSpeed').value = p.speed || 0;
    document.getElementById('charCrit').value = p.crit || 0;
    document.getElementById('charRegenHp').value = p.regenHp || 0;
    document.getElementById('charRegenMana').value = p.regenMana || 0;
    syncVoieWheelSelection(p.voie ? p.voie.id : '', true);

    document.getElementById('charExperience').value = p.experience || 0;

    syncSpiritRadioSelection(p.spiritualite ? p.spiritualite.id : '', true);

    document.getElementById('charSpiritExperience').value = p.spiritualiteExperience || 0;

    document.getElementById('formTitleText').innerHTML = `
        <span class="material-symbols-outlined">edit</span>
        Modifier : ${p.name}`;
    document.getElementById('submitBtn').innerHTML = `
        <span class="material-symbols-outlined text-lg">save</span>
        Mettre à jour`;
    document.getElementById('cancelBtn').classList.remove('hidden');
    document.getElementById('cancelBtn').classList.add('inline-flex');

    updateSubmitButtonState();
    applyVoieBaseStats(p.voie ? p.voie.nom : null);
    updateTavernePassivesPreview();
    if (window.updateArmoryVoieSpider) {
        window.updateArmoryVoieSpider(p.voie ? p.voie.id : null, p.spiritualite ? p.spiritualite.id : null);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function resetForm() {
    pageState.editingId = null;
    document.getElementById('charFormPanel').classList.remove('editing-mode');
    document.getElementById('charName').value = '';
    document.getElementById('charHp').value = 100;
    document.getElementById('charMana').value = 100;
    document.getElementById('charPower').value = 10;
    document.getElementById('charStrength').value = 10;
    document.getElementById('charArmor').value = 5;
    document.getElementById('charResistance').value = 5;
    document.getElementById('charSpeed').value = 1;
    document.getElementById('charCrit').value = 5;
    document.getElementById('charRegenHp').value = 2;
    document.getElementById('charRegenMana').value = 4;
    syncVoieWheelSelection('', false);

    document.getElementById('charExperience').value = 0;

    syncSpiritRadioSelection('', false);

    document.getElementById('charSpiritExperience').value = 0;

    document.getElementById('formTitleText').innerHTML = `
        <span class="material-symbols-outlined">sports_bar</span>
        Taverne — Recrutement`;
    document.getElementById('submitBtn').innerHTML = `
        <span class="material-symbols-outlined text-lg">person_add</span>
        Forger le Personnage`;
    document.getElementById('cancelBtn').classList.add('hidden');
    document.getElementById('cancelBtn').classList.remove('inline-flex');
    const cvIcon = document.getElementById('charVoieInfoIcon');
    if (cvIcon) cvIcon.classList.add('hidden');
    const csIcon = document.getElementById('charSpiritInfoIcon');
    if (csIcon) csIcon.classList.add('hidden');
    const svIcon = document.getElementById('spiderVoieInfoIcon');
    if (svIcon) svIcon.classList.add('hidden');
    const ssIcon = document.getElementById('spiderSpiritInfoIcon');
    if (ssIcon) ssIcon.classList.add('hidden');
    applyVoieBaseStats(null);
    updateTavernePassivesPreview();
    if (window.updateArmoryVoieSpider) {
        window.updateArmoryVoieSpider(null, null, false);
    }
    if (window.updateArmorySpiritSpider) {
        window.updateArmorySpiritSpider(null);
    }
    updateSubmitButtonState();
}

// showNotif, showModal → utils.js

// ===== Custom Select Logic (Event Delegation) =====
// The global custom select event listener is handled by window.initGlobalCustomSelect() in ui.js

document.addEventListener('change', (e) => {
    if (e.target.id === 'searchVoie' || e.target.id === 'searchSpirit') {
        filterPersonnages();
    }
    if (e.target.classList && e.target.classList.contains('eq-assign-hidden')) {
        if (e.target.value) {
            equipItem(e.target.value, e.target.dataset.persoId, e.target.dataset.slot);
        }
    }
});

// ===== Init =====

function applyVoieBaseStats(voieNom) {
    function buildStatHtml(label, valStr, icon, iconColorClass) {
        const val = parseInt(valStr.replace('+', ''));
        const isPos = val > 0;
        const stateClass = isPos ? 'is-bonus' : 'is-malus';
        return `
            <div class="voie-mod-pill ${stateClass}">
                <div class="voie-mod-pill-label">
                    <span class="material-symbols-outlined ${iconColorClass}">${icon}</span>
                    <span>${label}</span>
                </div>
                <span class="voie-mod-pill-val">${valStr}</span>
            </div>
        `;
    }

    let diffHtml = `
        <div class="armory-mods-empty">
            <span class="material-symbols-outlined">tune</span>
            <span>Sélectionnez une voie pour voir ses bonus et malus de départ.</span>
        </div>
    `;
    // Statistiques par défaut
    let stats = {
        charHp: 100, charMana: 100, charPower: 10, charStrength: 10,
        charArmor: 5, charResistance: 5, charSpeed: 1, charCrit: 5,
        charRegenHp: 2, charRegenMana: 4
    };

    if (voieNom) {
        let pillsHtml = "";
        if (voieNom.includes('Raison')) {
            stats.charCrit = 0; stats.charMana = 120; stats.charHp = 120;
            pillsHtml += buildStatHtml('PV', '+20', 'favorite', 'text-pink');
            pillsHtml += buildStatHtml('Mana', '+20', 'water_drop', 'text-info');
            pillsHtml += buildStatHtml('Critique', '-5', 'gps_fixed', 'text-danger');
        } else if (voieNom.includes('Sûreté') || voieNom.includes('Surete')) {
            stats.charMana = 130; stats.charResistance = 8; stats.charRegenMana = 6;
            pillsHtml += buildStatHtml('Mana', '+30', 'water_drop', 'text-info');
            pillsHtml += buildStatHtml('Résistance', '+3', 'shield', 'text-success');
            pillsHtml += buildStatHtml('Régen Mana', '+2', 'cyclone', 'text-info');
        } else if (voieNom.includes('Trahison')) {
            stats.charHp = 90; stats.charStrength = 12; stats.charSpeed = 2;
            pillsHtml += buildStatHtml('PV', '-10', 'favorite', 'text-pink');
            pillsHtml += buildStatHtml('Force', '+2', 'fitness_center', 'text-rose-500');
            pillsHtml += buildStatHtml('Vitesse', '+1', 'bolt', 'text-warning');
        } else if (voieNom.includes('Consolidation')) {
            stats.charArmor = 8; stats.charResistance = 8; stats.charRegenHp = 3;
            pillsHtml += buildStatHtml('Armure', '+3', 'shield', 'text-blue');
            pillsHtml += buildStatHtml('Résistance', '+3', 'shield', 'text-success');
            pillsHtml += buildStatHtml('Régen PV', '+1', 'healing', 'text-success');
        } else if (voieNom.includes('Conviction')) {
            stats.charRegenMana = 25; stats.charHp = 90; stats.charPower = 11;
            pillsHtml += buildStatHtml('PV', '-10', 'favorite', 'text-pink');
            pillsHtml += buildStatHtml('Puissance', '+1', 'auto_awesome', 'text-purple');
            pillsHtml += buildStatHtml('Régen Mana', '+21', 'cyclone', 'text-info');
        } else if (voieNom.includes('Création') || voieNom.includes('Creation')) {
            stats.charHp = 120; stats.charArmor = 8;
            pillsHtml += buildStatHtml('PV', '+20', 'favorite', 'text-pink');
            pillsHtml += buildStatHtml('Armure', '+3', 'shield', 'text-blue');
        } else if (voieNom.includes('Destruction')) {
            stats.charPower = 12; stats.charArmor = 0; stats.charStrength = 8; stats.charRegenMana = 5; stats.charMana = 110;
            pillsHtml += buildStatHtml('Mana', '+10', 'water_drop', 'text-info');
            pillsHtml += buildStatHtml('Puissance', '+2', 'auto_awesome', 'text-purple');
            pillsHtml += buildStatHtml('Force', '-2', 'fitness_center', 'text-rose-500');
            pillsHtml += buildStatHtml('Armure', '-5', 'shield', 'text-blue');
            pillsHtml += buildStatHtml('Régen Mana', '+1', 'cyclone', 'text-info');
        } else if (voieNom.includes('Violence')) {
            stats.charSpeed = 2; stats.charCrit = 7; stats.charRegenHp = 0; stats.charPower = 11; stats.charStrength = 11;
            pillsHtml += buildStatHtml('Puissance', '+1', 'auto_awesome', 'text-purple');
            pillsHtml += buildStatHtml('Force', '+1', 'fitness_center', 'text-rose-500');
            pillsHtml += buildStatHtml('Vitesse', '+1', 'bolt', 'text-warning');
            pillsHtml += buildStatHtml('Critique', '+2', 'gps_fixed', 'text-danger');
            pillsHtml += buildStatHtml('Régen PV', '-2', 'healing', 'text-success');
        }
        if (pillsHtml) {
            diffHtml = `<div class="voie-mods-grid">${pillsHtml}</div>`;
        }
    }

    const diffEl = document.getElementById('voieStatsDiff');
    if (diffEl) diffEl.innerHTML = diffHtml;

    if (pageState.editingId) return; // Ne pas écraser les stats en mode édition

    // Mise à jour des champs
    for (const [key, value] of Object.entries(stats)) {
        const el = document.getElementById(key);
        if (el) el.value = value;
    }
}

function handleVoieSelectionChange(vId) {
    const iconEl = document.getElementById('charVoieInfoIcon');
    const spiderIconEl = document.getElementById('spiderVoieInfoIcon');
    const currentSpirit = document.getElementById('charSpirit')?.value;
    const richFormatter = typeof formatRichText === 'function' ? formatRichText : (t => t || '');

    if (!vId) {
        if (iconEl) iconEl.classList.add('hidden');
        if (spiderIconEl) spiderIconEl.classList.add('hidden');
        applyVoieBaseStats(null);
        updateTavernePassivesPreview();
        if (window.updateArmoryVoieSpider) window.updateArmoryVoieSpider(null, currentSpirit || null, true);
        return;
    }
    const v = pageState.voies.find(x => String(x.id) === String(vId));
    if (v) {
        const info = getVoieInfo(v.nom);
        const tooltipHtml = `
            <div class="text-sm font-medium mb-2 flex-center gap-1" style="color: ${info.color};">
                <span class="material-symbols-outlined text-lg">${info.icon}</span>
                ${v.nom}
            </div>
            <div class="text-xs text-slate-300 mb-2">${v.description || 'Description générique.'}</div>
            <div class="flex-start-gap text-xs text-slate-200">
                <span class="material-symbols-outlined text-md" style="color: ${info.color};">bolt</span>
                <span class="font-italic whitespace-pre-wrap">${richFormatter(v.passiveDescription) || 'Passif spécifique.'}</span>
            </div>
        `;
        if (iconEl) {
            const template = iconEl.querySelector('.tooltip-data');
            if (template) template.innerHTML = tooltipHtml;
            iconEl.classList.remove('hidden', 'is-hidden');
        }
        if (spiderIconEl) {
            const spiderTpl = spiderIconEl.querySelector('.tooltip-data');
            if (spiderTpl) spiderTpl.innerHTML = tooltipHtml;
            spiderIconEl.classList.remove('hidden', 'is-hidden');
        }
        applyVoieBaseStats(v.nom);
        updateTavernePassivesPreview();
        if (window.updateArmoryVoieSpider) window.updateArmoryVoieSpider(vId, currentSpirit || null, true);
    } else {
        if (iconEl) iconEl.classList.add('hidden');
        if (spiderIconEl) spiderIconEl.classList.add('hidden');
        applyVoieBaseStats(null);
        updateTavernePassivesPreview();
        if (window.updateArmoryVoieSpider) window.updateArmoryVoieSpider(null, currentSpirit || null, false);
    }
}

function handleSpiritSelectionChange(sId) {
    const iconEl = document.getElementById('charSpiritInfoIcon');
    const spiderSpiritIconEl = document.getElementById('spiderSpiritInfoIcon');
    const currentVoie = document.getElementById('charVoie')?.value;
    const richFormatter = typeof formatRichText === 'function' ? formatRichText : (t => t || '');

    if (!sId) {
        if (iconEl) iconEl.classList.add('hidden');
        if (spiderSpiritIconEl) spiderSpiritIconEl.classList.add('hidden');
        if (window.updateArmorySpiritSpider) window.updateArmorySpiritSpider(null);
        updateTavernePassivesPreview();
        if (window.updateArmoryVoieSpider) {
            window.updateArmoryVoieSpider(currentVoie || null, null, true);
        }
        return;
    }
    const s = pageState.spiritualites.find(x => String(x.id) === String(sId));
    if (s) {
        const info = getSpiritInfo(s.nom);
        const tooltipHtml = `
            <div class="text-sm font-medium mb-2 flex-center gap-1 ${info.textClass}">
                <span class="material-symbols-outlined text-lg">${info.icon}</span>
                ${s.nom}
            </div>
            <div class="text-xs text-slate-300 mb-2">${s.description || 'Description générique.'}</div>
            <div class="flex-start-gap text-xs text-slate-200">
                <span class="material-symbols-outlined text-md ${info.textClass}">bolt</span>
                <span class="font-italic whitespace-pre-wrap">${richFormatter(s.passiveDescription) || 'Passif spécifique.'}</span>
            </div>
        `;
        if (iconEl) {
            const template = iconEl.querySelector('.tooltip-data');
            if (template) template.innerHTML = tooltipHtml;
            iconEl.classList.remove('hidden', 'is-hidden');
        }
        if (spiderSpiritIconEl) {
            const spiderTpl = spiderSpiritIconEl.querySelector('.tooltip-data');
            if (spiderTpl) spiderTpl.innerHTML = tooltipHtml;
            spiderSpiritIconEl.classList.remove('hidden', 'is-hidden');
        }
        if (window.updateArmorySpiritSpider) window.updateArmorySpiritSpider(s);
    } else {
        if (iconEl) iconEl.classList.add('hidden');
        if (spiderSpiritIconEl) spiderSpiritIconEl.classList.add('hidden');
        if (window.updateArmorySpiritSpider) window.updateArmorySpiritSpider(null);
    }

    updateTavernePassivesPreview();
    if (window.updateArmoryVoieSpider) {
        window.updateArmoryVoieSpider(currentVoie || null, s || sId, true);
    }
}

function bindArmorySelectListeners() {
    const spiritWrapper = document.getElementById('charSpiritWrapper');
    if (spiritWrapper && !spiritWrapper.dataset.boundSpiritRadios) {
        spiritWrapper.dataset.boundSpiritRadios = 'true';
        spiritWrapper.addEventListener('change', (e) => {
            if (e.target && e.target.name === 'charSpiritRadio') {
                syncSpiritRadioSelection(e.target.value, true);
            }
        });
    }
}

async function initArmoryPage() {
    pageState.editingId = null;
    pageState.equipModalPersoId = null;
    pageState.initialLayoutApplied = false;

    const urlParams = new URLSearchParams(window.location.search);
    const openEquipCharId = parseInt(urlParams.get('openEquip'), 10);
    const hasOpenEquip = !isNaN(openEquipCharId);

    if (window.currentUser && typeof window.currentUser.availableCharacterSlots === 'number' && !hasOpenEquip && !window.currentUser.equipTutorialActive) {
        pageState.armoryCollapsed = window.currentUser.availableCharacterSlots > 0;
        pageState.taverneCollapsed = false;
    }
    applyArmoryLayoutState();

    if (window.initGlobalCustomSelect) {
        window.initGlobalCustomSelect();
    }
    bindArmorySelectListeners();

    if (window.initAppMeta) {
        await window.initAppMeta();
    }

    if (typeof window.checkAuthStatus === 'function') {
        await window.checkAuthStatus();
    }

    if (!pageState.initialLayoutApplied && window.currentUser && typeof window.currentUser.availableCharacterSlots === 'number' && !hasOpenEquip && !window.currentUser.equipTutorialActive) {
        pageState.armoryCollapsed = window.currentUser.availableCharacterSlots > 0;
        pageState.taverneCollapsed = false;
        applyArmoryLayoutState();
    }

    applyRbac();

    await Promise.all([fetchMeta(), loadAllEquipments()]);
    await loadPersonnages();

    updateTavernePassivesPreview();
    if (window.updateArmoryVoieSpider) {
        window.updateArmoryVoieSpider(null, null, false);
    }

    if (hasOpenEquip) {
        setTimeout(() => {
            openEquipModal(openEquipCharId);
        }, 100);
    }

    initArmoryTutorial();
}

window.hideEqTooltip = function () {
    const tooltip = document.getElementById('globalSpellTooltip');
    if (tooltip) tooltip.classList.add('hidden');
};

function initArmoryTutorial() {
    if (!window.currentUser) return;
    if (!window.GrimoireTutorial || window.GrimoireTutorial.isActive()) return;
    if (window.currentUser.tutorialCompleted) {
        if (window.currentUser.equipTutorialActive && pageState.personnages.length > 0) {
            window.GrimoireTutorial.startPhase('EQUIP_ARMORY', {
                resolveTarget: (step) => {
                    if (step.name === 'EQUIP_SELECT_ITEM') {
                        const wrapper = document.querySelector('#equipSlotsContainer .equip-slot-card .custom-select-wrapper');
                        if (wrapper) return wrapper.closest('.equip-slot-card') || wrapper;
                        return document.getElementById('equipSlotsContainer');
                    }
                    return document.querySelector(step.targetSelector);
                },
                canPrev: () => false,
                canNext: () => false,
                onStepEnter: (step) => {
                    const closeBtn = document.querySelector('#equipModalOverlay .equip-modal-close');
                    if (closeBtn) {
                        if (step.name === 'EQUIP_SELECT_ITEM') closeBtn.classList.add('is-hidden');
                        else closeBtn.classList.remove('is-hidden');
                    }
                },
                onStop: () => {
                    const closeBtn = document.querySelector('#equipModalOverlay .equip-modal-close');
                    if (closeBtn) closeBtn.classList.remove('is-hidden');
                }
            });
        } else if (window.currentUser.shopTutorialActive) {
            window.GrimoireTutorial.startPhase('SHOP_NAV', {
                canPrev: () => false,
                canNext: () => false
            });
        }
        return;
    }
    if (!window.GrimoireTutorial || window.GrimoireTutorial.isActive()) return;

    const hasNoChars = pageState.personnages.length === 0;
    if (hasNoChars) {
        window.GrimoireTutorial.startPhase('ARMORY', {
            resolveTarget: (step) => {
                if (step.name === 'ARMORY_PROFILE') {
                    const spider = document.getElementById('armorySpiderSection');
                    if (spider && !spider.classList.contains('hidden') && !spider.classList.contains('is-hidden')) return spider;
                    return document.getElementById('charFormPanel') || document.getElementById('formPanel');
                }
                return document.querySelector(step.targetSelector);
            },
            onBeforeNext: (step) => {
                if (step.name === 'ARMORY_NAME') {
                    const nameInput = document.getElementById('charName');
                    if (!nameInput || !nameInput.value.trim()) {
                        showNotif('Donnez un nom à votre héros avant de continuer !', true);
                        if (nameInput) nameInput.focus();
                        return false;
                    }
                } else if (step.name === 'ARMORY_VOIE') {
                    const voieSelect = document.getElementById('charVoie');
                    if (!voieSelect || !voieSelect.value) {
                        showNotif('Choisissez une Voie pour votre héros !', true);
                        if (voieSelect) voieSelect.focus();
                        return false;
                    }
                } else if (step.name === 'ARMORY_SPIRIT') {
                    const spiritSelect = document.getElementById('charSpirit');
                    if (!spiritSelect || !spiritSelect.value) {
                        showNotif('Choisissez une Spiritualité pour votre héros !', true);
                        if (spiritSelect) spiritSelect.focus();
                        return false;
                    }
                }
                return true;
            }
        });
    } else if (window.currentUser.tutorialPhase === 'DUNGEON') {
        window.GrimoireTutorial.startPhase('ARMORY_DONE');
    }
}

window.submitPersonnage = submitPersonnage;
window.resetForm = resetForm;
window.loadPersonnages = loadPersonnages;
window.filterPersonnages = filterPersonnages;
window.openEquipModal = openEquipModal;
window.closeEquipModal = closeEquipModal;
window.editPersonnage = editPersonnage;
window.equipItem = equipItem;
window.unequipItem = unequipItem;
window.deleteEquipment = deleteEquipment;
window.getVoieInfo = getVoieInfo;
window.getSpiritInfo = getSpiritInfo;
window.initArmoryPage = initArmoryPage;




