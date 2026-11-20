# Accessibilité : où trouver quoi

Cible : WCAG 2.2 niveau AA, sans overlay. Démarche volontaire (le projet n'a pas d'obligation légale).

| Document | Rôle |
|---|---|
| [`audit-lot24.md`](audit-lot24.md) | Audit manuel et axe du 20 novembre 2026 : problèmes relevés, corrections, ce qui n'a pas été vérifié, procédure de test au lecteur d'écran. |
| [`checklist-pr.md`](checklist-pr.md) | À cocher dans chaque PR qui touche une page ou un composant (aussi dans le modèle de PR GitHub). |
| [`/accessibilite`](../../accessibilite.html) | Déclaration publique, en français et en anglais. Liée depuis le pied des pages publiques et depuis la nav des pages connectées. |
| `tests/gardefous.test.js`, `tests/charte.test.js`, `tests/declaration.test.js` | Garde-fous automatiques (`node --test "tests/*.test.js"`). |

## Tenir la déclaration à jour

La déclaration ne doit jamais promettre plus que ce qui a été vérifié. Mets-la à jour dans la même PR quand :

- **un contrôle « non vérifié » est fait** (lecteur d'écran, zoom du texte seul, couleurs forcées de Windows, thèmes Nuit et Contraste élevé, téléphone réel) : retire la ligne de la liste `nonTeste` (FR et EN) et note le résultat dans un nouveau rapport ou dans `audit-lot24.md` ;
- **un problème est trouvé et laissé ouvert** : ajoute-le à `nonTeste` ou à une nouvelle liste « non conforme », avec le critère WCAG ;
- **une fonction d'accessibilité est ajoutée ou retirée** : liste `fonctions` ;
- **un nouvel audit est fait** : texte `etat`, liste `methode`, liste `env`, et les deux dates (`dates`) ;
- **le site passe en mode réel** : revois la liste `demo` (limites du mode démo).

À chaque mise à jour, change la date « mise à jour le » en FR et en EN. Ne donne jamais de taux de conformité sans audit complet critère par critère (un test le vérifie). Le statut ne passe à « totalement conforme » qu'après un audit complet sans aucun manquement.

Tous les textes sont dans l'objet `T` de `accessibilite.html` ; `tests/declaration.test.js` vérifie que le français et l'anglais ont exactement la même structure.

## Adresse de contact à compléter

L'adresse e-mail de contact n'est pas encore choisie. Elle se règle dans `config.js`, clé `contactAccessibilite` (marquée « À COMPLÉTER »). Tant qu'elle est vide, la page affiche « adresse à venir ». Une fois remplie, la page affiche un lien `mailto:` ; mets alors aussi à jour le test de `tests/config.test.js` qui fixe la valeur par défaut.
