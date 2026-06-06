# Patrimoine Bankin Exporter

Extension Chrome privee permettant d'exporter les donnees Bankin vers une application patrimoine.

## Important

Cette extension est non officielle et n'est pas affiliee a Bankin.
Elle est destinee a un usage prive.
Elle ne demande jamais les identifiants Bankin.
Elle fonctionne uniquement si l'utilisateur est deja connecte a Bankin Web.
Les headers Bankin restent stockes localement dans le navigateur et ne sont jamais envoyes a l'application patrimoine.

## Installation

1. Cloner le repo.
2. Installer les dependances avec `npm install`.
3. Construire l'extension avec `npm run build`.
4. Ouvrir `chrome://extensions`.
5. Activer le mode developpeur.
6. Cliquer sur `Charger l'extension non empaquetee`.
7. Selectionner le dossier `dist/`.
8. Ouvrir Bankin Web et se connecter.
9. Naviguer dans Bankin pour declencher la capture de session.
10. Cliquer sur l'extension.

## Utilisation

1. Ouvrir Bankin Web dans Chrome et se connecter normalement.
2. Ouvrir quelques pages de comptes ou transactions pour que Chrome capture les headers API.
3. Ouvrir le popup `Patrimoine Bankin Exporter`.
4. Tester la connexion.
5. Choisir une periode si besoin.
6. Previsualiser l'export pour verifier les volumes, la periode et les avertissements.
7. Exporter en JSON ou CSV.

Le JSON produit respecte le format `PatrimoineBankinExport`.
Avant telechargement ou import, l'extension valide localement les champs obligatoires, les liens comptes/categories et les doublons d'identifiants Bankin.
Les collisions de hash sont affichees comme avertissements, car plusieurs transactions reelles peuvent partager le meme compte, la meme date, le meme montant et le meme libelle.

## Parametres

L'ecran parametres permet de configurer :

- l'URL d'import de l'application patrimoine, par defaut `http://localhost:3000/api/import/bankin` ;
- la cle d'import utilisateur ;
- une date de debut par defaut.
- l'inclusion ou non des comptes sans transaction sur la periode ;
- l'affichage ou non du bouton CSV ;
- le mode diagnostic detaille.

La cle d'import sert uniquement a l'application patrimoine. Elle n'a aucun lien avec Bankin.
Le diagnostic detaille affiche uniquement la presence des headers et le dernier statut HTTP, jamais la valeur des headers Bankin.

## Developpement

Scripts disponibles :

- `npm run dev` : build Vite en mode watch ;
- `npm run build` : build de production dans `dist/` ;
- `npm run typecheck` : verification TypeScript ;
- `npm run lint` : lint du code TypeScript ;
- `npm run test` : tests unitaires ;
- `npm run zip` : genere une archive versionnee.

## Build

```bash
npm install
npm run build
```

Le dossier `dist/` est le dossier a charger dans Chrome.

## Maintenance Bankin

Si Bankin change ses endpoints ou headers, modifier :

- `src/bankin/endpoints.ts`
- `src/bankin/captureHeaders.ts`
- `src/bankin/bankinClient.ts`

## Notes Pécunio

Pecunio utilise `https://sync.bankin.com` avec les endpoints `/v2/accounts?limit=500`, `/v2/categories?limit=200` et `/v2/transactions?limit=500`, puis suit `pagination.next_uri`.
Les headers observes comme necessaires sont `Authorization`, `Bankin-Version`, `Client-Id` et `Client-Secret`.
Cette extension reprend uniquement ces idees d'integration et reconstruit une base minimaliste dediee a l'export patrimoine.
