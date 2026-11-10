import { state } from '../utils/state.js';
import * as ui from '../ui.js?v=2';

export function toggleChannelingFields() {
    const castingTypeSel = document.getElementById('castingTypeSelect');
    const container = document.getElementById('channelingConfig');
    if (!castingTypeSel || !container) return;

    if (castingTypeSel.value === 'CANALISE') {
        container.style.display = 'grid';
    } else {
        container.style.display = 'none';
    }
    renderEffects();
}

export function toggleSpellTargetType() {
    const isMonster = document.getElementById('isMonsterSpell').checked;
    const heroRow = document.getElementById('heroAffinityRow');
    const monsterRow = document.getElementById('monsterAffinityRow');

    if (!isMonster) {
        if (heroRow) heroRow.style.display = 'flex';
        if (monsterRow) monsterRow.style.display = 'none';
        const mutationSelect = document.getElementById('mutationSelect');
        if (mutationSelect && mutationSelect.value !== "") {
            mutationSelect.value = "";
            mutationSelect.dispatchEvent(new Event('change'));
        }
    } else {
        if (heroRow) heroRow.style.display = 'none';
        if (monsterRow) monsterRow.style.display = 'flex';
        const voieSelect = document.getElementById('voieSelect');
        const spiritSelect = document.getElementById('spiritSelect');
        if (voieSelect && voieSelect.value !== "") {
            voieSelect.value = "";
            voieSelect.dispatchEvent(new Event('change'));
        }
        if (spiritSelect && spiritSelect.value !== "") {
            spiritSelect.value = "";
            spiritSelect.dispatchEvent(new Event('change'));
        }
    }
}
window.toggleSpellTargetType = toggleSpellTargetType;

export function handleAffinityChange(source) {
    const voieSelect = document.getElementById('voieSelect');
    const spiritSelect = document.getElementById('spiritSelect');

    if (source === 'voie' && voieSelect.value !== "") {
        if (spiritSelect) spiritSelect.value = "";
    } else if (source === 'spirit' && spiritSelect.value !== "") {
        if (voieSelect) voieSelect.value = "";
    }

    updateRankTitle();
    updateSpecialVoieConfig();
    updateSpecialSpiritConfig();
}

export function updateRankTitle() {
    const display = document.getElementById('rankTitleDisplay');
    if (!display) return;

    const lvl = parseInt(document.getElementById('niveau').value) || 1;
    const spiritId = document.getElementById('spiritSelect').value;
    const voieId = document.getElementById('voieSelect').value;

    let rankName = '';
    let sourceNom = '';

    if (voieId && state.metaData.voies) {
        const v = state.metaData.voies.find(vo => vo.id == voieId);
        if (v && v.rankNames && v.rankNames[lvl]) {
            rankName = v.rankNames[lvl];
            sourceNom = v.nom;
        }
    }
    if (!rankName && spiritId && state.metaData.spiritualites) {
        const sp = state.metaData.spiritualites.find(s => s.id == spiritId);
        if (sp && sp.rankNames && sp.rankNames[lvl]) {
            rankName = sp.rankNames[lvl];
            sourceNom = sp.nom;
        }
    }

    if (rankName) {
        display.classList.remove('init-hidden', 'hidden');
        display.style.display = 'block';
        display.innerHTML = `<span class="material-symbols-outlined text-success align-middle text-lg mr-1">workspace_premium</span>Titre : <span class="text-white">"${rankName}"</span> <span class="text-xs text-muted">(${sourceNom})</span>`;
    } else {
        display.style.display = 'none';
        display.innerHTML = '';
    }
}

export function updateSpecialVoieConfig() {
    const voieId = document.getElementById('voieSelect').value;
    let isDestruction = false;
    let isViolence = false;
    let isCreation = false;
    if (voieId && state.metaData.voies) {
        const v = state.metaData.voies.find(vo => vo.id == voieId);
        if (v && v.nom) {
            const lNom = v.nom.toLowerCase();
            if (lNom.includes('destruction')) {
                isDestruction = true;
            }
            if (lNom.includes('violence')) {
                isViolence = true;
            }
            if (lNom.includes('création') || lNom.includes('creation')) {
                isCreation = true;
            }
        }
    }

    const heatButtons = document.getElementById('heatEffectButtons');
    if (heatButtons) {
        heatButtons.style.display = isDestruction ? 'grid' : 'none';
    }

    const heatCostCard = document.getElementById('heatCostCard');
    if (heatCostCard) {
        heatCostCard.style.display = isDestruction ? 'flex' : 'none';
        if (!isDestruction) {
            document.getElementById('heatCost').value = 0;
            document.getElementById('percentHeatCost').value = 0;
        }
    }

    const seedCostCard = document.getElementById('seedCostCard');
    if (seedCostCard) {
        seedCostCard.style.display = isCreation ? 'flex' : 'none';
        if (!isCreation) {
            document.getElementById('seedCost').value = 0;
        }
    }

    const heatTypes = ['HEAT_FIXED', 'HEAT_PERCENTAGE', 'HEAT_OVER_TIME'];
    if (!isDestruction) {
        const hasHeat = state.currentEffects.some(e => heatTypes.includes(e.effectType));
        if (hasHeat) {
            state.currentEffects = state.currentEffects.filter(e => !heatTypes.includes(e.effectType));
            renderEffects();
        }
    }

    const budButton = document.getElementById('budEffectButton');
    if (budButton) {
        budButton.style.display = isCreation ? 'grid' : 'none';
    }

    if (!isCreation) {
        const hasBud = state.currentEffects.some(e => e.effectType === 'BUD');
        if (hasBud) {
            state.currentEffects = state.currentEffects.filter(e => e.effectType !== 'BUD');
            renderEffects();
        }
    }

    const violenceConfig = document.getElementById('violenceConfig');
    if (violenceConfig) {
        violenceConfig.style.display = isViolence ? 'flex' : 'none';
        updateViolenceLabel();
    }
}

export function updateSpecialSpiritConfig() {
    const spiritId = document.getElementById('spiritSelect').value;
    let isKarma = false;
    let isTenebres = false;
    if (spiritId && state.metaData.spiritualites) {
        const s = state.metaData.spiritualites.find(sp => sp.id == spiritId);
        if (s && s.nom) {
            if (s.nom.toLowerCase().includes('karma')) {
                isKarma = true;
            }
            if (s.nom.toLowerCase().includes('ténèbre') || s.nom.toLowerCase().includes('tenebre')) {
                isTenebres = true;
            }
        }
    }

    const karmaConfig = document.getElementById('karmaConfig');
    if (karmaConfig) {
        karmaConfig.style.display = isKarma ? 'flex' : 'none';
        updateKarmaLabel();
    }

    const ameDetacheeBtn = document.getElementById('ameDetacheeEffectButton');
    if (ameDetacheeBtn) {
        const hasAmeDetachee = state.currentEffects && state.currentEffects.some(e => e.effectType === 'AME_DETACHEE');
        ameDetacheeBtn.style.display = (isTenebres && !hasAmeDetachee) ? 'grid' : 'none';
    }
}

export function setViolenceType(isInspiration) {
    const input = document.getElementById('isInspiration');
    if (input) {
        input.checked = isInspiration;
        updateViolenceLabel();
    }
}

export function updateViolenceLabel() {
    const input = document.getElementById('isInspiration');
    const isInsp = input ? input.checked : true;

    const btnInsp = document.getElementById('btnInspiration');
    const btnExp = document.getElementById('btnExpiration');

    if (!btnInsp || !btnExp) return;

    if (isInsp) {
        btnInsp.style.background = 'rgba(6, 182, 212, 0.2)';
        btnInsp.style.borderColor = '#06b6d4';
        btnInsp.style.color = '#22d3ee';
        btnInsp.style.boxShadow = '0 0 15px rgba(6, 182, 212, 0.15)';

        btnExp.style.background = 'transparent';
        btnExp.style.borderColor = 'transparent';
        btnExp.style.color = 'var(--text-muted)';
        btnExp.style.boxShadow = 'none';
    } else {
        btnInsp.style.background = 'transparent';
        btnInsp.style.borderColor = 'transparent';
        btnInsp.style.color = 'var(--text-muted)';
        btnInsp.style.boxShadow = 'none';

        btnExp.style.background = 'rgba(249, 115, 22, 0.2)';
        btnExp.style.borderColor = '#f97316';
        btnExp.style.color = '#fb923c';
        btnExp.style.boxShadow = '0 0 15px rgba(249, 115, 22, 0.15)';
    }
}

export function setKarmaAlignment(alignment) {
    const input = document.getElementById('karmaAlignment');
    if (input) {
        if (input.value === alignment) {
            input.value = 'NONE'; // Toggle off
        } else {
            input.value = alignment;
        }
        updateKarmaLabel();
    }
}

export function updateKarmaLabel() {
    const input = document.getElementById('karmaAlignment');
    const alignment = input ? input.value : 'NONE';

    const btnOff = document.getElementById('btnKarmaOffensive');
    const btnRes = document.getElementById('btnKarmaRestorative');
    const btnPro = document.getElementById('btnKarmaProtective');

    if (!btnOff || !btnRes || !btnPro) return;

    const resetBtn = (btn) => {
        btn.style.background = 'transparent';
        btn.style.borderColor = 'transparent';
        btn.style.color = 'var(--text-muted)';
        btn.style.boxShadow = 'none';
    };

    resetBtn(btnOff);
    resetBtn(btnRes);
    resetBtn(btnPro);

    if (alignment === 'OFFENSIVE') {
        btnOff.style.background = 'rgba(139, 92, 246, 0.25)';
        btnOff.style.borderColor = '#8b5cf6';
        btnOff.style.color = '#c4b5fd';
        btnOff.style.boxShadow = '0 0 15px rgba(139, 92, 246, 0.2)';
    } else if (alignment === 'RESTORATIVE') {
        btnRes.style.background = 'rgba(148, 163, 184, 0.25)';
        btnRes.style.borderColor = '#94a3b8';
        btnRes.style.color = '#f1f5f9';
        btnRes.style.boxShadow = '0 0 15px rgba(148, 163, 184, 0.2)';
    } else if (alignment === 'PROTECTIVE') {
        btnPro.style.background = 'rgba(253, 224, 71, 0.25)';
        btnPro.style.borderColor = '#fde047';
        btnPro.style.color = '#fef08a';
        btnPro.style.boxShadow = '0 0 15px rgba(253, 224, 71, 0.2)';
    }
}

export function addEffectPanel(type) {
    let stat = 'ARMURE';
    let actualType = type;
    if (type === 'POISON') { stat = 'POISON'; actualType = 'BUFF_DEBUFF'; }
    if (type === 'BURN') { stat = 'BURN'; actualType = 'BUFF_DEBUFF'; }
    if (type === 'AME_DETACHEE') { stat = 'AME_DETACHEE'; actualType = 'BUFF_DEBUFF'; }

    // Rétrocompatibilité ou conservation du type d'origine pour le visuel si besoin, 
    // mais ici POISON/BURN ont déjà leur propre rendu dans renderEffects.
    // Pour AME_DETACHEE, on peut utiliser son propre type ou le traiter comme BUFF_DEBUFF.
    // On va garder le type d'origine pour l'UI, et laisser le backend gérer ou le mapper.
    // Wait, POISON/BURN are sent as POISON/BURN ? Let's check how they are sent.
    // In grimoire.js, they might be mapped. Let's just use the 'type' directly.
    if (type === 'POISON') stat = 'POISON';
    else if (type === 'BURN') stat = 'BURN';
    else if (type === 'AME_DETACHEE') stat = 'AME_DETACHEE';
    else stat = 'ARMURE';

    if (type === 'AME_DETACHEE' && state.currentEffects.some(e => e.effectType === 'AME_DETACHEE')) {
        if (typeof showNotif !== 'undefined') showNotif("L'effet Âme Détachée ne peut être ajouté qu'une seule fois par sort.", true);
        else ui.showNotif("L'effet Âme Détachée ne peut être ajouté qu'une seule fois par sort.", true);
        return;
    }

    const effectObj = {
        id: Date.now() + Math.random(),
        effectType: type,
        effectTarget: (type.startsWith('HEAT') || type === 'AME_DETACHEE' || type === 'BUD') ? 'CASTER' : 'TARGET',
        damage: 20,
        healAmount: 20,
        manaAmount: 20,
        percentage: 0.10,
        flatValue: type === 'BUD' ? 1 : (type === 'AME_DETACHEE' ? 5 : 5),
        modifier: type === 'AME_DETACHEE' ? 0.30 : 0.20,
        duration: type === 'AME_DETACHEE' ? 3 : 2,
        damageType: 'MAGIC',
        statAffected: stat,
        source: (type === 'BUFF_DEBUFF' || type === 'AME_DETACHEE') ? null : 'TARGET_HEALTH_MAX',
        requiredChoiceKey: null,
        detachedSoulRequirement: 'NOT_AFFECTED',
        channelingTurns: [1]
    };

    if (type === 'AME_DETACHEE') {
        state.currentEffects.unshift(effectObj);
    } else {
        state.currentEffects.push(effectObj);
    }
    renderEffects();
}

export function removeEffect(id) {
    state.currentEffects = state.currentEffects.filter(e => e.id != id);
    renderEffects();
}

export function setEffectTarget(id, target) {
    const effect = state.currentEffects.find(e => e.id == id);
    if (effect) {
        effect.effectTarget = target;
        renderEffects();
    }
}

export function updateEffectProp(id, prop, value) {
    const effect = state.currentEffects.find(e => e.id == id);
    if (effect) {
        if (['damage', 'healAmount', 'manaAmount', 'flatValue', 'duration'].includes(prop)) {
            effect[prop] = parseInt(value) || 0;
        } else if (prop === 'percentage' || prop === 'modifier') {
            effect[prop] = parseFloat(value) || 0;
        } else {
            effect[prop] = value;
        }
        if (prop === 'detachedSoulRequirement') {
            renderEffects();
        }
    }
}

export function toggleEffectChannelingTurn(effectId, turnNum) {
    const effect = state.currentEffects.find(e => e.id == effectId);
    if (effect) {
        if (!effect.channelingTurns) {
            effect.channelingTurns = [];
        }
        const index = effect.channelingTurns.indexOf(turnNum);
        if (index > -1) {
            effect.channelingTurns.splice(index, 1);
        } else {
            effect.channelingTurns.push(turnNum);
        }
        effect.channelingTurns.sort((a, b) => a - b);
        renderEffects();
        updateSpecialSpiritConfig();
    }
}

export function renderEffects() {
    const container = document.getElementById('effectsList');
    if (!container) return;
    container.innerHTML = '';

    if (state.currentEffects.length === 0) {
        container.innerHTML = `<div class="text-muted text-center text-sm">Aucun effet configuré. Le sort n'aura que ses coûts.</div>`;
        return;
    }

    const castingTypeSelect = document.getElementById('castingTypeSelect');
    const isCanalise = castingTypeSelect && castingTypeSelect.value === 'CANALISE';
    const durationInput = document.getElementById('channelingDuration');
    const duration = durationInput ? (parseInt(durationInput.value) || 1) : 1;

    const spiritId = document.getElementById('spiritSelect') ? document.getElementById('spiritSelect').value : null;
    let isTenebres = false;
    if (spiritId && state.metaData.spiritualites) {
        const s = state.metaData.spiritualites.find(sp => sp.id == spiritId);
        if (s && s.nom && (s.nom.toLowerCase().includes('ténèbre') || s.nom.toLowerCase().includes('tenebre'))) {
            isTenebres = true;
        }
    }

    state.currentEffects.forEach((eff, idx) => {
        const labelObj = state.metaData.effectTypes.find(t => t.type === eff.effectType);
        const customLabels = {
            'HEAT_FIXED': 'Chaleur Fixe',
            'HEAT_PERCENTAGE': 'Chaleur %',
            'HEAT_OVER_TIME': 'Chaleur Tick',
            'POISON': 'Poison',
            'BURN': 'Brûlure',
            'AME_DETACHEE': 'Âme Détachée',
            'BUD': 'Bourgeon'
        };
        const typeLabel = labelObj ? labelObj.label : (customLabels[eff.effectType] || eff.effectType);

        const isHeatEffect = eff.effectType.startsWith('HEAT');
        if (isHeatEffect) {
            eff.effectTarget = 'CASTER';
        }
        let targetClass = eff.effectTarget ? eff.effectTarget.toLowerCase() : 'target';

        let fieldsHtml = '';

        // Champs spécifiques en fonction du type
        if (eff.effectType === 'FIXED_DAMAGE') {
            fieldsHtml = `
                        <div class="form-row">
                            <div class="form-group">
                                <label>Dégâts</label>
                                <input type="number" value="${eff.damage}" onchange="updateEffectProp('${eff.id}', 'damage', this.value)">
                            </div>
                            <div class="form-group">
                                <label>Type de Dégâts</label>
                                <select class="custom-select-dynamic" id="damageType-${eff.id}" onchange="updateEffectProp('${eff.id}', 'damageType', this.value)">
                                    ${renderOptions(state.metaData.damageTypes, eff.damageType)}
                                </select>
                            </div>
                        </div>
                    `;
        } else if (eff.effectType === 'PERCENTAGE_DAMAGE') {
            fieldsHtml = `
                        <div class="form-row">
                            <div class="form-group">
                                <label>Ratio (ex: 0.10 pour 10%)</label>
                                <input type="number" step="0.01" value="${eff.percentage}" onchange="updateEffectProp('${eff.id}', 'percentage', this.value)">
                            </div>
                            <div class="form-group">
                                <label>Type</label>
                                <select class="custom-select-dynamic" id="damageType-${eff.id}" onchange="updateEffectProp('${eff.id}', 'damageType', this.value)">
                                    ${renderOptions(state.metaData.damageTypes, eff.damageType)}
                                </select>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Source du Ratio</label>
                            <select class="custom-select-dynamic" id="ratioSource-${eff.id}" onchange="updateEffectProp('${eff.id}', 'source', this.value)">
                                ${renderSourceOptions(state.metaData.sources, eff.source)}
                            </select>
                        </div>
                    `;
        } else if (eff.effectType === 'FIXED_HEAL') {
            fieldsHtml = `
                        <div class="form-group">
                            <label>Montant du Soin</label>
                            <input type="number" value="${eff.healAmount}" onchange="updateEffectProp('${eff.id}', 'healAmount', this.value)">
                        </div>
                    `;
        } else if (eff.effectType === 'PERCENTAGE_HEAL') {
            fieldsHtml = `
                        <div class="form-row">
                            <div class="form-group">
                                <label>Ratio (ex: 0.20 pour 20%)</label>
                                <input type="number" step="0.01" value="${eff.percentage}" onchange="updateEffectProp('${eff.id}', 'percentage', this.value)">
                            </div>
                            <div class="form-group">
                                <label>Source du Ratio</label>
                                <select class="custom-select-dynamic" id="ratioSource-${eff.id}" onchange="updateEffectProp('${eff.id}', 'source', this.value)">
                                    ${renderSourceOptions(state.metaData.sources, eff.source)}
                                </select>
                            </div>
                        </div>
                    `;
        } else if (eff.effectType === 'BUFF_DEBUFF') {
            fieldsHtml = `
                        <div class="form-row">
                            <div class="form-group">
                                <label>Stat Affectée</label>
                                <select class="custom-select-dynamic" id="statAffected-${eff.id}" onchange="updateEffectProp('${eff.id}', 'statAffected', this.value)">
                                    ${renderStatOptions(state.metaData.statTypes, eff.statAffected)}
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Durée (Tours)</label>
                                <input type="number" value="${eff.duration}" onchange="updateEffectProp('${eff.id}', 'duration', this.value)">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Valeur Fixe (+/-)</label>
                                <input type="number" value="${eff.flatValue}" onchange="updateEffectProp('${eff.id}', 'flatValue', this.value)">
                            </div>
                            <div class="form-group">
                                <label>Multiplicateur (Ratio)</label>
                                <input type="number" step="0.05" value="${eff.modifier}" onchange="updateEffectProp('${eff.id}', 'modifier', this.value)">
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Source du Ratio</label>
                            <select class="custom-select-dynamic" id="ratioSource-${eff.id}" onchange="updateEffectProp('${eff.id}', 'source', this.value)">
                                ${renderSourceOptions(state.metaData.sources, eff.source)}
                            </select>
                        </div>
                    `;
        } else if (eff.effectType === 'POISON' || eff.effectType === 'BURN') {
            fieldsHtml = `
                        <div class="form-row">
                            <div class="form-group">
                                <label>Durée (Tours)</label>
                                <input type="number" value="${eff.duration}" onchange="updateEffectProp('${eff.id}', 'duration', this.value)">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Dégâts Fixes (+/-)</label>
                                <input type="number" value="${eff.flatValue}" onchange="updateEffectProp('${eff.id}', 'flatValue', this.value)">
                            </div>
                            <div class="form-group">
                                <label>Multiplicateur (Ratio)</label>
                                <input type="number" step="0.05" value="${eff.modifier}" onchange="updateEffectProp('${eff.id}', 'modifier', this.value)">
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Source du Ratio</label>
                            <select class="custom-select-dynamic" id="ratioSource-${eff.id}" onchange="updateEffectProp('${eff.id}', 'source', this.value)">
                                ${renderSourceOptions(state.metaData.sources, eff.source)}
                            </select>
                        </div>
                    `;
        } else if (eff.effectType === 'DOT') {
            fieldsHtml = `
                        <div class="form-row">
                            <div class="form-group">
                                <label>Dégâts Fixes / Tour</label>
                                <input type="number" value="${eff.damage}" onchange="updateEffectProp('${eff.id}', 'damage', this.value)">
                            </div>
                            <div class="form-group">
                                <label>Ratio / Tour</label>
                                <input type="number" step="0.01" value="${eff.percentage}" onchange="updateEffectProp('${eff.id}', 'percentage', this.value)">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Durée (Tours)</label>
                                <input type="number" value="${eff.duration}" onchange="updateEffectProp('${eff.id}', 'duration', this.value)">
                            </div>
                            <div class="form-group">
                                <label>Type de Dégâts</label>
                                <select class="custom-select-dynamic" id="damageType-${eff.id}" onchange="updateEffectProp('${eff.id}', 'damageType', this.value)">
                                    ${renderOptions(state.metaData.damageTypes, eff.damageType)}
                                </select>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Source du Ratio</label>
                            <select class="custom-select-dynamic" id="ratioSource-${eff.id}" onchange="updateEffectProp('${eff.id}', 'source', this.value)">
                                ${renderSourceOptions(state.metaData.sources, eff.source)}
                            </select>
                        </div>
                    `;
        } else if (eff.effectType === 'HOT') {
            fieldsHtml = `
                        <div class="form-row">
                            <div class="form-group">
                                <label>Soins Fixes / Tour</label>
                                <input type="number" value="${eff.healAmount}" onchange="updateEffectProp('${eff.id}', 'healAmount', this.value)">
                            </div>
                            <div class="form-group">
                                <label>Ratio / Tour</label>
                                <input type="number" step="0.01" value="${eff.percentage}" onchange="updateEffectProp('${eff.id}', 'percentage', this.value)">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Durée (Tours)</label>
                                <input type="number" value="${eff.duration}" onchange="updateEffectProp('${eff.id}', 'duration', this.value)">
                            </div>
                            <div class="form-group">
                                <label>Source du Ratio</label>
                                <select class="custom-select-dynamic" id="ratioSource-${eff.id}" onchange="updateEffectProp('${eff.id}', 'source', this.value)">
                                    ${renderSourceOptions(state.metaData.sources, eff.source)}
                                </select>
                            </div>
                        </div>
                    `;
        } else if (eff.effectType === 'FIXED_MANA') {
            fieldsHtml = `
                        <div class="form-group">
                            <label>Montant de Mana</label>
                            <input type="number" value="${eff.manaAmount || 0}" onchange="updateEffectProp('${eff.id}', 'manaAmount', this.value)">
                        </div>
                    `;
        } else if (eff.effectType === 'PERCENTAGE_MANA') {
            fieldsHtml = `
                        <div class="form-row">
                            <div class="form-group">
                                <label>Ratio (ex: 0.15 pour 15%)</label>
                                <input type="number" step="0.01" value="${eff.percentage}" onchange="updateEffectProp('${eff.id}', 'percentage', this.value)">
                            </div>
                            <div class="form-group">
                                <label>Source du Ratio</label>
                                <select class="custom-select-dynamic" id="ratioSource-${eff.id}" onchange="updateEffectProp('${eff.id}', 'source', this.value)">
                                    ${renderSourceOptions(state.metaData.sources, eff.source)}
                                </select>
                            </div>
                        </div>
                    `;
        } else if (eff.effectType === 'MOT') {
            fieldsHtml = `
                        <div class="form-row">
                            <div class="form-group">
                                <label>Mana Fixe / Tour</label>
                                <input type="number" value="${eff.manaAmount || 0}" onchange="updateEffectProp('${eff.id}', 'manaAmount', this.value)">
                            </div>
                            <div class="form-group">
                                <label>Ratio / Tour</label>
                                <input type="number" step="0.01" value="${eff.percentage}" onchange="updateEffectProp('${eff.id}', 'percentage', this.value)">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Durée (Tours)</label>
                                <input type="number" value="${eff.duration}" onchange="updateEffectProp('${eff.id}', 'duration', this.value)">
                            </div>
                            <div class="form-group">
                                <label>Source du Ratio</label>
                                <select class="custom-select-dynamic" id="ratioSource-${eff.id}" onchange="updateEffectProp('${eff.id}', 'source', this.value)">
                                    ${renderSourceOptions(state.metaData.sources, eff.source)}
                                </select>
                            </div>
                        </div>
                    `;
        } else if (eff.effectType === 'SHIELD') {
            fieldsHtml = `
                        <div class="form-row">
                            <div class="form-group">
                                <label>Valeur Fixe Bouclier</label>
                                <input type="number" value="${eff.flatValue || 0}" onchange="updateEffectProp('${eff.id}', 'flatValue', this.value)">
                            </div>
                            <div class="form-group">
                                <label>Ratio (ex: 0.10 pour 10%)</label>
                                <input type="number" step="0.01" value="${eff.percentage || 0}" onchange="updateEffectProp('${eff.id}', 'percentage', this.value)">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Durée (Tours)</label>
                                <input type="number" value="${eff.duration || 0}" onchange="updateEffectProp('${eff.id}', 'duration', this.value)">
                            </div>
                            <div class="form-group">
                                <label>Source du Ratio</label>
                                <select class="custom-select-dynamic" id="ratioSource-${eff.id}" onchange="updateEffectProp('${eff.id}', 'source', this.value)">
                                    ${renderSourceOptions(state.metaData.sources, eff.source)}
                                </select>
                            </div>
                        </div>
                    `;
        } else if (eff.effectType === 'PURGE') {
            fieldsHtml = `
                        <div class="text-success p-2 bg-success/10 border-l-[3px] border-success rounded text-sm">
                            ✨ Dissipe instantanément tous les bonus, malus et altérations d'état (DoT/HoT) actifs sur la cible.
                        </div>
                    `;
        } else if (eff.effectType === 'HEAT_FIXED') {
            fieldsHtml = `
                        <div class="form-group">
                            <label>Montant de Chaleur Générée (Fixe)</label>
                            <input type="number" min="0" value="${eff.flatValue || 0}" onchange="updateEffectProp('${eff.id}', 'flatValue', this.value)">
                        </div>
                    `;
        } else if (eff.effectType === 'BUD') {
            fieldsHtml = `
                        <div class="form-group">
                            <label>Bourgeons Générés</label>
                            <input type="number" min="1" value="${eff.flatValue || 1}" onchange="updateEffectProp('${eff.id}', 'flatValue', this.value)">
                        </div>
                    `;
        } else if (eff.effectType === 'HEAT_PERCENTAGE') {
            fieldsHtml = `
                        <div class="form-row">
                            <div class="form-group">
                                <label>Ratio (ex: 0.10 pour 10%)</label>
                                <input type="number" step="0.01" value="${eff.percentage}" onchange="updateEffectProp('${eff.id}', 'percentage', this.value)">
                            </div>
                            <div class="form-group">
                                <label>Source du Ratio</label>
                                <select class="custom-select-dynamic" id="ratioSource-${eff.id}" onchange="updateEffectProp('${eff.id}', 'source', this.value)">
                                    ${renderSourceOptions(state.metaData.sources, eff.source)}
                                </select>
                            </div>
                        </div>
                    `;
        } else if (eff.effectType === 'HEAT_OVER_TIME') {
            fieldsHtml = `
                        <div class="form-row">
                            <div class="form-group">
                                <label>Chaleur Fixe / Tour</label>
                                <input type="number" value="${eff.flatValue}" onchange="updateEffectProp('${eff.id}', 'flatValue', this.value)">
                            </div>
                            <div class="form-group">
                                <label>Ratio / Tour</label>
                                <input type="number" step="0.01" value="${eff.percentage}" onchange="updateEffectProp('${eff.id}', 'percentage', this.value)">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Durée (Tours)</label>
                                <input type="number" value="${eff.duration}" onchange="updateEffectProp('${eff.id}', 'duration', this.value)">
                            </div>
                            <div class="form-group">
                                <label>Source du Ratio</label>
                                <select class="custom-select-dynamic" id="ratioSource-${eff.id}" onchange="updateEffectProp('${eff.id}', 'source', this.value)">
                                    ${renderSourceOptions(state.metaData.sources, eff.source)}
                                </select>
                            </div>
                        </div>
                    `;
        } else if (eff.effectType === 'AME_DETACHEE') {
            fieldsHtml = `
                        <div class="p-2 bg-rose-500/10 border-l-[3px] border-rose-500 rounded text-sm text-rose-300">
                            ✨ Confère au lanceur +5 Dégâts Physiques et +30% de Dégâts Physiques supplémentaires pendant 3 tours.
                        </div>
                    `;
        }

        let typeBadgeStyle = '';
        if (['FIXED_DAMAGE', 'PERCENTAGE_DAMAGE'].includes(eff.effectType)) {
            typeBadgeStyle = 'background: rgba(239, 68, 68, 0.2); color: #fca5a5;';
        } else if (['FIXED_HEAL', 'PERCENTAGE_HEAL', 'HOT'].includes(eff.effectType)) {
            typeBadgeStyle = 'background: rgba(16, 185, 129, 0.2); color: #6ee7b7;';
        } else if (['FIXED_MANA', 'PERCENTAGE_MANA', 'MOT'].includes(eff.effectType)) {
            typeBadgeStyle = 'background: rgba(14, 165, 233, 0.2); color: #7dd3fc;';
        } else if (eff.effectType === 'BUFF_DEBUFF') {
            typeBadgeStyle = 'background: rgba(245, 158, 11, 0.2); color: #fcd34d;';
        } else if (eff.effectType === 'POISON') {
            typeBadgeStyle = 'background: rgba(16, 185, 129, 0.2); color: #6ee7b7;';
        } else if (eff.effectType === 'BURN') {
            typeBadgeStyle = 'background: rgba(249, 115, 22, 0.2); color: #fdba74;';
        } else if (eff.effectType === 'DOT') {
            typeBadgeStyle = 'background: rgba(168, 85, 247, 0.2); color: #d8b4fe;';
        } else if (eff.effectType === 'PURGE') {
            typeBadgeStyle = 'background: rgba(6, 182, 212, 0.2); color: #67e8f9;';
        } else if (eff.effectType === 'SHIELD') {
            typeBadgeStyle = 'background: rgba(59, 130, 246, 0.2); color: #93c5fd;';
        } else if (['HEAT_FIXED', 'HEAT_PERCENTAGE', 'HEAT_OVER_TIME'].includes(eff.effectType)) {
            typeBadgeStyle = 'background: rgba(239, 68, 68, 0.25); color: #fca5a5; border: 1px solid rgba(239,68,68,0.4);';
        } else if (eff.effectType === 'AME_DETACHEE') {
            typeBadgeStyle = 'background: rgba(244, 63, 94, 0.25); color: #fda4af; border: 1px solid rgba(244,63,94,0.4);';
        } else if (eff.effectType === 'BUD') {
            typeBadgeStyle = 'background: rgba(16, 185, 129, 0.25); color: #6ee7b7; border: 1px solid rgba(16, 185, 129, 0.4);';
        }

        const deleteOrLinkedButton = `<button type="button" class="btn-danger" onclick="removeEffect('${eff.id}')">✖ Supprimer</button>`;

        const targetSelectorHtml = (isHeatEffect || eff.effectType === 'AME_DETACHEE') ? `
                        <div class="flex-center gap-2 p-3 bg-red-500/10 rounded-lg border border-red-500/25 mb-2">
                            <span class="material-symbols-outlined text-red-300 text-xl">person</span>
                            <span class="text-sm text-red-300 font-semibold">Cible : Lanceur (${eff.effectType === 'AME_DETACHEE' ? 'Âme Détachée' : 'Chaleur générée'})</span>
                        </div>
                ` : `
                        <!-- Sélection de la cible de l'Effet -->
                        <div class="flex-col gap-3 p-3 bg-black/25 rounded-lg border border-white/5">
                            <label class="text-sm text-white font-semibold">Cible de l'Effet :</label>
                            <div class="target-selector flex-wrap gap-2">
                                <button type="button" class="target-btn target-caster-btn ${eff.effectTarget === 'CASTER' ? 'active' : ''}" onclick="setEffectTarget('${eff.id}', 'CASTER')" title="Affecte uniquement le lanceur du sort">
                                    <span class="material-symbols-outlined">person</span> Lanceur
                                </button>
                                <button type="button" class="target-btn target-ally-btn ${eff.effectTarget === 'ALLY' ? 'active' : ''}" onclick="setEffectTarget('${eff.id}', 'ALLY')" title="Affecte un allié ciblé">
                                    <span class="material-symbols-outlined">shield</span> Allié (Ciblé)
                                </button>
                                <button type="button" class="target-btn target-enemy-btn ${eff.effectTarget === 'TARGET' ? 'active' : ''}" onclick="setEffectTarget('${eff.id}', 'TARGET')" title="Affecte la cible ennemie principale">
                                    <span class="material-symbols-outlined">my_location</span> Ennemi (Cible)
                                </button>
                                <button type="button" class="target-btn target-all-allies-btn ${eff.effectTarget === 'ALL_ALLIES' ? 'active' : ''}" onclick="setEffectTarget('${eff.id}', 'ALL_ALLIES')" title="Affecte le lanceur et tous ses alliés">
                                    <span class="material-symbols-outlined">groups</span> Lanceur &amp; Alliés
                                </button>
                                <button type="button" class="target-btn target-all-enemies-btn ${eff.effectTarget === 'ALL_ENEMIES' ? 'active' : ''}" onclick="setEffectTarget('${eff.id}', 'ALL_ENEMIES')" title="Affecte tous les ennemis (zone)">
                                    <span class="material-symbols-outlined">local_fire_department</span> Tous les Ennemis
                                </button>
                                <button type="button" class="target-btn target-everyone-btn ${eff.effectTarget === 'ALL_COMBATANTS' ? 'active' : ''}" onclick="setEffectTarget('${eff.id}', 'ALL_COMBATANTS')" title="Affecte tout le monde (alliés et ennemis)">
                                    <span class="material-symbols-outlined">public</span> Tout le Monde
                                </button>
                            </div>
                        </div>
                `;

        const itemHtml = `
                    <div class="effect-item target-${targetClass}">
                        <div class="effect-header">
                            <span class="effect-type-badge" style="${typeBadgeStyle}">${typeLabel}</span>
                            ${deleteOrLinkedButton}
                        </div>

                        ${targetSelectorHtml}

                        <!-- Option / Clé d'activation de la ligne d'effet -->
                        <div class="flex items-center gap-2 mt-2 pt-2 border-t border-white/5 border-dashed">
                            <label class="text-xs text-amber-500 font-semibold flex items-center gap-1"><span class="material-symbols-outlined text-lg">key</span> S'active uniquement si l'Option de sort choisie est :</label>
                            <input type="number" value="${eff.requiredChoiceKey !== undefined && eff.requiredChoiceKey !== null ? eff.requiredChoiceKey : ''}" placeholder="Toutes (Par défaut)" class="w-32 text-sm px-2 py-1 bg-glass text-white border-glass rounded" onchange="updateEffectProp('${eff.id}', 'requiredChoiceKey', this.value ? parseInt(this.value) : null)">
                            <span class="text-muted text-xs">Ex: 1 pour la ligne Soin, 2 pour la ligne Mana. Laissez vide pour s'activer toujours.</span>
                        </div>

                        <!-- Condition Âme Détachée -->
                        ${(isTenebres && eff.effectType !== 'AME_DETACHEE') ? `
                        <div class="mt-3 flex-col gap-1 pt-2 border-t border-white/5 border-dashed">
                            <div class="flex-center justify-between">
                                <label class="flex-center text-rose-300 font-semibold text-sm gap-1">
                                    <span class="material-symbols-outlined text-lg">hand_bones</span> Condition "Âme Détachée"
                                </label>
                                ${(() => {
                    const r = eff.detachedSoulRequirement || 'NOT_AFFECTED';
                    return `
                                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.25rem; background: rgba(0, 0, 0, 0.4); border: 1px solid var(--glass-border); border-radius: 8px; padding: 0.2rem; width: 280px;">
                                        <button type="button" class="text-xs text-center" style="padding: 0.35rem 0.2rem; border-radius: 6px; border: 1px solid ${r === 'NOT_AFFECTED' ? '#94a3b8' : 'transparent'}; background: ${r === 'NOT_AFFECTED' ? 'rgba(148, 163, 184, 0.25)' : 'transparent'}; color: ${r === 'NOT_AFFECTED' ? '#f8fafc' : 'var(--text-muted)'}; cursor: pointer; transition: all 0.2s; font-weight: ${r === 'NOT_AFFECTED' ? '600' : '400'};" onclick="updateEffectProp('${eff.id}', 'detachedSoulRequirement', 'NOT_AFFECTED')">
                                            Normal
                                        </button>
                                        <button type="button" class="text-xs text-center" style="padding: 0.35rem 0.2rem; border-radius: 6px; border: 1px solid ${r === 'REQUIRED' ? '#10b981' : 'transparent'}; background: ${r === 'REQUIRED' ? 'rgba(16, 185, 129, 0.25)' : 'transparent'}; color: ${r === 'REQUIRED' ? '#6ee7b7' : 'var(--text-muted)'}; cursor: pointer; transition: all 0.2s; font-weight: ${r === 'REQUIRED' ? '600' : '400'};" onclick="updateEffectProp('${eff.id}', 'detachedSoulRequirement', 'REQUIRED')">
                                            Requiert
                                        </button>
                                        <button type="button" class="text-xs text-center" style="padding: 0.35rem 0.2rem; border-radius: 6px; border: 1px solid ${r === 'FORBIDDEN' ? '#f43f5e' : 'transparent'}; background: ${r === 'FORBIDDEN' ? 'rgba(244, 63, 94, 0.25)' : 'transparent'}; color: ${r === 'FORBIDDEN' ? '#fda4af' : 'var(--text-muted)'}; cursor: pointer; transition: all 0.2s; font-weight: ${r === 'FORBIDDEN' ? '600' : '400'};" onclick="updateEffectProp('${eff.id}', 'detachedSoulRequirement', 'FORBIDDEN')">
                                            Exclut
                                        </button>
                                    </div>
                                    `;
                })()}
                            </div>
                        </div>
                        ` : ''}

                        <!-- Tour(s) d'activation de l'effet dans la canalisation (uniquement si le sort est canalisé) -->
                        ${isCanalise ? `
                        <div class="flex-col gap-1 mt-2 pt-2 border-t border-white/5 border-dashed">
                            <label class="text-xs text-purple-400 font-semibold flex items-center gap-1"><span class="material-symbols-outlined text-lg">cyclone</span> Activation par Tour de Canalisation :</label>
                            <div class="flex flex-wrap items-center gap-1">
                                ${Array.from({ length: duration }, (_, i) => i + 1).map(turn => {
                    const isActive = (eff.channelingTurns || []).includes(turn);
                    const btnStyle = isActive
                        ? 'background: rgba(168, 85, 247, 0.25); border-color: #a855f7; color: #e9d5ff; font-weight: 700; box-shadow: 0 0 8px rgba(168, 85, 247, 0.3);'
                        : 'background: rgba(255, 255, 255, 0.03); border-color: rgba(255, 255, 255, 0.1); color: var(--text-muted);';
                    return `
                                        <button class="text-xs" type="button" onclick="toggleEffectChannelingTurn('${eff.id}', ${turn})"
                                            style="padding: 0.25rem 0.6rem; border-radius: 6px; border: 1px solid; cursor: pointer; transition: all 0.2s; ${btnStyle}">
                                            Tour ${turn}
                                        </button>
                                    `;
                }).join('')}
                                <span class="text-muted text-xs ml-2">Sélectionnez les tours où cet effet se déclenche.</span>
                            </div>
                        </div>
                        ` : ''}

                        <hr class="border-glass m-0">

                        ${fieldsHtml}
                    </div>
                `;

        container.innerHTML += itemHtml;
    });

    // Styliser les sélecteurs dynamiques customisés
    container.querySelectorAll('.custom-select-dynamic').forEach(sel => {
        makeCustomSelect(sel);
    });
}




