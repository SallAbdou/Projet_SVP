# Lot 33 : progression personnelle (cartes cuites, points de cuisson, niveaux, levain, collection)

Seconde moitié de la gamification par cartes, sur la base du lot 32 (`jeu.js`, `rituel.js`, vue cartes). Jeu personnel : ni classement, ni achat, ni message culpabilisant. Le lot 32 est étendu, pas refait.

## Mémoire
Toujours `pq-jeu` (déjà dans `CLES_DEMO`, donc effacé par `?demo=reset`), version 1, un objet par compte. Champs ajoutés, tous facultatifs (un compte du lot 32 reste valide) :

```
{ rituel: 'AAAA-MM-JJ', vue: 'fournee' | 'cartes',
  actif: true,                       // case « Jeu des cartes activé » du profil
  points: 0,                         // points de cuisson cumulés
  rituelPoints: 'AAAA-MM-JJ',        // dernier jour où l'ouverture du rituel a rapporté
  levain: { jours: 0, dernier: 'AAAA-MM-JJ' },
  cartes: { [ref]: { titre, source, axe, rarete, vue: 'AAAA-MM-JJ', cuite: 'AAAA-MM-JJ' | '', gain } },
  exemple: true }                    // présent seulement sur les données d'exemple de Léa
```

Toutes les fonctions prennent la date en paramètre (tests avec dates injectées).

## Règles (constantes uniques dans `jeu.js`)
- `Jeu.POINTS` : cuisson selon la fraîcheur au moment de la cuisson, Tout chaud 60, À pétrir 40, Rassis 15 ; bonus de rareté Maillard 15, Dorée 10, Croûte 5, Mie 0 ; ouverture du rituel 10, une fois par jour.
- **Cuisson** : confirmer la publication au fournil cuit la carte de même `ref`, une seule fois (une seconde publication ne rapporte rien). Fraîcheur : feu de la news si elle vient de la fournée, fraîcheur du garde-manger (âge de la mise de côté) si elle vient de là. Rareté : celle de la carte déjà vue, sinon calculée depuis l'article.
- `Jeu.NIVEAUX` : Apprenti 0, Mitron 100, Boulanger 300, Maître artisan 700. Barre vers le niveau suivant (texte « 40 points avant Boulanger », barre décorative).
- `Jeu.LEVAIN` : le levain compte les jours où la fournée a été ouverte (page fournée ou rituel). Après 2 jours manqués d'affilée il « s'endort » (état affiché, sans reproche). À la visite suivante il se réveille avec la moitié de ses jours (arrondie au-dessus), plus le jour même. Jamais de retour à zéro.
- **Cartes vues** : les cartes du jour sont ajoutées à la collection à l'ouverture de la fournée (toutes vues) ou du rituel.
- **Jeu désactivé** (case du profil, par compte, comme Animations) : pas de rituel, pas de bascule (vue fournée), pas d'encart au comptoir, pas d'onglet collection, aucun gain ni aucune carte enregistrée. Les données restent et reviennent quand on recoche.

## Interface
- **Carte cuite** : `data-cuite` sur `.jeu-carte`, pastille texte « Cuite » avec un petit pain, cadre intérieur double et bandeau haut. Dans la vue cartes et la collection. Jamais la couleur seule.
- **Fournil** : après « Confirmer la publication », le message de statut existant dit aussi « Carte cuite : +55 points de cuisson. » puis, si l'on monte, « Nouveau niveau : Boulanger. » (pas de confettis).
- **Comptoir** : encart compact « Ton levain » et « Ton niveau » sous l'en-tête, barre de progression, lien « Voir ma collection ». Texte complet lisible, barre `aria-hidden`. Légère animation de remplissage seulement si les animations sont activées.
- **Garde-manger** : onglets `role="tablist"` « Mis de côté » et « Ma collection » (flèches, Début, Fin), panneaux `role="tabpanel"`. `?onglet=collection` ouvre la collection. Collection par famille (axe de l'article) : « Axe 2 : 3 cartes, dont 1 cuite », mini cartes sans actions, cuites en premier. Cible de la visite (`data-visite="garde"`) inchangée, sur l'onglet « Mis de côté ».
- **Profil** : case « Jeu des cartes activé » dans la section Apparence, sous Animations. FR et EN.

## Données d'exemple (démo jury)
Pour le compte démo `lea@demo.painquotidien.fr` sans entrée `pq-jeu`, `Jeu.exempleLea(date)` fournit : 160 points (Mitron), levain de 4 jours nourri la veille, 6 cartes vues sur deux familles dont 2 cuites (dont deux de la fournée de démo). Marqué `exemple: true` et commenté comme données d'exemple. Effacé par `?demo=reset`, puis reconstruit à la visite suivante.

## Back
Note pour Abdou dans `docs/branchement-back.md` : schéma SQL indicatif Supabase (`jeu_progression`, `jeu_cartes`), rien de branché.
