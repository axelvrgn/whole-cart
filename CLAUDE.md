# CLAUDE.md — Whole Cart (PWA)

> Nom de l'application : « Whole Cart ». Repo GitHub : `axelvrgn/whole-cart`.

## 🎯 Le projet

PWA mobile : **je saisis ma liste de courses** (« yaourt », « thon », « pâtes »…) et, pour chaque article, l'app va chercher sur **Open Food Facts** les **références les moins industrielles** et me propose un **top 3**.

But : savoir quel produit prendre en rayon **sans perdre de temps à comparer** tous les produits du magasin. Le n°1 est affiché directement ; si il n'est pas en rayon, les n°2 et n°3 servent de solution de repli.

La différence avec Yuka / Open Food Facts : ces applis *notent* un produit qu'on a déjà en main. Celle-ci part de **ce que je veux acheter** et me dit **quoi prendre**.

**Hors périmètre** (abandonné) : scan de code-barres, choix de l'enseigne. Ne pas les réintroduire sans demande explicite.

### Utilisateur cible (V1)
- Usage **personnel**, par le développeur lui-même.
- Testé sur **iPhone, Safari**, installé via *Partager → Sur l'écran d'accueil*.
- Pas de compte développeur Apple : c'est pour ça qu'on fait une PWA et pas une appli native.
- Profil : sportif, veut cuisiner simple (batch cooking, plats au four).

### Le développeur
- Développeur **junior fullstack**. Explique les choix techniques non évidents en quelques lignes, sans jargon inutile.
- Préfère comprendre ce qui est fait : quand tu introduis un nouveau concept, ajoute un bref commentaire ou une explication.

---

## 🧱 Stack technique

| Rôle | Choix | Pourquoi |
|---|---|---|
| Build | **Vite** | Rapide, simple |
| UI | **React + TypeScript** | Standard, typage des réponses API |
| PWA | **vite-plugin-pwa** (Workbox) | Manifest + service worker générés |
| Stockage local | **Dexie** (IndexedDB) | Liste et cache des recherches, dispo hors ligne |
| Styles | **Tailwind CSS** | Rapide pour du mobile-first |
| Routing | **React Router** | Quelques écrans seulement |
| Tests | **Vitest** | Intégré à Vite |
| Hébergement | **Vercel** | Gratuit, HTTPS automatique, redéploie à chaque push |

**Pas de backend en V1** : l'app appelle Open Food Facts depuis le navigateur. Si une API n'autorise pas les appels depuis le navigateur (CORS), passer par une **réécriture Vercel** (`vercel.json`, même origine) et le **proxy Vite** en dev, pas par un serveur.

Ne pas ajouter de dépendance lourde sans le signaler et expliquer pourquoi.

---

## 📱 Contraintes iPhone / Safari

- PWA installée : le stockage peut être purgé par iOS si l'app n'est pas utilisée longtemps → **export/import JSON** de la liste (fait, écran Réglages).
- *Safe areas* (encoche) : `viewport-fit=cover` + `env(safe-area-inset-*)`.
- Champs de saisie en **16px minimum** (`text-base`), sinon Safari zoome au focus.
- **Mobile-first** : zones tactiles ≥ 44px, utilisable à une main en magasin.
- Hors ligne : la liste et les produits déjà trouvés doivent rester consultables sans réseau.

---

## 🌐 Source de données : Open Food Facts

Documentation : https://openfoodfacts.github.io/openfoodfacts-server/api/

### Comment on cherche (testé le 2026-10-01)
On utilise **uniquement search-a-licious** (`https://search.openfoodfacts.org/search`) : rapide (~0,2 s), il filtre par catégorie **et** en texte libre. L'ancienne API v2 `/api/v2/search` renvoyait souvent une page « temporarily unavailable » : abandonnée.
- **Pas de CORS** → l'app appelle `/off-search/search`, relayé vers OFF par le **proxy Vite** (dev, `vite.config.ts`) et une **réécriture Vercel** (prod, `vercel.json`).
- **Par catégorie** (mot connu du dictionnaire) : `q=categories_tags:"en:plain-yogurts" AND countries_tags:"en:france" AND lang:fr AND nova_group:[1 TO 3]`, `sort_by=-unique_scans_n`, `page_size=50`. Les 50 produits les plus scannés = ceux qu'on trouve en rayon. Si 0 résultat, on relance sans le filtre NOVA (NOVA 4 avec avertissement).
- **Texte libre** (mot inconnu) : chaque mot relié par `AND` (`lait AND de AND coco AND …`), mêmes filtres, tri par pertinence (pas par popularité). Résultats « approximatifs ». ⚠️ Avec des parenthèses ou de simples espaces, le serveur renvoie 0 résultat.
- `lang:fr` est indispensable : sans lui, des produits Tesco ou Lidl Allemagne marqués « vendu en France » sortent en tête.
- Code : `src/api/offSearch.ts` (requêtes et conversion, pur) et `src/api/productSearch.ts` (fetch, file d'attente, cache).

### Règles
- **Toujours** limiter les champs avec `fields=`.
- **Limites** : documentées pour l'API classique (10 recherches / min / IP), pas pour search-a-licious → file d'attente à **1 requête / 2 s**, **cache** IndexedDB de 7 jours (et résultat périmé réutilisé si le réseau tombe), état « Réessayer » sans bloquer la liste. OFF a aussi des pannes (page HTML, délais dépassés) : toujours vérifier que la réponse est du JSON.
- User-Agent identifiable (`WholeCart/0.1 (axelvrgn.dev@gmail.com)`) : ajouté par le proxy Vite ; impossible depuis le navigateur ni via une réécriture Vercel.
- Données communautaires : **tout champ peut être absent**. `nova_group` manquant → « Inconnu », ne jamais planter.
- `stores_tags` est très incomplet (0 « carrefour » sur les 50 yaourts nature les plus scannés) → ne pas s'en servir pour filtrer.

### Groupes NOVA
1. Aliments bruts ou peu transformés
2. Ingrédients culinaires (huile, beurre, sel, sucre)
3. Aliments transformés (conserves simples, fromage, pain)
4. Ultra-transformés (additifs, arômes, émulsifiants…)

Code couleur : 1 = vert, 2 = vert clair, 3 = orange, 4 = rouge, inconnu = gris.

---

## 🧠 Logique métier

1. **Saisie libre** d'un article dans la liste.
2. **Dictionnaire local** (`src/data/foods.ts`) : mot courant → catégorie OFF précise (« yaourt » → `en:plain-yogurts`, « pâtes » → `en:dry-pastas`). Ignore majuscules / accents / pluriels, le terme le plus précis gagne (« riz complet » > « riz »). Une phrase plus longue n'est reconnue que si les mots en plus sont **neutres** (bio, nature, quantités, « boîte de », « fromage »…) : « lait de coco » ne doit pas devenir du lait de vache. Les **fautes d'une lettre** sur les mots de 5 lettres et plus sont corrigées si un seul mot du dictionnaire correspond (« emmenthal » → emmental) ; les fautes ambiguës fréquentes sont ajoutées comme termes (« compté » → comté, pas compote). Les produits frais sans emballage (courgettes, pommes…) n'ont pas de catégorie → pas de recherche. **Toute nouvelle catégorie doit être vérifiée** dans la taxonomie officielle (`https://static.openfoodfacts.org/data/taxonomies/categories.json`).
3. **Recherche** : par catégorie si le mot est connu, sinon texte libre (approximatif). En texte libre, on ne garde que les produits dont le **nom (ou la marque) contient tous les mots significatifs** tapés : OFF renvoie sinon « Les pâtes à compter » pour « fromage compté ».
4. **Classement** (fonction pure testée), du moins au plus industriel :
   1. exclure les produits sans nom et les doublons (même code-barres, ou même nom + marque) ;
   2. **NOVA** : 1, 2, 3, puis inconnu, puis 4 (NOVA 4 seulement si rien d'autre, avec avertissement) ;
   3. **moins d'additifs** (champ absent = 0 : OFF l'omet quand il n'y en a pas) ;
   4. **liste d'ingrédients la plus courte** (inconnue = en dernier) ;
   5. popularité (nombre de scans) pour départager.
   → Le NOVA seul ne suffit pas : tous les thons en conserve sont NOVA 3, mais « thon, eau, sel » bat « thon, huile, arômes ».
5. **Top 3 = 3 marques différentes** si possible : le n°2 et le n°3 servent quand le n°1 n'est pas en rayon, et dans ce cas c'est souvent toute la marque qui manque (même marque seulement pour compléter).
6. **Affichage** : le n°1 sous l'article (photo, marque, nom, format, badge NOVA) ; toucher → panneau **top 3** (`<dialog>` natif), choix d'un autre produit mémorisé dans l'article. **« Voir plus de produits »** : +5 à chaque clic. Les 10 premiers sont enregistrés dans l'article (hors ligne), au-delà la liste complète (~50) vient du cache. Le produit choisi est stocké dans l'article → visible hors ligne ; les photos OFF sont mises en cache 30 jours par le service worker.

---

## 🗂️ Structure du projet

```
src/
  api/            # Client Open Food Facts (fetch typé, file d'attente, cache)
  db/             # Dexie : schéma IndexedDB
  data/           # JSON statiques : dictionnaire mot → catégorie OFF
  features/
    list/         # Liste de courses (saisie, cochage, produits proposés)
    settings/     # Sauvegarde / restauration
  components/     # UI réutilisable (NovaBadge, Page, BottomNav…)
  hooks/
  types/          # Types TypeScript (Product, ShoppingItem…)
  utils/          # Fonctions pures (nova, backup, classement…)
```

---

## 🗺️ Feuille de route

**Fait**
- Setup : Vite, React, TS, Tailwind, PWA, icônes, balises iOS, HTTPS local, Docker
- Liste de courses : ajout, cochage, suppression, hors ligne (Dexie), export/import JSON

**Étape A — Moteur de recherche** ✅
- Dictionnaire de ~120 aliments (88 catégories OFF vérifiées)
- Client OFF : catégorie + repli texte libre via proxy, file d'attente, cache 7 jours
- Fonction de classement testée

**Étape B — Branchement sur la liste** ✅
- Recherche automatique à l'ajout d'un article (`searchRunner.ts`, reprend les recherches interrompues au relancement)
- N°1 sous l'article, top 3 au toucher, choix d'un autre produit
- États : recherche en cours, aucun résultat, erreur / hors ligne → Réessayer

**Améliorations faites après tests**
- « fromage comté », fautes de frappe, filtre de pertinence en texte libre, « Voir plus de produits »

**Idées en attente** (proposées, pas encore validées)
- Filtrer le panneau par marque (« carrefour », « U », « nixe »…)
- Départager les égalités avec les labels OFF : bio, AOP/AOC, lait cru, Label Rouge (tous les comtés sont NOVA 3, sans additif, 4 ingrédients → aujourd'hui c'est la popularité qui tranche)
- Se méfier des fiches à 1–2 ingrédients (souvent incomplètes) ; dire franchement quand le top 3 est à égalité
- Extrait OFF ciblé (script → JSON ~150 Ko des 88 catégories) pour zéro appel et du hors ligne dès le départ

**Étape C — Déploiement**
- Vercel relié au repo GitHub, test sur iPhone installé

**Plus tard**
- Recettes simples / batch cooking → génèrent la liste
- Apprendre de mes choix (si je choisis souvent le n°2, le remonter)

---

## 📏 Conventions

- TypeScript **strict**, pas de `any` sans justification.
- Composants fonctionnels + hooks.
- Logique métier (dictionnaire, classement) dans des **fonctions pures testées** avec Vitest, séparées de l'UI.
- Textes de l'interface **en français**.
- Code, noms de variables et commits en anglais.
- Commits courts et clairs (Conventional Commits : `feat:`, `fix:`, `chore:`…).
- Avancer **étape par étape** : proposer un plan avant une grosse fonctionnalité.

## ⌨️ Commandes

**Node n'est pas installé sur la machine** : tout passe par Docker (`docker-compose.yml`, image `node:24-alpine`). Le dossier du projet est monté dans `/app`.

```bash
docker compose up -d                                  # serveur de dev HTTPS sur :5173
docker compose logs -f app                            # voir les logs du serveur
docker compose down                                   # arrêter
docker compose run --rm app npm install <paquet>      # ajouter une dépendance
docker compose run --rm app npm run build
docker compose run --rm app npx vitest run            # tests une fois
docker compose run --rm app npm run lint              # oxlint
docker compose run --rm --service-ports app npm run preview -- --host   # tester le build PWA sur :4173
```

- Depuis Git Bash, préfixer par `MSYS_NO_PATHCONV=1` si un chemin `/app` est mal converti.
- **Tester dans le navigateur intégré** (il refuse le certificat auto-signé) : serveur HTTP temporaire avec `NO_HTTPS=1` :
  `docker run -d --rm --name wc-http -e DOCKER=true -e NO_HTTPS=1 -p 5180:5180 -v "G:/project/whole-cart:/app" -w /app node:24-alpine npx vite --port 5180` → http://localhost:5180, puis `docker stop wc-http`.
- Le watcher Vite utilise le polling (`DOCKER=true`) : les événements fichiers Windows ne traversent pas le montage.
- `node_modules` contient des binaires Linux : ne pas lancer `npm install` côté Windows sur le même dossier.
- Git : remote en SSH (`git@github.com:axelvrgn/whole-cart.git`), clé protégée par phrase de passe → c'est le développeur qui fait les `git push`.

## 🧪 Tester sur l'iPhone

1. `docker compose up -d` (HTTPS auto-signé + écoute réseau configurés dans `vite.config.ts`).
2. Sur l'iPhone (même Wi-Fi), ouvrir `https://<IP Wi-Fi du PC>:5173` dans Safari (pas l'IP affichée par Vite, qui est celle du conteneur) et accepter le certificat.
3. Pour l'installation PWA et le hors ligne : URL Vercel, puis *Partager → Sur l'écran d'accueil*.
