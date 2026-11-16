param (
    [Parameter(Mandatory=$true, Position=0)] [string]$Prompt,
    # 0 = routage auto (1..4). 1 à 5 = niveau forcé (5 = Carbon High, réservé au choix manuel)
    [ValidateRange(0,5)] [int]$Level = 0,
    # Force l'utilisation d'Argon à la place de Carbon sur les niveaux 4 et 5 (économie de quota Carbon)
    [switch]$UseArgon,
    # Affiche le modèle choisi sans lancer agy (et sans écrire dans le journal)
    [switch]$DryRun
)

. (Join-Path $PSScriptRoot "router-core.ps1")

# ---- Configuration (vérifie les IDs exacts avec : agy models) ----
# Gamme Gemini 4 :
# - Hydrogen remplace totalement 3.8 Flash (2.5x plus rapide, ~3x plus fiable en code, moins de tokens).
# - Carbon assure les niveaux 4 et 5 (vrai saut de raisonnement frontier sur l'architecture et les impasses).
# - Argon n'est plus pertinent en palier principal (Hydrogen High l'égale en étant ~3.5x plus rapide),
#   mais reste disponible en repli pour économiser le quota Carbon (-UseArgon ou $CarbonEnabled = $false).
$Models = @{
    1 = "gemini-4-hydrogen-low"
    2 = "gemini-4-hydrogen-medium"
    3 = "gemini-4-hydrogen-high"
    4 = "gemini-4-carbon-medium"
    5 = "gemini-4-carbon-high"
}
$ArgonModels = @{
    4 = "gemini-4-argon-medium"
    5 = "gemini-4-argon-high"
}
$Colors        = @{ 1 = "Green"; 2 = "Yellow"; 3 = "Cyan"; 4 = "Magenta"; 5 = "Red" }
$CarbonEnabled = $true    # $false : bascule les niveaux 4 et 5 sur Argon (ou Hydrogen High si Argon désactivé)
$ArgonEnabled  = $true    # $false : si Carbon est aussi désactivé, repli sur Hydrogen High (niveau 3)
$DefaultLevel  = 2        # utilisé seulement si Ollama échoue

# ---- Routage ----
if ($Level -eq 0) {
    $source = "auto"
    Write-Host "-> Routage en cours ($RouterModel)..." -ForegroundColor Cyan
    try {
        $timeout = $RouterTimeoutSec
        if (-not (Test-RouterLoaded)) {
            $timeout = $RouterColdTimeoutSec
            Write-Host "   Modèle de routage à charger : le premier appel peut prendre jusqu'à environ 1 min." -ForegroundColor DarkGray
        }
        $Level = Get-RouteLevel -Prompt $Prompt -TimeoutSec $timeout
    }
    catch {
        $detail = if ($_.ErrorDetails.Message) { $_.ErrorDetails.Message } else { $_.Exception.Message }
        Write-Warning "Routage échoué, bascule sur le niveau $DefaultLevel. Cause : $detail"
        $Level  = $DefaultLevel
        $source = "fallback"
    }
}
else {
    $source = "manuel"
}

# Gestion des replis de quota sur les paliers frontier (4 et 5)
$targetModel = $Models[$Level]
if ($Level -ge 4) {
    if ($UseArgon -or -not $CarbonEnabled) {
        if ($ArgonEnabled) {
            $targetModel = $ArgonModels[$Level]
        }
        else {
            $Level = 3
            $targetModel = $Models[$Level]
        }
    }
}

Write-Host "-> Niveau $Level ($source) -> $targetModel" -ForegroundColor $Colors[$Level]

if ($DryRun) {
    Write-Host "(DryRun) agy --model $targetModel --mode accept-edits --prompt-interactive <prompt>" -ForegroundColor DarkGray
    return
}

# ---- Journal pour recalibrer le prompt (local, prompt tronqué à 200 caractères) ----
try {
    [pscustomobject]@{
        ts     = (Get-Date -Format s)
        level  = $Level
        model  = $targetModel
        source = $source
        prompt = $Prompt.Substring(0, [Math]::Min($Prompt.Length, 200))
    } | ConvertTo-Json -Compress | Add-Content -Path (Join-Path $PSScriptRoot "router.log.jsonl") -Encoding UTF8
} catch { }

# ---- Lancement d'Antigravity avec édition automatique ----
# Windows PowerShell 5.1 perd les guillemets doubles passés à un exécutable natif ; PowerShell 7.3+ les gère seul
$agyPrompt = if ($PSVersionTable.PSVersion -lt [version]"7.3") { $Prompt -replace '"', '\"' } else { $Prompt }
agy --model $targetModel --mode accept-edits --prompt-interactive $agyPrompt