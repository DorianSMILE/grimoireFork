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
                .excludePathPatterns("/css/**", "/js/**", "/images/**", "/styles/**", "/app/**", "/login", "/register", "/api/combat/**", "/api/pve/combat/**", "/api/pve/multi/**", "/api/auth/**", "/combat.html", "/error", "/api/anomalies/**");
    }

    @Override
    public void addViewControllers(@NonNull ViewControllerRegistry registry) {
        // Routes SPA React migrées
        registry.addRedirectViewController("/", "/grimoire");
        registry.addViewController("/grimoire").setViewName("forward:/app/index.html");
        registry.addViewController("/login").setViewName("forward:/app/index.html");
        registry.addViewController("/register").setViewName("forward:/app/index.html");
    }
}