# Whole Cart

PWA mobile : tu saisis ta liste de courses (« yaourt », « thon », « pâtes »…) et, pour chaque article, l'app cherche sur [Open Food Facts](https://world.openfoodfacts.org) les références les moins industrielles et propose un top 3. Fini les comparaisons interminables en rayon.

Démarrage (Docker, pas besoin de Node sur la machine) :

```bash
docker compose run --rm app npm install
docker compose up -d
```

Puis ouvrir https://localhost:5173. Voir [CLAUDE.md](CLAUDE.md) pour le contexte, la feuille de route et toutes les commandes.
