package generation.grimoire.service.equipment;

import generation.grimoire.dto.equipment.EquipmentDismantleSimulationDTO;
import generation.grimoire.entity.AlchemyRecipe;
import generation.grimoire.entity.Anomalie;
import generation.grimoire.entity.Equipment;
import generation.grimoire.entity.auth.AppUser;
import generation.grimoire.enumeration.AnomalieCategory;
import generation.grimoire.enumeration.AnomalieType;
import generation.grimoire.enumeration.EquipmentSlot;
import generation.grimoire.enumeration.RecipeRewardType;
import generation.grimoire.enumeration.SpiritualiteType;
import generation.grimoire.repository.AlchemyRecipeRepository;
import generation.grimoire.repository.AnomalieRepository;
import generation.grimoire.repository.EquipmentRepository;
import generation.grimoire.repository.auth.UserRepository;
import generation.grimoire.repository.pve.LootEntryRepository;
import generation.grimoire.service.AchievementService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
public class EquipmentDismantleService {

    private static final double BASE_SHOP_REFUND_RATE = 0.25;
    private static final double AWAKENING_GOLD_REFUND_RATE = 0.30;
    private static final double ANOMALY_INGREDIENT_REFUND_RATE = 0.35;

    private final EquipmentRepository equipmentRepository;
    private final AnomalieRepository anomalieRepository;
    private final AlchemyRecipeRepository alchemyRecipeRepository;
    private final UserRepository userRepository;
    private final LootEntryRepository lootEntryRepository;
    private final SecretAwakeningMapping secretAwakeningMapping;
    private final AchievementService achievementService;

    public EquipmentDismantleService(
            EquipmentRepository equipmentRepository,
            AnomalieRepository anomalieRepository,
            AlchemyRecipeRepository alchemyRecipeRepository,
            UserRepository userRepository,
            LootEntryRepository lootEntryRepository,
            SecretAwakeningMapping secretAwakeningMapping,
            AchievementService achievementService) {
        this.equipmentRepository = equipmentRepository;
        this.anomalieRepository = anomalieRepository;
        this.alchemyRecipeRepository = alchemyRecipeRepository;
        this.userRepository = userRepository;
        this.lootEntryRepository = lootEntryRepository;
        this.secretAwakeningMapping = secretAwakeningMapping;
        this.achievementService = achievementService;
    }

    @Transactional(readOnly = true)
    public EquipmentDismantleSimulationDTO simulateDismantle(String username, boolean isAdmin, List<Long> equipmentIds) {
        List<Equipment> items = resolveAndValidateItems(username, isAdmin, equipmentIds);
        return computeSimulation(items);
    }

    @Transactional
    public EquipmentDismantleSimulationDTO executeDismantle(String username, boolean isAdmin, List<Long> equipmentIds) {
        AppUser owner = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur introuvable."));
        List<Equipment> items = resolveAndValidateItems(username, isAdmin, equipmentIds);
        EquipmentDismantleSimulationDTO sim = computeSimulation(items);

        if (!sim.canDismantle()) {
            throw new IllegalArgumentException(sim.blockedReason());
        }

        if (sim.goldReward() > 0) {
            owner.setMonnaie(owner.getMonnaie() + sim.goldReward());
        }

        if (sim.anomalyRewards() != null && !sim.anomalyRewards().isEmpty()) {
            List<Anomalie> createdAnomalies = new ArrayList<>();
            for (Map.Entry<String, Integer> entry : sim.anomalyRewards().entrySet()) {
                String anomalyName = entry.getKey();
                int qty = entry.getValue();
                Anomalie template = anomalieRepository.findFirstByNameAndIsTemplateTrueOrderByIdAsc(anomalyName);
                for (int i = 0; i < qty; i++) {
                    Anomalie a = new Anomalie();
                    a.setName(anomalyName);
                    a.setOwnerUsername(username);
                    a.setUser(owner);
                    a.setTemplate(false);
                    if (template != null) {
                        a.setSpiritualite(template.getSpiritualite());
                        a.setCategory(template.getCategory());
                        a.setDescription(template.getDescription());
                        a.setLevel(template.getLevel());
                        a.setAnomalieType(template.getAnomalieType() != null ? template.getAnomalieType() : AnomalieType.MAGIQUE);
                    } else {
                        a.setSpiritualite(SpiritualiteType.KARMA);
                        a.setCategory(AnomalieCategory.AUTRE);
                        a.setLevel(1);
                        a.setAnomalieType(AnomalieType.MATERIAU);
                    }
                    createdAnomalies.add(a);
                }
                owner.getDiscoveredItems().add(anomalyName);
            }
            anomalieRepository.saveAll(createdAnomalies);
        }

        for (Equipment eq : items) {
            lootEntryRepository.deleteByEquipmentId(eq.getId());
            equipmentRepository.deleteById(Objects.requireNonNull(eq.getId()));
        }

        userRepository.save(owner);
        achievementService.onEquipmentRecycled(owner, items.size());
        achievementService.onGoldChanged(owner);

        return sim;
    }

    private List<Equipment> resolveAndValidateItems(String username, boolean isAdmin, List<Long> equipmentIds) {
        if (equipmentIds == null || equipmentIds.isEmpty()) {
            throw new IllegalArgumentException("Aucun équipement sélectionné pour le démantèlement.");
        }
        List<Equipment> items = new ArrayList<>();
        Set<Long> seen = new HashSet<>();
        for (Long id : equipmentIds) {
            if (id == null || !seen.add(id)) continue;
            Equipment eq = equipmentRepository.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("Équipement introuvable (ID " + id + ")."));
            if (!isAdmin && (eq.getUser() == null || !username.equals(eq.getUser().getUsername()))) {
                throw new SecurityException("Un équipement sélectionné ne vous appartient pas.");
            }
            if (eq.isTemplate()) {
                throw new IllegalArgumentException("Impossible de démanteler un modèle.");
            }
            if (eq.getPersonnage() != null) {
                throw new IllegalArgumentException("Déséquipez d'abord \"" + eq.getName() + "\" avant de le démanteler.");
            }
            if (eq.getSlot() == EquipmentSlot.CONSOMMABLE) {
                throw new IllegalArgumentException("Les consommables ne peuvent pas être démantelés.");
            }
            items.add(eq);
        }
        if (items.isEmpty()) {
            throw new IllegalArgumentException("Aucun équipement valide à démanteler.");
        }
        return items;
    }

    private EquipmentDismantleSimulationDTO computeSimulation(List<Equipment> items) {
        double totalGold = 0;
        Map<String, Integer> totalAnomalies = new LinkedHashMap<>();
        List<AlchemyRecipe> allRecipes = alchemyRecipeRepository.findAll();

        for (Equipment eq : items) {
            double baseGold = Math.max(
                    Math.ceil(eq.calculateWeight()),
                    Math.ceil(eq.calculateShopPrice() * BASE_SHOP_REFUND_RATE)
            );
            int up = EquipmentScalingHelper.clampLevel(eq);
            double investedGold = up > 0 ? secretAwakeningMapping.getCumulativeGoldInvested(up, eq.getRarity()) : 0;
            double bonusGold = Math.round(investedGold * AWAKENING_GOLD_REFUND_RATE);
            totalGold += baseGold + bonusGold;

            if (up >= 1) {
                Map<String, Integer> perItemRefund = computePartialIngredientsRefund(eq, up, allRecipes);
                perItemRefund.forEach((name, qty) -> totalAnomalies.merge(name, qty, Integer::sum));
            }
        }

        Equipment first = items.get(0);
        return new EquipmentDismantleSimulationDTO(
                items.size(),
                first.getName(),
                first.getRarity() != null ? first.getRarity().name() : null,
                EquipmentScalingHelper.clampLevel(first),
                true,
                null,
                totalGold,
                totalAnomalies
        );
    }

    private Map<String, Integer> computePartialIngredientsRefund(Equipment eq, int upgradeLevel, List<AlchemyRecipe> allRecipes) {
        SecretAwakeningMapping.AwakeningDuo duo = secretAwakeningMapping.resolveForSecret(eq.getRequiredSecret());
        int catalystsSpent = secretAwakeningMapping.getCumulativeCatalystsSpent(upgradeLevel);
        int awakeningsSpent = secretAwakeningMapping.getCumulativeAwakeningsSpent(upgradeLevel);

        AlchemyRecipe catalystRecipe = findRecipeForReward(allRecipes, duo.catalystName(), RecipeRewardType.GIVE_CATALYST);
        AlchemyRecipe awakeningRecipe = findRecipeForReward(allRecipes, duo.awakeningName(), RecipeRewardType.GIVE_AWAKENING);

        Map<String, Integer> totalSpentIngredients = new LinkedHashMap<>();
        String fallbackFirstIngredient = null;

        if (catalystsSpent > 0 && catalystRecipe != null && catalystRecipe.getRequiredAnomalies() != null) {
            for (Map.Entry<String, Integer> entry : catalystRecipe.getRequiredAnomalies().entrySet()) {
                if (fallbackFirstIngredient == null) fallbackFirstIngredient = entry.getKey();
                totalSpentIngredients.merge(entry.getKey(), entry.getValue() * catalystsSpent, Integer::sum);
            }
        }
        if (awakeningsSpent > 0 && awakeningRecipe != null && awakeningRecipe.getRequiredAnomalies() != null) {
            for (Map.Entry<String, Integer> entry : awakeningRecipe.getRequiredAnomalies().entrySet()) {
                if (fallbackFirstIngredient == null) fallbackFirstIngredient = entry.getKey();
                totalSpentIngredients.merge(entry.getKey(), entry.getValue() * awakeningsSpent, Integer::sum);
            }
        }

        Map<String, Integer> refunded = new LinkedHashMap<>();
        for (Map.Entry<String, Integer> entry : totalSpentIngredients.entrySet()) {
            int spent = entry.getValue();
            if (spent <= 1) continue;
            int qty = Math.min(spent - 1, (int) Math.floor(spent * ANOMALY_INGREDIENT_REFUND_RATE));
            if (qty > 0) {
                refunded.put(entry.getKey(), qty);
            }
        }

        // Plancher de garantie pour tout item éveillé (>= +1) sans jamais rendre assez pour recrafter
        if (refunded.isEmpty() && fallbackFirstIngredient != null) {
            int spentOnFirst = totalSpentIngredients.getOrDefault(fallbackFirstIngredient, 0);
            if (spentOnFirst > 1 || catalystsSpent + awakeningsSpent > 1 || (catalystRecipe != null && catalystRecipe.getRequiredAnomalies().size() > 1) || (catalystRecipe != null && catalystRecipe.getCostGold() > 0)) {
                refunded.put(fallbackFirstIngredient, 1);
            }
        }

        return refunded;
    }

    private AlchemyRecipe findRecipeForReward(List<AlchemyRecipe> allRecipes, String rewardName, RecipeRewardType preferredType) {
        AlchemyRecipe fallback = null;
        for (AlchemyRecipe r : allRecipes) {
            if (r == null || r.getRewardName() == null || !r.getRewardName().equalsIgnoreCase(rewardName)) continue;
            if (r.getRewardType() == preferredType) return r;
            if (r.getRewardType() == RecipeRewardType.GIVE_ANOMALY && fallback == null) fallback = r;
        }
        return fallback;
    }
}
