# CLAUDE.md — Clean Eating (PWA)

> Nom de l’application : « Clean Eating ».

## 🎯 Le projet

PWA mobile qui génère une **liste de courses privilégiant les produits les moins transformés possible**, adaptée à l'**enseigne choisie** par l'utilisateur, et qui permet de **scanner un produit en rayon** pour vérifier son niveau de transformation et proposer une alternative plus brute.

La différence avec Yuka / Open Food Facts : ces applis *notent* un produit. Celle-ci *construit la liste de courses*.

### Utilisateur cible (V1)
- Usage **personnel**, par le développeur lui-même.
- Testé sur **iPhone, Safari**, installé via *Partager → Sur l'écran d'accueil*.
- Pas de compte développeur Apple : c'est pour ça qu'on fait une PWA et pas une appli native.
- Profil : sportif, veut cuisiner simple (batch cooking, plats au four), pas de recettes compliquées.

### Le développeur
- Développeur **junior fullstack**. Explique les choix techniques non évidents en quelques lignes, sans jargon inutile.
- Préfère comprendre ce qui est fait : quand tu introduis un nouveau concept (service worker, IndexedDB…), ajoute un bref commentaire ou une explication.

---

## 🧱 Stack technique

| Rôle | Choix | Pourquoi |
|---|---|---|
| Build | **Vite** | Rapide, simple |
| UI | **React + TypeScript** | Standard, typage des réponses API |
| PWA | **vite-plugin-pwa** (Workbox) | Manifest + service worker générés |
| Scan code-barres | **@zxing/browser** | Safari iOS ne supporte PAS l'API native `BarcodeDetector` |
| Stockage local | **Dexie** (IndexedDB) | Liste de courses dispo hors ligne |
| Styles | **Tailwind CSS** | Rapide pour du mobile-first |
| Routing | **React Router** | Quelques écrans seulement |
| Tests | **Vitest** | Intégré à Vite |
| Hébergement | **Vercel** (ou Netlify) | Gratuit, HTTPS automatique |

**Pas de backend en V1** : l'app appelle directement l'API Open Food Facts depuis le navigateur. Un backend (Node + PostgreSQL) viendra plus tard, pour le cache et le crowdsourcing.

Ne pas ajouter de dépendance lourde sans le signaler et expliquer pourquoi.

---

## 📱 Contraintes iPhone / Safari (IMPORTANT)

- **HTTPS obligatoire** pour accéder à la caméra. En local, lancer Vite avec `--host` et utiliser un certificat (`@vitejs/plugin-basic-ssl`) pour tester sur l'iPhone via le Wi-Fi.
- **Pas de `BarcodeDetector`** sur Safari → toujours passer par ZXing.
- Caméra : utiliser la caméra arrière (`facingMode: "environment"`), et **arrêter proprement le flux** en quittant l'écran de scan (sinon la caméra reste allumée).
- La vidéo doit avoir `playsInline` et `muted`, sinon iOS l'ouvre en plein écran.
- PWA installée : le stockage peut être purgé par iOS si l'app n'est pas utilisée pendant longtemps. Prévoir un **export/import JSON** de la liste et des préférences.
- Prévoir les *safe areas* (encoche) : `viewport-fit=cover` + `env(safe-area-inset-*)`.
- Balises iOS dans `index.html` : `apple-mobile-web-app-capable`, `apple-touch-icon`, `theme-color`.
- **Mobile-first** : grosses zones tactiles (≥ 44px), utilisable à une main en magasin.

---

## 🌐 Source de données : Open Food Facts

API gratuite et ouverte. Documentation : https://openfoodfacts.github.io/openfoodfacts-server/api/

### Endpoints utiles
- **Produit par code-barres** :
  `GET https://world.openfoodfacts.org/api/v2/product/{barcode}?fields=code,product_name,brands,nova_group,nutriscore_grade,ingredients_text,additives_tags,stores_tags,image_front_small_url,categories_tags`
- **Recherche** (ex. alternatives peu transformées dans une catégorie et une enseigne) :
  `GET https://world.openfoodfacts.org/api/v2/search?categories_tags={cat}&nova_groups_tags=1&stores_tags={enseigne}&fields=...`

### Règles
- **Toujours** limiter les champs avec `fields=` (les réponses complètes sont énormes).
- Envoyer un **User-Agent identifiable** (ex. `CleanEating/0.1 (email@exemple.com)`), comme le demande Open Food Facts. Dans le navigateur, si le header n'est pas modifiable, le mettre dans un paramètre ou le prévoir pour le futur backend.
- **Respecter les limites de requêtes** (la recherche est bien plus limitée que la lecture d'un produit — vérifier les chiffres à jour dans la doc). Mettre les résultats **en cache** dans IndexedDB.
- Les données sont communautaires : **tout champ peut être absent**. Gérer `nova_group` manquant (afficher « Inconnu », ne pas planter).
- `stores_tags` est **incomplet** : ne jamais présenter la disponibilité en magasin comme une certitude. Formuler « vu chez… ».

### Groupes NOVA
1. Aliments bruts ou peu transformés (légumes, œufs, viande, lait, légumineuses)
2. Ingrédients culinaires (huile, beurre, sel, sucre)
3. Aliments transformés (pain de boulangerie, fromage, conserves simples)
4. Ultra-transformés (à éviter : additifs, arômes, émulsifiants, sirops…)

Code couleur conseillé : 1 = vert, 2 = vert clair, 3 = orange, 4 = rouge, inconnu = gris.

---

## 🧠 Logique métier clé

La liste de courses générée a **deux parties** :

1. **Produits bruts** (sans code-barres le plus souvent) : fruits et légumes **de saison**, œufs, viande/poisson à la coupe, pain de boulangerie, légumineuses et féculents en vrac. → Viennent d'une **liste statique locale** (fichier JSON dans le repo), avec un calendrier de saisonnalité par mois (France).
2. **Produits emballés** : pour chaque besoin (ex. « yaourt nature », « flocons d'avoine », « thon en conserve »), l'app propose la **meilleure option NOVA 1–2** trouvée pour l'enseigne choisie, avec repli sur NOVA 3 si rien de mieux, et jamais NOVA 4 sans avertissement.

### Scan en rayon
- Scanner → fiche produit (nom, image, NOVA, Nutri-Score, additifs).
- Si NOVA 3 ou 4 : proposer des **alternatives moins transformées** de la même catégorie, en priorité dans l'enseigne choisie.
- Bouton « Ajouter à la liste ».

---

## 🗂️ Structure du projet

```
src/
  api/            # Client Open Food Facts (fetch typé, cache)
  db/             # Dexie : schéma et accès IndexedDB
  data/           # JSON statiques : produits bruts, saisonnalité, enseignes
  features/
    list/         # Liste de courses (génération, cochage, export)
    scan/         # Scanner ZXing + fiche produit
    settings/     # Enseigne choisie, préférences
  components/     # UI réutilisable (NovaBadge, ProductCard…)
  hooks/
  types/          # Types TypeScript (Product, ShoppingItem…)
  utils/
```

### Modèle de données (indicatif)
```ts
type Product = {
  code: string;
  name: string;
  brand?: string;
  nova?: 1 | 2 | 3 | 4;
  nutriscore?: 'a' | 'b' | 'c' | 'd' | 'e';
  additives: string[];
  stores: string[];
  imageUrl?: string;
};

type ShoppingItem = {
  id: string;
  label: string;              // "Yaourt nature", "Courgettes"
  kind: 'raw' | 'packaged';
  product?: Product;          // pour les produits emballés
  quantity?: string;
  checked: boolean;
  createdAt: number;
};

type Settings = {
  store: string;              // tag OFF de l'enseigne, ex. "carrefour"
  maxNova: 1 | 2 | 3;
};
```

---

## 🗺️ Feuille de route

**Étape 0 — Setup**
- Vite + React + TS + Tailwind + vite-plugin-pwa
- Manifest, icônes, balises iOS
- HTTPS en local pour tester sur l'iPhone
- Déploiement Vercel

**Étape 1 — Scan**
- Écran scanner ZXing (caméra arrière, arrêt propre)
- Appel API produit + fiche avec badge NOVA
- Gestion des erreurs : produit introuvable, pas de réseau, caméra refusée

**Étape 2 — Liste de courses**
- Ajout manuel, cochage, suppression
- Persistance Dexie, fonctionne **hors ligne**
- Export/import JSON

**Étape 3 — Choix de l'enseigne**
- Écran réglages (liste d'enseignes françaises courantes)

**Étape 4 — Génération de liste**
- Produits bruts de saison depuis le JSON local
- Produits emballés : recherche des meilleures options NOVA par enseigne
- Cache des résultats

**Étape 5 — Alternatives**
- Depuis un produit NOVA 3–4, proposer des alternatives plus brutes

**Plus tard**
- Idées de recettes simples / mode batch cooking à partir de la liste
- Backend (Node + PostgreSQL) pour cache partagé et crowdsourcing (« j'ai vu ce produit dans ce magasin »)
- Éventuel passage à Expo / React Native en réutilisant `api/`, `types/` et la logique métier

---

## 📏 Conventions

- TypeScript **strict**, pas de `any` sans justification.
- Composants fonctionnels + hooks.
- Logique métier (scoring, génération de liste) dans des **fonctions pures testées** avec Vitest, séparées de l'UI.
- Textes de l'interface **en français**.
- Code, noms de variables et commits en anglais.
- Commits courts et clairs (style Conventional Commits : `feat:`, `fix:`, `chore:`…).
- Avancer **étape par étape** selon la feuille de route : ne pas tout coder d'un coup, proposer un plan avant une grosse fonctionnalité.

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
- `node_modules` contient des binaires Linux (esbuild, rolldown…) : ne pas lancer `npm install` côté Windows sur le même dossier.

## 🧪 Tester sur l'iPhone

1. `docker compose up -d` (HTTPS auto-signé + écoute réseau déjà configurés dans `vite.config.ts`).
2. Sur l'iPhone (même Wi-Fi), ouvrir `https://<IP du PC>:5173` dans Safari (l'IP affichée par Vite est celle du conteneur, pas la bonne ; prendre l'IP Wi-Fi du PC via `ipconfig`) et accepter le certificat.
3. Pour tester l'installation PWA et le hors ligne : déployer sur Vercel, puis *Partager → Sur l'écran d'accueil*.
