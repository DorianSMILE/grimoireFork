package generation.grimoire.dto.equipment;

import java.util.Map;

public record EquipmentDismantleSimulationDTO(
        int quantity,
        String equipmentName,
        String rarity,
        int upgradeLevel,
        boolean canDismantle,
        String blockedReason,
        double goldReward,
        Map<String, Integer> anomalyRewards
) {}
