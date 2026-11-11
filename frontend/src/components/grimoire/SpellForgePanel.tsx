const ACTION_CATEGORY_TOOLTIP_HTML = `
  <div class="tooltip-title text-amber-400">
    <span class="material-symbols-outlined text-sm">info</span>
    <span>Catégories d'action</span>
  </div>
  <div class="tooltip-desc flex flex-col gap-1">
    <div><strong class="text-amber-400">⚡ Instantané :</strong> Ne consomme pas le tour de jeu.</div>
    <div><strong class="text-blue-400">⏳ Banal :</strong> Consomme le tour (1 action / tour).</div>
    <div><strong class="text-purple-400">🌀 Canalisé :</strong> S'exécute sur plusieurs tours consécutifs.</div>
  </div>
`;

export function SpellForgePanel() {
  return (
    <div className="panel is-hidden" id="spellForgePanel">
      <div className="panel-title">Forge des Âmes</div>

      <div className="form-group">
        <label htmlFor="nom">Nom du sort</label>
        <input
          type="text"
          id="nom"
          placeholder="Ex: Lame d'Infini, Éruption d'Ombre..."
          required
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="niveau">Niveau</label>
          <select id="niveau" defaultValue="1">
            <option value="1">Niveau 1</option>
            <option value="2">Niveau 2</option>
            <option value="3">Niveau 3</option>
            <option value="4">Niveau 4</option>
            <option value="5">Niveau 5</option>
          </select>
          <div className="helper-text" id="lvl-helper">
            Voie : 1-5 max / Spiritualité : 1-3 max
          </div>
          <div
            className="text-emerald mt-1 font-semibold text-sm init-hidden"
            id="rankTitleDisplay"
          ></div>
        </div>

        <div className="form-group">
          <label htmlFor="castingTypeSelect" className="flex items-center gap-1">
            Catégorie d&apos;Action (Tour)
            <span
              className="material-symbols-outlined text-xs text-slate-400 cursor-help"
              data-prefer-top=""
              data-tooltip-html={ACTION_CATEGORY_TOOLTIP_HTML}
              onMouseEnter={(e) => window.showGlobalTooltip?.(e.currentTarget)}
              onMouseLeave={() => window.hideGlobalTooltip?.()}
            >
              help
            </span>
          </label>
          <select id="castingTypeSelect" defaultValue="BANAL">
            <option value="INSTANTANE">Instantané (Action Libre)</option>
            <option value="BANAL">Banal (1/tour)</option>
            <option value="CANALISE">Canalisé (Multi-tours)</option>
          </select>
        </div>
      </div>

      {/* Options spécifiques pour sort canalisé */}
      <div className="form-row mt-4 init-hidden" id="channelingConfig">
        <div className="form-group">
          <label htmlFor="channelingDuration">
            Durée de canalisation (Tours)
          </label>
          <input
            type="number"
            id="channelingDuration"
            min={1}
            defaultValue={1}
            onInput={() => window.renderEffects?.()}
          />
        </div>
        <div className="form-group justify-center h-full items-start">
          <label
            className="instant-toggle-container mt-4"
            title="Permet de lancer des sorts instantanés pendant la canalisation"
          >
            <input
              className="instant-checkbox"
              type="checkbox"
              id="allowInstantDuringChanneling"
              defaultChecked
            />
            <div className="instant-icon-wrap">
              <span className="material-symbols-outlined text-xl">bolt</span>
            </div>
            <div className="instant-text">
              Autoriser les instantanés
              <span className="instant-text-sub">Pendant la canalisation</span>
            </div>
          </label>
        </div>
      </div>

      {/* SECTION DES COÛTS DU SORT */}
      <div className="cost-section">
        <div className="cost-section-title flex-center flex-center-gap">
          <span className="material-symbols-outlined text-amber text-xl">
            electric_bolt
          </span>
          <span>Coûts du Sort</span>
        </div>

        {/* Coûts en Mana */}
        <div className="cost-card mana">
          <div className="cost-card-header flex-center flex-center-gap">
            <span className="material-symbols-outlined text-lg text-info">
              water_drop
            </span>
            <span>Mana</span>
          </div>
          <div className="cost-inputs-grid">
            <label htmlFor="manaCost">Montant Fixe :</label>
            <input type="number" id="manaCost" min={0} defaultValue={10} />
          </div>
          <div className="cost-inputs-grid">
            <label htmlFor="percentManaCost">Ratio :</label>
            <div className="flex-center gap-2">
              <input
                type="number"
                id="percentManaCost"
                min={0}
                defaultValue={0}
                className="w-[70px]"
              />
              <span className="text-muted">% de</span>
              <select className="flex-1 text-sm" id="percentManaCostSource">
                {/* Rempli dynamiquement */}
              </select>
            </div>
          </div>
        </div>

        {/* Coûts en PV */}
        <div className="cost-card health">
          <div className="cost-card-header flex-center flex-center-gap">
            <span className="material-symbols-outlined text-lg text-danger">
              bloodtype
            </span>
            <span>Sacrifice (Points de Vie)</span>
          </div>
          <div className="cost-inputs-grid">
            <label htmlFor="healCost">Montant Fixe :</label>
            <input type="number" id="healCost" min={0} defaultValue={0} />
          </div>
          <div className="cost-inputs-grid">
            <label htmlFor="percentHealCost">Ratio :</label>
            <div className="flex-center gap-2">
              <input
                type="number"
                id="percentHealCost"
                min={0}
                defaultValue={0}
                className="w-[70px]"
              />
              <span className="text-muted">% de</span>
              <select className="flex-1 text-sm" id="percentHealCostSource">
                {/* Rempli dynamiquement */}
              </select>
            </div>
          </div>
        </div>

        {/* Coût en Chaleur (Voie de la Destruction) */}
        <div
          className="cost-card health text-amber border-l-3-amber init-hidden"
          id="heatCostCard"
        >
          <div className="cost-card-header flex-center flex-center-gap">
            <span className="material-symbols-outlined text-amber text-lg">
              local_fire_department
            </span>
            <span>Coût en Chaleur</span>
          </div>
          <div className="cost-inputs-grid">
            <label htmlFor="heatCost">Montant Fixe :</label>
            <input type="number" id="heatCost" min={0} defaultValue={0} />
          </div>
          <div className="cost-inputs-grid">
            <label htmlFor="percentHeatCost">Ratio :</label>
            <div className="flex-center gap-2">
              <input
                type="number"
                id="percentHeatCost"
                min={0}
                defaultValue={0}
                className="w-[70px]"
              />
              <span className="text-muted">% de la chaleur max (100)</span>
            </div>
          </div>
        </div>

        {/* Coût en Graines (Voie de la Création) */}
        <div
          className="cost-card text-emerald-300 border-l-3-emerald init-hidden"
          id="seedCostCard"
        >
          <div className="cost-card-header flex-center flex-center-gap">
            <span className="material-symbols-outlined text-emerald-300 text-lg">
              yard
            </span>
            <span>Coût en Graines</span>
          </div>
          <div className="cost-inputs-grid">
            <label htmlFor="seedCost">Montant Fixe (1-5) :</label>
            <input type="number" id="seedCost" min={0} max={5} defaultValue={0} />
          </div>
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          rows={2}
          placeholder="Effets narratifs ou secrets de ce sort..."
        ></textarea>
      </div>

      <div className="form-row mb-4">
        <div className="form-group justify-center items-start">
          <label
            className="target-toggle-container monster-mode w-max"
            title="Si activé, ce sort sera une Mutation pour monstre"
          >
            <input
              className="target-radio"
              type="checkbox"
              id="isMonsterSpell"
              onChange={() => window.toggleSpellTargetType?.()}
            />
            <div className="target-icon-wrap monster-icon">
              <span className="material-symbols-outlined text-xl">pets</span>
            </div>
            <div className="target-text monster-text">
              Mutation
              <span className="target-text-sub">Sort pour monstre</span>
            </div>
          </label>
        </div>
      </div>

      <div className="form-row flex gap-4" id="heroAffinityRow">
        <div className="form-group flex-1">
          <label className="flex items-center gap-1" htmlFor="voieSelect">
            <span className="material-symbols-outlined text-base">route</span>
            Voie Associée
          </label>
          <select id="voieSelect" defaultValue="">
            <option value="">-- Aucune (Neutre) --</option>
          </select>
        </div>
        <div className="form-group flex-1">
          <label className="flex items-center gap-1" htmlFor="spiritSelect">
            <span className="material-symbols-outlined text-base">
              psychology
            </span>
            Spiritualité
          </label>
          <select id="spiritSelect" defaultValue="">
            <option value="">-- Aucune (Neutre) --</option>
          </select>
        </div>
      </div>

      <div
        className="form-row flex gap-4 init-hidden"
        id="monsterAffinityRow"
      >
        <div className="form-group flex-1">
          <label className="flex items-center gap-1" htmlFor="mutationSelect">
            <span className="material-symbols-outlined text-base">pets</span>
            Mutation
          </label>
          <select id="mutationSelect" defaultValue="">
            <option value="">-- Aucune (Neutre) --</option>
          </select>
        </div>
      </div>

      {/* Options spécifiques pour la Voie de la Violence */}
      <div className="form-group mt-4 init-hidden" id="violenceConfig">
        <input
          type="checkbox"
          id="isInspiration"
          defaultChecked
          className="hidden"
          onChange={() => window.updateViolenceLabel?.()}
        />
        <div className="violence-segmented-control gap-2 grid grid-cols-2 bg-black/40 border border-glass rounded-xl p-1">
          <button
            className="violence-option-btn active flex items-center gap-1 rounded-lg py-3 px-2 flex-col bg-cyan-500/20 border border-cyan-500 text-cyan-400 cursor-pointer transition-all"
            type="button"
            id="btnInspiration"
            onClick={() => window.setViolenceType?.(true)}
          >
            <span className="material-symbols-outlined text-2xl">storm</span>
            <span className="font-semibold text-md">Inspiration</span>
            <span className="text-sm opacity-80">+Critique</span>
          </button>
          <button
            className="violence-option-btn flex items-center gap-1 rounded-lg py-3 px-2 flex-col bg-transparent border border-transparent text-muted cursor-pointer transition-all"
            type="button"
            id="btnExpiration"
            onClick={() => window.setViolenceType?.(false)}
          >
            <span className="material-symbols-outlined text-2xl">air</span>
            <span className="font-semibold text-md">Expiration</span>
            <span className="text-sm opacity-80">+Puissance</span>
          </button>
        </div>
      </div>

      {/* Options spécifiques pour la Spiritualité Karma */}
      <div className="form-group mt-4 init-hidden" id="karmaConfig">
        <input type="hidden" id="karmaAlignment" defaultValue="NONE" />
        <div className="karma-segmented-control gap-2 grid grid-cols-3 bg-black/40 border border-glass rounded-xl p-1">
          <button
            className="karma-option-btn flex items-center gap-1 rounded-lg py-3 px-2 flex-col bg-transparent border border-transparent text-muted cursor-pointer transition-all"
            type="button"
            id="btnKarmaOffensive"
            onClick={() => window.setKarmaAlignment?.('OFFENSIVE')}
          >
            <span className="material-symbols-outlined text-2xl">
              dark_mode
            </span>
            <span className="font-semibold text-sm">Ténèbres</span>
          </button>
          <button
            className="karma-option-btn flex items-center gap-1 rounded-lg py-3 px-2 flex-col bg-transparent border border-transparent text-muted cursor-pointer transition-all"
            type="button"
            id="btnKarmaRestorative"
            onClick={() => window.setKarmaAlignment?.('RESTORATIVE')}
          >
            <span className="material-symbols-outlined text-2xl">
              brightness_medium
            </span>
            <span className="font-semibold text-sm">Harmonie</span>
          </button>
          <button
            className="karma-option-btn flex items-center gap-1 rounded-lg py-3 px-2 flex-col bg-transparent border border-transparent text-muted cursor-pointer transition-all"
            type="button"
            id="btnKarmaProtective"
            onClick={() => window.setKarmaAlignment?.('PROTECTIVE')}
          >
            <span className="material-symbols-outlined text-2xl">
              light_mode
            </span>
            <span className="font-semibold text-sm">Lumière</span>
          </button>
        </div>
      </div>

      <hr className="my-2 border-glass" />

      {/* Section Dynamique des Effets */}
      <div className="form-group">
        <label className="mb-1 font-semibold">
          Ajouter une ligne d&apos;effet au sort :
        </label>
        <div className="gap-2 grid grid-cols-auto-140">
          <button
            className="btn-effect-add dmg"
            type="button"
            onClick={() => window.addEffectPanel?.('FIXED_DAMAGE')}
          >
            <span className="material-symbols-outlined text-lg">swords</span>{' '}
            Dégâts Fixes
          </button>
          <button
            className="btn-effect-add dmg"
            type="button"
            onClick={() => window.addEffectPanel?.('PERCENTAGE_DAMAGE')}
          >
            <span className="material-symbols-outlined text-lg">explosion</span>{' '}
            Dégâts %
          </button>
          <button
            className="btn-effect-add dmg"
            type="button"
            onClick={() => window.addEffectPanel?.('DOT')}
          >
            <span className="material-symbols-outlined text-lg">whatshot</span>{' '}
            Tick Dégâts (DoT)
          </button>
          <button
            className="btn-effect-add heal"
            type="button"
            onClick={() => window.addEffectPanel?.('FIXED_HEAL')}
          >
            <span className="material-symbols-outlined text-lg">favorite</span>{' '}
            Soins Fixes
          </button>
          <button
            className="btn-effect-add heal"
            type="button"
            onClick={() => window.addEffectPanel?.('PERCENTAGE_HEAL')}
          >
            <span className="material-symbols-outlined text-lg">favorite</span>{' '}
            Soins %
          </button>
          <button
            className="btn-effect-add heal"
            type="button"
            onClick={() => window.addEffectPanel?.('HOT')}
          >
            <span className="material-symbols-outlined text-lg">healing</span>{' '}
            Tick Soins (HoT)
          </button>
          <button
            className="btn-effect-add mana"
            type="button"
            onClick={() => window.addEffectPanel?.('FIXED_MANA')}
          >
            <span className="material-symbols-outlined text-lg">water_drop</span>{' '}
            Mana Fixe
          </button>
          <button
            className="btn-effect-add mana"
            type="button"
            onClick={() => window.addEffectPanel?.('PERCENTAGE_MANA')}
          >
            <span className="material-symbols-outlined text-lg">water_drop</span>{' '}
            Mana %
          </button>
          <button
            className="btn-effect-add mana"
            type="button"
            onClick={() => window.addEffectPanel?.('MOT')}
          >
            <span className="material-symbols-outlined text-lg">cyclone</span>{' '}
            Tick Mana (MoT)
          </button>
          <button
            className="btn-effect-add buff"
            type="button"
            onClick={() => window.addEffectPanel?.('BUFF_DEBUFF')}
          >
            <span className="material-symbols-outlined">auto_awesome</span>{' '}
            Buff / Débuff
          </button>
          <button
            className="btn-effect-add buff"
            type="button"
            onClick={() => window.addEffectPanel?.('SHIELD')}
          >
            <span className="material-symbols-outlined text-lg">shield</span>{' '}
            Bouclier
          </button>
          <button
            className="btn-effect-add purge"
            type="button"
            onClick={() => window.addEffectPanel?.('PURGE')}
          >
            <span className="material-symbols-outlined text-lg">air</span>{' '}
            Purge / Dissip.
          </button>
          <button
            className="btn-effect-add poison"
            type="button"
            onClick={() => window.addEffectPanel?.('POISON')}
          >
            <span className="material-symbols-outlined">science</span> Poison
          </button>
          <button
            className="btn-effect-add burn"
            type="button"
            onClick={() => window.addEffectPanel?.('BURN')}
          >
            <span className="material-symbols-outlined">
              local_fire_department
            </span>{' '}
            Brûlure
          </button>

          {/* Boutons de Chaleur (spécifique Voie de la Destruction) */}
          <div
            className="mt-2 w-full gap-2 grid-auto-fill-140 init-hidden"
            id="heatEffectButtons"
          >
            <button
              className="btn-effect-add bg-red-500/20 text-red-300 border border-red-500/35"
              type="button"
              onClick={() => window.addEffectPanel?.('HEAT_FIXED')}
            >
              <span className="material-symbols-outlined text-lg">whatshot</span>{' '}
              Chaleur Fixe
            </button>
            <button
              className="btn-effect-add bg-red-500/20 text-red-300 border border-red-500/35"
              type="button"
              onClick={() => window.addEffectPanel?.('HEAT_PERCENTAGE')}
            >
              <span className="material-symbols-outlined text-lg">explosion</span>{' '}
              Chaleur %
            </button>
            <button
              className="btn-effect-add bg-red-500/20 text-red-300 border border-red-500/35"
              type="button"
              onClick={() => window.addEffectPanel?.('HEAT_OVER_TIME')}
            >
              <span className="material-symbols-outlined text-lg">cyclone</span>{' '}
              Tick Chaleur
            </button>
          </div>

          {/* Bouton Âme Détachée (spécifique Spiritualité Ténèbres) */}
          <div
            className="mt-2 w-full gap-2 grid-auto-fill-140 init-hidden"
            id="ameDetacheeEffectButton"
          >
            <button
              className="btn-effect-add bg-rose-500/20 text-rose-300 border border-rose-500/35"
              type="button"
              onClick={() => window.addEffectPanel?.('AME_DETACHEE')}
            >
              <span className="material-symbols-outlined text-lg">
                dark_mode
              </span>{' '}
              Âme Détachée
            </button>
          </div>

          {/* Bouton Bourgeon (spécifique Voie de la Création) */}
          <div
            className="mt-2 w-full gap-2 grid-auto-fill-140 init-hidden"
            id="budEffectButton"
          >
            <button
              className="btn-effect-add bg-emerald-500/20 text-emerald-300 border border-emerald-500/35"
              type="button"
              onClick={() => window.addEffectPanel?.('BUD')}
            >
              <span className="material-symbols-outlined text-lg">yard</span>{' '}
              Bourgeon
            </button>
          </div>
        </div>
      </div>

      {/* Conteneur des effets ajoutés */}
      <div className="effects-container" id="effectsList"></div>

      <button
        className="btn mt-4"
        type="button"
        id="submitSpellBtn"
        onClick={() => window.submitSpell?.()}
      >
        ✦ Forger le Sort
      </button>
    </div>
  );
}
