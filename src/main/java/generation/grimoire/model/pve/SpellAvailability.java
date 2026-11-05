package generation.grimoire.model.pve;

import generation.grimoire.dto.pve.SpellCostModifierDTO;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

/**
 * Représente la disponibilité d'un sort pour le joueur pendant le combat.
 * Envoyé au frontend pour griser les sorts non-lançables avec une icône explicative
 * et exposer les coûts réels pré-calculés ainsi que le détail de leurs modificateurs.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SpellAvailability {
    private Long spellId;
    private boolean castable;
    
    /**
     * Raison du blocage :
     * - "RESOURCE"      : pas assez de mana, PV ou chaleur
     * - "CONDITION"     : condition de spiritualité non remplie (Esprit, Ténèbres, Karma)
     * - "ACTION_LIMIT"  : action déjà consommée ce tour (instantané, banal)
     * - "CHANNELING"    : canalisation en cours
     * - null            : le sort est lançable
     */
    private String reason;
    
    /** Message explicatif pour le tooltip */
    private String tooltip;
    
    private int finalManaCost;
    private int finalHealCost;
    private int finalHeatCost;

    private int rawManaCost;
    private int percentManaAmount;
    private int rawHealCost;
    private int percentHealAmount;
    private int rawHeatCost;
    private int percentHeatAmount;

    private List<SpellCostModifierDTO> manaModifiers = new ArrayList<>();
    private List<SpellCostModifierDTO> healModifiers = new ArrayList<>();
    private List<SpellCostModifierDTO> heatModifiers = new ArrayList<>();

    public SpellAvailability(Long spellId, boolean castable, String reason, String tooltip,
                             int finalManaCost, int finalHealCost, int finalHeatCost) {
        this.spellId = spellId;
        this.castable = castable;
        this.reason = reason;
        this.tooltip = tooltip;
        this.finalManaCost = finalManaCost;
        this.finalHealCost = finalHealCost;
        this.finalHeatCost = finalHeatCost;
        this.rawManaCost = finalManaCost;
        this.rawHealCost = finalHealCost;
        this.rawHeatCost = finalHeatCost;
    }
    
    public static SpellAvailability available(Long spellId) {
        return new SpellAvailability(spellId, true, null, null, 0, 0, 0);
    }
    
    public static SpellAvailability available(Long spellId, int manaCost, int healCost, int heatCost) {
        return new SpellAvailability(spellId, true, null, null, manaCost, healCost, heatCost);
    }
    
    public static SpellAvailability blocked(Long spellId, String reason, String tooltip) {
        return new SpellAvailability(spellId, false, reason, tooltip, 0, 0, 0);
    }
    
    public static SpellAvailability blocked(Long spellId, String reason, String tooltip, int manaCost, int healCost, int heatCost) {
        return new SpellAvailability(spellId, false, reason, tooltip, manaCost, healCost, heatCost);
    }
}
