package generation.grimoire.repository.pve;

import generation.grimoire.entity.pve.Mutation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MutationRepository extends JpaRepository<Mutation, Long> {
}
