package generation.grimoire.service.equipment;

import generation.grimoire.dto.equipment.EquipmentStatsSnapshotDTO;
import generation.grimoire.dto.equipment.EquipmentUpgradeSimulationDTO;
import generation.grimoire.entity.Anomalie;
import generation.grimoire.entity.Equipment;
import generation.grimoire.entity.auth.AppUser;
import generation.grimoire.model.pve.CombatSession;
import generation.grimoire.repository.AnomalieRepository;
import generation.grimoire.repository.EquipmentRepository;
import generation.grimoire.repository.auth.UserRepository;
import generation.grimoire.repository.pve.DonjonRepository;
import generation.grimoire.service.AchievementService;
import generation.grimoire.service.pve.CombatService;
import generation.grimoire.service.pve.DungeonTutorialService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
public class EquipmentAwakeningService {

    public record UpgradeStatus(boolean eligible, boolean ready, String missingReason) {}

    private final EquipmentRepository equipmentRepository;
    private final AnomalieRepository anomalieRepository;
    private final UserRepository userRepository;
    private final DonjonRepository donjonRepository;
    private final DungeonTutorialService dungeonTutorialService;
    private final CombatService combatService;
    private final SecretAwakeningMapping secretAwakeningMapping;
    private final AchievementService achievementService;

    public EquipmentAwakeningService(
            EquipmentRepository equipmentRepository,
            AnomalieRepository anomalieRepository,
            UserRepository userRepository,
            DonjonRepository donjonRepository,
            DungeonTutorialService dungeonTutorialService,
            CombatService combatService,
            SecretAwakeningMapping secretAwakeningMapping,
            AchievementService achievementService) {
        this.equipmentRepository = equipmentRepository;
        this.anomalieRepository = anomalieRepository;
        this.userRepository = userRepository;
        this.donjonRepository = donjonRepository;
        this.dungeonTutorialService = dungeonTutorialService;
        this.combatService = combatService;
        this.secretAwakeningMapping = secretAwakeningMapping;
        this.achievementService = achievementService;
    }

    public boolean isAwakeningUnlocked(AppUser user, boolean isAdmin) {
        if (isAdmin) return true;
        if (user == null) return false;
        return dungeonTutorialService.hasCompletedLevel3Dungeon(user, donjonRepository.findAllLightProjections());
    }

    public boolean isPersonnageInActiveCombat(Long personnageId) {
        if (personnageId == null || combatService == null) return false;
        Map<String, CombatSession> sessions = combatService.getActiveSessions();
        if (sessions == null || sessions.isEmpty()) return false;
        for (CombatSession session : sessions.values()) {
            if (session == null || session.isFinished()) continue;
            if (session.getPlayers() != null && session.getPlayers().stream()
                    .anyMatch(p -> p != null && personnageId.equals(p.getId()))) {
                return true;
            }
        }
        return false;
    }

    public Set<Long> getActiveCombatPersonnageIds() {
        Set<Long> ids = new HashSet<>();
        if (combatService == null) return ids;
        Map<String, CombatSession> sessions = combatService.getActiveSessions();
        if (sessions == null) return ids;
        for (CombatSession session : sessions.values()) {
            if (session == null || session.isFinished() || session.getPlayers() == null) continue;
            session.getPlayers().forEach(p -> {
                if (p != null && p.getId() != null) ids.add(p.getId());
            });
        }
        return ids;
    }

    public Map<Long, UpgradeStatus> computeUpgradeStatuses(
            AppUser user,
            boolean isAdmin,
            boolean unlockedAwakening,
            List<Equipment> equipments,
            List<Anomalie> userAnomalies) {

        Map<Long, UpgradeStatus> result = new HashMap<>();
        if (equipments == null || equipments.isEmpty()) return result;

        Map<String, Integer> anomalyCounts = countNonTemplateAnomalies(userAnomalies);
        Set<Long> inCombatPersoIds = getActiveCombatPersonnageIds();
        double userGold = user != null ? user.getMonnaie() : 0.0;

        for (Equipment eq : equipments) {
            if (eq.getId() == null) continue;
            result.put(eq.getId(), evaluateUpgradeStatus(eq, isAdmin, unlockedAwakening, userGold, anomalyCounts, inCombatPersoIds));
        }
        return result;
    }

    public UpgradeStatus evaluateUpgradeStatus(
            Equipment eq,
            boolean isAdmin,
            boolean unlockedAwakening,
            double userGold,
            Map<String, Integer> anomalyCounts,
            Set<Long> inCombatPersoIds) {

        boolean eligible = EquipmentScalingHelper.isUpgradeEligible(eq);
        if (!eligible) {
            return new UpgradeStatus(false, false, "Objet non éligible à l'éveil");
        }
        int currentLevel = EquipmentScalingHelper.clampLevel(eq);
        if (currentLevel >= EquipmentScalingHelper.MAX_UPGRADE_LEVEL) {
            return new UpgradeStatus(true, false, "Niveau maximum (+5) atteint");
        }
        if (!unlockedAwakening) {
            return new UpgradeStatus(true, false, "Terminez un donjon de niveau 3 pour débloquer l'Atelier d'Éveil");
        }
        if (eq.getPersonnage() != null && inCombatPersoIds.contains(eq.getPersonnage().getId())) {
            return new UpgradeStatus(true, false, "Impossible d'éveiller un objet porté en combat actif");
        }

        int nextLevel = currentLevel + 1;
        SecretAwakeningMapping.AwakeningDuo duo = secretAwakeningMapping.resolveForSecret(eq.getRequiredSecret());
        SecretAwakeningMapping.TierCost tierCost = secretAwakeningMapping.getTierCost(nextLevel);
        double goldCost = secretAwakeningMapping.getGoldCost(nextLevel, eq.getRarity());

        int catOwned = anomalyCounts.getOrDefault(duo.catalystName().toLowerCase(), 0);
        int awkOwned = anomalyCounts.getOrDefault(duo.awakeningName().toLowerCase(), 0);

        List<String> missing = new ArrayList<>();
        if (!isAdmin) {
            if (tierCost.catalystQty() > 0 && catOwned < tierCost.catalystQty()) {
                missing.add((tierCost.catalystQty() - catOwned) + "× " + duo.catalystName());
            }
            if (tierCost.awakeningQty() > 0 && awkOwned < tierCost.awakeningQty()) {
                missing.add((tierCost.awakeningQty() - awkOwned) + "× " + duo.awakeningName());
            }
            if (userGold < goldCost) {
                missing.add((long) Math.ceil(goldCost - userGold) + " Or");
            }
        }

        if (!missing.isEmpty()) {
            return new UpgradeStatus(true, false, "Manque : " + String.join(", ", missing));
        }
        return new UpgradeStatus(true, true, null);
    }

    @Transactional(readOnly = true)
    public EquipmentUpgradeSimulationDTO simulateUpgrade(String username, boolean isAdmin, Long equipmentId) {
        AppUser user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur introuvable."));
        Equipment eq = equipmentRepository.findById(Objects.requireNonNull(equipmentId))
                .orElseThrow(() -> new IllegalArgumentException("Équipement introuvable."));

        if (!isAdmin && (eq.getUser() == null || !username.equals(eq.getUser().getUsername()))) {
            throw new SecurityException("Cet équipement ne vous appartient pas.");
        }

        boolean unlockedAwakening = isAwakeningUnlocked(user, isAdmin);
        List<Anomalie> userAnomalies = anomalieRepository.findByOwnerUsername(username);
        Map<String, Integer> anomalyCounts = countNonTemplateAnomalies(userAnomalies);
        Set<Long> inCombatPersoIds = getActiveCombatPersonnageIds();

        return buildSimulationDTO(eq, user, isAdmin, unlockedAwakening, anomalyCounts, inCombatPersoIds);
    }

    @Transactional
    public EquipmentUpgradeSimulationDTO executeUpgrade(String username, boolean isAdmin, Long equipmentId) {
        AppUser user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur introuvable."));
        Equipment eq = equipmentRepository.findById(Objects.requireNonNull(equipmentId))
                .orElseThrow(() -> new IllegalArgumentException("Équipement introuvable."));

        if (!isAdmin && (eq.getUser() == null || !username.equals(eq.getUser().getUsername()))) {
            throw new SecurityException("Cet équipement ne vous appartient pas.");
        }

        boolean unlockedAwakening = isAwakeningUnlocked(user, isAdmin);
        if (!unlockedAwakening) {
            throw new SecurityException("Terminez un donjon de niveau 3 pour débloquer l'Atelier d'Éveil.");
        }

        if (!EquipmentScalingHelper.isUpgradeEligible(eq)) {
            throw new IllegalArgumentException("Seuls les équipements Légendaires, Épiques, Reliques et Maudits peuvent être éveillés.");
        }

        int currentLevel = EquipmentScalingHelper.clampLevel(eq);
        if (currentLevel >= EquipmentScalingHelper.MAX_UPGRADE_LEVEL) {
            throw new IllegalArgumentException("Cet équipement a déjà atteint le palier maximum (+5).");
        }

        if (eq.getPersonnage() != null && isPersonnageInActiveCombat(eq.getPersonnage().getId())) {
            throw new IllegalStateException("Impossible d'éveiller un équipement porté par un personnage en combat actif.");
        }

        int nextLevel = currentLevel + 1;
        SecretAwakeningMapping.AwakeningDuo duo = secretAwakeningMapping.resolveForSecret(eq.getRequiredSecret());
        SecretAwakeningMapping.TierCost tierCost = secretAwakeningMapping.getTierCost(nextLevel);
        double goldCost = secretAwakeningMapping.getGoldCost(nextLevel, eq.getRarity());

        List<Anomalie> userAnomalies = anomalieRepository.findByOwnerUsername(username);

        if (!isAdmin) {
            if (user.getMonnaie() < goldCost) {
                throw new IllegalArgumentException("Or insuffisant (" + (long) goldCost + " Or requis).");
            }

            List<Anomalie> toDelete = new ArrayList<>();
            if (tierCost.catalystQty() > 0) {
                List<Anomalie> catalysts = userAnomalies.stream()
                        .filter(a -> !a.isTemplate() && a.getName() != null && a.getName().equalsIgnoreCase(duo.catalystName()))
                        .limit(tierCost.catalystQty())
                        .toList();
                if (catalysts.size() < tierCost.catalystQty()) {
                    throw new IllegalArgumentException("Catalyseur insuffisant : " + tierCost.catalystQty() + "× " + duo.catalystName() + " requis.");
                }
                toDelete.addAll(catalysts);
            }
            if (tierCost.awakeningQty() > 0) {
                List<Anomalie> awakenings = userAnomalies.stream()
                        .filter(a -> !a.isTemplate() && a.getName() != null && a.getName().equalsIgnoreCase(duo.awakeningName()))
                        .limit(tierCost.awakeningQty())
                        .toList();
                if (awakenings.size() < tierCost.awakeningQty()) {
                    throw new IllegalArgumentException("Anomalie d'éveil insuffisante : " + tierCost.awakeningQty() + "× " + duo.awakeningName() + " requis.");
                }
                toDelete.addAll(awakenings);
            }

            user.setMonnaie(user.getMonnaie() - goldCost);
            if (!toDelete.isEmpty()) {
                anomalieRepository.deleteAll(toDelete);
                userAnomalies.removeAll(toDelete);
            }
            if (!user.isAwakeningTutorialCompleted()) {
                user.setAwakeningTutorialCompleted(true);
            }
            userRepository.save(user);
            achievementService.onGoldChanged(user);
        }

        eq.setUpgradeLevel(nextLevel);
        equipmentRepository.save(eq);

        Map<String, Integer> updatedCounts = countNonTemplateAnomalies(userAnomalies);
        return buildSimulationDTO(eq, user, isAdmin, unlockedAwakening, updatedCounts, getActiveCombatPersonnageIds());
    }

    private EquipmentUpgradeSimulationDTO buildSimulationDTO(
            Equipment eq,
            AppUser user,
            boolean isAdmin,
            boolean unlockedAwakening,
            Map<String, Integer> anomalyCounts,
            Set<Long> inCombatPersoIds) {

        int currentLevel = EquipmentScalingHelper.clampLevel(eq);
        boolean eligible = EquipmentScalingHelper.isUpgradeEligible(eq);
        boolean maxReached = eligible && currentLevel >= EquipmentScalingHelper.MAX_UPGRADE_LEVEL;
        int nextLevel = maxReached ? currentLevel : Math.min(EquipmentScalingHelper.MAX_UPGRADE_LEVEL, currentLevel + 1);

        UpgradeStatus status = evaluateUpgradeStatus(eq, isAdmin, unlockedAwakening, user.getMonnaie(), anomalyCounts, inCombatPersoIds);
        boolean inActiveCombat = eq.getPersonnage() != null && inCombatPersoIds.contains(eq.getPersonnage().getId());

        SecretAwakeningMapping.AwakeningDuo duo = secretAwakeningMapping.resolveForSecret(eq.getRequiredSecret());
        SecretAwakeningMapping.TierCost tierCost = eligible && !maxReached
                ? secretAwakeningMapping.getTierCost(nextLevel)
                : new SecretAwakeningMapping.TierCost(currentLevel, 0, 0, 0);
        double goldCost = eligible && !maxReached ? secretAwakeningMapping.getGoldCost(nextLevel, eq.getRarity()) : 0;

        EquipmentStatsSnapshotDTO currentStats = EquipmentScalingHelper.computeSnapshot(eq, currentLevel);
        EquipmentStatsSnapshotDTO nextStats = eligible
                ? EquipmentScalingHelper.computeSnapshot(eq, nextLevel)
                : currentStats;
        EquipmentStatsSnapshotDTO deltas = new EquipmentStatsSnapshotDTO(
                nextStats.bonusHealthMax() - currentStats.bonusHealthMax(),
                nextStats.bonusManaMax() - currentStats.bonusManaMax(),
                nextStats.bonusPower() - currentStats.bonusPower(),
                nextStats.bonusStrength() - currentStats.bonusStrength(),
                nextStats.bonusArmor() - currentStats.bonusArmor(),
                nextStats.bonusResistance() - currentStats.bonusResistance(),
                nextStats.bonusSpeed() - currentStats.bonusSpeed(),
                nextStats.bonusCrit() - currentStats.bonusCrit(),
                nextStats.regenHealthPerTurn() - currentStats.regenHealthPerTurn(),
                nextStats.regenManaPerTurn() - currentStats.regenManaPerTurn(),
                nextStats.specialEffectValue() - currentStats.specialEffectValue()
        );

        return new EquipmentUpgradeSimulationDTO(
                eq.getId(),
                eq.getName(),
                eq.getRarity() != null ? eq.getRarity().name() : null,
                eq.getRarity() != null ? eq.getRarity().getLabel() : null,
                eq.getSlot() != null ? eq.getSlot().name() : null,
                eq.getSlot() != null ? eq.getSlot().getLabel() : null,
                eq.getRequiredSecret(),
                eq.getSpecialEffect() != null ? eq.getSpecialEffect().name() : "NONE",
                currentLevel,
                nextLevel,
                EquipmentScalingHelper.MAX_UPGRADE_LEVEL,
                eligible,
                maxReached,
                unlockedAwakening,
                inActiveCombat,
                status.ready(),
                status.missingReason(),
                goldCost,
                user.getMonnaie(),
                duo.catalystName(),
                tierCost.catalystQty(),
                anomalyCounts.getOrDefault(duo.catalystName().toLowerCase(), 0),
                duo.awakeningName(),
                tierCost.awakeningQty(),
                anomalyCounts.getOrDefault(duo.awakeningName().toLowerCase(), 0),
                currentStats,
                nextStats,
                deltas
        );
    }

    private Map<String, Integer> countNonTemplateAnomalies(List<Anomalie> anomalies) {
        Map<String, Integer> counts = new HashMap<>();
        if (anomalies == null) return counts;
        for (Anomalie a : anomalies) {
            if (a == null || a.isTemplate() || a.getName() == null) continue;
            counts.merge(a.getName().toLowerCase(), 1, (x, y) -> (x != null ? x : 0) + (y != null ? y : 0));
        }
        return counts;
    }
}
