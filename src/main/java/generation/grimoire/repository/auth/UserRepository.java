package generation.grimoire.repository.auth;

import generation.grimoire.entity.auth.AppUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<AppUser, Long> {
    record UserAuthProjection(String username, String password, String role) {}

    Optional<AppUser> findByUsername(String username);

    @Query("SELECT new generation.grimoire.repository.auth.UserRepository$UserAuthProjection(u.username, u.password, u.role) FROM AppUser u WHERE u.username = :username")
    Optional<UserAuthProjection> findAuthProjectionByUsername(@Param("username") String username);

    boolean existsByUsername(String username);
    List<AppUser> findByUsernameIn(java.util.Collection<String> usernames);
}
