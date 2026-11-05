// ============================================================
//  GRIMOIRE — Reusable Guided Tutorial Engine (tutorial.js)
//  100% SSOT-driven (steps loaded from /api/meta/tutorial-steps)
// ============================================================

(function () {
    const tutorialState = {
        active: false,
        phase: null,
        steps: [],
        currentIndex: 0,
        activeStepObj: null,
        popoverEl: null,
        badgeTextEl: null,
        iconEl: null,
        titleEl: null,
        descEl: null,
        dotsContainerEl: null,
        prevBtnEl: null,
        nextBtnEl: null,
        nextBtnLabelEl: null,
        actionHintEl: null,
        highlightedEl: null,
        boundCleanupFns: [],
        options: {}
    };

    async function ensureTutorialStepsLoaded() {
        const hasUpdatedSteps = (arr) =>
            Array.isArray(arr) && arr.some(s => s.name === 'DUNGEON_LOOT_SHIELD');

        if (hasUpdatedSteps(window.GRIMOIRE_TUTORIAL_STEPS)) {
            return window.GRIMOIRE_TUTORIAL_STEPS;
        }
        if (window.GRIMOIRE_META && hasUpdatedSteps(window.GRIMOIRE_META.tutorialSteps)) {
            window.GRIMOIRE_TUTORIAL_STEPS = window.GRIMOIRE_META.tutorialSteps;
            return window.GRIMOIRE_TUTORIAL_STEPS;
        }
        if (typeof window.globalFetch === 'function') {
            try {
                const res = await window.globalFetch('/api/meta/tutorial-steps', { silent: true });
                if (res && res.ok) {
                    const data = await res.json();
                    window.GRIMOIRE_TUTORIAL_STEPS = data || [];
                    return window.GRIMOIRE_TUTORIAL_STEPS;
                }
            } catch (e) {
                console.warn('Impossible de charger les étapes du tutoriel:', e);
            }
        }
        return window.GRIMOIRE_TUTORIAL_STEPS || [];
    }

    function buildPopoverDOM() {
        if (tutorialState.popoverEl && document.body.contains(tutorialState.popoverEl)) {
            return tutorialState.popoverEl;
        }

        const popover = document.createElement('div');
        popover.id = 'grimoireTutorialPopover';
        popover.className = 'tutorial-popover is-hidden';
        popover.setAttribute('popover', 'manual');
        popover.setAttribute('role', 'dialog');
        popover.setAttribute('aria-labelledby', 'grimoireTutorialTitle');

        const card = document.createElement('div');
        card.className = 'tutorial-popover-card';

        const arrow = document.createElement('div');
        arrow.className = 'tutorial-popover-arrow';

        // Header
        const header = document.createElement('div');
        header.className = 'tutorial-popover-header';

        const badge = document.createElement('div');
        badge.className = 'tutorial-popover-badge';
        const badgeIcon = document.createElement('span');
        badgeIcon.className = 'material-symbols-outlined icon-sm';
        badgeIcon.textContent = 'school';
        const badgeText = document.createElement('span');
        badgeText.textContent = 'Tutoriel';
        badge.appendChild(badgeIcon);
        badge.appendChild(badgeText);

        const skipBtn = document.createElement('button');
        skipBtn.type = 'button';
        skipBtn.className = 'tutorial-popover-skip';
        skipBtn.setAttribute('popovertarget', 'grimoireTutorialPopover');
        skipBtn.setAttribute('popovertargetaction', 'hide');
        const skipText = document.createElement('span');
        skipText.textContent = 'Passer';
        const skipIcon = document.createElement('span');
        skipIcon.className = 'material-symbols-outlined icon-sm';
        skipIcon.textContent = 'close';
        skipBtn.appendChild(skipText);
        skipBtn.appendChild(skipIcon);
        skipBtn.addEventListener('click', () => {
            completeTutorial(true);
        });

        header.appendChild(badge);
        header.appendChild(skipBtn);

        // Title Row
        const titleRow = document.createElement('div');
        titleRow.className = 'tutorial-popover-title-row';

        const iconBox = document.createElement('div');
        iconBox.className = 'tutorial-popover-icon';
        const iconSpan = document.createElement('span');
        iconSpan.className = 'material-symbols-outlined';
        iconSpan.textContent = 'auto_awesome';
        iconBox.appendChild(iconSpan);

        const titleH2 = document.createElement('h2');
        titleH2.id = 'grimoireTutorialTitle';
        titleH2.className = 'tutorial-popover-title';

        titleRow.appendChild(iconBox);
        titleRow.appendChild(titleH2);

        // Description
        const descP = document.createElement('p');
        descP.className = 'tutorial-popover-desc';

        // Footer
        const footer = document.createElement('div');
        footer.className = 'tutorial-popover-footer';

        const dots = document.createElement('div');
        dots.className = 'tutorial-progress-dots';

        const actions = document.createElement('div');
        actions.className = 'tutorial-popover-actions';

        const prevBtn = document.createElement('button');
        prevBtn.type = 'button';
        prevBtn.className = 'tutorial-btn-prev';
        const prevIcon = document.createElement('span');
        prevIcon.className = 'material-symbols-outlined icon-sm';
        prevIcon.textContent = 'chevron_left';
        prevBtn.appendChild(prevIcon);
        prevBtn.addEventListener('click', () => {
            prevStep();
        });

        const actionHint = document.createElement('div');
        actionHint.className = 'tutorial-action-hint is-hidden';
        const actionHintIcon = document.createElement('span');
        actionHintIcon.className = 'material-symbols-outlined icon-sm';
        actionHintIcon.textContent = 'touch_app';
        const actionHintText = document.createElement('span');
        actionHintText.textContent = 'Action requise';
        actionHint.appendChild(actionHintIcon);
        actionHint.appendChild(actionHintText);

        const nextBtn = document.createElement('button');
        nextBtn.type = 'button';
        nextBtn.className = 'tutorial-btn-next';
        const nextLabel = document.createElement('span');
        nextLabel.textContent = 'Suivant';
        const nextIcon = document.createElement('span');
        nextIcon.className = 'material-symbols-outlined icon-sm';
        nextIcon.textContent = 'arrow_forward';
        nextBtn.appendChild(nextLabel);
        nextBtn.appendChild(nextIcon);
        nextBtn.addEventListener('click', () => {
            handleNextButtonClick();
        });

        actions.appendChild(prevBtn);
        actions.appendChild(actionHint);
        actions.appendChild(nextBtn);

        footer.appendChild(dots);
        footer.appendChild(actions);

        card.appendChild(arrow);
        card.appendChild(header);
        card.appendChild(titleRow);
        card.appendChild(descP);
        card.appendChild(footer);
        popover.appendChild(card);
        document.body.appendChild(popover);

        tutorialState.popoverEl = popover;
        tutorialState.badgeTextEl = badgeText;
        tutorialState.iconEl = iconSpan;
        tutorialState.titleEl = titleH2;
        tutorialState.descEl = descP;
        tutorialState.dotsContainerEl = dots;
        tutorialState.prevBtnEl = prevBtn;
        tutorialState.nextBtnEl = nextBtn;
        tutorialState.nextBtnLabelEl = nextLabel;
        tutorialState.actionHintEl = actionHint;

        return popover;
    }

    function clearStepBindings() {
        if (tutorialState.activeStepObj && typeof tutorialState.options.onStepLeave === 'function') {
            try {
                tutorialState.options.onStepLeave(tutorialState.activeStepObj, tutorialState.currentIndex);
            } catch (_) {}
        }
        tutorialState.activeStepObj = null;

        while (tutorialState.boundCleanupFns.length > 0) {
            const fn = tutorialState.boundCleanupFns.pop();
            try { fn(); } catch (_) {}
        }
        if (tutorialState.highlightedEl) {
            tutorialState.highlightedEl.classList.remove('tutorial-target-highlight');
            tutorialState.highlightedEl = null;
        }
    }

    function resolveTargetElement(step) {
        if (!step) return null;
        if (typeof tutorialState.options.resolveTarget === 'function') {
            const customEl = tutorialState.options.resolveTarget(step);
            if (customEl) return customEl;
        }
        if (!step.targetSelector) return null;
        return document.querySelector(step.targetSelector);
    }

    function resolvePositionReference(step, targetEl) {
        if (typeof tutorialState.options.resolvePositionTarget === 'function') {
            const posEl = tutorialState.options.resolvePositionTarget(step, targetEl);
            if (posEl) return posEl;
        }
        return targetEl;
    }

    function positionPopoverAround(targetEl, preferredPlacement) {
        const popover = tutorialState.popoverEl;
        if (!popover || !targetEl) return;

        const rect = targetEl.getBoundingClientRect();
        if (rect.width === 0 && rect.height === 0) return;

        const popRect = popover.getBoundingClientRect();
        const popWidth = popRect.width || 340;
        const popHeight = popRect.height || 190;
        const gap = 16;
        const margin = 12;
        const vw = window.innerWidth;
        const vh = window.innerHeight;

        let placement = preferredPlacement || 'right';

        // Viewport collision detection & smart flipping
        if (placement === 'right' && rect.right + gap + popWidth > vw - margin) {
            if (rect.left - gap - popWidth >= margin) {
                placement = 'left';
            } else {
                placement = (rect.bottom + gap + popHeight <= vh - margin) ? 'bottom' : 'top';
            }
        } else if (placement === 'left' && rect.left - gap - popWidth < margin) {
            if (rect.right + gap + popWidth <= vw - margin) {
                placement = 'right';
            } else {
                placement = (rect.bottom + gap + popHeight <= vh - margin) ? 'bottom' : 'top';
            }
        } else if (placement === 'top' && rect.top - gap - popHeight < margin) {
            placement = 'bottom';
        } else if (placement === 'bottom' && rect.bottom + gap + popHeight > vh - margin) {
            placement = 'top';
        }

        popover.classList.remove('placement-right', 'placement-left', 'placement-top', 'placement-bottom');
        popover.classList.add('placement-' + placement);

        let left = margin;
        let top = margin;

        if (placement === 'right') {
            left = rect.right + gap;
            top = rect.top + Math.min(0, (rect.height - 60) / 2);
        } else if (placement === 'left') {
            left = rect.left - popWidth - gap;
            top = rect.top + Math.min(0, (rect.height - 60) / 2);
        } else if (placement === 'top') {
            left = rect.left + (rect.width - popWidth) / 2;
            top = rect.top - popHeight - gap;
        } else {
            left = rect.left + (rect.width - popWidth) / 2;
            top = rect.bottom + gap;
        }

        left = Math.max(margin, Math.min(left, vw - popWidth - margin));
        top = Math.max(margin, Math.min(top, vh - popHeight - margin));

        popover.style.left = Math.round(left) + 'px';
        popover.style.top = Math.round(top) + 'px';
    }

    function renderDots() {
        const container = tutorialState.dotsContainerEl;
        if (!container) return;
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }
        tutorialState.steps.forEach((_, idx) => {
            const dot = document.createElement('span');
            dot.className = 'tutorial-dot';
            if (idx === tutorialState.currentIndex) {
                dot.classList.add('is-active');
            } else if (idx < tutorialState.currentIndex) {
                dot.classList.add('is-completed');
            }
            container.appendChild(dot);
        });
    }

    function isPrevAllowed(step, index) {
        if (index <= 0) return false;
        if (typeof tutorialState.options.canPrev === 'function') {
            return Boolean(tutorialState.options.canPrev(step, index));
        }
        return true;
    }

    function isNextButtonVisible(step, index) {
        if (typeof tutorialState.options.canNext === 'function') {
            const res = tutorialState.options.canNext(step, index);
            if (typeof res === 'boolean') return res;
        }
        return step.advanceTrigger !== 'action';
    }

    function attachStepListeners(step, targetEl) {
        const actionEl = step.actionTargetSelector
            ? document.querySelector(step.actionTargetSelector)
            : targetEl;

        if (!actionEl) return;

        if (step.advanceTrigger === 'input') {
            const onKeydown = (e) => {
                if (e.key === 'Enter' && actionEl.value && actionEl.value.trim().length > 0) {
                    e.preventDefault();
                    nextStep();
                }
            };
            actionEl.addEventListener('keydown', onKeydown);
            tutorialState.boundCleanupFns.push(() => actionEl.removeEventListener('keydown', onKeydown));
        } else if (step.advanceTrigger === 'change') {
            const onChange = () => {
                if (actionEl.value && String(actionEl.value).trim() !== '') {
                    setTimeout(() => {
                        if (tutorialState.active && tutorialState.steps[tutorialState.currentIndex] === step) {
                            nextStep();
                        }
                    }, 220);
                }
            };
            actionEl.addEventListener('change', onChange);
            tutorialState.boundCleanupFns.push(() => actionEl.removeEventListener('change', onChange));
        }
    }

    function renderCurrentStep() {
        if (!tutorialState.active || tutorialState.steps.length === 0) return;

        clearStepBindings();
        const step = tutorialState.steps[tutorialState.currentIndex];
        if (!step) return;

        tutorialState.activeStepObj = step;
        if (typeof tutorialState.options.onStepEnter === 'function') {
            try {
                tutorialState.options.onStepEnter(step, tutorialState.currentIndex);
            } catch (_) {}
        }

        const popover = buildPopoverDOM();
        const targetEl = resolveTargetElement(step);

        if (!targetEl) {
            return;
        }

        tutorialState.highlightedEl = targetEl;
        targetEl.classList.add('tutorial-target-highlight');

        // Scroll into view smoothly if outside viewport
        const tRect = targetEl.getBoundingClientRect();
        if (tRect.top < 70 || tRect.bottom > window.innerHeight - 70) {
            targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        // Populate text via textContent (XSS-safe)
        tutorialState.badgeTextEl.textContent = `Étape ${tutorialState.currentIndex + 1} / ${tutorialState.steps.length}`;
        tutorialState.iconEl.textContent = step.icon || 'auto_awesome';
        tutorialState.titleEl.textContent = step.label || '';
        tutorialState.descEl.textContent = step.description || '';

        if (isPrevAllowed(step, tutorialState.currentIndex)) {
            tutorialState.prevBtnEl.classList.remove('is-hidden');
        } else {
            tutorialState.prevBtnEl.classList.add('is-hidden');
        }

        const showNextBtn = isNextButtonVisible(step, tutorialState.currentIndex);
        if (showNextBtn) {
            tutorialState.nextBtnEl.classList.remove('is-hidden');
            tutorialState.actionHintEl.classList.add('is-hidden');

            const isLast = tutorialState.currentIndex === tutorialState.steps.length - 1;
            if (step.advanceTrigger === 'submit') {
                tutorialState.nextBtnLabelEl.textContent = 'Forger';
            } else if (isLast) {
                tutorialState.nextBtnLabelEl.textContent = 'Compris !';
            } else {
                tutorialState.nextBtnLabelEl.textContent = 'Suivant';
            }
        } else {
            tutorialState.nextBtnEl.classList.add('is-hidden');
            tutorialState.actionHintEl.classList.remove('is-hidden');
        }

        renderDots();

        popover.classList.remove('is-hidden');
        popover.classList.add('is-visible');
        if (typeof popover.showPopover === 'function') {
            try {
                if (!popover.matches(':popover-open')) {
                    popover.showPopover();
                }
            } catch (_) {}
        }

        const posRefEl = resolvePositionReference(step, targetEl);
        positionPopoverAround(posRefEl, step.placement);
        requestAnimationFrame(() => {
            const updatedRef = resolvePositionReference(step, targetEl);
            positionPopoverAround(updatedRef, step.placement);
        });

        // Programmatic focus management (per persistent-app-tours guidance)
        if (step.advanceTrigger === 'input' && typeof targetEl.focus === 'function') {
            targetEl.focus({ preventScroll: true });
        } else if (showNextBtn && tutorialState.nextBtnEl && typeof tutorialState.nextBtnEl.focus === 'function') {
            tutorialState.nextBtnEl.focus({ preventScroll: true });
        }

        attachStepListeners(step, targetEl);
    }

    function pulseAttention(el) {
        if (!el) return;
        el.classList.remove('tutorial-input-Attention');
        void el.offsetWidth;
        el.classList.add('tutorial-input-Attention');
        if (typeof el.focus === 'function') el.focus();
    }

    function handleNextButtonClick() {
        const step = tutorialState.steps[tutorialState.currentIndex];
        if (!step) return;

        if (typeof tutorialState.options.onBeforeNext === 'function') {
            const allow = tutorialState.options.onBeforeNext(step, tutorialState.currentIndex);
            if (allow === false) {
                pulseAttention(tutorialState.highlightedEl);
                return;
            }
        }

        if (step.advanceTrigger === 'submit') {
            const submitEl = document.querySelector(step.actionTargetSelector || step.targetSelector);
            if (submitEl && typeof submitEl.click === 'function') {
                submitEl.click();
            }
            return;
        }

        if (tutorialState.currentIndex < tutorialState.steps.length - 1) {
            nextStep();
        } else {
            completeTutorial(tutorialState.phase === 'DUNGEON');
        }
    }

    function nextStep() {
        if (!tutorialState.active) return;
        if (tutorialState.currentIndex < tutorialState.steps.length - 1) {
            tutorialState.currentIndex++;
            renderCurrentStep();
        }
    }

    function prevStep() {
        if (!tutorialState.active) return;
        const step = tutorialState.steps[tutorialState.currentIndex];
        if (!isPrevAllowed(step, tutorialState.currentIndex)) return;
        if (tutorialState.currentIndex > 0) {
            tutorialState.currentIndex--;
            renderCurrentStep();
        }
    }

    function goToStepByName(stepName) {
        if (!tutorialState.active) return;
        const idx = tutorialState.steps.findIndex(s => s.name === stepName);
        if (idx !== -1) {
            tutorialState.currentIndex = idx;
            renderCurrentStep();
        }
    }

    function stopTutorial() {
        const stopCb = tutorialState.options && tutorialState.options.onStop;
        tutorialState.active = false;
        clearStepBindings();
        if (typeof stopCb === 'function') {
            try { stopCb(); } catch (_) {}
        }
        if (tutorialState.popoverEl) {
            tutorialState.popoverEl.classList.remove('is-visible');
            tutorialState.popoverEl.classList.add('is-hidden');
            if (typeof tutorialState.popoverEl.hidePopover === 'function') {
                try { tutorialState.popoverEl.hidePopover(); } catch (_) {}
            }
        }
    }

    async function completeTutorial(markOnServer = true) {
        stopTutorial();
        if (window.currentUser) {
            window.currentUser.tutorialCompleted = true;
            window.currentUser.tutorialPhase = 'NONE';
        }
        if (markOnServer && typeof window.globalFetch === 'function') {
            try {
                await window.globalFetch('/api/auth/tutorial/complete', {
                    method: 'POST',
                    silent: true
                });
            } catch (_) {}
        }
    }

    async function startPhase(phaseName, options = {}) {
        const allSteps = await ensureTutorialStepsLoaded();
        const phaseSteps = allSteps
            .filter(s => s.phase === phaseName)
            .sort((a, b) => (parseInt(a.stepOrder, 10) || 0) - (parseInt(b.stepOrder, 10) || 0));

        if (phaseSteps.length === 0) return;

        tutorialState.phase = phaseName;
        tutorialState.steps = phaseSteps;
        tutorialState.currentIndex = 0;
        tutorialState.options = options || {};
        tutorialState.active = true;

        renderCurrentStep();
    }

    function repositionActivePopover() {
        if (!tutorialState.active || !tutorialState.highlightedEl) return;
        const step = tutorialState.steps[tutorialState.currentIndex];
        if (!step) return;
        const posRefEl = resolvePositionReference(step, tutorialState.highlightedEl);
        positionPopoverAround(posRefEl, step.placement);
    }

    window.addEventListener('resize', repositionActivePopover, { passive: true });
    window.addEventListener('scroll', repositionActivePopover, { passive: true, capture: true });

    window.GrimoireTutorial = {
        startPhase,
        goToStepByName,
        next: nextStep,
        prev: prevStep,
        stop: stopTutorial,
        complete: completeTutorial,
        reposition: repositionActivePopover,
        isActive: () => tutorialState.active,
        getCurrentStep: () => tutorialState.steps[tutorialState.currentIndex] || null
    };
})();
