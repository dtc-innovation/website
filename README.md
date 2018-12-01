# médialab Website

Ce dépôt de code contient tout le code source lié au [site web](https://medialab.sciencespo.fr) du laboratoire at à son CMS custom utilisé pour en administrer les données.

## Installation

Pour installer les dépendances du projet:

```
npm install
```

Pour ré-installer toutes les dépendances de zéro:

```
npm run reinstall
```

Pour réinitialiser la base de données avec des données de test:

```
npm run hydrate:json
```

Pour dumper les données de la base afin de les versionner:

```
npm run dump
```
