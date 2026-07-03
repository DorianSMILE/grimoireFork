package generation.grimoire.repository.pve;

import generation.grimoire.entity.pve.Donjon;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DonjonRepository extends JpaRepository<Donjon, Long> {
    List<Donjon> findAllByOrderByDisplayOrderAsc();
}
