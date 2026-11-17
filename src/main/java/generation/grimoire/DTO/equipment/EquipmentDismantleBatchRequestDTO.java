package generation.grimoire.dto.equipment;

import java.util.List;

public record EquipmentDismantleBatchRequestDTO(
        List<Long> equipmentIds
) {}
