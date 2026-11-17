// Module dédié à l'Onglet 2 d'Alchimie : Catalyseurs, Anomalies d'Éveil et Atelier d'Éveil (+0 à +5)
(function () {
    const awakeningState = {
        userEquipments: [],
        anomalyTemplatesByName: new Map(),
        selectedEquipmentId: null,
        selectedSimulation: null,
        leftSubTab: 'equipments',
        craftFilter: 'ALL',
        craftSpiritFilter: 'ALL',
        searchTerm: '',
        equipSearchTerm: '',
        equipLevelFilter: 'ALL',
        equipRarityFilter: 'ALL',
        equipSlotFilter: 'ALL',
        equipSpiritFilter: 'ALL',
        isExecuting: false,
        userGold: 0
    };

    const SPIRIT_DEFS = [
        { key: 'CONVICTION',    label: 'Conviction',    icon: 'volcano' },
        { key: 'SURETE',        label: 'Sûreté',        icon: 'water_drop' },
        { key: 'RAISON',        label: 'Raison',        icon: 'psychology' },
        { key: 'VIOLENCE',      label: 'Violence',      icon: 'explosion' },
        { key: 'TRAHISON',      label: 'Trahison',      icon: 'visibility_off' },
        { key: 'CONSOLIDATION', label: 'Consolidation', icon: 'foundation' },
        { key: 'DESTRUCTION',   label: 'Destruction',   icon: 'local_fire_department' },
        { key: 'CREATION',      label: 'Création',      icon: 'eco' },
        { key: 'KARMA',         label: 'Karma',         icon: 'all_inclusive' },
        { key: 'ESPRIT',        label: 'Esprit',        icon: 'blur_on' },
        { key: 'TENEBRES',      label: 'Ténèbres',      icon: 'dark_mode' },
        { key: 'UNIVERSEL',     label: 'Universel',     icon: 'public' }
    ];

    const SPIRIT_DEF_MAP = Object.fromEntries(SPIRIT_DEFS.map(d => [d.key, d]));

    const SECRET_TO_SPIRIT = {
        'SECRET DU CHAOS': 'DESTRUCTION',
        'SECRET DU DESTIN': 'KARMA',
        "SECRET DE L'ETHER": 'ESPRIT',
        'SECRET DES ABYSSES': 'TENEBRES',
        "SECRET DE L'ABONDANCE": 'CREATION',
        'SECRET DE LA PRESERVATION': 'CONSOLIDATION',
        'SECRET DE LA SERENITE': 'SURETE',
        'SECRET DE LA CHASSE': 'TRAHISON',
        'SECRET DU CARNAGE': 'VIOLENCE',
        'SECRET DE LA JOIE': 'CONVICTION',
        'SECRET DU SAVOIR': 'RAISON',
        'VOIE CONVICTION': 'CONVICTION',
        'VOIE SURETE': 'SURETE',
        'VOIE RAISON': 'RAISON',
        'VOIE VIOLENCE': 'VIOLENCE',
        'VOIE TRAHISON': 'TRAHISON',
        'VOIE CONSOLIDATION': 'CONSOLIDATION'
    };

    function normalizeTextKey(val) {
        return String(val || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim()
            .toUpperCase();
    }

    function getSpiritDef(spKey) {
        const key = normalizeTextKey(spKey);
        return SPIRIT_DEF_MAP[key] || null;
    }

    function getSpiritClass(spKey) {
        const def = getSpiritDef(spKey);
        return def ? `awakening-spirit-${def.key.toLowerCase()}` : '';
    }

    function getSpiritFilterOptions() {
        const opts = [];
        SPIRIT_DEFS.forEach(d => {
            const spCls = getSpiritClass(d.key);
            opts.push({
                value: d.key,
                label: d.label,
                icon: d.icon,
                iconClass: `awakening-spirit-icon ${spCls}`,
                toneClass: spCls
            });
        });
        return opts;
    }

    function resolveEquipmentSpiritKey(eq) {
        if (!eq || !eq.requiredSecret) return 'UNIVERSEL';
        const norm = normalizeTextKey(eq.requiredSecret);
        if (!norm) return 'UNIVERSEL';
        if (SECRET_TO_SPIRIT[norm]) return SECRET_TO_SPIRIT[norm];
        for (const d of SPIRIT_DEFS) {
            if (norm.includes(d.key)) return d.key;
        }
        return 'OTHER';
    }

    function resolveRecipeSpiritKey(recipe) {
        if (!recipe) return '';
        const tmpl = awakeningState.anomalyTemplatesByName.get(String(recipe.rewardName || '').trim().toLowerCase());
        return tmpl?.spiritualite ? normalizeTextKey(tmpl.spiritualite) : '';
    }

    function syncAnomalyTemplatesMap(templates) {
        if (!Array.isArray(templates) || templates.length === 0) return;
        const map = new Map();
        templates.forEach(t => {
            if (t && t.name) map.set(String(t.name).trim().toLowerCase(), t);
        });
        awakeningState.anomalyTemplatesByName = map;
    }

    async function ensureAnomalyTemplatesLoaded(providedTemplates) {
        if (Array.isArray(providedTemplates) && providedTemplates.length > 0) {
            syncAnomalyTemplatesMap(providedTemplates);
            return;
        }
        if (awakeningState.anomalyTemplatesByName.size > 0) return;
        try {
            const res = await globalFetch('/api/anomalies/all-templates');
            if (res && res.ok) {
                const list = await res.json();
                syncAnomalyTemplatesMap(list);
            }
        } catch (e) {
            console.error('Erreur chargement templates anomalies pour éveil:', e);
        }
    }

    const ELIGIBLE_RARITIES_FALLBACK = [
        { name: 'LEGENDAIRE', label: 'Légendaire' },
        { name: 'EPIQUE', label: 'Épique' },
        { name: 'RELIQUE', label: 'Relique' },
        { name: 'MAUDIT', label: 'Maudit' }
    ];

    const RARITY_VISUALS = {
        LEGENDAIRE: { icon: 'workspace_premium', iconClass: 'text-warning' },
        EPIQUE: { icon: 'whatshot', iconClass: 'text-crit' },
        RELIQUE: { icon: 'webhook', iconClass: 'text-power' },
        MAUDIT: { icon: 'skull', iconClass: 'text-maudit' }
    };

    const SLOT_VISUALS = {
        CASQUE: { icon: 'masks', iconClass: 'flip-icon text-power' },
        PLASTRON: { icon: 'shield', iconClass: 'text-mana' },
        ANNEAU: { icon: 'diamond', iconClass: 'text-warning' },
        ANNEAU_GAUCHE: { icon: 'diamond', iconClass: 'text-warning' },
        ANNEAU_DROIT: { icon: 'diamond', iconClass: 'text-warning' },
        BOTTES: { icon: 'footprint', iconClass: 'text-success' },
        CAPE: { icon: 'carpenter', iconClass: 'text-pv' },
        ARME: { icon: 'swords', iconClass: 'text-crit' },
        ARME_DEUX_MAINS: { icon: 'swords', iconClass: 'text-crit' },
        ARME_GAUCHE: { icon: 'colorize', iconClass: 'text-crit' },
        ARME_DROITE: { icon: 'security', iconClass: 'text-crit' }
    };

    function getEligibleRarityOptions() {
        const eligibleKeys = new Set(['LEGENDAIRE', 'EPIQUE', 'RELIQUE', 'MAUDIT']);
        const metaList = window.GRIMOIRE_META?.equipmentRarities;
        const rawList = (Array.isArray(metaList) && metaList.length > 0)
            ? metaList.filter(r => r && eligibleKeys.has(r.name))
            : ELIGIBLE_RARITIES_FALLBACK;
        return (rawList.length > 0 ? rawList : ELIGIBLE_RARITIES_FALLBACK).map(r => {
            const vis = RARITY_VISUALS[r.name] || { icon: 'star', iconClass: 'text-muted' };
            return {
                value: r.name,
                label: r.label,
                icon: vis.icon,
                iconClass: vis.iconClass,
                toneClass: `awakening-tone-${r.name.toLowerCase()}`
            };
        });
    }

    function getEligibleSlotOptions() {
        const slotLabels = window.SLOT_LABELS || {};
        const defs = [
            { value: 'CASQUE', fallback: 'Casque' },
            { value: 'PLASTRON', fallback: 'Plastron' },
            { value: 'ANNEAU', fallback: 'Anneau' },
            { value: 'BOTTES', fallback: 'Bottes' },
            { value: 'CAPE', fallback: 'Cape' },
            { value: 'ARME', fallback: 'Armes', exactLabel: 'Armes' },
            { value: 'ARME_DEUX_MAINS', fallback: 'Arme 2M' },
            { value: 'ARME_GAUCHE', fallback: 'Arme 1M' },
            { value: 'ARME_DROITE', fallback: 'Arme Sec.' }
        ];
        return defs.map(d => {
            const vis = SLOT_VISUALS[d.value] || { icon: 'category', iconClass: 'text-muted' };
            return {
                value: d.value,
                label: d.exactLabel || slotLabels[d.value]?.label || d.fallback,
                icon: vis.icon,
                iconClass: vis.iconClass,
                toneClass: 'awakening-tone-slot'
            };
        });
    }

    function matchesSlotFilter(eq, filterVal) {
        if (!filterVal || filterVal === 'ALL') return true;
        const slotKey = typeof eq.slot === 'object' ? (eq.slot?.name || '') : String(eq.slot || '');
        if (filterVal === 'ANNEAU') {
            return slotKey === 'ANNEAU' || slotKey === 'ANNEAU_GAUCHE' || slotKey === 'ANNEAU_DROIT';
        }
        if (filterVal === 'ARME') {
            return slotKey === 'ARME' || slotKey === 'ARME_GAUCHE' || slotKey === 'ARME_DROITE' || slotKey === 'ARME_DEUX_MAINS';
        }
        return slotKey === filterVal;
    }

    const FALLBACK_RARITY_ORDER = {
        COMMUN: 0,
        INHABITUEL: 1,
        RARE: 2,
        MYTHIQUE: 3,
        LEGENDAIRE: 4,
        EPIQUE: 5,
        RELIQUE: 6,
        MAUDIT: 7
    };

    function getEquipmentRarityKey(eq) {
        if (!eq || !eq.rarity) return '';
        return typeof getRarityName === 'function'
            ? (getRarityName(eq.rarity) || '')
            : (typeof eq.rarity === 'object' ? (eq.rarity.name || '') : String(eq.rarity));
    }

    function getEquipmentRarityRank(eq) {
        const key = getEquipmentRarityKey(eq).toUpperCase();
        const metaList = window.GRIMOIRE_META?.equipmentRarities;
        if (Array.isArray(metaList) && metaList.length > 0) {
            const idx = metaList.findIndex(r => r && r.name === key);
            if (idx >= 0) return idx;
        }
        return FALLBACK_RARITY_ORDER[key] ?? -1;
    }

    function getEquipmentSlotLabel(eq) {
        if (!eq || !eq.slot) return 'Objet';
        const key = typeof eq.slot === 'object' ? (eq.slot.name || '') : String(eq.slot);
        return window.SLOT_LABELS?.[key]?.label || eq.slot?.label || key || 'Objet';
    }

    function compareEquipments(a, b) {
        const readyDiff = (b.upgradeReady ? 1 : 0) - (a.upgradeReady ? 1 : 0);
        if (readyDiff !== 0) return readyDiff;
        const lvlDiffDesc = (Number(b.upgradeLevel) || 0) - (Number(a.upgradeLevel) || 0);
        if (lvlDiffDesc !== 0) return lvlDiffDesc;
        const rarityDiffDesc = getEquipmentRarityRank(b) - getEquipmentRarityRank(a);
        if (rarityDiffDesc !== 0) return rarityDiffDesc;
        return (a.name || '').localeCompare(b.name || '', 'fr', { sensitivity: 'base' });
    }

    function buildOptionContent(opt) {
        const frag = document.createDocumentFragment();
        if (opt.icon) {
            const iconSpan = createEl('span', `material-symbols-outlined cs-icon ${opt.iconClass || 'text-muted'}`, opt.icon);
            frag.appendChild(iconSpan);
        }
        frag.appendChild(createEl('span', 'awakening-cs-text', opt.label));
        return frag;
    }

    function applyWrapperToneClass(wrapper, options, value, baseToneClass) {
        const allTones = new Set();
        if (baseToneClass) allTones.add(baseToneClass);
        options.forEach(o => { if (o.toneClass) allTones.add(o.toneClass); });
        allTones.forEach(cls => wrapper.classList.remove(cls));

        const chosen = options.find(o => o.value === value);
        const activeTone = chosen?.toneClass || baseToneClass;
        if (activeTone) wrapper.classList.add(activeTone);

        wrapper.querySelectorAll('.custom-option').forEach(el => {
            el.classList.toggle('selected', el.getAttribute('data-value') === String(value));
        });
    }

    function createCustomComboSelect(id, ariaLabel, options, currentValue, onChange, extraClass, baseToneClass) {
        const wrapper = createEl('div', `custom-select-wrapper awakening-custom-select ${extraClass || ''}`.trim());
        wrapper.tabIndex = 0;

        const activeOpt = options.find(o => o.value === currentValue) || options[0];

        const trigger = createEl('div', 'custom-select-trigger');
        trigger.setAttribute('aria-label', ariaLabel);
        const labelSpan = createEl('span', 'cs-label');
        if (activeOpt) labelSpan.appendChild(buildOptionContent(activeOpt));
        const arrow = createEl('span', 'material-symbols-outlined cs-arrow text-muted', 'expand_more');
        trigger.appendChild(labelSpan);
        trigger.appendChild(arrow);

        const listEl = createEl('div', 'custom-select-options custom-scrollbar');
        options.forEach(opt => {
            const cls = [
                'custom-option',
                opt.toneClass || '',
                opt.value === currentValue ? 'selected' : ''
            ].filter(Boolean).join(' ');
            const optEl = createEl('div', cls);
            optEl.setAttribute('data-value', opt.value);
            optEl.appendChild(buildOptionContent(opt));
            listEl.appendChild(optEl);
        });

        const hiddenInput = document.createElement('input');
        hiddenInput.type = 'hidden';
        hiddenInput.id = id;
        hiddenInput.value = currentValue;
        hiddenInput.addEventListener('change', () => {
            applyWrapperToneClass(wrapper, options, hiddenInput.value, baseToneClass);
            onChange(hiddenInput.value);
        });

        wrapper.appendChild(trigger);
        wrapper.appendChild(listEl);
        wrapper.appendChild(hiddenInput);
        applyWrapperToneClass(wrapper, options, currentValue, baseToneClass);
        return wrapper;
    }

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
        const allEligible = awakeningState.userEquipments.filter(eq => eq && eq.upgradeEligible);

        if (allEligible.length === 0) {
            const empty = createEl(
                'p',
                'text-xs text-muted italic p-2',
                'Aucun équipement éligible (Légendaire, Épique, Relique ou Maudit requis).'
            );
            container.appendChild(empty);
            return;
        }

        const query = awakeningState.equipSearchTerm;
        const lvlFilter = awakeningState.equipLevelFilter;
        const rarityFilter = awakeningState.equipRarityFilter;
        const slotFilter = awakeningState.equipSlotFilter;
        const spiritFilter = awakeningState.equipSpiritFilter;

        const filtered = allEligible.filter(eq => {
            if (lvlFilter !== 'ALL' && Number(eq.upgradeLevel || 0) !== Number(lvlFilter)) {
                return false;
            }
            if (rarityFilter !== 'ALL' && getEquipmentRarityKey(eq).toUpperCase() !== rarityFilter) {
                return false;
            }
            if (!matchesSlotFilter(eq, slotFilter)) {
                return false;
            }
            if (spiritFilter !== 'ALL' && resolveEquipmentSpiritKey(eq) !== spiritFilter) {
                return false;
            }
            if (!query) return true;
            const spLabel = getSpiritDef(resolveEquipmentSpiritKey(eq))?.label || '';
            const haystacks = [
                eq.name,
                getEquipmentSlotLabel(eq),
                eq.requiredSecret,
                spLabel,
                eq.personnage?.name
            ];
            return haystacks.some(v => v && String(v).toLowerCase().includes(query));
        });

        filtered.sort(compareEquipments);

        if (filtered.length === 0) {
            container.appendChild(createEl('p', 'text-xs text-muted italic p-2', 'Aucun équipement correspondant.'));
            return;
        }

        filtered.forEach(eq => {
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
            const rarityKey = getEquipmentRarityKey(eq).toUpperCase();
            const rarityVis = RARITY_VISUALS[rarityKey] || { icon: 'star', iconClass: 'text-muted' };
            card.classList.add(`awakening-equip-rarity-${rarityKey.toLowerCase()}`);
            nameWrap.appendChild(createEl('span', `material-symbols-outlined text-sm shrink-0 ${rarityVis.iconClass}`, rarityVis.icon));
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

            const metaRow = createEl('div', 'flex items-center justify-between gap-2 text-xs text-muted');
            const slotKey = typeof eq.slot === 'object' ? (eq.slot?.name || '') : String(eq.slot || '');
            const slotVis = SLOT_VISUALS[slotKey] || { icon: 'category', iconClass: 'text-muted' };
            const slotLabel = getEquipmentSlotLabel(eq);
            const carrierText = eq.personnage?.name ? `Porté par ${eq.personnage.name}` : 'En coffre';
            const secretText = eq.requiredSecret || 'Universel (sans Secret)';
            const leftMeta = createEl('span', 'flex items-center gap-1 min-w-0 truncate');
            leftMeta.appendChild(createEl('span', `material-symbols-outlined text-xs ${slotVis.iconClass}`, slotVis.icon));
            leftMeta.appendChild(createEl('span', 'truncate', `${slotLabel} · ${carrierText}`));
            metaRow.appendChild(leftMeta);
            metaRow.appendChild(createEl('span', 'shrink-0', secretText));

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
            const spKey = resolveRecipeSpiritKey(r);
            if (awakeningState.craftSpiritFilter !== 'ALL' && spKey !== awakeningState.craftSpiritFilter) {
                return false;
            }
            if (awakeningState.searchTerm) {
                const spLabel = getSpiritDef(spKey)?.label || '';
                const text = `${r.name || ''} ${r.description || ''} ${spLabel}`.toLowerCase();
                if (!text.includes(awakeningState.searchTerm)) return false;
            }
            return true;
        });

        filtered.sort((a, b) => {
            const typeCmp = a.rewardType === b.rewardType ? 0 : (a.rewardType === 'GIVE_CATALYST' ? -1 : 1);
            const spA = getSpiritDef(resolveRecipeSpiritKey(a))?.label || '';
            const spB = getSpiritDef(resolveRecipeSpiritKey(b))?.label || '';
            const spCmp = spA.localeCompare(spB, 'fr', { sensitivity: 'base' });
            const nameCmp = (a.name || '').localeCompare(b.name || '', 'fr', { sensitivity: 'base' });
            return typeCmp || spCmp || nameCmp;
        });

        if (filtered.length === 0) {
            container.appendChild(createEl('p', 'text-xs text-muted italic p-2', 'Aucune recette correspondante.'));
            return;
        }

        filtered.forEach(r => {
            const isSelected = selectedRecipe && Number(selectedRecipe.id) === Number(r.id);
            const canCraft = typeof window.canCraftRecipe === 'function' ? window.canCraftRecipe(r) : false;
            const spKey = resolveRecipeSpiritKey(r);
            const spDef = getSpiritDef(spKey);
            const spClass = getSpiritClass(spKey);

            const classes = [
                'awakening-craft-item',
                spClass,
                isSelected ? 'is-selected' : '',
                canCraft ? 'craftable-pulse' : ''
            ].filter(Boolean).join(' ');

            const card = createEl('div', classes);
            card.addEventListener('click', () => {
                window.hideGlobalTooltip?.(true);
                awakeningState.selectedEquipmentId = null;
                onSelectRecipe(r, card);
            });

            const header = createEl('div', 'flex items-center justify-between gap-2');
            const rewardTmpl = awakeningState.anomalyTemplatesByName.get(String(r.rewardName || '').trim().toLowerCase());
            const catIcon = rewardTmpl?.category && typeof getCategoryIcon === 'function'
                ? getCategoryIcon(rewardTmpl.category)
                : 'star';
            const titleWrap = createEl('div', 'flex items-center gap-1.5 min-w-0');
            titleWrap.appendChild(createEl('span', `material-symbols-outlined text-base shrink-0 awakening-spirit-icon ${spClass}`, catIcon));
            const title = createEl('span', 'font-bold text-sm awakening-craft-title truncate', r.name);
            titleWrap.appendChild(title);
            attachAnomalyTooltip(titleWrap, rewardTmpl, r.rewardName || r.name, { keepPointerCursor: true, positionSide: true });

            const badgesWrap = createEl('div', 'flex items-center gap-1.5 shrink-0');
            if (spDef) {
                const spBadge = createEl('span', 'awakening-spirit-badge');
                spBadge.appendChild(createEl('span', 'material-symbols-outlined text-xs', spDef.icon));
                spBadge.appendChild(createEl('span', '', spDef.label));
                badgesWrap.appendChild(spBadge);
            }

            const isCat = r.rewardType === 'GIVE_CATALYST';
            const badge = createEl(
                'span',
                `awakening-status-pill ${isCat ? 'awakening-type-catalyst' : 'awakening-type-eveil'}`,
                isCat ? 'Catalyseur' : 'Éveil'
            );
            badgesWrap.appendChild(badge);

            header.appendChild(titleWrap);
            header.appendChild(badgesWrap);

            const desc = createEl('p', 'text-xs text-muted m-0', r.description || '');
            card.appendChild(header);
            card.appendChild(desc);
            container.appendChild(card);
        });
    }

    function attachAnomalyTooltip(el, tmpl, fallbackName, options = {}) {
        if (!el || !tmpl || typeof getAnomalyTooltipHTML !== 'function') return;
        const html = getAnomalyTooltipHTML(tmpl, fallbackName || tmpl.name);
        if (!html) return;
        const color = tmpl.spiritualite && typeof getSpiritualiteColor === 'function'
            ? getSpiritualiteColor(tmpl.spiritualite)
            : '#a855f7';
        if (!options.keepPointerCursor) {
            el.classList.add('cursor-help');
        }
        if (options.positionSide) {
            el.setAttribute('data-tooltip-position', 'side');
        }
        el.setAttribute('data-tooltip-html', html);
        el.setAttribute('data-color', color);
        el.addEventListener('mouseenter', () => window.showGlobalTooltip?.(el));
        el.addEventListener('mouseleave', () => window.hideGlobalTooltip?.());
    }

    function buildAwakeningAnomalyCostRow(name, typeLabel, owned, required) {
        const ok = owned >= required;
        const tmpl = awakeningState.anomalyTemplatesByName.get(String(name || '').trim().toLowerCase());
        const catIcon = tmpl?.category && typeof getCategoryIcon === 'function'
            ? getCategoryIcon(tmpl.category)
            : 'star';
        const spCls = tmpl?.spiritualite ? getSpiritClass(tmpl.spiritualite) : '';

        const row = createEl('div', `awakening-cost-row ${ok ? 'is-ok' : 'is-missing'}`);
        const left = createEl('div', 'flex items-center gap-2 min-w-0');
        left.appendChild(createEl('span', `material-symbols-outlined text-lg shrink-0 awakening-spirit-icon ${spCls}`, catIcon));
        left.appendChild(createEl('span', 'truncate', `${required}x ${name} (${typeLabel})`));

        const right = createEl('div', 'flex items-center gap-1.5 shrink-0 font-bold');
        right.appendChild(createEl('span', 'material-symbols-outlined text-base', ok ? 'check_circle' : 'cancel'));
        right.appendChild(createEl('span', '', `${owned} / ${required}`));

        row.appendChild(left);
        row.appendChild(right);
        attachAnomalyTooltip(row, tmpl, name);
        return row;
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
                costBox.appendChild(
                    buildAwakeningAnomalyCostRow(sim.catalystName, 'Catalyseur', sim.catalystOwned, sim.catalystRequired)
                );
            }

            if (sim.awakeningRequired > 0) {
                costBox.appendChild(
                    buildAwakeningAnomalyCostRow(sim.awakeningName, 'Éveil', sim.awakeningOwned, sim.awakeningRequired)
                );
            }

            const okGold = sim.userGold >= sim.goldCost;
            const goldRow = createEl('div', `awakening-cost-row ${okGold ? 'is-ok' : 'is-missing'}`);
            const goldLeft = createEl('div', 'flex items-center gap-2');
            goldLeft.appendChild(createEl('span', 'material-symbols-outlined text-amber-400 text-lg', 'monetization_on'));
            goldLeft.appendChild(createEl('span', '', 'Or requis'));
            const goldRight = createEl('div', 'flex items-center gap-1.5 font-bold');
            goldRight.appendChild(createEl('span', 'material-symbols-outlined text-base', okGold ? 'check_circle' : 'cancel'));
            goldRight.appendChild(createEl('span', '', `${Math.floor(sim.userGold)} / ${Math.round(sim.goldCost)} Or`));
            goldRow.appendChild(goldLeft);
            goldRow.appendChild(goldRight);
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
        const {
            unlockedAwakening,
            allRecipes,
            allAnomalyTemplates,
            selectedRecipe,
            preselectedEquipId,
            onSelectRecipe,
            onAfterUpgrade
        } = options;

        if (!unlockedAwakening) {
            renderLockedView(host);
            return;
        }

        const callbacks = { onAfterUpgrade };
        await Promise.all([
            loadUserEquipments(),
            ensureAnomalyTemplatesLoaded(allAnomalyTemplates)
        ]);

        if (preselectedEquipId) {
            awakeningState.selectedEquipmentId = Number(preselectedEquipId);
            awakeningState.leftSubTab = 'equipments';
        }

        host.textContent = '';

        // Panneau gauche : Sous-onglets Équipements éligibles / Catalyseurs & Éveils
        const leftPanel = createEl('div', 'awakening-left-panel');

        const subTabsBar = createEl('div', 'awakening-left-subtabs');
        const eqSubTabBtn = createEl('button', 'awakening-subtab-btn');
        eqSubTabBtn.type = 'button';
        eqSubTabBtn.dataset.subtab = 'equipments';
        eqSubTabBtn.appendChild(createEl('span', 'material-symbols-outlined text-base', 'shield'));
        eqSubTabBtn.appendChild(createEl('span', '', 'Équipements éligibles'));

        const recSubTabBtn = createEl('button', 'awakening-subtab-btn');
        recSubTabBtn.type = 'button';
        recSubTabBtn.dataset.subtab = 'recipes';
        recSubTabBtn.appendChild(createEl('span', 'material-symbols-outlined text-base', 'bolt'));
        recSubTabBtn.appendChild(createEl('span', '', 'Catalyseurs & Éveils'));

        subTabsBar.appendChild(eqSubTabBtn);
        subTabsBar.appendChild(recSubTabBtn);
        leftPanel.appendChild(subTabsBar);

        const equipSection = createEl('div', 'awakening-subtab-section');
        equipSection.id = 'awakeningEquipPanel';

        const equipControls = createEl('div', 'awakening-equip-controls');

        const equipSearchInput = createEl('input', 'form-control text-xs awakening-equip-search');
        equipSearchInput.id = 'awakeningEquipSearch';
        equipSearchInput.type = 'text';
        equipSearchInput.placeholder = 'Rechercher un équipement...';
        equipSearchInput.setAttribute('aria-label', 'Rechercher un équipement à éveiller');
        equipSearchInput.value = awakeningState.equipSearchTerm;
        equipSearchInput.addEventListener('input', () => {
            awakeningState.equipSearchTerm = equipSearchInput.value.trim().toLowerCase();
            renderEquipmentsList(equipListEl, callbacks);
        });

        const spiritFilterSelect = createCustomComboSelect(
            'awakeningFilterSecret',
            'Filtrer par voie ou spiritualité',
            [
                { value: 'ALL', label: 'Voies / Spirit.', icon: 'auto_awesome', iconClass: 'text-power' },
                ...getSpiritFilterOptions()
            ],
            awakeningState.equipSpiritFilter,
            val => {
                awakeningState.equipSpiritFilter = val || 'ALL';
                renderEquipmentsList(equipListEl, callbacks);
            },
            'awakening-sort-select-wrap',
            'awakening-tone-spirit'
        );

        equipControls.appendChild(equipSearchInput);
        equipControls.appendChild(spiritFilterSelect);
        equipSection.appendChild(equipControls);

        const equipFilters = createEl('div', 'awakening-equip-filters');

        const levelFilterSelect = createCustomComboSelect(
            'awakeningFilterLevel',
            'Filtrer par niveau d\'éveil',
            [
                { value: 'ALL', label: 'Éveil', icon: 'upgrade', iconClass: 'text-warning', toneClass: 'awakening-tone-level' },
                { value: '0', label: 'Niveau +0', icon: 'radio_button_unchecked', iconClass: 'text-muted', toneClass: 'awakening-tone-lvl-0' },
                { value: '1', label: 'Niveau +1', icon: 'looks_one', iconClass: 'text-success', toneClass: 'awakening-tone-lvl-1' },
                { value: '2', label: 'Niveau +2', icon: 'looks_two', iconClass: 'text-mana', toneClass: 'awakening-tone-lvl-2' },
                { value: '3', label: 'Niveau +3', icon: 'looks_3', iconClass: 'text-power', toneClass: 'awakening-tone-lvl-3' },
                { value: '4', label: 'Niveau +4', icon: 'looks_4', iconClass: 'text-warning', toneClass: 'awakening-tone-lvl-4' },
                { value: '5', label: 'Niveau +5', icon: 'looks_5', iconClass: 'text-crit', toneClass: 'awakening-tone-lvl-5' }
            ],
            awakeningState.equipLevelFilter,
            val => {
                awakeningState.equipLevelFilter = val || 'ALL';
                renderEquipmentsList(equipListEl, callbacks);
            },
            '',
            'awakening-tone-level'
        );

        const rarityFilterSelect = createCustomComboSelect(
            'awakeningFilterRarity',
            'Filtrer par rareté',
            [
                { value: 'ALL', label: 'Raretés', icon: 'stars', iconClass: 'text-power' },
                ...getEligibleRarityOptions()
            ],
            awakeningState.equipRarityFilter,
            val => {
                awakeningState.equipRarityFilter = val || 'ALL';
                renderEquipmentsList(equipListEl, callbacks);
            },
            '',
            'awakening-tone-rarity'
        );

        const slotFilterSelect = createCustomComboSelect(
            'awakeningFilterSlot',
            'Filtrer par type d\'item',
            [
                { value: 'ALL', label: 'Types', icon: 'category', iconClass: 'text-mana' },
                ...getEligibleSlotOptions()
            ],
            awakeningState.equipSlotFilter,
            val => {
                awakeningState.equipSlotFilter = val || 'ALL';
                renderEquipmentsList(equipListEl, callbacks);
            },
            '',
            'awakening-tone-slot'
        );

        equipFilters.appendChild(levelFilterSelect);
        equipFilters.appendChild(rarityFilterSelect);
        equipFilters.appendChild(slotFilterSelect);
        equipSection.appendChild(equipFilters);

        const equipListEl = createEl('div', 'awakening-scroll-list custom-scrollbar');
        equipListEl.id = 'awakeningEquipList';
        equipSection.appendChild(equipListEl);
        leftPanel.appendChild(equipSection);

        const catSection = createEl('div', 'awakening-subtab-section');
        catSection.id = 'awakeningCatalystsPanel';

        const craftTopBar = createEl('div', 'awakening-craft-top-bar');

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

        const recipeSpiritSelect = createCustomComboSelect(
            'awakeningRecipeSpiritFilter',
            'Filtrer par voie ou spiritualité',
            [
                { value: 'ALL', label: 'Voies / Spirit.', icon: 'auto_awesome', iconClass: 'text-power' },
                ...getSpiritFilterOptions()
            ],
            awakeningState.craftSpiritFilter,
            val => {
                awakeningState.craftSpiritFilter = val || 'ALL';
                renderAwakeningRecipesList(recipesListEl, allRecipes, selectedRecipe, onSelectRecipe);
            },
            'awakening-craft-spirit-wrap',
            'awakening-tone-spirit'
        );

        craftTopBar.appendChild(filterPills);
        craftTopBar.appendChild(recipeSpiritSelect);
        catSection.appendChild(craftTopBar);

        const searchInput = createEl('input', 'form-control text-xs awakening-craft-search');
        searchInput.type = 'text';
        searchInput.placeholder = 'Filtrer catalyseur ou anomalie d\'éveil...';
        searchInput.value = awakeningState.searchTerm;
        searchInput.addEventListener('input', () => {
            awakeningState.searchTerm = searchInput.value.trim().toLowerCase();
            renderAwakeningRecipesList(recipesListEl, allRecipes, selectedRecipe, onSelectRecipe);
        });
        catSection.appendChild(searchInput);

        const recipesListEl = createEl('div', 'awakening-scroll-list custom-scrollbar');
        recipesListEl.id = 'awakeningRecipesList';
        catSection.appendChild(recipesListEl);

        leftPanel.appendChild(catSection);

        function applyLeftSubTab(tab) {
            const resolved = tab === 'recipes' ? 'recipes' : 'equipments';
            awakeningState.leftSubTab = resolved;
            eqSubTabBtn.classList.toggle('is-active', resolved === 'equipments');
            recSubTabBtn.classList.toggle('is-active', resolved === 'recipes');
            equipSection.classList.toggle('is-hidden', resolved !== 'equipments');
            catSection.classList.toggle('is-hidden', resolved !== 'recipes');
        }

        eqSubTabBtn.addEventListener('click', () => applyLeftSubTab('equipments'));
        recSubTabBtn.addEventListener('click', () => applyLeftSubTab('recipes'));
        applyLeftSubTab(awakeningState.leftSubTab);

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

        if (window.initGlobalCustomSelect) {
            window.initGlobalCustomSelect();
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
