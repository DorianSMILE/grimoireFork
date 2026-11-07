package generation.grimoire.repository.pve;

import generation.grimoire.entity.pve.DungeonRunStat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface DungeonRunStatRepository extends JpaRepository<DungeonRunStat, Long> {

    record DungeonRunCountProjection(Long dungeonId, long count) {}

    @Query("SELECT COALESCE(MAX(d.runNumber), 0) FROM DungeonRunStat d WHERE d.dungeonId = :dungeonId")
    int findMaxRunNumberByDungeonId(Long dungeonId);

    @Query("SELECT new generation.grimoire.repository.pve.DungeonRunStatRepository$DungeonRunCountProjection(d.dungeonId, COUNT(d)) FROM DungeonRunStat d WHERE d.dungeonId IS NOT NULL GROUP BY d.dungeonId")
    List<DungeonRunCountProjection> countRunsByDungeon();

    List<DungeonRunStat> findByAccountName(String accountName);
}
