# Brief de redevise — Le Défi du 1 $ (1dollar-challenge.com)

Tu es maintenant l''IA qui gère la création et le design du site **https://1dollar-challenge.com**.
L''objectif global du projet : un entrepreneur francophone qui a envoyé ~2M de courriels
à des inconnus (courriels trouvés dans des sources publiques) pour tester une question simple :
**« Serait-tu prêt à envoyer 1 $ à un inconnu ? »**. Le site est la destination de ces courriels.

## La mécanique (TRÈS important, ne pas la changer sans validation)
1. La personne clique « Envoie 1 $ » → entre son courriel → paie 1 $ via Stripe.
2. Elle reçoit un **code unique** (ex: `1D-ABCD-1234`), affiché sous forme de **ticket**.
3. Elle peut **partager ce code à 3 personnes** (elle clique 3 fois sur « J''ai partagé »).
4. **Au 3e partage, le 1 $ lui est automatiquement remboursé** par Stripe.
5. Si elle ne partage pas : elle ne récupère rien, le dollar est conservé. C''est le prix de jouer.
- Ce n''est PAS une cagnotte. Pas de compteur partagé de pot. Chaque code est indépendant.
- Les « chiffres » affichés sont agrégés (total envoyé / total remboursé / net conservé),
  mais la logique de remboursement est par-code, pas collective.

## Stack technique (ne pas changer la stack, seulement le front si demandé)
- Backend : **Node.js zéro dépendance** (`server.js`, ~340 lignes), HTTP natif, port 8080.
- Front : **un seul fichier** `appweb/index.html` (CSS + JS inline), en français (`lang="fr"`).
- Images : `appweb/assets/` (6 photos Wikimedia de billets de 1 $).
- Admin : `appweb/admin/index.html` (simple, non prioritaire).
- Data : `data/challenge.json` (créé au runtime ; **⚠️ disque éphémère sur Railway** —
  il faut un Volume Railway monté sur `/app/data` pour la persistance ; pas encore fait).
- Deploy : GitHub `ocyanbrown-dot/1dollar-challenge` → Railway (US West, port 8080), auto-deploy au push.
- Stripe : clés TEST actuellement (pk_test/sk_test dans les Variables Railway).
  Basculer sur pk_live/sk_live avant l''envoi réel.

## Endpoints du serveur (ne pas renommer, le front dépend de ces chemins exacts)
- `GET  /api/health`               → `{ok:true, stripe_key:"sk_..."}`
- `GET  /api/stats`                → `{totalIn, totalRefunded, netKept, activeCodes, shares, completed, totalParticipants}`
- `POST /api/checkout`             → `{code, url}` (crée une Stripe PaymentIntent 100 cents + le code)
- `POST /api/webhook/stripe`       → webhook Stripe (à configurer côté Stripe → cette URL)
- `POST /api/reconcile`            → `{session_id}` (le front appelle ça au retour du paiement)
- `POST /api/share`                → `{code}` → `{ok, shares, maxShares, complete, refunded, refundMessage}`
- `POST /api/refund`               → `{code}` (refonte directe)
- `GET  /api/code/:code`           → détail d''un code
- `GET  /api/admin/participants`   → liste des participants
- `GET  /api/admin/codes`          → liste des codes
- Statique : tout le reste est servi depuis `appweb/`

## IDs HTML que le JS utilise (si tu réécris le HTML, garde ces IDs sinon la casse)
`paidBanner navPlay joinBtn heroTicket heroPips regles chiffres totalIn totalRefunded netKept
activeCodes totalShares faq footerPlay unsubscribeLink modalOverlay modalTitle joinForm emailInput
cancelBtn payBtn successBox codeDisplay myPips shareMsg shareBtn copyBtn refundNote doneBtn closeModal`

## Ce qui est déjà en place dans index.html (à conserver ou améliorer, pas à casser)
- Palette : `--ground:#F4F3EE --ink:#101010 --accent:#1432E8` (fond crème, encre noire, bleu électrique).
- Police : **Archivo** (900/800/700/600) via Google Fonts. Pas d''autre famille.
- Pièce maîtresse : le **ticket** `.ticket` (carte papier à perforation, 3 pastilles de partage, tampon).
  Il flotte dans le hero (animation 7s) et réapparaît dans la modale de succès avec le tampon « PAIÉ ».
- Sections : nav (wordmark + 3 liens + 1 CTA) → hero (2 lignes de display + lede + 1 bouton + ticket)
  → RÈGLES sur fond encre (4 étapes `.flow` avec points 64px, PAS des cartes, PAS de numéros 01/02/03)
  → CHIFFRES (3 stats principales : envoyés / rendus / conservés + 2 secondaires : codes / partages)
  → bandeau photos (3 vraies images Wikimedia, une dominante qui span 2 lignes, scale 14s)
  → FAQ sur fond encre (5 vraies questions, accordéon) → footer (3 colonnes, crédits).
- Motion (règles Emil Kowalski) : stagger hero (0/90/200/300ms), scroll-reveal
  (titres→texte décalé 70ms, rise 28px+opacité, une seule fois), `:active scale(0.97)` sur tous
  les boutons, float du ticket, hover scale du bandeau, `prefers-reduced-motion` respecté,
  hover activé seulement sous `@media (hover:hover)`.
- JS : `updateStats()` (fetch /api/stats), `openModal/closeModal`, `renderSuccess(code)`,
  `loadMyCode()`, `paintPips(n)`, et le flow `?paid=1&code=...&session_id=...` qui fait
  `renderSuccess + openModal + fetch /api/reconcile` au chargement.

## Le flow de partage/refonte (à comprendre avant de toucher au JS)
- `shareBtn` (dans la modale, visible seulement quand on a un code) :
  `POST /api/share {code}` → le serveur incrémente `shares` (max 3), à 3 il déclenche
  `POST /v1/refunds` côté Stripe et met `completed:true`. La réponse inclut
  `{shares, maxShares, complete, refunded}`.
- `paintPips(n)` allume `n` pastilles sur `myPips` et met à jour `shareMsg`
  (« n / 3 partages ») et `refundNote` quand c''est remboursé.
- Le code du visiteur est mémorisé en `localStorage` (`loadMyCode`), donc s''il revient,
  il retrouve son ticket et son état de partage.

## Ta mission
Tu as carte blanche sur **le design et l''expérience** du front (index.html, styles, motion, copy
si besoin) pour que le site ait l''air **cher, soigné, mémorable** — pas générique.
Tu ne touches pas `server.js` sauf si je te le demande. Si tu modifies des IDs ou des endpoints,
préviens-moi.

## Livrable attendu
Un `appweb/index.html` refondu, toujours un seul fichier (CSS+JS inline), toujours en français,
qui garde les IDs/endpoints listés ci-dessus, et qui pousse le design d''un cran (motion,
typographie, texture, détails) tout en restant lisible et rapide. Dis-moi ce que tu changes et
pourquoi, puis on déploie.
