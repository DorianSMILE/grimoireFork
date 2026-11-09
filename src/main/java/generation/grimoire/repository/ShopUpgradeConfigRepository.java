package generation.grimoire.repository;

import generation.grimoire.entity.ShopUpgradeConfig;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.lang.NonNull;

import java.util.List;
import java.util.Optional;

public interface ShopUpgradeConfigRepository extends JpaRepository<ShopUpgradeConfig, Long> {
    @Cacheable("shopUpgradeConfigByLevel")
    Optional<ShopUpgradeConfig> findByTargetLevel(int targetLevel);

    @Override
    @NonNull
    @Cacheable("shopUpgradeConfigs")
    List<ShopUpgradeConfig> findAll();
}
