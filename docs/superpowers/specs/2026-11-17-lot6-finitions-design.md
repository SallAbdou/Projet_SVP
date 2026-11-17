# Lot 6 · Finitions de démo : design

Date : 2026-11-17 · Statut : validé (contenu transmis par la session parente, sans nouvelle validation) · Découle de `2026-11-17-front-roadmap-design.md` (lot 6)

## Intention

Le site doit tenir une démo de 5 à 7 minutes devant le jury, sur grand écran comme sur téléphone, à la souris comme au clavier. Ce lot corrige les défauts relevés dans les journaux des lots 1 à 5, fait une passe visuelle et d'accessibilité, ajoute un QR code vers le site et écrit le scénario de démo.

## Correctifs

1. **Navigation mobile.** Sous 900 px, la nav latérale (`nav.js`) devient une barre collée en haut : logo, prénom, bouton « Menu » (`aria-expanded`, `aria-controls`) qui ouvre un panneau avec les 5 liens, FR/EN et la déconnexion. Échap ferme le panneau et rend le focus au bouton ; un clic hors du panneau ou la sortie du focus le ferme. Modèle « disclosure » : le focus reste sur le bouton à l'ouverture, le panneau suit dans l'ordre de tabulation. L'état ouvert survit aux rendus (changement de langue depuis le panneau). Les règles CSS sont injectées une fois par `nav.js` (une seule source pour les 5 pages). À 375 px, le contenu commence juste sous une barre d'environ 64 px.
2. **Comptoir.** Pendant le chargement, les KPI affichent « … » sans écart (plus de « 0 · stable »), le graphique et l'analyse affichent « Mise au four… ». Si la fournée répond `attente`, le comptoir réinterroge l'adaptateur toutes les 2 s (comme `/fournee`) et l'encart « Tout juste sorti du four » se remplit seul.
3. **Message annulable** (`#pq-toast`, fournée et garde-manger). Quand l'action vient du clavier (clic d'activation avec `detail === 0`), le focus passe sur « Annuler » dès l'apparition du message ; le bouton porte le texte du message en description (`aria-describedby`). Tant que le focus est dans le message, le délai de 5 s est suspendu (WCAG 2.2.1) et reprend à la sortie du focus. Échap ou l'expiration rendent le focus au bouton d'origine (ou à son remplaçant) ; Annuler aussi. À la souris, rien ne change (pas de vol de focus, message de 5 s cliquable).
4. **`?demo=reset` partout.** Sur `/ta-fournee-type` et `/verifie-tes-mails`, `store.js` et `demo.js` passent dans le `<head>` avant le script de redirection, comme sur les pages protégées.
5. **Moteur.** Une valeur insérée par une liste `sc-for` n'est jamais réinterprétée par le second passage : les accolades des valeurs sont encodées (`&#123;`, `&#125;`), ce qui s'affiche à l'identique. La fonction de remplissage du gabarit est exposée par `boot.js` sous Node (`module.exports`) et testée.
6. **EN.** Les libellés anglais des choix du Tally passent dans `questionnaire.js` (`Questionnaire.libelle(valeur, lang)`, testé) et servent au questionnaire, à la restitution et au profil (thématiques et métiers). La valeur enregistrée reste le texte exact du Tally. Le `<title>` de chaque page est traduit : `boot.js` lit `<meta name="pq-titre-en">` et bascule `document.title` selon la langue.
7. **Fenêtre « au four ».** Les 4 s se comptent à partir de la première demande de fournée après l'activation du compte (`fourOuvertLe`, posé par `Auth.ouvrirFour`), et non plus de la validation du mot de passe. Cette ouverture n'a lieu que dans les 10 minutes qui suivent l'activation ; au-delà, plus de four.

## Passe visuelle et accessibilité

8. Badges cohérents : plus de « MVP » ni « V1 » sur les pages réelles ; « Données d'exemple » seulement là où des données d'exemple sont affichées. États vides et de chargement au même ton (« Mise au four… »). Transitions douces (survol, apparition du message) coupées sous `prefers-reduced-motion`.
9. Contrôle à 375, 768, 1024 et 1440 px, au clavier seul, contrastes (texte 4,5:1), repères (`main`, `nav`, un seul `h1`, titres sans saut, `lang` de la page) sur tout le parcours ; tout défaut trouvé est corrigé et consigné.
10. `404.html` : en-tête du parcours (`parcours.js`) et lien de retour vers l'accueil `/`.

## QR code et scénario

11. QR code vers `https://team42svp.vercel.app/` en SVG statique `assets/qr-landing.svg`, généré une fois avec `npx --yes qrcode@1.5.4` (accord de Delio requis avant exécution ; sans accord, emplacement et marche à suivre). Affiché sur la landing (bloc « Scanne pour la démo », grand écran seulement, au-dessus de 1024 px) et sur la page imprimable `/qr` (QR en grand, adresse en clair, styles d'impression). Aucune dépendance ajoutée au site.
12. Scénario `docs/demo/scenario-jury.md` : 5 à 7 minutes, étapes numérotées avec les clics exacts, une ou deux phrases par écran, durée indicative, plan B pour chaque point fragile (compte de Léa, `?demo=reset`, fournée d'exemple). Joué de bout en bout dans le navigateur après `?demo=reset`, durées réelles notées.

## Hors périmètre

Branchement du back (lot 7), événement `storage` entre onglets, traduction des contenus d'articles.
