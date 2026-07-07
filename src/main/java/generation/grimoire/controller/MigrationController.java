package generation.grimoire.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import jakarta.persistence.EntityManager;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/migration")
public class MigrationController {

    private final EntityManager entityManager;

    public MigrationController(EntityManager entityManager) {
        this.entityManager = entityManager;
    }

    @GetMapping("/run")
    @Transactional
    public ResponseEntity<?> runMigration() {
        int eqMigrated = 0;
        int anMigrated = 0;

        try {
            // 1. Annuler la migration agressive précédente sur Equipment
            // On remet tout à Dorios. La requête est sûre car is_template existe bien.
            entityManager.createNativeQuery(
                    "UPDATE equipment SET is_template = false, owner_username = 'Dorios', user_id = (SELECT id FROM app_user WHERE username = 'Dorios' LIMIT 1) "
                            +
                            "WHERE is_template = true")
                    .executeUpdate();
        } catch (Exception e) {
            System.out.println("Could not revert equipment migration: " + e.getMessage());
        }

        try {
            // 2. Annuler la migration agressive sur Anomalie (on remet tout à Dorios)
            entityManager.createNativeQuery(
                    "UPDATE anomalie SET is_template = false, owner_username = 'Dorios', user_id = (SELECT id FROM app_user WHERE username = 'Dorios' LIMIT 1) "
                            +
                            "WHERE is_template = true")
                    .executeUpdate();
        } catch (Exception e) {
            System.out.println("Could not revert anomalie migration: " + e.getMessage());
        }

        // 3. S'assurer que CHAQUE nom d'équipement a exactement UN modèle
        List<String> eqNames = entityManager.createQuery("SELECT DISTINCT e.name FROM Equipment e", String.class)
                .getResultList();
        for (String name : eqNames) {
            if (name == null || name.trim().isEmpty())
                continue;
            Long templateCount = entityManager
                    .createQuery("SELECT COUNT(e) FROM Equipment e WHERE e.name = :name AND e.isTemplate = true",
                            Long.class)
                    .setParameter("name", name)
                    .getSingleResult();

            if (templateCount == 0) {
                // Prendre le premier item non-assigné pour en faire un modèle
                List<generation.grimoire.entity.Equipment> candidates = entityManager.createQuery(
                        "SELECT e FROM Equipment e WHERE e.name = :name AND e.personnage IS NULL ORDER BY e.id ASC",
                        generation.grimoire.entity.Equipment.class)
                        .setParameter("name", name)
                        .setMaxResults(1)
                        .getResultList();

                if (!candidates.isEmpty()) {
                    generation.grimoire.entity.Equipment toTemplate = candidates.get(0);
                    toTemplate.setTemplate(true);
                    toTemplate.setOwnerUsername("MODELE");
                    toTemplate.setUser(null);
                    entityManager.merge(toTemplate);
                    eqMigrated++;
                }
            }
        }

        // 4. S'assurer que CHAQUE nom d'anomalie a exactement UN modèle
        List<String> anoNames = entityManager.createQuery("SELECT DISTINCT a.name FROM Anomalie a", String.class)
                .getResultList();
        for (String name : anoNames) {
            if (name == null || name.trim().isEmpty())
                continue;
            Long templateCount = entityManager
                    .createQuery("SELECT COUNT(a) FROM Anomalie a WHERE a.name = :name AND a.isTemplate = true",
                            Long.class)
                    .setParameter("name", name)
                    .getSingleResult();

            if (templateCount == 0) {
                List<generation.grimoire.entity.Anomalie> candidates = entityManager.createQuery(
                        "SELECT a FROM Anomalie a WHERE a.name = :name ORDER BY a.id ASC",
                        generation.grimoire.entity.Anomalie.class)
                        .setParameter("name", name)
                        .setMaxResults(1)
                        .getResultList();

                if (!candidates.isEmpty()) {
                    generation.grimoire.entity.Anomalie toTemplate = candidates.get(0);
                    toTemplate.setTemplate(true);
                    toTemplate.setOwnerUsername("MODELE");
                    toTemplate.setUser(null);
                    entityManager.merge(toTemplate);
                    anMigrated++;
                }
            }
        }

        return ResponseEntity.ok(Map.of(
                "message", "Migration DB native terminée.",
                "equipmentsMigrated", eqMigrated,
                "anomaliesMigrated", anMigrated));
    }
}
