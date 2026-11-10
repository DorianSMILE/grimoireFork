package generation.grimoire.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.lang.NonNull;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.ViewControllerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import lombok.RequiredArgsConstructor;

@Configuration
@RequiredArgsConstructor
public class WebMvcConfig implements WebMvcConfigurer {

    @NonNull
    private final CombatInterceptor combatInterceptor;

    @Override
    public void addInterceptors(@NonNull InterceptorRegistry registry) {
        registry.addInterceptor(combatInterceptor)
                .addPathPatterns("/**")
                .excludePathPatterns("/css/**", "/js/**", "/images/**", "/styles/**", "/app/**", "/login", "/register", "/api/combat/**", "/api/pve/combat/**", "/api/pve/multi/**", "/api/auth/**", "/combat.html", "/combat", "/error", "/api/anomalies/**");
    }

    @Override
    public void addViewControllers(@NonNull ViewControllerRegistry registry) {
        // Routes SPA React (migrées + cibles pour éviter de redémarrer Spring Boot à chaque page)
        registry.addRedirectViewController("/", "/grimoire");
        String[] spaRoutes = {
            "/grimoire", "/armory", "/login", "/register",
            "/secrets", "/achievements", "/hunting", "/shop",
            "/alchemy", "/vault", "/dungeon-stats", "/dungeons",
            "/combat", "/shop-admin", "/alchemy-admin", "/pve-admin"
        };
        for (String route : spaRoutes) {
            registry.addViewController(route).setViewName("forward:/app/index.html");
        }
    }
}