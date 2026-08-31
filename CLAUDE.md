# App Livraison

## Description
Application mobile de livraison développée avec React Native, Expo et TypeScript.

## Stack
- React Native + Expo SDK 57
- TypeScript (strict)
- Expo Router v4
- Supabase (Auth, Database, Storage)
- PostgreSQL via Supabase

## Architecture

```
app/                    # Écrans et navigation (Expo Router)
  (auth)/               # Écrans d'authentification
  (app)/                # Écrans principaux (protégés)
    (tabs)/             # Navigation par tabs
components/             # Composants UI réutilisables
  ui/                   # Composants de base (Button, Input, etc.)
lib/                    # Configuration Supabase et utilitaires
services/               # Communication avec Supabase
types/                  # Types TypeScript
constants/              # Constantes (couleurs, thème)
assets/                 # Images, icônes et ressources
```

## Principes
- Garder l'application simple
- Ne pas créer de fonctionnalités non demandées
- Ne pas ajouter de dépendances inutilement
- Privilégier les composants réutilisables
- TypeScript strict, pas de `any`
- Supabase pour auth, BDD et stockage
- Pas de backend séparé
- Pas de microservices

## Sécurité
- Jamais de clé secrète dans le mobile
- Clé publique Supabase uniquement côté client
- Jamais de service role key dans le mobile
- Valider les données utilisateur
- Utiliser les permissions Supabase/RLS

## Développement
```bash
npm start        # Démarrer le serveur de développement
npm run android  # Lancer sur Android
npm run ios      # Lancer sur iOS
npm run web      # Lancer sur le web
```

## Configuration Supabase
Remplacer les placeholders dans `lib/supabase.ts` :
- `SUPABASE_URL` : URL de votre projet Supabase
- `SUPABASE_ANON_KEY` : Clé publique (anon key)
