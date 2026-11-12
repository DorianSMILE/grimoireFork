# Spécification & Équilibrage — Système de Niveaux des Équipements

Ce document récapitule la conception, les formules mathématiques, le système de catalyseurs (anomalies) et les résultats de simulation sur données réelles (BDD) pour le système d'amélioration de niveau des équipements de **Grimoire**.

---

## 1. Règles Générales & Éligibilité

- **Raretés éligibles aux niveaux :** Seuls les équipements de rareté **`LEGENDAIRE`**, **`EPIQUE`**, **`RELIQUE`** et **`MAUDIT`** peuvent monter de niveau.
- **Raretés exclues :** Les objets `COMMUN`, `INHABITUEL`, `RARE` et `MYTHIQUE` restent verrouillés au niveau de base (`+0` / `Lvl 1`) et ne peuvent pas être améliorés.
- **Consommables exclus :** Le slot `CONSOMMABLE` ne possède pas de système de niveau.
- **Format court (5 paliers d'amélioration) :**
  - Un équipement éligible commence au **Palier +0 (Niveau 1)** et peut être amélioré **5 fois** jusqu'au **Palier +5 (Niveau 6 Max)**.

---

## 2. Formules de Scaling par Rareté

L'analyse des **275 lignes de statistiques** des équipements `LEGENDAIRE`, `EPIQUE`, `RELIQUE` et `MAUDIT` en base de données montre que :
- **52,0 %** des stats (hors PV/Mana) sont de petites valeurs entières (`1` à `4`).
- **30,9 %** sont des valeurs moyennes (`5` à `9`).
- **17,1 %** sont des valeurs élevées (`10+`).
- **93 lignes** sont des **statistiques négatives** servant de contrepartie d'équilibrage sur l'objet (ex. `-25 PV` sur *L'inarrêtable*, `-10 Puissance` sur *Casque démoniaque*, `-9 Vitesse / -10 Critique` sur *Minéralité*).

Pour que les petites statistiques progressent réellement sur 5 paliers sans rendre les objets à contrepartie déséquilibrés, **3 taux distincts** s'appliquent selon la nature de la statistique :

| Rareté | Stats Positives / Palier (`R_pos`) | Total Stats Positives au `+5` | Stats Négatives de l'item / Palier (`R_neg = 50% R_pos`) | Total Stats Négatives au `+5` | Effet Spécial / Malus (`specialEffectValue`) / Palier (`R_eff`) | Total Effet / Malus au `+5` |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Légendaire** | **+8 % / up** | **+40 %** | **+4 % / up** | **+20 %** | *Aucun effet spécial* | — |
| **Épique** | **+10 % / up** | **+50 %** | **+5 % / up** | **+25 %** | **+4 % / up** *(Bonus passif)* | **+20 %** |
| **Relique** | **+12 % / up** | **+60 %** | **+6 % / up** | **+30 %** | **+5 % / up** *(Bonus passif)* | **+25 %** |
| **Maudit** | **+14 % / up** | **+70 %** | **+7 % / up** | **+35 %** | **+5 % / up** *(Malus maudit)* | **+25 %** |

### Détails des formules d'arrondi (`up` de `0` à `5`)

1. **Statistique classique positive (`StatBase > 0`) :**
   $$\text{Stat}(\text{up}) = \text{round}\Big( \text{StatBase} \times \big[ 1 + \text{up} \times R_{\text{pos}} \times M_{\text{slot, stat}} \big] \Big)$$

2. **Statistique classique négative (`StatBase < 0`, contrepartie sur l'item) :**
   $$\text{Stat}(\text{up}) = \text{round}\Big( \text{StatBase} \times \big[ 1 + \text{up} \times R_{\text{neg}} \big] \Big)$$

3. **Effet spécial passif ou Malédiction (`specialEffectValue != 0`) :**
   $$\text{Effet}(\text{up}) = \text{round}\Big( \text{EffetBase} \times \big[ 1 + \text{up} \times R_{\text{eff}} \big] \Big)$$
   - *Exception de sécurité :* Si `specialEffect == CHEAT_DEATH` et que la valeur de base vaut `1` (ex. *Bottes d'Hermès*, *Lancinante*), la valeur reste fixe à `1`.

---

## 3. Matrice des Multiplicateurs d'Affinité (`Slot × Stat`)

Chaque couple `(Slot, Stat)` possède un multiplicateur d'affinité $M_{\text{slot, stat}}$ permettant de :
- **Valoriser l'identité de certains slots** (ex. gros multiplicateur d'Armure/Résistance `1.40` et de PV `1.20` sur l'**Arme Secondaire** `ARME_DROITE`, ou de Force/Puissance `1.20`–`1.25` sur les **Armes 1M/2M**).
- **Freiner les statistiques à haute valeur de base ou à fort effet boule de neige** :
  - `PV Max` (`0.75`–`0.80`) et `Armure / Résistance` (`0.85`–`0.90`) sur **Plastron / Casque / Cape**, car leurs bases en BDD atteignent déjà `60` à `100 PV` et `20` à `30 Armure/Résistance`.
  - `Régen Mana` sur **Anneau** (`0.50`) et **Cape** (`0.65`) pour préserver l'économie de mana.
  - `Vitesse` sur **Bottes** (`0.60`) et `Critique` (`0.65`–`0.90`) à cause des multiplicateurs passifs de Voie (*Voie de la Violence* jusqu'à $\times 3$ Critique, *Voie de la Raison* $2\times \text{Vitesse} \rightarrow \text{Critique}$).

| Slot (`EquipmentSlot`) | PV Max | Mana Max | Force / Puissance | Armure / Résist. | Vitesse | Critique | Régen PV | Régen Mana |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Arme 2M** (`ARME_DEUX_MAINS`) | `0.85` | `0.85` | **`1.25`** | `0.75` | `0.70` | `0.90` | `0.90` | `0.90` |
| **Arme 1M** (`ARME_GAUCHE`) | `0.95` | `0.95` | **`1.20`** | `0.95` | `0.80` | `0.90` | `0.95` | `0.95` |
| **Arme Sec.** (`ARME_DROITE`) | **`1.20`** | `0.95` | `0.85` | **`1.40`** | `0.80` | `0.80` | **`1.15`** | `0.80` |
| **Plastron** (`PLASTRON`) | **`0.75`** *(freiné)* | `0.85` | `0.75` | **`0.85`** *(freiné)* | `0.65` | `0.65` | **`1.10`** | `0.85` |
| **Casque** (`CASQUE`) | **`0.80`** *(freiné)* | `0.95` | `0.85` | **`0.90`** *(freiné)* | `0.75` | `0.75` | `0.90` | `0.90` |
| **Anneaux** (`ANNEAU*`) | `0.85` | `0.80` | `0.95` | `0.85` | `0.65` | `0.75` | `0.85` | **`0.50`** *(freiné)* |
| **Bottes** (`BOTTES`) | `0.80` | `0.85` | `0.85` | `1.00` | **`0.60`** *(freiné)* | `0.80` | `0.85` | `0.85` |
| **Cape** (`CAPE`) | **`0.75`** *(freiné)* | `0.95` | `0.90` | `0.95` | `0.75` | `0.75` | `0.90` | **`0.65`** *(freiné)* |

---

## 4. Système d'Amélioration & Anomalies Spéciales par Secret

Chaque Secret du jeu possède **2 anomalies d'amélioration** :
1. **Anomalie Simple (Tier 1) :**
   - **Obtention :** Loot en donjon (lié au Secret) OU Craft Alchimie (mix d'anomalies Lvl 1/2 du Secret + Or + XP Spiritualité).
2. **Anomalie Compliquée (Tier 2) :**
   - **Obtention :** Loot rare (Boss du Secret) OU Craft Alchimie coûteux (mix d'anomalies Lvl 2/3 du Secret + gros coût Or + gros coût XP Spiritualité).

### A. Courbe de Coût par Palier d'Amélioration

| Palier Cible | Anomalie Simple requise | Anomalie Compliquée requise | Coût Or additionnel *(Base × Mult. Rareté)* |
| :---: | :---: | :---: | :--- |
| **Up 1 (`+0 → +1`)** | **1** | 0 | `500 Or × Mult_Rareté` |
| **Up 2 (`+1 → +2`)** | **2** | 0 | `1 000 Or × Mult_Rareté` |
| **Up 3 (`+2 → +3`)** | 0 | **1** | `2 000 Or × Mult_Rareté` |
| **Up 4 (`+3 → +4`)** | **1** | **1** | `3 500 Or × Mult_Rareté` |
| **Up 5 (`+4 → +5`)** | **2** | **2** | `6 000 Or × Mult_Rareté` |
| **TOTAL (`+0 → +5`)** | **6 Simples** | **4 Compliquées** | *Multiplicateur Rareté : Légendaire (×1) · Maudit (×1.5) · Épique (×2) · Relique (×3)* |

### B. Table des Duos d'Anomalies alignée sur les Secrets et Anomalies de la BDD

| Secret en BDD (`requiredSecret`) | Spiritualité d'Anomalie | Anomalie Simple (Tier 1) | Anomalie Compliquée (Tier 2) | Exemple de Craft Alchimie (Ingrédients BDD existants) |
| :--- | :--- | :--- | :--- | :--- |
| **Secret du Chaos** | `DESTRUCTION` | Éclat de Chaos | **Cœur de Cendre** | `Braise Ardente` (Lvl 2) + `Crâne sanglant` (Lvl 3) + Or + XP Spirit |
| **Secret du Destin** | `KARMA` | Fragment du Destin | **Prisme Karmique** | `Orbe Catalytique Stabilisé` (Lvl 2) + `Cristal de vision` (Lvl 3) + Or + XP Spirit |
| **Secret de l'Éther** | `ESPRIT` | Souffle d'Éther | **Cœur Empyréen** | `Orbe d'espoir` (Lvl 2) + `Cœur séraphin` (Lvl 3) + Or + XP Spirit |
| **Secret des Abysses** | `TENEBRES` | Résidu Abyssal | **Noyau Néant** | `Cristal corrompu` (Lvl 2) + `Orbe démoniaque` (Lvl 2) + `Métal palpitant` (Lvl 2) + Or + XP Spirit |
| **Secret de l'Abondance** | `CREATION` | Sève Mutagène | **Ambre Parasitaire** | `Métal purulent` (Lvl 2) + `Orbe parasitée` (Lvl 3) + Or + XP Spirit |
| **Aucun Secret (`null`)** | *Générique* | Poussière d'Éveil | **Pierre d'Ascension** | Mix d'anomalies Lvl 2/3 multi-spiritualités + Or & XP Spirit majorés |

---

## 5. Simulations sur Jeux de Données Réels (BDD)

### A. Paramètres du Combat de Référence
- **Boss HL : `Archidémon` (ID=70, Lvl 5, Salle Boss 2768)**
  - **Type / IA :** `HYBRIDE` *(dégâts non-bruts $\times 1.2$, répartis 50% Physique / 50% Magique)* / `PREDATEUR` *(focus une cible)*.
  - **Stats :** `1200 PV` · `30 Power` · `30 Force` · `50 Armure (+50 Buff Salle = 100 Armure, 50% réd.)` · `90 Résistance (+10 Buff Salle = 100 Résistance, 50% réd.)` · `25% Crit` · `30 Régen PV/t` · `Brûlure au contact 20/t`.
  - **Sorts :** *Explosion ciblée* (`500% Force` = `180` dégâts hybrides de base, `270` en critique, `+40% Armure`), *Brasier vivant* (`200% Power` + Brûlure AoE + `+40% Résistance`), *Aura démoniaque* (Instantané : `5% PV manquants` en dégâts Bruts AoE).
- **Héros DPT : `'DEGATS OU RIEN'` (ID=61, Voie de la Violence Lvl 10, Karma Lvl 5)**
  - **Stats nues (hors équipement) :** `100 PV` · `172 Mana` · `25 Power` · `25 Force` · `5 Armure` · `5 Résistance` · `7% Crit` · `2 Vitesse` · `0 Régen PV` · `4 Régen Mana`.
  - **Rotation DPT sur 1 tour :** *Bombe à fragmentation* (Instant : `100% Force` Phy + `20% Power` Mag) + *Manipulation de l'énergie* (Banal : `150% Power` Phy + `150% Force` Mag).
  - **Conditions "Team Buff" :** Buffs alliés (*Sous pression* `+40% Pow/Str/Arm/Res`, *Lien vital* `+30% Dmg Phy/Mag`), buffs personnels (*Cultiver la vertu* `+30% Pow/Str`, *Swap Violence* `+60% Str` / `×2 Crit`, *Karma Ténèbres* `+20% Dmg`) et débuff sur le boss (`-30% Arm/Res`).

---

### B. Résultats — Profil 1 : `'DEGATS OU RIEN'` avec son équipement actuel en BDD (5/8 items éligibles)
*Équipements éligibles portés : `Sacraneau` (Légendaire), `Braise duldur` (Légendaire), `Capable` (Épique), `L'inarrêtable` (Relique), `Bras de démon` (Maudit). Les 3 pièces Mythique/Rare restent au niveau de base.*

| Palier | PV | Mana | Pow | Str | Arm *(Réd.)* | Rés *(Réd.)* | Crit | Spd | RegHP / Mana | Dégâts Solo / Tour | Dégâts Team Buff / Tour | Dégâts subis de l'Archidémon *(Auto / Explosion ciblée)* |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **+0 (Base)** | 196 | 236 | 42 | 41 | 8 *(7.4%)* | 12 *(10.7%)* | 25% | 1 | 3 / 7 | **97.8** | **388.8** | Auto: **59** / Nuke: **147 PV** |
| **+1** | 200 | 241 | 43 | 42 | 8 *(7.4%)* | 13 *(11.5%)* | 26% | 1 | 3 / 7 | **100.6** | **401.1** | Auto: **59** / Nuke: **147 PV** |
| **+2** | 202 | 247 | 43 | 43 | 9 *(8.3%)* | 14 *(12.3%)* | 27% | 1 | 4 / 7 | **102.5** | **410.1** | Auto: **57** / Nuke: **144 PV** |
| **+3** | 205 | 252 | 46 | 44 | 9 *(8.3%)* | 15 *(13.0%)* | 28% | 1 | 4 / 8 | **107.3** | **429.8** | Auto: **57** / Nuke: **143 PV** |
| **+4** | 208 | 257 | 47 | 45 | 9 *(8.3%)* | 16 *(13.8%)* | 29% | 1 | 4 / 8 | **110.1** | **442.5** | Auto: **56** / Nuke: **141 PV** |
| **+5 (Max)** | 211 | 263 | 47 | 46 | 10 *(9.1%)* | 17 *(14.5%)* | 31% | 1 | 4 / 8 | **112.6** *(+15%)* | **455.1** *(+17%)* | Auto: **56** / Nuke: **140 PV** |

---

### C. Résultats — Profil 2 : `'DEGATS OU RIEN'` Full End-Game (8/8 items éligibles de la BDD)
*Remplacement des 3 items Mythique/Rare par de vrais templates BDD : `Perce-crâne` (Casque Relique), `Hilarité` (Anneau Légendaire), `Le coude épié` (Bottes Relique).*

| Palier | PV | Mana | Pow | Str | Arm *(Réd.)* | Rés *(Réd.)* | Crit | Spd | RegHP / Mana | Dégâts Solo / Tour | Dégâts Team Buff / Tour | Dégâts subis de l'Archidémon *(Auto / Explosion ciblée)* |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---:
| **+0 (Base)** | 176 | 322 | 46 | 31 | 19 *(16.0%)* | 25 *(20.0%)* | 23% | 7 | -1 / 8 | **113.9** | **385.6** | Auto: **53** / Nuke: **133 PV** |
| **+1** | 184 | 335 | 48 | 32 | 20 *(16.7%)* | 28 *(21.9%)* | 24% | 7 | -1 / 8 | **118.6** | **402.9** | Auto: **52** / Nuke: **131 PV** |
| **+2** | 189 | 349 | 49 | 33 | 22 *(18.0%)* | 30 *(23.1%)* | 26% | 8 | -1 / 8 | **127.9** | **428.3** | Auto: **51** / Nuke: **127 PV** |
| **+3** | 196 | 361 | 53 | 34 | 24 *(19.4%)* | 33 *(24.8%)* | 27% | 8 | 0 / 10 | **134.7** | **453.1** | Auto: **50** / Nuke: **125 PV** |
| **+4** | 203 | 374 | 55 | 35 | 25 *(20.0%)* | 34 *(25.4%)* | 29% | 8 | 0 / 10 | **140.3** | **474.3** | Auto: **49** / Nuke: **122 PV** |
| **+5 (Max)** | 208 | 388 | 56 | 36 | 27 *(21.3%)* | 36 *(26.5%)* | 31% | 8 | -1 / 10 | **150.4** *(+32%)* | **502.0** *(+30%)* | Auto: **48** / Nuke: **121 PV** |

---

### D. Résultats — Profil 3 : Stress-Test Min-Maxing Maudit/Relique (`Le vorace`, `Casque démoniaque`, `Minéralité`, `Marche sombre`, `Ascétisme régalien`, `Labuzé`, `Hilarité`)

| Palier | PV | Mana | Pow | Str | Arm *(Réd.)* | Rés *(Réd.)* | Crit | Spd | RegHP / Mana | Dégâts Solo / Tour | Dégâts Team Buff / Tour | Dégâts subis de l'Archidémon *(Auto / Explosion ciblée)* |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **+0 (Base)** | 273 | 262 | 61 | 45 | 35 *(25.9%)* | 52 *(34.2%)* | 11% | -9 | 1 / -4 | **115.2** | **443.3** | Auto: **60** / Nuke: **151 PV** |
| **+1** | 291 | 272 | 66 | 47 | 39 *(28.1%)* | 59 *(37.1%)* | 11% | -10 | 2 / -4 | **122.4** | **470.3** | Auto: **59** / Nuke: **147 PV** |
| **+2** | 307 | 280 | 69 | 50 | 44 *(30.6%)* | 65 *(39.4%)* | 13% | -10 | 3 / -5 | **130.8** | **507.8** | Auto: **57** / Nuke: **143 PV** |
| **+3** | 325 | 289 | 76 | 53 | 48 *(32.4%)* | 72 *(41.9%)* | 13% | -12 | 2 / -5 | **141.2** | **547.6** | Auto: **56** / Nuke: **139 PV** |
| **+4** | 341 | 298 | 80 | 56 | 52 *(34.2%)* | 78 *(43.8%)* | 14% | -12 | 3 / -6 | **150.0** | **585.3** | Auto: **54** / Nuke: **136 PV** |
| **+5 (Max)** | 359 | 307 | 85 | 58 | 56 *(35.9%)* | 84 *(45.7%)* | 16% | -12 | 4 / -6 | **159.1** *(+38%)* | **625.0** *(+41%)* | Auto: **53** / Nuke: **133 PV** |

---

## 6. Conclusions d'Équilibrage Validées

1. **Respect du rôle en équipe :** Même en **Full End-Game +5**, un DPT comme `'DEGATS OU RIEN'` reste à `208 PV` et `21%–26%` de réduction : il meurt en **2 tours** face à l'Archidémon s'il n'est pas protégé et soigné par son groupe, mais son investissement en améliorations d'items augmente son efficacité offensive de **+30% en conditions de burst d'équipe** (`385` $\rightarrow$ `502` dégâts/tour).
2. **Contrôle des stats critiques :**
   - Le frein sur les **PV (`0.75`)** et **Armure/Résist (`0.85`–`0.90`)** des Plastrons/Casques empêche les DPT équipés de pièces maudites d'atteindre le plafond de 90% de réduction ou 450+ PV.
   - Le frein sur la **Vitesse (`0.60`)**, le **Critique (`0.65`–`0.90`)** et la **Régen Mana des Anneaux (`0.50`)** évite la saturation des jauges de mana et du 100% critique passif.
   - La hausse modérée des **contreparties négatives (`50%` du taux positif)** et des **malédictions (`+5% / palier`)** préserve l'identité risquée des objets Maudits et des Reliques à malus.
