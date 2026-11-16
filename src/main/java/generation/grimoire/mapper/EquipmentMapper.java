package generation.grimoire.mapper;

import generation.grimoire.dto.equipment.EquipmentRequestDTO;
import generation.grimoire.dto.equipment.EquipmentResponseDTO;
import generation.grimoire.dto.equipment.EquipmentShopDTO;
import generation.grimoire.entity.Equipment;
import org.mapstruct.*;

@Mapper(componentModel = "spring", unmappedTargetPolicy = org.mapstruct.ReportingPolicy.IGNORE)
public interface EquipmentMapper {

    // ── Input: DTO → Entity ──

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "template", ignore = true)
    @Mapping(target = "user", ignore = true)
    @Mapping(target = "personnage", ignore = true)
    @Mapping(target = "ownerUsername", ignore = true)
    @Mapping(target = "upgradeLevel", ignore = true)
    void updateEntity(EquipmentRequestDTO dto, @MappingTarget Equipment entity);

    // ── Output: Entity → Response DTO ──

    @Mapping(target = "slot", expression = "java(e.getSlot() != null ? e.getSlot().name() : null)")
    @Mapping(target = "rarity", expression = "java(e.getRarity() != null ? e.getRarity().name() : null)")
    @Mapping(target = "specialEffect", expression = "java(e.getSpecialEffect() != null ? e.getSpecialEffect().name() : null)")
    @Mapping(target = "consumableCategory", expression = "java(e.getConsumableCategory() != null ? e.getConsumableCategory().name() : \"AUTRE\")")
    @Mapping(target = "weight", expression = "java(e.calculateWeight())")
    @Mapping(target = "bonusHealthMax", expression = "java(generation.grimoire.service.equipment.EquipmentScalingHelper.getEffectiveHealthMax(e))")
    @Mapping(target = "bonusManaMax", expression = "java(generation.grimoire.service.equipment.EquipmentScalingHelper.getEffectiveManaMax(e))")
    @Mapping(target = "bonusPower", expression = "java(generation.grimoire.service.equipment.EquipmentScalingHelper.getEffectivePower(e))")
    @Mapping(target = "bonusStrength", expression = "java(generation.grimoire.service.equipment.EquipmentScalingHelper.getEffectiveStrength(e))")
    @Mapping(target = "bonusArmor", expression = "java(generation.grimoire.service.equipment.EquipmentScalingHelper.getEffectiveArmor(e))")
    @Mapping(target = "bonusResistance", expression = "java(generation.grimoire.service.equipment.EquipmentScalingHelper.getEffectiveResistance(e))")
    @Mapping(target = "bonusSpeed", expression = "java(generation.grimoire.service.equipment.EquipmentScalingHelper.getEffectiveSpeed(e))")
    @Mapping(target = "bonusCrit", expression = "java(generation.grimoire.service.equipment.EquipmentScalingHelper.getEffectiveCrit(e))")
    @Mapping(target = "regenHealthPerTurn", expression = "java(generation.grimoire.service.equipment.EquipmentScalingHelper.getEffectiveRegenHealthPerTurn(e))")
    @Mapping(target = "regenManaPerTurn", expression = "java(generation.grimoire.service.equipment.EquipmentScalingHelper.getEffectiveRegenManaPerTurn(e))")
    @Mapping(target = "specialEffectValue", expression = "java(generation.grimoire.service.equipment.EquipmentScalingHelper.getEffectiveSpecialEffectValue(e))")
    @Mapping(target = "upgradeLevel", expression = "java(generation.grimoire.service.equipment.EquipmentScalingHelper.clampLevel(e))")
    @Mapping(target = "maxUpgradeLevel", constant = "5")
    @Mapping(target = "upgradeEligible", expression = "java(generation.grimoire.service.equipment.EquipmentScalingHelper.isUpgradeEligible(e))")
    @Mapping(target = "upgradeReady", ignore = true)
    @Mapping(target = "upgradeMissingReason", ignore = true)
    @Mapping(target = "maxWeight", ignore = true)
    @Mapping(target = "personnage", ignore = true)
    @Mapping(target = "ownerUsername", ignore = true)
    @Mapping(target = "template", source = "template")
    EquipmentResponseDTO toResponse(Equipment e);

    // ── Output: Entity → Shop DTO ──

    @Mapping(target = "consumableCategory", expression = "java(e.getConsumableCategory() != null ? e.getConsumableCategory().name() : \"AUTRE\")")
    @Mapping(target = "weight", expression = "java(e.calculateWeight())")
    @Mapping(target = "consumable", expression = "java(e.getSlot() == generation.grimoire.enumeration.EquipmentSlot.CONSOMMABLE)")
    @Mapping(target = "shopPrice", ignore = true)
    @Mapping(target = "discount", ignore = true)
    @Mapping(target = "originalPrice", ignore = true)
    EquipmentShopDTO toShopDto(Equipment e);
}
