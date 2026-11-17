# Lot 2 · La fournée qui agit : design

Date : 2026-11-17 · Statut : validé par Delio · Découle de `2026-11-17-front-roadmap-design.md` (lot 2)

## Intention

Devant le jury, Léa ne se contente plus de lire sa fournée : sur chaque news, elle peut la pétrir en post, la mettre de côté pour plus tard ou l'ignorer. Chaque geste a un retour immédiat et peut être annulé. Tout reste simulé dans le navigateur (état du `store` en `localStorage`).

## Les trois actions d'un bloc news

- **Pétrir un post** (bouton principal) : ouvre `/fournil?ref=<ref>`. Le fournil ne lira ce paramètre qu'au lot 4.
- **Mettre de côté** (icône signet) : ajoute l'article au garde-manger via `Store.mettreDeCote` ; le compteur de la nav se met à jour immédiatement. Un second clic retire l'article (`Store.retirer`). L'état est indiqué par l'icône pleine ou vide et par `aria-pressed`.
- **Ignorer** (icône ✕) : `Store.ignorer` pour la date du jour.

## Ignorer décale les emplacements

- L'emplacement n°K reçoit le K-ième article **non ignoré**, trié par rang. Le trou laissé en bas est comblé par le premier article qui n'était pas affiché.
- Un sujet ignoré revient avec la fournée du lendemain.
- Si tout est ignoré : message « Tu as tout passé en revue pour aujourd'hui » et bouton pour tout faire revenir.

## Retour visuel

- Petit message en bas d'écran : « Mis de côté », « Retiré du garde-manger », « Sujet ignoré », avec un bouton « Annuler » pendant 5 s.
- Le message est dans une zone `aria-live="polite"`.

## Règles d'affichage

- En mode Personnaliser, les boutons d'action sont masqués.
- Date de la fournée = date du jour au format `YYYY-MM-DD` (WF3 n'en renvoie pas).
- Blocs S : « Mettre de côté » et « Ignorer » en icônes avec libellé accessible ; blocs M et L : icône + texte.
- Cibles de 44 px au doigt (comme la barre d'outils actuelle : 28 px à la souris, 44 px au toucher).

## Code

- `store.js` : une fonction pour annuler un « Ignorer », `desIgnorer(etat, ref, dateFournee)`.
- `bento.js` : une sélection qui exclut les refs ignorées, `pickTopics(articles, n, exclus)`.
- Les deux sont testées avec `node --test`. La page est vérifiée dans le navigateur intégré.

## Non-objectifs

- Le fournil ne s'ouvre pas encore sur le sujet choisi (lot 4).
- Le garde-manger n'affiche pas encore la liste réelle (lot 3) ; seul le compteur de la nav change.
- Aucun appel réseau.
