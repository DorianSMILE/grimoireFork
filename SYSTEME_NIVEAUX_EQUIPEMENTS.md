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

1. **Statistique classique positive (`StatBase >= 2`) :**
   $$\text{Stat}(\text{up}) = \text{round}\Big( \text{StatBase} \times \big[ 1 + \text{up} \times R_{\text{pos}} \times M_{\text{slot, stat}} \big] \Big)$$

2. **Cas des petites statistiques unitaires (`StatBase == 1`) — Seuil adaptatif selon le frein $M_{\text{slot, stat}}$ :**
   Avec un arrondi classique (`+50%`), une stat à `1` stagnerait à `1` jusqu'au `+5` sur presque tous les slots freinés. Pour garantir une progression proportionnelle au frein :
   - Soit le bonus cumulé $\Delta(\text{up}) = \text{up} \times R_{\text{pos}} \times M_{\text{slot, stat}}$.
   - La stat passe à **`2`** dès que le bonus cumulé atteint **`+20%`** ($\Delta(\text{up}) \ge 0.20$), ou **au plus tard au palier `+5`** :
   $$\text{Stat}_{=1}(\text{up}) = \begin{cases} \max\big(2,\ \text{round}(1 + \Delta(\text{up}))\big) & \text{si } \Delta(\text{up}) \ge 0.20 \text{ ou } \text{up} = 5 \\ 1 & \text{sinon} \end{cases}$$

   | Multiplicateur d'affinité $M_{\text{slot, stat}}$ | Légendaire (`8%`) | Épique (`10%`) | Relique (`12%`) | Maudit (`14%`) |
   | :--- | :---: | :---: | :---: | :---: |
   | **Frein fort (`0.50`)** *(Régen Mana Anneau)* | **Palier `+5`** | **Palier `+4`** | **Palier `+4`** | **Palier `+3`** |
   | **Frein fort (`0.60`)** *(Vitesse Bottes)* | **Palier `+5`** | **Palier `+4`** | **Palier `+3`** | **Palier `+3`** |
   | **Frein moyen (`0.65`–`0.80`)** *(Crit/PV armures)* | **Palier `+4`** | **Palier `+3`** | **Palier `+3`** | **Palier `+2`** |
   | **Standard (`0.85`–`1.20`)** *(Slots neutres/1M)* | **Palier `+3`** | **Palier `+2`–`+3`** | **Palier `+2`** | **Palier `+2`** |
   | **Boosté (`1.25`–`1.40`)** *(Force/Pow 2M, Déf Sec.)* | **Palier `+2`** | **Palier `+2`** | **Palier `+2`** | **Palier `+2`** |

3. **Statistique classique négative (`StatBase < 0`, contrepartie sur l'item) :**
   $$\text{Stat}(\text{up}) = \text{round}\Big( \text{StatBase} \times \big[ 1 + \text{up} \times R_{\text{neg}} \big] \Big)$$
   *(Les contreparties à `-1` conservent l'arrondi standard et ne doublent pas artificiellement.)*

4. **Effet spécial passif ou Malédiction (`specialEffectValue != 0`) :**
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

## 4. Système d'Amélioration — Catalyseurs (Niv. 4) & Anomalies d'Éveil (Niv. 5)

Chaque Secret du jeu (plus le tronc générique) possède **2 types d'anomalies dédiés à l'amélioration**, distincts des anomalies de base (Niveaux 1, 2 et 3) :
1. **Catalyseur (`Anomalie` Niveau 4) :**
   - **Rôle :** Requis aux paliers `+1`, `+2`, `+4`, `+5`.
   - **Obtention :** Loot en donjon (lié au Secret) OU Craft dans l'onglet **Éveil & Catalyseurs** (mix d'anomalies Lvl 1/2 du Secret + Or + XP Spiritualité).
2. **Anomalie d'Éveil (`Anomalie` Niveau 5) :**
   - **Rôle :** Requis aux paliers majeurs `+3`, `+4`, `+5`.
   - **Obtention :** Loot rare (Boss du Secret) OU Craft coûteux dans l'onglet **Éveil & Catalyseurs** (mix d'anomalies Lvl 2/3 du Secret + gros coût Or + gros coût XP Spiritualité).

### A. Courbe de Coût par Palier d'Amélioration

| Palier Cible | Catalyseur (Niv. 4) | Anomalie d'Éveil (Niv. 5) | Coût Or additionnel *(Base × Mult. Rareté)* |
| :---: | :---: | :---: | :--- |
| **Up 1 (`+0 → +1`)** | **1** | 0 | `500 Or × Mult_Rareté` |
| **Up 2 (`+1 → +2`)** | **2** | 0 | `1 000 Or × Mult_Rareté` |
| **Up 3 (`+2 → +3`)** | 0 | **1** | `2 000 Or × Mult_Rareté` |
| **Up 4 (`+3 → +4`)** | **1** | **1** | `3 500 Or × Mult_Rareté` |
| **Up 5 (`+4 → +5`)** | **2** | **2** | `6 000 Or × Mult_Rareté` |
| **TOTAL (`+0 → +5`)** | **6 Catalyseurs** | **4 Éveils** | *Multiplicateur Rareté : Légendaire (×1) · Maudit (×1.5) · Épique (×2) · Relique (×3)* |

### B. Table des 12 Duos (Niv. 4 & Niv. 5) — 11 Spiritualités + Générique

| Secret / Contexte | Spiritualité (`SpiritualiteType`) | Catalyseur (Niveau 4) | Anomalie d'Éveil (Niveau 5) | Exemple de Craft Onglet Éveil |
| :--- | :--- | :--- | :--- | :--- |
| **Secret du Chaos** | `DESTRUCTION` | Éclat de Chaos | **Cœur de Cendre** | `Braise Ardente` (Lvl 2) + `Crâne sanglant` (Lvl 3) + Or + XP Spirit |
| **Secret du Destin** | `KARMA` | Fragment du Destin | **Prisme Karmique** | `Orbe Catalytique Stabilisé` (Lvl 2) + `Cristal de vision` (Lvl 3) + Or + XP Spirit |
| **Secret de l'Éther** | `ESPRIT` | Souffle d'Éther | **Cœur Empyréen** | `Orbe d'espoir` (Lvl 2) + `Cœur séraphin` (Lvl 3) + Or + XP Spirit |
| **Secret des Abysses** | `TENEBRES` | Résidu Abyssal | **Noyau Néant** | `Cristal corrompu` (Lvl 2) + `Orbe démoniaque` (Lvl 2) + `Métal palpitant` (Lvl 2) + Or + XP Spirit |
| **Secret de l'Abondance** | `CREATION` | Sève Mutagène | **Ambre Parasitaire** | `Métal purulent` (Lvl 2) + `Orbe parasitée` (Lvl 3) + Or + XP Spirit |
| *Voie Conviction (Lave/Cristal)* | `CONVICTION` | Braises de Conviction | **Cœur de Lave Pure** | `Fibre Incandescente` (Lvl 2) + `Cœur de Basalte` (Lvl 3) + Or + XP Spirit |
| *Voie Sûreté (Eau/Glace/Pression)* | `SURETE` | Larme de Pression | **Perle des Profondeurs** | `Sablier de Vapeur` (Lvl 2) + `Orbe Sous-Pression` (Lvl 3) + Or + XP Spirit |
| *Voie Raison (Air/Vide/Gravité)* | `RAISON` | Ondes de Gravité | **Singularité Lucide** | `Cristal Résonnant` (Lvl 2) + `Orbe de Distorsion` (Lvl 3) + Or + XP Spirit |
| *Voie Violence (Combustion/Fureur)* | `VIOLENCE` | Éclat Déflagrant | **Noyau de Fureur** | `Métal Fragmenté` (Lvl 2) + `Cœur Furieux` (Lvl 3) + Or + XP Spirit |
| *Voie Trahison (Acide/Poison/Corrosion)* | `TRAHISON` | Fiole Corrosive | **Venin Souverain** | `Métal Corrodé` (Lvl 2) + `Crâne Empoisonné` (Lvl 3) + Or + XP Spirit |
| *Voie Consolidation (Terre/Métal/Atome)* | `CONSOLIDATION` | Noyau Tellurique | **Monolithe Éternel** | `Cube Atomique` (Lvl 2) + `Cœur Lithique` (Lvl 3) + Or + XP Spirit |
| **Aucun Secret (`null`)** | *Générique* | Poussière d'Éveil | **Pierre d'Ascension** | Mix d'anomalies Lvl 2/3 multi-spiritualités + Or & XP Spirit majorés |

*(Les 6 Voies sans anomalies en BDD reçoivent également leurs anomalies de base Niv. 1–3 thématiques : Lave/Verre pour Conviction, Eau/Glace/Pression pour Sûreté, Air/Vide/Gravité pour Raison, Combustion/Fragmentation pour Violence, Acide/Poison/Corrosion pour Trahison, Terre/Métal/Atome pour Consolidation.)*

### C. Règle d'Unicité & Multi-Recettes (Backend)
- **Pourquoi `level = 4/5` seul ne suffit pas :** Un simple niveau `4` ou `5` sur `Anomalie` mélangerait les catalyseurs aux anomalies Lvl 1–3 dans les Coffres et ferait apparaître leurs recettes dans l'Alchimie classique.
- **Unicité par Secret, flexibilité par Recettes :**
  - Chaque **Secret** ne possède qu'**1 Catalyseur (Niv. 4)** et **1 Anomalie d'Éveil (Niv. 5)** canoniques (table 4.B). Le mapping backend se fait **par Secret** (ex. `SecretAwakeningMapping`), jamais par simple couple `(spiritualite, level)` — ce qui évite toute collision si plusieurs Secrets partagent une Spiritualité.
  - En revanche, l'admin peut créer **plusieurs recettes (`AlchemyRecipe`)** menant au **même** Catalyseur ou à la **même** Anomalie d'Éveil (voies de craft alternatives selon les donjons farmés).
  - *Extension future possible :* Si plusieurs catalyseurs distincts coexistent un jour sur un même Secret/Voie, l'éveil devra cibler un nom/tag exact plutôt qu'une requête par niveau. D'ici là, `1 Secret = 1 Catalyseur Niv. 4 + 1 Éveil Niv. 5` reste le modèle le plus lisible.

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

---

## 7. Parcours UX — Déblocage, Onglet Alchimie, Liens & Tutoriel

### A. Condition de Déblocage (`unlockedAwakening`)
L'Atelier d'Éveil (onglet 2 d'Alchimie, craft des Catalyseurs/Éveils et amélioration d'équipements) suit la même logique de progression que le déblocage automatique de la Boutique :
- **Prérequis serveur :** Avoir **terminé au moins 1 donjon de niveau recommandé $\ge 3$** (`user.getCompletedDungeons()` contient un donjon avec `recommendedLevel >= 3`), sauf `ADMIN`.
- **Avant ce palier (`unlockedAwakening == false`) :**
  - L'onglet **Éveil & Catalyseurs** dans `/alchemy` affiche un écran verrouillé explicite (*« Terminez un donjon de niveau 3 pour débloquer l'Atelier d'Éveil »*).
  - Les liens **Éveiller** dans Armurerie/Coffres restent désactivés/masqués et les endpoints `/upgrade` + recettes `GIVE_CATALYST` / `GIVE_AWAKENING` sont bloqués côté serveur (`403`).

### B. Séparation Alchimie Classique vs Onglet "Éveil & Catalyseurs" (`/alchemy`)
La page **Alchimie** (`/alchemy`) est scindée en **2 onglets distincts** (sans ajouter de page dans la navbar) :
1. **Onglet 1 — Alchimie Classique :** Conserve uniquement les recettes classiques (`GIVE_ANOMALY` Lvl 1–3, consommables, équipements, secrets, XP Spiritualité). Les recettes de Catalyseurs (Niv. 4) et d'Anomalies d'Éveil (Niv. 5) en sont **totalement exclues**.
2. **Onglet 2 — Éveil & Catalyseurs :** Accessible une fois `unlockedAwakening == true`, regroupe exclusivement tout le cycle d'amélioration des équipements :
   - **Sous-section Catalyseurs & Éveils :** Recettes dédiées (`GIVE_CATALYST` / `GIVE_AWAKENING`) des **6 Catalyseurs (Niv. 4)** et **6 Anomalies d'Éveil (Niv. 5)** à partir d'anomalies Lvl 1–3 + Or + XP Spiritualité.
   - **Sous-section Atelier d'Éveil :** Liste des équipements éligibles du joueur (`LEGENDAIRE`, `EPIQUE`, `RELIQUE`, `MAUDIT`), équipés ou en coffre, avec preview avant/après (`+up → +(up+1)`) calculée par le serveur, coût (Catalyseur Niv. 4 / Éveil Niv. 5 + Or) et bouton d'éveil.

### C. Séparation dans les Coffres (`/vault`), Tri & Liens Contextuels (`/armory`, `/vault`)
- **Séparation visuelle dans les Coffres :** Les anomalies de base (`Niv. 1–3`) restent séparées des **Catalyseurs (`Niv. 4`)** et **Anomalies d'Éveil (`Niv. 5`)** via un filtre/sous-onglet dédié et des badges visuels distincts, évitant tout mélange brouillon.
- **Stacking & Tri par niveau d'éveil :**
  - Les équipements non équipés similaires sont groupés **uniquement s'ils partagent le même `(name, rarity, upgradeLevel)`** (un item `+0` et un item `+2` restent séparés).
  - Ajout d'un tri **Niveau d'éveil (Élevé / Faible)** dans les Coffres.
- **Démantèlement en quantité :** Quand un stack contient plusieurs équipements identiques du même palier (`stackCount > 1`), la modale de démantèlement permet de choisir la quantité (`1..stackCount`) avec preview cumulée d'Or et d'anomalies restituées.
- **Liens directs vers l'Éveil :** Sur les équipements équipés (**Armurerie**) et les équipements éligibles (**Coffres**), un lien **Éveiller** pointe vers `/alchemy?tab=awakening&equipId={id}`.
- **Règle d'activation stricte (calculée côté back dans le DTO) :**
  - Cliquable **uniquement si `upgradeReady == true`** (`unlockedAwakening == true`, item éligible, `upgradeLevel < 5`, joueur possède Catalyseur/Éveil + Or requis pour le palier suivant, et porteur non engagé en combat actif).
  - Si `upgradeReady == false` sur item éligible `< +5` (après déblocage de l'Atelier), reste non-cliquable/grisé avec motif retourné par le serveur (ex. *"Manque : 1× Éclat de Chaos, 500 Or"*).

### D. Tutoriel Guidé du Premier Éveil (`phase = "AWAKENING"`)
Intégré au moteur SSOT existant (`TutorialStep` + `GrimoireTutorial`) sur le modèle des tutoriels `ARMORY` / `EQUIP` / `SHOP` :
- **Persistance & Déclenchement (`AppUser.awakeningTutorialCompleted = false`) :**
  - `AuthController` expose `awakeningTutorialActive = true` dès que `unlockedAwakening == true`, `!awakeningTutorialCompleted` **ET** que le joueur possède pour la **première fois tout le nécessaire pour effectuer une 1re upgrade** (au moins 1 équipement éligible à `< +5` avec `upgradeReady == true`).
- **Enchaînement des étapes (`TutorialStep`) :**
  1. `AWAKENING_DISCOVER_LINK` *(sur Armurerie ou Coffres)* : Cible le lien **Éveiller** qui vient de s'activer → explique qu'un équipement rare peut désormais monter de `+0` à `+5` et invite à cliquer pour ouvrir l'Atelier d'Éveil.
  2. `AWAKENING_TAB_CATALYSTS` *(à l'arrivée sur `/alchemy?tab=awakening`)* : Cible la section **Catalyseurs (Niv. 4) & Anomalies d'Éveil (Niv. 5)** → explique la différence entre Catalyseurs (paliers `+1, +2, +4, +5`) et Anomalies d'Éveil (paliers `+3, +4, +5`), liés au Secret de l'objet (ou génériques).
  3. `AWAKENING_PREVIEW_STATS` : Cible le **panneau comparatif avant/après** → explique les multiplicateurs de rareté, les affinités de slot (boosts/freins) et l'impact sur les éventuelles contreparties/malédictions.
  4. `AWAKENING_EXECUTE` : Cible le bouton **"Éveiller l'équipement"** → valide le 1er éveil et rappelle que le démantèlement futur d'un objet éveillé restitue une partie des ingrédients de craft.

---

## 8. Démantèlement Partiel (Recyclage des Équipements)

Remplace ou complète la suppression sèche (`delete` sans contrepartie) dans les **Coffres** (`/vault`) pour les équipements non équipés (hors consommables) :

### A. Restitution d'Or selon la Rareté
- **Or de base (toutes raretés, `+0`) :** Pourcentage fixe du prix de référence (`calculateShopPrice()`) — ex. **`25%`** de `calculateShopPrice()` (arrondi à l'entier supérieur). Comme `calculateShopPrice()` intègre déjà `rarity.shopMultiplier` (`1.0` Commun → `6.0` Relique), la valeur en Or croît naturellement avec la rareté et le poids de l'objet.
- **Bonus d'Or si éveillé (`+1` à `+5`) :** Restitution d'une fraction (ex. **`30%`**) de l'Or total investi dans les paliers validés.

### B. Restitution Partielle des Ingrédients d'Éveil (`upgradeLevel >= 1`)
- Pour un item éveillé au palier `up >= 1`, le joueur ne récupère **jamais** directement les Catalyseurs (Niv. 4) ou Anomalies d'Éveil (Niv. 5) finis, ni de quoi recrafter l'intégralité de son éveil.
- Il récupère une **fraction stricte** des **ingrédients bruts** (`requiredAnomalies` des `AlchemyRecipe` de type `GIVE_CATALYST` / `GIVE_AWAKENING` du Secret de l'objet) :
  - Pour chaque ingrédient $i$ présent dans les recettes des Catalyseurs (Niv. 4) et Éveils (Niv. 5) consommés :
    $$\text{Qté rendue}_i = \min\Big(\text{Qté dépensée totale}_i - 1,\ \big\lfloor \text{Qté dépensée totale}_i \times 0.35 \big\rfloor\Big)$$
  - **Plancher de garantie (`up >= 1`) :** Si tous les arrondis tombent à `0` (cas d'un item `+1` n'ayant consommé qu'un seul Catalyseur Niv. 4), le démantèlement garantit **1 exemplaire** du premier ingrédient de la recette du Catalyseur (jamais assez pour recrafter le Catalyseur complet).
- **Source Unique de Vérité (SSOT) :** Le service de démantèlement lit dynamiquement `AlchemyRecipe.requiredAnomalies` en base pour le Secret concerné. Si une recette est ajustée en admin, le rendement du démantèlement reste automatiquement cohérent.

---

## 9. Architecture Technique & Cas Limites (SSOT)

1. **Modèle de données (`Equipment.java`, `Anomalie.java`, `AlchemyRecipe.java`, `AppUser.java`) :**
   - `Equipment` : conserver `bonus*` et `specialEffectValue` comme **valeurs de base `+0`** (zéro dérive d'arrondi, zéro migration destructive) et ajouter `upgradeLevel` (`int`, défaut `0`, borné `[0, 5]`).
   - `Anomalie` : supporter les niveaux `4` (**Catalyseur**) et `5` (**Anomalie d'Éveil**) + champ explicite `AnomalieType` (`STANDARD`, `CATALYSEUR`, `EVEIL`) pour isoler proprement les filtres Coffres/Admin sans dépendre uniquement du numéro de niveau. Ajouter les options `Niveau 4` et `Niveau 5` dans l'admin Coffres (`VaultPage`).
   - `RecipeRewardType` / `AlchemyRecipe` : ajouter **`GIVE_CATALYST`** et **`GIVE_AWAKENING`** dans `RecipeRewardType` (et dans `AlchemyAdminPage`) afin que l'Alchimie classique exclue ces recettes et que seul l'onglet 2 les affiche.
   - `AppUser` : ajouter `awakeningTutorialCompleted` (`boolean`, défaut `false`).
2. **Calcul côté Serveur (`EquipmentScalingService` & `SecretAwakeningMapping`) :**
   - `EquipmentScalingService` centralise `getEffectiveStats(Equipment)` utilisé par `Personnage`, `CombatRoomService` et `EquipmentMapper`.
   - `SecretAwakeningMapping` (SSOT) associe chaque `requiredSecret` (+ `null` générique) à son unique **Catalyseur (Niv. 4)** et son unique **Anomalie d'Éveil (Niv. 5)**, évitant toute ambiguïté entre Spiritualités.
   - `calculateShopPrice()` et le ratio de qualité `weight / maxWeight` dans les Coffres restent basés sur les stats `+0` (le niveau `+up` est affiché en badge distinct).
   - Les slots `@Deprecated ARME` et `ANNEAU` sont mappés respectivement vers `ARME_GAUCHE` et `ANNEAU_GAUCHE` dans la matrice $M_{\text{slot, stat}}$.
3. **Endpoints API REST (Backend = Cerveau) :**
   - `POST /api/equipments/{id}/upgrade/simulate` → retourne stats actuelles, stats au palier `+1`, deltas, coût (Or + Catalyseur Niv. 4 / Éveil Niv. 5) et `canUpgrade` / `missingReason`.
   - `POST /api/equipments/{id}/upgrade` → transaction atomique vérifiant **`unlockedAwakening` (donjon niv. ≥ 3 terminé)**, possession, rareté éligible, `upgradeLevel < 5`, **personnage non engagé en combat/donjon actif**, solde Or et Anomalies ; consomme les ressources et incrémente `upgradeLevel`.
   - `AlchemyService` : vérifie également `unlockedAwakening` avant d'exécuter un craft `GIVE_CATALYST` / `GIVE_AWAKENING`, et `AuthController` expose `unlockedAwakening` via `DungeonTutorialService` (sur le modèle de `unlockedShop`).
   - `POST /api/equipments/{id}/dismantle/simulate` & `POST /api/equipments/{id}/dismantle` → prévisualise puis exécute le démantèlement partiel (Or + anomalies ingrédients).
   - Extension de `POST /api/auth/tutorial/complete` et `/reset` pour gérer la phase `AWAKENING`.
4. **Front-End (`vault.js`, `armory.js`, `alchemy.js`, `alchemy-admin.js`, `tutorial.js`) :**
   - `groupEquipments()` dans `vault.js` inclut `eq.upgradeLevel || 0` dans la clé de groupement pour ne jamais fusionner des items de paliers différents.
   - Zéro formule de scaling ou de démantèlement en JS : tout vient du DTO `EquipmentResponseDTO` et des endpoints `/simulate`.
