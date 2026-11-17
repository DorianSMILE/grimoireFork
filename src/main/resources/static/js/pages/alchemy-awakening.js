// Module dédié à l'Onglet 2 d'Alchimie : Catalyseurs, Anomalies d'Éveil et Atelier d'Éveil (+0 à +5)
(function () {
    const awakeningState = {
        userEquipments: [],
        selectedEquipmentId: null,
        selectedSimulation: null,
        craftFilter: 'ALL',
        searchTerm: '',
        isExecuting: false,
        userGold: 0
    };

    function createEl(tag, className, text) {
        const el = document.createElement(tag);
        if (className) el.className = className;
        if (text !== undefined && text !== null) el.textContent = String(text);
        return el;
    }

    function getRarityClass(rarityStr) {
        const r = String(rarityStr || '').toLowerCase();
        if (r === 'legendaire') return 'awakening-rarity-legendaire';
        if (r === 'epique') return 'awakening-rarity-epique';
        if (r === 'relique') return 'awakening-rarity-relique';
        if (r === 'maudit') return 'awakening-rarity-maudit';
        return 'text-white';
    }

    async function loadUserEquipments() {
        try {
            const res = await globalFetch('/api/equipments');
            if (res && res.ok) {
                const list = await res.json();
                awakeningState.userEquipments = Array.isArray(list) ? list : [];
            }
        } catch (e) {
            console.error('Erreur chargement équipements pour éveil:', e);
        }
        return awakeningState.userEquipments;
    }

    function renderLockedView(host) {
        host.textContent = '';
        const card = createEl('div', 'awakening-locked-card');
        const icon = createEl('span', 'material-symbols-outlined awakening-locked-icon', 'lock');
        const title = createEl('h2', 'm-0 text-xl font-bold text-white', "Atelier d'Éveil verrouillé");
        const desc = createEl(
            'p',
            'text-sm text-muted max-w-[460px]',
            "Terminez au moins un donjon de niveau 3 pour débloquer la forge des Catalyseurs, des Anomalies d'Éveil et l'amélioration des équipements."
        );
        const link = createEl('a', 'awakening-locked-link');
        link.href = '/dungeons';
        const linkIcon = createEl('span', 'material-symbols-outlined text-base', 'swords');
        const linkLabel = createEl('span', '', 'Explorer les Donjons');
        link.appendChild(linkIcon);
        link.appendChild(linkLabel);

        card.appendChild(icon);
        card.appendChild(title);
        card.appendChild(desc);
        card.appendChild(link);
        host.appendChild(card);
    }

    function renderEquipmentsList(container, callbacks) {
        container.textContent = '';
        const eligible = awakeningState.userEquipments.filter(eq => eq && eq.upgradeEligible);

        eligible.sort((a, b) => {
            if (Boolean(a.upgradeReady) !== Boolean(b.upgradeReady)) {
                return a.upgradeReady ? -1 : 1;
            }
            const lvlDiff = (b.upgradeLevel || 0) - (a.upgradeLevel || 0);
            if (lvlDiff !== 0) return lvlDiff;
            return (a.name || '').localeCompare(b.name || '');
        });

        if (eligible.length === 0) {
            const empty = createEl(
                'p',
                'text-xs text-muted italic p-2',
                'Aucun équipement éligible (Légendaire, Épique, Relique ou Maudit requis).'
            );
            container.appendChild(empty);
            return;
        }

        eligible.forEach(eq => {
            const isSelected = Number(awakeningState.selectedEquipmentId) === Number(eq.id);
            const classes = [
                'awakening-equip-item',
                isSelected ? 'is-selected' : '',
                eq.upgradeReady ? 'is-ready' : ''
            ].filter(Boolean).join(' ');

            const card = createEl('div', classes);
            card.dataset.equipId = String(eq.id);
            card.addEventListener('click', () => {
                selectEquipment(eq.id, callbacks);
            });

            const topRow = createEl('div', 'flex items-center justify-between gap-2');
            const nameWrap = createEl('div', 'flex items-center gap-1.5 min-w-0');
            const rarityKey = typeof getRarityName === 'function' ? getRarityName(eq.rarity) : eq.rarity;
            const nameSpan = createEl('span', `font-bold text-sm truncate ${getRarityClass(rarityKey)}`, eq.name);
            const lvl = Number(eq.upgradeLevel || 0);
            const lvlBadge = createEl('span', `awakening-level-badge ${lvl >= 5 ? 'is-max' : ''}`, `+${lvl}`);
            nameWrap.appendChild(nameSpan);
            nameWrap.appendChild(lvlBadge);

            const statusText = eq.upgradeReady ? 'Prêt' : (lvl >= 5 ? 'MAX' : 'Incomplet');
            const statusPill = createEl(
                'span',
                `awakening-status-pill ${eq.upgradeReady ? 'is-ready' : 'is-missing'}`,
                statusText
            );

            topRow.appendChild(nameWrap);
            topRow.appendChild(statusPill);

            const metaRow = createEl('div', 'flex items-center justify-between text-xs text-muted');
            const carrierText = eq.personnage?.name ? `Porté par ${eq.personnage.name}` : 'En coffre';
            const secretText = eq.requiredSecret || 'Équipement générique';
            metaRow.appendChild(createEl('span', '', carrierText));
            metaRow.appendChild(createEl('span', '', secretText));

            card.appendChild(topRow);
            card.appendChild(metaRow);
            container.appendChild(card);
        });
    }

    function renderAwakeningRecipesList(container, allRecipes, selectedRecipe, onSelectRecipe) {
        container.textContent = '';
        const awakeningRecipes = (allRecipes || []).filter(
            r => r.rewardType === 'GIVE_CATALYST' || r.rewardType === 'GIVE_AWAKENING'
        );

        const filtered = awakeningRecipes.filter(r => {
            if (awakeningState.craftFilter !== 'ALL' && r.rewardType !== awakeningState.craftFilter) {
                return false;
            }
            if (awakeningState.searchTerm && !String(r.name || '').toLowerCase().includes(awakeningState.searchTerm)) {
                return false;
            }
            return true;
        });

        filtered.sort((a, b) => {
            if (a.rewardType !== b.rewardType) {
                return a.rewardType === 'GIVE_CATALYST' ? -1 : 1;
            }
            return (a.name || '').localeCompare(b.name || '');
        });

        if (filtered.length === 0) {
            container.appendChild(createEl('p', 'text-xs text-muted italic p-2', 'Aucune recette correspondante.'));
            return;
        }

        filtered.forEach(r => {
            const isSelected = selectedRecipe && Number(selectedRecipe.id) === Number(r.id);
            const canCraft = typeof window.canCraftRecipe === 'function' ? window.canCraftRecipe(r) : false;
            const classes = [
                'awakening-craft-item',
                isSelected ? 'is-selected' : '',
                canCraft ? 'craftable-pulse' : ''
            ].filter(Boolean).join(' ');

            const card = createEl('div', classes);
            card.addEventListener('click', () => {
                awakeningState.selectedEquipmentId = null;
                onSelectRecipe(r, card);
            });

            const header = createEl('div', 'flex items-center justify-between gap-2');
            const title = createEl('span', 'font-bold text-sm text-white', r.name);
            const isCat = r.rewardType === 'GIVE_CATALYST';
            const badge = createEl(
                'span',
                `awakening-status-pill ${isCat ? 'awakening-type-catalyst' : 'awakening-type-eveil'}`,
                isCat ? 'Catalyseur' : 'Éveil'
            );
            header.appendChild(title);
            header.appendChild(badge);

            const desc = createEl('p', 'text-xs text-muted m-0', r.description || '');
            card.appendChild(header);
            card.appendChild(desc);
            container.appendChild(card);
        });
    }

    function renderSimulationView(rightPanel, sim, callbacks) {
        rightPanel.textContent = '';

        const wrapper = createEl('div', 'flex flex-col gap-4 w-full');
        wrapper.id = 'awakeningPreviewPanel';

        // En-tête objet
        const header = createEl('div', 'flex items-center justify-between flex-wrap gap-2');
        const titleBlock = createEl('div', 'flex items-center gap-2');
        titleBlock.appendChild(createEl('h2', `m-0 text-xl font-bold ${getRarityClass(sim.rarity)}`, sim.equipmentName));
        titleBlock.appendChild(
            createEl('span', `awakening-level-badge ${sim.maxReached ? 'is-max' : ''}`, `+${sim.currentLevel}`)
        );
        const secretLabel = createEl(
            'span',
            'text-xs text-muted px-2 py-1 rounded bg-black/40 border border-white/10',
            `${sim.rarityLabel || sim.rarity} · ${sim.slotLabel || sim.slot}${sim.requiredSecret ? ` · ${sim.requiredSecret}` : ''}`
        );
        header.appendChild(titleBlock);
        header.appendChild(secretLabel);
        wrapper.appendChild(header);

        // Barre des paliers +0 à +5
        const track = createEl('div', 'awakening-tier-track');
        for (let i = 0; i <= (sim.maxLevel || 5); i++) {
            let stepCls = 'awakening-tier-step';
            if (i <= sim.currentLevel) stepCls += ' is-done';
            else if (!sim.maxReached && i === sim.nextLevel) stepCls += ' is-next';
            track.appendChild(createEl('span', stepCls, `+${i}`));
        }
        wrapper.appendChild(track);

        // Coûts du palier suivant
        if (!sim.maxReached) {
            const costBox = createEl('div', 'flex flex-col gap-2');
            costBox.appendChild(createEl('h3', 'm-0 text-sm font-bold text-slate-200', `Coût pour atteindre +${sim.nextLevel}`));

            if (sim.catalystRequired > 0) {
                const okCat = sim.catalystOwned >= sim.catalystRequired;
                const row = createEl('div', `awakening-cost-row ${okCat ? 'is-ok' : 'is-missing'}`);
                row.appendChild(createEl('span', '', `${sim.catalystName} (Catalyseur)`));
                row.appendChild(createEl('span', 'font-bold', `${sim.catalystOwned} / ${sim.catalystRequired}`));
                costBox.appendChild(row);
            }

            if (sim.awakeningRequired > 0) {
                const okAwk = sim.awakeningOwned >= sim.awakeningRequired;
                const row = createEl('div', `awakening-cost-row ${okAwk ? 'is-ok' : 'is-missing'}`);
                row.appendChild(createEl('span', '', `${sim.awakeningName} (Éveil)`));
                row.appendChild(createEl('span', 'font-bold', `${sim.awakeningOwned} / ${sim.awakeningRequired}`));
                costBox.appendChild(row);
            }

            const okGold = sim.userGold >= sim.goldCost;
            const goldRow = createEl('div', `awakening-cost-row ${okGold ? 'is-ok' : 'is-missing'}`);
            goldRow.appendChild(createEl('span', '', 'Or requis'));
            goldRow.appendChild(createEl('span', 'font-bold', `${Math.floor(sim.userGold)} / ${Math.round(sim.goldCost)} Or`));
            costBox.appendChild(goldRow);

            wrapper.appendChild(costBox);
        }

        // Grille comparaison statistiques
        const statsSection = createEl('div', 'flex flex-col gap-2');
        statsSection.appendChild(
            createEl(
                'h3',
                'm-0 text-sm font-bold text-slate-200',
                sim.maxReached ? 'Statistiques au palier maximum (+5)' : `Aperçu des statistiques (+${sim.currentLevel} → +${sim.nextLevel})`
            )
        );
        const grid = createEl('div', 'awakening-stats-grid');
        const defs = window.STAT_DEFS || [];
        let hasAnyStat = false;

        defs.forEach(def => {
            const cur = sim.currentStats ? (sim.currentStats[def.key] || 0) : 0;
            const nxt = sim.nextStats ? (sim.nextStats[def.key] || 0) : cur;
            const delta = sim.deltas ? (sim.deltas[def.key] || 0) : 0;
            if (cur === 0 && nxt === 0 && delta === 0) return;
            hasAnyStat = true;

            const row = createEl('div', 'awakening-stat-row');
            row.appendChild(createEl('span', 'text-muted', def.label));

            const right = createEl('span', 'flex items-center gap-1.5 font-bold');
            const suffix = def.isPercent ? '%' : '';
            right.appendChild(createEl('span', 'text-white', `${cur}${suffix}`));
            if (!sim.maxReached) {
                right.appendChild(createEl('span', 'text-muted', '→'));
                right.appendChild(createEl('span', 'text-white', `${nxt}${suffix}`));
                if (delta !== 0) {
                    const sign = delta > 0 ? '+' : '';
                    const deltaCls = delta > 0 ? 'awakening-delta-pos' : 'awakening-delta-neg';
                    right.appendChild(createEl('span', deltaCls, `(${sign}${delta}${suffix})`));
                } else {
                    right.appendChild(createEl('span', 'awakening-delta-flat', '(=)'));
                }
            }
            row.appendChild(right);
            grid.appendChild(row);
        });

        if (sim.specialEffect && sim.specialEffect !== 'NONE') {
            hasAnyStat = true;
            const label = (window.EFFECT_LABELS && window.EFFECT_LABELS[sim.specialEffect]) || sim.specialEffect;
            const curEff = sim.currentStats ? (sim.currentStats.specialEffectValue || 0) : 0;
            const nxtEff = sim.nextStats ? (sim.nextStats.specialEffectValue || 0) : curEff;
            const deltaEff = sim.deltas ? (sim.deltas.specialEffectValue || 0) : 0;

            const row = createEl('div', 'awakening-stat-row');
            row.appendChild(createEl('span', 'text-purple-400', label));
            const right = createEl('span', 'flex items-center gap-1.5 font-bold');
            right.appendChild(createEl('span', 'text-white', `${curEff}`));
            if (!sim.maxReached) {
                right.appendChild(createEl('span', 'text-muted', '→'));
                right.appendChild(createEl('span', 'text-white', `${nxtEff}`));
                if (deltaEff !== 0) {
                    const sign = deltaEff > 0 ? '+' : '';
                    right.appendChild(createEl('span', deltaEff > 0 ? 'awakening-delta-pos' : 'awakening-delta-neg', `(${sign}${deltaEff})`));
                }
            }
            row.appendChild(right);
            grid.appendChild(row);
        }

        if (!hasAnyStat) {
            grid.appendChild(createEl('p', 'text-xs text-muted m-0', 'Aucune statistique scalaire.'));
        }
        statsSection.appendChild(grid);
        wrapper.appendChild(statsSection);

        if (sim.missingReason) {
            wrapper.appendChild(createEl('p', 'text-xs font-semibold text-amber-400 m-0 text-center', sim.missingReason));
        }

        // Bouton d'exécution
        if (!sim.maxReached) {
            const btn = createEl(
                'button',
                `awakening-btn-execute ${!sim.canUpgrade || awakeningState.isExecuting ? 'is-disabled' : ''}`
            );
            btn.id = 'btnExecuteAwakening';
            btn.type = 'button';
            btn.disabled = !sim.canUpgrade || awakeningState.isExecuting;
            btn.appendChild(createEl('span', 'material-symbols-outlined', 'auto_awesome'));
            btn.appendChild(createEl('span', '', `Éveiller (+${sim.nextLevel})`));

            btn.addEventListener('click', () => executeEquipmentUpgrade(sim.equipmentId, callbacks));
            wrapper.appendChild(btn);
        }

        rightPanel.appendChild(wrapper);
    }

    async function selectEquipment(equipmentId, callbacks) {
        awakeningState.selectedEquipmentId = Number(equipmentId);
        const listEl = document.getElementById('awakeningEquipList');
        if (listEl) renderEquipmentsList(listEl, callbacks);

        const rightPanel = document.getElementById('awakeningRightPanel');
        if (!rightPanel) return;

        rightPanel.textContent = '';
        rightPanel.appendChild(createEl('p', 'text-sm text-muted', "Calcul de l'éveil..."));

        try {
            const res = await globalFetch(`/api/equipments/${equipmentId}/upgrade/simulate`, { method: 'POST' });
            if (!res) return;
            const data = await res.json();
            if (!res.ok) {
                rightPanel.textContent = '';
                rightPanel.appendChild(createEl('p', 'text-sm text-error', data.error || 'Simulation impossible.'));
                return;
            }
            awakeningState.selectedSimulation = data;
            renderSimulationView(rightPanel, data, callbacks);
        } catch (e) {
            rightPanel.textContent = '';
            rightPanel.appendChild(createEl('p', 'text-sm text-error', 'Erreur réseau lors de la simulation.'));
        }
    }

    async function executeEquipmentUpgrade(equipmentId, callbacks) {
        if (awakeningState.isExecuting) return;
        awakeningState.isExecuting = true;

        try {
            const res = await globalFetch(`/api/equipments/${equipmentId}/upgrade`, { method: 'POST' });
            const data = res ? await res.json() : null;
            if (!res || !res.ok) {
                if (window.showNotif) showNotif(data?.error || "Échec de l'éveil.", true);
                return;
            }

            if (window.showNotif) {
                showNotif(`${data.equipmentName} éveillé au palier +${data.currentLevel} !`, false);
            }
            if (window.checkAuthStatus) await window.checkAuthStatus();
            if (callbacks && typeof callbacks.onAfterUpgrade === 'function') {
                await callbacks.onAfterUpgrade();
            }
            await loadUserEquipments();

            const listEl = document.getElementById('awakeningEquipList');
            if (listEl) renderEquipmentsList(listEl, callbacks);
            await selectEquipment(equipmentId, callbacks);

            if (window.GrimoireTutorial && window.GrimoireTutorial.isActive()) {
                const step = window.GrimoireTutorial.getCurrentStep();
                if (step && step.phase === 'AWAKENING') {
                    window.GrimoireTutorial.complete(true);
                }
            }
        } catch (e) {
            if (window.showNotif) showNotif("Erreur réseau durant l'éveil.", true);
        } finally {
            awakeningState.isExecuting = false;
        }
    }

    async function renderWorkspace(host, options) {
        if (!host) return;
        const { unlockedAwakening, allRecipes, selectedRecipe, preselectedEquipId, onSelectRecipe, onAfterUpgrade } = options;

        if (!unlockedAwakening) {
            renderLockedView(host);
            return;
        }

        const callbacks = { onAfterUpgrade };
        await loadUserEquipments();

        host.textContent = '';

        // Panneau gauche : Équipements éligibles + Catalyseurs & Éveils
        const leftPanel = createEl('div', 'awakening-left-panel custom-scrollbar');

        const eqHeader = createEl('h3', 'awakening-section-title');
        eqHeader.appendChild(createEl('span', '', 'Équipements éligibles'));
        eqHeader.appendChild(createEl('span', 'material-symbols-outlined text-base', 'shield'));
        leftPanel.appendChild(eqHeader);

        const equipListEl = createEl('div', 'flex flex-col gap-2');
        equipListEl.id = 'awakeningEquipList';
        leftPanel.appendChild(equipListEl);

        const catSection = createEl('div', 'flex flex-col gap-2 mt-2');
        catSection.id = 'awakeningCatalystsPanel';

        const catHeader = createEl('h3', 'awakening-section-title');
        catHeader.appendChild(createEl('span', '', 'Catalyseurs & Éveils'));
        catHeader.appendChild(createEl('span', 'material-symbols-outlined text-base', 'bolt'));
        catSection.appendChild(catHeader);

        const filterPills = createEl('div', 'awakening-filter-pills');
        [
            { key: 'ALL', label: 'Tous' },
            { key: 'GIVE_CATALYST', label: 'Catalyseurs' },
            { key: 'GIVE_AWAKENING', label: 'Éveils' }
        ].forEach(f => {
            const pill = createEl(
                'button',
                `awakening-filter-pill ${awakeningState.craftFilter === f.key ? 'is-active' : ''}`,
                f.label
            );
            pill.type = 'button';
            pill.addEventListener('click', () => {
                awakeningState.craftFilter = f.key;
                filterPills.querySelectorAll('.awakening-filter-pill').forEach(p => p.classList.remove('is-active'));
                pill.classList.add('is-active');
                renderAwakeningRecipesList(recipesListEl, allRecipes, selectedRecipe, onSelectRecipe);
            });
            filterPills.appendChild(pill);
        });
        catSection.appendChild(filterPills);

        const searchInput = createEl('input', 'form-control text-xs');
        searchInput.type = 'text';
        searchInput.placeholder = 'Filtrer catalyseur ou anomalie d\'éveil...';
        searchInput.value = awakeningState.searchTerm;
        searchInput.addEventListener('input', () => {
            awakeningState.searchTerm = searchInput.value.trim().toLowerCase();
            renderAwakeningRecipesList(recipesListEl, allRecipes, selectedRecipe, onSelectRecipe);
        });
        catSection.appendChild(searchInput);

        const recipesListEl = createEl('div', 'flex flex-col gap-2');
        recipesListEl.id = 'awakeningRecipesList';
        catSection.appendChild(recipesListEl);

        leftPanel.appendChild(catSection);

        // Panneau droit : Aperçu Éveil ou Chaudron
        const rightPanel = createEl('div', 'alchemy-panel awakening-right-panel custom-scrollbar');
        rightPanel.id = 'awakeningRightPanel';
        rightPanel.appendChild(
            createEl(
                'p',
                'alchemy-empty-state my-auto',
                "Sélectionnez un équipement éligible pour prévisualiser son éveil, ou un Catalyseur / Anomalie d'Éveil à forger."
            )
        );

        host.appendChild(leftPanel);
        host.appendChild(rightPanel);

        if (preselectedEquipId) {
            awakeningState.selectedEquipmentId = Number(preselectedEquipId);
        }

        renderEquipmentsList(equipListEl, callbacks);
        renderAwakeningRecipesList(recipesListEl, allRecipes, selectedRecipe, onSelectRecipe);

        if (awakeningState.selectedEquipmentId) {
            await selectEquipment(awakeningState.selectedEquipmentId, callbacks);
        }
    }

    window.AlchemyAwakening = {
        renderWorkspace,
        selectEquipment,
        renderRecipesOnly: (allRecipes, selectedRecipe, onSelectRecipe) => {
            const el = document.getElementById('awakeningRecipesList');
            if (el) renderAwakeningRecipesList(el, allRecipes, selectedRecipe, onSelectRecipe);
        },
        refreshEquipmentsOnly: async (callbacks) => {
            await loadUserEquipments();
            const el = document.getElementById('awakeningEquipList');
            if (el) renderEquipmentsList(el, callbacks || {});
        }
    };
})();
