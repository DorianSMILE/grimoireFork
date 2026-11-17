# router-core.ps1 : source unique du routeur (utilisée par route.ps1 ET test-router.ps1).
# Toute modification du prompt ou des exemples se fait ici, nulle part ailleurs.

$RouterModel = "qwen2.5:3b"
$RouterUrl   = "http://localhost:11434/api/chat"
$RouterTimeoutSec = 60   # appels normaux ; évite les faux timeouts lors d'un pic CPU
$RouterColdTimeoutSec = 120   # délai accordé quand le modèle n'est pas encore chargé en mémoire
$RouterKeepAlive      = "4h"  # durée pendant laquelle Ollama garde le modèle en mémoire

$SystemPrompt = @'
Tu es un routeur de difficulté pour un projet RPG web (Java 21, Spring Boot, Hibernate/JPA, PostgreSQL, JS/CSS vanilla). Tu ne réponds jamais à la demande : tu donnes seulement son niveau (1 à 4).

1 = micro-retouche mécanique sur un seul fichier, zéro réflexion ni design : faute d'orthographe, texte ou constante numérique en dur (prix, délai, plafond, coût), changement de visibilité, renommage local, suppression d'une ligne/log, question courte ou explication d'un extrait. JAMAIS de CSS/design, ni de règle de jeu, ni de bug comportemental en 1.
2 = tâche courante ciblée ou bug franc, 1 à 3 fichiers :
- Route API CRUD (même avec permission simple), vérification manquante dans une règle de jeu, validation de formulaire/DTO, champ ou menu alimenté par l'API, rafraîchissement DOM/UI après appel réseau.
- Retouche visuelle/CSS/design d'un bouton ou composant, remplacement d'icônes, ajout d'un indicateur de chargement existant.
- Test unitaire/Mockito, ou bug avec exception nommée (JPA/Hibernate, SQL, HTTP 404/500, NullPointer).
3 = conception multi-couches, mécanique complexe, performance ou enquête ouverte :
- Nouvelle mécanique de jeu complète (multi-tables/multi-écrans), question ouverte ("comment gérer...", "j'aimerais un système de..."), temps réel, matchmaking ou multi-joueur.
- Optimisation de requêtes lentes / performance, fuite mémoire, concurrence/accès simultanés, bug silencieux ou intermittent sans erreur dans les logs ("parfois", "au bout d'un moment", chargement infini).
- Refonte ou isolation d'UN SEUL domaine/système (combat, boutique, classement) ou migration d'UNE SEULE page.
4 = EXCEPTIONNEL - changement d'échelle global de toute l'application ou impasse répétée :
- Migration intégrale d'une couche entière ou de tout le projet ("tout le front", "toutes les pages", "toute l'API", "tout le backend", microservices, refonte complète de toute la BDD).
- Audit de sécurité ou revue architecturale couvrant toute l'application.
- Impasse explicite (PRIORITAIRE : même sur un seul bug, si le développeur mentionne plusieurs essais/correctifs échoués ou des jours de recherche sans succès -> niveau 4).

Règle de frontière 3 / 4 :
Migrer UNE seule page (ex: convertir une page vers un framework), isoler UN seul domaine métier (même avec "toute", ex: "toute la boutique"), optimiser des lenteurs ou refaire un seul sous-système reste en 3. Choisis 4 UNIQUEMENT si cela remplace toute une couche de l'application entière, audite tout le projet, ou mentionne plusieurs tentatives/correctifs déjà échoués.

Réponds uniquement {"level": N}.
'@

# Garde-fou d'encodage : "é" lu en ANSI devient "Ã©". Si c'est le cas, le prompt envoyé au modèle est corrompu.
$EncodingBroken = $SystemPrompt.Contains([string][char]0x00C3)
if ($EncodingBroken) {
    Write-Warning "router-core.ps1 est lu avec le mauvais encodage (accents corrompus). Enregistre-le en UTF-8 avec BOM, ou lance-le avec PowerShell 7 (pwsh)."
}

# Exemples en tours de chat, entrelacés pour éviter qu'un niveau domine la fin du contexte
$Shots = @(
    @("corrige la faute dans le titre de la page d'accueil", 1),
    @("génère un donjon procédural avec des salles connexes et des coffres", 3),
    @("ajoute un champ téléphone au formulaire d'inscription et sauvegarde-le en base", 2),
    @("on bascule l'intégralité du frontend sur Vue au lieu du rendu serveur", 4),
    @("passe la méthode getHp en private", 1),
    @("erreur TransientPropertyValueException quand j'enregistre un équipement nouvellement forgé", 2),
    @("j'aimerais que les joueurs puissent se battre à plusieurs en même temps sur la même carte", 3),
    @("rends le bouton d'accès à l'armurerie plus joli avec un meilleur style CSS", 2),
    @("passe le coût en mana du sort Boule de feu de 15 à 12", 1),
    @("fais un audit de sécurité complet de toute l'application", 4),
    @("le compteur d'or en haut de l'écran ne se rafraîchit pas après une vente alors que l'API répond 200", 2),
    @("comment pourrait-on gérer les effets météo sur les combats ?", 3),
    @("ajoute une route PUT pour archiver un salon de discussion, réservée aux modérateurs", 2),
    @("isole toute la gestion des paiements et abonnements dans un module dédié", 3),
    @("change le délai de réapparition des monstres de 30 à 45 secondes", 1),
    @("écris les tests Mockito de InventoryService", 2),
    @("après quelques minutes de jeu, les PNJ se figent et il n'y a rien dans les logs", 3),
    @("refonte globale de toute l'application : passage complet en architecture événementielle sur tout le back, tout le front et tous les tests", 4),
    @("le marchand accepte un achat même quand le joueur n'a pas assez d'or", 2),
    @("convertis uniquement la page du marché aux enchères en Web Components", 3),
    @("NullPointerException dans PlayerService.save quand l'inventaire est vide", 2),
    @("ça fait plusieurs fois que je te dis de réparer cette erreur qui revient souvent sur auth.js mais tu n'y arrives pas, répare-la définitivement", 4),
    @("quand deux joueurs échangent un objet en même temps, l'inventaire se corrompt parfois", 3),
    @("le bouton d'attaque renvoie une 404 sur /api/combat/attack", 2)
)

# Construit une seule fois : system + exemples
$BaseMessages = @(@{ role = "system"; content = $SystemPrompt })
foreach ($s in $Shots) {
    $BaseMessages += @{ role = "user";      content = $s[0] }
    $BaseMessages += @{ role = "assistant"; content = '{"level": ' + $s[1] + '}' }
}

function Get-RouteLevel {
    param(
        [Parameter(Mandatory = $true)] [string]$Prompt,
        [int]$TimeoutSec = 0    # 0 = utiliser $RouterTimeoutSec
    )

    $text     = $Prompt.Substring(0, [Math]::Min($Prompt.Length, 1200))
    $messages = $BaseMessages + @(@{ role = "user"; content = $text })

    $body = @{
        model      = $RouterModel
        messages   = $messages
        stream     = $false
        format     = @{ type = "object"; required = @("level")
                        properties = @{ level = @{ type = "integer"; enum = @(1,2,3,4) } } }
        options    = @{ temperature = 0; seed = 42; num_predict = 12; num_ctx = 4096 }
        keep_alive = $RouterKeepAlive
    } | ConvertTo-Json -Depth 8

    $params = @{
        Uri         = $RouterUrl
        Method      = "Post"
        Body        = [Text.Encoding]::UTF8.GetBytes($body)
        ContentType = "application/json; charset=utf-8"
        TimeoutSec  = $(if ($TimeoutSec -gt 0) { $TimeoutSec } else { $RouterTimeoutSec })
    }
    $response = Invoke-RestMethod @params
    $data     = $response.message.content | ConvertFrom-Json
    $level    = [int]$data.level
    if ($level -notin 1..4) { throw "Niveau invalide : '$($response.message.content)'" }
    return $level
}

# Vrai si le modèle est déjà en mémoire (appel rapide). Faux = démarrage à froid : prévoir un délai plus long.
function Test-RouterLoaded {
    try {
        $psUrl = $RouterUrl -replace '/api/chat$', '/api/ps'
        $info  = Invoke-RestMethod -Uri $psUrl -TimeoutSec 3
        return [bool]($info.models | Where-Object { $_.name -eq $RouterModel -or $_.model -eq $RouterModel })
    }
    catch { return $false }
}