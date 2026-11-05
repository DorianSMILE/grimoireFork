package generation.grimoire.repository;

import generation.grimoire.entity.Anomalie;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.cache.annotation.Cacheable;
import java.util.List;

public interface AnomalieRepository extends JpaRepository<Anomalie, Long> {
    List<Anomalie> findByOwnerUsername(String ownerUsername);

    @Query("SELECT DISTINCT a.name FROM Anomalie a WHERE a.ownerUsername = :ownerUsername AND a.name IS NOT NULL")
    List<String> findDistinctNamesByOwnerUsername(@Param("ownerUsername") String ownerUsername);

    @Query("SELECT a.id, a.name FROM Anomalie a WHERE a.name IS NOT NULL")
    List<Object[]> findAllIdAndName();

    @Cacheable("anomalieTemplateByName")
    Anomalie findFirstByNameAndIsTemplateTrueOrderByIdAsc(String name);
    
    @Cacheable("anomalieTemplates")
    List<Anomalie> findByIsTemplateTrue();
    List<Anomalie> findByName(String name);
    
    @Cacheable("anomalieDistinctNames")
    @Query("SELECT DISTINCT a.name FROM Anomalie a WHERE a.name IS NOT NULL")
    List<String> findDistinctNames();
}
