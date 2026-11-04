package generation.grimoire.repository;

import generation.grimoire.entity.Equipment;
import generation.grimoire.enumeration.EquipmentRarity;
import generation.grimoire.enumeration.EquipmentSlot;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.cache.annotation.Cacheable;

import org.springframework.lang.NonNull;
import java.util.List;
import java.util.Optional;

@Repository
public interface EquipmentRepository extends JpaRepository<Equipment, Long> {
    @NonNull
    @EntityGraph(attributePaths = {"personnage", "personnage.voie", "user"})
    List<Equipment> findAll();

    @EntityGraph(attributePaths = {"personnage", "personnage.voie", "user"})
    List<Equipment> findByPersonnageId(Long personnageId);

    Optional<Equipment> findByPersonnageIdAndSlot(Long personnageId, EquipmentSlot slot);

    @EntityGraph(attributePaths = {"personnage", "personnage.voie", "user"})
    List<Equipment> findByPersonnageIsNullAndUser_Username(String username);

    List<Equipment> findByPersonnageIsNull();

    @EntityGraph(attributePaths = {"personnage", "personnage.voie", "user"})
    List<Equipment> findByUser_Username(String username);

    @EntityGraph(attributePaths = {"personnage", "personnage.voie", "user"})
    List<Equipment> findByOwnerUsername(String username);

    boolean existsByUser_UsernameAndRarity(String username, EquipmentRarity rarity);

    @Query("SELECT DISTINCT e.name FROM Equipment e WHERE e.user.username = :username AND e.name IS NOT NULL")
    List<String> findDistinctNamesByUserUsername(@Param("username") String username);

    @Query("SELECT e.id, e.name FROM Equipment e WHERE e.name IS NOT NULL")
    List<Object[]> findAllIdAndName();

    @Cacheable("equipmentTemplateByName")
    Equipment findFirstByNameAndIsTemplateTrueOrderByIdAsc(String name);

    @Cacheable("equipmentTemplates")
    @EntityGraph(attributePaths = {"personnage", "personnage.voie", "user"})
    List<Equipment> findByIsTemplateTrue();

    @Cacheable("equipmentShopTemplates")
    @EntityGraph(attributePaths = {"personnage", "personnage.voie", "user"})
    List<Equipment> findByIsTemplateTrueAndAvailableInShopTrue();

    List<Equipment> findByName(String name);

    @Cacheable("equipmentDistinctNames")
    @Query("SELECT DISTINCT e.name FROM Equipment e")
    List<String> findDistinctNames();
}
