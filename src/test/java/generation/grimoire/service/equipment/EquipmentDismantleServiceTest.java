package generation.grimoire.service.equipment;

import generation.grimoire.dto.equipment.EquipmentDismantleSimulationDTO;
import generation.grimoire.entity.AlchemyRecipe;
import generation.grimoire.entity.Anomalie;
import generation.grimoire.entity.Equipment;
import generation.grimoire.entity.auth.AppUser;
import generation.grimoire.enumeration.*;
import generation.grimoire.repository.AlchemyRecipeRepository;
import generation.grimoire.repository.AnomalieRepository;
import generation.grimoire.repository.EquipmentRepository;
import generation.grimoire.repository.auth.UserRepository;
import generation.grimoire.repository.pve.LootEntryRepository;
import generation.grimoire.service.AchievementService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("null")
class EquipmentDismantleServiceTest {

    @Mock private EquipmentRepository equipmentRepository;
    @Mock private AnomalieRepository anomalieRepository;
    @Mock private AlchemyRecipeRepository alchemyRecipeRepository;
    @Mock private UserRepository userRepository;
    @Mock private LootEntryRepository lootEntryRepository;
    @Mock private AchievementService achievementService;

    private EquipmentDismantleService service;
    private AppUser user;
    private AlchemyRecipe catalystRecipe;

    @BeforeEach
    void setUp() {
        service = new EquipmentDismantleService(
                equipmentRepository,
                anomalieRepository,
                alchemyRecipeRepository,
                userRepository,
                lootEntryRepository,
                new SecretAwakeningMapping(),
                achievementService
        );

        user = new AppUser();
        user.setId(1L);
        user.setUsername("hero");
        user.setMonnaie(100);
        user.setDiscoveredItems(new HashSet<>());

        catalystRecipe = new AlchemyRecipe();
        catalystRecipe.setId(10L);
        catalystRecipe.setName("Catalyseur du Chaos");
        catalystRecipe.setRewardType(RecipeRewardType.GIVE_CATALYST);
        catalystRecipe.setRewardName("Éclat de Chaos");
        catalystRecipe.setRequiredAnomalies(Map.of(
                "Cristal Incandescent", 2,
                "Cœur de Démon", 1,
                "Braise Ardente", 1
        ));
    }

    @Test
    void dismantleAwakenedItem_refundsGoldPlusPartialRawIngredientsStrictlyBelowFullCraft() {
        Equipment sword = new Equipment();
        sword.setId(50L);
        sword.setName("Lame du Chaos");
        sword.setRarity(EquipmentRarity.LEGENDAIRE);
        sword.setSlot(EquipmentSlot.ARME_GAUCHE);
        sword.setRequiredSecret("Secret du Chaos");
        sword.setBonusStrength(10);
        sword.setUpgradeLevel(1);
        sword.setUser(user);

        Anomalie templateIng = new Anomalie();
        templateIng.setName("Cristal Incandescent");
        templateIng.setLevel(1);
        templateIng.setTemplate(true);
        templateIng.setSpiritualite(SpiritualiteType.DESTRUCTION);
        templateIng.setCategory(AnomalieCategory.CRISTAL);

        when(userRepository.findByUsername("hero")).thenReturn(Optional.of(user));
        when(equipmentRepository.findById(50L)).thenReturn(Optional.of(sword));
        when(alchemyRecipeRepository.findAll()).thenReturn(List.of(catalystRecipe));
        when(anomalieRepository.findFirstByNameAndIsTemplateTrueOrderByIdAsc(any())).thenReturn(templateIng);

        EquipmentDismantleSimulationDTO result = service.executeDismantle("hero", false, List.of(50L));

        assertTrue(result.canDismantle());
        assertEquals(1, result.quantity());
        assertTrue(result.goldReward() > Math.ceil(sword.calculateWeight()), "Includes +30% invested gold");

        // Total raw ingredients per 1 catalyst = 2+1+1 = 4 -> strictly less than 4 refunded, at least 1
        int totalReturnedAnoms = result.anomalyRewards().values().stream().mapToInt(Integer::intValue).sum();
        assertTrue(totalReturnedAnoms >= 1 && totalReturnedAnoms < 4,
                "Refund must be >= 1 and strictly < 4 (was " + totalReturnedAnoms + ")");

        verify(anomalieRepository).saveAll(anyList());
        verify(equipmentRepository).deleteById(50L);
        verify(achievementService).onEquipmentRecycled(user, 1);
    }

    @Test
    void dismantleBatch_aggregatesMultipleIdenticalItems() {
        Equipment eq1 = new Equipment();
        eq1.setId(1L);
        eq1.setName("Casque");
        eq1.setRarity(EquipmentRarity.RARE);
        eq1.setSlot(EquipmentSlot.CASQUE);
        eq1.setBonusArmor(5);
        eq1.setUpgradeLevel(0);
        eq1.setUser(user);

        Equipment eq2 = new Equipment();
        eq2.setId(2L);
        eq2.setName("Casque");
        eq2.setRarity(EquipmentRarity.RARE);
        eq2.setSlot(EquipmentSlot.CASQUE);
        eq2.setBonusArmor(5);
        eq2.setUpgradeLevel(0);
        eq2.setUser(user);

        when(userRepository.findByUsername("hero")).thenReturn(Optional.of(user));
        when(equipmentRepository.findById(1L)).thenReturn(Optional.of(eq1));
        when(equipmentRepository.findById(2L)).thenReturn(Optional.of(eq2));
        when(alchemyRecipeRepository.findAll()).thenReturn(List.of());

        EquipmentDismantleSimulationDTO sim = service.executeDismantle("hero", false, List.of(1L, 2L));

        assertEquals(2, sim.quantity());
        assertTrue(sim.anomalyRewards().isEmpty());
        verify(equipmentRepository).deleteById(1L);
        verify(equipmentRepository).deleteById(2L);
        verify(achievementService).onEquipmentRecycled(user, 2);
    }
}
