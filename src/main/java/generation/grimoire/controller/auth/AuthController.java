package generation.grimoire.controller.auth;

import generation.grimoire.entity.Equipment;
import generation.grimoire.entity.auth.AppUser;
import generation.grimoire.entity.pve.Donjon;
import generation.grimoire.enumeration.EquipmentSlot;
import generation.grimoire.model.pve.CombatSession;
import generation.grimoire.repository.EquipmentRepository;
import generation.grimoire.repository.PersonnageRepository;
import generation.grimoire.repository.auth.UserRepository;
import generation.grimoire.repository.pve.DonjonRepository;
import generation.grimoire.repository.pve.HuntingQuestEntryRepository;
import generation.grimoire.security.JwtService;
import generation.grimoire.security.RefreshTokenService;
import generation.grimoire.service.AlchemyService;
import generation.grimoire.service.pve.CombatService;
import generation.grimoire.service.pve.DungeonTutorialService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.Data;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;
    private final HuntingQuestEntryRepository huntingQuestEntryRepository;
    private final DonjonRepository donjonRepository;
    private final AlchemyService alchemyService;
    private final PersonnageRepository personnageRepository;
    private final EquipmentRepository equipmentRepository;
    private final CombatService combatService;
    private final DungeonTutorialService dungeonTutorialService;

    public AuthController(AuthenticationManager authenticationManager, UserRepository userRepository,
            PasswordEncoder passwordEncoder, JwtService jwtService, RefreshTokenService refreshTokenService,
            HuntingQuestEntryRepository huntingQuestEntryRepository,
            DonjonRepository donjonRepository,
            AlchemyService alchemyService,
            PersonnageRepository personnageRepository,
            EquipmentRepository equipmentRepository,
            CombatService combatService,
            DungeonTutorialService dungeonTutorialService) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.refreshTokenService = refreshTokenService;
        this.huntingQuestEntryRepository = huntingQuestEntryRepository;
        this.donjonRepository = donjonRepository;
        this.alchemyService = alchemyService;
        this.personnageRepository = personnageRepository;
        this.equipmentRepository = equipmentRepository;
        this.combatService = combatService;
        this.dungeonTutorialService = dungeonTutorialService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody LoginRequest loginRequest, HttpServletRequest request,
            HttpServletResponse response) {
        if (userRepository.existsByUsername(loginRequest.getUsername())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Ce nom d'utilisateur est déjà pris."));
        }

        AppUser user = new AppUser();
        user.setUsername(loginRequest.getUsername());
        user.setPassword(passwordEncoder.encode(loginRequest.getPassword()));
        user.setRole("USER");
        userRepository.save(user);

        // Auto-login after register
        return authenticateAndGenerateTokens(loginRequest.getUsername(), loginRequest.getPassword());
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest, HttpServletRequest request,
            HttpServletResponse response) {
        try {
            return authenticateAndGenerateTokens(loginRequest.getUsername(), loginRequest.getPassword());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Identifiants invalides."));
        }
    }

    @GetMapping("/me")
    @Transactional(readOnly = true)
    public ResponseEntity<?> getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Non connecté."));
        }

        Map<String, Object> res = new HashMap<>();
        String username = auth.getName();
        res.put("username", username);
        res.put("roles", auth.getAuthorities());

        userRepository.findByUsername(username).ifPresent(u -> {
            List<DonjonRepository.DonjonLightProjection> allDungeons = donjonRepository.findAllLightProjections();

            res.put("id", u.getId());
            res.put("monnaie", u.getMonnaie());
            res.put("unlockedSecrets", u.getUnlockedSecrets());
            res.put("claimedSecretRewards", u.getClaimedSecretRewards());
            List<String> claimable = getClaimableSecretRewards(u, allDungeons);
            res.put("claimableSecretRewards", claimable);
            res.put("claimableSecretRewardsCount", claimable.size());
            res.put("unlockedDungeons", u.getUnlockedDungeons());
            res.put("unlockedVault", u.isUnlockedVault());
            res.put("unlockedAlchemy", u.isUnlockedAlchemy());
            res.put("unlockedShop", dungeonTutorialService.hasCompletedAllLevel1FreeDungeons(u, allDungeons));
            res.put("shopLockMessage", "Terminez plus de donjons libres avant de débloquer la boutique.");
            int huntingClaimableCount = 0;
            java.time.LocalDate todayParis = java.time.LocalDate.now(java.time.ZoneId.of("Europe/Paris"));
            for (generation.grimoire.entity.pve.HuntingQuestEntry e : huntingQuestEntryRepository.findByAccountName(u.getUsername())) {
                if ("DAILY".equals(e.getQuest().getType())) {
                    boolean isExpired = !e.getQuest().isActive() && e.getQuest().getEndDate().isBefore(todayParis);
                    if (!isExpired) {
                        if (e.getCompletionCount() > 0 && !e.isRewardBronzeClaimed()) huntingClaimableCount++;
                        if ((e.isChallenge1Completed() || e.isChallenge2Completed()) && !e.isRewardSilverClaimed()) huntingClaimableCount++;
                        if (e.isChallenge1Completed() && e.isChallenge2Completed() && !e.isRewardGoldClaimed()) huntingClaimableCount++;
                    }

                } else if ("WEEKLY".equals(e.getQuest().getType()) && !e.getQuest().isActive() && !e.isRewardClaimed()) {
                    if (e.getQuest().getEndDate().plusWeeks(1).isAfter(todayParis)) {
                        if (e.getRank() >= 1) {
                            long totalParticipants = huntingQuestEntryRepository.countCompletedByQuestId(e.getQuest().getId());
                            int threshold = (int) Math.ceil(totalParticipants * 0.2);
                            if (e.getRank() <= threshold) huntingClaimableCount++;
                        }
                    }
                }
            }
            res.put("huntingClaimable", huntingClaimableCount);
            
            res.put("seenAlchemyRecipes", u.getSeenAlchemyRecipes());
            res.put("seenDungeons", u.getSeenDungeons());
            if (u.isUnlockedAlchemy()) {
                long unseenCount = alchemyService.getDiscoveredRecipes(u).stream()
                    .filter(r -> !u.getSeenAlchemyRecipes().contains(r.getId()))
                    .count();
                res.put("unseenAlchemyCount", unseenCount);
            } else {
                res.put("unseenAlchemyCount", 0);
            }
            
            boolean isAdmin = auth.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ADMIN"));
            int userMax = u.getMaxCharacters();
            if (userMax < 2) userMax = 2;
            int maxChars = isAdmin ? 999 : userMax;
            int currentChars = (int) personnageRepository.countByUser_Username(u.getUsername());
            res.put("availableCharacterSlots", Math.max(0, maxChars - currentChars));
            res.put("currentCharacters", currentChars);
            res.put("maxCharacters", maxChars);
            res.put("absoluteMaxCharacters", generation.grimoire.controller.PersonnageController.ABSOLUTE_MAX_CHARACTERS);

            // Calcul SSOT des donjons nouvellement débloqués non vus (évite de télécharger /api/pve/dungeons + /api/personnages sur chaque page)
            int maxLevel = currentChars > 0 ? personnageRepository.findMaxVoieLevelByUsername(u.getUsername()) : 0;
            List<Donjon> freeDungeons = dungeonTutorialService.getSortedFreeDungeons();
            Set<Long> visibleTutorialFreeIds = dungeonTutorialService.getVisibleTutorialFreeDungeonIds(u, freeDungeons);
            int unseenDungeonsCount = 0;
            for (DonjonRepository.DonjonLightProjection d : allDungeons) {
                int recLevel = d.recommendedLevel() > 0 ? d.recommendedLevel() : 1;
                boolean isSecret = d.requiredSecret() != null && !d.requiredSecret().trim().isEmpty();
                if (!isSecret && visibleTutorialFreeIds != null && !visibleTutorialFreeIds.contains(d.id())) {
                    continue;
                }
                boolean levelBypassed = !isSecret && currentChars > 0 && dungeonTutorialService.isLevelBypassed(u, d.id());
                if (maxLevel >= recLevel || levelBypassed) {
                    boolean isUnlocked = false;
                    if (isSecret) {
                        int userSecretLvl = u.getUnlockedSecrets().getOrDefault(d.requiredSecret(), 0);
                        int reqSecretLvl = d.requiredSecretLevel() > 0 ? d.requiredSecretLevel() : 1;
                        if (userSecretLvl >= reqSecretLvl) {
                            isUnlocked = true;
                        }
                    } else {
                        isUnlocked = true;
                    }
                    if (isUnlocked && !u.getSeenDungeons().contains(d.id())) {
                        unseenDungeonsCount++;
                    }
                }
            }
            res.put("unseenDungeonsCount", unseenDungeonsCount);

            // Session de combat active en mémoire (évite un appel HTTP dédié /api/pve/combat/current sur chaque page)
            String activeCombatSessionId = null;
            for (Map.Entry<String, CombatSession> entry : combatService.getActiveSessions().entrySet()) {
                CombatSession session = entry.getValue();
                if (session.isFinished()) {
                    combatService.getActiveSessions().remove(entry.getKey());
                    continue;
                }
                boolean inCombat = session.getPlayers().stream()
                        .anyMatch(p -> p.getUser() != null && u.getUsername().equals(p.getUser().getUsername()) && p.getHealthCurrent() > 0);
                if (inCombat) {
                    activeCombatSessionId = session.getSessionId();
                    break;
                }
            }
            res.put("activeCombatSessionId", activeCombatSessionId);
            
            res.put("unlockedVoieLevels", u.getUnlockedVoieLevels());
            res.put("unlockedSpiritualiteLevels", u.getUnlockedSpiritualiteLevels());
            res.put("activeTitle", u.getActiveTitle());
            res.put("unlockedTitles", u.getUnlockedTitles());

            boolean tutorialDone = u.isTutorialCompleted();
            res.put("tutorialCompleted", tutorialDone);
            String tutorialPhase = "NONE";
            if (!tutorialDone) {
                tutorialPhase = (currentChars == 0) ? "ARMORY" : "DUNGEON";
            }
            res.put("tutorialPhase", tutorialPhase);

            boolean equipTutorialActive = false;
            if (!u.isEquipTutorialCompleted() && currentChars > 0) {
                List<Equipment> userEqs = equipmentRepository.findByOwnerUsername(u.getUsername());
                equipTutorialActive = userEqs.stream()
                        .anyMatch(e -> !e.isTemplate() && e.getSlot() != EquipmentSlot.CONSOMMABLE && e.getPersonnage() == null);
            }
            res.put("equipTutorialActive", equipTutorialActive);
            boolean shopTutorialActive = (isAdmin || Boolean.TRUE.equals(res.get("unlockedShop"))) && !u.isShopTutorialCompleted();
            res.put("shopTutorialActive", shopTutorialActive);
            boolean combatTutorialActive = !u.isCombatTutorialCompleted();
            res.put("combatTutorialActive", combatTutorialActive);
        });

        return ResponseEntity.ok()
            .header(org.springframework.http.HttpHeaders.CACHE_CONTROL, "no-cache, no-store, max-age=0, must-revalidate")
            .body(res);
    }

    private List<String> getClaimableSecretRewards(AppUser u, List<DonjonRepository.DonjonLightProjection> allDungeons) {
        List<String> claimable = new java.util.ArrayList<>();
        
        for (Map.Entry<String, Integer> entry : u.getUnlockedSecrets().entrySet()) {
            String secretName = entry.getKey();
            int maxUnlockedLevel = entry.getValue();
            
            for (int lvl = 1; lvl <= maxUnlockedLevel; lvl++) {
                String key = secretName + ":" + lvl;
                if (!u.getClaimedSecretRewards().contains(key)) {
                    final int currentLvl = lvl;
                    List<DonjonRepository.DonjonLightProjection> dungeonsForLevel = allDungeons.stream()
                        .filter(d -> secretName.equalsIgnoreCase(d.requiredSecret()) && d.requiredSecretLevel() == currentLvl)
                        .toList();
                        
                    if (!dungeonsForLevel.isEmpty()) {
                        boolean allCompleted = true;
                        for (DonjonRepository.DonjonLightProjection d : dungeonsForLevel) {
                            if (!u.getCompletedDungeons().contains(d.id())) {
                                allCompleted = false;
                                break;
                            }
                        }
                        if (allCompleted) {
                            claimable.add(key);
                        }
                    }
                }
            }
        }
        return claimable;
    }

    @PostMapping("/unlock/{feature}")
    public ResponseEntity<?> unlockFeature(@PathVariable String feature) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Non connecté."));
        }

        AppUser user = userRepository.findByUsername(auth.getName()).orElse(null);
        if (user == null)
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        if ("vault".equals(feature)) {
            if (user.isUnlockedVault())
                return ResponseEntity.ok(Map.of("message", "Déjà débloqué."));
            if (user.getMonnaie() < 50)
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "Pas assez d'or."));
            user.setMonnaie(user.getMonnaie() - 50);
            user.setUnlockedVault(true);
            userRepository.save(user);
            return ResponseEntity.ok(Map.of("message", "Coffres débloqués avec succès !"));
        } else if ("alchemy".equals(feature)) {
            if (user.isUnlockedAlchemy())
                return ResponseEntity.ok(Map.of("message", "Déjà débloqué."));
            if (user.getMonnaie() < 150)
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "Pas assez d'or."));
            user.setMonnaie(user.getMonnaie() - 150);
            user.setUnlockedAlchemy(true);
            userRepository.save(user);
            return ResponseEntity.ok(Map.of("message", "Alchimie débloquée avec succès !"));
        } else if ("shop".equals(feature)) {
            List<DonjonRepository.DonjonLightProjection> allDungeons = donjonRepository.findAllLightProjections();
            if (!dungeonTutorialService.hasCompletedAllLevel1FreeDungeons(user, allDungeons)) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("message", "Terminez plus de donjons libres avant de débloquer la boutique."));
            }
            if (!user.isUnlockedShop()) {
                user.setUnlockedShop(true);
                userRepository.save(user);
            }
            return ResponseEntity.ok(Map.of("message", "Boutique débloquée avec succès !"));
        } else if ("roster".equals(feature)) {
            int currentMax = user.getMaxCharacters();
            if (currentMax < 2)
                currentMax = 2;

            if (currentMax >= generation.grimoire.controller.PersonnageController.ABSOLUTE_MAX_CHARACTERS)
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("message", "Taille maximale déjà atteinte."));

            int cost = generation.grimoire.controller.PersonnageController.ROSTER_UPGRADE_COSTS[currentMax];

            if (user.getMonnaie() < cost)
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "Pas assez d'or."));
            user.setMonnaie(user.getMonnaie() - cost);
            user.setMaxCharacters(currentMax + 1);
            userRepository.save(user);
            return ResponseEntity.ok(Map.of("message", "Emplacement supplémentaire acheté avec succès !"));
        }

        return ResponseEntity.badRequest().body(Map.of("message", "Fonctionnalité inconnue."));
    }

    @PostMapping("/tutorial/complete")
    @Transactional
    public ResponseEntity<?> completeTutorial(@RequestParam(required = false) String phase) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Non connecté."));
        }
        AppUser user = userRepository.findByUsername(auth.getName()).orElse(null);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Utilisateur introuvable."));
        }
        if ("SHOP_TOUR".equals(phase) || "SHOP_NAV".equals(phase)) {
            user.setShopTutorialCompleted(true);
        } else if ("COMBAT_TOUR".equals(phase)) {
            user.setCombatTutorialCompleted(true);
        } else if ("EQUIP_ARMORY".equals(phase) || "EQUIP_NAV".equals(phase)) {
            user.setEquipTutorialCompleted(true);
        } else {
            user.setTutorialCompleted(true);
        }
        userRepository.save(user);
        return ResponseEntity.ok(Map.of("tutorialCompleted", user.isTutorialCompleted(), "equipTutorialCompleted", user.isEquipTutorialCompleted(), "tutorialPhase", "NONE"));
    }

    @PostMapping("/tutorial/reset")
    @Transactional
    public ResponseEntity<?> resetTutorials() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Non connecté."));
        }
        AppUser user = userRepository.findByUsername(auth.getName()).orElse(null);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Utilisateur introuvable."));
        }
        user.setTutorialCompleted(false);
        user.setEquipTutorialCompleted(false);
        user.setShopTutorialCompleted(false);
        user.setCombatTutorialCompleted(false);
        userRepository.save(user);
        return ResponseEntity.ok(Map.of("message", "Tutoriels réinitialisés avec succès !"));
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refreshToken(HttpServletRequest request) {
        String refreshToken = getCookieValue(request, "refresh_token");
        if (refreshToken != null) {
            return refreshTokenService.findByToken(refreshToken)
                    .map(refreshTokenService::verifyExpiration)
                    .map(token -> token.getUser())
                    .map(user -> {
                        String token = jwtService.generateAccessToken(user.getUsername());
                        return ResponseEntity.ok(Map.of("token", token));
                    })
                    .orElseThrow(() -> new RuntimeException("Refresh token not found"));
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletRequest request, HttpServletResponse response) {
        org.springframework.http.ResponseCookie cookie = org.springframework.http.ResponseCookie
                .from("refresh_token", "")
                .httpOnly(true)
                .secure(false) // Mettre à true en HTTPS
                .path("/api/auth/refresh")
                .maxAge(0)
                .build();
        return ResponseEntity.ok()
                .header(org.springframework.http.HttpHeaders.SET_COOKIE, cookie.toString())
                .body(Map.of("message", "Déconnecté"));
    }

    private String getCookieValue(HttpServletRequest request, String name) {
        if (request.getCookies() != null) {
            for (jakarta.servlet.http.Cookie cookie : request.getCookies()) {
                if (cookie.getName().equals(name)) {
                    return cookie.getValue();
                }
            }
        }
        return null;
    }

    private ResponseEntity<?> authenticateAndGenerateTokens(String username, String password) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(username, password));
        SecurityContextHolder.getContext().setAuthentication(authentication);

        String jwt = jwtService.generateAccessToken(username);
        AppUser user = userRepository.findByUsername(username).orElseThrow();

        generation.grimoire.entity.auth.RefreshToken refreshToken = refreshTokenService
                .createRefreshToken(Objects.requireNonNull(user.getId()));

        org.springframework.http.ResponseCookie refreshCookie = org.springframework.http.ResponseCookie
                .from("refresh_token", Objects.requireNonNull(refreshToken.getToken()))
                .httpOnly(true)
                .secure(false) // Mettre à true en production HTTPS
                .path("/api/auth/refresh")
                .maxAge(7 * 24 * 60 * 60)
                .build();

        return ResponseEntity.ok()
                .header(org.springframework.http.HttpHeaders.SET_COOKIE, refreshCookie.toString())
                .body(Map.of("message", "Connexion réussie !", "token", jwt));
    }

    @Data
    public static class LoginRequest {
        private String username;
        private String password;
    }
}
