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

### Deux façons de chercher (testées le 2026-10-01)
1. **Par catégorie** (fiable, à privilégier) — API v2, **CORS OK** depuis le navigateur :
   `GET https://world.openfoodfacts.org/api/v2/search?categories_tags_en=plain-yogurts&countries_tags_en=france&page_size=50&fields=...`
2. **Texte libre** (repli, approximatif) — search-a-licious, **pas de CORS** → passer par une réécriture Vercel / proxy Vite :
   `GET https://search.openfoodfacts.org/search?q=yaourt countries_tags:"en:france"&langs=fr&fields=...`
   ⚠️ Très bruité : « pâtes » renvoie du beurre de cacahuète et du camembert. Ne l'utiliser que si le mot est absent du dictionnaire, en affichant « résultats approximatifs ».

### Règles
- **Toujours** limiter les champs avec `fields=`.
- **Limites** : 10 recherches / min / IP, 15 lectures produit / min / IP. Le serveur de recherche renvoie parfois une page HTML « temporarily unavailable » → **file d'attente** qui espace les requêtes, **cache** IndexedDB (~7 jours), et état « Réessayer » sans bloquer la liste.
- User-Agent identifiable souhaité (`WholeCart/0.1 (axelvrgn.dev@gmail.com)`) ; non modifiable dans le navigateur, à prévoir si un backend arrive.
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
2. **Dictionnaire local** (`src/data/`) : mot courant → catégorie OFF précise (« yaourt » → `en:plain-yogurts`, « pâtes » → `en:dry-pastas`). Gère pluriels / accents / synonymes. Les produits bruts sans emballage (courgette, œufs à la pièce…) peuvent être marqués « pas de recherche ».
3. **Recherche** : par catégorie si le mot est connu, sinon texte libre (approximatif).
4. **Classement** (fonction pure testée), du moins au plus industriel :
   1. exclure les produits sans nom ;
   2. **NOVA** le plus bas (inconnu en dernier, NOVA 4 seulement si rien d'autre, avec avertissement) ;
   3. **moins d'additifs** ;
   4. **liste d'ingrédients la plus courte** ;
   5. popularité (nombre de scans) pour départager.
   → Le NOVA seul ne suffit pas : tous les thons en conserve sont NOVA 3, mais « thon, eau, sel » bat « thon, huile, arômes ».
5. **Affichage** : le n°1 sous l'article (photo, marque, nom, badge NOVA) ; toucher la ligne → **top 3**, avec possibilité de choisir un autre produit.

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

**Étape A — Moteur de recherche**
- Dictionnaire d'aliments courants → catégorie OFF
- Client OFF : recherche par catégorie + repli texte libre (réécriture Vercel / proxy Vite), file d'attente, cache
- Fonction de classement testée

**Étape B — Branchement sur la liste**
- Recherche automatique à l'ajout d'un article
- N°1 sous l'article, top 3 au toucher, choix d'un autre produit
- États : recherche en cours, aucun résultat, erreur / hors ligne → Réessayer

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
- Le watcher Vite utilise le polling (`DOCKER=true`) : les événements fichiers Windows ne traversent pas le montage.
- `node_modules` contient des binaires Linux : ne pas lancer `npm install` côté Windows sur le même dossier.
- Git : remote en SSH (`git@github.com:axelvrgn/whole-cart.git`), clé protégée par phrase de passe → c'est le développeur qui fait les `git push`.

## 🧪 Tester sur l'iPhone

1. `docker compose up -d` (HTTPS auto-signé + écoute réseau configurés dans `vite.config.ts`).
2. Sur l'iPhone (même Wi-Fi), ouvrir `https://<IP Wi-Fi du PC>:5173` dans Safari (pas l'IP affichée par Vite, qui est celle du conteneur) et accepter le certificat.
3. Pour l'installation PWA et le hors ligne : URL Vercel, puis *Partager → Sur l'écran d'accueil*.
