export function SpellFilterBar() {
  return (
    <div
      className="flex gap-4 grimoire-filters-panel flex-col relative z-[9999999] mb-[1.2rem]"
      id="grimoireFiltersContainer"
    >
      <div className="flex items-center justify-between border-b border-white/5 pb-[0.6rem]">
        <div className="flex items-center gap-2 font-bold text-sm uppercase tracking-[1.2px] text-primary">
          <span className="material-symbols-outlined text-xl">visibility</span>
          <span>Perception Arcanique</span>
        </div>
        <div className="flex items-center gap-[0.6rem]">
          <button
            className="btn-secondary px-2 py-1 items-center text-[0.7rem] leading-tight rounded border-none bg-rose-500/10 text-rose-500 inline-flex gap-1"
            type="button"
            onClick={() => window.resetFilters?.()}
            title="Réinitialiser les sélecteurs"
          >
            <span className="material-symbols-outlined text-md">
              restart_alt
            </span>
            Réinitialiser
          </button>
          <span
            className="badge text-emerald font-semibold bg-emerald-500/15"
            id="filterCountBadge"
          >
            0 sort
          </span>
        </div>
      </div>

      <div className="relative">
        <span className="material-symbols-outlined text-lg absolute left-3 top-1/2 -translate-y-1/2 opacity-60 text-muted">
          search
        </span>
        <input
          className="w-full text-sm bg-black/30 border border-white/10 rounded-lg outline-none transition-colors py-[0.6rem] pr-4 pl-9 filter-search-input"
          type="text"
          id="filterSearch"
          placeholder="Rechercher par lettre dans le nom ou la description..."
          onInput={() => window.renderFilteredSpells?.()}
        />
      </div>

      <div
        className="flex flex-col gap-4"
        role="radiogroup"
        aria-label="Filtrer par Voie ou Spiritualité"
      >
        <div>
          <label className="mb-2 flex items-center gap-1 font-bold text-xs text-muted tracking-[0.5px]">
            <span className="material-symbols-outlined text-purple text-md">
              auto_awesome
            </span>
            FILTRER PAR VOIE
          </label>
          <div
            className="flex flex-wrap gap-[0.4rem]"
            id="filterVoiesButtonsContainer"
          ></div>
        </div>

        <div className="flex gap-4 flex-wrap items-start">
          <div className="flex-1">
            <label className="mb-2 flex items-center gap-1 font-bold text-xs text-muted tracking-[0.5px]">
              <span className="material-symbols-outlined text-md text-orange-400">
                grade
              </span>
              FILTRER PAR SPIRITUALITÉ
            </label>
            <div
              className="flex flex-wrap gap-[0.4rem]"
              id="filterSpiritsButtonsContainer"
            ></div>
          </div>

          <div className="flex-1 init-hidden" id="filterMutationAdminContainer">
            <label className="mb-2 flex items-center gap-1 font-bold text-xs text-muted tracking-[0.5px]">
              <span className="material-symbols-outlined text-purple text-md">
                pets
              </span>
              FILTRER PAR MUTATION
            </label>
            <select
              className="w-full text-sm p-[0.6rem] bg-slate-900/80 border border-white/10 text-slate-200 rounded-md cursor-pointer outline-none"
              id="filterMutation"
              defaultValue="NONE"
            >
              <option value="NONE">Sans mutation</option>
              <option value="ALL">Mutations + Sorts classiques</option>
              <option value="ONLY_MUTATIONS">Mutations uniquement</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid-auto-fit gap-3">
        <div>
          <label className="mb-1 flex items-center gap-1 font-bold text-xs text-muted tracking-[0.5px]">
            <span className="material-symbols-outlined text-emerald text-md">
              category
            </span>
            NATURE D&apos;EFFET
          </label>
          <select
            className="w-full text-sm p-[0.6rem] bg-slate-900/80 border border-white/10 text-slate-200 rounded-md cursor-pointer outline-none"
            id="filterEffect"
            defaultValue="ALL"
          >
            <option value="ALL">Tous effets</option>
            <option value="GROUP_DAMAGE">Dégâts</option>
            <option value="GROUP_HEAL">Soins</option>
            <option value="GROUP_MANA">Mana</option>
            <option value="GROUP_EFFECTS">Effets</option>
            <option disabled>────────────────</option>
            <option value="FIXED_DAMAGE">Dégâts Fixes</option>
            <option value="PERCENTAGE_DAMAGE">Dégâts %</option>
            <option value="DOT">Dégâts DoT</option>
            <option value="FIXED_HEAL">Soins Fixes</option>
            <option value="PERCENTAGE_HEAL">Soins %</option>
            <option value="HOT">Soins HoT</option>
            <option value="FIXED_MANA">Mana Fixe</option>
            <option value="PERCENTAGE_MANA">Mana %</option>
            <option value="MOT">Tick Mana (MoT)</option>
            <option value="BUFF_DEBUFF">Buff / Débuff</option>
            <option value="SHIELD">Bouclier</option>
            <option value="PURGE">Dissipation</option>
            <option disabled>────────────────</option>
            <option value="BURN">Brûlure</option>
            <option value="POISON">Poison</option>
          </select>
        </div>

        <div>
          <label className="mb-1 flex items-center gap-1 font-bold text-xs text-muted tracking-[0.5px]">
            <span className="material-symbols-outlined text-amber text-md">
              workspace_premium
            </span>
            PALIER (NIVEAU)
          </label>
          <select
            className="w-full text-sm p-[0.6rem] bg-slate-900/80 border border-white/10 text-slate-200 rounded-md cursor-pointer outline-none"
            id="filterLevel"
            defaultValue="ALL"
          >
            <option value="ALL">Tous niveaux</option>
            <option value="1">Niveau 1</option>
            <option value="2">Niveau 2</option>
            <option value="3">Niveau 3</option>
            <option value="4">Niveau 4</option>
            <option value="5">Niveau 5</option>
          </select>
        </div>

        <div>
          <label className="mb-1 flex items-center gap-1 font-bold text-xs text-muted tracking-[0.5px]">
            <span className="material-symbols-outlined text-md text-purple-400">
              sort
            </span>
            ORDONNANCEMENT
          </label>
          <div className="flex gap-2">
            <select
              className="w-full text-sm p-[0.6rem] bg-slate-900/80 border border-white/10 text-slate-200 rounded-md cursor-pointer outline-none"
              id="sortBy"
              defaultValue="DEFAULT"
            >
              <option value="DEFAULT">Par défaut</option>
              <option value="NAME_ASC">Nom (A-Z)</option>
              <option value="LEVEL_ASC">Niveau croissant</option>
              <option value="LEVEL_DESC">Niveau décroissant</option>
              <option value="MANA_ASC">Coût Mana</option>
            </select>
            <button
              id="spellTypeFilterBtn"
              type="button"
              onClick={() => window.toggleSpellTypeFilter?.()}
              className="flex-shrink-0 flex items-center justify-center bg-slate-900/80 border border-white/10 text-slate-200 rounded-md cursor-pointer outline-none hover:bg-slate-800 spell-type-filter-btn"
              title="Filtrer par type d'action"
            >
              <div className="relative w-full h-full spell-type-filter-icons">
                <span className="material-symbols-outlined absolute text-amber-400 spell-type-icon-bolt">
                  bolt
                </span>
                <span className="material-symbols-outlined absolute text-blue-400 spell-type-icon-banal">
                  hourglass_empty
                </span>
                <span className="material-symbols-outlined absolute text-purple-400 spell-type-icon-canalise">
                  cyclone
                </span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
