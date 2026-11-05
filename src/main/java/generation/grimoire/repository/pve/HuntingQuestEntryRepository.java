package generation.grimoire.repository.pve;

import generation.grimoire.entity.pve.HuntingQuestEntry;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface HuntingQuestEntryRepository extends JpaRepository<HuntingQuestEntry, Long> {

    Optional<HuntingQuestEntry> findByQuestIdAndAccountName(Long questId, String accountName);

    List<HuntingQuestEntry> findByQuestIdOrderByFirstCompletionTimeAsc(Long questId);

    List<HuntingQuestEntry> findByQuestIdOrderByCompletionCountDesc(Long questId);

    /** Weekly ranking: fewest turns first, earliest completion as tiebreaker. Null bestTurnCount goes last. */
    @Query(
        "SELECT e FROM HuntingQuestEntry e WHERE e.quest.id = :questId AND e.bestTurnCount IS NOT NULL " +
        "ORDER BY e.bestTurnCount ASC, e.firstCompletionTime ASC")
    List<HuntingQuestEntry> findByQuestIdOrderByBestTurnCountAsc(@Param("questId") Long questId);

    @Query("SELECT COUNT(e) FROM HuntingQuestEntry e WHERE e.quest.id = :questId AND e.bestTurnCount IS NOT NULL")
    long countCompletedByQuestId(@Param("questId") Long questId);

    long countByQuestId(Long questId);

    List<HuntingQuestEntry> findByQuestId(Long questId);

    @EntityGraph(attributePaths = {"quest"})
    List<HuntingQuestEntry> findByAccountName(String accountName);
}
