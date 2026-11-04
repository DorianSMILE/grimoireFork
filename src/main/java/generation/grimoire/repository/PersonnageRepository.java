package generation.grimoire.repository;

import generation.grimoire.entity.personnage.Personnage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PersonnageRepository extends JpaRepository<Personnage, Long> {

    @EntityGraph(attributePaths = {"voie", "voie.rankNames", "spiritualite", "spiritualite.rankNames", "user", "specialItems"})
    List<Personnage> findByUser_Username(String username);

    long countByUser_Username(String username);

    @Query("SELECT COALESCE(MAX(p.voieLevel), 0) FROM Personnage p WHERE p.user.username = :username")
    int findMaxVoieLevelByUsername(@Param("username") String username);

    @NonNull
    @EntityGraph(attributePaths = {"voie", "voie.rankNames", "spiritualite", "spiritualite.rankNames", "user", "specialItems"})
    List<Personnage> findAll();

    @NonNull
    @EntityGraph(attributePaths = {"voie", "voie.rankNames", "spiritualite", "spiritualite.rankNames", "user", "specialItems"})
    Optional<Personnage> findById(@NonNull Long id);
}
