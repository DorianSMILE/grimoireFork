package generation.grimoire.service.equipment;

import generation.grimoire.dto.equipment.EquipmentUpgradeSimulationDTO;
import generation.grimoire.entity.Anomalie;
import generation.grimoire.entity.Equipment;
import generation.grimoire.entity.auth.AppUser;
import generation.grimoire.enumeration.AnomalieType;
import generation.grimoire.enumeration.EquipmentRarity;
import generation.grimoire.enumeration.EquipmentSlot;
import generation.grimoire.repository.AnomalieRepository;
import generation.grimoire.repository.EquipmentRepository;
import generation.grimoire.repository.auth.UserRepository;
import generation.grimoire.repository.pve.DonjonRepository;
import generation.grimoire.service.AchievementService;
import generation.grimoire.service.pve.CombatService;
import generation.grimoire.service.pve.DungeonTutorialService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("null")
class EquipmentAwakeningServiceTest {

    @Mock private EquipmentRepository equipmentRepository;
    @Mock private AnomalieRepository anomalieRepository;
    @Mock private UserRepository userRepository;
    @Mock private DonjonRepository donjonRepository;
    @Mock private CombatService combatService;
    @Mock private AchievementService achievementService;

    private DungeonTutorialService dungeonTutorialService;
    private EquipmentAwakeningService service;
    private AppUser user;
    private Equipment legSword;
    private List<DonjonRepository.DonjonLightProjection> dungeons;

    @BeforeEach
    void setUp() {
        dungeonTutorialService = new DungeonTutorialService(donjonRepository);
        service = new EquipmentAwakeningService(
                equipmentRepository,
                anomalieRepository,
                userRepository,
                donjonRepository,
                dungeonTutorialService,
                combatService,
                new SecretAwakeningMapping(),
                achievementService
        );

        user = new AppUser();
        user.setId(1L);
        user.setUsername("hero");
        user.setRole("USER");
        user.setMonnaie(2000);
        user.setCompletedDungeons(new HashSet<>(Set.of(103L)));

        legSword = new Equipment();
        legSword.setId(55L);
        legSword.setName("Lame du Chaos");
        legSword.setRarity(EquipmentRarity.LEGENDAIRE);
        legSword.setSlot(EquipmentSlot.ARME_DEUX_MAINS);
        legSword.setRequiredSecret("Secret du Chaos");
        legSword.setBonusStrength(10);
        legSword.setUpgradeLevel(0);
        legSword.setUser(user);
        legSword.setOwnerUsername("hero");

        dungeons = List.of(
                new DonjonRepository.DonjonLightProjection(101L, null, 0, 1, 0),
                new DonjonRepository.DonjonLightProjection(103L, null, 0, 3, 0)
        );
    }

    @Test
    void hasCompletedLevel3Dungeon_respectsRecommendedLevelGate() {
        AppUser noLvl3 = new AppUser();
        noLvl3.setCompletedDungeons(Set.of(101L));

        assertFalse(dungeonTutorialService.hasCompletedLevel3Dungeon(noLvl3, dungeons));
        assertTrue(dungeonTutorialService.hasCompletedLevel3Dungeon(user, dungeons));
    }

    @Test
    void executeUpgrade_throwsSecurityExceptionBeforeLevel3Dungeon() {
        user.setCompletedDungeons(Set.of(101L));
        when(userRepository.findByUsername("hero")).thenReturn(Optional.of(user));
        when(equipmentRepository.findById(55L)).thenReturn(Optional.of(legSword));
        when(donjonRepository.findAllLightProjections()).thenReturn(dungeons);

        assertThrows(SecurityException.class, () -> service.executeUpgrade("hero", false, 55L));
        assertEquals(0, legSword.getUpgradeLevel());
    }

    @Test
    void executeUpgrade_consumesCatalystAndGoldAndIncreasesUpgradeLevelPreservingBaseStats() {
        Anomalie cat = new Anomalie();
        cat.setId(900L);
        cat.setName("Éclat de Chaos");
        cat.setLevel(4);
        cat.setAnomalieType(AnomalieType.CATALYSEUR);
        cat.setOwnerUsername("hero");
        cat.setTemplate(false);

        when(userRepository.findByUsername("hero")).thenReturn(Optional.of(user));
        when(equipmentRepository.findById(55L)).thenReturn(Optional.of(legSword));
        when(donjonRepository.findAllLightProjections()).thenReturn(dungeons);
        when(anomalieRepository.findByOwnerUsername("hero")).thenReturn(new ArrayList<>(List.of(cat)));
        when(combatService.getActiveSessions()).thenReturn(Collections.emptyMap());

        EquipmentUpgradeSimulationDTO result = service.executeUpgrade("hero", false, 55L);

        assertEquals(1, legSword.getUpgradeLevel());
        assertEquals(10, legSword.getBonusStrength(), "DB base stat stays at +0");
        assertEquals(1, result.currentLevel());
        assertEquals(1500.0, user.getMonnaie(), 0.01);
        verify(anomalieRepository).deleteAll(List.of(cat));
        verify(equipmentRepository).save(legSword);
        verify(userRepository).save(user);
    }

    @Test
    void simulateUpgrade_usesGenericDuoWhenNoSecretRequired() {
        legSword.setRequiredSecret(null);

        when(userRepository.findByUsername("hero")).thenReturn(Optional.of(user));
        when(equipmentRepository.findById(55L)).thenReturn(Optional.of(legSword));
        when(donjonRepository.findAllLightProjections()).thenReturn(dungeons);
        when(anomalieRepository.findByOwnerUsername("hero")).thenReturn(List.of());
        when(combatService.getActiveSessions()).thenReturn(Collections.emptyMap());

        EquipmentUpgradeSimulationDTO sim = service.simulateUpgrade("hero", false, 55L);

        assertEquals("Poussière d'Éveil", sim.catalystName());
        assertEquals("Pierre d'Ascension", sim.awakeningName());
        assertFalse(sim.canUpgrade());
        assertEquals(11, sim.nextStats().bonusStrength()); // 10 * (1 + 0.08 * 1.25 * 1) = 11
        assertEquals(1, sim.deltas().bonusStrength());
    }
}
